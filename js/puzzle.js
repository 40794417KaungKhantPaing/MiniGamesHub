// Run script after DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {

  /* =========================
     MENU PAGE LOGIC
     ========================= */
  class PuzzleMenu {
    constructor() {
      // Get UI elements
      this.radios = document.querySelectorAll("input[name='grid']");
      this.gridHint = document.getElementById("gridHint");
      this.historyList = document.getElementById("puzzleHistoryList");

      // Load selected grid size (default = 3x3)
      this.selectedGrid = sessionStorage.getItem("puzzleGrid") || "3";

      // Initialize menu
      this.initRadios();
      this.updateHint();
      this.displayHistory();
      this.initForm();
    }

    // Setup radio buttons for grid selection
    initRadios() {
      this.radios.forEach(radio => {
        radio.checked = radio.value === this.selectedGrid;
        radio.addEventListener("change", () => {
          this.selectedGrid = radio.value;

          // Save selected grid size
          sessionStorage.setItem("puzzleGrid", this.selectedGrid);

          // Clear any existing game state
          sessionStorage.removeItem("puzzleState");
          this.updateHint();
        });
      });
    }

    // Update grid hint text
    updateHint() {
      if (this.gridHint) {
        this.gridHint.innerHTML = `Grid: <b>${this.selectedGrid} x ${this.selectedGrid}</b>`;
      }
    }

    // Display last played games from localStorage
    displayHistory() {
      if (!this.historyList) return;

      let history = [];
      try {
        history = JSON.parse(localStorage.getItem("puzzleHistory")) || [];
      } catch (e) {
        console.error("Invalid puzzleHistory", e);
        history = [];
      }

      // Render history list
      this.historyList.innerHTML = history.map(game =>
        `<li>Grid: <b>${game.size}x${game.size}</b> - Moves: <b>${game.moves}</b> (${game.date})</li>`
      ).join('');
    }

    // Handle form submission → go to game page
    initForm() {
      const puzzleForm = document.getElementById("puzzleForm");
      if (!puzzleForm) return;
      puzzleForm.addEventListener("submit", (e) => {
        e.preventDefault();
        window.location.href = "puzzleGame.html";
      });
    }
  }

  /* =========================
     GAME PAGE LOGIC
     ========================= */
  class SlidingPuzzle {
    constructor() {
      // Get puzzle container
      this.puzzleEl = document.getElementById("puzzle");
      if (!this.puzzleEl) return;

      // Get selected grid size (only allow 3, 4, or 5)
      const savedSize = parseInt(sessionStorage.getItem("puzzleGrid"));
      this.size = [3, 4, 5].includes(savedSize) ? savedSize : 3;

      this.total = this.size * this.size; // total number of tiles
      this.tiles = []; // tile array
      this.moves = 0; // move counter

      // UI elements
      this.bestText = document.getElementById("best");
      this.resultModal = document.getElementById("resultModal");
      this.resultText = document.getElementById("resultText");
      this.resultStats = document.getElementById("resultStats");

      // Sounds
      this.clickSound = document.getElementById("clickSound");
      this.winSound = document.getElementById("winSound");

      // Storage keys for stats
      this.bestKey = `puzzleBest_${this.size}`;
      this.lastKey = `puzzleLast_${this.size}`;
      this.totalKey = `puzzleTotal_${this.size}`;

      // Load stats
      this.bestMoves = parseInt(localStorage.getItem(this.bestKey)) || null;
      this.lastMoves = parseInt(localStorage.getItem(this.lastKey)) || null;
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

    // Start or resume game
    init() {
      this.updateBestText();
      if (!this.loadGameState()) this.initGame();
    }

    // Initialize new puzzle
    initGame() {
      // Create tiles 1 → N and one empty space (null)
      this.tiles = [...Array(this.total - 1).keys()]
        .map(n => n + 1)
        .concat(null);

      this.shuffle();
      this.moves = 0;
      this.render();
      this.saveGameState();
    }

    // Shuffle tiles until a solvable, unsolved puzzle is generated
    shuffle() {
      do {
        this.tiles = [];

        // Fill tiles
        for (let i = 1; i < this.total; i++) {
          this.tiles.push(i);
        }
        this.tiles.push(null);

        // simple shuffle (swap randomly)
        for (let i = 0; i < this.tiles.length; i++) {
          const j = Math.floor(Math.random() * this.tiles.length);
          [this.tiles[i], this.tiles[j]] = [this.tiles[j], this.tiles[i]];
        }

      } while (!this.isSolvable() || this.isSolved());
    }

    // Check if puzzle configuration is solvable
    isSolvable() {
      let count = 0;

      // count inversions (how many numbers are in wrong order)
      for (let i = 0; i < this.tiles.length; i++) {
        for (let j = i + 1; j < this.tiles.length; j++) {
          if (
            this.tiles[i] &&
            this.tiles[j] &&
            this.tiles[i] > this.tiles[j]
          ) {
            count++;
          }
        }
      }

      // Odd grid (3x3, 5x5)
      if (this.size % 2 === 1) {
        return count % 2 === 0;
      }

      // Even grid (4x4)
      const emptyRow = Math.floor(this.tiles.indexOf(null) / this.size);
      const fromBottom = this.size - emptyRow;

      // If blank is on even row from bottom
      if (fromBottom % 2 === 0) {
        return count % 2 === 1; // inversions must be odd
      } else {
        return count % 2 === 0; // inversions must be even
      }
    }

    /* =========================
       STATE
    ========================= */

    // Save game state to sessionStorage
    saveGameState() {
      try {
        sessionStorage.setItem("puzzleState", JSON.stringify({
          tiles: this.tiles,
          moves: this.moves,
          size: this.size
        }));
      } catch (e) {
        console.error("Failed to save puzzle state", e);
      }
    }

    // Load saved game state
    loadGameState() {
      let state;
      try {
        state = JSON.parse(sessionStorage.getItem("puzzleState"));
      } catch (e) {
        console.error("Corrupted puzzle state", e);
        sessionStorage.removeItem("puzzleState");
        return false;
      }
      if (!state || state.size !== this.size) return false;

      this.tiles = state.tiles;
      this.moves = state.moves;
      this.render();
      return true;
    }

    /* =========================
       RENDER
    ========================= */
    render() {
      this.puzzleEl.innerHTML = "";

      // Set grid layout
      this.puzzleEl.style.gridTemplateColumns = `repeat(${this.size}, 1fr)`;

      this.tiles.forEach((t, i) => {
        const cell = document.createElement("div");

        // Assign classes
        cell.className = t ? "cell" : "cell empty";

        // Display number or blank
        cell.textContent = t || "";

        // Click handler
        cell.addEventListener("click", () => this.move(i));

        // Color styling (optional visual)
        if (t) {
          cell.style.backgroundColor = t % 2 === 0 ? "blue" : "orange";
        }

        this.puzzleEl.appendChild(cell);
      });
    }

    /* =========================
       MOVE
    ========================= */
    move(i) {
      const emptyIndex = this.tiles.indexOf(null);

      // Check if clicked tile is adjacent to empty space
      const sameRow = Math.floor(i / this.size) === Math.floor(emptyIndex / this.size);

      const validMove =
        (sameRow && Math.abs(i - emptyIndex) === 1) ||
        Math.abs(i - emptyIndex) === this.size;

      if (!validMove) return;

      // Swap tile with empty space
      [this.tiles[i], this.tiles[emptyIndex]] = [this.tiles[emptyIndex], this.tiles[i]];

      this.moves++;
      this.render();
      this.saveGameState();

      // Play click sound
      if (this.clickSound) {
        this.clickSound.currentTime = 0;
        this.clickSound.play();
      }

      // Check if puzzle is solved
      if (this.isSolved()) {
        setTimeout(() => this.showResult(), 100);
      }
    }

    // Check if tiles are in correct order
    isSolved() {
      return this.tiles
        .slice(0, this.total - 1)
        .every((v, i) => v === i + 1);
    }

    showResult() {
      // Play win sound
      if (this.winSound) {
        this.winSound.currentTime = 0;
        this.winSound.play();
      }

      // Show result modal
      if (this.resultText) this.resultText.textContent = "Puzzle Solved!";
      if (this.resultStats) this.resultStats.textContent = `Moves: ${this.moves}`;
      if (this.resultModal) this.resultModal.style.display = "flex";

      // Update stats
      this.lastMoves = this.moves;
      this.totalPlayed++;

      if (!this.bestMoves || this.moves < this.bestMoves) {
        this.bestMoves = this.moves;
      }

      // Save stats
      localStorage.setItem(this.bestKey, this.bestMoves);
      localStorage.setItem(this.lastKey, this.lastMoves);
      localStorage.setItem(this.totalKey, this.totalPlayed);

      this.updateBestText();

      // Clear saved game state
      sessionStorage.removeItem("puzzleState");

      // Save history (last 5 games)
      let history = [];
      try {
        history = JSON.parse(localStorage.getItem("puzzleHistory")) || [];
      } catch {
        history = [];
      }
      history.unshift({
        date: new Date().toLocaleString(),
        moves: this.moves,
        size: this.size
      });

      if (history.length > 5) history.pop();
      localStorage.setItem("puzzleHistory", JSON.stringify(history));
    }

    // Update best score display
    updateBestText() {
      if (!this.bestText) return;
      this.bestText.textContent =
        `Best (${this.size}x${this.size}): ${this.bestMoves ?? "--"} | Last: ${this.lastMoves ?? "--"} moves`;
    }

    // Restart puzzle
    reset() {
      sessionStorage.removeItem("puzzleState");
      if (this.resultModal) this.resultModal.style.display = "none";
      this.initGame();
    }

    // Go back to menu
    goToMenu() {
      sessionStorage.removeItem("puzzleState");
      window.location.replace("puzzle.html");
    }
  }

  /* =========================
     INITIALIZATION
     ========================= */

  // Menu page
  if (document.getElementById("puzzleForm")) {
    new PuzzleMenu();
  }

  // Game page
  if (document.getElementById("puzzle")) {
    const game = new SlidingPuzzle();
    game.init();

    // Make functions accessible globally (for buttons)
    window.reset = () => game.reset();
    window.goToMenu = () => game.goToMenu();
  }
});