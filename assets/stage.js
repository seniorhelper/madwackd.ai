/* Genie stage v3: the show's timeline, canvas effects (dust, smoke, sparks), Producer Z, the lamp and the Genie, the painted
   set pieces, pointer parallax, and the example dashboard's creator / business switch. Plain JS, no libraries, no inline handlers.
   Shared by the home page and /custom-creator-studio/. Nothing here spends money or sends anything: the console form's submit
   is handled by genie.js on the Genie page, or, on other pages, carried to the Genie page in sessionStorage. */
(function () {
  "use strict";
  var stage = document.getElementById("gstage");
  if (!stage) return;
  var REDUCED = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var SMALL = window.innerWidth <= 900;
  /* the Producer Z launcher's walk-on card never covers the stage: Z is already on it */
  try { sessionStorage.setItem("mw_z_card", "done"); } catch (e) { /* private mode */ }
  (function hush(n) { if (window.__mwzLauncher && window.__mwzLauncher.hideBubble) { try { window.__mwzLauncher.hideBubble(true); } catch (e) { /* ignore */ } } else if (n > 0) { setTimeout(function () { hush(n - 1); }, 400); } })(25);
  var FINE = window.matchMedia && matchMedia("(pointer: fine)").matches;
  var ZV = stage.getAttribute("data-zv") || "";
  var onair = stage.querySelector(".gs-onair"), replayBtn = stage.querySelector(".gs-replay");
  var zWrap = stage.querySelector(".gs-z"), zVid = stage.querySelector(".gs-z-actor video"), zSay = stage.querySelector(".gs-z-say");
  var fx = stage.querySelector(".gs-fx"), wish = document.getElementById("wish");
  var lamp = stage.querySelector(".gs-lamp"), genieImg = stage.querySelector(".gs-genie img");
  var timers = [], playing = false, played = false, inView = false, zOn = false, sayTimer = 0;
  var SCENES = ["s-lights", "s-open", "s-c1", "s-c1out", "s-c2", "s-c2out", "s-lamp", "s-g1", "s-g2", "s-g3", "s-g4", "s-sky", "s-sun", "s-hills", "s-trees", "s-ground", "s-done", "s-holo"];
  var END = ["s-lights", "s-open", "s-lamp", "s-g4", "s-sky", "s-sun", "s-hills", "s-trees", "s-ground", "s-done", "s-holo"];

  function later(fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; }
  function clearAll() { timers.forEach(clearTimeout); timers = []; }
  function cls(name, on) { stage.classList.toggle(name, !!on); }

  /* ---------------- the Genie's poses (claymation stills, swapped on cue) ---------------- */
  var POSES = [];
  try { POSES = JSON.parse(genieImg && genieImg.getAttribute("data-poses") || "[]"); } catch (e) { POSES = []; }
  var posesReady = false;
  /* the lamp and Genie only appear when their art is really there (a missing file never leaves a hole in the show) */
  var lampImg = lamp && lamp.querySelector("img.lamp");
  function artCheck() { if (lampImg && lampImg.complete && lampImg.naturalWidth > 0) cls("has-lamp", true); }
  if (lampImg) { lampImg.addEventListener("load", artCheck); artCheck(); }
  function preloadPoses() { if (posesReady || !POSES.length) return; posesReady = true; POSES.forEach(function (src) { var im = new Image(); im.decoding = "async"; im.src = src; }); }
  function pose(i) { if (genieImg && POSES[i]) genieImg.setAttribute("src", POSES[i]); }

  /* ---------------- canvas: dust motes always (while on screen), smoke and sparks on cue ---------------- */
  var ctx = fx && fx.getContext ? fx.getContext("2d") : null, W = 0, H = 0, DPR = 1, parts = [], raf = 0, lastT = 0, fxOn = false, gold = false;
  function size() {
    if (!fx) return;
    var r = fx.getBoundingClientRect(); DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
    fx.width = Math.round(W * DPR); fx.height = Math.round(H * DPR); if (ctx) ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  function dust(n) {
    for (var i = 0; i < n; i++) parts.push({ k: "dust", x: Math.random() * W, y: Math.random() * H * .8, vx: (Math.random() - .5) * 6, vy: -4 - Math.random() * 8, r: .6 + Math.random() * 1.6, a: .15 + Math.random() * .35, life: 1e9, t: 0 });
  }
  function smoke(x, y, n, hues) {
    hues = hues || [320, 265];
    for (var i = 0; i < n; i++) {
      var ang = Math.random() * Math.PI * 2, sp = 10 + Math.random() * 40;
      parts.push({ k: "smoke", x: x + (Math.random() - .5) * 16, y: y + (Math.random() - .5) * 16, vx: Math.cos(ang) * sp * .35, vy: -40 - Math.random() * 70, r: 10 + Math.random() * 22, a: .18 + Math.random() * .22, life: 1.8 + Math.random() * 1.6, t: 0, hue: hues[i % hues.length] });
    }
  }
  function sparks(x, y, n) {
    for (var i = 0; i < n; i++) {
      var ang = Math.random() * Math.PI * 2, sp = 80 + Math.random() * 260;
      parts.push({ k: "spark", x: x, y: y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 80, r: 1 + Math.random() * 2.2, a: 1, life: .7 + Math.random() * .9, t: 0, hue: [45, 330, 25, 190][i % 4] });
    }
  }
  function step(now) {
    raf = 0;
    if (!ctx || !fxOn) return;
    var dt = Math.min(.05, (now - (lastT || now)) / 1000); lastT = now;
    ctx.clearRect(0, 0, W, H);
    var alive = [];
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i]; p.t += dt;
      if (p.k === "dust") {
        p.x += p.vx * dt; p.y += p.vy * dt; p.vx += (Math.random() - .5) * 2;
        if (p.y < -5) { p.y = H * .8; p.x = Math.random() * W; }
        if (p.x < -5) p.x = W + 5; if (p.x > W + 5) p.x = -5;
        ctx.globalAlpha = p.a * (0.6 + 0.4 * Math.sin(p.t * 2 + p.r)); ctx.fillStyle = gold ? "#ffd27a" : "#ffe9b8";
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
        alive.push(p);
      } else if (p.k === "smoke") {
        var u = p.t / p.life; if (u >= 1) continue;
        p.x += p.vx * dt; p.y += p.vy * dt; p.vy *= .985; p.r += 26 * dt;
        var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        g.addColorStop(0, "hsla(" + p.hue + ",90%,80%," + (p.a * (1 - u)) + ")"); g.addColorStop(1, "hsla(" + p.hue + ",90%,70%,0)");
        ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
        alive.push(p);
      } else {
        var v = p.t / p.life; if (v >= 1) continue;
        p.vy += 420 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .99;
        ctx.globalAlpha = 1 - v; ctx.fillStyle = "hsl(" + p.hue + ",100%," + (70 - 30 * v) + "%)";
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1 - v * .5), 0, 6.283); ctx.fill();
        if (v < .3) { ctx.globalAlpha = (1 - v) * .5; ctx.strokeStyle = "hsl(" + p.hue + ",100%,85%)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * .03, p.y - p.vy * .03); ctx.stroke(); }
        alive.push(p);
      }
    }
    parts = alive; ctx.globalAlpha = 1;
    if (parts.length) raf = requestAnimationFrame(step);
  }
  function fxStart() { if (!ctx || REDUCED) return; fxOn = true; size(); if (!parts.some(function (p) { return p.k === "dust"; })) dust(W > 900 ? 70 : 36); if (!raf) raf = requestAnimationFrame(step); }
  function fxStop() { fxOn = false; if (raf) cancelAnimationFrame(raf); raf = 0; if (ctx) ctx.clearRect(0, 0, W, H); }
  function at(el, fx_, fy) { /* a point on an element, in canvas pixels */
    if (!el || !fx) return { x: W * .5, y: H * .45 };
    var r = el.getBoundingClientRect(), f = fx.getBoundingClientRect();
    return { x: r.left - f.left + r.width * (fx_ == null ? .5 : fx_), y: r.top - f.top + r.height * (fy == null ? .5 : fy) };
  }
  function zPoint() { return at(stage.querySelector(".gs-z-actor"), .15, .45); }
  function spout() { return at(lamp, .78, .28); }   /* the lamp's spout */

  /* ---------------- follow-spot ---------------- */
  var spot = stage.querySelector(".gs-spot"), scene = stage.querySelector(".gs-scene");
  function spotTo(x, y) {
    if (!spot || !scene) return;
    var r = scene.getBoundingClientRect();
    x = Math.max(0, Math.min(r.width, x)); y = Math.max(0, Math.min(r.height, y));
    spot.style.setProperty("--sx", x.toFixed(0) + "px"); spot.style.setProperty("--sy", y.toFixed(0) + "px");
    cls("s-spot", true);
  }
  function spotOnEl(el, dy) {
    if (!el || !scene) return;
    var r = el.getBoundingClientRect(), s = scene.getBoundingClientRect();
    spotTo(r.left - s.left + r.width / 2, r.top - s.top + r.height / 2 + (dy || 0));
  }
  function spotOff() { cls("s-spot", false); }

  /* ---------------- Producer Z ---------------- */
  function zClip(name, loop) {
    if (!zVid) return; zVid.loop = !!loop;
    zVid.setAttribute("src", "/assets/z/" + name + ".mp4?v=" + ZV);
    var p = zVid.play(); if (p && p.catch) p.catch(function () { /* poster stays */ });
  }
  var lastLine = "Hi, I'm Producer Z. Tell me what you want your studio to be and I'll show you.";
  function zSpeak(text, ms) {
    lastLine = text;
    if (!zSay) return; zSay.querySelector("p").textContent = text; zSay.hidden = false;
    requestAnimationFrame(function () { zSay.classList.add("show"); });
    clearTimeout(sayTimer); if (ms) sayTimer = setTimeout(function () { zSay.classList.remove("show"); }, ms);
  }
  function zEnter() {
    if (zOn || !zWrap || REDUCED) return;
    zOn = true; zWrap.hidden = false;
    if (window.__mwzLauncher && window.__mwzLauncher.hideBubble) { try { window.__mwzLauncher.hideBubble(true); } catch (e) { /* ignore */ } }
    zClip("z-wave", true); cls("s-z", true);
    later(function () { spotOnEl(stage.querySelector(".gs-z-actor"), 10); }, 900);
    later(function () { cls("s-z", false); cls("s-zidle", true); if (zVid) zVid.pause(); }, 7000);
  }
  function zClap(text) {
    if (!zOn) return;
    cls("s-zidle", false); cls("s-zclap", true); zClip("z-clap", false);
    if (text) zSpeak(text, 7000);
    later(function () { cls("s-zclap", false); cls("s-zidle", true); }, 1600);
  }
  var actor = stage.querySelector(".gs-z-actor");
  if (actor) actor.addEventListener("click", function () {
    try { if ("speechSynthesis" in window) { speechSynthesis.cancel(); var u = new SpeechSynthesisUtterance(lastLine); u.rate = 1.03; speechSynthesis.speak(u); } } catch (e) { /* no speech */ }
    spotOnEl(actor, 10);
    window.dispatchEvent(new CustomEvent("mw:guide-open", { detail: { topic: "help", context: "genie-stage" } }));
  });
  window.addEventListener("mw:genie-plan", function () { zClap("Nice. Your studio, itemized, is right below. Start, or think about it; nothing is charged."); });

  /* ---------------- the show ---------------- */
  var skipBtn = stage.querySelector(".gs-skip");
  function console_(on) { cls("s-console", !!on); }
  var seen = false; try { seen = sessionStorage.getItem("mw_show_seen") === "1"; } catch (e) { seen = false; }
  if (seen || SMALL) console_(true);        /* phones: the panel sits under the stage, nothing to hide */
  function markSeen() { try { sessionStorage.setItem("mw_show_seen", "1"); } catch (e) { /* ignore */ } }
  if (skipBtn) skipBtn.addEventListener("click", function () { clearAll(); finale(); fxStart(); if (!zOn) zEnter(); markSeen(); });
  function reset() { spotOff(); SCENES.forEach(function (c) { cls(c, false); }); gold = false; pose(0); if (onair) onair.classList.remove("on"); }
  function finale() { END.forEach(function (c) { cls(c, true); }); pose(POSES.length - 1); gold = true; if (onair) onair.classList.add("on"); played = true; playing = false; console_(true); }
  function play() {
    if (playing) return; playing = true; clearAll(); reset();
    fxStart(); preloadPoses();
    var t = SMALL ? .8 : 1;                                                     /* phones get a brisker show */
    function T(fn, ms) { later(fn, Math.round(ms * t)); }
    /* act 0: lights, On Air, curtains */
    T(function () { cls("s-lights", true); }, 600);
    T(function () { if (onair) onair.classList.add("on"); }, 900);
    T(function () { cls("s-open", true); }, 1100);
    T(function () { if (onair) onair.classList.remove("on"); }, 2400);
    T(function () { zEnter(); }, 2600);
    /* act 1: the $5 test drive and the tools */
    T(function () { cls("s-c1", true); zSpeak("Five bucks. Try all of it.", 2600); var c = stage.querySelector(".gs-card.c1"); spotOnEl(c, 0); }, 3600);
    T(function () { cls("s-c1out", true); }, 6200);
    T(function () { cls("s-c2", true); zSpeak("Pro production tools for marketing your business. One place.", 3200); var c = stage.querySelector(".gs-card.c2"); spotOnEl(c, 0); }, 6900);
    T(function () { cls("s-c2out", true); }, 10400);
    /* act 2: the lamp and the Genie */
    T(function () { cls("s-lamp", true); pose(0); spotOnEl(lamp, -20); }, 10900);
    T(function () { var s = spout(); smoke(s.x, s.y, 50); pose(0); }, 12000);
    T(function () { var s = spout(); smoke(s.x, s.y - 20, 70); pose(1); cls("s-g1", true); zSpeak("Meet the Genie.", 2200); }, 12500);
    T(function () { var s = spout(); sparks(s.x, s.y - 60, 90); pose(2); cls("s-g2", true); spotOnEl(stage.querySelector(".gs-genie"), 0); }, 13400);
    T(function () { zSpeak("Tell it what you want your studio to be. It builds it.", 3400); }, 14000);
    T(function () { pose(3); cls("s-g3", true); }, 15600);
    /* act 3: the Genie points, the scene paints itself in pieces, the sun comes up */
    T(function () { cls("s-sky", true); var g = at(stage.querySelector(".gs-genie"), .5, .3); sparks(g.x, g.y, 40); }, 16000);
    T(function () { cls("s-sun", true); gold = true; }, 17200);
    T(function () { cls("s-hills", true); var p = at(stage.querySelector(".gs-f-hills"), .3, .9); sparks(p.x, p.y, 40); }, 17600);
    T(function () { cls("s-trees", true); var p = at(stage.querySelector(".gs-f-trees"), .7, .9); sparks(p.x, p.y, 40); }, 18500);
    T(function () { cls("s-ground", true); var z = zPoint(); sparks(z.x, z.y + 20, 40); }, 19300);
    T(function () { pose(4); cls("s-g4", true); var g = at(stage.querySelector(".gs-genie"), .5, .5); sparks(g.x, g.y, 120); smoke(g.x, g.y, 30, [45, 320]); }, 20200);
    /* curtain call: the console */
    T(function () { cls("s-done", true); if (onair) onair.classList.add("on"); played = true; playing = false;
      if (zOn) zSpeak("Your turn. What do you want it to be?", 6000);
      if (wish) { spotOnEl(wish, 0); wish.classList.add("glow"); setTimeout(function () { wish.classList.remove("glow"); }, 2600); }
      later(function () { spotOnEl(stage.querySelector(".gs-z-actor"), 10); }, 6500);
    }, 21000);
    T(function () { cls("s-holo", true); var h = stage.querySelector(".gs-holo"); if (h) { spotOnEl(h, 0); var p = at(h, .5, 1); smoke(p.x, p.y, 40, [190, 265]); } }, 21800);
    T(function () { console_(true); markSeen(); }, 22800);
  }
  if (replayBtn) replayBtn.addEventListener("click", function () { playing = false; play(); });

  if (REDUCED) {
    finale(); if (zWrap) zWrap.hidden = false;
  } else {
    var go = function () {
      /* start by geometry (observers can starve in hidden or throttled tabs); the observer then pauses and resumes */
      var r = stage.getBoundingClientRect();
      inView = r.bottom > 0 && r.top < (window.innerHeight || 800);
      if (inView && !document.hidden) play();
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (en) {
          inView = en[0].isIntersecting;
          if (inView) { if (!played && !playing) play(); else if (played) fxStart(); }
          else { fxStop(); }
        }, { threshold: .15 }).observe(stage);
      }
    };
    if (document.readyState === "complete") setTimeout(go, 350); else window.addEventListener("load", function () { setTimeout(go, 350); });
    document.addEventListener("visibilitychange", function () { if (document.hidden) { fxStop(); if (playing) { clearAll(); playing = false; } } else if (inView && !played) play(); else if (inView) fxStart(); });
    window.addEventListener("resize", function () { if (fxOn) size(); }, { passive: true });
  }

  /* ---------------- parallax: pointer moves the set pieces in depth ---------------- */
  if (!REDUCED && FINE) {
    var rafP = 0, px = 0, py = 0;
    stage.addEventListener("pointermove", function (e) {
      var r = stage.getBoundingClientRect();
      px = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width - .5) * 2));
      py = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height - .5) * 2));
      if (!rafP) rafP = requestAnimationFrame(function () { rafP = 0; stage.style.setProperty("--px", px.toFixed(3)); stage.style.setProperty("--py", py.toFixed(3)); });
    }, { passive: true });
    stage.addEventListener("pointerleave", function () { stage.style.setProperty("--px", "0"); stage.style.setProperty("--py", "0"); });
  }

  /* ---------------- example dashboards: creator / business switch (sample data only) ---------------- */
  document.querySelectorAll(".wd").forEach(function (wd) {
    var btns = wd.querySelectorAll(".wd-mode button"); if (!btns.length) return;
    function setMode(m) {
      wd.setAttribute("data-mode", m);
      btns.forEach(function (b) { var on = b.getAttribute("data-mode") === m; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on ? "true" : "false"); });
      wd.querySelectorAll("[data-c]").forEach(function (el) { el.textContent = el.getAttribute(m === "business" ? "data-b" : "data-c"); });
      wd.querySelectorAll("[data-cbg]").forEach(function (el) { el.style.background = el.getAttribute(m === "business" ? "data-bbg" : "data-cbg"); });
    }
    btns.forEach(function (b) { b.addEventListener("click", function () { setMode(b.getAttribute("data-mode")); }); });
  });

  /* "Unlock: build yours now" goes to the console and focuses it */
  document.querySelectorAll(".wd-unlock").forEach(function (a) {
    a.addEventListener("click", function (e) {
      if (!wish) return; e.preventDefault();
      wish.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth", block: "center" });
      setTimeout(function () { wish.focus(); wish.classList.add("glow"); setTimeout(function () { wish.classList.remove("glow"); }, 2600); }, 500);
    });
  });

  /* ---------------- console form on pages other than the Genie page: carry the wish over ---------------- */
  var form = document.getElementById("wish-form");
  if (form && form.getAttribute("data-carry") === "1") {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var text = wish ? wish.value.trim() : "";
      var note = document.getElementById("wish-note");
      if (text.length < 10) { if (note) { note.textContent = "Give the Genie a sentence or two: what you make, where you post, what a great month looks like."; note.className = "notice genie-note show bad"; } if (wish) wish.focus(); return; }
      try { sessionStorage.setItem("mw_wish", text); } catch (err) { /* private mode: the page asks again */ }
      location.href = "/custom-creator-studio/?go=1#genie";
    });
  }
})();
