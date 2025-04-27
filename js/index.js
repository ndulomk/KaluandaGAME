const canvas = document.querySelector('#gameCanvas');
const c = canvas.getContext('2d');
canvas.width = 1024;
canvas.height = 576;
const gravity = 0.7;
let selectedCharacter = null;
let player, enemy, background, shop;
let maxRounds = 3;
let animationId;
let lastEnemyAction = 0;
let lastPlayerJump = 0;

const characterData = {
  samuraiMack: {
    sprites: {
      idle: { imageSrc: './img/samuraiMack/Idle.png', framesMax: 8 },
      run: { imageSrc: './img/samuraiMack/Run.png', framesMax: 8 },
      jump: { imageSrc: './img/samuraiMack/Jump.png', framesMax: 2 },
      fall: { imageSrc: './img/samuraiMack/Fall.png', framesMax: 2 },
      attack1: { imageSrc: './img/samuraiMack/Attack1.png', framesMax: 6 },
      takeHit: { imageSrc: './img/samuraiMack/Take Hit - white silhouette.png', framesMax: 4 },
      death: { imageSrc: './img/samuraiMack/Death.png', framesMax: 6 }
    },
    scale: 2.5,
    offset: { x: 215, y: 157 },
    attackBox: { offset: { x: 100, y: 50 }, width: 160, height: 50 }
  },
  kenji: {
    sprites: {
      idle: { imageSrc: './img/kenji/Idle.png', framesMax: 4 },
      run: { imageSrc: './img/kenji/Run.png', framesMax: 8 },
      jump: { imageSrc: './img/kenji/Jump.png', framesMax: 2 },
      fall: { imageSrc: './img/kenji/Fall.png', framesMax: 2 },
      attack1: { imageSrc: './img/kenji/Attack1.png', framesMax: 4 },
      takeHit: { imageSrc: './img/kenji/Take hit.png', framesMax: 3 },
      death: { imageSrc: './img/kenji/Death.png', framesMax: 7 }
    },
    scale: 2.5,
    offset: { x: 215, y: 167 },
    attackBox: { offset: { x: -170, y: 50 }, width: 170, height: 50 }
  }
};

const keys = {
  a: { pressed: false },
  d: { pressed: false },
  ArrowRight: { pressed: false },
  ArrowLeft: { pressed: false }
};

function selectCharacter(charKey) {
  selectedCharacter = charKey;
  document.querySelectorAll('.character-portrait').forEach((p) => {
    p.classList.remove('selected');
    if (p.id.toLowerCase().includes(charKey.toLowerCase())) {
      p.classList.add('selected');
    }
  });
  document.getElementById('startButton').disabled = false;
}

function initializeUI() {
  document.getElementById('selectionScreen').style.display = 'flex';
  document.getElementById('gameUI').style.display = 'none';
  document.getElementById('displayText').style.display = 'none';
  document.getElementById('startButton').disabled = true;
  document.getElementById('restartButton').style.display = 'none';
  document.querySelectorAll('.character-portrait').forEach((p) => p.classList.remove('selected'));
  selectedCharacter = null;
  window.playerWins = 0;
  window.enemyWins = 0;
  background = new Sprite({ position: { x: 0, y: 0 }, imageSrc: './img/background.png' });
  shop = new Sprite({ position: { x: 600, y: 128 }, imageSrc: './img/shop.png', scale: 2.75, framesMax: 6 });
  cancelAnimationFrame(animationId);
}

function startGame() {
  if (!selectedCharacter || !characterData[selectedCharacter]) return;
  maxRounds = parseInt(document.getElementById('roundsInput').value, 10) || 3;
  window.maxRounds = maxRounds;
  document.getElementById('selectionScreen').style.display = 'none';
  document.getElementById('gameUI').style.display = 'block';
  document.getElementById('displayText').style.display = 'none';
  const playerDataConfig = characterData[selectedCharacter];
  const enemyCharKey = selectedCharacter === 'samuraiMack' ? 'kenji' : 'samuraiMack';
  const enemyDataConfig = characterData[enemyCharKey];
  player = new Fighter({
    position: { x: 100, y: canvas.height - 96 - 150 + playerDataConfig.offset.y },
    velocity: { x: 0, y: 0 },
    scale: playerDataConfig.scale,
    sprites: playerDataConfig.sprites,
    attackBox: playerDataConfig.attackBox,
    offset: playerDataConfig.offset,
    imageSrc: playerDataConfig.sprites.idle.imageSrc,
    framesMax: playerDataConfig.sprites.idle.framesMax
  });
  window.player = player;
  enemy = new Fighter({
    position: { x: canvas.width - 250, y: canvas.height - 96 - 150 + enemyDataConfig.offset.y },
    velocity: { x: 0, y: 0 },
    color: 'blue',
    scale: enemyDataConfig.scale,
    sprites: enemyDataConfig.sprites,
    attackBox: enemyDataConfig.attackBox,
    offset: enemyDataConfig.offset,
    imageSrc: enemyDataConfig.sprites.idle.imageSrc,
    framesMax: enemyDataConfig.sprites.idle.framesMax
  });
  window.enemy = enemy;
  resetGame();
}

function resetGame() {
  if (!player || !enemy) return;
  player.health = 100;
  enemy.health = 100;
  document.getElementById('playerHealth').style.width = '100%';
  document.getElementById('enemyHealth').style.width = '100%';
  player.position.x = 100;
  player.position.y = canvas.height - 96 - 150 + player.offset.y;
  enemy.position.x = canvas.width - 250;
  enemy.position.y = canvas.height - 96 - 150 + enemy.offset.y;
  player.velocity = { x: 0, y: 0 };
  enemy.velocity = { x: 0, y: 0 };
  player.dead = false;
  enemy.dead = false;
  player.isAttacking = false;
  enemy.isAttacking = false;
  player.framesCurrent = 0;
  enemy.framesCurrent = 0;
  player.framesElapsed = 0;
  enemy.framesElapsed = 0;
  player.image = player.sprites.idle.image;
  enemy.image = enemy.sprites.idle.image;
  player.framesMax = player.sprites.idle.framesMax;
  enemy.framesMax = enemy.sprites.idle.framesMax;
  player.switchSprite('idle');
  enemy.switchSprite('idle');
  timer = 60;
  document.getElementById('timer').innerText = timer;
  lastEnemyAction = 0;
  lastPlayerJump = 0;
  clearTimeout(timerId);
  cancelAnimationFrame(animationId);
  decreaseTimer();
  animate();
}

function animate() {
  animationId = requestAnimationFrame(animate);
  c.fillStyle = 'black';
  c.fillRect(0, 0, canvas.width, canvas.height);
  background.update();
  shop.update();
  c.fillStyle = 'rgba(255, 255, 255, 0.15)';
  c.fillRect(0, 0, canvas.width, canvas.height);
  player.update();
  enemy.update();
  player.velocity.x = 0;
  if (keys.a.pressed && player.lastKey === 'a') {
    player.velocity.x = -5;
    player.switchSprite('run');
  } else if (keys.d.pressed && player.lastKey === 'd') {
    player.velocity.x = 5;
    player.switchSprite('run');
  } else {
    player.switchSprite('idle');
  }
  if (player.velocity.y < 0) {
    player.switchSprite('jump');
    lastPlayerJump = Date.now();
  } else if (player.velocity.y > 0) {
    player.switchSprite('fall');
  }
  if (!enemy.dead) {
    if (keys.ArrowLeft.pressed && enemy.lastKey === 'ArrowLeft') {
      enemy.velocity.x = -7;
      enemy.switchSprite('run');
    } else if (keys.ArrowRight.pressed && enemy.lastKey === 'ArrowRight') {
      enemy.velocity.x = 7;
      enemy.switchSprite('run');
    } else {
      const distance = Math.abs(player.position.x - enemy.position.x);
      const now = Date.now();
      if (distance > 150) {
        enemy.velocity.x = player.position.x < enemy.position.x ? -7 : 7;
        enemy.switchSprite('run');
        enemy.lastKey = player.position.x < enemy.position.x ? 'ArrowLeft' : 'ArrowRight';
      } else if (distance < 150 && enemy.velocity.y === 0 && now - lastEnemyAction > 500 && Math.random() < 0.05) {
        enemy.attack();
        lastEnemyAction = now;
      } else if (now - lastEnemyAction > 2000 + Math.random() * 3000 && enemy.velocity.y === 0 && Math.random() < 0.005) {
        enemy.velocity.y = -20;
        lastEnemyAction = now;
      } else if (lastPlayerJump && now - lastPlayerJump < 300 && enemy.velocity.y === 0 && Math.random() < 0.9) {
        enemy.velocity.y = -20;
        lastEnemyAction = now;
      } else {
        enemy.velocity.x = 0;
        enemy.switchSprite('idle');
      }
    }
  } else {
    enemy.velocity.x = 0;
  }
  if (enemy.velocity.y < 0) {
    enemy.switchSprite('jump');
  } else if (enemy.velocity.y > 0) {
    enemy.switchSprite('fall');
  }
  if (rectangularCollision({ rectangle1: player, rectangle2: enemy }) && player.isAttacking && player.framesCurrent === 4) {
    enemy.takeHit();
    player.isAttacking = false;
    document.getElementById('enemyHealth').style.width = enemy.health + '%';
  }
  if (player.isAttacking && player.framesCurrent === 4) {
    player.isAttacking = false;
  }
  if (rectangularCollision({ rectangle1: enemy, rectangle2: player }) && enemy.isAttacking && enemy.framesCurrent === 2) {
    player.takeHit();
    enemy.isAttacking = false;
    document.getElementById('playerHealth').style.width = player.health + '%';
  }
  if (enemy.isAttacking && enemy.framesCurrent === 2) {
    enemy.isAttacking = false;
  }
  if (enemy.health <= 0 || player.health <= 0) {
    determineWinner({ player, enemy, timerId, animationId });
  }
}

window.addEventListener('keydown', (event) => {
  if (!player.dead) {
    switch (event.key) {
      case 'd':
        keys.d.pressed = true;
        player.lastKey = 'd';
        break;
      case 'a':
        keys.a.pressed = true;
        player.lastKey = 'a';
        break;
      case 'w':
        player.velocity.y = -20;
        break;
      case ' ':
        player.attack();
        break;
    }
  }
  if (!enemy.dead) {
    switch (event.key) {
      case 'ArrowRight':
        keys.ArrowRight.pressed = true;
        enemy.lastKey = 'ArrowRight';
        break;
      case 'ArrowLeft':
        keys.ArrowLeft.pressed = true;
        enemy.lastKey = 'ArrowLeft';
        break;
      case 'ArrowUp':
        enemy.velocity.y = -20;
        break;
      case 'ArrowDown':
        enemy.attack();
        break;
    }
  }
});

window.addEventListener('keyup', (event) => {
  switch (event.key) {
    case 'd':
      keys.d.pressed = false;
      break;
    case 'a':
      keys.d.pressed = false;
      break;
    case 'ArrowRight':
      keys.ArrowRight.pressed = false;
      break;
    case 'ArrowLeft':
      keys.ArrowLeft.pressed = false;
      break;
  }
});

function drawPortrait(character, canvasId) {
  const portraitCanvas = document.getElementById(canvasId);
  const ctx = portraitCanvas.getContext('2d');
  const portraitSprite = new Sprite({
    position: { x: 50, y: 50 },
    imageSrc: character.sprites.idle.imageSrc,
    scale: 1.5,
    framesMax: character.sprites.idle.framesMax,
    offset: character.offset
  });
  function animatePortrait() {
    ctx.clearRect(0, 0, portraitCanvas.width, portraitCanvas.height);
    portraitSprite.update();
    requestAnimationFrame(animatePortrait);
  }
  animatePortrait();
}

document.getElementById('samuraiMackPortrait').addEventListener('click', () => selectCharacter('samuraiMack'));
document.getElementById('kenjiPortrait').addEventListener('click', () => selectCharacter('kenji'));
document.getElementById('startButton').addEventListener('click', startGame);
document.getElementById('restartButton').addEventListener('click', initializeUI);

drawPortrait(characterData.samuraiMack, 'samuraiMackCanvas');
drawPortrait(characterData.kenji, 'kenjiCanvas');
initializeUI();