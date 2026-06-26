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

  // ─── Theme management ──────────────────────────────────────────────────────
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
    updateThemeButton();
  }

  function toggleTheme() {
    setTheme(getEffectiveTheme() === 'dark' ? 'light' : 'dark');
  }

  function updateThemeButton() {
    var btn = document.getElementById('themeToggle');
    if (!btn) return;
    var isDark = getEffectiveTheme() === 'dark';
    btn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
  }

  // ─── Nav: sticky shadow + mobile toggle + search overlay ──────────────────
  var navbar = document.getElementById('navbar');
  var toggle = document.getElementById('navToggle');
  var menu = document.getElementById('navMenu');
  var searchOpen = document.getElementById('searchOpen');
  var searchOverlay = document.getElementById('searchOverlay');
  var searchClose = document.getElementById('searchClose');
  var searchInput = document.getElementById('search');
  var themeBtn = document.getElementById('themeToggle');

  if (navbar) {
    window.addEventListener('scroll', function () {
      navbar.classList.toggle('nav--scrolled', window.scrollY > 10);
    }, { passive: true });
  }

  if (themeBtn) {
    themeBtn.addEventListener('click', toggleTheme);
    updateThemeButton();
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
    // close mobile menu when theme button is clicked
    if (themeBtn) {
      themeBtn.addEventListener('click', function () {
        menu.classList.remove('nav-menu--open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    }
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

    // Each line: array of [className, text] pairs. className='' → plain text node.
    var lines = [
      [['muted','visitor@vault'], ['','':~$ ./mount --secure /dev/vault']],
      [['ok','[  OK  ]'], ['', ' decrypting payload .................. done']],
      [['ok','[  OK  ]'], ['', ' loading modules: glitch crt webgl threatmap']],
      [['warn','[ WARN ]'], ['', ' intrusion detection ............... passive']],
      [['ok','[  OK  ]'], ['', ' spawning shell for visitor@vault']],
      [['ok','access granted'], ['', ' █']]
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
      var row = document.createElement('span');
      var parts = lines[idx];
      for (var pi = 0; pi < parts.length; pi++) {
        var cls = parts[pi][0], txt = parts[pi][1];
        if (cls) {
          var sp = document.createElement('span');
          sp.className = cls;
          sp.appendChild(document.createTextNode(txt));
          row.appendChild(sp);
        } else {
          row.appendChild(document.createTextNode(txt));
        }
      }
      row.appendChild(document.createTextNode('\n'));
      log.appendChild(row);
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
      var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', '16'); svg.setAttribute('height', '16');
      svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('fill', 'none');
      svg.setAttribute('stroke', 'currentColor'); svg.setAttribute('stroke-width', '2');
      svg.setAttribute('stroke-linecap', 'round'); svg.setAttribute('stroke-linejoin', 'round');
      var p1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      p1.setAttribute('d', 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71');
      var p2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      p2.setAttribute('d', 'M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71');
      svg.appendChild(p1); svg.appendChild(p2);
      a.appendChild(svg);
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
      'posts': '/posts/', 'blog': '/posts/', 'articles': '/posts/',
      'search': '/search/', 'grep': '/search/'
    };

    // Reflect current location in the prompt path (kept SHORT so it never
    // overflows the bar — long slugs used to push the input off-screen)
    if (pathEl) {
      var p = window.location.pathname;
      if (p === '/') pathEl.textContent = '~';
      else if (p.indexOf('/posts') === 0) pathEl.textContent = '~/posts';
      else if (p.indexOf('/search') === 0) pathEl.textContent = '~/search';
      else if (p.indexOf('/about') === 0) pathEl.textContent = '~/about';
      else pathEl.textContent = '~/posts';
    }

    // Click anywhere on the prompt focuses the input (type from any page)
    form.addEventListener('click', function (e) { if (e.target !== input) input.focus(); });

    var hideTimer;

    // Build a <span> with a class and text
    function sp(cls, text) {
      var el = document.createElement('span');
      if (cls) el.className = cls;
      el.appendChild(document.createTextNode(text));
      return el;
    }
    // Build an <a> link
    function lnk(href, text) {
      var el = document.createElement('a');
      el.href = href;
      el.appendChild(document.createTextNode(text));
      return el;
    }

    function show(frag, sticky) {
      while (out.firstChild) out.removeChild(out.firstChild);
      if (frag instanceof Node) {
        out.appendChild(frag);
      } else {
        out.appendChild(document.createTextNode(String(frag)));
      }
      out.classList.add('is-active');
      clearTimeout(hideTimer);
      if (!sticky) hideTimer = setTimeout(function () { out.classList.remove('is-active'); }, 6500);
    }

    function go(url) { window.location.href = url; }

    function runCmd() {
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
        var f0 = document.createDocumentFragment();
        f0.appendChild(sp('err', 'cd: ' + (parts[1] || '') + ': no such directory'));
        show(f0);
        return;
      }
      // bare target (e.g. "about", "posts")
      if (ROUTES[cmd] !== undefined && parts.length === 1) { go(ROUTES[cmd]); return; }

      var frag = document.createDocumentFragment();
      switch (cmd) {
        case 'help': {
          frag.appendChild(sp('muted', 'available commands:'));
          frag.appendChild(document.createElement('br'));
          frag.appendChild(sp('ok', 'cd')); frag.appendChild(document.createTextNode(' <dir> · '));
          frag.appendChild(sp('ok', 'ls')); frag.appendChild(document.createTextNode(' · '));
          frag.appendChild(sp('ok', 'grep')); frag.appendChild(document.createTextNode(' <term> · '));
          frag.appendChild(sp('ok', 'pwd')); frag.appendChild(document.createTextNode(' · '));
          frag.appendChild(sp('ok', 'theme')); frag.appendChild(document.createTextNode(' <dark|light|auto> · '));
          frag.appendChild(sp('ok', 'clear'));
          frag.appendChild(document.createElement('br'));
          frag.appendChild(sp('muted', 'dirs: '));
          frag.appendChild(lnk('/#about', 'about')); frag.appendChild(document.createTextNode(' '));
          frag.appendChild(lnk('/#projects', 'projects')); frag.appendChild(document.createTextNode(' '));
          frag.appendChild(lnk('/posts/', 'posts')); frag.appendChild(document.createTextNode(' '));
          frag.appendChild(lnk('/search/', 'search'));
          show(frag, true);
          break;
        }
        case 'ls': {
          frag.appendChild(lnk('/#about', 'about/')); frag.appendChild(document.createTextNode('  '));
          frag.appendChild(lnk('/#projects', 'projects/')); frag.appendChild(document.createTextNode('  '));
          frag.appendChild(lnk('/posts/', 'posts/')); frag.appendChild(document.createTextNode('  '));
          frag.appendChild(lnk('/search/', 'search/'));
          show(frag, true);
          break;
        }
        case 'pwd':
          show(sp('ok', window.location.pathname));
          break;
        case 'whoami':
          show(sp('ok', 'visitor'));
          break;
        case 'hostname':
          show(sp('ok', window.location.hostname || 'thesecurityvault'));
          break;
        case 'echo':
          show(document.createTextNode(arg));
          break;
        case 'clear':
          out.classList.remove('is-active');
          break;
        case 'sudo':
          show(sp('err', 'visitor is not in the sudoers file. This incident will be reported.'));
          break;
        case 'theme': {
          var mode = (arg || '').toLowerCase();
          if (mode === 'dark' || mode === 'light' || mode === 'auto' || mode === 'system') {
            var actual = mode === 'system' ? 'auto' : mode;
            setTheme(actual);
            show(sp('ok', 'theme set to ' + actual));
          } else if (mode === '') {
            frag.appendChild(sp('ok', 'current theme: ' + getEffectiveTheme()));
            frag.appendChild(document.createTextNode(' '));
            frag.appendChild(sp('muted', '— usage: theme <dark|light|auto>'));
            show(frag);
          } else {
            frag.appendChild(sp('err', 'unknown theme: ' + mode));
            frag.appendChild(document.createTextNode(' '));
            frag.appendChild(sp('muted', '— try dark, light, or auto'));
            show(frag);
          }
          break;
        }
        default: {
          frag.appendChild(sp('err', 'bash: ' + cmd + ': command not found'));
          frag.appendChild(document.createTextNode(' '));
          frag.appendChild(sp('muted', "— try 'help'"));
          show(frag);
        }
      }
      input.value = '';
    }

    // Run on Enter (no <form>, so the page never reloads)
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); runCmd(); }
    });

    out.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') out.classList.remove('is-active');
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ─── Floating TOC ─────────────────────────────────────────────────────────
  function initTOC() {
    var panel = document.getElementById('tocPanel');
    var nav = document.getElementById('tocNav');
    if (!panel || !nav) return;

    var headings = document.querySelectorAll('.prose h2, .prose h3, .prose h4');
    if (headings.length < 2) { panel.style.display = 'none'; return; }

    var items = [];
    headings.forEach(function (h) {
      if (!h.id) return;
      var a = document.createElement('a');
      a.href = '#' + h.id;
      a.className = 'toc-link toc-link--' + h.tagName.toLowerCase();
      // Get text without the heading-anchor icon appended by initContentEnhancements
      var clone = h.cloneNode(true);
      var icon = clone.querySelector('.heading-anchor');
      if (icon) icon.remove();
      a.textContent = clone.textContent.trim();
      a.title = a.textContent;
      nav.appendChild(a);
      items.push({ id: h.id, el: h, link: a });
    });

    var activeId = null;
    function setActive(id) {
      if (id === activeId) return;
      activeId = id;
      items.forEach(function (item) {
        item.link.classList.toggle('is-active', item.id === id);
      });
    }

    var OFFSET = 80; // nav height + buffer

    function onScroll() {
      var current = items[0] && items[0].id;
      for (var i = 0; i < items.length; i++) {
        if (items[i].el.getBoundingClientRect().top < OFFSET) {
          current = items[i].id;
        }
      }
      if (current) setActive(current);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ─── Boot ─────────────────────────────────────────────────────────────────
  function start() {
    initContentEnhancements();
    initTOC();
    initGlitch();
    initNavTerm();
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
