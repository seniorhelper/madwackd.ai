/* Madwackd logo: cursor-following 3D tilt, tap bounce-squash and sparkle burst. Vanilla, no deps. */
(function () {
  "use strict";
  var mq = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var logos = [].slice.call(document.querySelectorAll(".mw-logo"));
  if (!logos.length) return;
  var COLORS = ["#ff2ea6", "#b6ff28", "#ff9a1f", "#2bb4ff", "#a24bff", "#ffd83a", "#ffffff"];
  var finePointer = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------- sparkle burst (one shared fixed canvas, created on demand) ---------- */
  var sc = null, sx = null, parts = [], sraf = 0, W = 0, H = 0;
  function ensureCanvas() {
    if (sc) return;
    sc = document.createElement("canvas");
    sc.className = "mw-spark";
    sc.setAttribute("aria-hidden", "true");
    document.body.appendChild(sc);
    sx = sc.getContext("2d");
    size();
    window.addEventListener("resize", size, { passive: true });
  }
  function size() {
    if (!sc) return;
    var d = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    sc.width = Math.round(W * d); sc.height = Math.round(H * d);
    sc.style.width = W + "px"; sc.style.height = H + "px";
    sx.setTransform(d, 0, 0, d, 0, 0);
  }
  function star(c, r) {
    c.beginPath();
    for (var i = 0; i < 8; i++) {
      var a = i * Math.PI / 4, rr = i % 2 ? r * 0.32 : r;
      c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    c.closePath(); c.fill();
  }
  function sparkle(x, y, n) {
    if (mq.matches) return;
    ensureCanvas();
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, s = 3 + Math.random() * 8;
      parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 2.2, r: 4.5 + Math.random() * 8, c: COLORS[i % COLORS.length], rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, l: 1, k: i % 3 });
    }
    if (!sraf) sraf = requestAnimationFrame(tick);
  }
  function tick() {
    sraf = 0;
    sx.clearRect(0, 0, W, H);
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i];
      p.vy += 0.16; p.vx *= 0.97; p.vy *= 0.985; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.l -= 0.022;
      if (p.l <= 0) { parts.splice(i, 1); continue; }
      sx.save(); sx.translate(p.x, p.y); sx.rotate(p.rot);
      sx.globalAlpha = Math.min(1, p.l * 1.6);
      sx.fillStyle = p.c;
      if (p.k === 2) { sx.beginPath(); sx.arc(0, 0, p.r * 0.45, 0, 7); sx.fill(); }
      else star(sx, p.r * (0.7 + 0.3 * Math.sin(p.l * 20)));
      sx.restore();
    }
    if (parts.length) sraf = requestAnimationFrame(tick); else sx.clearRect(0, 0, W, H);
  }

  /* ---------- per-logo spring physics ---------- */
  var states = [];
  logos.forEach(function (L) {
    var T = L.querySelector(".mw-tilt");
    if (!T) return;
    var big = L.hasAttribute("data-mw-big");
    var s = { L: L, T: T, big: big, rx: 0, ry: 0, vrx: 0, vry: 0, trx: 0, try_: 0, sq: 0, vsq: 0, by: 0, vby: 0, hover: false, raf: 0 };
    states.push(s);
    function kick(e) {
      if (mq.matches) return;
      s.vsq += big ? 0.075 : 0.06;
      s.vby -= big ? 7 : 4.5;
      var r = L.getBoundingClientRect();
      var x = e && e.clientX ? e.clientX : r.left + r.width / 2;
      var y = e && e.clientY ? e.clientY : r.top + r.height / 2;
      sparkle(x, y, big ? 44 : 22);
      L.classList.add("is-hot");
      clearTimeout(s.hotT);
      s.hotT = setTimeout(function () { if (!s.hover) L.classList.remove("is-hot"); }, 700);
      wake(s);
    }
    L.addEventListener("pointerdown", function (e) { if (e.button === 0 || e.pointerType !== "mouse") kick(e); });
    L.addEventListener("click", function (e) { if (e.detail === 0) kick(null); });
    L.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse") { s.hover = true; L.classList.add("is-hot"); } });
    L.addEventListener("pointerleave", function () { s.hover = false; L.classList.remove("is-hot"); if (!s.big) { s.trx = 0; s.try_ = 0; wake(s); } });
  });

  function wake(s) { if (!s.raf && !mq.matches) s.raf = requestAnimationFrame(function () { step(s); }); }
  function step(s) {
    s.raf = 0;
    var k = 0.09, d = 0.8;
    s.vrx = (s.vrx + (s.trx - s.rx) * k) * d; s.rx += s.vrx;
    s.vry = (s.vry + (s.try_ - s.ry) * k) * d; s.ry += s.vry;
    s.vsq = (s.vsq - s.sq * 0.2) * 0.84; s.sq += s.vsq;
    s.vby = (s.vby - s.by * 0.16) * 0.8; s.by += s.vby;
    s.T.style.transform = "perspective(650px) translateY(" + s.by.toFixed(2) + "px) rotateX(" + s.rx.toFixed(2) + "deg) rotateY(" + s.ry.toFixed(2) + "deg) scale(" + (1 + s.sq).toFixed(4) + "," + (1 - s.sq).toFixed(4) + ")";
    var moving = Math.abs(s.vrx) + Math.abs(s.vry) + Math.abs(s.vsq) * 50 + Math.abs(s.vby) > 0.01 || Math.abs(s.trx - s.rx) + Math.abs(s.try_ - s.ry) > 0.05 || Math.abs(s.sq) > 0.0005 || Math.abs(s.by) > 0.05;
    if (moving) s.raf = requestAnimationFrame(function () { step(s); });
  }

  /* cursor follow: big logos follow the cursor anywhere nearby; small ones only while hovered */
  var mx = 0, my = 0, mraf = 0;
  function aim() {
    mraf = 0;
    for (var i = 0; i < states.length; i++) {
      var s = states[i];
      if (!s.big && !s.hover) continue;
      var r = s.L.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) continue;
      var reach = s.hover ? Math.max(r.width, r.height) * 0.6 : Math.max(420, r.width * 1.6);
      var dx = (mx - (r.left + r.width / 2)) / reach, dy = (my - (r.top + r.height / 2)) / reach;
      dx = Math.max(-1, Math.min(1, dx)); dy = Math.max(-1, Math.min(1, dy));
      var amp = s.hover ? 1 : 0.6;
      s.try_ = dx * 22 * amp; s.trx = -dy * 16 * amp;
      wake(s);
    }
  }
  window.addEventListener("pointermove", function (e) {
    if (e.pointerType !== "mouse" || mq.matches) return;
    mx = e.clientX; my = e.clientY;
    if (!mraf) mraf = requestAnimationFrame(aim);
  }, { passive: true });

  /* optional device tilt on touch screens that allow it without a permission prompt */
  if (!finePointer && window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission !== "function") {
    window.addEventListener("deviceorientation", function (e) {
      if (mq.matches || e.gamma == null || e.beta == null) return;
      var gx = Math.max(-1, Math.min(1, e.gamma / 30)), gy = Math.max(-1, Math.min(1, (e.beta - 45) / 30));
      for (var i = 0; i < states.length; i++) { var s = states[i]; if (!s.big) continue; s.try_ = gx * 14; s.trx = -gy * 10; wake(s); }
    }, { passive: true });
  }

  /* idle life: an occasional playful wobble on the big logos so they never sit still */
  if (!mq.matches) {
    setInterval(function () {
      if (document.hidden) return;
      for (var i = 0; i < states.length; i++) {
        var s = states[i];
        if (!s.big || s.hover) continue;
        var r = s.L.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) continue;
        s.vsq += 0.03; s.vry += (Math.random() - 0.5) * 6; wake(s);
      }
    }, 5200);
  }

  /* on pages with a big hero logo, keep the header logo tucked away until the hero logo scrolls off */
  var heroLogo = document.querySelector(".mw-hero"), top = document.querySelector(".top");
  if (heroLogo && top && "IntersectionObserver" in window) {
    top.classList.add("hero-logo-on");
    new IntersectionObserver(function (en) {
      top.classList.toggle("hero-logo-on", en[0].isIntersecting);
    }, { rootMargin: "-80px 0px 0px 0px", threshold: 0 }).observe(heroLogo);
  }

  window.mwLogoSparkle = sparkle;
})();
