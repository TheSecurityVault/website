/**
 * The Security Vault — theme 6.0 (terminal / glitch world)
 * UI layer: nav, search overlay, boot sequence, glitch bursts,
 * typed hero bio, scroll reveals, heading anchors, external links.
 */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isTouch = window.matchMedia && window.matchMedia('(hover: none)').matches;

  // ─── Nav: sticky shadow + mobile toggle + search overlay ──────────────────
  var navbar = document.getElementById('navbar');
  var toggle = document.getElementById('navToggle');
  var menu = document.getElementById('navMenu');
  var searchOpen = document.getElementById('searchOpen');
  var searchOverlay = document.getElementById('searchOverlay');
  var searchClose = document.getElementById('searchClose');
  var searchInput = document.getElementById('search');

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
  }

  if (searchOpen && searchOverlay) {
    var openSearch = function () {
      searchOverlay.classList.add('search-overlay--open');
      document.body.style.overflow = 'hidden';
      setTimeout(function () { if (searchInput) searchInput.focus(); }, 100);
    };
    var closeSearch = function () {
      searchOverlay.classList.remove('search-overlay--open');
      document.body.style.overflow = '';
    };
    searchOpen.addEventListener('click', openSearch);
    if (searchClose) searchClose.addEventListener('click', closeSearch);
    searchOverlay.addEventListener('click', function (e) {
      if (e.target === searchOverlay) closeSearch();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeSearch();
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); openSearch(); }
    });
  }

  // ─── Scroll reveals (IntersectionObserver) ────────────────────────────────
  function initReveals() {
    var nodes = document.querySelectorAll('[data-reveal]');
    if (!nodes.length) return;

    if (reduceMotion || !('IntersectionObserver' in window)) {
      nodes.forEach(function (n) { n.classList.add('is-visible'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var delay = parseInt(el.getAttribute('data-reveal-delay') || '0', 10);
        setTimeout(function () { el.classList.add('is-visible'); }, delay);
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

    nodes.forEach(function (n) { io.observe(n); });
  }

  // ─── Glitch bursts (occasional, on hover + random) ────────────────────────
  function initGlitch() {
    var els = document.querySelectorAll('.glitch');
    if (!els.length || reduceMotion) return;

    els.forEach(function (el) {
      el.addEventListener('mouseenter', function () {
        el.classList.add('is-glitching');
      });
      el.addEventListener('mouseleave', function () {
        el.classList.remove('is-glitching');
      });
    });

    // Random burst on a random visible glitch element
    setInterval(function () {
      if (document.hidden) return;
      var pick = els[Math.floor(Math.random() * els.length)];
      if (!pick) return;
      pick.classList.add('is-glitching');
      setTimeout(function () { pick.classList.remove('is-glitching'); }, 220);
    }, 4200);
  }

  // ─── Typed hero bio (skippable) ───────────────────────────────────────────
  function typeBio() {
    var bio = document.getElementById('heroBio');
    if (!bio) return;
    var full = bio.getAttribute('data-type') || bio.textContent;

    if (reduceMotion || isTouch) {
      bio.textContent = full;
      return;
    }

    var i = 0, done = false;
    bio.textContent = '';
    var caret = document.createElement('span');
    caret.className = 'type-caret';
    caret.textContent = '█';
    bio.appendChild(caret);

    function finish() {
      if (done) return;
      done = true;
      bio.textContent = full;
      var c = document.createElement('span');
      c.className = 'type-caret';
      c.textContent = '█';
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
      } else {
        done = true;
      }
    }

    // Let the user skip the typing
    window.addEventListener('scroll', finish, { passive: true, once: true });
    window.addEventListener('click', finish, { once: true });
    step();
  }

  // ─── Boot sequence (home only) ────────────────────────────────────────────
  function runBoot(then) {
    var boot = document.getElementById('boot');
    var log = document.getElementById('bootLog');
    if (!boot || !log) { if (then) then(); return; }

    var lines = [
      '<span class="muted">visitor@vault</span>:~$ ./mount --secure /dev/vault',
      '<span class="ok">[  OK  ]</span> decrypting payload .................. done',
      '<span class="ok">[  OK  ]</span> loading modules: glitch crt webgl threatmap',
      '<span class="warn">[ WARN ]</span> intrusion detection ............... passive',
      '<span class="ok">[  OK  ]</span> spawning shell for visitor@vault',
      '<span class="ok">access granted</span> █'
    ];

    if (reduceMotion) {
      boot.classList.add('is-done');
      if (then) then();
      return;
    }

    var idx = 0;
    function next() {
      if (idx >= lines.length) {
        setTimeout(function () {
          boot.classList.add('is-done');
          if (then) then();
        }, 280);
        return;
      }
      log.innerHTML += lines[idx] + '\n';
      idx++;
      setTimeout(next, 180 + Math.random() * 120);
    }
    next();
  }

  // ─── External links → new tab + heading anchors ───────────────────────────
  function initContentEnhancements() {
    document.querySelectorAll('a[href]').forEach(function (a) {
      var href = a.getAttribute('href');
      if (href && href.indexOf('http') === 0 && href.indexOf(window.location.origin) !== 0) {
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener noreferrer');
      }
    });

    document.querySelectorAll('.prose h2, .prose h3, .prose h4').forEach(function (h) {
      if (!h.id) return;
      var a = document.createElement('a');
      a.href = '#' + h.id;
      a.className = 'heading-anchor';
      a.setAttribute('aria-hidden', 'true');
      a.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>';
      h.appendChild(a);
    });
  }

  // ─── Interactive terminal navigation ──────────────────────────────────────
  function initNavTerm() {
    var form = document.getElementById('navTermForm');
    var input = document.getElementById('navTerm');
    var out = document.getElementById('navTermOut');
    var pathEl = document.getElementById('navTermPath');
    if (!form || !input || !out) return;

    var ROUTES = {
      'home': '/', '~': '/', '/': '/', '..': '/', 'root': '/',
      'about': '/#about', 'whoami': '/#about', 'me': '/#about',
      'projects': '/#projects', 'tools': '/#projects',
      'posts': '/posts/', 'logs': '/posts/', 'blog': '/posts/', 'articles': '/posts/',
      'search': '/search/', 'grep': '/search/'
    };

    // Reflect current location in the prompt path
    if (pathEl) {
      var p = window.location.pathname;
      if (p.indexOf('/posts') === 0) pathEl.textContent = '~/logs';
      else if (p.indexOf('/search') === 0) pathEl.textContent = '~/search';
      else if (p !== '/') pathEl.textContent = '~' + p.replace(/\/$/, '');
    }

    var hideTimer;
    function show(html, sticky) {
      out.innerHTML = html;
      out.classList.add('is-active');
      clearTimeout(hideTimer);
      if (!sticky) hideTimer = setTimeout(function () { out.classList.remove('is-active'); }, 6500);
    }
    function go(url) { window.location.href = url; }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var raw = input.value.trim();
      if (!raw) return;
      var parts = raw.split(/\s+/);
      var cmd = parts[0].toLowerCase();
      var arg = parts.slice(1).join(' ');

      // grep / search <term>
      if ((cmd === 'grep' || cmd === 'search') && arg) {
        go('/search/?q=' + encodeURIComponent(arg));
        return;
      }
      // cd <target>
      if (cmd === 'cd') {
        var dest = (parts[1] || '~').toLowerCase().replace(/^\.?\//, '').replace(/\/$/, '') || '~';
        if (ROUTES[dest] !== undefined) { go(ROUTES[dest]); return; }
        show('<span class="err">cd: ' + escapeHtml(parts[1] || '') + ': no such directory</span>');
        return;
      }
      // bare target (e.g. "about", "posts")
      if (ROUTES[cmd] !== undefined && parts.length === 1) { go(ROUTES[cmd]); return; }

      switch (cmd) {
        case 'help':
          show('<span class="muted">available commands:</span><br>' +
            '<span class="ok">cd</span> &lt;dir&gt; · <span class="ok">ls</span> · ' +
            '<span class="ok">grep</span> &lt;term&gt; · <span class="ok">pwd</span> · ' +
            '<span class="ok">clear</span><br>' +
            '<span class="muted">dirs:</span> ' +
            '<a href="/#about">about</a> <a href="/#projects">projects</a> ' +
            '<a href="/posts/">logs</a> <a href="/search/">search</a>', true);
          break;
        case 'ls':
          show('<a href="/#about">about/</a>&nbsp;&nbsp; <a href="/#projects">projects/</a>&nbsp;&nbsp; ' +
            '<a href="/posts/">logs/</a>&nbsp;&nbsp; <a href="/search/">search/</a>', true);
          break;
        case 'pwd':
          show('<span class="ok">' + escapeHtml(window.location.pathname) + '</span>');
          break;
        case 'whoami':
          show('<span class="ok">visitor</span>');
          break;
        case 'hostname':
          show('<span class="ok">' + escapeHtml(window.location.hostname || 'thesecurityvault') + '</span>');
          break;
        case 'echo':
          show(escapeHtml(arg));
          break;
        case 'clear':
          out.classList.remove('is-active');
          break;
        case 'sudo':
          show('<span class="err">visitor is not in the sudoers file. This incident will be reported.</span>');
          break;
        default:
          show('<span class="err">bash: ' + escapeHtml(cmd) + ': command not found</span> ' +
            '<span class="muted">— try \'help\'</span>');
      }
      input.value = '';
    });

    out.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') out.classList.remove('is-active');
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ─── Background preview switcher ──────────────────────────────────────────
  function initBgSwitch() {
    var sel = document.getElementById('bgSelect');
    if (!sel) return;
    var current = 'matrix';
    try {
      var canvasEl = document.getElementById('bg-canvas');
      current = localStorage.getItem('tsv-bg') || (canvasEl && canvasEl.getAttribute('data-bg')) || 'matrix';
    } catch (e) {}
    sel.value = current;
    sel.addEventListener('change', function () {
      var m = sel.value;
      try { localStorage.setItem('tsv-bg', m); } catch (e) {}
      // reload so the engine re-initialises in the chosen mode
      window.location.href = window.location.pathname + '?bg=' + m + window.location.hash;
    });
  }

  // ─── Parallax (subtle; respects reduced-motion) ───────────────────────────
  function initParallax() {
    if (reduceMotion) return;
    var nodes = document.querySelectorAll('[data-parallax]');
    if (!nodes.length) return;
    var ticking = false;
    function apply() {
      var y = window.scrollY;
      nodes.forEach(function (n) {
        var f = parseFloat(n.getAttribute('data-parallax')) || 0;
        n.style.transform = 'translate3d(0,' + (y * f).toFixed(1) + 'px,0)';
      });
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { requestAnimationFrame(apply); ticking = true; }
    }, { passive: true });
    apply();
  }

  // ─── Boot ─────────────────────────────────────────────────────────────────
  function start() {
    initContentEnhancements();
    initGlitch();
    initNavTerm();
    initBgSwitch();
    initParallax();
    var isHome = document.documentElement.getAttribute('data-page') === 'home';
    function go() { initReveals(); if (isHome) typeBio(); }
    if (document.getElementById('boot')) { runBoot(go); } else { go(); }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
