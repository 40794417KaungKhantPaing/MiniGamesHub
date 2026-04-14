document.addEventListener("DOMContentLoaded", () => {

  /* =========================
     MENU PAGE LOGIC
     ========================= */
  class KukuMenu {
    constructor() {
      this.radios = document.querySelectorAll("input[name='difficulty']");
      this.diffHint = document.getElementById("kukuHint");
      this.historyList = document.getElementById("kukuHistoryList");
      this.selectedDifficulty = sessionStorage.getItem("kukuDifficulty") || "easy";

      this.initRadios();
      this.updateHint();
      this.displayHistory();
      this.initForm();
    }

    initRadios() {
      this.radios.forEach(radio => {
        radio.checked = radio.value === this.selectedDifficulty;
        radio.addEventListener("change", () => {
          this.selectedDifficulty = radio.value;
          sessionStorage.setItem("kukuDifficulty", this.selectedDifficulty);
          this.updateHint();
        });
      });
    }

    updateHint() {
      if (this.diffHint) {
        const label = this.selectedDifficulty.charAt(0).toUpperCase() + this.selectedDifficulty.slice(1);
        this.diffHint.innerHTML = `Difficulty: <b>${label}</b>`;
      }
    }

    displayHistory() {
      if (!this.historyList) return;
      let history = [];
      try {
        history = JSON.parse(localStorage.getItem("kukuHistory")) || [];
      } catch (e) {
        console.error("Invalid kukuHistory", e);
        history = [];
      }
      this.historyList.innerHTML = history.map(game =>
        `<li>Difficulty: <b>${game.difficulty.toUpperCase()}</b> - Score: <b>${game.score}</b> (${game.date})</li>`
      ).join('');
    }

    initForm() {
      const kukuForm = document.getElementById("kukuForm");
      if (!kukuForm) return;
      kukuForm.addEventListener("submit", (e) => {
        e.preventDefault();
        window.location.href = "kukuGame.html";
      });
    }
  }

  /* =========================
     GAME PAGE LOGIC
     ========================= */
  class KukuKube {
    constructor() {
      this.board = document.getElementById("kukuBoard");
      if (!this.board) return;

      this.scoreText = document.getElementById("score");
      this.bestScoreText = document.getElementById("bestScore");
      this.timeBar = document.getElementById("timeBar");
      this.resultModal = document.getElementById("resultModal");
      this.resultText = document.getElementById("resultText");
      this.resultStats = document.getElementById("resultStats");

      this.clickSound = document.getElementById("clickSound");
      this.gameOverSound = document.getElementById("gameOverSound");

      this.difficulty = sessionStorage.getItem("kukuDifficulty") || "easy";

      this.setupDifficulty();

      this.bestKey = `kukuBest_${this.difficulty}`;
      this.lastKey = `kukuLast_${this.difficulty}`;

      this.bestScore = parseInt(localStorage.getItem(this.bestKey)) || 0;
      this.lastScore = localStorage.getItem(this.lastKey) || "--";

      if (this.resultModal) {
        window.addEventListener("click", e => {
          if (e.target === this.resultModal) {
            this.resultModal.style.display = "none";
          }
        });
      }
    }

    setupDifficulty() {
      if (this.difficulty === "easy") { this.colorDiff = 70; this.timeLimit = 6000; }
      else if (this.difficulty === "medium") { this.colorDiff = 50; this.timeLimit = 5000; }
      else { this.colorDiff = 30; this.timeLimit = 3500; }
    }

    init() {
      this.updateScoreUI();
      if (!this.loadGameState()) this.initGame();
    }

    initGame() {
      this.score = 0;
      this.gridSize = 2;
      this.correctClicksAtCurrentGrid = 0;
      this.timeLeft = this.timeLimit;

      this.updateScoreUI();
      this.createLevel();
      this.saveGameState();
    }

    saveGameState() {
      const boardState = Array.from(this.board.children).map(cell => cell.style.background);
      const state = {
        score: this.score,
        gridSize: this.gridSize,
        correctClicksAtCurrentGrid: this.correctClicksAtCurrentGrid,
        timeLeft: this.timeLeft,
        boardState: boardState
      };
      try {
        sessionStorage.setItem("kukuState", JSON.stringify(state));
      } catch (e) {
        console.error("Failed to save game state", e);
      }
    }

    loadGameState() {
      let state;

      try {
        state = JSON.parse(sessionStorage.getItem("kukuState"));
      } catch (e) {
        console.error("Corrupted kukuState", e);
        sessionStorage.removeItem("kukuState");
        return false;
      }
      if (!state) return false;

      this.score = state.score;
      this.gridSize = state.gridSize;
      this.correctClicksAtCurrentGrid = state.correctClicksAtCurrentGrid;
      this.timeLeft = state.timeLeft;

      this.updateScoreUI();

      if (state.boardState && state.boardState.length > 0) {
        this.renderBoard(state.boardState);
        this.startTimer(true);
        return true;
      }
      return false;
    }

    createLevel() {
      const totalCells = this.gridSize * this.gridSize;
      const baseColor = this.randomColor();
      const oddColor = this.slightlyDifferentColor(baseColor);
      const oddIndex = Math.floor(Math.random() * totalCells);

      const colors = Array(totalCells).fill(baseColor);
      colors[oddIndex] = oddColor;

      this.renderBoard(colors, oddIndex);
      this.startTimer();
    }

    renderBoard(colors, oddIndex = -1) {
      this.board.innerHTML = "";
      this.board.style.gridTemplateColumns = `repeat(${this.gridSize}, 1fr)`;

      colors.forEach((color, i) => {
        const cell = document.createElement("div");
        cell.className = "kuku-cell";
        cell.style.background = color;
        cell.addEventListener("click", () => this.handleCellClick(i, colors, oddIndex));
        this.board.appendChild(cell);
      });
    }

    handleCellClick(index, colors, oddIndex) {
      if (this.clickSound) { this.clickSound.currentTime = 0; this.clickSound.play(); }

      const isCorrect = oddIndex > -1
        ? index === oddIndex
        : colors[index] !== this.getMostFrequentColor(colors);

      if (isCorrect) {
        this.score++;
        this.correctClicksAtCurrentGrid++;
        this.updateScoreUI();
        this.increaseDifficulty();
        this.createLevel();
        this.saveGameState();
      } else this.gameOver();
    }

    getMostFrequentColor(arr) {
      const counts = {};
      arr.forEach(c => counts[c] = (counts[c] || 0) + 1);
      return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
    }

    increaseDifficulty() {
      const clicksPerGrid = 5;
      if (this.correctClicksAtCurrentGrid >= clicksPerGrid && this.gridSize < 6) {
        this.gridSize++;
        this.correctClicksAtCurrentGrid = 0;
      }
    }

    startTimer(resume = false) {
      clearInterval(this.timer);
      if (!resume) this.timeLeft = this.timeLimit;
      this.updateTimeBar();

      this.timer = setInterval(() => {
        this.timeLeft -= 100;
        this.updateTimeBar();
        if (this.timeLeft <= 0) {
          clearInterval(this.timer);
          this.gameOver();
        }
      }, 100);
    }

    updateTimeBar() {
      if (this.timeBar) this.timeBar.style.width = (this.timeLeft / this.timeLimit) * 100 + "%";
    }

    updateScoreUI() {
      if (this.scoreText) this.scoreText.textContent = `Score: ${this.score}`;
      if (this.score > this.bestScore) {
        this.bestScore = this.score;
        localStorage.setItem(this.bestKey, this.bestScore);
      }
      if (this.bestScoreText) this.bestScoreText.textContent = `Best (${this.difficulty}): ${this.bestScore} | Last: ${this.lastScore}`;
    }

    gameOver() {
      clearInterval(this.timer);
      this.lastScore = this.score;
      localStorage.setItem(this.lastKey, this.lastScore);

      if (this.gameOverSound) { this.gameOverSound.currentTime = 0; this.gameOverSound.play(); }

      if (this.resultText) this.resultText.textContent = "Game Over";
      if (this.resultStats) this.resultStats.textContent = `Difficulty: ${this.difficulty.toUpperCase()} | Score: ${this.score} | Best: ${this.bestScore}`;
      if (this.resultModal) this.resultModal.style.display = "flex";

      sessionStorage.removeItem("kukuState");
      this.saveToHistory();
    }

    saveToHistory() {
      let history = [];
      try {
        history = JSON.parse(localStorage.getItem("kukuHistory")) || [];
      } catch {
        history = [];
      }
      history.unshift({ date: new Date().toLocaleString(), score: this.score, difficulty: this.difficulty });
      if (history.length > 5) history.pop();
      localStorage.setItem("kukuHistory", JSON.stringify(history));
    }

    randomColor() {
      const r = Math.floor(Math.random() * 200);
      const g = Math.floor(Math.random() * 200);
      const b = Math.floor(Math.random() * 200);
      return `rgb(${r},${g},${b})`;
    }

    slightlyDifferentColor(color) {
      const nums = color.match(/\d+/g).map(Number);
      const clamp = (v) => Math.max(0, Math.min(255, v));
      return `rgb(${clamp(nums[0] + this.colorDiff)}, ${clamp(nums[1] + this.colorDiff)}, ${clamp(nums[2] + this.colorDiff)})`;
    }

    reset() {
      sessionStorage.removeItem("kukuState");
      if (this.resultModal) this.resultModal.style.display = "none";
      this.initGame();
    }

    goToMenu() {
      sessionStorage.removeItem("kukuState");
      window.location.replace("kuku.html");
    }
  }

  // Initialize
  if (document.getElementById("kukuForm")) {
    new KukuMenu();
  }

  if (document.getElementById("kukuBoard")) {
    const game = new KukuKube();
    game.init();

    // Buttons
    window.reset = () => game.reset();
    window.goToMenu = () => game.goToMenu();
  }
});