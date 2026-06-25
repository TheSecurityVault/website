/**
 * The Security Vault — theme 6.0 background engine.
 *
 * Five selectable scroll-reactive backgrounds:
 *   matrix  — 2D digital rain (default)
 *   graph   — 3D network / attack graph with traveling packets
 *   terrain — 3D synthwave wireframe landscape
 *   tunnel  — 3D data tunnel / wormhole
 *   globe   — 3D wireframe threat globe (the original)
 *
 * Pick with ?bg=<mode> (sticks via localStorage) or the canvas data-bg attr.
 * Degrades gracefully: no-WebGL falls back to matrix (2D) or hides; reduced
 * motion renders a single static frame; mobile runs a lighter scene.
 */
import * as THREE from 'three';

(function () {
  'use strict';

  var canvas = document.getElementById('bg-canvas');
  if (!canvas) return;

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isMobile = window.matchMedia &&
    window.matchMedia('(max-width: 760px)').matches;

  // ─── Mode resolution ──────────────────────────────────────────────────────
  function safeLS(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  var VALID = ['c2', 'matrix', 'hex', 'vault', 'lock', 'attackmap', 'radar', 'siem', 'decrypt',
    'crack', 'blockchain', 'circuit', 'overflow', 'pentest', 'glitch',
    'morph', 'wave', 'graph', 'terrain', 'tunnel', 'globe'];
  var qbg = null;
  try { qbg = new URLSearchParams(window.location.search).get('bg'); } catch (e) {}
  if (qbg && VALID.indexOf(qbg) !== -1) { try { localStorage.setItem('tsv-bg', qbg); } catch (e) {} }
  var mode = qbg || safeLS('tsv-bg') || canvas.getAttribute('data-bg') || 'matrix';
  if (VALID.indexOf(mode) === -1) mode = 'matrix';

  function webglOK() {
    try {
      var c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext &&
        (c.getContext('webgl') || c.getContext('experimental-webgl')));
    } catch (e) { return false; }
  }

  // 2D-canvas modes (registry); everything else needs WebGL.
  var RUN2D = {
    matrix: runMatrix, hex: runHex, vault: runVault, lock: runLock,
    attackmap: runAttackMap, radar: runRadar, siem: runSiem, decrypt: runDecrypt,
    crack: runCrack, blockchain: runChain, circuit: runCircuit, overflow: runOverflow,
    pentest: runPentest, glitch: runGlitch
  };
  if (RUN2D[mode]) { RUN2D[mode](); return; }
  if (!webglOK()) { runMatrix(); return; }
  runWebGL(mode);

  // ════════════════════════════════════════════════════════════════════════
  // MATRIX — 2D digital rain
  // ════════════════════════════════════════════════════════════════════════
  function runMatrix() {
    var ctx = canvas.getContext('2d');
    if (!ctx) { canvas.style.display = 'none'; return; }

    var GLYPHS = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾊﾋﾌﾍﾎ0123456789ABCDEF<>/\\|=+*'.split('');
    var fontSize = isMobile ? 13 : 16;
    var cols, drops, dpr;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(window.innerWidth / fontSize);
      drops = [];
      for (var i = 0; i < cols; i++) drops[i] = Math.random() * -50;
    }
    resize();

    var scrollSpeed = 1;
    window.addEventListener('scroll', function () {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var p = max > 0 ? window.scrollY / max : 0;
      scrollSpeed = 1 + p * 1.8;
    }, { passive: true });

    var rt;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(resize, 150); });

    function frame(fade) {
      ctx.fillStyle = 'rgba(4,6,10,' + fade + ')';
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.font = fontSize + 'px "JetBrains Mono", monospace';
      for (var i = 0; i < cols; i++) {
        var ch = GLYPHS[(Math.random() * GLYPHS.length) | 0];
        var x = i * fontSize;
        var y = drops[i] * fontSize;
        // bright head, occasional cyan/amber accent
        var r = Math.random();
        if (y > 0) {
          ctx.fillStyle = r > 0.985 ? '#38e1ff' : (r > 0.972 ? '#ffb454' : '#c9ffe6');
          ctx.fillText(ch, x, y);
          ctx.fillStyle = 'rgba(45,255,158,0.85)';
          ctx.fillText(GLYPHS[(Math.random() * GLYPHS.length) | 0], x, y - fontSize);
        }
        if (y > window.innerHeight && Math.random() > 0.975) drops[i] = Math.random() * -20;
        drops[i] += 0.5 * scrollSpeed;
      }
    }

    if (reduceMotion) {
      // static-ish single field
      ctx.fillStyle = '#04060a';
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.font = fontSize + 'px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(45,255,158,0.5)';
      for (var c = 0; c < cols; c++) {
        var n = 3 + (Math.random() * 6) | 0;
        for (var k = 0; k < n; k++) {
          ctx.fillText(GLYPHS[(Math.random() * GLYPHS.length) | 0],
            c * fontSize, (Math.random() * window.innerHeight));
        }
      }
      return;
    }

    var running = true, last = 0;
    function loop(now) {
      if (!running) return;
      // throttle to ~28fps for the classic rain cadence
      if (now - last > 34) { frame(0.08); last = now; }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
    document.addEventListener('visibilitychange', function () {
      running = !document.hidden;
      if (running) requestAnimationFrame(loop);
    });
  }

  // ════════════════════════════════════════════════════════════════════════
  // HEX — 2D hex-dump memory map with a scroll-driven decryption sweep
  // ════════════════════════════════════════════════════════════════════════
  function runHex() {
    var ctx = canvas.getContext('2d');
    if (!ctx) { canvas.style.display = 'none'; return; }
    var fs = isMobile ? 11 : 14, lh = fs + 6, COLS = isMobile ? 8 : 16;
    var charW, rows;

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = fs + 'px "JetBrains Mono", monospace';
      charW = ctx.measureText('0').width;
      rows = Math.ceil(window.innerHeight / lh) + 2;
    }
    resize();
    var rt;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(resize, 150); });

    var scrollP = 0;
    window.addEventListener('scroll', function () {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      scrollP = max > 0 ? window.scrollY / max : 0;
    }, { passive: true });

    function byteAt(r, c) { return (((r * 131 + c * 17 + 9) * 2654435761) >>> 0) & 0xff; }

    function pad(s, n) { s = String(s); while (s.length < n) s = '0' + s; return s; }

    function draw(t) {
      ctx.fillStyle = '#04060a';
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.font = fs + 'px "JetBrains Mono", monospace';
      ctx.textBaseline = 'alphabetic';
      var baseRow = Math.floor(window.scrollY / lh);
      // moving decryption band, pushed further by scroll
      var band = ((t * 60 + scrollP * window.innerHeight * 2.5) % (window.innerHeight + 240)) - 120;
      var ax = 10, hx = ax + charW * 11, asciiX = hx + COLS * charW * 3 + charW * 2;

      for (var r = 0; r < rows; r++) {
        var y = (r + 1) * lh;
        var addr = ((baseRow + r) * COLS) >>> 0;
        var inBand = Math.abs(y - band) < 48;
        ctx.fillStyle = inBand ? '#38e1ff' : 'rgba(56,225,255,.3)';
        ctx.fillText('0x' + pad(addr.toString(16).toUpperCase(), 8), ax, y);
        var ascii = '';
        for (var c = 0; c < COLS; c++) {
          var b = byteAt(baseRow + r, c);
          ctx.fillStyle = inBand ? '#c9ffe6' : 'rgba(45,255,158,' + (0.22 + (b / 255) * 0.16) + ')';
          ctx.fillText(pad(b.toString(16).toUpperCase(), 2), hx + c * charW * 3, y);
          ascii += (b >= 32 && b < 127) ? String.fromCharCode(b) : '.';
        }
        ctx.fillStyle = inBand ? '#ffb454' : 'rgba(92,110,125,.45)';
        ctx.fillText('|' + (inBand ? ascii : ascii.replace(/[\s\S]/g, '·')) + '|', asciiX, y);
      }
    }

    if (reduceMotion) {
      draw(0);
      window.addEventListener('scroll', function () { draw(0); }, { passive: true });
      window.addEventListener('resize', function () { setTimeout(function () { draw(0); }, 200); });
      return;
    }
    var running = true, last = 0;
    function loop(now) {
      if (!running) return;
      if (now - last > 33) { draw(now * 0.001); last = now; }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
    document.addEventListener('visibilitychange', function () {
      running = !document.hidden;
      if (running) requestAnimationFrame(loop);
    });
  }

  // ════════════════════════════════════════════════════════════════════════
  // 2D HARNESS — shared setup for all canvas-2D backgrounds
  // ════════════════════════════════════════════════════════════════════════
  function run2D(draw, opts) {
    opts = opts || {};
    var ctx = canvas.getContext('2d');
    if (!ctx) { canvas.style.display = 'none'; return; }
    var env = { w: window.innerWidth, h: window.innerHeight, scrollP: 0, scrollY: 0 };
    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      env.w = window.innerWidth; env.h = window.innerHeight;
      if (opts.onResize) opts.onResize(ctx, env);
    }
    resize();
    var rt;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(resize, 150); });
    function us() {
      var m = document.documentElement.scrollHeight - window.innerHeight;
      env.scrollY = window.scrollY; env.scrollP = m > 0 ? Math.min(window.scrollY / m, 1) : 0;
    }
    us();
    window.addEventListener('scroll', us, { passive: true });
    if (reduceMotion) {
      draw(ctx, 0, env);
      window.addEventListener('scroll', function () { draw(ctx, 0, env); }, { passive: true });
      window.addEventListener('resize', function () { setTimeout(function () { draw(ctx, 0, env); }, 200); });
      return;
    }
    var running = true, last = 0, md = opts.fps ? 1000 / opts.fps : 0;
    function loop(now) {
      if (!running) return;
      if (now - last >= md) { draw(ctx, now * 0.001, env); last = now; }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
    document.addEventListener('visibilitychange', function () {
      running = !document.hidden; if (running) requestAnimationFrame(loop);
    });
  }

  function rIP() { return (10 + ((Math.random() * 240) | 0)) + '.' + ((Math.random() * 255) | 0) + '.' + ((Math.random() * 255) | 0) + '.' + ((Math.random() * 255) | 0); }
  function bg(ctx, w, h) { ctx.fillStyle = '#04060a'; ctx.fillRect(0, 0, w, h); }
  function MONO(ctx, px, w) { ctx.font = (w || '') + (w ? ' ' : '') + px + 'px "JetBrains Mono", monospace'; }

  // ── VAULT — combination dial cracker ──────────────────────────────────────
  function runVault() {
    var combo = [36, 72, 15];
    run2D(function (ctx, t, env) {
      bg(ctx, env.w, env.h);
      var cx = env.w / 2, cy = env.h / 2, R = Math.min(env.w, env.h) * 0.3;
      var found = Math.floor(env.scrollP * combo.length);
      var rot = env.scrollP * Math.PI * 2 * 4;
      var open = env.scrollP > 0.97;
      ctx.strokeStyle = 'rgba(45,255,158,.15)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(cx, cy, R * 1.14, 0, 7); ctx.stroke();
      ctx.strokeStyle = open ? '#2dff9e' : 'rgba(45,255,158,.5)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.stroke();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (var i = 0; i < 100; i += 2) {
        var a = (i / 100) * Math.PI * 2 - Math.PI / 2 + rot;
        var big = i % 10 === 0;
        var x1 = cx + Math.cos(a) * R, y1 = cy + Math.sin(a) * R;
        var x2 = cx + Math.cos(a) * (R - (big ? 16 : 8)), y2 = cy + Math.sin(a) * (R - (big ? 16 : 8));
        ctx.strokeStyle = 'rgba(45,255,158,.45)'; ctx.lineWidth = big ? 2 : 1;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        if (big) { MONO(ctx, 11); ctx.fillStyle = 'rgba(174,188,201,.8)'; ctx.fillText(i, cx + Math.cos(a) * (R - 30), cy + Math.sin(a) * (R - 30)); }
      }
      ctx.fillStyle = 'rgba(45,255,158,.08)'; ctx.beginPath(); ctx.arc(cx, cy, R * 0.45, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(56,225,255,.4)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, R * 0.45, 0, 7); ctx.stroke();
      // fixed pointer
      ctx.fillStyle = '#ffb454'; ctx.beginPath(); ctx.moveTo(cx, cy - R - 4); ctx.lineTo(cx - 9, cy - R - 20); ctx.lineTo(cx + 9, cy - R - 20); ctx.closePath(); ctx.fill();
      // bolts retract when open
      var len = 30 * (open ? 0 : 1);
      ctx.fillStyle = open ? 'rgba(45,255,158,.7)' : 'rgba(56,225,255,.55)';
      ctx.fillRect(cx - R * 1.14 - len, cy - 6, len, 12);
      ctx.fillRect(cx + R * 1.14, cy - 6, len, 12);
      // status
      var disp = '';
      for (var d = 0; d < combo.length; d++) { disp += (d < found ? combo[d] : '__'); if (d < combo.length - 1) disp += ' - '; }
      MONO(ctx, 20, '800');
      ctx.fillStyle = open ? '#2dff9e' : '#ffb454';
      ctx.fillText(open ? 'VAULT OPEN' : 'CRACKING  ' + disp, cx, cy + R + 48);
      MONO(ctx, 13); ctx.fillStyle = 'rgba(56,225,255,.8)';
      ctx.fillText(((Math.round(((-rot / (Math.PI * 2)) % 1 + 1) % 1 * 100)) % 100), cx, cy);
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    }, { fps: 40 });
  }

  // ── LOCK — pin-tumbler picking ─────────────────────────────────────────────
  function runLock() {
    var N = 6;
    run2D(function (ctx, t, env) {
      bg(ctx, env.w, env.h);
      var cx = env.w / 2, cy = env.h / 2, shear = cy;
      var bodyW = Math.min(env.w * 0.72, 540), bodyH = 220;
      var x0 = cx - bodyW / 2, top = cy - bodyH / 2, bot = cy + bodyH / 2;
      var allSet = env.scrollP > 0.98;
      ctx.strokeStyle = allSet ? '#2dff9e' : 'rgba(45,255,158,.4)'; ctx.lineWidth = 2;
      ctx.strokeRect(x0, top, bodyW, bodyH);
      // shear line (plug boundary)
      ctx.strokeStyle = allSet ? 'rgba(45,255,158,.6)' : 'rgba(56,225,255,.55)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x0, shear); ctx.lineTo(x0 + bodyW, shear); ctx.stroke();
      var colW = bodyW / (N + 1);
      for (var i = 0; i < N; i++) {
        var px = x0 + colW * (i + 1);
        var pi = Math.max(0, Math.min(1, (env.scrollP - i / N) * N));
        var set = pi >= 1;
        // split between driver (upper) and key (lower) pin; aligns to shear when set
        var splitY = shear + 30 * (1 - pi);
        ctx.strokeStyle = 'rgba(45,255,158,.18)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(px - 10, top); ctx.lineTo(px - 10, bot); ctx.moveTo(px + 10, top); ctx.lineTo(px + 10, bot); ctx.stroke();
        var col = set ? '#2dff9e' : (pi > 0 ? '#ffb454' : 'rgba(45,255,158,.55)');
        // driver pin (upper chamber)
        ctx.fillStyle = 'rgba(56,225,255,.5)';
        ctx.fillRect(px - 7, top + 6, 14, (splitY - 4) - (top + 6));
        // key pin (lower)
        ctx.fillStyle = col;
        ctx.fillRect(px - 7, splitY + 4, 14, bot - 6 - (splitY + 4));
      }
      ctx.textAlign = 'center';
      MONO(ctx, 18, '800');
      ctx.fillStyle = allSet ? '#2dff9e' : '#ffb454';
      ctx.fillText(allSet ? 'UNLOCKED — all pins set' : 'PICKING  ' + Math.floor(env.scrollP * N) + '/' + N + ' pins', cx, bot + 46);
      ctx.textAlign = 'left';
    }, { fps: 30 });
  }

  // ── ATTACK MAP — global threat feed ────────────────────────────────────────
  function runAttackMap() {
    var nodes = [], arcs = [], ticker = [], spawnAcc = 0;
    var pts = [[.18, .34], [.26, .5], [.46, .3], [.5, .56], [.62, .38], [.78, .42], [.84, .6], [.3, .66], [.7, .7], [.55, .26]];
    for (var i = 0; i < pts.length; i++) nodes.push({ x: pts[i][0], y: pts[i][1] });
    var kinds = ['DDoS', 'SQLi', 'BruteForce', 'Malware', 'PortScan', 'Exfil', 'C2 beacon'];
    run2D(function (ctx, t, env) {
      bg(ctx, env.w, env.h);
      var mx = env.w * 0.06, my = env.h * 0.14, mw = env.w * 0.88, mh = env.h * 0.6;
      function P(n) { return [mx + n.x * mw, my + n.y * mh]; }
      ctx.fillStyle = 'rgba(45,255,158,.10)';
      for (var x = mx; x < mx + mw; x += 14) for (var y = my; y < my + mh; y += 14) ctx.fillRect(x, y, 1.5, 1.5);
      for (var i = 0; i < nodes.length; i++) { var p = P(nodes[i]); ctx.fillStyle = 'rgba(56,225,255,.7)'; ctx.beginPath(); ctx.arc(p[0], p[1], 3, 0, 7); ctx.fill(); }
      spawnAcc += 0.6 + env.scrollP * 3;
      if (spawnAcc > 1) {
        spawnAcc = 0;
        var a = (Math.random() * nodes.length) | 0, b = (Math.random() * nodes.length) | 0;
        if (a !== b) {
          arcs.push({ a: a, b: b, t: 0, sp: 0.012 + Math.random() * 0.02, col: Math.random() > 0.7 ? '#ff3d7f' : '#ffb454' });
          ticker.unshift(kinds[(Math.random() * kinds.length) | 0] + '  ' + rIP() + '  ->  ' + rIP());
          if (ticker.length > 11) ticker.pop();
        }
      }
      for (var k = arcs.length - 1; k >= 0; k--) {
        var ar = arcs[k]; ar.t += ar.sp; if (ar.t > 1.3) { arcs.splice(k, 1); continue; }
        var pa = P(nodes[ar.a]), pb = P(nodes[ar.b]);
        var mpx = (pa[0] + pb[0]) / 2, mpy = (pa[1] + pb[1]) / 2 - Math.hypot(pb[0] - pa[0], pb[1] - pa[1]) * 0.3;
        ctx.globalAlpha = 0.55; ctx.strokeStyle = ar.col; ctx.lineWidth = 1.5; ctx.beginPath();
        var steps = 24, te = Math.min(1, ar.t);
        for (var s = 0; s <= steps * te; s++) {
          var tt = s / steps;
          var qx = (1 - tt) * (1 - tt) * pa[0] + 2 * (1 - tt) * tt * mpx + tt * tt * pb[0];
          var qy = (1 - tt) * (1 - tt) * pa[1] + 2 * (1 - tt) * tt * mpy + tt * tt * pb[1];
          if (s === 0) ctx.moveTo(qx, qy); else ctx.lineTo(qx, qy);
        }
        ctx.stroke();
        if (ar.t > 1) { ctx.globalAlpha = 1 - (ar.t - 1) / 0.3; ctx.beginPath(); ctx.arc(pb[0], pb[1], (ar.t - 1) / 0.3 * 16, 0, 7); ctx.stroke(); }
        ctx.globalAlpha = 1;
      }
      MONO(ctx, 16, '800'); ctx.fillStyle = 'rgba(45,255,158,.85)'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      ctx.fillText('GLOBAL ATTACK MAP', mx, my - 12);
      MONO(ctx, 12); var ty = my + mh + 22;
      ctx.fillStyle = '#38e1ff'; ctx.fillText('// LIVE THREAT FEED', mx, ty); ty += 17;
      for (var i2 = 0; i2 < ticker.length; i2++) { ctx.fillStyle = i2 === 0 ? '#ffb454' : 'rgba(174,188,201,' + (0.8 - i2 * 0.06) + ')'; ctx.fillText(ticker[i2], mx, ty); ty += 15; if (ty > env.h - 6) break; }
    }, { fps: 40 });
  }

  // ── RADAR — sonar sweep ────────────────────────────────────────────────────
  function runRadar() {
    var blips = [], prevA = 0;
    for (var i = 0; i < 16; i++) blips.push({ a: Math.random() * Math.PI * 2, d: 0.2 + Math.random() * 0.78, life: 0, col: Math.random() > 0.8 ? '#ffb454' : '#2dff9e' });
    run2D(function (ctx, t, env) {
      bg(ctx, env.w, env.h);
      var cx = env.w / 2, cy = env.h / 2, R = Math.min(env.w, env.h) * 0.42;
      ctx.strokeStyle = 'rgba(45,255,158,.18)'; ctx.lineWidth = 1;
      for (var r = 1; r <= 4; r++) { ctx.beginPath(); ctx.arc(cx, cy, R * r / 4, 0, 7); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy); ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R); ctx.stroke();
      var a = (t * (0.8 + env.scrollP * 2.4)) % (Math.PI * 2);
      for (var s = 0; s < 40; s++) {
        var aa = a - s * 0.03;
        ctx.strokeStyle = 'rgba(45,255,158,' + (0.25 * (1 - s / 40)) + ')';
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(aa) * R, cy + Math.sin(aa) * R); ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(201,255,230,.9)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); ctx.stroke();
      ctx.lineWidth = 1;
      for (var b = 0; b < blips.length; b++) {
        var bl = blips[b];
        var na = ((a - bl.a) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
        var pa = ((prevA - bl.a) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
        if (pa > na) bl.life = 1;
        bl.life *= 0.975;
        if (bl.life > 0.02) {
          var bx = cx + Math.cos(bl.a) * R * bl.d, by = cy + Math.sin(bl.a) * R * bl.d;
          ctx.globalAlpha = bl.life; ctx.fillStyle = bl.col;
          ctx.beginPath(); ctx.arc(bx, by, 4, 0, 7); ctx.fill();
          ctx.globalAlpha = bl.life * 0.3; ctx.beginPath(); ctx.arc(bx, by, 11, 0, 7); ctx.fill();
          ctx.globalAlpha = 1;
        }
      }
      prevA = a;
    }, { fps: 40 });
  }

  // ── SIEM — scrolling severity log feed ─────────────────────────────────────
  function runSiem() {
    var SEV = [['INFO', 'rgba(150,170,185,.7)'], ['WARN', '#ffb454'], ['CRIT', '#ff3d7f']];
    var tpl = ['auth.success user=%U from %I', 'session opened for %U', 'GET /api/v1/keys 200', 'failed password for %U from %I', 'firewall DROP %I', 'sudo: %U cmd=/bin/bash', 'TLS handshake %I', 'privilege escalation pid=%N', 'possible SQLi from %I', 'port scan detected %I', 'malware signature match %I', 'exfil attempt %I'];
    function usr() { var u = ['root', 'admin', 'www-data', 'deploy', 'svc', 'guest']; return u[(Math.random() * u.length) | 0]; }
    var lines = [];
    for (var i = 0; i < 240; i++) {
      var si = Math.random() > 0.86 ? 2 : (Math.random() > 0.72 ? 1 : 0);
      var m = tpl[(Math.random() * tpl.length) | 0].replace('%U', usr()).replace(/%I/g, rIP()).replace('%N', (2 + Math.random() * 8 | 0));
      lines.push({ sev: SEV[si][0], col: SEV[si][1], t: m, crit: si === 2 });
    }
    var lh = 18;
    run2D(function (ctx, t, env) {
      bg(ctx, env.w, env.h);
      MONO(ctx, 13); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      var rows = Math.ceil(env.h / lh) + 2;
      var pos = t * (16 + env.scrollP * 80) + env.scrollP * lines.length * lh * 0.25;
      var first = Math.floor(pos / lh), frac = pos % lh;
      for (var r = 0; r < rows; r++) {
        var li = ((first + r) % lines.length + lines.length) % lines.length;
        var L = lines[li], y = (r + 1) * lh - frac;
        ctx.fillStyle = L.crit ? 'rgba(255,61,127,' + (0.6 + 0.4 * Math.abs(Math.sin(t * 6 + li))) + ')' : L.col;
        ctx.fillText('[' + L.sev + '] ' + L.t, 16, y);
      }
    }, { fps: 30 });
  }

  // ── DECRYPT — ciphertext resolving into plaintext ──────────────────────────
  function runDecrypt() {
    var phrases = ['ACCESS GRANTED', 'DECRYPTING PAYLOAD', 'THE SECURITY VAULT', 'PRIVILEGE ESCALATED', 'ROOT SHELL ACQUIRED', 'FIREWALL BYPASSED'];
    var GL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&@!?$<>/';
    run2D(function (ctx, t, env) {
      bg(ctx, env.w, env.h);
      var fs = Math.max(18, Math.min(env.w / 15, 50));
      MONO(ctx, fs, '800'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      var nL = phrases.length, lineH = fs * 1.5, startY = env.h / 2 - (nL * lineH) / 2 + lineH / 2;
      for (var i = 0; i < nL; i++) {
        var p = phrases[i], lp = Math.max(0, Math.min(1, (env.scrollP * nL) - i + 0.5));
        var locked = Math.floor(lp * p.length), out = '';
        for (var c = 0; c < p.length; c++) out += p[c] === ' ' ? ' ' : (c < locked ? p[c] : GL[(Math.random() * GL.length) | 0]);
        ctx.fillStyle = lp >= 1 ? '#2dff9e' : 'rgba(45,255,158,' + (lp <= 0 ? 0.25 : 0.6) + ')';
        ctx.fillText(out, env.w / 2, startY + i * lineH);
      }
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    }, { fps: 24 });
  }

  // ── CRACK — hash brute force ───────────────────────────────────────────────
  function runCrack() {
    var HEX = '0123456789abcdef', CH = 'abcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    var target = '', pass = '';
    function rh(n) { var s = ''; for (var i = 0; i < n; i++) s += HEX[(Math.random() * 16) | 0]; return s; }
    function nr() { target = rh(40); pass = ''; var l = 8 + ((Math.random() * 6) | 0); for (var i = 0; i < l; i++) pass += CH[(Math.random() * CH.length) | 0]; }
    nr();
    var lh = 16;
    run2D(function (ctx, t, env) {
      bg(ctx, env.w, env.h);
      MONO(ctx, 13); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = 'rgba(45,255,158,.12)';
      var rows = Math.ceil(env.h / lh) + 1, cols = Math.min(64, (env.w / 8) | 0);
      for (var r = 0; r < rows; r++) { var s = ''; for (var c = 0; c < cols; c++) s += CH[(Math.random() * CH.length) | 0]; ctx.fillText(s, 14, (r + 1) * lh); }
      var cx = env.w / 2, cy = env.h / 2, prog = (t * 0.15 + env.scrollP) % 1;
      var locked = Math.floor(prog * pass.length), done = locked >= pass.length, shown = '';
      for (var i = 0; i < pass.length; i++) shown += i < locked ? pass[i] : CH[(Math.random() * CH.length) | 0];
      ctx.textAlign = 'center';
      MONO(ctx, 12); ctx.fillStyle = 'rgba(56,225,255,.8)'; ctx.fillText('TARGET SHA1: ' + target, cx, cy - 50);
      MONO(ctx, Math.min(env.w / 18, 34), '800'); ctx.fillStyle = done ? '#ffb454' : '#2dff9e'; ctx.fillText(shown, cx, cy);
      MONO(ctx, 13); ctx.fillStyle = done ? '#ffb454' : 'rgba(45,255,158,.7)';
      ctx.fillText(done ? '*** HASH CRACKED ***' : 'cracking... ' + Math.floor(prog * 100) + '%', cx, cy + 42);
      ctx.textAlign = 'left';
      if (done && Math.random() > 0.97) nr();
    }, { fps: 30 });
  }

  // ── BLOCKCHAIN — linked hash blocks ─────────────────────────────────────────
  function runChain() {
    var HEX = '0123456789abcdef';
    function h(n) { n = ((n % 100000) + 100000) % 100000; var s = ''; for (var i = 0; i < 10; i++) s += HEX[(n * 7 + i * 13 + i * i) % 16]; return s; }
    function rhex(n) { var s = ''; for (var i = 0; i < n; i++) s += HEX[(Math.random() * 16) | 0]; return s; }
    function rr(c, x, y, w, hh, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + hh, r); c.arcTo(x + w, y + hh, x, y + hh, r); c.arcTo(x, y + hh, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
    var bw = 156, bh = 92, gap = 46;
    run2D(function (ctx, t, env) {
      bg(ctx, env.w, env.h);
      var cy = env.h / 2 - bh / 2, speed = 38 + env.scrollP * 150;
      var off = (t * speed) % (bw + gap), base = Math.floor((t * speed) / (bw + gap));
      var count = Math.ceil(env.w / (bw + gap)) + 2;
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      for (var i = -1; i < count; i++) {
        var idx = base + i, x = i * (bw + gap) - off + 20;
        if (i > -1) { ctx.strokeStyle = 'rgba(56,225,255,.4)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - gap, cy + bh / 2); ctx.lineTo(x, cy + bh / 2); ctx.stroke(); }
        var mining = i === count - 1;
        ctx.fillStyle = 'rgba(45,255,158,.06)'; ctx.strokeStyle = mining ? '#ffb454' : 'rgba(45,255,158,.5)'; ctx.lineWidth = 1.5;
        rr(ctx, x, cy, bw, bh, 6); ctx.fill(); ctx.stroke();
        MONO(ctx, 11);
        ctx.fillStyle = '#38e1ff'; ctx.fillText('block #' + idx, x + 12, cy + 19);
        ctx.fillStyle = 'rgba(174,188,201,.8)'; ctx.fillText('nonce ' + ((idx * 9301 + 49297) % 100000), x + 12, cy + 37);
        ctx.fillStyle = mining ? '#ffb454' : '#2dff9e'; ctx.fillText('hash ' + (mining ? rhex(10) : h(idx)), x + 12, cy + 57);
        ctx.fillStyle = 'rgba(92,110,125,.75)'; ctx.fillText('prev ' + h(idx - 1), x + 12, cy + 75);
      }
      MONO(ctx, 16, '800'); ctx.fillStyle = 'rgba(45,255,158,.85)'; ctx.fillText('// HASH CHAIN', 20, 34);
    }, { fps: 30 });
  }

  // ── CIRCUIT — PCB traces with current pulses ────────────────────────────────
  function runCircuit() {
    var traces = [], pulses = [], grid = 26;
    function build(ctx, env) {
      traces = []; pulses = [];
      var cols = Math.floor(env.w / grid), rows = Math.floor(env.h / grid);
      var T = Math.min(30, Math.floor(cols * rows / 38) + 8);
      for (var i = 0; i < T; i++) {
        var x = (Math.random() * cols) | 0, y = (Math.random() * rows) | 0, dir = Math.random() > 0.5, steps = 6 + ((Math.random() * 10) | 0), pp = [[x, y]];
        for (var s = 0; s < steps; s++) {
          var len = 1 + ((Math.random() * 4) | 0);
          if (dir) x = Math.max(0, Math.min(cols, x + (Math.random() > 0.5 ? len : -len)));
          else y = Math.max(0, Math.min(rows, y + (Math.random() > 0.5 ? len : -len)));
          dir = !dir; pp.push([x, y]);
        }
        var sl = [], tot = 0;
        for (var k = 0; k < pp.length - 1; k++) { var d = (Math.abs(pp[k + 1][0] - pp[k][0]) + Math.abs(pp[k + 1][1] - pp[k][1])) * grid; sl.push(d); tot += d; }
        traces.push({ pts: pp, sl: sl, tot: tot });
      }
      for (var p = 0; p < Math.min(44, (T * 1.5) | 0); p++) pulses.push({ ti: (Math.random() * traces.length) | 0, d: Math.random(), sp: 0.002 + Math.random() * 0.006 });
    }
    function along(tr, d) {
      if (!tr || tr.tot === 0) return null;
      var tg = d * tr.tot, acc = 0;
      for (var k = 0; k < tr.sl.length; k++) { if (acc + tr.sl[k] >= tg) { var f = (tg - acc) / tr.sl[k], a = tr.pts[k], b = tr.pts[k + 1]; return [(a[0] + (b[0] - a[0]) * f) * grid, (a[1] + (b[1] - a[1]) * f) * grid]; } acc += tr.sl[k]; }
      var l = tr.pts[tr.pts.length - 1]; return [l[0] * grid, l[1] * grid];
    }
    run2D(function (ctx, t, env) {
      bg(ctx, env.w, env.h);
      ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(45,255,158,.18)';
      for (var i = 0; i < traces.length; i++) {
        var tr = traces[i]; ctx.beginPath(); ctx.moveTo(tr.pts[0][0] * grid, tr.pts[0][1] * grid);
        for (var k = 1; k < tr.pts.length; k++) ctx.lineTo(tr.pts[k][0] * grid, tr.pts[k][1] * grid);
        ctx.stroke();
        ctx.fillStyle = 'rgba(56,225,255,.3)';
        ctx.beginPath(); ctx.arc(tr.pts[0][0] * grid, tr.pts[0][1] * grid, 3, 0, 7); ctx.fill();
        var l = tr.pts[tr.pts.length - 1]; ctx.beginPath(); ctx.arc(l[0] * grid, l[1] * grid, 3, 0, 7); ctx.fill();
      }
      for (var p = 0; p < pulses.length; p++) {
        var pu = pulses[p]; pu.d += pu.sp * (1 + env.scrollP * 3); if (pu.d > 1) { pu.d = 0; pu.ti = (Math.random() * traces.length) | 0; }
        var ps = along(traces[pu.ti], pu.d);
        if (ps) { ctx.fillStyle = '#c9ffe6'; ctx.beginPath(); ctx.arc(ps[0], ps[1], 2.5, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(45,255,158,.4)'; ctx.beginPath(); ctx.arc(ps[0], ps[1], 6, 0, 7); ctx.fill(); }
      }
    }, { fps: 40, onResize: build });
  }

  // ── OVERFLOW — buffer overflow / stack smash ────────────────────────────────
  function runOverflow() {
    var cells = [];
    function build(ctx, env) {
      cells = [];
      for (var i = 7; i >= 0; i--) cells.push({ name: 'buf[' + i + ']', type: 'buf' });
      cells.push({ name: 'saved EBP', type: 'ebp' });
      cells.push({ name: 'ret addr', type: 'ret' });
      cells.reverse(); // top->bottom: ret, ebp, buf7..buf0
    }
    run2D(function (ctx, t, env) {
      bg(ctx, env.w, env.h);
      var n = cells.length, cw = Math.min(360, env.w * 0.7), ch = Math.min(34, (env.h - 140) / n), x = (env.w - cw) / 2, y0 = 72;
      var fill = env.scrollP, filled = fill * n;
      MONO(ctx, 13); ctx.textBaseline = 'middle';
      for (var i = 0; i < n; i++) {
        var fromBottom = n - 1 - i, y = y0 + i * ch, isF = fromBottom < filled, cell = cells[i];
        var ov = isF && (cell.type === 'ebp' || cell.type === 'ret');
        ctx.strokeStyle = ov ? '#ff3d7f' : 'rgba(45,255,158,.4)'; ctx.lineWidth = 1.5;
        ctx.fillStyle = ov ? 'rgba(255,61,127,.12)' : (isF ? 'rgba(45,255,158,.12)' : 'rgba(20,30,40,.4)');
        ctx.fillRect(x, y, cw, ch - 4); ctx.strokeRect(x, y, cw, ch - 4);
        var content = isF ? ((ov && cell.type === 'ret' && fill > 0.92) ? '0xDEADBEEF' : '41 41 41 41') : '00 00 00 00';
        ctx.fillStyle = ov ? '#ff3d7f' : (isF ? '#c9ffe6' : 'rgba(92,110,125,.6)');
        ctx.textAlign = 'left'; ctx.fillText(content, x + 12, y + (ch - 4) / 2);
        ctx.fillStyle = 'rgba(150,170,185,.7)'; ctx.textAlign = 'right'; ctx.fillText(cell.name, x + cw - 12, y + (ch - 4) / 2);
      }
      ctx.textAlign = 'center'; MONO(ctx, 17, '800');
      if (fill > 0.92) { ctx.fillStyle = '#ff3d7f'; ctx.fillText('*** STACK SMASHED - EIP HIJACKED ***', env.w / 2, 40); }
      else if (fill > 0.7) { ctx.fillStyle = '#ffb454'; ctx.fillText('buffer overflow imminent...', env.w / 2, 40); }
      else { ctx.fillStyle = 'rgba(45,255,158,.8)'; ctx.fillText('strcpy(buf, input)  ' + Math.floor(fill * 100) + '%', env.w / 2, 40); }
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    }, { fps: 20, onResize: build });
  }

  // ── PENTEST — scroll-scrubbed live session transcript ───────────────────────
  function runPentest() {
    var sc = [
      { c: '$ nmap -sV 10.0.0.7', o: ['Starting Nmap 7.94', '22/tcp  open  ssh     OpenSSH 8.9', '80/tcp  open  http    nginx 1.24', '443/tcp open  https   nginx 1.24', '3306/tcp open mysql   MySQL 8.0'] },
      { c: '$ gobuster dir -u http://10.0.0.7 -w common.txt', o: ['/admin   (Status: 301)', '/backup  (Status: 200)', '/.git    (Status: 200)'] },
      { c: '$ hydra -l root -P rockyou.txt 10.0.0.7 ssh', o: ['[ATTEMPT] root:123456', '[ATTEMPT] root:password', '[22][ssh] login: root  password: hunter2', '1 valid password found'] },
      { c: '$ ssh root@10.0.0.7', o: ['root@target:~# id', 'uid=0(root) gid=0(root) groups=0(root)', 'root@target:~# cat /root/flag.txt', 'FLAG{the_security_vault_was_here}'] }
    ];
    var lines = [];
    for (var i = 0; i < sc.length; i++) { lines.push({ t: sc[i].c, cmd: true }); for (var j = 0; j < sc[i].o.length; j++) lines.push({ t: sc[i].o[j], cmd: false }); }
    var lh = 21;
    run2D(function (ctx, t, env) {
      bg(ctx, env.w, env.h);
      MONO(ctx, 14); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      var reveal = Math.max(1, Math.ceil(env.scrollP * lines.length));
      var rows = Math.ceil(env.h / lh) - 1, start = Math.max(0, reveal - rows), yy = env.h - 44;
      for (var r = reveal - 1; r >= start; r--) {
        var L = lines[r]; if (!L) continue;
        ctx.fillStyle = L.cmd ? '#2dff9e' : (/(FLAG|valid|uid=0)/.test(L.t) ? '#ffb454' : 'rgba(174,188,201,.85)');
        ctx.fillText(L.t, 24, yy); yy -= lh;
      }
      if (Math.floor(t * 2) % 2 === 0) { ctx.fillStyle = '#2dff9e'; ctx.fillText('_', 24, env.h - 44 + lh); }
    }, { fps: 20 });
  }

  // ── GLITCH — datamosh / signal intercepted ──────────────────────────────────
  function runGlitch() {
    var GL = '01<>/\\|=+*#%ABCDEF';
    run2D(function (ctx, t, env) {
      bg(ctx, env.w, env.h);
      var intensity = 0.3 + env.scrollP * 0.7 + (Math.sin(t * 9) > 0.93 ? 0.4 : 0);
      MONO(ctx, 14); ctx.textBaseline = 'top'; ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(45,255,158,.10)';
      for (var y = 0; y < env.h; y += 18) { var s = ''; for (var x = 0; x < env.w; x += 10) s += GL[(Math.random() * GL.length) | 0]; ctx.fillText(s, 4, y); }
      var slices = Math.floor(6 + intensity * 22);
      for (var i = 0; i < slices; i++) {
        var sy = Math.random() * env.h, sh = 4 + Math.random() * 30, dx = (Math.random() - 0.5) * 120 * intensity;
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,61,127,' + (0.12 + intensity * 0.2) + ')' : 'rgba(56,225,255,' + (0.12 + intensity * 0.2) + ')';
        ctx.fillRect(dx, sy, env.w, sh);
        ctx.globalCompositeOperation = 'source-over';
      }
      ctx.strokeStyle = 'rgba(201,255,230,.15)'; ctx.lineWidth = 1;
      for (var k = 0; k < 4; k++) { var ly = Math.random() * env.h; ctx.beginPath(); ctx.moveTo(0, ly); ctx.lineTo(env.w, ly); ctx.stroke(); }
      if (Math.sin(t * 9) > 0.93 || env.scrollP > 0.85) {
        MONO(ctx, Math.min(env.w / 12, 46), '800'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ff3d7f'; ctx.fillText('SIGNAL INTERCEPTED', env.w / 2 + (Math.random() - 0.5) * 8, env.h / 2);
        ctx.fillStyle = 'rgba(56,225,255,.6)'; ctx.fillText('SIGNAL INTERCEPTED', env.w / 2 - 4, env.h / 2 + 2);
      }
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    }, { fps: 24 });
  }

  // ════════════════════════════════════════════════════════════════════════
  // WEBGL — shared harness for graph / terrain / tunnel / wave / morph / globe
  // ════════════════════════════════════════════════════════════════════════
  function runWebGL(kind) {
    var renderer = new THREE.WebGLRenderer({
      canvas: canvas, alpha: true, antialias: !isMobile, powerPreference: 'high-performance'
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    var scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x04060a, kind === 'terrain' ? 0.12 : 0.16);
    var camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0, 3.4);

    // shared interaction state
    var scroll = 0, scrollTarget = 0, pX = 0, pY = 0, pointerX = 0, pointerY = 0;
    function onScroll() {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      scrollTarget = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    if (!isMobile && !reduceMotion) {
      window.addEventListener('pointermove', function (e) {
        pointerX = (e.clientX / window.innerWidth) * 2 - 1;
        pointerY = (e.clientY / window.innerHeight) * 2 - 1;
      }, { passive: true });
    }

    var COLORS = [0x2dff9e, 0x38e1ff, 0xffb454, 0xff3d7f];
    var dotTex = makeDotTexture();

    var api = ({
      graph: buildGraph, terrain: buildTerrain, tunnel: buildTunnel,
      wave: buildWave, morph: buildMorph, globe: buildGlobe, c2: buildC2
    })[kind]();

    var rt;
    function resize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(resize, 150); });

    var clock = new THREE.Clock();
    function render() {
      var t = clock.getElapsedTime();
      scroll += (scrollTarget - scroll) * 0.06;
      pX += (pointerX - pX) * 0.05;
      pY += (pointerY - pY) * 0.05;
      api.update(t);
      renderer.render(scene, camera);
    }

    if (reduceMotion) {
      render();
      window.addEventListener('scroll', function () { scroll = scrollTarget; render(); }, { passive: true });
      window.addEventListener('resize', function () { setTimeout(render, 200); });
      return;
    }
    var running = true;
    function loop() { if (!running) return; render(); requestAnimationFrame(loop); }
    requestAnimationFrame(loop);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { running = false; }
      else if (!running) { running = true; clock.start(); requestAnimationFrame(loop); }
    });

    // ── shared helpers ──
    function makeDotTexture() {
      var s = 64, cv = document.createElement('canvas');
      cv.width = cv.height = s;
      var c = cv.getContext('2d');
      var g = c.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(0.3, 'rgba(255,255,255,0.8)');
      g.addColorStop(0.65, 'rgba(255,255,255,0.12)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g; c.fillRect(0, 0, s, s);
      var tex = new THREE.CanvasTexture(cv); tex.needsUpdate = true; return tex;
    }

    // ── GRAPH ─────────────────────────────────────────────────────────────
    function buildGraph() {
      var group = new THREE.Group(); scene.add(group);
      var N = isMobile ? 46 : 92;
      var verts = [];
      for (var i = 0; i < N; i++) {
        verts.push(new THREE.Vector3(
          (Math.random() * 2 - 1) * 2.6,
          (Math.random() * 2 - 1) * 1.7,
          (Math.random() * 2 - 1) * 1.6));
      }
      // node points
      var npos = new Float32Array(N * 3), ncol = new Float32Array(N * 3);
      var baseCol = [], col = new THREE.Color();
      for (var n = 0; n < N; n++) {
        npos[n * 3] = verts[n].x; npos[n * 3 + 1] = verts[n].y; npos[n * 3 + 2] = verts[n].z;
        col.setHex(Math.random() > 0.5 ? 0x2dff9e : 0x38e1ff);
        baseCol.push(col.clone());
        ncol[n * 3] = col.r; ncol[n * 3 + 1] = col.g; ncol[n * 3 + 2] = col.b;
      }
      var ng = new THREE.BufferGeometry();
      ng.setAttribute('position', new THREE.BufferAttribute(npos, 3));
      ng.setAttribute('color', new THREE.BufferAttribute(ncol, 3));
      var nodes = new THREE.Points(ng, new THREE.PointsMaterial({
        size: isMobile ? 0.12 : 0.1, map: dotTex, vertexColors: true,
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
      }));
      group.add(nodes);

      // edges (nearest neighbors)
      var edges = [], epos = [];
      for (var a = 0; a < N; a++) {
        var dists = [];
        for (var b = 0; b < N; b++) if (b !== a) dists.push([b, verts[a].distanceTo(verts[b])]);
        dists.sort(function (x, y) { return x[1] - y[1]; });
        var deg = 2 + ((Math.random() * 2) | 0);
        for (var d = 0; d < deg && d < dists.length; d++) {
          var j = dists[d][0];
          if (a < j) { edges.push([a, j]); epos.push(verts[a].x, verts[a].y, verts[a].z, verts[j].x, verts[j].y, verts[j].z); }
        }
      }
      var eg = new THREE.BufferGeometry();
      eg.setAttribute('position', new THREE.Float32BufferAttribute(epos, 3));
      var lines = new THREE.LineSegments(eg, new THREE.LineBasicMaterial({
        color: 0x2dff9e, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false
      }));
      group.add(lines);

      // packets traveling along a subset of edges
      var P = Math.min(edges.length, isMobile ? 16 : 40);
      var packets = [], ppos = new Float32Array(P * 3);
      for (var p = 0; p < P; p++) {
        var e = edges[(Math.random() * edges.length) | 0];
        packets.push({ a: verts[e[0]], b: verts[e[1]], t: Math.random(), sp: 0.004 + Math.random() * 0.01 });
      }
      var pg = new THREE.BufferGeometry();
      pg.setAttribute('position', new THREE.BufferAttribute(ppos, 3));
      var pkt = new THREE.Points(pg, new THREE.PointsMaterial({
        size: 0.16, map: dotTex, color: 0xffffff, transparent: true,
        depthWrite: false, blending: THREE.AdditiveBlending
      }));
      group.add(pkt);

      var flashT = 0, flashIdx = -1, red = new THREE.Color(0xff3d7f);
      return {
        update: function (t) {
          group.rotation.y = t * 0.05 + scroll * Math.PI * 1.3 + pX * 0.3;
          group.rotation.x = -0.05 + pY * 0.2 + scroll * 0.2;
          // packets
          for (var i = 0; i < P; i++) {
            var pk = packets[i];
            pk.t += pk.sp * (1 + scroll);
            if (pk.t > 1) { pk.t = 0; var e2 = edges[(Math.random() * edges.length) | 0]; pk.a = verts[e2[0]]; pk.b = verts[e2[1]]; }
            ppos[i * 3] = pk.a.x + (pk.b.x - pk.a.x) * pk.t;
            ppos[i * 3 + 1] = pk.a.y + (pk.b.y - pk.a.y) * pk.t;
            ppos[i * 3 + 2] = pk.a.z + (pk.b.z - pk.a.z) * pk.t;
          }
          pg.attributes.position.needsUpdate = true;
          lines.material.opacity = 0.14 + scroll * 0.2;
          // breach flash
          flashT -= 0.016;
          if (flashT <= 0) {
            if (flashIdx >= 0) { ncol[flashIdx * 3] = baseCol[flashIdx].r; ncol[flashIdx * 3 + 1] = baseCol[flashIdx].g; ncol[flashIdx * 3 + 2] = baseCol[flashIdx].b; }
            flashIdx = (Math.random() * N) | 0;
            ncol[flashIdx * 3] = red.r; ncol[flashIdx * 3 + 1] = red.g; ncol[flashIdx * 3 + 2] = red.b;
            ng.attributes.color.needsUpdate = true;
            flashT = 0.4 + Math.random() * 0.8;
          }
          camera.position.x += (pX * 0.3 - camera.position.x) * 0.05;
          camera.position.y += (-pY * 0.2 - camera.position.y) * 0.05;
          camera.position.z = 3.4 - scroll * 0.8;
          camera.lookAt(0, 0, 0);
        }
      };
    }

    // ── TERRAIN ───────────────────────────────────────────────────────────
    function buildTerrain() {
      var SEG = isMobile ? 36 : 64;
      var geo = new THREE.PlaneGeometry(16, 16, SEG, SEG);
      var mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
        color: 0x2dff9e, wireframe: true, transparent: true, opacity: 0.5
      }));
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = -1.5;
      scene.add(mesh);

      // glowing horizon
      var horizon = new THREE.Mesh(
        new THREE.PlaneGeometry(40, 8),
        new THREE.MeshBasicMaterial({ color: 0x38e1ff, transparent: true, opacity: 0.06, depthWrite: false }));
      horizon.position.set(0, 0.6, -9);
      scene.add(horizon);

      var pos = geo.attributes.position;
      var ox = [], oy = [];
      for (var i = 0; i < pos.count; i++) { ox.push(pos.getX(i)); oy.push(pos.getY(i)); }
      function h(x, y) {
        return 0.45 * Math.sin(x * 0.6 + y * 0.35) +
          0.28 * Math.sin(x * 0.25 - y * 0.8) +
          0.18 * Math.sin(x * 1.3 + y * 0.2);
      }
      return {
        update: function (t) {
          var off = t * (0.5 + scroll * 1.6);
          for (var i = 0; i < pos.count; i++) {
            pos.setZ(i, h(ox[i], oy[i] + off));
          }
          pos.needsUpdate = true;
          mesh.material.opacity = 0.4 + scroll * 0.25;
          camera.position.x += (pX * 0.5 - camera.position.x) * 0.05;
          camera.position.y = 0.6 - pY * 0.15;
          camera.position.z = 2.7 - scroll * 0.6;
          camera.lookAt(0, -0.4, -7);
        }
      };
    }

    // ── TUNNEL ────────────────────────────────────────────────────────────
    function buildTunnel() {
      var group = new THREE.Group(); scene.add(group);
      var N = isMobile ? 360 : 950;
      var DEPTH = 16, NEAR = 3.2;
      var pos = new Float32Array(N * 3), col = new Float32Array(N * 3), c = new THREE.Color();
      var data = [];
      for (var i = 0; i < N; i++) {
        var ang = Math.random() * Math.PI * 2;
        var rad = 0.6 + Math.random() * 1.8;
        var z = NEAR - Math.random() * DEPTH;
        data.push({ ang: ang, rad: rad });
        pos[i * 3] = Math.cos(ang) * rad; pos[i * 3 + 1] = Math.sin(ang) * rad; pos[i * 3 + 2] = z;
        c.setHex(COLORS[(Math.random() * 2) | 0]); // green/cyan
        col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      }
      var g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      var pts = new THREE.Points(g, new THREE.PointsMaterial({
        size: 0.07, map: dotTex, vertexColors: true, transparent: true,
        depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true
      }));
      group.add(pts);

      // structural rings
      var rings = [];
      var RC = isMobile ? 6 : 12;
      for (var r = 0; r < RC; r++) {
        var pts2 = [];
        for (var a = 0; a <= 48; a++) { var aa = a / 48 * Math.PI * 2; pts2.push(new THREE.Vector3(Math.cos(aa) * 2.1, Math.sin(aa) * 2.1, 0)); }
        var rg = new THREE.BufferGeometry().setFromPoints(pts2);
        var ring = new THREE.Line(rg, new THREE.LineBasicMaterial({ color: 0x38e1ff, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending }));
        ring.position.z = NEAR - (r / RC) * DEPTH;
        group.add(ring); rings.push(ring);
      }

      camera.position.set(0, 0, NEAR);
      return {
        update: function (t) {
          var sp = 0.04 + scroll * 0.14;
          for (var i = 0; i < N; i++) {
            var z = pos[i * 3 + 2] + sp;
            if (z > NEAR) z -= DEPTH;
            pos[i * 3 + 2] = z;
          }
          g.attributes.position.needsUpdate = true;
          for (var r = 0; r < rings.length; r++) {
            rings[r].position.z += sp;
            if (rings[r].position.z > NEAR) rings[r].position.z -= DEPTH;
          }
          group.rotation.z = t * 0.05;
          camera.position.x += (pX * 0.6 - camera.position.x) * 0.04;
          camera.position.y += (-pY * 0.4 - camera.position.y) * 0.04;
          camera.lookAt(0, 0, -6);
        }
      };
    }

    // ── WAVE ──────────────────────────────────────────────────────────────
    function buildWave() {
      var GX = isMobile ? 44 : 82, GY = isMobile ? 26 : 50, count = GX * GY;
      var pos = new Float32Array(count * 3), col = new Float32Array(count * 3);
      var gx = [], gz = [], c = new THREE.Color(), i = 0;
      for (var iy = 0; iy < GY; iy++) {
        for (var ix = 0; ix < GX; ix++) {
          var x = (ix / (GX - 1) - 0.5) * 17, z = (iy / (GY - 1) - 0.5) * 17;
          gx.push(x); gz.push(z);
          pos[i * 3] = x; pos[i * 3 + 1] = 0; pos[i * 3 + 2] = z;
          c.setHex(iy % 6 === 0 ? 0x38e1ff : 0x2dff9e);
          col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
          i++;
        }
      }
      var g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      var pts = new THREE.Points(g, new THREE.PointsMaterial({
        size: isMobile ? 0.08 : 0.06, map: dotTex, vertexColors: true,
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true
      }));
      scene.add(pts);
      return {
        update: function (t) {
          var amp = 0.35 + scroll * 1.8;
          for (var k = 0; k < count; k++) {
            var x = gx[k], z = gz[k];
            pos[k * 3 + 1] = (Math.sin(x * 0.45 + t * 1.1) + Math.cos(z * 0.5 + t * 0.9)) * amp
              + Math.sin((x + z) * 0.2 - t) * amp * 0.3;
          }
          g.attributes.position.needsUpdate = true;
          pts.rotation.y = pX * 0.2;
          camera.position.x += (pX * 0.6 - camera.position.x) * 0.05;
          camera.position.y = 4.4 - scroll * 2.6 - pY * 0.3;
          camera.position.z = 6.2 - scroll * 1.2;
          camera.lookAt(0, 0, 0);
        }
      };
    }

    // ── MORPH (point cloud that morphs through shapes as you scroll) ─────────
    function buildMorph() {
      var COUNT = isMobile ? 1200 : 2600;
      function alloc() { return new Float32Array(COUNT * 3); }
      var sphere = alloc(), torus = alloc(), helix = alloc(), grid = alloc();
      var side = Math.ceil(Math.sqrt(COUNT));
      for (var i = 0; i < COUNT; i++) {
        var phi = Math.acos(1 - 2 * (i + 0.5) / COUNT), th = Math.PI * (1 + Math.sqrt(5)) * i, rr = 1.7;
        sphere[i * 3] = Math.sin(phi) * Math.cos(th) * rr;
        sphere[i * 3 + 1] = Math.cos(phi) * rr;
        sphere[i * 3 + 2] = Math.sin(phi) * Math.sin(th) * rr;
        var u = Math.random() * Math.PI * 2, vv = Math.random() * Math.PI * 2, R = 1.45, r2 = 0.52;
        torus[i * 3] = (R + r2 * Math.cos(vv)) * Math.cos(u);
        torus[i * 3 + 1] = r2 * Math.sin(vv);
        torus[i * 3 + 2] = (R + r2 * Math.cos(vv)) * Math.sin(u);
        var p = i / COUNT, ang = p * Math.PI * 10, strand = (i % 2) ? 0 : Math.PI;
        helix[i * 3] = Math.cos(ang + strand) * 0.95;
        helix[i * 3 + 1] = (p - 0.5) * 3.4;
        helix[i * 3 + 2] = Math.sin(ang + strand) * 0.95;
        var gx2 = i % side, gy2 = Math.floor(i / side);
        grid[i * 3] = (gx2 / (side - 1) - 0.5) * 3.8;
        grid[i * 3 + 1] = (gy2 / (side - 1) - 0.5) * 3.8;
        grid[i * 3 + 2] = 0;
      }
      var targets = [sphere, torus, helix, grid];
      var pos = alloc(); pos.set(sphere);
      var col = new Float32Array(COUNT * 3), c = new THREE.Color();
      for (var j = 0; j < COUNT; j++) { c.setHex(COLORS[j % COLORS.length]); col[j * 3] = c.r; col[j * 3 + 1] = c.g; col[j * 3 + 2] = c.b; }
      var g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      var grp = new THREE.Group(); scene.add(grp);
      grp.add(new THREE.Points(g, new THREE.PointsMaterial({
        size: isMobile ? 0.05 : 0.04, map: dotTex, vertexColors: true,
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
      })));
      function smooth(x) { return x * x * (3 - 2 * x); }
      return {
        update: function (t) {
          var s = scroll * (targets.length - 1);
          var idx = Math.min(Math.floor(s), targets.length - 2), f = smooth(s - idx);
          var A = targets[idx], B = targets[idx + 1];
          for (var k = 0; k < COUNT * 3; k++) pos[k] = A[k] + (B[k] - A[k]) * f;
          g.attributes.position.needsUpdate = true;
          grp.rotation.y = t * 0.12 + pX * 0.4 + scroll * Math.PI;
          grp.rotation.x = -0.1 + pY * 0.2;
          camera.position.x += (pX * 0.4 - camera.position.x) * 0.05;
          camera.position.y += (-pY * 0.3 - camera.position.y) * 0.05;
          camera.position.z = 4.3;
          camera.lookAt(0, 0, 0);
        }
      };
    }

    // ── C2 — 3D scroll-driven attack kill-chain ──────────────────────────────
    function buildC2() {
      var grp = new THREE.Group(); scene.add(grp);
      makeStars();

      function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
      function label(text, color) {
        var fs = 36, pad = 12, cv = document.createElement('canvas'), c = cv.getContext('2d');
        c.font = '700 ' + fs + 'px "JetBrains Mono", monospace';
        var w = Math.ceil(c.measureText(text).width);
        cv.width = w + pad * 2; cv.height = fs + pad * 2;
        c = cv.getContext('2d');
        c.font = '700 ' + fs + 'px "JetBrains Mono", monospace'; c.textBaseline = 'middle';
        c.fillStyle = 'rgba(7,12,19,0.82)'; rr(c, 1, 1, cv.width - 2, cv.height - 2, 9); c.fill();
        c.strokeStyle = color; c.lineWidth = 2; rr(c, 1, 1, cv.width - 2, cv.height - 2, 9); c.stroke();
        c.fillStyle = color; c.fillText(text, pad, cv.height / 2 + 1);
        var tex = new THREE.CanvasTexture(cv); tex.needsUpdate = true;
        var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: false }));
        sp.scale.set(cv.width / cv.height * 0.5, 0.5, 1);
        return sp;
      }

      // TARGET host (wireframe machine) at origin
      var host = new THREE.Group(); grp.add(host);
      var hostBox = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.15, 0.82, 1.15)),
        new THREE.LineBasicMaterial({ color: 0x2dff9e, transparent: true, opacity: 0.75 }));
      host.add(hostBox);
      var screen = new THREE.Mesh(new THREE.PlaneGeometry(0.94, 0.62), new THREE.MeshBasicMaterial({ color: 0x07140e, transparent: true, opacity: 0.85, side: THREE.DoubleSide }));
      screen.position.z = 0.58; host.add(screen);
      var core = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.6], 3)),
        new THREE.PointsMaterial({ size: 0.4, map: dotTex, color: 0x2dff9e, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      host.add(core);

      // C2 attacker node (octahedron) above
      var c2 = new THREE.Group(); c2.position.set(0, 1.95, 0); grp.add(c2);
      c2.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.OctahedronGeometry(0.5)),
        new THREE.LineBasicMaterial({ color: 0xff3d7f, transparent: true, opacity: 0.85 })));
      var c2core = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0], 3)),
        new THREE.PointsMaterial({ size: 0.5, map: dotTex, color: 0xff3d7f, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      c2.add(c2core);
      var c2label = label('C2', '#ff3d7f'); c2label.scale.multiplyScalar(0.7); c2label.position.set(0, 1.95 + 0.7, 0); grp.add(c2label);

      // BEAM + packets
      var beamTop = 1.5, beamBot = 0.45;
      var beam = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, beamTop, 0), new THREE.Vector3(0, beamBot, 0)]),
        new THREE.LineBasicMaterial({ color: 0x38e1ff, transparent: true, opacity: 0.4 }));
      grp.add(beam);
      var PK = 30, pkPos = new Float32Array(PK * 3), pkGeo = new THREE.BufferGeometry();
      pkGeo.setAttribute('position', new THREE.BufferAttribute(pkPos, 3));
      var pkMat = new THREE.PointsMaterial({ size: 0.12, map: dotTex, color: 0x38e1ff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
      grp.add(new THREE.Points(pkGeo, pkMat));

      // ENUM badges around target
      var bTxt = ['macOS 14.4', 'AV: none', 'EDR: CrowdStrike'], bCol = ['#38e1ff', '#2dff9e', '#ffb454'];
      var bPos = [new THREE.Vector3(-1.85, 0.6, 0.3), new THREE.Vector3(1.8, 0.25, 0.2), new THREE.Vector3(-1.6, -0.7, 0.4)];
      var badges = [];
      for (var i = 0; i < 3; i++) { var b = label(bTxt[i], bCol[i]); b.scale.multiplyScalar(0.8); b.position.copy(bPos[i]); b.material.opacity = 0; grp.add(b); badges.push(b); }

      // MODULES (fly in at stage 2)
      var modules = [];
      for (var i = 0; i < 2; i++) { var mm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), new THREE.MeshBasicMaterial({ color: 0x2dff9e, wireframe: true, transparent: true })); mm.visible = false; grp.add(mm); modules.push(mm); }

      // LOOT (emerge + orbit, gated by stage)
      var lootDef = [
        { s: 3, t: 'id_ed25519', col: 0xffb454 }, { s: 3, t: 'aws/creds', col: 0xffb454 }, { s: 3, t: 'keychain', col: 0xffb454 },
        { s: 4, t: '47 cookies', col: 0x38e1ff }, { s: 5, t: 'loot.tar.gz', col: 0x2dff9e }
      ], loot = [];
      for (var i = 0; i < lootDef.length; i++) {
        var d = lootDef[i];
        var mesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.13), new THREE.MeshBasicMaterial({ color: d.col }));
        var spr = label(d.t, '#' + ('000000' + d.col.toString(16)).slice(-6)); spr.scale.multiplyScalar(0.62); spr.material.opacity = 0;
        mesh.visible = false; grp.add(mesh); grp.add(spr);
        loot.push({ s: d.s, mesh: mesh, spr: spr, ang: (i / lootDef.length) * Math.PI * 2, rad: 1.75 });
      }

      // STAGE title (swapped on change)
      var STAGES = [
        ['IMPLANT HEARTBEAT', 'beacon 0x4F2A · alive', '#2dff9e'],
        ['ENUMERATING TARGET', 'macOS · AV none · EDR active', '#38e1ff'],
        ['LOADING MODULES', 'stealth.dylib · cs_bypass.dylib', '#2dff9e'],
        ['HARVESTING CREDENTIALS', 'ssh · aws · keychain', '#ffb454'],
        ['EXTRACTING COOKIES', '47 sessions · Chrome, Safari', '#38e1ff'],
        ['ARCHIVING HOME', 'loot.tar.gz · 1.2 GB', '#2dff9e'],
        ['EXFILTRATING', 'DNS tunnel → 185.220.101.42', '#ffb454'],
        ['CONNECTION LOST', 'reconnect 1/5 · 2/5 …', '#ff3d7f'],
        ['CHANNEL RE-ESTABLISHED', 'beacon alive', '#2dff9e']
      ];
      var titleGrp = new THREE.Group(); titleGrp.position.set(0, 2.7, 0); grp.add(titleGrp);
      var curStage = -1;
      function setStage(i) {
        if (i === curStage) return; curStage = i;
        titleGrp.clear();
        var ts = label(STAGES[i][0], STAGES[i][2]); ts.scale.multiplyScalar(1.55); ts.position.y = 0.36; titleGrp.add(ts);
        var ss = label(STAGES[i][1], 'rgba(174,188,201,.9)'); ss.scale.multiplyScalar(0.85); ss.position.y = -0.26; titleGrp.add(ss);
      }

      return {
        update: function (t) {
          var nS = STAGES.length, sp = scroll * nS, stage = Math.min(Math.floor(sp), nS - 1), frac = sp - stage;
          setStage(stage);
          var lost = stage === 7, exfil = stage === 6;

          host.rotation.y = t * 0.3 + pX * 0.4; host.rotation.x = pY * 0.25 + Math.sin(t * 0.4) * 0.08;
          core.material.size = 0.32 + Math.sin(t * 4) * 0.12;
          hostBox.material.color.setHex(lost ? 0xff3d7f : 0x2dff9e);
          hostBox.material.opacity = lost ? 0.45 + 0.5 * Math.abs(Math.sin(t * 12)) : 0.75;

          c2.rotation.y = -t * 0.5; c2.rotation.z = t * 0.2;
          c2core.material.size = 0.42 + Math.sin(t * 3) * 0.12;

          beam.material.color.setHex(lost ? 0xff3d7f : 0x38e1ff);
          beam.material.opacity = lost ? 0.2 + 0.3 * Math.abs(Math.sin(t * 14)) : 0.4;
          pkMat.color.setHex(exfil ? 0xffb454 : 0x38e1ff);
          for (var k = 0; k < PK; k++) {
            var base = ((t * (0.4 + scroll * 0.5) + k / PK) % 1 + 1) % 1;
            var f = exfil ? 1 - base : base;
            pkPos[k * 3] = 0; pkPos[k * 3 + 1] = lost ? 999 : beamTop + (beamBot - beamTop) * f; pkPos[k * 3 + 2] = 0;
          }
          pkGeo.attributes.position.needsUpdate = true;

          for (var i = 0; i < badges.length; i++) { var tgt = stage >= 1 ? 1 : 0; badges[i].material.opacity += (tgt - badges[i].material.opacity) * 0.08; }

          for (var i = 0; i < modules.length; i++) {
            var show = stage >= 2; modules[i].visible = show;
            if (show) {
              var prog = stage === 2 ? Math.min(1, frac * 1.4) : 1;
              modules[i].position.set((i ? 0.45 : -0.45) * (1 - prog), beamTop * (1 - prog), 0);
              modules[i].rotation.x = t * 2.4; modules[i].rotation.y = t * 2.4;
            }
          }

          for (var i = 0; i < loot.length; i++) {
            var it = loot[i], shown = stage >= it.s; it.mesh.visible = shown;
            it.spr.material.opacity += ((shown ? 1 : 0) - it.spr.material.opacity) * 0.1;
            if (shown) {
              it.ang += 0.005;
              var x = Math.cos(it.ang) * it.rad, z = Math.sin(it.ang) * it.rad * 0.45, y = -0.15 + Math.sin(it.ang * 1.3) * 0.3;
              it.mesh.position.set(x, y, z); it.mesh.rotation.y = t * 2;
              it.spr.position.set(x, y + 0.26, z);
            }
          }

          var ang = scroll * 1.4 + pX * 0.5, dist = 5.4 - scroll * 1.1;
          camera.position.x += (Math.sin(ang) * dist - camera.position.x) * 0.05;
          camera.position.z += (Math.cos(ang) * dist - camera.position.z) * 0.05;
          camera.position.y += ((0.4 + scroll * 0.5 - pY * 0.5) - camera.position.y) * 0.05;
          camera.lookAt(0, 0.4, 0);
        }
      };
    }

    // ── GLOBE (original) ────────────────────────────────────────────────────
    function buildGlobe() {
      var R = 1.3, group = new THREE.Group();
      group.rotation.x = -0.2; scene.add(group);
      group.add(new THREE.LineSegments(
        new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(R, isMobile ? 2 : 3)),
        new THREE.LineBasicMaterial({ color: 0x2dff9e, transparent: true, opacity: 0.16 })));
      group.add(new THREE.Mesh(
        new THREE.IcosahedronGeometry(R * 0.985, 2),
        new THREE.MeshBasicMaterial({ color: 0x04140e, transparent: true, opacity: 0.55, side: THREE.BackSide })));

      var TN = isMobile ? 60 : 120, np = new Float32Array(TN * 3), nc = new Float32Array(TN * 3), nodesV = [], c = new THREE.Color();
      for (var i = 0; i < TN; i++) {
        var phi = Math.acos(1 - 2 * (i + 0.5) / TN), th = Math.PI * (1 + Math.sqrt(5)) * i;
        var v = new THREE.Vector3(Math.sin(phi) * Math.cos(th), Math.sin(phi) * Math.sin(th), Math.cos(phi)).multiplyScalar(R);
        nodesV.push(v); np[i * 3] = v.x; np[i * 3 + 1] = v.y; np[i * 3 + 2] = v.z;
        c.setHex(COLORS[i % COLORS.length]); nc[i * 3] = c.r; nc[i * 3 + 1] = c.g; nc[i * 3 + 2] = c.b;
      }
      var ng = new THREE.BufferGeometry();
      ng.setAttribute('position', new THREE.BufferAttribute(np, 3));
      ng.setAttribute('color', new THREE.BufferAttribute(nc, 3));
      var nodeMat = new THREE.PointsMaterial({ size: isMobile ? 0.075 : 0.06, map: dotTex, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
      group.add(new THREE.Points(ng, nodeMat));

      var arcPts = [], AC = isMobile ? 14 : 34;
      for (var a = 0; a < AC; a++) {
        var p1 = nodesV[(Math.random() * TN) | 0], p2 = nodesV[(Math.random() * TN) | 0];
        if (p1 === p2) continue;
        var mid = p1.clone().add(p2).multiplyScalar(0.5).normalize().multiplyScalar(R * (1.25 + Math.random() * 0.35));
        var s = new THREE.QuadraticBezierCurve3(p1, mid, p2).getPoints(22);
        for (var k = 0; k < s.length - 1; k++) arcPts.push(s[k].x, s[k].y, s[k].z, s[k + 1].x, s[k + 1].y, s[k + 1].z);
      }
      var ag = new THREE.BufferGeometry();
      ag.setAttribute('position', new THREE.Float32BufferAttribute(arcPts, 3));
      var arcs = new THREE.LineSegments(ag, new THREE.LineBasicMaterial({ color: 0x38e1ff, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false }));
      group.add(arcs);

      var stars = makeStars();
      return {
        update: function (t) {
          group.rotation.y = t * 0.04 + scroll * Math.PI * 1.6;
          group.rotation.x = -0.2 + scroll * 0.5 + pY * 0.15;
          group.scale.setScalar(1 + scroll * 0.12);
          nodeMat.size = (isMobile ? 0.075 : 0.06) * (1 + Math.sin(t * 1.6) * 0.18);
          arcs.material.opacity = 0.18 + Math.sin(t * 0.8) * 0.06 + scroll * 0.25;
          stars.rotation.y = t * 0.012; stars.rotation.x = t * 0.005;
          camera.position.z = 3.4 - scroll * 1.0;
          camera.position.x += (pX * 0.5 - camera.position.x) * 0.05;
          camera.position.y += ((-pY * 0.35 + scroll * 0.25) - camera.position.y) * 0.05;
          camera.lookAt(0, 0, 0);
        }
      };
    }

    function makeStars() {
      var SC = isMobile ? 420 : 1400, arr = new Float32Array(SC * 3);
      for (var i = 0; i < SC; i++) {
        var r = 6 + Math.random() * 16, t1 = Math.random() * Math.PI * 2, t2 = Math.acos(2 * Math.random() - 1);
        arr[i * 3] = r * Math.sin(t2) * Math.cos(t1); arr[i * 3 + 1] = r * Math.sin(t2) * Math.sin(t1); arr[i * 3 + 2] = r * Math.cos(t2);
      }
      var g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
      var s = new THREE.Points(g, new THREE.PointsMaterial({ color: 0x2dff9e, size: 0.05, map: dotTex, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true }));
      scene.add(s); return s;
    }
  }
})();
