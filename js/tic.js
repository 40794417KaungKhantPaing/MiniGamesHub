document.addEventListener("DOMContentLoaded", () => {

  // =============================
  // SIDE PICKER (tic.html)
  // =============================
  const pickX = document.getElementById("pickX");
  const pickO = document.getElementById("pickO");
  const hint = document.getElementById("selectedHint");

  if (pickX && pickO && hint) {
    function updateSide() {
      const side = pickX.checked ? "X" : "O";
      hint.innerHTML = `Playing as: <b>${side}</b>`;
      localStorage.setItem("userSymbol", side);
    }

    pickX.addEventListener("change", updateSide);
    pickO.addEventListener("change", updateSide);
    updateSide(); // initialize
  }
  // ====== Populate last 5 games history ======
  const historyList = document.getElementById("historyList");
  if (historyList) {
    const history = JSON.parse(localStorage.getItem("ticHistory")) || [];
    historyList.innerHTML = history.map(game =>
      `<li><b>${game.result}</b> (${game.player}) - ${game.date}</li>`
    ).join('');
  }


  // =============================
  // GAME PAGE (ticGame.html)
  // =============================
  const board = document.getElementById("board");
  if (!board) return; // stop if not on game page

  const clickSound = document.getElementById("clickSound");
  const winSound = document.getElementById("winSound");
  const drawSound = document.getElementById("drawSound");
  const loseSound = document.getElementById("loseSound");

  const resultModal = document.getElementById("resultModal");
  const resultText = document.getElementById("resultText");
  const resultStats = document.getElementById("resultStats");
  const statusText = document.getElementById("status");
  const scoreText = document.getElementById("score");
  const cellElements = document.querySelectorAll(".cell");

  // -----------------------------
  // Game Variables
  // -----------------------------
  let cells = Array(9).fill("");
  let userSymbol = localStorage.getItem("userSymbol") || "X";
  let computerSymbol = userSymbol === "X" ? "O" : "X";
  let currentTurn;

  // -----------------------------
  // Session Storage Functions
  // -----------------------------
  function saveGameState() {
    sessionStorage.setItem("ticCells", JSON.stringify(cells));
    sessionStorage.setItem("ticCurrentTurn", currentTurn);
    sessionStorage.setItem("ticLastMoveBy", currentTurn === "Human" ? "Human" : "Computer");
  }

  function loadGameState() {
    const savedCells = JSON.parse(sessionStorage.getItem("ticCells"));
    const savedTurn = sessionStorage.getItem("ticCurrentTurn");
    const savedLastMoveBy = sessionStorage.getItem("ticLastMoveBy");

    if (savedCells && savedTurn) {
      cells = savedCells;
      currentTurn = savedLastMoveBy === "Computer" ? "Human" : "Computer";

      cellElements.forEach((cell, i) => {
        cell.textContent = cells[i];
        cell.style.color = cells[i] === "X" ? "#ef4444" : "#3b82f6";
      });

      if (!isGameOver()) board.style.pointerEvents = "auto";

      if (currentTurn === "Computer" && cells.includes("")) {
        statusText.textContent = "Computer is thinking...";
        setTimeout(executeComputerMove, 600);
      } else {
        statusText.textContent = "Your Turn";
      }
      return true;
    }
    return false;
  }

  // -----------------------------
  // Score Display
  // -----------------------------
  function getStats() {
    return JSON.parse(localStorage.getItem("ticStats")) || {
      win: 0,
      lose: 0,
      draw: 0,
      played: 0,
      lastPlayed: null,
      lastResult: null
    };
  }

  function updateScoreDisplay(stats = getStats()) {
    const totalGames = stats.win + stats.lose + stats.draw;
    const winRate = totalGames === 0 ? 0 : ((stats.win / totalGames) * 100).toFixed(1);
    scoreText.textContent = `Wins: ${stats.win} | Losses: ${stats.lose} | Draws: ${stats.draw} | Win Rate: ${winRate}%`;
  }

  // -----------------------------
  // Initialize Game
  // -----------------------------
  function init() {
    const lastStarter = localStorage.getItem("lastStarter") || "Computer";
    currentTurn = lastStarter === "Human" ? "Computer" : "Human";
    localStorage.setItem("lastStarter", currentTurn);

    if (!loadGameState()) {
      cells = Array(9).fill("");
      cellElements.forEach(cell => cell.textContent = "");
      statusText.textContent = currentTurn === "Human" ? "Your Turn" : "Computer is thinking...";
      if (currentTurn === "Computer") setTimeout(executeComputerMove, 600);
    }

    cellElements.forEach((cell, i) => {
      cell.onclick = () => {
        if (currentTurn === "Human") playerMove(i, cell);
      };
    });

    updateScoreDisplay();
  }

  // -----------------------------
  // Player Move
  // -----------------------------
  function playerMove(i, cell) {
    if (cells[i] !== "" || isGameOver()) return;

    makeMove(i, userSymbol, cell);

    if (checkWin(userSymbol)) return endGame("You Win!", true);
    if (cells.every(c => c !== "")) return endGame("It's a Draw!", null);

    currentTurn = "Computer";
    statusText.textContent = "Computer is thinking...";
    setTimeout(executeComputerMove, 600);
  }

  // -----------------------------
  // Computer Move
  // -----------------------------
  function executeComputerMove() {
    if (isGameOver()) return;

    const moveIndex = computerMove();
    if (moveIndex === null) return;

    makeMove(moveIndex, computerSymbol, cellElements[moveIndex]);

    if (checkWin(computerSymbol)) return endGame("Computer Wins!", false);
    if (cells.every(c => c !== "")) return endGame("It's a Draw!", null);

    currentTurn = "Human";
    statusText.textContent = "Your Turn";
  }

  // -----------------------------
  // Make Move
  // -----------------------------
  function makeMove(i, symbol, cell) {
    cells[i] = symbol;
    cell.textContent = symbol;
    cell.style.color = symbol === "X" ? "#ef4444" : "#3b82f6";

    if (clickSound) { clickSound.currentTime = 0; clickSound.play(); }

    saveGameState();
  }

  // -----------------------------
  // Game Logic
  // -----------------------------
  function checkWin(player) {
    const wins = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    return wins.some(combo => combo.every(i => cells[i] === player));
  }

  function isGameOver() {
    return checkWin(userSymbol) || checkWin(computerSymbol);
  }

  // -----------------------------
  // Computer AI
  // -----------------------------
  function computerMove() {
    return findWinningMove(computerSymbol) ?? findWinningMove(userSymbol) ?? randomMove();
  }

  function randomMove() {
    const empty = cells.map((v, i) => v === "" ? i : null).filter(v => v !== null);
    return empty.length ? empty[Math.floor(Math.random() * empty.length)] : null;
  }

  function findWinningMove(player) {
    const wins = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    for (let [a, b, c] of wins) {
      const vals = [cells[a], cells[b], cells[c]];
      if (vals.filter(v => v === player).length === 2 && vals.includes("")) {
        return [a, b, c][vals.indexOf("")];
      }
    }
    return null;
  }

  // -----------------------------
  // End Game
  // -----------------------------
  function endGame(msg, playerWon) {
    statusText.textContent = msg;
    board.style.pointerEvents = "none";

    // CLEAR SAVED GAME STATE
    sessionStorage.removeItem("ticCells");
    sessionStorage.removeItem("ticCurrentTurn");
    sessionStorage.removeItem("ticLastMoveBy");

    // Save stats in one JSON object
    const stats = getStats();
    if (playerWon === true) stats.win++;
    else if (playerWon === false) stats.lose++;
    else if (playerWon === null) stats.draw++;

    stats.played++;
    stats.lastPlayed = new Date().toLocaleString();
    stats.lastResult = msg;

    localStorage.setItem("ticStats", JSON.stringify(stats));

    // Save to last 5 games
    let history = JSON.parse(localStorage.getItem("ticHistory")) || [];
    history.unshift({
      date: new Date().toLocaleString(),
      result: msg,
      player: userSymbol
    });
    if (history.length > 5) history.pop(); // keep only last 5
    localStorage.setItem("ticHistory", JSON.stringify(history));

    updateScoreDisplay(stats);

    // Update result text and color
    resultText.textContent = msg;

    // Set color based on outcome
    if (playerWon === true) {
      resultText.style.color = "#22c55e"; // green for win
      if (winSound) { winSound.currentTime = 0; winSound.play(); }
    } else if (playerWon === false) {
      resultText.style.color = "#ef4444"; // red for lose
      if (loseSound) { loseSound.currentTime = 0; loseSound.play(); }
    } else if (playerWon === null) {
      resultText.style.color = "#f59e0b"; // yellow/orange for draw
      if (drawSound) { drawSound.currentTime = 0; drawSound.play(); }
    }

    const totalGames = stats.win + stats.lose + stats.draw;
    const winRate = totalGames === 0 ? 0 : ((stats.win / totalGames) * 100).toFixed(1);
    resultStats.textContent = `Wins: ${stats.win} | Losses: ${stats.lose} | Draws: ${stats.draw} | Win Rate: ${winRate}%`;

    resultModal.style.display = "flex";
  }

  // -----------------------------
  // Start Game
  // -----------------------------
  init();
});

// -----------------------------
// Reset / Go to Menu
// -----------------------------
function reset() {
  sessionStorage.removeItem("ticCells");
  sessionStorage.removeItem("ticCurrentTurn");
  sessionStorage.removeItem("ticLastMoveBy");
  location.reload();
}

function goToMenu() {
  sessionStorage.removeItem("ticCells");
  sessionStorage.removeItem("ticCurrentTurn");
  sessionStorage.removeItem("ticLastMoveBy");
  window.location.replace('tic.html');
}