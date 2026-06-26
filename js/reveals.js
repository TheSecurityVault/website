/** reveals.js — IntersectionObserver scroll-reveal for [data-reveal] elements.
 *  On the home page, waits for the boot sequence to finish first. */
(function () {
  'use strict';
  try {
    function init() {
      var nodes = document.querySelectorAll('[data-reveal]');
      if (!nodes.length) return;

      var reduceMotion = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (reduceMotion || !('IntersectionObserver' in window)) {
        nodes.forEach(function (n) { n.classList.add('is-visible'); });
        return;
      }

      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el    = entry.target;
          var delay = parseInt(el.getAttribute('data-reveal-delay') || '0', 10);
          setTimeout(function () { el.classList.add('is-visible'); }, delay);
          io.unobserve(el);
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

      nodes.forEach(function (n) { io.observe(n); });
    }

    var isHome = document.documentElement.getAttribute('data-page') === 'home';
    var hasBoot = !!document.getElementById('boot');

    if (isHome && hasBoot) {
      document.addEventListener('vault:boot-done', init, { once: true });
    } else {
      init();
    }
  } catch (e) {
    if (typeof console !== 'undefined') console.warn('[reveals]', e);
  }
})();
