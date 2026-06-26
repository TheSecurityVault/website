/** bio.js — character-by-character typed hero bio animation.
 *  On the home page, waits for the boot sequence to finish first. */
(function () {
  'use strict';
  try {
    function init() {
      var bio = document.getElementById('heroBio');
      if (!bio) return;

      var full = bio.getAttribute('data-type') || bio.textContent;
      var reduceMotion = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var isTouch = window.matchMedia && window.matchMedia('(hover: none)').matches;

      if (reduceMotion || isTouch) { bio.textContent = full; return; }

      var i = 0, done = false;
      bio.textContent = '';
      var caret = document.createElement('span');
      caret.className = 'type-caret';
      bio.appendChild(caret);

      function finish() {
        if (done) return;
        done = true;
        bio.textContent = full;
        var c = document.createElement('span');
        c.className = 'type-caret';
        bio.appendChild(c);
        window.removeEventListener('scroll', finish);
        window.removeEventListener('click', finish);
      }
      function step() {
        if (done) return;
        if (i <= full.length) {
          bio.textContent = full.slice(0, i);
          bio.appendChild(caret);
          i++;
          setTimeout(step, 7);
        } else { done = true; }
      }
      window.addEventListener('scroll', finish, { passive: true, once: true });
      window.addEventListener('click', finish, { once: true });
      step();
    }

    var isHome  = document.documentElement.getAttribute('data-page') === 'home';
    var hasBoot = !!document.getElementById('boot');

    if (isHome && hasBoot) {
      document.addEventListener('vault:boot-done', init, { once: true });
    } else if (isHome) {
      init();
    }
  } catch (e) {
    if (typeof console !== 'undefined') console.warn('[bio]', e);
  }
})();
