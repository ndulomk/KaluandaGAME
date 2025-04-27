let timer = 60;
let timerId;

function rectangularCollision({ rectangle1, rectangle2 }) {
  return (
    rectangle1.attackBox.position.x + rectangle1.attackBox.width >= rectangle2.position.x &&
    rectangle1.attackBox.position.x <= rectangle2.position.x + rectangle2.width &&
    rectangle1.attackBox.position.y + rectangle1.attackBox.height >= rectangle2.position.y &&
    rectangle1.attackBox.position.y <= rectangle2.position.y + rectangle2.height
  );
}

function determineWinner({ player, enemy, timerId, animationId }) {
  clearTimeout(timerId);
  cancelAnimationFrame(animationId);
  const displayText = document.getElementById('displayText');
  const resultText = document.getElementById('resultText');
  displayText.style.display = 'flex';
  let res;
  if (player.health <= 0 && enemy.health <= 0) {
    res = 'Double K.O!';
  } else if (enemy.health <= 0) {
    res = 'Player 1 Wins Round';
    window.playerWins++;
  } else if (player.health <= 0) {
    res = 'Player 2 Wins Round';
    window.enemyWins++;
  } else if (player.health > enemy.health) {
    res = 'Player 1 Wins Round (Time)';
    window.playerWins++;
  } else if (enemy.health > player.health) {
    res = 'Player 2 Wins Round (Time)';
    window.enemyWins++;
  } else {
    res = 'Tie (Time)';
  }
  resultText.innerHTML = `${res}<br>Score P1 ${window.playerWins} - P2 ${window.enemyWins}`;
  const toWin = Math.ceil(window.maxRounds / 2);
  if (window.playerWins >= toWin || window.enemyWins >= toWin) {
    resultText.innerHTML += `<br>Final Winner: ${window.playerWins > window.enemyWins ? 'PLAYER 1' : 'PLAYER 2'}!`;
    document.getElementById('restartButton').style.display = 'block';
  } else {
    setTimeout(() => {
      displayText.style.display = 'none';
      resetGame();
    }, 3000);
  }
}

function decreaseTimer() {
  if (timer > 0 && window.player && !window.player.dead && window.enemy && !window.enemy.dead && document.getElementById('gameUI').style.display === 'block') {
    timer--;
    document.getElementById('timer').innerText = timer;
    timerId = setTimeout(decreaseTimer, 1000);
  } else if (timer === 0) {
    determineWinner({ player: window.player, enemy: window.enemy, timerId, animationId });
  }
}