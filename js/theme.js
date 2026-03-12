// Burger Menu Toggle
const burgerBtn = document.getElementById("burgerBtn");
const navMenu = document.getElementById("navMenu");

burgerBtn.addEventListener("click", () => {
  navMenu.classList.toggle("active");
});

// Close menu after click (mobile UX)
document.querySelectorAll("#navMenu a, #navMenu button")
  .forEach(el => {
    el.addEventListener("click", () => {
      navMenu.classList.remove("active");
    });
  });

// Theme Toggle Button 
function toggleTheme() {
  const icons = document.querySelectorAll("#themeBtn i");

  document.body.classList.toggle("light");

  const isLight = document.body.classList.contains("light");

  icons.forEach(icon => {
    icon.className = isLight
      ? "fa-solid fa-sun"
      : "fa-solid fa-moon";
  });

  localStorage.setItem("theme", isLight ? "light" : "dark");
}
// Set theme on page load
document.addEventListener("DOMContentLoaded", () => {
  const icons = document.querySelectorAll("#themeBtn i");

  const savedTheme = localStorage.getItem("theme") || "light"; // default light
  document.body.classList.toggle("light", savedTheme === "light");

  icons.forEach(icon => {
    icon.className = savedTheme === "light"
      ? "fa-solid fa-sun"
      : "fa-solid fa-moon";
  });
});

// BGM (Background Music)
function toggleBgm() {
  const bgm = document.getElementById("bgm");
  const icons = document.querySelectorAll("#muteBtn i");

  if (!bgm || !icons.length) return;

  bgm.muted = !bgm.muted;

  if (!bgm.muted) {
    bgm.play().catch(() => { });
  }

  icons.forEach(icon => {
    icon.className = bgm.muted
      ? "fa-solid fa-volume-xmark"
      : "fa-solid fa-volume-high";
  });

  localStorage.setItem("bgmMuted", bgm.muted);
}
// Set BGM state on page load
document.addEventListener("DOMContentLoaded", () => {
  const bgm = document.getElementById("bgm");
  const icons = document.querySelectorAll("#muteBtn i");

  const muted = localStorage.getItem("bgmMuted") !== "false";

  if (bgm) {
    bgm.muted = muted;
    bgm.play().catch(() => { });
  }

  icons.forEach(icon => {
    icon.className = muted
      ? "fa-solid fa-volume-xmark"
      : "fa-solid fa-volume-high";
  });
});

// Scroll Animation using Intersection Observer
const blocks = document.querySelectorAll('.block');
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('show');
    } else {
      entry.target.classList.remove('show'); // RESET animation
    }
  });
}, {
  threshold: 0.3
});
// Observe each block
blocks.forEach(block => observer.observe(block));
function playRandom() {
  const games = ['tic.html', 'memory.html', 'puzzle.html', 'kuku.html'];
  const randomGame = games[Math.floor(Math.random() * games.length)];
  window.location.href = randomGame;
}

// Auto update copyright year
document.addEventListener("DOMContentLoaded", () => {
  const yearSpan = document.getElementById("currentYear");
  const currentYear = new Date().getFullYear();
  yearSpan.textContent = currentYear;
});

// Volume Slider in Settings
document.addEventListener("DOMContentLoaded", () => {
  const bgm = document.getElementById("bgm");
  const slider = document.getElementById("volumeSlider");

  if (!bgm || !slider) return;

  const savedVolume = localStorage.getItem("volume") || 0.2;

  bgm.volume = savedVolume;
  slider.value = savedVolume;

  slider.addEventListener("input", () => {
    bgm.volume = slider.value;
    localStorage.setItem("volume", slider.value);
  });
});

// Reset all settings
function resetSettings() {
  localStorage.removeItem("theme");
  localStorage.removeItem("bgmMuted");
  location.reload();
}





