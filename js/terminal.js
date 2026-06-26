/**
 * terminal.js — interactive nav-bar terminal with CTF challenge.
 * No innerHTML. Each show() call builds DOM nodes.
 */
(function () {
  'use strict';
  try {
    var form    = document.getElementById('navTermForm');
    var input   = document.getElementById('navTerm');
    var out     = document.getElementById('navTermOut');
    var pathEl  = document.getElementById('navTermPath');
    var trigger = document.getElementById('navTermTrigger');
    if (!form || !input || !out) return;

    // ── CTF state ──────────────────────────────────────────────────────────────
    var sshPending = false; // waiting for SSH password input

    // ── Virtual filesystem ─────────────────────────────────────────────────────
    var FS = {
      '/var/www':          { dirs: ['about', 'posts', 'projects', 'search'], files: ['.backup'] },
      '/var/www/about':    { dirs: [], files: ['index.html'] },
      '/var/www/posts':    { dirs: [], files: ['index.html'] },
      '/var/www/projects': { dirs: [], files: ['index.html'] },
      '/var/www/search':   { dirs: [], files: ['index.html'] }
    };

    var SITE_ROUTES = {
      '/var/www/about':    '/#about',
      '/var/www/posts':    '/posts/',
      '/var/www/projects': '/#projects',
      '/var/www/search':   '/search/'
    };

    var cwd = '/var/www';

    function updatePath() {
      if (pathEl) pathEl.textContent = cwd;
    }
    updatePath();

    // ── Theme helpers ──────────────────────────────────────────────────────────
    function getTheme() {
      return (window.__vault && window.__vault.theme) ? window.__vault.theme.get() : 'dark';
    }
    function setTheme(m) {
      if (window.__vault && window.__vault.theme) window.__vault.theme.set(m);
    }

    // ── Open / collapse terminal ───────────────────────────────────────────────
    function openTerm() {
      form.classList.add('nav-term--open');
      input.focus();
    }

    form.addEventListener('click', function (e) {
      if (e.target !== input) input.focus();
    });

    if (trigger) {
      trigger.addEventListener('click', function () { openTerm(); });
    }

    // Don't close terminal when user clicks output panel (e.g. to copy text)
    var clickingOutput = false;
    out.addEventListener('mousedown', function () { clickingOutput = true; });
    out.addEventListener('mouseup', function () {
      setTimeout(function () { clickingOutput = false; }, 150);
    });

    input.addEventListener('blur', function () {
      if (clickingOutput) return;
      if (!input.value.trim() && !sshPending) {
        clearTimeout(hideTimer);
        out.classList.remove('is-active');
        form.classList.remove('nav-term--open');
        form.classList.remove('nav-term--ssh-pw');
        sshPending = false;
      }
    });

    // ── DOM helpers ────────────────────────────────────────────────────────────
    function span(cls, text) {
      var s = document.createElement('span');
      s.className = cls;
      s.textContent = text;
      return s;
    }
    function txt(t) { return document.createTextNode(t); }
    function append(container) {
      for (var i = 1; i < arguments.length; i++) {
        var c = arguments[i];
        container.appendChild(typeof c === 'string' ? txt(c) : c);
      }
      return container;
    }
    function line() {
      var d = document.createElement('div');
      for (var i = 0; i < arguments.length; i++) {
        var c = arguments[i];
        d.appendChild(typeof c === 'string' ? txt(c) : c);
      }
      return d;
    }

    // ── Output panel ──────────────────────────────────────────────────────────
    var hideTimer;
    function show(node, sticky) {
      while (out.firstChild) out.removeChild(out.firstChild);
      out.appendChild(node);
      out.classList.add('is-active');
      clearTimeout(hideTimer);
      if (!sticky) hideTimer = setTimeout(function () { out.classList.remove('is-active'); }, 6500);
    }
    function go(url) { window.location.href = url; }

    // ── Path helpers ───────────────────────────────────────────────────────────
    function resolvePath(base, target) {
      if (!target || target === '.' || target === '~') return '/var/www';
      if (target === '..') {
        if (base === '/var/www') return null;
        return base.split('/').slice(0, -1).join('/') || '/var/www';
      }
      if (target.charAt(0) === '/') return null;
      return base + '/' + target;
    }

    // ── Vault animation ───────────────────────────────────────────────────────
    function openVaultAnimation() {
      var overlay = document.getElementById('vaultUnlocked');
      var body    = document.getElementById('vaultUnlockedBody');
      if (!overlay || !body) return;

      // Clear previous content and open overlay
      while (body.firstChild) body.removeChild(body.firstChild);
      overlay.classList.add('vault-unlocked--open');

      var seq = [
        { t: 100,  cls: 'vault-ul-ok',   text: '$ ssh root@vault' },
        { t: 500,  cls: 'vault-ul-muted', text: 'Connecting to vault.internal...' },
        { t: 900,  cls: 'vault-ul-muted', text: 'SSH-2.0-OpenSSH_9.6p1 Ubuntu-3ubuntu0.6' },
        { t: 1300, cls: 'vault-ul-muted', text: "debug1: Authenticating to vault.internal:22 as 'root'" },
        { t: 1750, cls: 'vault-ul-muted', text: 'debug1: Authentication succeeded (keyboard-interactive)' },
        { t: 2100, cls: '',               text: '' },
        { t: 2500, cls: 'vault-ul-warn',  text: '⚠  WARNING: Unrecognized device. Login origin: 0.0.0.0' },
        { t: 3000, cls: 'vault-ul-warn',  text: '⚠  ALERT: Unauthorized access attempt detected' },
        { t: 3500, cls: 'vault-ul-warn',  text: '⚠  Logging intrusion — notifying system administrator...' },
        { t: 4000, cls: '',               text: '' },
        { t: 4400, cls: 'vault-ul-muted', text: 'Last login: never — first successful access on record.' },
        { t: 4800, cls: '',               text: '' },
        { t: 5100, isArt: true },
        { t: 5800, cls: 'vault-ul-ok',   text: 'Welcome, root. You cracked the vault.' },
        { t: 6200, cls: 'vault-ul-muted', text: 'The password was hiding in plain sight all along.' },
        { t: 6600, cls: 'vault-ul-muted', text: '90817 centurios well spent.' },
      ];

      seq.forEach(function (item) {
        setTimeout(function () {
          var el;
          if (item.isArt) {
            el = document.createElement('pre');
            el.className = 'vault-ul-art';
            el.textContent = [
              ' __   ___   _   _ _    _____ ',
              ' \\ \\ / / \\ | | | | |  |_   _|',
              '  \\ V / _ \\| |_| | |__  | |  ',
              '   \\_/_/ \\_\\\\___/|____| |_|  '
            ].join('\n');
          } else {
            el = document.createElement('p');
            el.className = 'vault-ul-line' + (item.cls ? ' ' + item.cls : '');
            el.textContent = item.text;
          }
          body.appendChild(el);
          body.scrollTop = body.scrollHeight;
        }, item.t);
      });
    }

    // ── NMAP data ──────────────────────────────────────────────────────────────
    var NMAP_PORTS = [
      'PORT     STATE    SERVICE',
      '22/tcp   open     ssh',
      '80/tcp   open     http',
      '443/tcp  open     https',
      '8080/tcp closed   http-proxy',
      '3306/tcp filtered mysql'
    ];

    // ── Command handler ───────────────────────────────────────────────────────
    function runCmd() {
      var raw = input.value.trim();
      if (!raw) return;
      input.value = '';

      // SSH password mode — intercept next input as the password
      if (sshPending) {
        sshPending = false;
        form.classList.remove('nav-term--ssh-pw');
        updatePath();
        if (pathEl) pathEl.style.color = '';
        input.placeholder = "type 'help'";
        if (raw === 'Couldyouguessthiswouldbethepassword?') {
          openVaultAnimation();
        } else {
          show(line(span('err', 'Permission denied, please try again.')));
        }
        return;
      }

      var parts = raw.split(/\s+/);
      var cmd   = parts[0].toLowerCase();
      var arg   = parts.slice(1).join(' ');

      switch (cmd) {

        // ── Filesystem ────────────────────────────────────────────────────────
        case 'pwd':
          show(line(span('ok', cwd)));
          break;

        case 'ls': {
          var lsTarget = cwd;
          if (arg) {
            var lsRes = resolvePath(cwd, arg);
            if (!lsRes || !FS[lsRes]) {
              show(line(span('err', "ls: cannot access '" + arg + "': No such file or directory")));
              return;
            }
            lsTarget = lsRes;
          }
          var entry = FS[lsTarget];
          var lsd = document.createElement('div');
          entry.dirs.forEach(function (d) {
            lsd.appendChild(span('ok', d + '/')); lsd.appendChild(txt('  '));
          });
          entry.files.forEach(function (f) {
            lsd.appendChild(span(f.charAt(0) === '.' ? 'warn' : 'muted', f)); lsd.appendChild(txt('  '));
          });
          show(lsd, true);
          if (arg && SITE_ROUTES[lsTarget]) {
            setTimeout(function () { go(SITE_ROUTES[lsTarget]); }, 600);
          }
          break;
        }

        case 'cd': {
          var cdArg = parts[1] || '~';
          if (cdArg === '~' || cdArg === '/var/www') {
            cwd = '/var/www'; updatePath();
            show(line(span('muted', cwd)));
            return;
          }
          var newPath = resolvePath(cwd, cdArg);
          if (newPath === null) {
            show(line(span('err', 'cd: permission denied: access restricted to /var/www')));
            return;
          }
          if (!FS[newPath]) {
            show(line(span('err', "cd: " + cdArg + ": No such file or directory")));
            return;
          }
          cwd = newPath;
          updatePath();
          if (SITE_ROUTES[cwd]) {
            show(line(span('muted', '→ navigating to ' + SITE_ROUTES[cwd])));
            setTimeout(function () { go(SITE_ROUTES[cwd]); }, 400);
          } else {
            show(line(span('muted', cwd)));
          }
          break;
        }

        // ── File ops ──────────────────────────────────────────────────────────
        case 'cat': {
          var catFile = arg || '';
          if (!catFile) { show(line(span('err', 'cat: missing operand'))); return; }
          if (catFile === '.backup' && cwd === '/var/www') {
            show(line(span('ok', 'root:4d520e99d52748de3a43e801085f466a163caae605170378b85ce3c2f39d7db5')), true);
          } else if (catFile === '/etc/passwd' || catFile === '/etc/shadow') {
            var catd = document.createElement('div');
            append(catd, span('err', '[ALERT] Access to ' + catFile + ' denied.'));
            catd.appendChild(document.createElement('br'));
            append(catd, span('muted', 'This attempt has been logged.'));
            show(catd);
          } else {
            show(line(span('err', "cat: " + catFile + ": No such file or directory")));
          }
          break;
        }

        // ── CTF: john ─────────────────────────────────────────────────────────
        case 'john': {
          var johnTarget = arg.replace(/^\.\//, '');
          if (johnTarget !== '.backup') {
            show(line(span('err', 'john: ' + (johnTarget || '<file>') + ': No such file or crackable hash')));
            return;
          }
          var jd = document.createElement('div');
          while (out.firstChild) out.removeChild(out.firstChild);
          out.appendChild(jd);
          out.classList.add('is-active');
          clearTimeout(hideTimer);

          [
            { delay: 0,    nodes: [span('muted', 'Loaded 1 password hash (Raw-SHA256 [SHA256 128/128 SSE2 4x])')] },
            { delay: 500,  nodes: [span('muted', 'Using default input encoding: UTF-8')] },
            { delay: 900,  nodes: [span('muted', "Press 'q' or Ctrl-C to abort...")] },
            { delay: 1500, nodes: [span('muted', '0g 0:00:01:42  0.00%  (ETA: ~218 days)  0g/s 8291Kp/s')] },
            { delay: 2400, nodes: [span('muted', '0g 0:00:12:07  0.01%  (ETA: ~90 days)   0g/s 8314Kp/s')] },
            { delay: 3400, nodes: [span('warn',  '0g 0:01:03:44  0.08%  (ETA: ~21 days)   0g/s 8319Kp/s')] },
            { delay: 4500, nodes: [span('warn',  '0g 0:08:19:52  1.14%  (ETA: ~6 days)    0g/s 8322Kp/s')] },
            { delay: 5600, nodes: [span('warn',  '0g 0:91:44:17  11.8%  cracking slowly...')] },
            { delay: 6800, nodes: [span('ok',    'Couldyouguessthiswouldbethepassword?'), txt('  (root)')] },
            { delay: 7200, nodes: [span('ok',    '1g 1:00:00:03 DONE (took 90817 centurios)'), span('muted', '  0.3045g/s 8324Kp/s')] },
            { delay: 7700, nodes: [span('muted', 'Session completed')] }
          ].forEach(function (item) {
            setTimeout(function () {
              var div = document.createElement('div');
              item.nodes.forEach(function (n) { div.appendChild(n); });
              jd.appendChild(div);
            }, item.delay);
          });
          return;
        }

        // ── CTF: ssh ──────────────────────────────────────────────────────────
        case 'ssh': {
          var sshArg = (parts[1] || '').toLowerCase();
          if (sshArg === 'root@vault' || sshArg === 'root@vault.internal') {
            sshPending = true;
            form.classList.add('nav-term--ssh-pw');
            // Show password prompt inline in the terminal bar (not the dropdown)
            if (pathEl) {
              pathEl.textContent = "root@vault's password:";
              pathEl.style.color = 'var(--color-muted)';
            }
            out.classList.remove('is-active');
            input.placeholder = '';
            input.focus();
          } else if (!sshArg) {
            show(line(span('err', 'usage: ssh <user@host>')));
          } else {
            show(line(span('err', 'ssh: connect to host ' + (parts[1] || '') + ' port 22: Connection refused')));
          }
          break;
        }

        // ── Misc ──────────────────────────────────────────────────────────────
        case 'whoami':
          show(line(span('ok', 'visitor')));
          break;

        case 'hostname':
          show(line(span('ok', window.location.hostname || 'vault')));
          break;

        case 'echo':
          show(line(txt(arg || '')));
          break;

        case 'date':
          show(line(span('ok', new Date().toString())));
          break;

        case 'uname': {
          var ua = arg === '-a' || arg === '-r';
          show(line(span('ok', ua
            ? 'VaultOS 6.0.0-quantum #1 SMP PREEMPT Thu Jan 01 00:00:00 UTC 1970 x86_64 GNU/Linux'
            : 'VaultOS')));
          break;
        }

        case 'ping': {
          var host = arg || 'localhost';
          var knownIps = {
            'localhost': '127.0.0.1', 'vault': '10.0.0.1',
            'vault.internal': '10.0.0.1', 'google.com': '142.250.200.46'
          };
          var ip = knownIps[host.toLowerCase()] || '0.0.0.0';
          var pd = document.createElement('div');
          append(pd, span('muted', 'PING ' + host + ' (' + ip + ')'));
          pd.appendChild(document.createElement('br'));
          for (var pi = 1; pi <= 3; pi++) {
            var ms = (Math.random() * 30 + 8).toFixed(3);
            append(pd, txt('64 bytes from ' + ip + ': icmp_seq=' + pi + ' ttl=64 time='), span('ok', ms + ' ms'));
            pd.appendChild(document.createElement('br'));
          }
          append(pd, span('muted', '--- ' + host + ' ping statistics ---'));
          pd.appendChild(document.createElement('br'));
          append(pd, span('ok', '3 packets transmitted, 3 received, 0% packet loss'));
          show(pd);
          break;
        }

        case 'nmap': {
          var nd = document.createElement('div');
          append(nd, span('muted', 'Starting Nmap scan on vault'));
          nd.appendChild(document.createElement('br'));
          NMAP_PORTS.forEach(function (portLine) {
            var np = portLine.split(/\s+/);
            if (np[1] === 'open') {
              nd.appendChild(line(span('ok', np[0]), txt('   ' + np[1] + '     ' + (np[2] || ''))));
            } else if (np[1] === 'filtered') {
              nd.appendChild(line(span('warn', np[0]), txt('   ' + np[1] + '  ' + (np[2] || ''))));
            } else {
              nd.appendChild(line(txt(portLine)));
            }
          });
          append(nd, span('muted', 'Nmap done: 1 IP address (1 host up)'));
          show(nd, true);
          break;
        }

        case 'sudo':
          show(line(span('err', 'visitor is not in the sudoers file. This incident will be reported.')));
          break;

        case 'rm': {
          if (arg.indexOf('-rf') === 0) {
            var rd = document.createElement('div');
            append(rd, span('err', "rm: it is dangerous to operate recursively on '/'"));
            rd.appendChild(document.createElement('br'));
            append(rd, span('warn', 'Use --no-preserve-root to override this failsafe.'));
            rd.appendChild(document.createElement('br'));
            append(rd, span('muted', '...nice try.'));
            show(rd);
          } else {
            show(line(span('err', 'rm: ' + (arg || '<file>') + ': No such file or directory')));
          }
          break;
        }

        case 'theme': {
          var tMode = (arg || '').toLowerCase();
          if (tMode === 'dark' || tMode === 'light' || tMode === 'auto' || tMode === 'system') {
            var actual = tMode === 'system' ? 'auto' : tMode;
            setTheme(actual);
            show(line(span('ok', 'theme set to ' + actual)));
          } else if (tMode === '') {
            show(line(span('ok', 'current theme: ' + getTheme()), txt(' '), span('muted', '— usage: theme <dark|light|auto>')));
          } else {
            show(line(span('err', 'unknown theme: ' + tMode), txt(' '), span('muted', '— try dark, light, or auto')));
          }
          break;
        }

        case 'grep':
        case 'search':
          if (arg) { go('/search/?q=' + encodeURIComponent(arg)); return; }
          show(line(span('err', 'usage: grep <term>')));
          break;

        case 'help': {
          var helpD = document.createElement('div');
          append(helpD, span('muted', 'available commands:'));
          helpD.appendChild(document.createElement('br'));
          var helpWrap = document.createElement('div');
          helpWrap.style.cssText = 'display:flex;flex-wrap:wrap;gap:2px 14px;margin:2px 0 4px;';
          [
            ['pwd',''], ['ls','[dir]'], ['cd','<dir>'], ['cat','<file>'],
            ['john','<file>'], ['ssh','<user@host>'],
            ['whoami',''], ['hostname',''], ['echo','<msg>'], ['theme','<dark|light|auto>'],
            ['date',''], ['uname',''], ['ping','<host>'], ['nmap',''],
            ['sudo','<cmd>'], ['grep','<term>']
          ].forEach(function (c) {
            var e = document.createElement('span');
            e.appendChild(span('ok', c[0]));
            if (c[1]) e.appendChild(span('muted', ' ' + c[1]));
            helpWrap.appendChild(e);
          });
          helpD.appendChild(helpWrap);
          append(helpD, span('muted', 'hint: '), span('warn', 'ls'), span('muted', ' to explore the vault'));
          show(helpD, true);
          break;
        }

        default:
          show(line(span('err', 'bash: ' + cmd + ': command not found'), txt(' '), span('muted', "— try 'help'")));
      }
    }

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); runCmd(); }
    });

    out.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') out.classList.remove('is-active');
    });

    // ── Vault overlay close ────────────────────────────────────────────────────
    var vaultOverlay = document.getElementById('vaultUnlocked');
    var vaultClose   = document.getElementById('vaultUnlockedClose');
    if (vaultOverlay) {
      // Only close when clicking the backdrop or the close button (not inner content)
      vaultOverlay.addEventListener('click', function (e) {
        if (e.target === vaultOverlay) vaultOverlay.classList.remove('vault-unlocked--open');
      });
      if (vaultClose) {
        vaultClose.addEventListener('click', function () {
          vaultOverlay.classList.remove('vault-unlocked--open');
        });
      }
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') vaultOverlay.classList.remove('vault-unlocked--open');
      });
    }

  } catch (e) {
    if (typeof console !== 'undefined') console.warn('[terminal]', e);
  }
})();
