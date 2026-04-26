// Run script after DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {

  const input = document.getElementById("usernameInput");
  const welcome = document.getElementById("welcomeUser");

  // Load saved username from localStorage
  function loadUser() {
    const name = localStorage.getItem("playerName") || "Guest";
    input.value = name;

    welcome.innerHTML = `Welcome, ${name} <i class="fa-solid fa-hand wave"></i>`;
  }

  // Save username when user updates it
  window.saveUsername = function () {
    const name = input.value.trim();
    localStorage.setItem("playerName", name);
    welcome.innerHTML = `Welcome, ${name} <i class="fa-solid fa-hand wave"></i>`;
  };

  loadUser(); // initialize user info
  /* ------------------ Tic Tac Toe ------------------ */
  const tttStatsEl = document.getElementById("tttStats");
  // Load stats and last game
  const tttStats = JSON.parse(localStorage.getItem("ticStats")) || { win: 0, lose: 0, draw: 0, played: 0 };
  const tttLast = JSON.parse(localStorage.getItem("ticHistory"))?.[0] || { result: "--", player: "--" };

  // Calculate win rate
  const tttWinRate = tttStats.played ? ((tttStats.win / tttStats.played) * 100).toFixed(1) : 0;

  // Display stats if container exists
  if (tttStatsEl) {
    tttStatsEl.innerHTML = `
      Wins: ${tttStats.win}<br>
      Losses: ${tttStats.lose}<br>
      Draws: ${tttStats.draw}<br>
      Win Rate: ${tttWinRate}%<br>
      Total Played: ${tttStats.played}<br>
      Last: ${tttLast.result || "--"} (${tttLast.player || "--"})
    `;
  }

  /* ------------------ Memory Game ------------------ */

  const memoryCategorySelect = document.getElementById("memoryCategory"); // the dropdown
  const memoryStatsEl = document.getElementById("memoryStats"); // stats container

  // Update memory game stats based on selected category
  function updateMemoryStats() {
    if (!memoryCategorySelect || !memoryStatsEl) return;

    const cat = memoryCategorySelect.value;

    // Load stats for selected category
    const bestTime = JSON.parse(localStorage.getItem(`memoryBestTime_${cat}`)) ?? "--";
    const bestMoves = JSON.parse(localStorage.getItem(`memoryBestMoves_${cat}`)) ?? "--";
    const totalPlayed = JSON.parse(localStorage.getItem(`memoryTotalPlayed_${cat}`)) ?? 0;
    const lastGame = JSON.parse(localStorage.getItem(`memoryLast_${cat}`)) ?? { time: "--", moves: "--" };

    // Display stats
    memoryStatsEl.innerHTML = `
        Best Time: ${bestTime}s<br>
        Best Moves: ${bestMoves}<br>
        Total Played: ${totalPlayed}<br>
        Last: ${lastGame.time}s / ${lastGame.moves} moves
    `;

    //Save selected category in sessionStorage for page reload
    sessionStorage.setItem("memoryCategory", cat);
  }

  // Update stats on dropdown change
  memoryCategorySelect?.addEventListener("change", updateMemoryStats);
  updateMemoryStats(); // initial load

  /* ------------------ Puzzle Dropdown ------------------ */
  const puzzleStatsEl = document.getElementById("puzzleStats");
  const puzzleSelect = document.getElementById("puzzleGridSelect");

  // Load saved or default
  let puzzleGrid = sessionStorage.getItem("puzzleGrid") || "3";
  if (puzzleSelect) puzzleSelect.value = puzzleGrid;

  // Update puzzle stats based on selected grid size
  function updatePuzzleStats() {
    if (!puzzleStatsEl || !puzzleSelect) return;

    const size = puzzleSelect.value;

    const best = localStorage.getItem(`puzzleBest_${size}`) || "--";
    const last = localStorage.getItem(`puzzleLast_${size}`) || "--";
    const total = localStorage.getItem(`puzzleTotal_${size}`) || 0;

    puzzleStatsEl.innerHTML = `
    Best Moves: ${best}<br>
    Total Played: ${total}<br>
    Last: ${last} moves
  `;

    // Save selected grid size
    sessionStorage.setItem("puzzleGrid", size);
  }

  updatePuzzleStats();
  puzzleSelect?.addEventListener("change", updatePuzzleStats);


  /* ------------------ Kuku (Color Guess) ------------------ */
  const kukuStatsEl = document.getElementById("kukuStats");
  const kukuDifficultySelect = document.getElementById("kukuDifficulty");

  // Load saved difficulty or default
  let kukuDifficulty = sessionStorage.getItem("kukuDifficulty") || "easy";
  if (kukuDifficultySelect) kukuDifficultySelect.value = kukuDifficulty;

  // Update kuku stats based on difficulty
  function updateKukuStats() {
    if (!kukuStatsEl || !kukuDifficultySelect) return;

    const diff = kukuDifficultySelect.value;

    const bestScore = parseInt(localStorage.getItem(`kukuBest_${diff}`)) || "--";
    const lastScore = localStorage.getItem(`kukuLast_${diff}`) || "--";

    const history = JSON.parse(localStorage.getItem("kukuHistory")) || [];
    const totalPlayed = parseInt(localStorage.getItem(`kukuTotal_${diff}`)) || 0;

    kukuStatsEl.innerHTML = `
    Best Score: ${bestScore} <br>
    Total Played: ${totalPlayed} <br>
    Last Score: ${lastScore}
  `;

    // Save selected difficulty
    sessionStorage.setItem("kukuDifficulty", diff);
  }

  // Initial load
  updateKukuStats();

  // Update when dropdown changes
  kukuDifficultySelect?.addEventListener("change", updateKukuStats);

  /* ------------------ Reset All Stats ------------------ */

  // Open reset confirmation modal
  window.resetAllStats = () => {
    document.getElementById("resetModal").style.display = "flex";
  };

  // Close modal
  window.closeResetModal = () => {
    document.getElementById("resetModal").style.display = "none";
  };

  // Confirm and clear all stored data
  window.confirmReset = () => {
    const keys = [
      "ticStats",
      "ticHistory",
      "memoryHistory",
      "puzzleHistory",
      "kukuHistory",
      "playerName"
    ];

    // Memory game keys (per category)
    ["fruit", "geometry"].forEach(cat => {
      keys.push(
        `memoryBestTime_${cat}`,
        `memoryBestMoves_${cat}`,
        `memoryTotalPlayed_${cat}`,
        `memoryLast_${cat}`
      );
    });

    // Puzzle game keys (per grid size)
    ["3", "4", "5"].forEach(size => {
      keys.push(
        `puzzleBest_${size}`,
        `puzzleTotal_${size}`,
        `puzzleLast_${size}`
      );
    });

    // Kuku game keys (per difficulty)
    ["easy", "medium", "hard"].forEach(diff => {
      keys.push(
        `kukuBest_${diff}`,
        `kukuLast_${diff}`,
        `kukuTotal_${diff}`
      );
    });

    // Remove all keys from localStorage
    keys.forEach(k => localStorage.removeItem(k));

    // Reload page to refresh UI
    location.reload();
  };
});