(function () {
  'use strict';
  try {
    var cv = document.getElementById('heroCanvas');
    if (!cv) return;

    var ctx;
    try { ctx = cv.getContext('2d'); } catch (e) {}
    if (!ctx) return;

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function isLight() {
      var dt = document.documentElement.getAttribute('data-theme');
      if (dt === 'dark')  return false;
      if (dt === 'light') return true;
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    }

    function debounce(fn) { var t; return function () { clearTimeout(t); t = setTimeout(fn, 150); }; }

    var nodes = [];
    var sweepY = 0;
    var time   = 0;

    function initNodes() {
      nodes = [];
      var w = cv.width, h = cv.height;
      var count = Math.max(20, Math.min(55, Math.round((w * h) / 28000)));
      for (var i = 0; i < count; i++) {
        var angle = Math.random() * Math.PI * 2;
        var speed = 0.15 + Math.random() * 0.25;
        nodes.push({
          x:     Math.random() * w,
          y:     Math.random() * h,
          vx:    Math.cos(angle) * speed,
          vy:    Math.sin(angle) * speed,
          r:     1.8 + Math.random() * 1.4,
          phase: Math.random() * Math.PI * 2,
        });
      }
    }

    function resize() {
      var w = cv.clientWidth  || window.innerWidth;
      var h = cv.clientHeight || window.innerHeight;
      if (cv.width !== w || cv.height !== h) {
        cv.width  = w;
        cv.height = h;
        initNodes();
      }
    }

    function draw(dt) {
      var w = cv.width, h = cv.height;
      if (!w || !h) return;

      var light = isLight();
      var connectDist = Math.min(w, h) * 0.18;

      ctx.clearRect(0, 0, w, h);

      // Grid
      ctx.lineWidth   = 1;
      ctx.strokeStyle = light ? 'rgba(0,0,0,0.04)' : 'rgba(56,225,255,0.025)';
      var gs = 44, x, y;
      for (x = 0; x < w; x += gs) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (y = 0; y < h; y += gs) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

      // Sweep line
      sweepY = (sweepY + dt * 45) % h;
      var sg = ctx.createLinearGradient(0, sweepY - 40, 0, sweepY + 40);
      if (light) {
        sg.addColorStop(0,   'rgba(8,145,178,0)');
        sg.addColorStop(0.5, 'rgba(8,145,178,0.04)');
        sg.addColorStop(1,   'rgba(8,145,178,0)');
      } else {
        sg.addColorStop(0,   'rgba(56,225,255,0)');
        sg.addColorStop(0.5, 'rgba(56,225,255,0.032)');
        sg.addColorStop(1,   'rgba(56,225,255,0)');
      }
      ctx.fillStyle = sg;
      ctx.fillRect(0, sweepY - 40, w, 80);

      // Move nodes
      var i, n;
      for (i = 0; i < nodes.length; i++) {
        n = nodes[i];
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0)  { n.x =  0; n.vx *= -1; }
        if (n.x > w)  { n.x =  w; n.vx *= -1; }
        if (n.y < 0)  { n.y =  0; n.vy *= -1; }
        if (n.y > h)  { n.y =  h; n.vy *= -1; }
      }

      // Edges
      var j, dx, dy, dist, alpha;
      for (i = 0; i < nodes.length; i++) {
        for (j = i + 1; j < nodes.length; j++) {
          dx   = nodes[j].x - nodes[i].x;
          dy   = nodes[j].y - nodes[i].y;
          dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < connectDist) {
            alpha = (1 - dist / connectDist) * 0.22;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = light
              ? 'rgba(8,145,178,' + alpha.toFixed(3) + ')'
              : 'rgba(45,255,158,' + alpha.toFixed(3) + ')';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      // Nodes
      for (i = 0; i < nodes.length; i++) {
        n = nodes[i];
        var pulse = Math.sin(time * 1.4 + n.phase) * 0.5 + 0.5;
        var nr    = n.r + pulse * 0.7;

        var grd = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, nr * 5);
        if (light) {
          grd.addColorStop(0, 'rgba(8,145,178,0.14)');
          grd.addColorStop(1, 'rgba(8,145,178,0)');
        } else {
          grd.addColorStop(0, 'rgba(45,255,158,0.16)');
          grd.addColorStop(1, 'rgba(45,255,158,0)');
        }
        ctx.beginPath();
        ctx.arc(n.x, n.y, nr * 5, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(n.x, n.y, nr, 0, Math.PI * 2);
        ctx.fillStyle = light ? 'rgba(8,145,178,0.65)' : 'rgba(45,255,158,0.65)';
        ctx.fill();
      }
    }

    resize();
    window.addEventListener('resize', debounce(resize));
    if ('ResizeObserver' in window) {
      var ro = new ResizeObserver(debounce(resize));
      ro.observe(cv);
    }

    var lastTs = 0, running = true;

    function frame(ts) {
      if (!running) return;
      var dt = Math.min((ts - lastTs) / 1000, 0.05);
      lastTs  = ts;
      time   += dt;
      draw(dt);
      requestAnimationFrame(frame);
    }

    if (reduceMotion) {
      resize(); draw(0);
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
    if (typeof console !== 'undefined') console.warn('[fx-hero]', err);
  }
}());
