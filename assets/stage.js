/* Genie stage v4: the show's timeline, canvas effects (dust, sprite smoke, sparkles, sparks), Producer Z, the lamp and the
   Genie (pose crossfades, a speech bubble, a mouth flap when talk frames exist), the painted set pieces, the dashboard act,
   the three dashboard signs, optional studio-voice lines (Sound on), pointer parallax, and the example dashboard's
   creator / business switch. Plain JS, no libraries, no inline handlers. Shared by the home page and /custom-creator-studio/.
   Nothing here spends money or sends anything: the console form's submit is handled by genie.js on the Genie page, or, on
   other pages, carried to the Genie page in sessionStorage. */
(function () {
  "use strict";
  var stage = document.getElementById("gstage");
  if (!stage) return;
  var REDUCED = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var SMALL = window.innerWidth <= 900;
  var FINE = window.matchMedia && matchMedia("(pointer: fine)").matches;
  /* the Producer Z launcher's walk-on card never covers the stage: Z is already on it */
  try { sessionStorage.setItem("mw_z_card", "done"); } catch (e) { /* private mode */ }
  (function hush(n) { if (window.__mwzLauncher && window.__mwzLauncher.hideBubble) { try { window.__mwzLauncher.hideBubble(true); } catch (e) { /* ignore */ } } else if (n > 0) { setTimeout(function () { hush(n - 1); }, 400); } })(25);
  var $ = function (s) { return stage.querySelector(s); };
  var onair = $(".gs-onair"), replayBtn = $(".gs-replay"), skipBtn = $(".gs-skip"), soundBtn = $(".gs-sound");
  var zWrap = $(".gs-z"), zSay = $(".gs-z-say"), gSay = $(".gs-gsay"), wishCta = $(".gs-wish"), actor = $(".gs-z-actor");
  var fx = $(".gs-fx"), wish = document.getElementById("wish");
  var lamp = $(".gs-lamp"), genie = $(".gs-genie"), holo = $(".gs-holo");
  var timers = [], playing = false, played = false, inView = false, zOn = false, sayTimer = 0, gTimer = 0, gFollow = 0;
  var SCENES = ["s-sweep", "s-lights", "s-open", "s-c1", "s-c1out", "s-c2", "s-c2out", "s-lamp", "s-g1", "s-g2", "s-sky", "s-sun", "s-clouds", "s-hills", "s-ridge", "s-trees", "s-meadow", "s-ground", "s-near", "s-dash", "s-holo", "s-signs", "s-signsout", "s-done"];
  var END = ["s-lights", "s-open", "s-lamp", "s-g1", "s-g2", "s-sky", "s-sun", "s-clouds", "s-hills", "s-ridge", "s-trees", "s-meadow", "s-ground", "s-near", "s-dash", "s-holo", "s-done"];
  var LINES = {
    "z-1": ["z", "Five bucks. Try all of it."],
    "z-2": ["z", "Pro production tools for marketing your business. All in one place."],
    "z-3": ["z", "Meet the Genie."],
    "g-1": ["g", "Your wish is my command."],
    "g-2": ["g", "Watch. I build what you dream."],
    "g-3": ["g", "A dashboard built around you. For creators…"],
    "g-4": ["g", "…or for your business."],
    "g-5": ["g", "Three ways in. Free, Pro, or dream it with me."],
    "g-6": ["g", "Tell me the creator dashboard of your dreams. I'll make your wish come true."]
  };

  function later(fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; }
  function clearAll() { timers.forEach(clearTimeout); timers = []; }
  function cls(name, on) { stage.classList.toggle(name, !!on); }

  /* ---------------- the Genie: named poses, crossfaded; a mouth flap when talk frames exist ---------------- */
  var gA = genie && genie.querySelector("img.pa"), gB = genie && genie.querySelector("img.pb"), gMouth = genie && genie.querySelector("img.mouth");
  var POSES = {};
  try { POSES = JSON.parse(genie && genie.getAttribute(SMALL && genie.getAttribute("data-poses-m") ? "data-poses-m" : "data-poses") || "{}"); } catch (e) { POSES = {}; }
  var posesReady = false, curPose = "", useB = false, talkOK = false;
  function preloadPoses() {
    if (posesReady) return; posesReady = true;
    Object.keys(POSES).forEach(function (k) { var im = new Image(); im.decoding = "async"; im.src = POSES[k]; if (k === "talk-open") { im.onload = function () { talkOK = true; if (gMouth) gMouth.setAttribute("src", POSES[k]); }; } });
  }
  function pose(name) {
    if (!genie || !POSES[name] || name === curPose) return;
    curPose = name;
    var next = useB ? gA : gB; if (!next) return;
    var go = function () { useB = !useB; genie.classList.toggle("b-on", useB); };
    next.onload = go; next.setAttribute("src", POSES[name]);
    if (next.complete && next.naturalWidth) { next.onload = null; go(); }
  }
  var flapT = 0;
  function talk(ms) {
    if (!genie) return;
    clearInterval(flapT);
    var base = talkOK && POSES["talk-closed"] && (curPose === "point" || curPose === "talk-closed") ? "talk-closed" : "";
    var prev = curPose;
    if (base) pose(base);
    genie.classList.add("talk");
    flapT = setInterval(function () { if (gMouth && talkOK) gMouth.classList.toggle("open", Math.random() > .35); }, 130);
    later(function () { clearInterval(flapT); if (gMouth) gMouth.classList.remove("open"); genie.classList.remove("talk"); if (base && prev && prev !== base) pose(prev); }, ms);
  }

  /* ---------------- voices: optional studio-voice lines, only after the visitor turns sound on ---------------- */
  var soundOn = false, voCache = {};
  if (soundBtn && stage.getAttribute("data-vo") === "1") soundBtn.hidden = false;
  if (soundBtn) soundBtn.addEventListener("click", function () {
    soundOn = !soundOn; soundBtn.setAttribute("aria-pressed", soundOn ? "true" : "false"); soundBtn.textContent = soundOn ? "Sound off" : "Sound on";
    if (!soundOn) Object.keys(voCache).forEach(function (k) { try { voCache[k].pause(); } catch (e) { /* ignore */ } });
  });
  function vo(id) {
    if (!soundOn) return;
    try { var a = voCache[id] || (voCache[id] = new Audio("/assets/audio/stage/" + id + ".mp3")); a.currentTime = 0; var p = a.play(); if (p && p.catch) p.catch(function () { /* blocked */ }); } catch (e) { /* no audio */ }
  }

  /* ---------------- speech: Producer Z's bubble and the Genie's bubble ---------------- */
  var lastLine = "Hi, I'm Producer Z. Tell me what you want your studio to be and I'll show you.";
  function zSpeak(text, ms) {
    lastLine = text;
    if (!zSay) return; zSay.querySelector("p").textContent = text; zSay.hidden = false;
    zSpeaking = true; if (!zRaf) zFrame("ch");
    requestAnimationFrame(function () { zSay.classList.add("show"); });
    clearTimeout(sayTimer); if (ms) sayTimer = setTimeout(function () { zSay.classList.remove("show"); zSpeaking = false; if (!zRaf) zFrame("w2"); }, ms);
  }
  /* the visible figure inside each pose's 1458x1200 frame (alpha bounds), and where his head is across it */
  /* [left, top, right, bottom, head x, lower-body left, lower-body right]; the lower body is the narrow smoke tail */
  var FIG = { puff: [.505, .689, .755, .991, .63, .509, .755], half: [.409, .387, .757, .943, .58, .409, .753], out: [.364, .203, .862, .978, .61, .462, .767], point: [.452, .205, .891, .98, .6, .452, .761], present: [.461, .202, .858, .976, .62, .461, .759], wink: [.364, .203, .862, .978, .61, .462, .767], "talk-closed": [.452, .206, .891, .98, .6, .452, .761] };
  function rel(el, s) { var r = el.getBoundingClientRect(); return { l: r.left - s.left, t: r.top - s.top, r: r.right - s.left, b: r.bottom - s.top }; }
  function shown(el) { if (!el || el.hidden) return false; var cs = getComputedStyle(el); return cs.display !== "none" && cs.visibility !== "hidden" && +cs.opacity > .15; }
  function figBox(s) {             /* the Genie's body in scene coordinates, padded for his float */
    var img = useB ? gB : gA, r = (img || genie).getBoundingClientRect(), f = FIG[curPose] || FIG.out, m = 14, X = r.left - s.left, Y = r.top - s.top;
    var G = { l: X + r.width * f[0] - m, t: Y + r.height * f[1] - m - 6, r: X + r.width * f[2] + m, b: Y + r.height * f[3], hx: X + r.width * f[4] };
    var mid = G.t + (G.b - G.t) * .47;
    G.up = { l: G.l, t: G.t, r: G.r, b: mid }; G.low = { l: X + r.width * f[5] - m, t: mid, r: X + r.width * f[6] + m, b: G.b };
    return G;
  }
  function overG(box, G) { return over(box, G.up) + over(box, G.low); }
  function over(a, b) { return Math.max(0, Math.min(a.r, b.r) - Math.max(a.l, b.l)) * Math.max(0, Math.min(a.b, b.b) - Math.max(a.t, b.t)); }
  function obstacles(s, skip) {
    var o = [];
    if (holo && (stage.classList.contains("s-dash") || stage.classList.contains("s-holo")) && shown(holo)) o.push(rel(holo, s));
    var pn = $(".gs-panel"); if (!SMALL && stage.classList.contains("s-console") && !stage.classList.contains("s-closed") && pn) o.push(rel(pn, s));
    if (stage.classList.contains("s-signs") && !stage.classList.contains("s-signsout")) stage.querySelectorAll(".gs-sign").forEach(function (el) { o.push(rel(el, s)); });
    if (zWrap && !zWrap.hidden && actor) o.push(rel(actor, s));
    if (skip !== "cta" && wishCta && !wishCta.hidden) o.push(rel(wishCta, s));
    if (skip !== "say" && gSay && gSay.classList.contains("show")) o.push(rel(gSay, s));
    if (onair) o.push(rel(onair, s));
    var ctl = $(".gs-ctrl"); if (ctl) o.push(rel(ctl, s));
    return o;
  }
  /* try spots around him in order; never on his body, then as clear of everything else as the stage allows */
  function bestSpot(el, cands, s, skip) {
    var obs = obstacles(s, skip), G = figBox(s), top_ = 8, best = null;
    cands.forEach(function (c, i) {
      /* clamp into the stage first, then judge where it really lands; the further it had to move, the worse */
      var bw = c.w, bh = c.h, x = Math.max(6, Math.min(s.width - bw - 6, c.x)), y = Math.max(top_, Math.min(s.height - bh - 6, c.y));
      var box = { l: x, t: y, r: x + bw, b: y + bh }, moved = Math.abs(x - c.x) + Math.abs(y - c.y);
      var score = overG(box, G) * 60 + moved * 40 + i * 25;
      obs.forEach(function (o) { score += over(box, o) * 3; });
      if (!best || score < best.score) best = { x: x, y: y, cls: c.cls, score: score };
    });
    return best;
  }
  function gPlace() {
    if (!gSay || !genie || !scene) return;
    var s = scene.getBoundingClientRect(), G = figBox(s), gap = 12;
    var mw = Math.min(SMALL ? s.width * .62 : 320, Math.max(150, s.width * .5));
    gSay.style.maxWidth = mw.toFixed(0) + "px";
    var bw = gSay.offsetWidth || 240, bh = gSay.offsetHeight || 60;
    var cands = [
      { x: G.hx + 6, y: G.t - bh - gap, w: bw, h: bh, cls: "" },                 /* above, up and to his right */
      { x: G.r + gap, y: G.t + 4, w: bw, h: bh, cls: "side" },                  /* beside his head, on his right */
      { x: G.hx - bw - 6, y: G.t - bh - gap, w: bw, h: bh, cls: "left" },       /* above, up and to his left */
      { x: G.l - bw - gap, y: G.t + 4, w: bw, h: bh, cls: "left side" },        /* beside his head, on his left */
      { x: G.hx - bw / 2, y: G.t - bh - gap, w: bw, h: bh, cls: "mid" },        /* straight above */
      { x: G.r + gap, y: G.t + (G.b - G.t) * .28, w: bw, h: bh, cls: "side" },  /* beside his chest, on his right */
      { x: G.l - bw - gap, y: G.t + (G.b - G.t) * .28, w: bw, h: bh, cls: "left side" }
    ];
    var b = bestSpot(gSay, cands, s, "say");
    gSay.className = "gs-gsay" + (b.cls ? " " + b.cls : "") + (gSay.classList.contains("show") ? " show" : "");
    var x = Math.max(6, Math.min(s.width - bw - 6, b.x)), y = Math.max(4, Math.min(s.height - bh - 6, b.y));
    gSay.style.transform = ""; gSay.style.left = x.toFixed(0) + "px"; gSay.style.top = y.toFixed(0) + "px";
  }
  function gSpeak(text, ms) {
    if (!gSay) return;
    gSay.textContent = text; gSay.classList.remove("show"); gPlace();
    requestAnimationFrame(function () { gPlace(); gSay.classList.add("show"); });
    talk(Math.max(900, ms - 400));
    /* he floats and the set moves, so the bubble follows him while it is up */
    clearInterval(gFollow); gFollow = setInterval(function () { if (gSay.classList.contains("show")) gPlace(); else clearInterval(gFollow); }, 350);
    clearTimeout(gTimer); if (ms) gTimer = setTimeout(function () { gSay.classList.remove("show"); }, ms);
  }
  var DUR = { "z-1": 2.07, "z-2": 4.5, "z-3": 1.48, "g-1": 3.1, "g-2": 4.04, "g-3": 4.82, "g-4": 1.81, "g-5": 5.45, "g-6": 6.53 };
  function say(id, ms) { var l = LINES[id]; if (!l) return; ms = Math.max(ms || 0, Math.round((DUR[id] || 0) * 1000) + 500); if (l[0] === "z") zSpeak(l[1], ms); else gSpeak(l[1], ms); vo(id); }

  /* ---------------- canvas: light-reactive dust, layered soft smoke, floor haze, sparkles and sparks ----------------
     Smoke puffs are soft textures baked once at start (lumpy blobs of radial gradients, lit from above and shadowed
     underneath, one set per tint), drawn in three depth layers: far puffs are big, slow and dim, near ones small, quick and
     crisp. Every puff and dust mote is lit by what is near it on the stage (the follow-spot, the lamp's glow, the
     footlights), so smoke brightens and warms as it drifts through light and dust only glints inside the beam. */
  var ctx = fx && fx.getContext ? fx.getContext("2d") : null, W = 0, H = 0, DPR = 1, parts = [], raf = 0, lastT = 0, fxOn = false, gold = false;
  var TINTS = ["#ff4fb0", "#9a5cff", "#3fe0d0", "#ffd27a", "#e9e3f5"], puffs = [], glows = [], MAXP = SMALL ? 170 : 340;
  var spotX = -1e4, spotY = -1e4, spotR = 200, lampX = -1e4, lampY = -1e4, ctxF = null, fxF = null, frontDirty = false;
  if (ctx && !REDUCED) { fxF = document.createElement("canvas"); fxF.className = "gs-fx gs-fx-front"; fx.parentNode.insertBefore(fxF, fx.parentNode.querySelector(".gs-curtain")); ctxF = fxF.getContext("2d"); }
  /* bake the puff textures from a list of white shapes: tint, then a lit crown and a shadowed belly for volume */
  function bake(shapes) {
    var P = [], Gl = [];
    shapes.forEach(function (shape) {
      var n = shape.width;
      for (var t = 0; t < TINTS.length; t++) {
        var c = document.createElement("canvas"); c.width = c.height = n; var x = c.getContext("2d");
        x.drawImage(shape, 0, 0); x.globalCompositeOperation = "source-in"; x.fillStyle = TINTS[t]; x.fillRect(0, 0, n, n);
        x.globalCompositeOperation = "source-atop";
        var sh = x.createLinearGradient(0, n * .15, 0, n * .9);
        sh.addColorStop(0, "rgba(255,255,255,.4)"); sh.addColorStop(.45, "rgba(255,255,255,0)"); sh.addColorStop(1, "rgba(18,8,34,.5)");
        x.fillStyle = sh; x.fillRect(0, 0, n, n);
        (P[t] = P[t] || []).push(c);
      }
      var w = document.createElement("canvas"); w.width = w.height = n; var wx = w.getContext("2d");   /* warm light a lit puff gives back */
      wx.drawImage(shape, 0, 0); wx.globalCompositeOperation = "source-in"; wx.fillStyle = "#ffd59a"; wx.fillRect(0, 0, n, n);
      Gl.push(w);
    });
    puffs = P; glows = Gl;
  }
  if (ctx) {
    /* first: soft lumpy blobs drawn here (nothing to download); then the photographic smoke shapes once they arrive */
    var blobs = [], n0 = 112;
    var rnd = function (q) { q = Math.sin(q * 9301 + 49297) * 233280; return q - Math.floor(q); };
    for (var v = 0; v < 4; v++) {
      var shape = document.createElement("canvas"); shape.width = shape.height = n0; var sx = shape.getContext("2d");
      for (var j = 0; j < 11; j++) {
        var an = rnd(v * 31 + j) * 6.283, d = rnd(v * 17 + j * 3) * n0 * .2, cx = n0 / 2 + Math.cos(an) * d, cy = n0 / 2 + Math.sin(an) * d * .8, rr = n0 * (.16 + rnd(v * 7 + j * 5) * .17);
        var g = sx.createRadialGradient(cx, cy, 0, cx, cy, rr);
        g.addColorStop(0, "rgba(255,255,255,.5)"); g.addColorStop(.5, "rgba(255,255,255,.22)"); g.addColorStop(1, "rgba(255,255,255,0)");
        sx.fillStyle = g; sx.fillRect(0, 0, n0, n0);
      }
      blobs.push(shape);
    }
    bake(blobs);
  }
  var smokeAsked = false;
  function loadSmoke() {
    if (smokeAsked || !ctx) return; smokeAsked = true;
    var im = new Image(); im.decoding = "async";
    im.onload = function () {
      var n = im.height, cnt = Math.max(1, Math.round(im.width / n)), shapes = [];
      for (var i = 0; i < cnt; i++) { var c = document.createElement("canvas"); c.width = c.height = n; c.getContext("2d").drawImage(im, i * n, 0, n, n, 0, 0, n, n); shapes.push(c); }
      shapes.push(blobs[0]); bake(shapes);
    };
    im.src = "/assets/img/stage/genie/smoke-sprites.webp";
  }
  function size() {
    if (!fx) return;
    var r = fx.getBoundingClientRect(); DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
    fx.width = Math.round(W * DPR); fx.height = Math.round(H * DPR); if (ctx) ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    if (fxF) { fxF.width = fx.width; fxF.height = fx.height; ctxF.setTransform(DPR, 0, 0, DPR, 0, 0); }
    if (spot) spotR = Math.max(60, spot.offsetWidth * .42);
  }
  /* how much stage light falls on a point: follow-spot + lamp glow + footlights (0..1), and how warm it is */
  var LIT = { l: 0, w: 0 };
  function light(x, y) {
    var l = 0, w = 0;
    if (stage.classList.contains("s-spot")) { var dx = (x - spotX) / spotR, dy = (y - spotY) / spotR; l += Math.exp(-(dx * dx + dy * dy) * 1.6); }
    if (stage.classList.contains("s-g1")) { var lx = (x - lampX) / 110, ly = (y - lampY) / 110, k = Math.exp(-(lx * lx + ly * ly)) * .5; l += k; w += k; }
    if (stage.classList.contains("s-lights")) { var f = Math.max(0, (y / H - .5) / .45) * .55; l += f; w += f; }
    LIT.l = Math.min(1, l); LIT.w = Math.min(1, w); return LIT;
  }
  function dust(n) {
    for (var i = 0; i < n; i++) parts.push({ k: "dust", x: Math.random() * W, y: Math.random() * H * .85, vx: (Math.random() - .5) * 6, vy: -3 - Math.random() * 7, r: .5 + Math.random() * 1.5, a: .25 + Math.random() * .45, life: 1e9, t: 0, z: 1 });
  }
  /* low haze that hangs over the boards and drifts across, warmed by the footlights */
  function haze(n) {
    for (var i = 0; i < n; i++) parts.push({ k: "haze", x: Math.random() * W, y: H * (.7 + Math.random() * .22), vx: (Math.random() < .5 ? -1 : 1) * (5 + Math.random() * 9), r: (SMALL ? 50 : 90) + Math.random() * (SMALL ? 50 : 110), a: .05 + Math.random() * .05, life: 1e9, t: Math.random() * 9, tint: 4, v: i, z: 0, ph: Math.random() * 6.28 });
  }
  /* magical smoke: a rising, curling column of soft tinted puffs in three depths, with sparkles inside it */
  function smoke(x, y, n, tints) {
    tints = tints || [0, 1, 2];
    var sc = SMALL ? .62 : 1;
    if (parts.length > MAXP) n = Math.max(1, Math.round(n * .35));
    for (var i = 0; i < n; i++) {
      var z = i % 3, dz = [1.55, 1, .72][z];
      parts.push({ k: "smoke", z: z, x: x + (Math.random() - .5) * 20 * sc * dz, y: y + (Math.random() - .5) * 12 * sc, vx: (Math.random() - .5) * 20 / dz, vy: (-55 - Math.random() * 85) * sc / Math.sqrt(dz), r: (14 + Math.random() * 16) * sc * dz, grow: (28 + Math.random() * 34) * sc * dz, a: (.26 + Math.random() * .2) * [.75, 1, 1][z], life: (2.2 + Math.random() * 2.2) * Math.sqrt(dz), t: 0, tint: tints[i % tints.length], v: i, rot: Math.random() * 6.28, spin: (Math.random() - .5) * 1.1, ph: Math.random() * 6.28, sw: (14 + Math.random() * 22) * sc });
      if (i % 3 === 0) parts.push({ k: "twinkle", z: 2, x: x + (Math.random() - .5) * 40 * sc, y: y - Math.random() * 30 * sc, vx: (Math.random() - .5) * 20, vy: (-40 - Math.random() * 70) * sc, r: (2 + Math.random() * 3.5) * sc, life: 1 + Math.random() * 1.4, t: 0, hue: [45, 320, 190, 270][i % 4], ph: Math.random() * 6.28 });
    }
  }
  function sparks(x, y, n) {
    for (var i = 0; i < n; i++) {
      var ang = Math.random() * Math.PI * 2, sp = 80 + Math.random() * 260;
      parts.push({ k: "spark", z: 2, x: x, y: y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 80, r: 1 + Math.random() * 2.2, life: .7 + Math.random() * .9, t: 0, hue: [45, 330, 25, 190][i % 4] });
    }
  }
  function star(X, x, y, r) {
    X.beginPath(); X.moveTo(x, y - r * 2.4); X.quadraticCurveTo(x, y, x + r * 2.4, y); X.quadraticCurveTo(x, y, x, y + r * 2.4); X.quadraticCurveTo(x, y, x - r * 2.4, y); X.quadraticCurveTo(x, y, x, y - r * 2.4); X.fill();
  }
  function step(now) {
    raf = 0;
    if (!ctx || !fxOn) return;
    var dt = Math.min(.05, (now - (lastT || now)) / 1000); lastT = now;
    ctx.clearRect(0, 0, W, H); if (ctxF && frontDirty) { ctxF.clearRect(0, 0, W, H); frontDirty = false; }
    var alive = [], sp = lamp && stage.classList.contains("s-g1") ? spout() : null;
    if (sp) { lampX = sp.x; lampY = sp.y - 30; }
    /* three passes, far to near, so near puffs sit over far ones */
    /* the nearest layer is drawn on a second canvas in front of the Genie, only while something is there */
    for (var pass = 0; pass < 3; pass++) { var X = pass === 2 && ctxF ? ctxF : ctx; for (var i = 0; i < parts.length; i++) {
      var p = parts[i]; if ((p.z || 0) !== pass) continue;
      if (X === ctxF) frontDirty = true;
      p.t += dt;
      if (p.k === "dust") {
        p.x += p.vx * dt; p.y += p.vy * dt; p.vx += (Math.random() - .5) * 2;
        if (p.y < -5) { p.y = H * .85; p.x = Math.random() * W; }
        if (p.x < -5) p.x = W + 5; if (p.x > W + 5) p.x = -5;
        var L = light(p.x, p.y), tw = .6 + .4 * Math.sin(p.t * 2.3 + p.r * 7);
        var da = p.a * tw * (.12 + L.l * 1.1); if (da < .02) { alive.push(p); continue; }
        X.globalCompositeOperation = "lighter";
        X.globalAlpha = Math.min(1, da); X.fillStyle = gold || L.w > .3 ? "#ffd894" : "#fff3d8";
        X.beginPath(); X.arc(p.x, p.y, p.r * (1 + L.l * .5), 0, 6.283); X.fill();
        alive.push(p);
      } else if (p.k === "haze") {
        p.x += p.vx * dt; if (p.x < -p.r * 1.5) p.x = W + p.r; if (p.x > W + p.r * 1.5) p.x = -p.r;
        var hl = light(p.x, p.y), hd = p.r * 2.6, hy = p.y + Math.sin(p.t * .4 + p.ph) * 6;
        X.globalCompositeOperation = "source-over";
        X.globalAlpha = p.a * (.5 + hl.l * .9); X.drawImage(puffs[4][p.v % puffs[4].length], p.x - hd / 2, hy - hd * .3, hd, hd * .6);
        if (hl.w > .15) { X.globalCompositeOperation = "lighter"; X.globalAlpha = p.a * hl.w * .7; X.drawImage(glows[p.v % glows.length], p.x - hd / 2, hy - hd * .3, hd, hd * .6); }
        alive.push(p);
      } else if (p.k === "smoke") {
        var u = p.t / p.life; if (u >= 1) continue;
        p.y += p.vy * dt; p.vy *= .985; p.vx *= .99;
        p.x += (p.vx + Math.sin(p.t * 2.6 + p.ph) * p.sw * (.4 + u)) * dt;   /* curls widen as the puff rises and slows */
        p.r += p.grow * dt * (1 - u * .5); p.rot += p.spin * dt;
        var al = p.a * (u < .12 ? u / .12 : Math.pow(1 - (u - .12) / .88, 1.4));
        var set = puffs[p.tint] || puffs[0], d = p.r * 2.5, sl = light(p.x, p.y);
        X.save(); X.translate(p.x, p.y); X.rotate(p.rot);
        X.globalCompositeOperation = "source-over"; X.globalAlpha = al * (.62 + sl.l * .38) * (p.z === 2 ? .7 : 1);
        X.drawImage(set[p.v % set.length], -d / 2, -d / 2, d, d);
        if (sl.l > .12) { X.globalCompositeOperation = "lighter"; X.globalAlpha = al * sl.l * (.16 + sl.w * .12); X.drawImage(glows[p.v % glows.length], -d * .45, -d * .5, d * .9, d * .9); }
        X.restore();
        alive.push(p);
      } else if (p.k === "twinkle") {
        var w = p.t / p.life; if (w >= 1) continue;
        p.x += p.vx * dt; p.y += p.vy * dt;
        X.globalCompositeOperation = "lighter";
        X.globalAlpha = (1 - w) * (.5 + .5 * Math.sin(p.t * 18 + p.ph)); X.fillStyle = "hsl(" + p.hue + ",100%,82%)";
        star(X, p.x, p.y, p.r);
        alive.push(p);
      } else {
        var v = p.t / p.life; if (v >= 1) continue;
        p.vy += 420 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .99;
        X.globalCompositeOperation = "lighter";
        X.globalAlpha = 1 - v; X.fillStyle = "hsl(" + p.hue + ",100%," + (70 - 30 * v) + "%)";
        X.beginPath(); X.arc(p.x, p.y, p.r * (1 - v * .5), 0, 6.283); X.fill();
        alive.push(p);
      }
    } }
    parts = alive; ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over"; if (ctxF) { ctxF.globalAlpha = 1; ctxF.globalCompositeOperation = "source-over"; }
    if (parts.length) raf = requestAnimationFrame(step);
  }
  function fxStart() {
    if (!ctx || REDUCED) return; fxOn = true; size(); loadSmoke();
    if (!parts.some(function (p) { return p.k === "dust"; })) { dust(W > 900 ? 90 : 46); haze(W > 900 ? 9 : 5); }
    if (!raf) raf = requestAnimationFrame(step);
  }
  function fxStop() { fxOn = false; if (raf) cancelAnimationFrame(raf); raf = 0; if (ctx) ctx.clearRect(0, 0, W, H); if (ctxF) ctxF.clearRect(0, 0, W, H); }
  function at(el, ax, ay) {
    if (!el || !fx) return { x: W * .5, y: H * .45 };
    var r = el.getBoundingClientRect(), f = fx.getBoundingClientRect();
    return { x: r.left - f.left + r.width * (ax == null ? .5 : ax), y: r.top - f.top + r.height * (ay == null ? .5 : ay) };
  }
  function spout() { return at(lamp && lamp.querySelector("img.lamp"), .03, .48); }
  /* a gentle wisp keeps curling from the lamp while the Genie is out */
  var wispT = 0;
  function wisps(on) { clearInterval(wispT); if (on && !REDUCED) wispT = setInterval(function () { if (fxOn && !document.hidden) { var s = spout(); smoke(s.x, s.y, 1); } }, 520); }

  /* ---------------- follow-spot ---------------- */
  var spot = $(".gs-spot"), scene = $(".gs-scene");
  function spotTo(x, y) {
    if (!spot || !scene) return;
    var r = scene.getBoundingClientRect();
    x = Math.max(0, Math.min(r.width, x)); y = Math.max(0, Math.min(r.height, y));
    spot.style.setProperty("--sx", x.toFixed(0) + "px"); spot.style.setProperty("--sy", y.toFixed(0) + "px");
    spotX = x; spotY = y;
    cls("s-spot", true);
  }
  function spotPct(px, py) { if (!scene) return; var r = scene.getBoundingClientRect(); spotTo(r.width * px, r.height * py); }
  function spotOnEl(el, dy) {
    if (!el || !scene) return;
    var r = el.getBoundingClientRect(), s = scene.getBoundingClientRect();
    spotTo(r.left - s.left + r.width / 2, r.top - s.top + r.height / 2 + (dy || 0));
  }

  /* ---------------- Producer Z: a full-body claymation figure with a four-frame walk. He walks on from the wings, steps
     aside for the Genie and watches him, and after the show strolls a few steps now and then. The frames are stacked
     images switched by an attribute (nothing re-decodes mid-stride). Reduced motion: he just stands on his mark. ---------------- */
  var zx = 1.15, zRaf = 0, zWanderT = 0, zSpeaking = false, ZMARK = SMALL ? .8 : .82;
  function zArtLoad() {
    if (!zWrap || zWrap.getAttribute("data-loaded")) return; zWrap.setAttribute("data-loaded", "1");
    var base = zWrap.getAttribute("data-art") || "";
    zWrap.querySelectorAll("img[data-n]").forEach(function (im) { im.decoding = "async"; im.src = base + "z-" + im.getAttribute("data-n") + (SMALL ? "-280" : "") + ".webp"; });
  }
  function zFrame(f) { if (actor) actor.setAttribute("data-f", f); }
  function zFace(left) { if (zWrap) zWrap.classList.toggle("face-l", !!left); }
  function zPos() { if (!zWrap || !scene) return; var w = scene.clientWidth, aw = zWrap.offsetWidth || 120; zWrap.style.transform = "translate3d(" + (zx * w - aw / 2).toFixed(1) + "px,0,0)"; }
  function zWalk(to, cb) {
    if (!zWrap) return; cancelAnimationFrame(zRaf); zRaf = 0;
    if (REDUCED) { zx = to; zPos(); zFrame(zSpeaking ? "ch" : "w2"); if (cb) cb(); return; }
    var from = zx, w = scene ? scene.clientWidth : 1000, ms = Math.max(450, Math.abs(to - from) * w / (SMALL ? 70 : 120) * 1000), t0 = 0, SEQ = ["w1", "w2", "w3", "w2"];
    zFace(to < from); zWrap.classList.add("walking");
    function f(now) {
      if (!t0) t0 = now; var k = Math.min(1, (now - t0) / ms), e = k * k * (3 - 2 * k) * .35 + k * .65;
      zx = from + (to - from) * e; zPos();
      var fr = SEQ[Math.floor((now - t0) / 125) % 4]; zFrame(fr); zWrap.classList.toggle("bob", fr === "w2");
      if (k < 1) zRaf = requestAnimationFrame(f);
      else { zRaf = 0; zWrap.classList.remove("walking", "bob"); zFrame(zSpeaking ? "ch" : "w2"); if (cb) cb(); }
    }
    zRaf = requestAnimationFrame(f);
  }
  function zWander(on) {
    clearTimeout(zWanderT); if (!on || REDUCED || !zWrap) return;
    zWanderT = setTimeout(function wander() {
      if (inView && !document.hidden && !zSpeaking && !zRaf) { var lo = ZMARK - .05, hi = ZMARK + .05; zWalk(lo + Math.random() * (hi - lo), function () { zFace(true); }); }
      zWanderT = setTimeout(wander, 7000 + Math.random() * 4500);
    }, 4500);
  }
  function zEnter() {
    if (zOn || !zWrap) return;
    zOn = true; zArtLoad(); zWrap.hidden = false; zx = REDUCED ? ZMARK : 1.15; zPos(); zFrame("w2");
    zWalk(ZMARK, function () { zFace(true); });
  }
  function zClap(text) {
    if (!zOn) return;
    zWrap.classList.add("hop"); setTimeout(function () { zWrap.classList.remove("hop"); }, 1400);
    if (text) zSpeak(text, 7000);
  }
  if (actor) actor.addEventListener("click", function () {
    try { if ("speechSynthesis" in window) { speechSynthesis.cancel(); var u = new SpeechSynthesisUtterance(lastLine); u.rate = 1.03; speechSynthesis.speak(u); } } catch (e) { /* no speech */ }
    spotOnEl(actor, 10);
    window.dispatchEvent(new CustomEvent("mw:guide-open", { detail: { topic: "help", context: "genie-stage" } }));
  });
  window.addEventListener("mw:genie-plan", function () { zClap("Nice. Your studio, itemized, is right below. Start, or think about it; nothing is charged."); });

  /* ---------------- art for the later acts loads on cue (after the page's largest paint) ---------------- */
  var setLoaded = false;
  function loadSet() { if (setLoaded) return; setLoaded = true; stage.querySelectorAll("img[data-src]").forEach(function (im) { im.setAttribute("src", (SMALL && im.getAttribute("data-src-m")) || im.getAttribute("data-src")); }); }
  var lampImg = lamp && lamp.querySelector("img.lamp");
  function artCheck() { if (lampImg && lampImg.complete && lampImg.naturalWidth > 0) cls("has-lamp", true); }
  if (lampImg) { lampImg.addEventListener("load", artCheck); artCheck(); }

  /* ---------------- the dashboard act: switch the sample between creator and business, tick the credits ---------------- */
  function holoMode(m) { var b = holo && holo.querySelector('.wd-mode button[data-mode="' + m + '"]'); if (b) b.click(); }
  function tickCredits() {
    var el = holo && holo.querySelector(".wd-tank span:last-child"); if (!el) return;
    var from = 120, to = 85, t0 = 0;
    function f(now) { if (!t0) t0 = now; var k = Math.min(1, (now - t0) / 2200); el.textContent = Math.round(from - (from - to) * k) + " of 120 left"; if (k < 1) requestAnimationFrame(f); }
    requestAnimationFrame(f);
  }

  /* ---------------- the wish sign: when the Genie finishes, a marquee sign drops in on ropes at his right ---------------- */
  function ctaPlace() {
    if (!wishCta || wishCta.hidden || !scene) return;
    var s = scene.getBoundingClientRect(), G = figBox(s), bw = wishCta.offsetWidth || 230, bh = wishCta.offsetHeight || 90, gap = 14, hgt = G.b - G.t;
    var cands = [
      { x: G.r + gap, y: G.t + hgt * .36 - bh / 2, w: bw, h: bh },     /* at his right hand */
      { x: G.low.r + gap, y: G.t + hgt * .7 - bh / 2, w: bw, h: bh },  /* beside his tail, under the hand he points with */
      { x: G.r + gap, y: G.t + hgt * .6 - bh / 2, w: bw, h: bh },      /* lower right, by the lamp */
      { x: G.r - bw * .3, y: G.b + 6, w: bw, h: bh },                   /* under his right side */
      { x: G.l - bw - gap, y: G.t + hgt * .4 - bh / 2, w: bw, h: bh }  /* his left, last resort */
    ];
    var b = bestSpot(wishCta, cands, s, "cta");
    wishCta.style.left = Math.max(6, Math.min(s.width - bw - 6, b.x)).toFixed(0) + "px";
    wishCta.style.top = Math.max(6, Math.min(s.height - bh - 6, b.y)).toFixed(0) + "px";
  }
  function ctaShow(on) {
    if (!wishCta) return;
    if (!on) { wishCta.hidden = true; wishCta.classList.remove("in"); cls("s-cta", false); return; }
    if (!wishCta.hidden) { ctaPlace(); return; }
    wishCta.hidden = false; ctaPlace();
    requestAnimationFrame(function () { wishCta.classList.add("in"); });
    setTimeout(ctaPlace, 1500);
    if (!REDUCED) later(function () { cls("s-cta", true); var c = at(wishCta, .5, .35); sparks(c.x, c.y, 46); spotOnEl(wishCta, 0); if (gSay && gSay.classList.contains("show")) gPlace(); }, 650);
  }
  /* "Make a wish", "Unlock: build yours now" and the Dream-it link all go to the console's wish box and focus it */
  function goWish() {
    if (!wish) return false;
    if (!stage.classList.contains("s-console")) finale();
    cls("s-closed", false);
    wish.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth", block: "center" });
    setTimeout(function () { wish.focus({ preventScroll: true }); wish.classList.add("glow"); setTimeout(function () { wish.classList.remove("glow"); }, 2600); }, REDUCED ? 0 : 550);
    return true;
  }
  if (wishCta) wishCta.querySelector("button").addEventListener("click", function () {
    if (!REDUCED && fxOn) { var c = at(wishCta, .5, .5); sparks(c.x, c.y, 60); var g = at(genie, .6, .3); smoke(g.x, g.y, 10, [3, 0, 1]); }
    pose(POSES.present ? "present" : "point"); goWish();
  });

  /* ---------------- the console: appears when the show is over; X closes it, the pill brings it back ---------------- */
  var closeBtn = $(".gs-close"), reopen = $(".gs-reopen");
  function console_(on) { cls("s-console", !!on); }
  if (closeBtn) closeBtn.addEventListener("click", function () { cls("s-closed", true); if (reopen) reopen.focus(); });
  if (reopen) reopen.addEventListener("click", function () { cls("s-closed", false); if (wish) wish.focus(); });

  if (SMALL) console_(true);        /* phones: the panel sits under the stage and never covers it */
  function markSeen() { try { sessionStorage.setItem("mw_show_seen", "1"); } catch (e) { /* ignore */ } }
  function holoInert(on) { if (holo) { holo.inert = !!on; if (on) holo.setAttribute("aria-hidden", "true"); else holo.removeAttribute("aria-hidden"); } }
  holoInert(true);
  function reset() {
    cls("s-spot", false); cls("s-spotslow", false); SCENES.forEach(function (c) { cls(c, false); }); gold = false; wisps(false);
    if (onair) onair.className = "gs-onair"; if (gSay) gSay.classList.remove("show"); holoMode("creator");
    ctaShow(false); zWander(false);
    if (!SMALL) console_(false); holoInert(true);
  }
  function finale() {
    clearAll(); loadSet(); preloadPoses(); fxStart();
    END.forEach(function (c) { cls(c, true); }); cls("s-signs", false);
    pose(POSES.present ? "present" : "point"); gold = true; wisps(true);
    if (onair) onair.className = "gs-onair on"; if (!zOn) zEnter();
    played = true; playing = false; console_(true); markSeen(); holoInert(SMALL);
    if (zOn) zWalk(ZMARK, function () { zFace(true); }); zWander(true);
    if (REDUCED) ctaShow(true); else later(function () { ctaShow(true); }, 2600);
  }
  if (skipBtn) skipBtn.addEventListener("click", function () { finale(); later(function () { say("g-6", 5200); }, 900); });
  function play() {
    if (playing) return; playing = true; clearAll(); reset();
    fxStart();
    var k = SMALL ? .8 : 1;
    function T(fn, ms) { later(fn, Math.round(ms * k)); }
    /* act 0: house dark, searchlights cross, the follow-spot hunts, On Air flickers to full neon, footlights, curtains */
    T(function () { cls("s-sweep", true); spotPct(.2, .55); }, 200);
    T(function () { spotPct(.78, .5); }, 700);
    T(function () { spotPct(.35, .62); }, 1200);
    T(function () { if (onair) onair.className = "gs-onair flick"; }, 800);
    T(function () { if (onair) onair.className = "gs-onair on"; }, 1800);
    T(function () { cls("s-lights", true); spotPct(.62, .55); }, 1700);
    T(function () { cls("s-open", true); cls("s-spotslow", true); spotPct(.5, .45); }, 2200);
    T(function () { loadSet(); preloadPoses(); }, 3000);
    T(function () { zEnter(); }, 3300);
    T(function () { spotOnEl(actor, 10); }, 4100);
    /* act 1: the $5 test drive and the tools */
    T(function () { cls("s-c1", true); say("z-1", 2600); spotOnEl($(".gs-card.c1"), 0); }, 4400);
    T(function () { cls("s-c1out", true); }, 7100);
    T(function () { cls("s-c2", true); say("z-2", 3400); spotOnEl($(".gs-card.c2"), 0); }, 7700);
    T(function () { cls("s-c2out", true); }, 11300);
    /* act 2: the lamp and the Genie */
    T(function () { cls("s-lamp", true); say("z-3", 2000); spotOnEl(lamp, -20); }, 11700);
    T(function () { var s = spout(); smoke(s.x, s.y, 30); pose("puff"); }, 12800);
    T(function () { var s = spout(); smoke(s.x, s.y - 10, 60, [0, 1, 2, 3]); pose("half"); cls("s-g1", true); }, 13400);
    T(function () { var s = spout(); sparks(s.x, s.y - 80, 110); smoke(s.x, s.y - 40, 40, [3, 0, 4]); pose("out"); cls("s-g2", true); spotOnEl(genie, 0); wisps(true); }, 14300);
    T(function () { if (zOn) zWalk(ZMARK + .05, function () { zFace(true); }); }, 14700);
    T(function () { say("g-1", 2200); }, 14900);
    /* act 3: he points and the scene paints itself in pieces; the sun comes up */
    T(function () { pose("point"); say("g-2", 2600); }, 17200);
    T(function () { cls("s-sky", true); var g = at(genie, .8, .3); sparks(g.x, g.y, 40); }, 17500);
    T(function () { cls("s-sun", true); gold = true; }, 18100);
    var layers = [["s-clouds", ".gs-f-clouds", .5, .5], ["s-hills", ".gs-f-hills", .3, .85], ["s-ridge", ".gs-f-ridge", .3, .8], ["s-trees", ".gs-f-trees", .7, .85], ["s-meadow", ".gs-f-meadow", .5, .5], ["s-ground", ".gs-f-ground", .5, .4], ["s-near", ".gs-f-near", .6, .4]];
    layers.forEach(function (L, i) { T(function () { cls(L[0], true); var p = at($(L[1]), L[2], L[3]); sparks(p.x, p.y, 26); }, 18500 + i * 380); });
    /* act 4: the dream dashboard is built centre stage, for a creator, then for a business */
    T(function () { cls("s-dash", true); pose(POSES.present ? "present" : "point"); spotOnEl(holo, 40); tickCredits(); say("g-3", 2400); }, 21600);
    T(function () { holoMode("business"); say("g-4", 2000); var h = at(holo, .5, .2); sparks(h.x, h.y, 30); }, 26200);
    T(function () { holoMode("creator"); }, 28200);
    /* act 5: three dashboards drop in on ropes */
    T(function () { cls("s-holo", true); cls("s-signs", true); pose("point"); say("g-5", 3200); spotPct(.36, .3); }, 28500);
    T(function () { cls("s-signsout", true); }, 34100);
    /* curtain call: the wish, the console */
    T(function () {
      cls("s-done", true); console_(true); markSeen(); played = true; playing = false; holoInert(SMALL);
      pose("point"); say("g-6", 5200);
      if (wish) { wish.classList.add("glow"); setTimeout(function () { wish.classList.remove("glow"); }, 2600); }
      spotOnEl(genie, 0);
      if (zOn) zWalk(ZMARK, function () { zFace(true); }); zWander(true);
    }, 34700);
    T(function () { ctaShow(true); }, 36900);
    T(function () { pose(POSES.wink ? "wink" : "out"); }, 41800);
  }
  if (replayBtn) replayBtn.addEventListener("click", function () { playing = false; play(); });

  if (REDUCED) {
    finale(); if (zWrap) zWrap.hidden = false;
  } else {
    var go = function () {
      /* start by geometry (observers can starve in hidden or throttled tabs); the observer then pauses and resumes */
      var r = stage.getBoundingClientRect();
      inView = r.bottom > 0 && r.top < (window.innerHeight || 800);
      if (inView && !document.hidden && !played) play();
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
  }
  window.addEventListener("resize", function () { if (fxOn) size(); zPos(); ctaPlace(); if (gSay && gSay.classList.contains("show")) gPlace(); }, { passive: true });

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

  /* touch screens: the set pieces shift in depth as the page scrolls past the stage */
  if (!REDUCED && !FINE) {
    var rafS = 0;
    window.addEventListener("scroll", function () {
      if (rafS) return;
      rafS = requestAnimationFrame(function () {
        rafS = 0; var r = stage.getBoundingClientRect(), vh = window.innerHeight || 800;
        if (r.bottom < 0 || r.top > vh) return;
        stage.style.setProperty("--py", Math.max(-1, Math.min(1, (r.top + r.height / 2 - vh / 2) / vh * 2.2)).toFixed(3));
      });
    }, { passive: true });
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

  /* "Unlock: build yours now" and the Dream-it link go to the console and focus it */
  document.querySelectorAll(".wd-unlock, .gs-ladder a[href='#wish']").forEach(function (a) {
    a.addEventListener("click", function (e) { if (goWish()) e.preventDefault(); });
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
