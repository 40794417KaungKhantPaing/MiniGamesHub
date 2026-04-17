
document.addEventListener("DOMContentLoaded", () => {

    /* =========================
       MENU PAGE LOGIC
       ========================= */
    class Menu {
        constructor() {
            this.radios = document.querySelectorAll("input[name='category']");
            this.categoryHint = document.getElementById("categoryHintMenu");
            this.historyList = document.getElementById("memoryHistoryList");
            this.selectedCategory = sessionStorage.getItem("memoryCategory") || "fruit";

            this.initRadios();
            this.updateHint();
            this.displayHistory();
            this.initForm();
        }

        initRadios() {
            this.radios.forEach(radio => {
                radio.checked = radio.value === this.selectedCategory;
                radio.addEventListener("change", () => {
                    this.selectedCategory = radio.value;
                    sessionStorage.setItem("memoryCategory", this.selectedCategory);
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

        displayHistory() {
            if (!this.historyList) return;

            let history = [];
            try {
                history = JSON.parse(localStorage.getItem("memoryHistory")) || [];
            } catch (e) {
                console.error("Invalid memoryHistory", e);
                history = [];
            }

            this.historyList.innerHTML = history.map(game =>
                `<li>Category: <b>${game.category.charAt(0).toUpperCase() + game.category.slice(1)}</b> - Time: <b>${game.time}s</b> | Moves: <b>${game.moves}</b> (${game.date})</li>`
            ).join('');
        }

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
            this.size = 18;
            this.categories = {
                fruit: ["apple", "banana", "strawberry", "pineapple", "kiwi", "cherry", "watermelon", "orange", "mango"].map(f => `../assets/img/fruit/${f}.png`),
                geometry: ["triangle", "circle", "square", "star", "diamond", "rhombus", "hexagon", "octagon", "pentagon"].map(g => `../assets/img/geometry/${g}.png`)
            };

            this.board = document.getElementById("memory");
            if (!this.board) return;

            this.timeText = document.getElementById("time");
            this.moveText = document.getElementById("moves");
            this.bestText = document.getElementById("best");
            this.resultModal = document.getElementById("resultModal");
            this.resultText = document.getElementById("resultText");
            this.resultStats = document.getElementById("resultStats");
            this.categoryHint = document.getElementById("categoryHint");
            this.clickSound = document.getElementById("clickSound");
            this.correctSound = document.getElementById("correctSound");
            this.winSound = document.getElementById("winSound");

            this.currentCategory = sessionStorage.getItem("memoryCategory") || "fruit";

            this.bestTime = JSON.parse(localStorage.getItem(`memoryBestTime_${this.currentCategory}`)) ?? null;
            this.bestMoves = JSON.parse(localStorage.getItem(`memoryBestMoves_${this.currentCategory}`)) ?? null;
            this.totalPlayed = JSON.parse(localStorage.getItem(`memoryTotalPlayed_${this.currentCategory}`)) ?? 0;
            this.lastGame = JSON.parse(localStorage.getItem(`memoryLast_${this.currentCategory}`)) ?? { time: "--", moves: "--" };

            if (this.resultModal) {
                window.addEventListener("click", e => {
                    if (e.target === this.resultModal) {
                        this.resultModal.style.display = "none";
                        this.reset();
                    }
                });
            }
        }

        init() {
            this.updateBestText();
            if (!this.loadGameState()) this.initGame();
        }

        initGame() {
            clearInterval(this.timer);
            this.firstCard = null;
            this.lockBoard = false;
            this.matches = 0;
            this.moves = 0;
            this.time = 0;
            this.gameStarted = false;

            if (this.timeText) this.timeText.textContent = "0";
            if (this.moveText) this.moveText.textContent = "0";
            if (this.categoryHint) this.categoryHint.innerHTML = `Category: <b>${this.currentCategory.charAt(0).toUpperCase() + this.currentCategory.slice(1)}</b>`;

            this.buildBoard();
        }

        shuffle(arr) {
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
            return arr;
        }

        startTimer() {
            clearInterval(this.timer);
            this.timer = setInterval(() => {
                this.time++;
                if (this.timeText) this.timeText.textContent = this.time;
                this.saveGameState();
            }, 1000);
        }

        buildBoard() {
            this.board.innerHTML = "";
            const baseIcons = this.categories[this.currentCategory];
            let icons = this.shuffle([...baseIcons.slice(0, this.size / 2)]);
            icons = this.shuffle([...icons, ...icons]);

            icons.forEach(icon => this.board.appendChild(this.createCard(icon, false, false)));
            this.saveGameState();
        }

        createCard(icon, isFlipped, isMatched) {
            const card = document.createElement("div");
            card.className = "cell";
            if (isFlipped) card.classList.add("flip");
            if (isMatched) card.classList.add("matched");

            card.dataset.icon = icon;
            card.innerHTML = `
                <div class="card-face front">?</div>
                <div class="card-face back"><img src="${icon}" class="card-img"></div>
            `;
            card.addEventListener("click", () => this.flip(card));
            return card;
        }

        flip(card) {
            if (this.lockBoard || card.classList.contains("flip") || card.classList.contains("matched")) return;
            if (this.clickSound) { this.clickSound.currentTime = 0; this.clickSound.play(); }
            if (!this.gameStarted) { this.startTimer(); this.gameStarted = true; }

            card.classList.add("flip");

            if (!this.firstCard) {
                this.firstCard = card;
                this.saveGameState();
                return;
            }

            this.moves++;
            if (this.moveText) this.moveText.textContent = this.moves;
            this.lockBoard = true;

            if (this.firstCard.dataset.icon === card.dataset.icon) this.handleMatch(card);
            else this.unflipCards(card);
        }

        handleMatch(card) {
            this.firstCard.classList.add("matched");
            card.classList.add("matched");
            if (this.correctSound) { this.correctSound.currentTime = 0; this.correctSound.play(); }

            this.matches++;
            this.firstCard = null;
            this.lockBoard = false;

            if (this.matches === this.size / 2) this.endGame();
            else this.saveGameState();
        }

        unflipCards(card) {
            setTimeout(() => {
                this.firstCard.classList.remove("flip");
                card.classList.remove("flip");
                this.firstCard = null;
                this.lockBoard = false;
                this.saveGameState();
            }, 800);
        }

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


        loadGameState() {
            let state;
            try {
                state = JSON.parse(sessionStorage.getItem("memoryState"));
            } catch (e) {
                console.error("Corrupted memory game state", e);
                sessionStorage.removeItem("memoryState");
                return false;
            }
            if (!state || state.category !== this.currentCategory) return false;

            this.board.innerHTML = "";
            state.boardState.forEach(c => this.board.appendChild(this.createCard(c.icon, c.flipped, c.matched)));

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

        endGame() {
            clearInterval(this.timer);
            sessionStorage.removeItem("memoryState");

            this.totalPlayed++;
            this.lastGame = { time: this.time, moves: this.moves };

            if (!this.bestTime || this.time < this.bestTime) this.bestTime = this.time;
            if (!this.bestMoves || this.moves < this.bestMoves) this.bestMoves = this.moves;

            localStorage.setItem(`memoryTotalPlayed_${this.currentCategory}`, JSON.stringify(this.totalPlayed));
            localStorage.setItem(`memoryLast_${this.currentCategory}`, JSON.stringify(this.lastGame));
            localStorage.setItem(`memoryBestTime_${this.currentCategory}`, JSON.stringify(this.bestTime));
            localStorage.setItem(`memoryBestMoves_${this.currentCategory}`, JSON.stringify(this.bestMoves));

            this.updateBestText();

            if (this.resultText) this.resultText.textContent = "You Win!";
            if (this.resultStats) this.resultStats.textContent = `Time: ${this.time}s | Moves: ${this.moves}`;
            if (this.resultModal) this.resultModal.style.display = "flex";
            if (this.winSound) { this.winSound.currentTime = 0; this.winSound.play(); }

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

        updateBestText() {
            if (!this.bestText) return;
            this.bestText.textContent = `Best Time: ${this.bestTime ?? "--"}s | Best Moves: ${this.bestMoves ?? "--"} | Total Played: ${this.totalPlayed} | Last: ${this.lastGame.time}s / ${this.lastGame.moves} moves`;
        }

        reset() {
            sessionStorage.removeItem("memoryState");
            if (this.resultModal) this.resultModal.style.display = "none";
            this.initGame();
        }

        goToMenu() {
            sessionStorage.removeItem("memoryState");
            window.location.replace('memory.html');
        }
    }

    // Initialize
    if (document.getElementById("categoryForm")) {
        new Menu();
    }

    if (document.getElementById("memory")) {
        const game = new MemoryGame();
        game.init();

        // Expose methods for buttons
        window.reset = () => game.reset();
        window.goToMenu = () => game.goToMenu();
    }


});



