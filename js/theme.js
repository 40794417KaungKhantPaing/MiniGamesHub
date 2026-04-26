// =========================
// GLOBAL INIT
// =========================
document.addEventListener("DOMContentLoaded", initApp);

function initApp() {
  initBurgerMenu();
  initTheme();
  initBGM();
  initVolume();
  initScrollAnimation();
  initYear();
}

// =========================
// BURGER MENU
// =========================
function initBurgerMenu() {
  const burgerBtn = document.getElementById("burgerBtn");
  const navMenu = document.getElementById("navMenu");

  if (!burgerBtn || !navMenu) return;

  // Toggle menu open/close
  burgerBtn.addEventListener("click", () => {
    navMenu.classList.toggle("active");
  });

  // Close menu when clicking any link or button inside it
  document.querySelectorAll("#navMenu a, #navMenu button")
    .forEach(el => {
      el.addEventListener("click", () => {
        navMenu.classList.remove("active");
      });
    });
}

// =========================
// THEME TOGGLE
// =========================
function initTheme() {
  const icons = document.querySelectorAll(".themeBtn i");

  // Load saved theme or default to light
  const savedTheme = localStorage.getItem("theme") || "light";
  document.body.classList.toggle("light", savedTheme === "light");

  updateThemeIcons(savedTheme === "light");

  // Expose toggle globally for button usage
  window.toggleTheme = function () {
    const isLight = document.body.classList.toggle("light");

    updateThemeIcons(isLight);
    localStorage.setItem("theme", isLight ? "light" : "dark");
  };

  // Update icon based on theme state
  function updateThemeIcons(isLight) {
    icons.forEach(icon => {
      icon.className = isLight
        ? "fa-solid fa-sun"
        : "fa-solid fa-moon";
    });
  }
}

// =========================
// BGM (MUTE + PLAY STATE)
// =========================
function initBGM() {
  const bgm = document.getElementById("bgm");
  const icons = document.querySelectorAll(".muteBtn i");

  if (!bgm) return;

  const muted = localStorage.getItem("bgmMuted") === "true";

  bgm.muted = muted;
  updateBgmIcons(muted);

  // Auto-play if not muted (browser may block autoplay)
  if (!muted) {
    bgm.play().catch(() => {});
  }

  // Expose toggle globally for button usage
  window.toggleBgm = function () {
    bgm.muted = !bgm.muted;

    localStorage.setItem("bgmMuted", bgm.muted);

    if (!bgm.muted) {
      bgm.play().catch(() => {});
    }

    updateBgmIcons(bgm.muted);
  };

  // Update volume icon state
  function updateBgmIcons(isMuted) {
    icons.forEach(icon => {
      icon.className = isMuted
        ? "fa-solid fa-volume-xmark"
        : "fa-solid fa-volume-high";
    });
  }
}

// =========================
// VOLUME SLIDER (GLOBAL FIX)
// =========================
function initVolume() {
  const bgm = document.getElementById("bgm");
  const slider = document.getElementById("volumeSlider");

  if (!bgm) return;

  // Load saved volume or default
  const savedVolume = localStorage.getItem("volume");
  const volume = savedVolume !== null ? parseFloat(savedVolume) : 0.2;

  bgm.volume = volume;

  if (slider) {
    slider.value = volume;

    // Update volume in real-time
    slider.addEventListener("input", () => {
      const value = parseFloat(slider.value);

      bgm.volume = value;
      localStorage.setItem("volume", value);
    });
  }
}

// =========================
// SCROLL ANIMATION
// =========================
function initScrollAnimation() {
  const blocks = document.querySelectorAll(".block");

  if (!blocks.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("show");
      } else {
        entry.target.classList.remove("show");
      }
    });
  }, { threshold: 0.3 });

  blocks.forEach(block => observer.observe(block));
}

// =========================
// COPYRIGHT YEAR
// =========================
function initYear() {
  const yearSpan = document.getElementById("currentYear");

  if (!yearSpan) return;

  yearSpan.textContent = new Date().getFullYear();
}

// =========================
// RANDOM GAME NAVIGATION
// =========================
function playRandom() {
  const games = [
    "html/tic.html",
    "html/memory.html",
    "html/puzzle.html",
    "html/kuku.html"
  ];

  // Pick random game and redirect
  const randomGame = games[Math.floor(Math.random() * games.length)];
  window.location.href = randomGame;
}

// =========================
// RESET SETTINGS
// =========================
function resetSettings() {
  localStorage.removeItem("theme");
  localStorage.removeItem("bgmMuted");
  localStorage.removeItem("volume");
  location.reload();
}