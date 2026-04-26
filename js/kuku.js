// Wait until the DOM is fully loaded before running any code
document.addEventListener("DOMContentLoaded", () => {

  /* =========================
     MENU PAGE LOGIC
     ========================= */
  class KukuMenu {
    constructor() {
      // Select difficulty radio buttons and UI elements
      this.radios = document.querySelectorAll("input[name='difficulty']");
      this.diffHint = document.getElementById("kukuHint");
      this.historyList = document.getElementById("kukuHistoryList");

      // Load saved difficulty or default to "easy"
      this.selectedDifficulty = sessionStorage.getItem("kukuDifficulty") || "easy";

      // Initialize menu features
      this.initRadios();
      this.updateHint();
      this.displayHistory();
      this.initForm();
    }

    // Initialize radio buttons and handle difficulty change
    initRadios() {
      this.radios.forEach(radio => {
        radio.checked = radio.value === this.selectedDifficulty;

        radio.addEventListener("change", () => {
          this.selectedDifficulty = radio.value;

          // Save selected difficulty
          sessionStorage.setItem("kukuDifficulty", this.selectedDifficulty);

          // Clear previous game state (important!)
          sessionStorage.removeItem("kukuState");

          this.updateHint();
        });
      });
    }

    // Update difficulty label shown to the user
    updateHint() {
      if (this.diffHint) {
        const label = this.selectedDifficulty.charAt(0).toUpperCase() + this.selectedDifficulty.slice(1);
        this.diffHint.innerHTML = `Difficulty: <b>${label}</b>`;
      }
    }

    // Display last played games from local storage
    displayHistory() {
      if (!this.historyList) return;
      let history = [];
      try {
        history = JSON.parse(localStorage.getItem("kukuHistory")) || [];
      } catch (e) {
        console.error("Invalid kukuHistory", e);
        history = [];
      }

      // Render history list
      this.historyList.innerHTML = history.map(game =>
        `<li>Difficulty: <b>${game.difficulty.toUpperCase()}</b> - Score: <b>${game.score}</b> (${game.date})</li>`
      ).join('');
    }

    // Handle form submission and redirect to game page
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
      // Get game board
      this.board = document.getElementById("kukuBoard");
      if (!this.board) return;

      // UI elements
      this.scoreText = document.getElementById("score");
      this.bestScoreText = document.getElementById("bestScore");
      this.timeBar = document.getElementById("timeBar");

      // Result modal elements
      this.resultModal = document.getElementById("resultModal");
      this.resultText = document.getElementById("resultText");
      this.resultStats = document.getElementById("resultStats");

      // Sounds
      this.clickSound = document.getElementById("clickSound");
      this.gameOverSound = document.getElementById("gameOverSound");

      // Load selected difficulty
      this.difficulty = sessionStorage.getItem("kukuDifficulty") || "easy";

      // Apply difficulty settings
      this.setupDifficulty();

      // Storage keys for scores
      this.bestKey = `kukuBest_${this.difficulty}`;
      this.lastKey = `kukuLast_${this.difficulty}`;
      this.totalKey = `kukuTotal_${this.difficulty}`; 

      // Load saved scores
      this.bestScore = parseInt(localStorage.getItem(this.bestKey)) || 0;
      this.lastScore = localStorage.getItem(this.lastKey) || "--";
      this.totalPlayed = parseInt(localStorage.getItem(this.totalKey)) || 0;

      // Close modal when clicking outside
      if (this.resultModal) {
        window.addEventListener("click", e => {
          if (e.target === this.resultModal) {
            this.resultModal.style.display = "none";
            this.reset();
          }
        });
      }
    }

    // Set game difficulty parameters
    setupDifficulty() {
      if (this.difficulty === "easy") { this.colorDiff = 70; this.timeLimit = 6000; }
      else if (this.difficulty === "medium") { this.colorDiff = 50; this.timeLimit = 5000; }
      else { this.colorDiff = 30; this.timeLimit = 3500; }
    }

    // Start or resume game
    init() {
      this.updateScoreUI();
      if (!this.loadGameState()) this.initGame();
    }

    // Initialize a new game
    initGame() {
      this.score = 0;
      this.gridSize = 2;
      this.correctClicksAtCurrentGrid = 0;
      this.timeLeft = this.timeLimit;

      this.updateScoreUI();
      this.createLevel();
      this.saveGameState();
    }

    // Save current game state to session storage
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

    // Load saved game state (if exists)
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

      // Restore state values
      this.score = state.score;
      this.gridSize = state.gridSize;
      this.correctClicksAtCurrentGrid = state.correctClicksAtCurrentGrid;
      this.timeLeft = state.timeLeft;

      this.updateScoreUI();

      // Restore board and resume timer
      if (state.boardState && state.boardState.length > 0) {
        this.renderBoard(state.boardState);
        this.startTimer(true);
        return true;
      }
      return false;
    }

    // Create a new level/grid
    createLevel() {
      const totalCells = this.gridSize * this.gridSize;
      const baseColor = this.randomColor();
      const oddColor = this.slightlyDifferentColor(baseColor);
      const oddIndex = Math.floor(Math.random() * totalCells);

      // Fill grid with base color and one odd cell
      const colors = Array(totalCells).fill(baseColor);
      colors[oddIndex] = oddColor;

      this.renderBoard(colors, oddIndex);
      this.startTimer();
    }

    // Render grid cells
    renderBoard(colors, oddIndex = -1) {
      this.board.innerHTML = "";
      this.board.style.gridTemplateColumns = `repeat(${this.gridSize}, 1fr)`;

      colors.forEach((color, i) => {
        const cell = document.createElement("div");
        cell.className = "kuku-cell";
        cell.style.background = color;

        // Handle click on each cell
        cell.addEventListener("click", () => this.handleCellClick(i, colors, oddIndex));
        this.board.appendChild(cell);
      });
    }

    // Handle user click on a cell
    handleCellClick(index, colors, oddIndex) {
      // Play click sound
      if (this.clickSound) { this.clickSound.currentTime = 0; this.clickSound.play(); }

      // Determine if clicked cell is correct
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

    // Find most common color (used when restoring board)
    getMostFrequentColor(arr) {
      const counts = {};
      arr.forEach(c => counts[c] = (counts[c] || 0) + 1);
      return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
    }

    // Increase grid size after enough correct clicks
    increaseDifficulty() {
      const clicksPerGrid = 5;
      if (this.correctClicksAtCurrentGrid >= clicksPerGrid && this.gridSize < 6) {
        this.gridSize++;
        this.correctClicksAtCurrentGrid = 0;
      }
    }

    // Start or resume countdown timer
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

    // Update visual time bar width
    updateTimeBar() {
      if (this.timeBar) this.timeBar.style.width = (this.timeLeft / this.timeLimit) * 100 + "%";
    }

    // Update score display and best score
    updateScoreUI() {
      if (this.scoreText) this.scoreText.textContent = `Score: ${this.score}`;
      if (this.score > this.bestScore) {
        this.bestScore = this.score;
        localStorage.setItem(this.bestKey, this.bestScore);
      }
      if (this.bestScoreText) this.bestScoreText.textContent = `Best (${this.difficulty}): ${this.bestScore} | Last: ${this.lastScore}`;
    }

    // Handle game over logic
    gameOver() {
      clearInterval(this.timer);
      this.lastScore = this.score;
      this.totalPlayed++;

      localStorage.setItem(this.lastKey, this.lastScore);
      localStorage.setItem(this.totalKey, this.totalPlayed);

      // Play game over sound
      if (this.gameOverSound) { this.gameOverSound.currentTime = 0; this.gameOverSound.play(); }

      if (this.resultText) this.resultText.textContent = "Game Over";
      if (this.resultStats) this.resultStats.textContent = `Difficulty: ${this.difficulty.toUpperCase()} | Score: ${this.score} | Best: ${this.bestScore}`;
      if (this.resultModal) this.resultModal.style.display = "flex";

      // Clear saved state and store history
      sessionStorage.removeItem("kukuState");
      this.saveToHistory();
    }

    // Save game result history (last 5 games)
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

    // Generate random RGB color
    randomColor() {
      const r = Math.floor(Math.random() * 200);
      const g = Math.floor(Math.random() * 200);
      const b = Math.floor(Math.random() * 200);
      return `rgb(${r},${g},${b})`;
    }

    // Slightly modify color for "odd" cell
    slightlyDifferentColor(color) {
      const nums = color.match(/\d+/g).map(Number);
      const clamp = (v) => Math.max(0, Math.min(255, v));
      return `rgb(${clamp(nums[0] + this.colorDiff)}, ${clamp(nums[1] + this.colorDiff)}, ${clamp(nums[2] + this.colorDiff)})`;
    }

    // Restart the game
    reset() {
      sessionStorage.removeItem("kukuState");
      if (this.resultModal) this.resultModal.style.display = "none";
      this.initGame();
    }

    // Go back to menu page
    goToMenu() {
      sessionStorage.removeItem("kukuState");
      window.location.replace("kuku.html");
    }
  }

  // Detect which page is loaded and initialize accordingly

  // Menu page
  if (document.getElementById("kukuForm")) {
    new KukuMenu();
  }

  // Game page
  if (document.getElementById("kukuBoard")) {
    const game = new KukuKube();
    game.init();

    // Expose controls globally (for buttons)
    window.reset = () => game.reset();
    window.goToMenu = () => game.goToMenu();
  }
});