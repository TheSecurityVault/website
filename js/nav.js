/** nav.js — sticky nav shadow, mobile menu toggle. */
(function () {
  'use strict';
  try {
    var navbar = document.getElementById('navbar');
    var toggle = document.getElementById('navToggle');
    var menu   = document.getElementById('navMenu');
    var themeBtn = document.getElementById('themeToggle');

    if (navbar) {
      window.addEventListener('scroll', function () {
        navbar.classList.toggle('nav--scrolled', window.scrollY > 10);
      }, { passive: true });
    }

    if (toggle && menu) {
      toggle.addEventListener('click', function () {
        var open = menu.classList.toggle('nav-menu--open');
        toggle.setAttribute('aria-expanded', String(open));
      });
      menu.querySelectorAll('.nav-link').forEach(function (link) {
        link.addEventListener('click', function () {
          menu.classList.remove('nav-menu--open');
          toggle.setAttribute('aria-expanded', 'false');
        });
      });
      if (themeBtn) {
        themeBtn.addEventListener('click', function () {
          menu.classList.remove('nav-menu--open');
          toggle.setAttribute('aria-expanded', 'false');
        });
      }
    }
  } catch (e) {
    if (typeof console !== 'undefined') console.warn('[nav]', e);
  }
})();
