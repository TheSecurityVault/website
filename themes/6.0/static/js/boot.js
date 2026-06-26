/** boot.js — fake terminal boot sequence on the home page. */
(function () {
  'use strict';
  try {
    var boot = document.getElementById('boot');
    var log  = document.getElementById('bootLog');
    if (!boot || !log) return;

    var reduceMotion = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Each line: array of segment descriptors {cls, text} | plain string
    var LINES = [
      [{ cls: 'muted', text: 'visitor@vault' }, ':~$ ./mount --secure /dev/vault'],
      [{ cls: 'ok',   text: '[  OK  ]' }, ' decrypting payload .................. done'],
      [{ cls: 'ok',   text: '[  OK  ]' }, ' loading modules: glitch crt webgl threatmap'],
      [{ cls: 'warn', text: '[ WARN ]' }, ' intrusion detection ............... passive'],
      [{ cls: 'ok',   text: '[  OK  ]' }, ' spawning shell for visitor@vault'],
      [{ cls: 'ok',   text: 'access granted' }, ' █']
    ];

    function makeLine(parts) {
      var div = document.createElement('div');
      parts.forEach(function (part) {
        if (typeof part === 'string') {
          div.appendChild(document.createTextNode(part));
        } else {
          var span = document.createElement('span');
          span.className = part.cls;
          span.textContent = part.text;
          div.appendChild(span);
        }
      });
      return div;
    }

    if (reduceMotion) {
      boot.classList.add('is-done');
      // fire reveals + bio after boot
      document.dispatchEvent(new CustomEvent('vault:boot-done'));
      return;
    }

    var idx = 0;
    function next() {
      if (idx >= LINES.length) {
        setTimeout(function () {
          boot.classList.add('is-done');
          document.dispatchEvent(new CustomEvent('vault:boot-done'));
        }, 280);
        return;
      }
      log.appendChild(makeLine(LINES[idx]));
      idx++;
      setTimeout(next, 180 + Math.random() * 120);
    }
    next();
  } catch (e) {
    if (typeof console !== 'undefined') console.warn('[boot]', e);
    // Still fire the event so reveals/bio don't get stuck
    document.dispatchEvent(new CustomEvent('vault:boot-done'));
  }
})();
