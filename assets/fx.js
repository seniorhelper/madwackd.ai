/* Madwackd Studio v1.3 - motion layer: hero light field, reveal-on-scroll, scroll timeline, magnetic buttons,
   fact counters, in-view video, parallax and one easter egg. Vanilla, no deps. Honors prefers-reduced-motion. */
(function () {
  "use strict";
  var RM = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var FINE = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var root = document.documentElement;
  if (!RM.matches) root.classList.add("fx-on");
  var vh = window.innerHeight;
  window.addEventListener("resize", function () { vh = window.innerHeight; }, { passive: true });

  /* ================= hero light field (2D canvas) ================= */
  var COLS = ["255,46,166", "43,180,255", "162,75,255", "182,255,40", "255,154,31", "24,199,155"];
  var fields = [];
  function sprite(rgb, r) {
    var c = document.createElement("canvas"); c.width = c.height = r * 2;
    var x = c.getContext("2d"), g = x.createRadialGradient(r, r, 0, r, r, r);
    g.addColorStop(0, "rgba(" + rgb + ",.55)"); g.addColorStop(0.4, "rgba(" + rgb + ",.18)"); g.addColorStop(1, "rgba(" + rgb + ",0)");
    x.fillStyle = g; x.fillRect(0, 0, r * 2, r * 2); return c;
  }
  document.querySelectorAll("canvas.fx-field").forEach(function (cv) {
    var host = cv.parentNode, ctx = cv.getContext("2d"), dense = cv.hasAttribute("data-dense");
    var F = { cv: cv, host: host, ctx: ctx, W: 0, H: 0, on: true, raf: 0, mx: 0.5, my: 0.4, tmx: 0.5, tmy: 0.4, t: 0, orbs: [], frames: [], sprites: COLS.map(function (c) { return sprite(c, 90); }) };
    var n = dense ? 16 : 9, m = dense ? 14 : 7;
    for (var i = 0; i < n; i++) F.orbs.push({ x: Math.random(), y: Math.random(), z: 0.3 + Math.random() * 0.7, c: i % COLS.length, s: 0.6 + Math.random() * 1.1, p: Math.random() * 6.28, v: 0.0004 + Math.random() * 0.0008 });
    for (var j = 0; j < m; j++) F.frames.push({ x: Math.random(), y: Math.random(), z: 0.3 + Math.random() * 0.7, c: j % COLS.length, w: 44 + Math.random() * 50, rot: (Math.random() - 0.5) * 0.5, vr: (Math.random() - 0.5) * 0.0016, v: 0.00025 + Math.random() * 0.0005 });
    function size() {
      var d = Math.min(window.devicePixelRatio || 1, 1.5), r = host.getBoundingClientRect();
      F.W = r.width; F.H = r.height; cv.width = Math.round(F.W * d); cv.height = Math.round(F.H * d);
      ctx.setTransform(d, 0, 0, d, 0, 0); if (!F.raf) draw(F, 0);
    }
    size();
    if ("ResizeObserver" in window) new ResizeObserver(size).observe(host); else window.addEventListener("resize", size);
    host.addEventListener("pointermove", function (e) { var r = host.getBoundingClientRect(); F.tmx = (e.clientX - r.left) / r.width; F.tmy = (e.clientY - r.top) / r.height; }, { passive: true });
    host.addEventListener("pointerleave", function () { F.tmx = 0.5; F.tmy = 0.4; });
    fields.push(F);
    if ("IntersectionObserver" in window) new IntersectionObserver(function (en) { F.on = en[0].isIntersecting; cv.setAttribute("data-running", F.on && !RM.matches ? "1" : "0"); kick(F); }).observe(host);
  });
  function kick(F) { if (F.on && !document.hidden && !RM.matches && !F.raf) F.raf = requestAnimationFrame(function (t) { loop(F, t); }); }
  function loop(F, t) { F.raf = 0; if (!F.on || document.hidden || RM.matches) return; draw(F, 1); F.raf = requestAnimationFrame(function (tt) { loop(F, tt); }); }
  document.addEventListener("visibilitychange", function () { fields.forEach(function (F) { F.cv.setAttribute("data-running", !document.hidden && F.on && !RM.matches ? "1" : "0"); kick(F); }); });
  function draw(F, dt) {
    var c = F.ctx, W = F.W, H = F.H; if (!W || !H) return;
    F.t += dt; F.mx += (F.tmx - F.mx) * 0.05; F.my += (F.tmy - F.my) * 0.05;
    var sy = Math.min(window.scrollY || 0, 900), ox = (F.mx - 0.5), oy = (F.my - 0.5);
    c.clearRect(0, 0, W, H);
    /* light ribbons */
    for (var k = 0; k < 3; k++) {
      var g = c.createLinearGradient(0, 0, W, 0);
      g.addColorStop(0, "rgba(" + COLS[k] + ",0)"); g.addColorStop(0.5, "rgba(" + COLS[k] + ",.30)"); g.addColorStop(1, "rgba(" + COLS[(k + 2) % 6] + ",0)");
      c.strokeStyle = g; c.lineWidth = 2 + k; c.beginPath();
      for (var x = 0; x <= W; x += 24) {
        var y = H * (0.3 + k * 0.2) + Math.sin(x * 0.006 + F.t * 0.012 + k * 2) * 34 + Math.sin(x * 0.013 - F.t * 0.008) * 14 + oy * 40 * (k + 1) - sy * 0.08 * (k + 1);
        if (x === 0) c.moveTo(x, y); else c.lineTo(x, y);
      }
      c.stroke();
    }
    /* glowing orbs */
    for (var i = 0; i < F.orbs.length; i++) {
      var o = F.orbs[i]; o.y -= o.v * dt; if (o.y < -0.15) { o.y = 1.15; o.x = Math.random(); }
      var px = (o.x + ox * 0.08 * o.z) * W, py = (o.y + oy * 0.06 * o.z) * H - sy * 0.25 * o.z, s = 90 * o.s * (0.85 + 0.15 * Math.sin(F.t * 0.02 + o.p));
      c.drawImage(F.sprites[o.c], px - s, py - s, s * 2, s * 2);
    }
    /* drifting storyboard frames */
    c.lineWidth = 1.6;
    for (var j = 0; j < F.frames.length; j++) {
      var f = F.frames[j]; f.y -= f.v * dt; f.rot += f.vr * dt; if (f.y < -0.2) { f.y = 1.2; f.x = Math.random(); }
      var fx = (f.x + ox * 0.14 * f.z) * W, fy = (f.y + oy * 0.1 * f.z) * H - sy * 0.4 * f.z, w = f.w * f.z + 18, h = w * 0.5625;
      var near = Math.hypot(fx - F.mx * W, fy - F.my * H) < 160;
      c.save(); c.translate(fx, fy); c.rotate(f.rot);
      c.globalAlpha = near ? 0.85 : 0.38 * f.z + 0.12;
      c.fillStyle = "rgba(255,255,255,.55)"; c.strokeStyle = "rgba(" + COLS[f.c] + ",1)";
      c.beginPath(); c.rect(-w / 2, -h / 2, w, h); c.fill(); c.stroke();
      c.fillStyle = "rgba(" + COLS[f.c] + ",1)";
      for (var q = -2; q <= 2; q++) { c.fillRect(q * w / 5 - 2, -h / 2 - 6, 4, 3); c.fillRect(q * w / 5 - 2, h / 2 + 3, 4, 3); }
      if (near) { c.globalAlpha = 0.5; c.beginPath(); c.moveTo(-w / 2, 0); c.lineTo(w / 2, 0); c.moveTo(0, -h / 2); c.lineTo(0, h / 2); c.stroke(); }
      c.restore();
    }
    c.globalAlpha = 1;
  }

  /* ================= reveal on scroll ================= */
  if (!RM.matches && "IntersectionObserver" in window) {
    var sel = "main section h2, main .card, main .feat, main .plan, main .make, main .tl-step, main .fact, main .reel-card, main .est, main details, main .tier-mini > div";
    var rio = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); rio.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    var idx = 0;
    document.querySelectorAll(sel).forEach(function (el) {
      if (el.getBoundingClientRect().top < vh) return; // already on screen: never hide it
      el.classList.add("rv"); el.style.setProperty("--rd", (idx++ % 4) * 70 + "ms"); rio.observe(el);
    });
  }

  /* ================= scroll timeline ================= */
  var tl = document.querySelector("[data-timeline]");
  if (tl) {
    var steps = [].slice.call(tl.querySelectorAll(".tl-step")), fill = tl.querySelector(".tl-fill"), pct = tl.querySelector("[data-tl=pct]"), cur = tl.querySelector("[data-tl=cur]"), ring = tl.querySelector(".tl-ring circle.v");
    var list = tl.querySelector(".tl-list"), tick = 0;
    function upd() {
      tick = 0;
      var r = list.getBoundingClientRect(), p = Math.max(0, Math.min(1, (vh * 0.62 - r.top) / r.height)), act = -1;
      fill.style.transform = "scaleY(" + p.toFixed(3) + ")";
      steps.forEach(function (s, i) { var b = s.getBoundingClientRect(); var on = b.top + b.height * 0.4 < vh * 0.62; s.classList.toggle("on", on); if (on) act = i; });
      var done = Math.max(0, act + 1);
      if (pct) pct.textContent = String(done);
      if (cur) cur.textContent = act >= 0 ? steps[act].getAttribute("data-name") : "Start with an idea";
      if (ring) ring.style.strokeDashoffset = String(301.6 * (1 - done / steps.length));
    }
    window.addEventListener("scroll", function () { if (!tick) tick = requestAnimationFrame(upd); }, { passive: true });
    window.addEventListener("resize", upd, { passive: true });
    upd();
  }

  /* ================= counters (real product facts only) ================= */
  var cs = document.querySelectorAll("[data-count]");
  if (cs.length) {
    var run = function (el) {
      var to = parseFloat(el.getAttribute("data-count")), dec = (el.getAttribute("data-count").split(".")[1] || "").length, pre = el.getAttribute("data-pre") || "";
      if (RM.matches) { el.textContent = pre + to.toFixed(dec); return; }
      var t0 = performance.now();
      (function f(now) { var k = Math.min(1, (now - t0) / 1100), e = 1 - Math.pow(1 - k, 3); el.textContent = pre + (to * e).toFixed(dec); if (k < 1) requestAnimationFrame(f); })(t0);
    };
    if ("IntersectionObserver" in window) {
      var cio = new IntersectionObserver(function (en) { en.forEach(function (e) { if (e.isIntersecting) { run(e.target); cio.unobserve(e.target); } }); }, { threshold: 0.6 });
      cs.forEach(function (el) { cio.observe(el); });
    } else cs.forEach(run);
  }

  /* ================= magnetic buttons + tilt cards ================= */
  if (FINE && !RM.matches) {
    document.querySelectorAll("main .btn-primary, main .btn-lime, main .btn-outline, .nav .btn").forEach(function (b) {
      b.classList.add("mag");
      b.addEventListener("pointermove", function (e) {
        var r = b.getBoundingClientRect();
        b.style.setProperty("--mx", ((e.clientX - r.left - r.width / 2) * 0.22).toFixed(1) + "px");
        b.style.setProperty("--my", ((e.clientY - r.top - r.height / 2) * 0.3).toFixed(1) + "px");
      });
      b.addEventListener("pointerleave", function () { b.style.setProperty("--mx", "0px"); b.style.setProperty("--my", "0px"); });
    });
    document.querySelectorAll("main .make, main .reel-card").forEach(function (t) {
      t.addEventListener("pointermove", function (e) {
        var r = t.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        t.style.setProperty("--ry", (x * 10).toFixed(2) + "deg"); t.style.setProperty("--rx", (-y * 8).toFixed(2) + "deg");
        t.style.setProperty("--gx", ((x + 0.5) * 100).toFixed(0) + "%"); t.style.setProperty("--gy", ((y + 0.5) * 100).toFixed(0) + "%");
      });
      t.addEventListener("pointerleave", function () { t.style.setProperty("--ry", "0deg"); t.style.setProperty("--rx", "0deg"); });
    });
  }

  /* ================= subtle parallax ================= */
  var par = [].slice.call(document.querySelectorAll("[data-par]"));
  if (par.length && !RM.matches) {
    var ptick = 0;
    var pupd = function () { ptick = 0; var y = window.scrollY || 0; if (y > vh * 1.5) return; par.forEach(function (el) { el.style.setProperty("--py", (y * parseFloat(el.getAttribute("data-par"))).toFixed(1) + "px"); }); };
    window.addEventListener("scroll", function () { if (!ptick) ptick = requestAnimationFrame(pupd); }, { passive: true });
  }

  /* ================= videos: play only while on screen ================= */
  document.querySelectorAll("video[data-inview]").forEach(function (v) {
    var src = v.getAttribute("data-src");
    if (!src) return; // showreel slot waiting for real clips
    if (RM.matches) { v.controls = true; v.preload = "none"; v.src = src; return; }
    var loaded = false;
    if (!("IntersectionObserver" in window)) { v.src = src; return; }
    new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) { if (!loaded) { v.src = src; loaded = true; } var p = v.play(); if (p && p.catch) p.catch(function () { v.controls = true; }); }
      else if (loaded) v.pause();
    }, { threshold: 0.25 }).observe(v);
  });

  /* ================= easter egg: type "action" (or tap the hero logo 5 times) ================= */
  var buf = "", taps = [], eggT = 0;
  function egg() {
    var t = document.querySelector(".egg");
    if (!t) {
      t = document.createElement("div"); t.className = "egg"; t.setAttribute("role", "status");
      t.innerHTML = '<div class="clap" aria-hidden="true"><i></i><b></b></div><p><strong>Lights, camera, Madwackd!</strong><span>You found the director’s cut. Type “action” any time for another take.</span></p>';
      document.body.insertBefore(t, document.querySelector(".heart-line"));
    }
    t.classList.remove("show"); void t.offsetWidth; t.classList.add("show");
    clearTimeout(eggT); eggT = setTimeout(function () { t.classList.remove("show"); }, 4200);
    if (window.mwLogoSparkle) { window.mwLogoSparkle(window.innerWidth / 2, window.innerHeight * 0.45, 70); }
  }
  document.addEventListener("keydown", function (e) {
    var tag = (e.target && e.target.tagName) || "";
    if (/INPUT|TEXTAREA|SELECT/.test(tag) || e.ctrlKey || e.metaKey || e.altKey || !e.key || e.key.length !== 1) return;
    buf = (buf + e.key.toLowerCase()).slice(-6);
    if (buf === "action") { buf = ""; egg(); }
  });
  var hl = document.querySelector(".mw-hero");
  if (hl) hl.addEventListener("pointerdown", function () {
    var now = Date.now(); taps = taps.filter(function (x) { return now - x < 2200; }); taps.push(now);
    if (taps.length >= 5) { taps = []; egg(); }
  });
  window.mwEgg = egg;
})();
