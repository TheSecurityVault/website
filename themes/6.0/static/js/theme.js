/** theme.js — theme management. Exposes window.__vault.theme. */
(function () {
  'use strict';
  try {
    function getEffectiveTheme() {
      var attr = document.documentElement.getAttribute('data-theme');
      if (attr === 'dark' || attr === 'light') return attr;
      return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
        ? 'dark' : 'light';
    }
    function setTheme(mode) {
      if (mode === 'auto') {
        localStorage.removeItem('theme');
        document.documentElement.removeAttribute('data-theme');
      } else {
        localStorage.setItem('theme', mode);
        document.documentElement.setAttribute('data-theme', mode);
      }
      updateBtn();
    }
    function updateBtn() {
      var btn = document.getElementById('themeToggle');
      if (!btn) return;
      var isDark = getEffectiveTheme() === 'dark';
      btn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    }
    function toggleTheme() {
      setTheme(getEffectiveTheme() === 'dark' ? 'light' : 'dark');
    }

    window.__vault = window.__vault || {};
    window.__vault.theme = { get: getEffectiveTheme, set: setTheme, toggle: toggleTheme };

    var btn = document.getElementById('themeToggle');
    if (btn) {
      btn.addEventListener('click', toggleTheme);
      updateBtn();
    }
  } catch (e) {
    if (typeof console !== 'undefined') console.warn('[theme]', e);
  }
})();
