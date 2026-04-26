// Run code only after DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {

    /* =========================
       MENU PAGE LOGIC
       ========================= */
    class Menu {
        constructor() {
            // Get UI elements
            this.radios = document.querySelectorAll("input[name='category']");
            this.categoryHint = document.getElementById("categoryHintMenu");
            this.historyList = document.getElementById("memoryHistoryList");

            // Load selected category or default to "fruit"
            this.selectedCategory = sessionStorage.getItem("memoryCategory") || "fruit";

            // Initialize menu features
            this.initRadios();
            this.updateHint();
            this.displayHistory();
            this.initForm();
        }

        // Setup category radio buttons
        initRadios() {
            this.radios.forEach(radio => {
                radio.checked = radio.value === this.selectedCategory;
                radio.addEventListener("change", () => {
                    this.selectedCategory = radio.value;

                    // Save selected category
                    sessionStorage.setItem("memoryCategory", this.selectedCategory);

                    // Clear any saved game state when category changes
                    sessionStorage.removeItem("memoryState");
                    this.updateHint();
                });
            });
        }

        updateHint() {
            if (this.categoryHint) {
                this.categoryHint.innerHTML = `Selected Category: <b>${this.selectedCategory.charAt(0).toUpperCase() + this.selectedCategory.slice(1)}</b>`;
            }
        }

        // Show last played games from localStorage
        displayHistory() {
            if (!this.historyList) return;

            let history = [];
            try {
                history = JSON.parse(localStorage.getItem("memoryHistory")) || [];
            } catch (e) {
                console.error("Invalid memoryHistory", e);
                history = [];
            }

            // Render history list
            this.historyList.innerHTML = history.map(game =>
                `<li>Category: <b>${game.category.charAt(0).toUpperCase() + game.category.slice(1)}</b> - Time: <b>${game.time}s</b> | Moves: <b>${game.moves}</b> (${game.date})</li>`
            ).join('');
        }

        // Handle form submit and go to game page
        initForm() {
            const categoryForm = document.getElementById("categoryForm");
            if (!categoryForm) return;
            categoryForm.addEventListener("submit", (e) => {
                e.preventDefault();
                window.location.href = "memoryGame.html";
            });
        }
    }

    /* =========================
       GAME PAGE LOGIC
       ========================= */
    class MemoryGame {
        constructor() {
            // Total cards (must be even)
            this.size = 18;

            // Categories with image paths
            this.categories = {
                fruit: ["apple", "banana", "strawberry", "pineapple", "kiwi", "cherry", "watermelon", "orange", "mango"].map(f => `../assets/img/fruit/${f}.png`),
                geometry: ["triangle", "circle", "square", "star", "diamond", "rhombus", "hexagon", "octagon", "pentagon"].map(g => `../assets/img/geometry/${g}.png`)
            };

            // Get board and UI elements
            this.board = document.getElementById("memory");
            if (!this.board) return;

            this.timeText = document.getElementById("time");
            this.moveText = document.getElementById("moves");
            this.bestText = document.getElementById("best");

            // Result modal elements
            this.resultModal = document.getElementById("resultModal");
            this.resultText = document.getElementById("resultText");
            this.resultStats = document.getElementById("resultStats");
            this.categoryHint = document.getElementById("categoryHint");

            // Sounds
            this.clickSound = document.getElementById("clickSound");
            this.correctSound = document.getElementById("correctSound");
            this.winSound = document.getElementById("winSound");

            // Load selected category
            this.currentCategory = sessionStorage.getItem("memoryCategory") || "fruit";

            // Load stats from localStorage
            this.bestTime = JSON.parse(localStorage.getItem(`memoryBestTime_${this.currentCategory}`)) ?? null;
            this.bestMoves = JSON.parse(localStorage.getItem(`memoryBestMoves_${this.currentCategory}`)) ?? null;
            this.totalPlayed = JSON.parse(localStorage.getItem(`memoryTotalPlayed_${this.currentCategory}`)) ?? 0;
            this.lastGame = JSON.parse(localStorage.getItem(`memoryLast_${this.currentCategory}`)) ?? { time: "--", moves: "--" };

            // Close result modal when clicking outside
            if (this.resultModal) {
                window.addEventListener("click", e => {
                    if (e.target === this.resultModal) {
                        this.resultModal.style.display = "none";
                        this.reset();
                    }
                });
            }
        }

        // Start game or resume saved state
        init() {
            this.updateBestText();
            if (!this.loadGameState()) this.initGame();
        }

        // Initialize new game
        initGame() {
            clearInterval(this.timer);
            this.firstCard = null;
            this.lockBoard = false;
            this.matches = 0;
            this.moves = 0;
            this.time = 0;
            this.gameStarted = false;

            // Reset UI
            if (this.timeText) this.timeText.textContent = "0";
            if (this.moveText) this.moveText.textContent = "0";
            if (this.categoryHint) this.categoryHint.innerHTML = `Category: <b>${this.currentCategory.charAt(0).toUpperCase() + this.currentCategory.slice(1)}</b>`;

            this.buildBoard();
        }

        // Shuffle array using Fisher-Yates algorithm
        shuffle(arr) {
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
            return arr;
        }

        // Start timer (increments every second)
        startTimer() {
            clearInterval(this.timer);
            this.timer = setInterval(() => {
                this.time++;
                if (this.timeText) this.timeText.textContent = this.time;
                this.saveGameState();
            }, 1000);
        }

        // Build the game board with shuffled pairs
        buildBoard() {
            this.board.innerHTML = "";
            const baseIcons = this.categories[this.currentCategory];
            let icons = this.shuffle([...baseIcons.slice(0, this.size / 2)]);
            icons = this.shuffle([...icons, ...icons]);

            icons.forEach(icon => this.board.appendChild(this.createCard(icon, false, false)));
            this.saveGameState();
        }

        // Create a single card element
        createCard(icon, isFlipped, isMatched) {
            const card = document.createElement("div");
            card.className = "cell";
            if (isFlipped) card.classList.add("flip");
            if (isMatched) card.classList.add("matched");

            card.dataset.icon = icon;

            // Card front/back structure
            card.innerHTML = `
                <div class="card-face front">?</div>
                <div class="card-face back"><img src="${icon}" class="card-img"></div>
            `;

            // Click handler
            card.addEventListener("click", () => this.flip(card));
            return card;
        }

        // Handle card flip logic
        flip(card) {
            // Ignore invalid clicks
            if (this.lockBoard || card.classList.contains("flip") || card.classList.contains("matched")) return;

            // Play click sound
            if (this.clickSound) { this.clickSound.currentTime = 0; this.clickSound.play(); }

            // Start timer on first move
            if (!this.gameStarted) { this.startTimer(); this.gameStarted = true; }

            card.classList.add("flip");

            // First card selection
            if (!this.firstCard) {
                this.firstCard = card;
                this.saveGameState();
                return;
            }

            // Second card selection
            this.moves++;
            if (this.moveText) this.moveText.textContent = this.moves;
            this.lockBoard = true;

            // Check match
            if (this.firstCard.dataset.icon === card.dataset.icon) this.handleMatch(card);
            else this.unflipCards(card);
        }

        // Handle matched cards
        handleMatch(card) {
            this.firstCard.classList.add("matched");
            card.classList.add("matched");

            // Play correct sound
            if (this.correctSound) { this.correctSound.currentTime = 0; this.correctSound.play(); }

            this.matches++;
            this.firstCard = null;
            this.lockBoard = false;

            // Check win condition
            if (this.matches === this.size / 2) this.endGame();
            else this.saveGameState();
        }

        // Flip cards back if not matched
        unflipCards(card) {
            setTimeout(() => {
                this.firstCard.classList.remove("flip");
                card.classList.remove("flip");
                this.firstCard = null;
                this.lockBoard = false;
                this.saveGameState();
            }, 800);
        }

        // Save current game state
        saveGameState() {
            try {
                const boardState = Array.from(this.board.children).map(card => ({
                    icon: card.dataset.icon,
                    flipped: card.classList.contains("flip"),
                    matched: card.classList.contains("matched")
                }));

                sessionStorage.setItem("memoryState", JSON.stringify({
                    boardState,
                    firstCardIcon: this.firstCard ? this.firstCard.dataset.icon : null,
                    lockBoard: this.lockBoard,
                    matches: this.matches,
                    moves: this.moves,
                    time: this.time,
                    gameStarted: this.gameStarted,
                    category: this.currentCategory
                }));
            } catch (e) {
                console.error("Failed to save memory game state", e);
            }
        }

        // Load saved game state
        loadGameState() {
            let state;
            try {
                state = JSON.parse(sessionStorage.getItem("memoryState"));
            } catch (e) {
                console.error("Corrupted memory game state", e);
                sessionStorage.removeItem("memoryState");
                return false;
            }

            // Validate state
            if (!state || state.category !== this.currentCategory) return false;

            // Rebuild board
            this.board.innerHTML = "";
            state.boardState.forEach(c => this.board.appendChild(this.createCard(c.icon, c.flipped, c.matched)));

            // Restore game values
            this.firstCard = state.firstCardIcon
                ? [...this.board.children].find(card => card.dataset.icon === state.firstCardIcon)
                : null;
            this.lockBoard = state.lockBoard;
            this.matches = state.matches;
            this.moves = state.moves;
            this.time = state.time;
            this.gameStarted = state.gameStarted;

            if (this.moveText) this.moveText.textContent = this.moves;
            if (this.timeText) this.timeText.textContent = this.time;
            if (this.gameStarted) this.startTimer();

            return true;
        }

        // Handle game completion
        endGame() {
            clearInterval(this.timer);
            sessionStorage.removeItem("memoryState");

            this.totalPlayed++;
            this.lastGame = { time: this.time, moves: this.moves };

            // Update best stats
            if (!this.bestTime || this.time < this.bestTime) this.bestTime = this.time;
            if (!this.bestMoves || this.moves < this.bestMoves) this.bestMoves = this.moves;

            // Save stats
            localStorage.setItem(`memoryTotalPlayed_${this.currentCategory}`, JSON.stringify(this.totalPlayed));
            localStorage.setItem(`memoryLast_${this.currentCategory}`, JSON.stringify(this.lastGame));
            localStorage.setItem(`memoryBestTime_${this.currentCategory}`, JSON.stringify(this.bestTime));
            localStorage.setItem(`memoryBestMoves_${this.currentCategory}`, JSON.stringify(this.bestMoves));

            this.updateBestText();

            // Show result modal
            if (this.resultText) this.resultText.textContent = "You Win!";
            if (this.resultStats) this.resultStats.textContent = `Time: ${this.time}s | Moves: ${this.moves}`;
            if (this.resultModal) this.resultModal.style.display = "flex";
            if (this.winSound) { this.winSound.currentTime = 0; this.winSound.play(); }

            // Save history (last 5 games)
            let history = [];
            try {
                history = JSON.parse(localStorage.getItem("memoryHistory")) || [];
            } catch {
                history = [];
            }
            history.unshift({ date: new Date().toLocaleString(), category: this.currentCategory, time: this.time, moves: this.moves });
            if (history.length > 5) history.pop();
            localStorage.setItem("memoryHistory", JSON.stringify(history));
        }

        // Update best stats display
        updateBestText() {
            if (!this.bestText) return;
            this.bestText.textContent = `Best Time: ${this.bestTime ?? "--"}s | Best Moves: ${this.bestMoves ?? "--"} | Total Played: ${this.totalPlayed} | Last: ${this.lastGame.time}s / ${this.lastGame.moves} moves`;
        }

        // Restart game
        reset() {
            sessionStorage.removeItem("memoryState");
            if (this.resultModal) this.resultModal.style.display = "none";
            this.initGame();
        }

        // Return to menu page
        goToMenu() {
            sessionStorage.removeItem("memoryState");
            window.location.replace('memory.html');
        }
    }
    // Initialize correct page

    // Menu page
    if (document.getElementById("categoryForm")) {
        new Menu();
    }

    // Game page
    if (document.getElementById("memory")) {
        const game = new MemoryGame();
        game.init();

        // Expose methods for buttons
        window.reset = () => game.reset();
        window.goToMenu = () => game.goToMenu();
    }


});



