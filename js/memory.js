/* ---------------- MENU PAGE CATEGORY SELECTION ---------------- */
if (document.querySelector("input[name='category']")) {
  const radios = document.querySelectorAll("input[name='category']");
  let selectedCategory = sessionStorage.getItem("memoryCategory") || "fruit";

  // Category hint on menu
  const categoryHintMenu = document.getElementById("categoryHintMenu");
  if (categoryHintMenu) {
    categoryHintMenu.innerHTML = `Selected Category: <b>${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}</b>`;
  }

  radios.forEach(radio => {
    radio.checked = radio.value === selectedCategory;
    radio.addEventListener("change", () => {
      selectedCategory = radio.value;
      sessionStorage.setItem("memoryCategory", selectedCategory);
      if (categoryHintMenu) {
        categoryHintMenu.innerHTML = `Selected Category: <b>${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}</b>`;
      }
    });
  });

  const startBtn = document.getElementById("startBtn");
  if (startBtn) {
    startBtn.addEventListener("click", () => {
      sessionStorage.setItem("memoryCategory", selectedCategory);
      window.location.href = "memoryGame.html";
    });
  }

  /* ---------------- LAST 5 GAMES HISTORY (Menu) ---------------- */
  const memoryHistoryList = document.getElementById("memoryHistoryList");
  if (memoryHistoryList) {
    const memoryHistory = JSON.parse(localStorage.getItem("memoryHistory")) || [];
    memoryHistoryList.innerHTML = memoryHistory.map(game => {
      return `<li>Category: <b>${game.category.charAt(0).toUpperCase() + game.category.slice(1)}</b> - Time: <b>${game.time}s</b> | Moves: <b>${game.moves}</b> (${game.date})</li>`;
    }).join('');
  }
}

/* ---------------- MEMORY GAME PAGE ---------------- */
if (document.getElementById("memory")) {
  /* ---------------- DATA ---------------- */
  const fruit = [
    "../assets/img/fruit/apple.png", "../assets/img/fruit/banana.png", "../assets/img/fruit/strawberry.png",
    "../assets/img/fruit/pineapple.png", "../assets/img/fruit/kiwi.png", "../assets/img/fruit/cherry.png",
    "../assets/img/fruit/watermelon.png", "../assets/img/fruit/orange.png", "../assets/img/fruit/mango.png"
  ];
  const geometry = [
    "../assets/img/geometry/triangle.png", "../assets/img/geometry/circle.png", "../assets/img/geometry/square.png",
    "../assets/img/geometry/star.png", "../assets/img/geometry/diamond.png", "../assets/img/geometry/rhombus.png",
    "../assets/img/geometry/hexagon.png", "../assets/img/geometry/octagon.png", "../assets/img/geometry/pentagon.png"
  ];

  /* ---------------- ELEMENTS ---------------- */
  const board = document.getElementById("memory");
  const timeText = document.getElementById("time");
  const moveText = document.getElementById("moves");
  const bestText = document.getElementById("best");
  const resultModal = document.getElementById("resultModal");
  const resultText = document.getElementById("resultText");
  const resultStats = document.getElementById("resultStats");
  const categoryHint = document.getElementById("categoryHint");
  const clickSound = document.getElementById("clickSound");
  const correctSound = document.getElementById("correctSound");
  const winSound = document.getElementById("winSound");

  /* ---------------- CATEGORY ---------------- */
  let current = sessionStorage.getItem("memoryCategory") || "fruit";
  if (categoryHint) {
    categoryHint.innerHTML = `Category: <b>${current.charAt(0).toUpperCase() + current.slice(1)}</b>`;
  }

  /* ---------------- GAME STATE ---------------- */
  let first = null, lock = false, matches = 0, moves = 0, time = 0, timer = null, gameStarted = false;

  /* ---------------- GRID ---------------- */
  function getGrid() {
    return window.innerWidth <= 600 ? { rows: 6, cols: 3 } : { rows: 3, cols: 6 };
  }
  function getSize() {
    const { rows, cols } = getGrid(); return rows * cols;
  }

  /* ---------------- STORAGE ---------------- */
  let bestTime = JSON.parse(localStorage.getItem(`memoryBestTime_${current}`)) ?? null;
  let bestMoves = JSON.parse(localStorage.getItem(`memoryBestMoves_${current}`)) ?? null;
  let totalPlayed = JSON.parse(localStorage.getItem(`memoryTotalPlayed_${current}`)) ?? 0;
  let lastGame = JSON.parse(localStorage.getItem(`memoryLast_${current}`)) ?? { time: "--", moves: "--" };

  /* ---------------- UTILS ---------------- */
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));[arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  function startTimer() {
    clearInterval(timer); timer = setInterval(() => { time++; timeText.textContent = time; saveGameState(); }, 1000);
  }
  function resetStats() {
    clearInterval(timer); time = 0; moves = 0; matches = 0; first = null; lock = false; gameStarted = false; timeText.textContent = "0"; moveText.textContent = "0";
  }

  /* ---------------- SAVE / LOAD SESSION ---------------- */
  function saveGameState() {
    const boardState = Array.from(board.children).map(card => ({
      icon: card.dataset.icon,
      flipped: card.classList.contains("flip"),
      matched: card.classList.contains("matched")
    }));

    const state = {
      boardState,
      firstCardIndex: first ? Array.from(board.children).indexOf(first) : null,
      lock,
      matches,
      moves,
      time,
      gameStarted
    };

    sessionStorage.setItem(`memoryState_${current}`, JSON.stringify(state));
  }

  function loadGameState() {
    const state = JSON.parse(sessionStorage.getItem(`memoryState_${current}`));
    if (!state) return false;

    board.innerHTML = "";
    const { cols } = getGrid();
    board.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

    state.boardState.forEach((c, i) => {
      const card = document.createElement("div");
      card.className = "cell";
      card.dataset.icon = c.icon;
      card.innerHTML = `<div class="card-face front">?</div><div class="card-face back"><img src="${c.icon}" class="card-img"></div>`;
      if (c.flipped) card.classList.add("flip");
      if (c.matched) card.classList.add("matched");
      card.onclick = () => flip(card);
      board.appendChild(card);
    });

    first = state.firstCardIndex !== null ? board.children[state.firstCardIndex] : null;
    lock = state.lock;
    matches = state.matches;
    moves = state.moves;
    time = state.time;
    gameStarted = state.gameStarted;

    moveText.textContent = moves;
    timeText.textContent = time;
    if (gameStarted) startTimer();

    return true;
  }

  /* ---------------- BUILD BOARD ---------------- */
  function buildBoard() {
    board.innerHTML = "";
    const { cols } = getGrid();
    board.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

    const base = current === "fruit" ? fruit : geometry;
    let icons = shuffle([...base.slice(0, getSize() / 2)]);
    icons = shuffle([...icons, ...icons]);

    icons.forEach(icon => {
      const card = document.createElement("div");
      card.className = "cell";
      card.dataset.icon = icon;
      card.innerHTML = `<div class="card-face front">?</div><div class="card-face back"><img src="${icon}" class="card-img"></div>`;
      card.onclick = () => flip(card);
      board.appendChild(card);
    });
  }

  /* ---------------- GAME LOGIC ---------------- */
  function flip(card) {
    if (lock || card.classList.contains("flip") || card.classList.contains("matched")) return;
    clickSound.play(); // Play click sound

    if (!gameStarted) { startTimer(); gameStarted = true; }

    card.classList.add("flip");
    if (!first) { first = card; saveGameState(); return; }

    moves++; moveText.textContent = moves; lock = true;

    if (first.dataset.icon === card.dataset.icon) {
      first.classList.add("matched");
      card.classList.add("matched");
      correctSound.play(); // Play correct sound
      matches++; first = null; lock = false;
      if (matches === getSize() / 2) endGame();
      saveGameState();
    } else {
      setTimeout(() => {
        first.classList.remove("flip");
        card.classList.remove("flip");
        first = null; lock = false;
        saveGameState();
      }, 800);
    }
  }

  /* ---------------- END GAME ---------------- */
  function endGame() {
    clearInterval(timer);
    sessionStorage.removeItem(`memoryState_${current}`);

    totalPlayed++; localStorage.setItem(`memoryTotalPlayed_${current}`, JSON.stringify(totalPlayed));
    lastGame = { time, moves }; localStorage.setItem(`memoryLast_${current}`, JSON.stringify(lastGame));

    if (!bestTime || time < bestTime) { bestTime = time; localStorage.setItem(`memoryBestTime_${current}`, JSON.stringify(bestTime)); }
    if (!bestMoves || moves < bestMoves) { bestMoves = moves; localStorage.setItem(`memoryBestMoves_${current}`, JSON.stringify(bestMoves)); }

    updateBestText();
    resultText.textContent = "You Win!";
    resultStats.textContent = `Time: ${time}s | Moves: ${moves}`;
    resultModal.style.display = "flex";

    winSound.play(); // Play win sound

    // ---------------- LAST 5 GAMES HISTORY ----------------
    let memoryHistory = JSON.parse(localStorage.getItem("memoryHistory")) || [];
    memoryHistory.unshift({
      date: new Date().toLocaleString(),
      category: current,
      time,
      moves
    });
    if (memoryHistory.length > 5) memoryHistory.pop();
    localStorage.setItem("memoryHistory", JSON.stringify(memoryHistory));
  }

  /* ---------------- UI ---------------- */
  function updateBestText() {
    bestText.textContent = `Best Time: ${bestTime ?? "--"}s | Best Moves: ${bestMoves ?? "--"} | Total Played: ${totalPlayed} | Last: ${lastGame.time}s / ${lastGame.moves} moves`;
  }

  /* ---------------- RESET / MENU ---------------- */
  function reset() {
    sessionStorage.removeItem(`memoryState_${current}`);
    resetStats(); location.reload();
  }
  function goToMenu() {
    sessionStorage.removeItem(`memoryState_${current}`);
    resetStats();

    window.location.replace('memory.html');
  }

  /* ---------------- INIT ---------------- */
  if (!loadGameState()) buildBoard();
  updateBestText();

  /* ---------------- RESPONSIVE ---------------- */
  let lastLayout = getGrid().cols;
  window.addEventListener("resize", () => {
    const currentLayout = getGrid().cols;
    if (currentLayout !== lastLayout) { lastLayout = currentLayout; reset(); }
  });
}