/** glitch.js — hover and random glitch bursts on .glitch elements. */
(function () {
  'use strict';
  try {
    var reduceMotion = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var els = document.querySelectorAll('.glitch');
    if (!els.length || reduceMotion) return;

    els.forEach(function (el) {
      el.addEventListener('mouseenter', function () { el.classList.add('is-glitching'); });
      el.addEventListener('mouseleave', function () { el.classList.remove('is-glitching'); });
    });

    setInterval(function () {
      if (document.hidden) return;
      var pick = els[(Math.random() * els.length) | 0];
      if (!pick) return;
      pick.classList.add('is-glitching');
      setTimeout(function () { pick.classList.remove('is-glitching'); }, 220);
    }, 4200);
  } catch (e) {
    if (typeof console !== 'undefined') console.warn('[glitch]', e);
  }
})();
