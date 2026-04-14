document.addEventListener("DOMContentLoaded", () => {

  /* =========================
     MENU PAGE LOGIC
     ========================= */
  class PuzzleMenu {
    constructor() {
      this.radios = document.querySelectorAll("input[name='grid']");
      this.gridHint = document.getElementById("gridHint");
      this.historyList = document.getElementById("puzzleHistoryList");
      this.selectedGrid = sessionStorage.getItem("puzzleGrid") || "3";

      this.initRadios();
      this.updateHint();
      this.displayHistory();
      this.initForm();
    }

    initRadios() {
      this.radios.forEach(radio => {
        radio.checked = radio.value === this.selectedGrid;
        radio.addEventListener("change", () => {
          this.selectedGrid = radio.value;
          sessionStorage.setItem("puzzleGrid", this.selectedGrid);
          sessionStorage.removeItem("puzzleState");
          this.updateHint();
        });
      });
    }

    updateHint() {
      if (this.gridHint) {
        this.gridHint.innerHTML = `Grid: <b>${this.selectedGrid} x ${this.selectedGrid}</b>`;
      }
    }

    displayHistory() {
      if (!this.historyList) return;

      let history = [];
      try {
        history = JSON.parse(localStorage.getItem("puzzleHistory")) || [];
      } catch (e) {
        console.error("Invalid puzzleHistory", e);
        history = [];
      }

      this.historyList.innerHTML = history.map(game =>
        `<li>Grid: <b>${game.size}x${game.size}</b> - Moves: <b>${game.moves}</b> (${game.date})</li>`
      ).join('');
    }

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
      this.puzzleEl = document.getElementById("puzzle");
      if (!this.puzzleEl) return;

      const savedSize = parseInt(sessionStorage.getItem("puzzleGrid"));
      this.size = [3, 4, 5].includes(savedSize) ? savedSize : 3;

      this.total = this.size * this.size;
      this.tiles = [];
      this.moves = 0;

      this.bestText = document.getElementById("best");
      this.resultModal = document.getElementById("resultModal");
      this.resultText = document.getElementById("resultText");
      this.resultStats = document.getElementById("resultStats");
      this.clickSound = document.getElementById("clickSound");
      this.winSound = document.getElementById("winSound");

      this.bestKey = `puzzleBest_${this.size}`;
      this.lastKey = `puzzleLast_${this.size}`;
      this.totalKey = `puzzleTotal_${this.size}`;

      this.bestMoves = parseInt(localStorage.getItem(this.bestKey)) || null;
      this.lastMoves = parseInt(localStorage.getItem(this.lastKey)) || null;
      this.totalPlayed = parseInt(localStorage.getItem(this.totalKey)) || 0;

      if (this.resultModal) {
        window.addEventListener("click", e => {
          if (e.target === this.resultModal) {
            this.resultModal.style.display = "none";
          }
        });
      }
    }

    /* =========================
       INIT
    ========================= */
    init() {
      this.updateBestText();
      if (!this.loadGameState()) this.initGame();
    }

    initGame() {
      this.tiles = [...Array(this.total - 1).keys()]
        .map(n => n + 1)
        .concat(null);

      this.shuffle();
      this.moves = 0;
      this.render();
      this.saveGameState();
    }

    shuffle() {
      do {
        // create tiles 1 → N and one empty
        this.tiles = [];
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

      // for 3x3 and 5x5 → even = solvable
      if (this.size % 2 === 1) {
        return count % 2 === 0;
      }

      // for 4x4 → need extra rule
      const emptyRow = Math.floor(this.tiles.indexOf(null) / this.size);
      const fromBottom = this.size - emptyRow;

      return (count + fromBottom) % 2 === 0;
    }

    /* =========================
       STATE
    ========================= */
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
      this.puzzleEl.style.gridTemplateColumns = `repeat(${this.size}, 1fr)`;

      this.tiles.forEach((t, i) => {
        const cell = document.createElement("div");
        cell.className = t ? "cell" : "cell empty";
        cell.textContent = t || "";
        cell.addEventListener("click", () => this.move(i));

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

      const sameRow = Math.floor(i / this.size) === Math.floor(emptyIndex / this.size);

      const validMove =
        (sameRow && Math.abs(i - emptyIndex) === 1) ||
        Math.abs(i - emptyIndex) === this.size;

      if (!validMove) return;

      [this.tiles[i], this.tiles[emptyIndex]] = [this.tiles[emptyIndex], this.tiles[i]];

      this.moves++;
      this.render();
      this.saveGameState();

      if (this.clickSound) {
        this.clickSound.currentTime = 0;
        this.clickSound.play();
      }

      if (this.isSolved()) {
        setTimeout(() => this.showResult(), 100);
      }
    }

    isSolved() {
      return this.tiles
        .slice(0, this.total - 1)
        .every((v, i) => v === i + 1);
    }

    showResult() {
      if (this.winSound) {
        this.winSound.currentTime = 0;
        this.winSound.play();
      }

      if (this.resultText) this.resultText.textContent = "Puzzle Solved!";
      if (this.resultStats) this.resultStats.textContent = `Moves: ${this.moves}`;
      if (this.resultModal) this.resultModal.style.display = "flex";

      this.lastMoves = this.moves;
      this.totalPlayed++;

      if (!this.bestMoves || this.moves < this.bestMoves) {
        this.bestMoves = this.moves;
      }

      localStorage.setItem(this.bestKey, this.bestMoves);
      localStorage.setItem(this.lastKey, this.lastMoves);
      localStorage.setItem(this.totalKey, this.totalPlayed);

      this.updateBestText();
      sessionStorage.removeItem("puzzleState");

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

    updateBestText() {
      if (!this.bestText) return;
      this.bestText.textContent =
        `Best (${this.size}x${this.size}): ${this.bestMoves ?? "--"} | Last: ${this.lastMoves ?? "--"} moves`;
    }

    reset() {
      sessionStorage.removeItem("puzzleState");
      if (this.resultModal) this.resultModal.style.display = "none";
      this.initGame();
    }

    goToMenu() {
      sessionStorage.removeItem("puzzleState");
      window.location.replace("puzzle.html");
    }
  }

  /* =========================
     INITIALIZATION
     ========================= */
  if (document.getElementById("puzzleForm")) {
    new PuzzleMenu();
  }

  if (document.getElementById("puzzle")) {
    const game = new SlidingPuzzle();
    game.init();

    window.reset = () => game.reset();
    window.goToMenu = () => game.goToMenu();
  }
});