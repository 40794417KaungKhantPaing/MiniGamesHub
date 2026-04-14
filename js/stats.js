document.addEventListener("DOMContentLoaded", () => {
  /* ------------------ Tic Tac Toe ------------------ */
  const tttStatsEl = document.getElementById("tttStats");
  const tttStats = JSON.parse(localStorage.getItem("ticStats")) || { win: 0, lose: 0, draw: 0, played: 0 };
  const tttLast = JSON.parse(localStorage.getItem("ticHistory"))?.[0] || { result: "--", player: "--" };
  const tttWinRate = tttStats.played ? ((tttStats.win / tttStats.played) * 100).toFixed(1) : 0;

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
  function updateMemoryStats() {
    if (!memoryCategorySelect || !memoryStatsEl) return;

    const cat = memoryCategorySelect.value;

    const bestTime = JSON.parse(localStorage.getItem(`memoryBestTime_${cat}`)) ?? "--";
    const bestMoves = JSON.parse(localStorage.getItem(`memoryBestMoves_${cat}`)) ?? "--";
    const totalPlayed = JSON.parse(localStorage.getItem(`memoryTotalPlayed_${cat}`)) ?? 0;
    const lastGame = JSON.parse(localStorage.getItem(`memoryLast_${cat}`)) ?? { time: "--", moves: "--" };

    memoryStatsEl.innerHTML = `
        Best Time: ${bestTime}s<br>
        Best Moves: ${bestMoves}<br>
        Total Played: ${totalPlayed}<br>
        Last: ${lastGame.time}s / ${lastGame.moves} moves
    `;

    // Save selected category in sessionStorage for page reload
    sessionStorage.setItem("memoryCategory", cat);
  }

  memoryCategorySelect?.addEventListener("change", updateMemoryStats);
  updateMemoryStats(); // initial load

  /* ------------------ Puzzle Dropdown ------------------ */
  const puzzleStatsEl = document.getElementById("puzzleStats");
  const puzzleSelect = document.getElementById("puzzleGridSelect");

  // Load saved or default
  let puzzleGrid = sessionStorage.getItem("puzzleGrid") || "3";
  if (puzzleSelect) puzzleSelect.value = puzzleGrid;

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

  function updateKukuStats() {
    if (!kukuStatsEl || !kukuDifficultySelect) return;

    const diff = kukuDifficultySelect.value;

    const bestScore = parseInt(localStorage.getItem(`kukuBest_${diff}`)) || "--";
    const lastScore = localStorage.getItem(`kukuLast_${diff}`) || "--";

    const history = JSON.parse(localStorage.getItem("kukuHistory")) || [];
    const totalPlayed = history.filter(h => h.difficulty === diff).length;

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
  window.resetAllStats = () => {
    if (confirm("Are you sure you want to reset all game stats?")) {

      const keysToRemove = [
        "ticStats", "ticHistory",
        "memoryHistory",
        "memoryBestTime_fruit", "memoryBestMoves_fruit", "memoryTotalPlayed_fruit", "memoryLast_fruit",
        "memoryBestTime_geometry", "memoryBestMoves_geometry", "memoryTotalPlayed_geometry", "memoryLast_geometry",
        "puzzleBest_3", "puzzleTotal_3", "puzzleLast_3", "puzzleBest_4", "puzzleTotal_4", "puzzleLast_4", "puzzleBest_5", "puzzleTotal_5", "puzzleLast_5", "puzzleHistory",
        "kukuHistory", "kukuBest_easy", "kukuLast_easy", "kukuBest_medium", "kukuLast_medium", "kukuBest_hard", "kukuLast_hard"
      ];

      keysToRemove.forEach(key => localStorage.removeItem(key));

      location.reload();
    }
  };
});