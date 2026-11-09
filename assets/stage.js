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
  var ZV = stage.getAttribute("data-zv") || "";
  var $ = function (s) { return stage.querySelector(s); };
  var onair = $(".gs-onair"), replayBtn = $(".gs-replay"), skipBtn = $(".gs-skip"), soundBtn = $(".gs-sound");
  var zWrap = $(".gs-z"), zVid = $(".gs-z-actor video"), zSay = $(".gs-z-say"), gSay = $(".gs-gsay");
  var fx = $(".gs-fx"), wish = document.getElementById("wish");
  var lamp = $(".gs-lamp"), genie = $(".gs-genie"), holo = $(".gs-holo");
  var timers = [], playing = false, played = false, inView = false, zOn = false, sayTimer = 0, gTimer = 0;
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
    requestAnimationFrame(function () { zSay.classList.add("show"); });
    clearTimeout(sayTimer); if (ms) sayTimer = setTimeout(function () { zSay.classList.remove("show"); }, ms);
  }
  function gPlace() {
    if (!gSay || !genie || !scene) return;
    var img = useB ? gB : gA; var r = (img || genie).getBoundingClientRect(), s = scene.getBoundingClientRect();
    var bw = gSay.offsetWidth || 260, bh = gSay.offsetHeight || 60;
    var top_ = !SMALL && stage.classList.contains("s-console");
    var side = !top_ && !SMALL && holo && stage.classList.contains("s-holo");
    gSay.classList.toggle("left", !!side);
    var x, y;
    if (side) {            /* beside the dashboard, at the Genie's head height, tail pointing back at him */
      var h = holo.getBoundingClientRect();
      x = h.left - s.left - bw - 14; y = Math.max(s.height * .3, r.top - s.top + r.height * .08);
    } else if (top_) {     /* curtain call: centred over his head, clear of the console and the dashboard */
      var pn = $(".gs-panel"), pr = pn ? pn.getBoundingClientRect().right - s.left + 14 : 0;
      x = Math.max(pr, r.left - s.left + r.width * .5 - bw * .3); y = r.top - s.top + r.height * .06 - bh;
    } else { x = r.left - s.left + r.width * .62; y = r.top - s.top + r.height * .04 - bh; }
    x = Math.max(8, Math.min(s.width - bw - 8, x)); y = Math.max(s.height * .14, Math.min(s.height - bh - 20, y));
    gSay.style.transform = ""; gSay.style.left = x.toFixed(0) + "px"; gSay.style.top = y.toFixed(0) + "px";
  }
  function gSpeak(text, ms) {
    if (!gSay) return;
    gSay.textContent = text; gSay.classList.remove("show"); gPlace();
    requestAnimationFrame(function () { gPlace(); gSay.classList.add("show"); });
    talk(Math.max(900, ms - 400));
    clearTimeout(gTimer); if (ms) gTimer = setTimeout(function () { gSay.classList.remove("show"); }, ms);
  }
  var DUR = { "z-1": 2.07, "z-2": 4.5, "z-3": 1.48, "g-1": 3.1, "g-2": 4.04, "g-3": 4.82, "g-4": 1.81, "g-5": 5.45, "g-6": 6.53 };
  function say(id, ms) { var l = LINES[id]; if (!l) return; ms = Math.max(ms || 0, Math.round((DUR[id] || 0) * 1000) + 500); if (l[0] === "z") zSpeak(l[1], ms); else gSpeak(l[1], ms); vo(id); }

  /* ---------------- canvas: dust motes, sprite smoke (tinted, additive), sparkles and sparks ---------------- */
  var ctx = fx && fx.getContext ? fx.getContext("2d") : null, W = 0, H = 0, DPR = 1, parts = [], raf = 0, lastT = 0, fxOn = false, gold = false;
  var TINTS = ["#ff4fb0", "#9a5cff", "#3fe0d0", "#ffd27a", "#ffffff"], puffs = [];
  (function loadSmoke() {
    var src = stage.getAttribute("data-smoke"); if (!src || !ctx) return;
    var im = new Image(); im.decoding = "async";
    im.onload = function () {
      var n = im.height, v = Math.max(1, Math.round(im.width / n));
      for (var t = 0; t < TINTS.length; t++) for (var i = 0; i < v; i++) {
        var c = document.createElement("canvas"); c.width = c.height = n; var x = c.getContext("2d");
        x.drawImage(im, i * n, 0, n, n, 0, 0, n, n); x.globalCompositeOperation = "source-in"; x.fillStyle = TINTS[t]; x.fillRect(0, 0, n, n);
        (puffs[t] = puffs[t] || []).push(c);
      }
    };
    later(function () { im.src = src; }, 2500);
  })();
  function size() {
    if (!fx) return;
    var r = fx.getBoundingClientRect(); DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
    fx.width = Math.round(W * DPR); fx.height = Math.round(H * DPR); if (ctx) ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  function dust(n) {
    for (var i = 0; i < n; i++) parts.push({ k: "dust", x: Math.random() * W, y: Math.random() * H * .8, vx: (Math.random() - .5) * 6, vy: -4 - Math.random() * 8, r: .6 + Math.random() * 1.6, a: .15 + Math.random() * .35, life: 1e9, t: 0 });
  }
  /* magical smoke: a rising, curling column of tinted puffs with sparkles inside it */
  function smoke(x, y, n, tints) {
    tints = tints || [0, 1, 2];
    var sc = SMALL ? .55 : 1;
    for (var i = 0; i < n; i++) {
      parts.push({ k: "smoke", x: x + (Math.random() - .5) * 18 * sc, y: y + (Math.random() - .5) * 10 * sc, vx: (Math.random() - .5) * 18, vy: (-70 - Math.random() * 90) * sc, r: (10 + Math.random() * 16) * sc, grow: (26 + Math.random() * 30) * sc, a: .1 + Math.random() * .16, life: 2 + Math.random() * 2, t: 0, tint: tints[i % tints.length], v: i, rot: Math.random() * 6.28, spin: (Math.random() - .5) * 1.2, ph: Math.random() * 6.28, sw: (16 + Math.random() * 22) * sc });
      if (i % 3 === 0) parts.push({ k: "twinkle", x: x + (Math.random() - .5) * 40 * sc, y: y - Math.random() * 30 * sc, vx: (Math.random() - .5) * 20, vy: (-40 - Math.random() * 70) * sc, r: (2 + Math.random() * 3.5) * sc, life: 1 + Math.random() * 1.4, t: 0, hue: [45, 320, 190, 270][i % 4], ph: Math.random() * 6.28 });
    }
  }
  function sparks(x, y, n) {
    for (var i = 0; i < n; i++) {
      var ang = Math.random() * Math.PI * 2, sp = 80 + Math.random() * 260;
      parts.push({ k: "spark", x: x, y: y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 80, r: 1 + Math.random() * 2.2, life: .7 + Math.random() * .9, t: 0, hue: [45, 330, 25, 190][i % 4] });
    }
  }
  function star(x, y, r) {
    ctx.beginPath(); ctx.moveTo(x, y - r * 2.4); ctx.quadraticCurveTo(x, y, x + r * 2.4, y); ctx.quadraticCurveTo(x, y, x, y + r * 2.4); ctx.quadraticCurveTo(x, y, x - r * 2.4, y); ctx.quadraticCurveTo(x, y, x, y - r * 2.4); ctx.fill();
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
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = p.a * (0.6 + 0.4 * Math.sin(p.t * 2 + p.r)); ctx.fillStyle = gold ? "#ffd27a" : "#ffe9b8";
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
        alive.push(p);
      } else if (p.k === "smoke") {
        var u = p.t / p.life; if (u >= 1) continue;
        p.y += p.vy * dt; p.vy *= .99; p.x += (p.vx + Math.sin(p.t * 3 + p.ph) * p.sw) * dt; p.r += p.grow * dt; p.rot += p.spin * dt;
        var al = p.a * (u < .15 ? u / .15 : 1 - (u - .15) / .85);
        var set = puffs[p.tint];
        ctx.globalCompositeOperation = "source-over";
        if (set && set.length) {
          var img = set[p.v % set.length], d = p.r * 2.4;
          ctx.globalAlpha = al; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.drawImage(img, -d / 2, -d / 2, d, d); ctx.restore();
        } else {
          var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
          g.addColorStop(0, "rgba(255,150,220," + (al * .6) + ")"); g.addColorStop(1, "rgba(160,120,255,0)");
          ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
        }
        alive.push(p);
      } else if (p.k === "twinkle") {
        var w = p.t / p.life; if (w >= 1) continue;
        p.x += p.vx * dt; p.y += p.vy * dt;
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = (1 - w) * (.5 + .5 * Math.sin(p.t * 18 + p.ph)); ctx.fillStyle = "hsl(" + p.hue + ",100%,82%)";
        star(p.x, p.y, p.r);
        alive.push(p);
      } else {
        var v = p.t / p.life; if (v >= 1) continue;
        p.vy += 420 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .99;
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = 1 - v; ctx.fillStyle = "hsl(" + p.hue + ",100%," + (70 - 30 * v) + "%)";
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1 - v * .5), 0, 6.283); ctx.fill();
        alive.push(p);
      }
    }
    parts = alive; ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
    if (parts.length) raf = requestAnimationFrame(step);
  }
  function fxStart() { if (!ctx || REDUCED) return; fxOn = true; size(); if (!parts.some(function (p) { return p.k === "dust"; })) dust(W > 900 ? 70 : 36); if (!raf) raf = requestAnimationFrame(step); }
  function fxStop() { fxOn = false; if (raf) cancelAnimationFrame(raf); raf = 0; if (ctx) ctx.clearRect(0, 0, W, H); }
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
    cls("s-spot", true);
  }
  function spotPct(px, py) { if (!scene) return; var r = scene.getBoundingClientRect(); spotTo(r.width * px, r.height * py); }
  function spotOnEl(el, dy) {
    if (!el || !scene) return;
    var r = el.getBoundingClientRect(), s = scene.getBoundingClientRect();
    spotTo(r.left - s.left + r.width / 2, r.top - s.top + r.height / 2 + (dy || 0));
  }

  /* ---------------- Producer Z ---------------- */
  function zClip(name, loop) {
    if (!zVid) return; zVid.loop = !!loop;
    zVid.setAttribute("src", "/assets/z/" + name + ".mp4?v=" + ZV);
    var p = zVid.play(); if (p && p.catch) p.catch(function () { /* poster stays */ });
  }
  function zEnter() {
    if (zOn || !zWrap || REDUCED) return;
    zOn = true; zWrap.hidden = false;
    zClip("z-wave", true); cls("s-z", true);
    later(function () { cls("s-z", false); cls("s-zidle", true); if (zVid) zVid.pause(); }, 6000);
  }
  function zClap(text) {
    if (!zOn) return;
    cls("s-zidle", false); cls("s-zclap", true); zClip("z-clap", false);
    if (text) zSpeak(text, 7000);
    later(function () { cls("s-zclap", false); cls("s-zidle", true); }, 1600);
  }
  var actor = $(".gs-z-actor");
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
    if (!SMALL) console_(false); holoInert(true);
  }
  function finale() {
    clearAll(); loadSet(); preloadPoses(); fxStart();
    END.forEach(function (c) { cls(c, true); }); cls("s-signs", false);
    pose(POSES.present ? "present" : "point"); gold = true; wisps(true);
    if (onair) onair.className = "gs-onair on"; if (!zOn) zEnter();
    played = true; playing = false; console_(true); markSeen(); holoInert(SMALL);
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
    }, 34700);
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
  window.addEventListener("resize", function () { if (fxOn) size(); if (gSay && gSay.classList.contains("show")) gPlace(); }, { passive: true });

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

  /* "Unlock: build yours now" and the Dream-it link go to the console and focus it */
  document.querySelectorAll(".wd-unlock, .gs-ladder a[href='#wish']").forEach(function (a) {
    a.addEventListener("click", function (e) {
      if (!wish) return; e.preventDefault();
      if (!stage.classList.contains("s-console")) finale();
      cls("s-closed", false);
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
