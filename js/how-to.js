// Data object containing instructions for all games
const gameData = {
    tic: {
        title: "Tic Tac Toe",
        objective: "Be the first player to get three of your symbols in a row, column, or diagonal on a 3x3 grid.",
        mechanics: [
            "You and the Computer take turns placing marks.",
            "If you start the first match, the Computer starts the next.",
            "Choose your symbol (X or O) in the menu."
        ],
        tip: "Always try to take the center square first; it offers the most winning combinations!",
        link: "../html/tic.html"
    },
    kuku: {
        title: "Kuku Kube",
        objective: "Identify the one square that has a slightly different color from the others.",
        mechanics: [
            "Click the 'odd' square to level up.",
            "The grid size increases as you progress.",
            "You are racing against a strict timer!"
        ],
        tip: "Try relaxing your eyes slightly to spot the color variance faster.",
        link: "../html/kuku.html"
    },
    memory: {
        title: "Memory Game",
        objective: "Find all matching pairs of cards in the shortest amount of moves.",
        mechanics: [
            "Flip two cards at a time.",
            "If they match, they stay face up.",
            "If they don't, they flip back over."
        ],
        tip: "Say the names of the items out loud to help your brain anchor the positions.",
        link: "../html/memory.html"
    },
    puzzle: {
        title: "Sliding Puzzle",
        objective: "Rearrange the tiles to form the complete image or numerical sequence.",
        mechanics: [
            "Click a tile adjacent to the empty space to move it.",
            "Only tiles next to the gap can be moved.",
            "The goal is to solve it in the fewest moves possible."
        ],
        tip: "Try to solve the top row and the leftmost column first to reduce the puzzle size.",
        link: "../html/puzzle.html"
    }
};

// Main function to load instructions
function loadGameInstructions() {
    const params = new URLSearchParams(window.location.search);
    const gameKey = params.get('game');

    // Get elements safely
    const titleEl = document.getElementById('game-title');
    const objectiveEl = document.getElementById('game-objective');
    const tipEl = document.getElementById('game-tip');
    const mechanicsList = document.getElementById('game-mechanics');
    const playBtn = document.getElementById('play-button');
    const backLink = document.getElementById('back-link'); // optional

    // Validate game key
    if (!gameKey || !gameData[gameKey]) {
        if (titleEl) titleEl.textContent = "Game Not Found";
        if (objectiveEl) objectiveEl.textContent = "Invalid or missing game parameter in URL.";
        if (mechanicsList) mechanicsList.innerHTML = "";
        if (tipEl) tipEl.textContent = "";
        if (playBtn) playBtn.style.display = "none";
        return;
    }

    const data = gameData[gameKey];

    // Populate content
    if (titleEl) {
        titleEl.innerHTML = `<i class="fa-solid fa-circle-info"></i> ${data.title}`;
    }

    if (objectiveEl) {
        objectiveEl.textContent = data.objective;
    }

    if (tipEl) {
        tipEl.textContent = data.tip;
    }

    if (playBtn) {
        playBtn.href = data.link;
    }

    // Optional back link (safe check)
    if (backLink) {
        backLink.href = data.link;
    }

    // Fill mechanics list
    if (mechanicsList) {
        mechanicsList.innerHTML = "";
        data.mechanics.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item;
            mechanicsList.appendChild(li);
        });
    }
}

// Run after DOM is fully loaded
document.addEventListener("DOMContentLoaded", loadGameInstructions);