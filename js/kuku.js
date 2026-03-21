document.addEventListener("DOMContentLoaded", () => {
  /* =========================
     AUDIO ELEMENTS
  ========================= */
  const clickSound = document.getElementById("clickSound");
  const gameOverSound = document.getElementById("gameOverSound");

  /* =========================
     MENU PAGE (Difficulty Picker)
  ========================= */
  const diffRadios = document.querySelectorAll("input[name='difficulty']");
  const diffHint = document.getElementById("kukuHint");

  if (diffRadios.length && diffHint) {
    function updateDifficulty() {
      const selected = document.querySelector("input[name='difficulty']:checked");
      const value = selected.value;
      const label = value.charAt(0).toUpperCase() + value.slice(1);
      diffHint.innerHTML = `Difficulty: <b>${label}</b>`;
      sessionStorage.setItem("kukuDifficulty", value);
    }
    diffRadios.forEach(radio => radio.addEventListener("change", updateDifficulty));
    updateDifficulty();
  }

  /* =========================
     LAST 5 GAMES HISTORY
  ========================= */
  const kukuHistoryList = document.getElementById("kukuHistoryList");
  if (kukuHistoryList) {
    const history = JSON.parse(localStorage.getItem("kukuHistory")) || [];
    kukuHistoryList.innerHTML = history.map(game =>
      `<li>Difficulty: <b>${game.difficulty.toUpperCase()}</b> - Score: <b>${game.score}</b> (${game.date})</li>`
    ).join('');
  }

  /* =========================
     GAME PAGE
  ========================= */
  const board = document.getElementById("kukuBoard");
  if (!board) return;

  const scoreText = document.getElementById("score");
  const bestScoreText = document.getElementById("bestScore");
  const timeBar = document.getElementById("timeBar");
  const resultModal = document.getElementById("resultModal");
  const resultText = document.getElementById("resultText");
  const resultStats = document.getElementById("resultStats");

  /* =========================
     DIFFICULTY SETTINGS
  ========================= */
  const params = new URLSearchParams(window.location.search);
  const difficulty = params.get("difficulty") || sessionStorage.getItem("kukuDifficulty") || "easy";

  let colorDiff = 50;
  let timeLimit = 5000;
  if (difficulty === "easy") { colorDiff = 70; timeLimit = 6000; }
  else if (difficulty === "medium") { colorDiff = 50; timeLimit = 5000; }
  else if (difficulty === "hard") { colorDiff = 30; timeLimit = 3500; }

  const bestKey = `kukuBest_${difficulty}`;
  const lastKey = `kukuLast_${difficulty}`;

  /* =========================
     GAME VARIABLES
  ========================= */
  let score = 0;
  let bestScore = parseInt(localStorage.getItem(bestKey)) || 0;
  let lastScore = parseInt(localStorage.getItem(lastKey)) || "--";
  bestScoreText.textContent = `Best (${difficulty}): ${bestScore} | Last: ${lastScore}`;

  let gridSize = 2;
  let correctClicksAtCurrentGrid = 0;
  const clicksPerGrid = 5;
  let timer;
  let timeLeft = timeLimit;

  /* =========================
     SAVE / LOAD STATE
  ========================= */
  function saveGameState(boardState = null) {
    if (!boardState) {
      boardState = Array.from(board.children).map(cell => cell.style.background);
    }
    const state = { score, gridSize, correctClicksAtCurrentGrid, timeLeft, boardState };
    sessionStorage.setItem("kukuState", JSON.stringify(state));
  }

  function loadGameState() {
    const state = JSON.parse(sessionStorage.getItem("kukuState"));
    if (state) {
      score = state.score;
      gridSize = state.gridSize;
      correctClicksAtCurrentGrid = state.correctClicksAtCurrentGrid;
      timeLeft = state.timeLeft;
      updateScore();

      if (state.boardState && state.boardState.length) {
        board.innerHTML = "";
        board.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;

        state.boardState.forEach((color, i) => {
          const cell = document.createElement("div");
          cell.className = "kuku-cell";
          cell.style.background = color;

          cell.onclick = () => handleCellClick(i, state.boardState);
          board.appendChild(cell);
        });
        resetTimer();
      } else createLevel();

      return true;
    }
    return false;
  }

  /* =========================
     CELL CLICK HANDLER
  ========================= */
  function handleCellClick(index, boardState) {
    clickSound.currentTime = 0;
    clickSound.play();

    const baseColor = boardState.find(c => c !== board.children[index].style.background) || board.children[index].style.background;

    if (board.children[index].style.background !== baseColor) {
      score++;
      correctClicksAtCurrentGrid++;
      updateScore();
      increaseDifficulty();
      resetTimer();
      createLevel();
      saveGameState();
    } else gameOver();
  }

  /* =========================
     CREATE LEVEL
  ========================= */
  function createLevel() {
    board.innerHTML = "";
    board.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;

    const baseColor = randomColor();
    const oddColor = slightlyDifferentColor(baseColor);
    const oddIndex = Math.floor(Math.random() * gridSize * gridSize);

    for (let i = 0; i < gridSize * gridSize; i++) {
      const cell = document.createElement("div");
      cell.className = "kuku-cell";
      cell.style.background = (i === oddIndex ? oddColor : baseColor);
      cell.onclick = () => {
        clickSound.currentTime = 0;
        clickSound.play();

        if (i === oddIndex) {
          score++;
          correctClicksAtCurrentGrid++;
          updateScore();
          increaseDifficulty();
          resetTimer();
          createLevel();
          saveGameState();
        } else gameOver();
      };
      board.appendChild(cell);
    }
    resetTimer();
  }

  /* =========================
     UPDATE SCORE
  ========================= */
  function updateScore() {
    scoreText.textContent = `Score: ${score}`;
    if (score > bestScore) {
      bestScore = score;
      localStorage.setItem(bestKey, bestScore);
    }
    bestScoreText.textContent = `Best (${difficulty}): ${bestScore} | Last: ${lastScore}`;
  }

  function increaseDifficulty() {
    if (correctClicksAtCurrentGrid >= clicksPerGrid && gridSize < 6) {
      gridSize++;
      correctClicksAtCurrentGrid = 0;
    }
  }

  /* =========================
     TIMER
  ========================= */
  function resetTimer() {
    clearInterval(timer);
    timeLeft = timeLimit;
    timeBar.style.width = "100%";

    timer = setInterval(() => {
      timeLeft -= 100;
      timeBar.style.width = (timeLeft / timeLimit) * 100 + "%";
      if (timeLeft <= 0) { clearInterval(timer); gameOver(); }
      saveGameState();
    }, 100);
  }

  /* =========================
     GAME OVER
  ========================= */
  function gameOver() {
    clearInterval(timer);
    lastScore = score;
    localStorage.setItem(lastKey, lastScore);

    if (gameOverSound) { gameOverSound.currentTime = 0; gameOverSound.play(); }

    resultText.textContent = "Game Over";
    resultStats.textContent = `Difficulty: ${difficulty.toUpperCase()} | Score: ${score} | Best: ${bestScore}`;

    if (score === 0) resultText.style.color = "#ef4444";
    else if (score < bestScore) resultText.style.color = "#f59e0b";
    else resultText.style.color = "#22c55e";

    resultModal.style.display = "flex";
    sessionStorage.removeItem("kukuState");

    // Save last 5 games
    let history = JSON.parse(localStorage.getItem("kukuHistory")) || [];
    history.unshift({ date: new Date().toLocaleString(), score, difficulty });
    if (history.length > 5) history.pop();
    localStorage.setItem("kukuHistory", JSON.stringify(history));
  }

  /* =========================
     COLOR FUNCTIONS
  ========================= */
  function randomColor() {
    const r = Math.floor(Math.random() * 200);
    const g = Math.floor(Math.random() * 200);
    const b = Math.floor(Math.random() * 200);
    return `rgb(${r},${g},${b})`;
  }

  function slightlyDifferentColor(color) {
    const nums = color.match(/\d+/g).map(Number);
    return `rgb(${clamp(nums[0] + colorDiff)}, ${clamp(nums[1] + colorDiff)}, ${clamp(nums[2] + colorDiff)})`;
  }

  function clamp(v) { return Math.max(0, Math.min(255, v)); }

  /* =========================
     START GAME
  ========================= */
  if (!loadGameState()) createLevel();
});

/* =========================
   RESET GAME FUNCTION
========================= */
function reset() {
  sessionStorage.removeItem("kukuState");
  location.reload();
}

/* =========================
   GO TO MENU FUNCTION
========================= */
function goToMenu() {
  sessionStorage.removeItem("kukuState");
  window.location.replace("kuku.html");
}