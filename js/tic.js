document.addEventListener("DOMContentLoaded", () => {

  /* =================================
      MENU PAGE LOGIC
      ================================= */
  class TicMenu {
    constructor() {
      this.radios = document.querySelectorAll("input[name='side']");
      this.selectedHint = document.getElementById("selectedHint");
      this.historyList = document.getElementById("historyList");
      this.selectedSide = sessionStorage.getItem("ticSide") || "X";

      this.initRadios();
      this.updateHint();
      this.displayHistory();
      this.initForm();

    }

    initRadios() {
      this.radios.forEach(radio => {
        radio.checked = radio.value === this.selectedSide;
        radio.addEventListener("change", () => {
          this.selectedSide = radio.value;
          sessionStorage.setItem("ticSide", this.selectedSide);
          sessionStorage.removeItem("ticState");
          this.updateHint();
        });
      });
    }

    updateHint() {
      if (this.selectedHint) {
        this.selectedHint.innerHTML = `Playing as: <b>${this.selectedSide}</b>`;
      }
    }

    displayHistory() {
      if (!this.historyList) return;

      let history = [];
      try {
        history = JSON.parse(localStorage.getItem("ticHistory")) || [];
      } catch (e) {
        console.error("Invalid ticHistory data", e);
        history = [];
      }

      this.historyList.innerHTML = history.map(game =>
        `<li><b>${game.result}</b> (${game.player}) - ${game.date}</li>`
      ).join('');
    }

    initForm() {
      const ticForm = document.getElementById("ticForm");
      if (!ticForm) return;
      ticForm.addEventListener("submit", (e) => {
        e.preventDefault();
        window.location.href = "ticGame.html";
      });
    }
  }

  /* =================================
      GAME PAGE
     ================================= */


  class TicTacToe {

    static WIN_COMBOS = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    constructor() {

      this.boardElement = document.getElementById("board");

      // DOM Elements
      this.statusText = document.getElementById("status");
      this.scoreText = document.getElementById("score");
      this.resultModal = document.getElementById("resultModal");
      this.resultText = document.getElementById("resultText");
      this.resultStats = document.getElementById("resultStats");

      // Audio
      this.sounds = {
        click: document.getElementById("clickSound"),
        win: document.getElementById("winSound"),
        draw: document.getElementById("drawSound"),
        lose: document.getElementById("loseSound")
      };

      // Game State
      this.userSymbol = sessionStorage.getItem("ticSide") || "X";
      this.computerSymbol = this.userSymbol === "X" ? "O" : "X";
      this.cells = Array(9).fill("");
      this.currentTurn = "";

      if (this.resultModal) {
        window.addEventListener("click", e => {
          if (e.target === this.resultModal) {
            this.resultModal.style.display = "none";
          }
        });
      }

    }

    /* =========================
        BOARD CREATION
    ========================= */
    createBoard() {
      this.boardElement.innerHTML = "";
      this.cellElements = [];

      for (let i = 0; i < 9; i++) {
        const cell = document.createElement("div");
        cell.className = "cell";
        cell.setAttribute("role", "gridcell");

        cell.addEventListener("click", () => {
          if (this.currentTurn === "Human") this.playerMove(i);
        });

        this.boardElement.appendChild(cell);
        this.cellElements.push(cell);
      }
    }

    /* =========================
        INIT & LOAD
    ========================= */
    init() {
      this.createBoard();

      this.cells = Array(9).fill("");
      if (this.resultModal) this.resultModal.style.display = "none";
      this.boardElement.style.pointerEvents = "auto";

      if (!this.loadGameState()) {
        const lastStarter = localStorage.getItem("lastStarter") || "Computer";
        this.currentTurn = lastStarter === "Human" ? "Computer" : "Human";
        localStorage.setItem("lastStarter", this.currentTurn);

        this.saveGameState();
        this.updateStatus();

        if (this.currentTurn === "Computer") {
          setTimeout(() => this.executeComputerMove(), 600);
        }
      }

      this.updateScoreDisplay();
    }


    saveGameState() {
      try {
        const state = {
          cells: this.cells,
          currentTurn: this.currentTurn
        };
        sessionStorage.setItem("ticState", JSON.stringify(state));
      } catch (e) {
        console.error("Failed to save game state", e);
      }
    }
    loadGameState() {
      let state;

      try {
        state = JSON.parse(sessionStorage.getItem("ticState"));
      } catch (e) {
        console.error("Corrupted save data", e);
        sessionStorage.removeItem("ticState");
        return false;
      }

      if (!state) return false;

      this.cells = state.cells || Array(9).fill("");
      this.currentTurn = state.currentTurn || "Human";

      this.render();
      this.updateStatus();

      if (!this.isGameOver() && this.currentTurn === "Computer") {
        setTimeout(() => this.executeComputerMove(), 600);
      }

      return true;
    }
    /* =========================
        GAMEPLAY
    ========================= */
    render() {
      this.cellElements.forEach((cell, i) => {
        cell.textContent = this.cells[i];
        cell.style.color = this.cells[i] === "X" ? "#ef4444" : "#3b82f6";
      });
    }


    updateStatus() {
      if (this.isGameOver()) return;
      this.statusText.textContent = this.currentTurn === "Human" ? "Your Turn" : "Computer is thinking...";
    }

    makeMove(i, symbol) {
      if (this.cells[i] !== "") return false;

      this.cells[i] = symbol;
      this.render();
      this.playSound(this.sounds.click);
      this.saveGameState();
      return true;
    }

    /* =========================
     MOVES
 ========================= */
    playerMove(i) {
      if (this.cells[i] !== "" || this.isGameOver() || this.currentTurn !== "Human") return;

      // 1. Make the move
      this.makeMove(i, this.userSymbol);

      // 2. Check for end
      if (this.checkWin(this.userSymbol)) return this.endGame("You Win!", true);
      if (this.cells.every(c => c !== "")) return this.endGame("It's a Draw!", null);

      // 3. Switch turn and SAVE before computer moves
      this.currentTurn = "Computer";
      this.updateStatus();
      this.saveGameState();

      // 4. Trigger computer
      setTimeout(() => this.executeComputerMove(), 600);
    }

    executeComputerMove() {
      if (this.isGameOver() || this.currentTurn !== "Computer") return;

      const moveIndex = this.calculateBestMove();
      if (moveIndex === null) return;

      // 1. Make the move
      this.makeMove(moveIndex, this.computerSymbol);

      // 2. Check for end
      if (this.checkWin(this.computerSymbol)) return this.endGame("Computer Wins!", false);
      if (this.cells.every(c => c !== "")) return this.endGame("It's a Draw!", null);

      // 3. Switch back to human and SAVE
      this.currentTurn = "Human";
      this.updateStatus();
      this.saveGameState();
    }

    /* =========================
        LOGIC & AI
    ========================= */
    checkWin(player) {
      // Loop over each winning combination
      for (let i = 0; i < TicTacToe.WIN_COMBOS.length; i++) {
        let combo = TicTacToe.WIN_COMBOS[i];
        let a = combo[0];
        let b = combo[1];
        let c = combo[2];

        // Check if all three cells in this combo match the player
        if (this.cells[a] === player && this.cells[b] === player && this.cells[c] === player) {
          return true; // player wins
        }
      }
      return false; // no winning combo found
    }

    isGameOver() {
      return this.checkWin(this.userSymbol) || this.checkWin(this.computerSymbol) || this.cells.every(c => c !== "");
    }

    calculateBestMove() {
      return this.findWinningMove(this.computerSymbol) ??
        this.findWinningMove(this.userSymbol) ??
        this.randomMove();
    }

    findWinningMove(player) {
      // Loop over each winning combination
      for (let i = 0; i < TicTacToe.WIN_COMBOS.length; i++) {
        let combo = TicTacToe.WIN_COMBOS[i];
        let a = combo[0];
        let b = combo[1];
        let c = combo[2];

        // Count how many cells are already the player's symbol
        let count = 0;
        if (this.cells[a] === player) count++;
        if (this.cells[b] === player) count++;
        if (this.cells[c] === player) count++;

        // Check if one cell is empty and the other two are the player's
        if (count === 2) {
          if (this.cells[a] === "") return a;
          if (this.cells[b] === "") return b;
          if (this.cells[c] === "") return c;
        }
      }
      return null; // no winning move found
    }

    randomMove() {
      // Create an array to hold empty cell indexes
      let empty = [];

      // Loop over all cells
      for (let i = 0; i < this.cells.length; i++) {
        if (this.cells[i] === "") {
          empty.push(i); // store the index of empty cells
        }
      }

      // If there are no empty cells, return null
      if (empty.length === 0) {
        return null;
      }

      // Pick a random index from the empty array
      let randomIndex = Math.floor(Math.random() * empty.length);
      return empty[randomIndex];
    }

    /* =========================
        END GAME & STATS
    ========================= */
    endGame(msg, playerWon) {
      this.statusText.textContent = msg;
      this.boardElement.style.pointerEvents = "none";
      sessionStorage.removeItem("ticState");

      // Update Local Stats
      const stats = JSON.parse(localStorage.getItem("ticStats")) || { win: 0, lose: 0, draw: 0, played: 0 };
      if (playerWon === true) {
        stats.win++;
        this.playSound(this.sounds.win);
      } else if (playerWon === false) {
        stats.lose++;
        this.playSound(this.sounds.lose);
      } else {
        stats.draw++;
        this.playSound(this.sounds.draw);
      }
      stats.played++;
      localStorage.setItem("ticStats", JSON.stringify(stats));

      // Update History
      let history = [];
      try {
        history = JSON.parse(localStorage.getItem("ticHistory")) || [];
      } catch {
        history = [];
      }
      history.unshift({ date: new Date().toLocaleString(), result: msg, player: this.userSymbol });
      if (history.length > 5) history.pop();
      localStorage.setItem("ticHistory", JSON.stringify(history));

      this.updateScoreDisplay(stats);
      this.showModal(msg, playerWon, stats);
    }

    showModal(msg, playerWon, stats) {
      this.resultText.textContent = msg;
      this.resultText.style.color = playerWon === true ? "#22c55e" : playerWon === false ? "#ef4444" : "#f59e0b";

      const winRate = stats.played === 0 ? 0 : ((stats.win / stats.played) * 100).toFixed(1);
      this.resultStats.textContent = `Wins: ${stats.win} | Losses: ${stats.lose} | Draws: ${stats.draw} | Win Rate: ${winRate}%`;

      this.resultModal.style.display = "flex";
    }

    updateScoreDisplay(stats = JSON.parse(localStorage.getItem("ticStats")) || { win: 0, lose: 0, draw: 0, played: 0 }) {
      const winRate = stats.played === 0 ? 0 : ((stats.win / stats.played) * 100).toFixed(1);
      this.scoreText.textContent = `Wins: ${stats.win} | Losses: ${stats.lose} | Draws: ${stats.draw} | Win Rate: ${winRate}%`;
    }

    playSound(sound) {
      if (sound) {
        sound.currentTime = 0;
        sound.play();
      }
    }

    reset() {
      sessionStorage.removeItem("ticState");
      if (this.resultModal) this.resultModal.style.display = "none";
      this.init();
    }

    goToMenu() {
      sessionStorage.removeItem("ticState");
      window.location.replace("tic.html");
    }
  }

  /* =================================
       INITIALIZATION
       ================================= */
  if (document.getElementById("ticForm")) {
    new TicMenu();
  }

  if (document.getElementById("board")) {
    const game = new TicTacToe();
    game.init();

    window.reset = () => game.reset();
    window.goToMenu = () => game.goToMenu();
  }
});