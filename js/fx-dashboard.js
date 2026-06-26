(function () {
  'use strict';
  try {
    var cv = document.querySelector('canvas[data-fx="dashboard"]');
    if (!cv) return;

    var band = cv.closest('.band');
    if (!band) return;

    var statusEl  = document.getElementById('dashStatus');
    var titleEl   = document.getElementById('dashTitle');
    var tagEl     = document.getElementById('dashTag');
    var termEl    = document.getElementById('dashTerm');
    var panelEl   = document.getElementById('dashMain');
    var netWrapEl = document.getElementById('dashNetWrap');
    var netCv     = document.getElementById('dashNetCanvas');
    var netAlert  = document.getElementById('dashNetAlert');

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
    function debounce(fn) { var t; return function () { clearTimeout(t); t = setTimeout(fn, 150); }; }

    function trackProgress() {
      var r = band.getBoundingClientRect(), vh = window.innerHeight || 1;
      var denom = r.height - vh;
      if (denom <= 0) return 0;
      return clamp(-r.top / denom, 0, 1);
    }

    function offscreen() {
      var r = band.getBoundingClientRect(), vh = window.innerHeight || 1;
      return r.bottom < -50 || r.top > vh + 50;
    }

    // ── Background canvas: grid + sweep line ──────────────────────────────
    var ctx;
    try { ctx = cv.getContext('2d'); } catch (e) {}

    function resizeCanvas() {
      var w = cv.clientWidth  || window.innerWidth;
      var h = cv.clientHeight || window.innerHeight;
      if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
      if (netCv) {
        var nw = netCv.offsetWidth, nh = netCv.offsetHeight;
        if (nw > 0 && nh > 0 && (netCv.width !== nw || netCv.height !== nh)) {
          netCv.width = nw; netCv.height = nh;
        }
      }
    }

    var sweepY = 0;

    function isLight() {
      var dt = document.documentElement.getAttribute('data-theme');
      if (dt === 'dark')  return false;
      if (dt === 'light') return true;
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    }

    function drawBg(dt) {
      if (!ctx) return;
      var w = cv.width, h = cv.height;
      if (!w || !h) return;
      ctx.clearRect(0, 0, w, h);
      var light = isLight();
      ctx.strokeStyle = light ? 'rgba(0,0,0,0.04)' : 'rgba(56,225,255,0.03)';
      ctx.lineWidth = 1;
      var gs = 44, x, y;
      for (x = 0; x < w; x += gs) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke(); }
      for (y = 0; y < h; y += gs) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke(); }
      sweepY = (sweepY + dt * 70) % h;
      var grad = ctx.createLinearGradient(0, sweepY - 30, 0, sweepY + 30);
      if (light) {
        grad.addColorStop(0,   'rgba(8,145,178,0)');
        grad.addColorStop(0.5, 'rgba(8,145,178,0.06)');
        grad.addColorStop(1,   'rgba(8,145,178,0)');
      } else {
        grad.addColorStop(0,   'rgba(56,225,255,0)');
        grad.addColorStop(0.5, 'rgba(56,225,255,0.05)');
        grad.addColorStop(1,   'rgba(56,225,255,0)');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, sweepY - 30, w, 60);
    }

    // ── Terminal lines ─────────────────────────────────────────────────────
    // Each entry: [progress-threshold, [[cssClass, text], ...]]
    // cssClass='' → plain text node (no span)
    var TERM_LINES = [
      [0.005, [['t-muted','$ '],['t-bright','sudo ./security-audit.sh --target 10.0.0.0/24']]],
      [0.010, [['t-info','[*] '],['','vault-pentest-suite v4.2.1 — starting']]],
      [0.015, [['t-info','[*] '],['','Loading modules: recon, scanner, vuln-db, exploit-kit, pivot-engine']]],
      [0.022, [['t-ok','[+] '],['','All modules loaded — CVE-db: '],['t-bright','247,891'],['t-muted',' entries']]],
      [0.028, [['t-info','[*] '],['','Starting host discovery on 10.0.0.0/24...']]],
      [0.036, [['t-ok','[+] '],['','Scan complete — '],['t-warn','1 host flagged for review']]],
      [0.05, [['','']]],
      [0.13, [['t-info','[*] '],['','Target: '],['t-bright','10.0.0.45'],['t-muted','  (db-internal.corp)']]],
      [0.17, [['t-muted','PORT      STATE  SERVICE   VERSION']]],
      [0.21, [['t-muted','22/tcp    open   ssh       '],['t-ok','OpenSSH 7.4']]],
      [0.25, [['t-muted','80/tcp    open   http      '],['t-ok','Apache httpd 2.4.6']]],
      [0.29, [['t-warn','3306/tcp  open   mysql     MySQL 5.1.73-community']]],
      [0.33, [['t-muted','443/tcp   open   ssl/http  Apache httpd 2.4.6']]],
      [0.37, [['','']]],
      [0.41, [['t-crit','[!] '],['','MySQL 5.1.73 — '],['t-crit','EOL since Dec 2013']]],
      [0.44, [['t-crit','[!] '],['','CVE-2012-2122 — auth bypass vulnerability']]],
      [0.47, [['t-info','[*] '],['','Initiating credential audit on '],['t-bright','10.0.0.45:3306']]],
      [0.50, [['','']]],
      [0.52, [['t-muted','[hydra] target: mysql://10.0.0.45  wordlist: db-creds.txt (12,841)']]],
      [0.54, [['t-muted','[ATTEMPT] root : password    '],['t-crit','FAIL']]],
      [0.56, [['t-muted','[ATTEMPT] root : root        '],['t-crit','FAIL']]],
      [0.58, [['t-muted','[ATTEMPT] root : toor        '],['t-crit','FAIL']]],
      [0.60, [['t-muted','[ATTEMPT] root : 123456      '],['t-crit','FAIL']]],
      [0.62, [['t-muted','[ATTEMPT] root : admin123    '],['t-ok','SUCCESS ✓']]],
      [0.64, [['t-ok','[+] '],['t-bright','CREDENTIAL FOUND: '],['','root / admin123']]],
      [0.66, [['t-info','mysql> '],['t-bright','SELECT VERSION()'],['t-muted','  →  '],['','5.1.73-community']]],
      [0.68, [['t-info','mysql> '],['t-bright','SYSTEM whoami'],['t-muted','        →  '],['t-ok','root']]],
      [0.70, [['t-info','mysql> '],['t-bright','SYSTEM id'],['t-muted','            →  '],['t-warn','uid=0(root) gid=0(root)']]],
      [0.72, [['t-crit','[!] '],['t-bright','ROOT SHELL OBTAINED']]],
      [0.74, [['t-crit','[!] '],['','Initiating network pivot...']]],
    ];

    // Build DOM nodes for each line (no innerHTML)
    var termLines = [];
    if (termEl) {
      for (var li = 0; li < TERM_LINES.length; li++) {
        var ld    = TERM_LINES[li];
        var div   = document.createElement('div');
        div.className = 't-line';
        var parts = ld[1];
        for (var pi = 0; pi < parts.length; pi++) {
          var cls = parts[pi][0];
          var txt = parts[pi][1];
          if (cls) {
            var sp = document.createElement('span');
            sp.className = cls;
            sp.appendChild(document.createTextNode(txt));
            div.appendChild(sp);
          } else {
            div.appendChild(document.createTextNode(txt));
          }
        }
        termEl.appendChild(div);
        termLines.push({ el: div, p: ld[0] });
      }
    }

    // Phase labels keyed by progress thresholds [p, title, tag, tagMod, status]
    var PHASES = [
      [0.72, 'root@vault — network pivot',     'PIVOT',  'dash-panel-tag--crit', '// NETWORK PIVOT ACTIVE'],
      [0.47, 'root@vault — credential audit',  'ATTACK', 'dash-panel-tag--crit', '// CREDENTIAL ATTACK IN PROGRESS'],
      [0.16, 'root@vault — host enumeration',  'SCAN',   'dash-panel-tag--warn', '// ENUMERATING TARGETS'],
      [0.00, 'root@vault — security-audit',    'INIT',   '',                     '// INITIALIZING AUDIT SUITE'],
    ];

    var lastPhaseIdx = -1;

    // ── Main update: reveal lines + phase labels + network toggle ──────────
    function update(p) {
      // Phase header update
      var phaseIdx = 0;
      for (var i = 0; i < PHASES.length; i++) {
        if (p >= PHASES[i][0]) { phaseIdx = i; break; }
      }
      if (phaseIdx !== lastPhaseIdx) {
        var ph = PHASES[phaseIdx];
        if (titleEl)  titleEl.textContent  = ph[1];
        if (tagEl)    { tagEl.textContent = ph[2]; tagEl.className = 'dash-panel-tag' + (ph[3] ? ' ' + ph[3] : ''); }
        if (statusEl) statusEl.textContent = ph[4];
        lastPhaseIdx = phaseIdx;
      }

      // Reveal / hide terminal lines based on progress
      var changed = false;
      for (var li = 0; li < termLines.length; li++) {
        var want = p >= termLines[li].p;
        var has  = termLines[li].el.classList.contains('t-line--show');
        if (want !== has) {
          termLines[li].el.classList.toggle('t-line--show', want);
          changed = true;
        }
      }
      // Auto-scroll terminal to always show the latest revealed line
      if (changed && termEl) { termEl.scrollTop = termEl.scrollHeight; }

      // Network canvas phase (p >= 0.75): crossfade in, run pivot animation
      var netActive = p >= 0.75;
      if (netWrapEl) {
        netWrapEl.classList.toggle('dash-net-wrap--active', netActive);
        netWrapEl.setAttribute('aria-hidden', String(!netActive));
      }
      if (netCtx && netActive) {
        var netP = clamp((p - 0.75) / 0.25, 0, 1);
        drawNetwork(netP);
      }

      // Panel exit: grow + fade as projects section slides in (p 0.985 → 1.00)
      if (panelEl) {
        var exitP = clamp((p - 0.985) / 0.015, 0, 1);
        if (exitP > 0) {
          // smoothstep for organic feel
          var t = exitP * exitP * (3 - 2 * exitP);
          panelEl.style.opacity = (1 - t).toFixed(3);
          panelEl.style.transform = 'scale(' + (1 + t * 0.20).toFixed(4) + ')';
        } else if (panelEl.style.opacity !== '') {
          panelEl.style.opacity = '';
          panelEl.style.transform = '';
        }
      }
    }

    // ── Network pivot visualization ────────────────────────────────────────
    var netCtx;
    try { if (netCv) netCtx = netCv.getContext('2d'); } catch (e) {}

    var NODES = [
      { label: 'DB-01',    ip: '10.0.0.45', x: 0.10, y: 0.50 }, // 0 entry
      { label: 'WEB-01',   ip: '10.0.0.12', x: 0.32, y: 0.20 }, // 1
      { label: 'APP-02',   ip: '10.0.0.18', x: 0.32, y: 0.80 }, // 2
      { label: 'ADMIN-PC', ip: '10.0.0.55', x: 0.53, y: 0.18 }, // 3
      { label: 'FILE-SRV', ip: '10.0.0.30', x: 0.53, y: 0.50 }, // 4
      { label: 'BACKUP',   ip: '10.0.0.35', x: 0.53, y: 0.82 }, // 5
      { label: 'DC-01',    ip: '10.0.0.80', x: 0.74, y: 0.28 }, // 6
      { label: 'DC-02',    ip: '10.0.0.81', x: 0.74, y: 0.72 }, // 7
      { label: 'MGMT',     ip: '10.0.0.90', x: 0.93, y: 0.50 }, // 8
    ];

    var EDGES = [
      [0,1],[0,2],[1,3],[1,4],[2,4],[2,5],[3,6],[4,6],[4,7],[5,7],[6,8],[7,8],
    ];

    // Compromise arrival times as fraction of network phase progress (0..1)
    var ATTACK_T = [0.00, 0.10, 0.18, 0.28, 0.34, 0.42, 0.52, 0.60, 0.74];

    var netTime = 0;

    function drawNetwork(netP) {
      if (!netCtx || !netCv) return;
      var w = netCv.offsetWidth, h = netCv.offsetHeight;
      if (!w || !h) return;
      if (netCv.width !== w || netCv.height !== h) { netCv.width = w; netCv.height = h; }

      var t = netCtx;
      t.clearRect(0, 0, w, h);
      var light = isLight();

      // Background grid
      t.strokeStyle = light ? 'rgba(0,0,0,0.05)' : 'rgba(56,225,255,0.04)';
      t.lineWidth = 1;
      var gs = 28, xi, yi;
      for (xi = 0; xi < w; xi += gs) { t.beginPath(); t.moveTo(xi,0); t.lineTo(xi,h); t.stroke(); }
      for (yi = 0; yi < h; yi += gs) { t.beginPath(); t.moveTo(0,yi); t.lineTo(w,yi); t.stroke(); }

      var pulse = Math.sin(netTime * 2.8) * 0.5 + 0.5;

      // Per-node compromise progress: 0=safe, 1=fully owned
      var nodeP = [], ki;
      for (ki = 0; ki < NODES.length; ki++) {
        var at = ATTACK_T[ki];
        nodeP.push(netP < at ? 0 : Math.min(1, (netP - at) / 0.07));
      }

      var nr = Math.max(13, Math.min(21, w * 0.025));

      // Edges
      var ei;
      for (ei = 0; ei < EDGES.length; ei++) {
        var e = EDGES[ei];
        var nA = NODES[e[0]], nB = NODES[e[1]];
        var pA = nodeP[e[0]], pB = nodeP[e[1]];
        var ax = nA.x * w, ay = nA.y * h;
        var bx = nB.x * w, by = nB.y * h;
        t.beginPath(); t.moveTo(ax, ay); t.lineTo(bx, by);
        if (pA > 0 && pB > 0) {
          var ea = Math.min(pA, pB);
          t.strokeStyle = 'rgba(220,38,38,' + (0.22 + ea * 0.58) + ')';
          t.lineWidth   = 1.5 + ea * 1.5;
          t.setLineDash([]);
        } else if (pA > 0) {
          t.strokeStyle = light ? 'rgba(180,83,9,0.60)' : 'rgba(255,130,40,0.55)';
          t.lineWidth   = 1;
          t.setLineDash([5, 4]);
          t.lineDashOffset = -(netTime * 30 + ei * 9);
        } else {
          t.strokeStyle = light ? 'rgba(71,111,163,0.18)' : 'rgba(70,125,175,0.10)';
          t.lineWidth   = 1;
          t.setLineDash([]);
        }
        t.stroke();
        t.setLineDash([]);
      }

      // Nodes
      var ni;
      for (ni = 0; ni < NODES.length; ni++) {
        var n  = NODES[ni];
        var np = nodeP[ni];
        var nx = n.x * w, ny = n.y * h;

        // Glow
        if (np > 0) {
          var gr  = nr * (2.0 + np * 2.2 + pulse * 0.7 * np);
          var grd = t.createRadialGradient(nx, ny, 0, nx, ny, gr);
          grd.addColorStop(0, 'rgba(255,30,60,' + (0.28 * np).toFixed(2) + ')');
          grd.addColorStop(1, 'rgba(255,30,60,0)');
          t.beginPath(); t.arc(nx, ny, gr, 0, Math.PI * 2);
          t.fillStyle = grd; t.fill();
        }

        // Fill: steel-blue → deep red (same in both themes, red is semantic)
        var cr = Math.round((light ? 71  : 65)  + np * (220 - (light ? 71  : 65)));
        var cg = Math.round((light ? 111 : 115) + np * (38  - (light ? 111 : 115)));
        var cb = Math.round((light ? 163 : 155) + np * (38  - (light ? 163 : 155)));
        t.beginPath(); t.arc(nx, ny, nr, 0, Math.PI * 2);
        t.fillStyle = 'rgba(' + cr + ',' + cg + ',' + cb + ',' + (light ? '0.88' : '0.84') + ')'; t.fill();

        // Ring
        t.beginPath(); t.arc(nx, ny, nr, 0, Math.PI * 2);
        if (np > 0) {
          t.strokeStyle = 'rgba(220,38,38,' + (0.30 + np * 0.60 + pulse * 0.10 * np).toFixed(2) + ')';
          t.lineWidth   = np > 0.9 ? 2.5 : 1.5;
        } else {
          t.strokeStyle = light ? 'rgba(71,111,163,0.35)' : 'rgba(85,148,200,0.22)'; t.lineWidth = 1;
        }
        t.stroke();

        // Animated orbit on entry node
        if (ni === 0 && np > 0) {
          t.beginPath(); t.arc(nx, ny, nr + 5 + pulse * 3.5 * np, 0, Math.PI * 2);
          t.strokeStyle = 'rgba(255,195,55,' + (0.55 * np).toFixed(2) + ')';
          t.lineWidth = 1; t.setLineDash([3, 3]);
          t.lineDashOffset = -(netTime * 22); t.stroke(); t.setLineDash([]);
        }

        // Label
        var lsz = Math.max(9, Math.round(nr * 0.72));
        t.font = 'bold ' + lsz + 'px monospace'; t.textAlign = 'center';
        t.fillStyle = np > 0.5
          ? (light ? 'rgba(153,27,27,0.90)'  : 'rgba(255,155,155,0.90)')
          : (light ? 'rgba(30,64,120,0.88)'  : 'rgba(140,205,240,0.82)');
        t.fillText(n.label, nx, ny + nr + lsz + 2);

        // PWNED badge
        if (np > 0.90) {
          var psz = Math.max(7, Math.round(nr * 0.50));
          t.font = 'bold ' + psz + 'px monospace';
          t.fillStyle = light ? 'rgba(185,28,28,0.92)' : 'rgba(255,80,100,0.90)';
          t.fillText('PWNED', nx, ny + psz * 0.38);
        }
      }

      // ENTRY callout above DB-01
      if (nodeP[0] > 0) {
        var esz = Math.max(7, Math.round(nr * 0.56));
        t.font = 'bold ' + esz + 'px monospace'; t.textAlign = 'center';
        t.fillStyle = light ? 'rgba(146,64,14,0.90)' : 'rgba(255,195,55,0.88)';
        t.fillText('ENTRY', NODES[0].x * w, NODES[0].y * h - nr - 5);
      }

      // All-pwned alert
      var allPwned = true;
      for (var ai = 0; ai < nodeP.length; ai++) { if (nodeP[ai] < 0.90) { allPwned = false; break; } }
      if (netAlert) {
        netAlert.classList.toggle('dash-net-alert--active', allPwned);
        netAlert.setAttribute('aria-hidden', String(!allPwned));
      }
    }

    // ── Resize ────────────────────────────────────────────────────────────
    window.addEventListener('resize', debounce(resizeCanvas));
    if ('ResizeObserver' in window) {
      var ro = new ResizeObserver(debounce(resizeCanvas));
      ro.observe(cv);
      if (netCv) ro.observe(netCv);
    }
    resizeCanvas();

    // ── Animation loop ─────────────────────────────────────────────────────
    var lastTs = 0, running = true;

    function frame(ts) {
      if (!running) return;
      var dt = Math.min((ts - lastTs) / 1000, 0.05);
      lastTs  = ts;
      netTime += dt;
      if (!offscreen()) {
        var p = trackProgress();
        drawBg(dt);
        update(p);
      }
      requestAnimationFrame(frame);
    }

    if (reduceMotion) {
      resizeCanvas(); drawBg(0); update(trackProgress());
      window.addEventListener('scroll', function () {
        if (!offscreen()) { drawBg(0); update(trackProgress()); }
      }, { passive: true });
      return;
    }

    requestAnimationFrame(function (ts) { lastTs = ts; requestAnimationFrame(frame); });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        running = false;
      } else if (!running) {
        running = true;
        requestAnimationFrame(function (ts) { lastTs = ts; requestAnimationFrame(frame); });
      }
    });

  } catch (err) {
    if (typeof console !== 'undefined') console.warn('[fx-dashboard]', err);
  }
}());
