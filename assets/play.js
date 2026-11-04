/* Madwackd Studio v1.3 - interactive demos: live-render storyboard card and the pricing estimator.
   Everything here is a code-drawn illustration. Nothing is rendered by an AI model and nothing is sent anywhere. */
(function () {
  "use strict";
  var RM = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };

  /* ---------- early-access placeholder pricing (same math as the studio mock) ---------- */
  var CREDIT_USD = 0.10;
  var MODEL = { fast: { usd: 0.10, mult: 2.5, name: "Fast" }, quality: { usd: 0.40, mult: 2.25, name: "Quality" } };
  function credits(model, secs, takes) {
    var m = MODEL[model];
    return Math.ceil(Math.round(m.usd * secs * takes * m.mult / CREDIT_USD * 1e6) / 1e6);
  }
  var PREVIEW = credits("fast", 4, 1); // a 4-second, low-res preview
  function money(cr) { return "$" + (cr * CREDIT_USD).toFixed(2); }
  function tween(from, to, ms, fn, done) {
    if (RM.matches || ms <= 0) { fn(to); if (done) done(); return; }
    var t0 = performance.now();
    (function f(now) {
      var k = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - k, 3);
      fn(from + (to - from) * e);
      if (k < 1) requestAnimationFrame(f); else if (done) done();
    })(t0);
  }

  /* ================= pricing estimator ================= */
  document.querySelectorAll("[data-estimator]").forEach(function (root) {
    var sec = root.querySelector("[data-es=sec]"), takes = root.querySelector("[data-es=takes]"), prev = root.querySelector("[data-es=prev]");
    var out = { cr: root.querySelector("[data-eo=cr]"), usd: root.querySelector("[data-eo=usd]"), lines: root.querySelector("[data-eo=lines]"),
      secO: root.querySelector("[data-eo=sec]"), takesO: root.querySelector("[data-eo=takes]"), bar: root.querySelector("[data-eo=bar]") };
    var shown = 0;
    function model() { var r = root.querySelector("[data-es=model]:checked"); return r ? r.value : "fast"; }
    function calc() {
      var s = +sec.value, t = +takes.value, m = model(), shots = Math.ceil(s / 8), total = 0, rows = [];
      var full = Math.floor(s / 8), rest = s - full * 8;
      if (full) { var c8 = credits(m, 8, t) * full; total += c8; rows.push([full + (full > 1 ? " shots" : " shot") + " × 8 s × " + MODEL[m].name + " × " + t + (t > 1 ? " takes" : " take"), c8]); }
      if (rest) { var cr = credits(m, rest, t); total += cr; rows.push(["1 shot × " + rest + " s × " + MODEL[m].name + " × " + t + (t > 1 ? " takes" : " take"), cr]); }
      if (prev.checked) { var cp = PREVIEW * shots; total += cp; rows.push([shots + " low-res 4 s " + (shots > 1 ? "previews" : "preview"), cp]); }
      out.secO.textContent = s + " s"; out.takesO.textContent = String(t);
      out.lines.textContent = "";
      rows.forEach(function (r) {
        var li = document.createElement("li"), a = document.createElement("span"), b = document.createElement("b");
        a.textContent = r[0]; b.textContent = r[1] + " cr"; li.appendChild(a); li.appendChild(b); out.lines.appendChild(li);
      });
      var from = shown; shown = total;
      tween(from, total, 450, function (v) { out.cr.textContent = Math.round(v).toLocaleString("en-US"); out.usd.textContent = money(Math.round(v)); });
      out.bar.style.width = Math.min(100, total / 12) + "%";
    }
    root.addEventListener("input", calc);
    root.addEventListener("change", calc);
    calc();
  });

  /* ================= live-render storyboard demo ================= */
  var card = document.getElementById("live-render");
  if (!card) return;
  var form = card.querySelector("form"), input = card.querySelector("#lr-idea"), frames = [].slice.call(card.querySelectorAll(".lr-f canvas"));
  var crEl = card.querySelector("[data-lr=cr]"), usdEl = card.querySelector("[data-lr=usd]"), barEl = card.querySelector("[data-lr=bar]"),
    mathEl = card.querySelector("[data-lr=math]"), lock = card.querySelector(".lr-lock"), del = card.querySelector(".lr-diff del"),
    ins = card.querySelector(".lr-diff ins"), noteEl = card.querySelector("[data-lr=note]"), stat = card.querySelector("[data-lr=status]");
  var meterVal = 0, runId = 0;

  function seedOf(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { return function () { seed = (seed + 0x6D2B79F5) | 0; var t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  var THEMES = [
    { k: /coffee|cafe|espresso|latte|bakery|donut/, sky: ["#ffe9c9", "#ffc6a8"], ground: "#8a5a3c", prop: "cup", scene: "the coffee bar" },
    { k: /roof|house|home|plumb|remodel|bath|contractor|paint/, sky: ["#bfe8ff", "#fff2c2"], ground: "#5fd46a", prop: "house", scene: "the house" },
    { k: /music|song|band|rap|beat|dj|concert/, sky: ["#e6d4ff", "#ffc2e6"], ground: "#3a2a6a", prop: "note", scene: "the stage" },
    { k: /trailer|movie|film|space|earth|planet|sci/, sky: ["#cfd8ff", "#ffd1f0"], ground: "#2e3a7a", prop: "planet", scene: "the horizon" },
    { k: /car|truck|auto|drive|road/, sky: ["#c9f1ff", "#fff0d6"], ground: "#6b7385", prop: "car", scene: "the open road" },
    { k: /surf|beach|ocean|hawaii|wave|summer/, sky: ["#b8f0ff", "#fff3b0"], ground: "#ffe29a", prop: "wave", scene: "the beach" },
    { k: /food|pizza|burger|taco|restaurant|diner/, sky: ["#fff0c9", "#ffd0d0"], ground: "#d8574a", prop: "plate", scene: "the kitchen" }
  ];
  var DEF = { sky: ["#d6f3ff", "#ffe0f1"], ground: "#a24bff", prop: "star", scene: "the set" };
  var SHIRTS = ["#ff2ea6", "#2bb4ff", "#b6ff28", "#ff9a1f", "#a24bff", "#18c79b"], HAIR = ["#2a1a12", "#6b3b1f", "#e0a63a", "#0d1330", "#b84a2a"], SKIN = ["#f6d2b8", "#e2b08c", "#b97d55", "#8a5a3c"];

  function theme(idea) { var l = idea.toLowerCase(); for (var i = 0; i < THEMES.length; i++) if (THEMES[i].k.test(l)) return THEMES[i]; return DEF; }
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }

  function prop(c, kind, x, y, s, col) {
    c.save(); c.translate(x, y); c.scale(s, s); c.lineWidth = 3; c.strokeStyle = "#0d1330"; c.fillStyle = col;
    if (kind === "cup") { rr(c, -18, -22, 36, 40, 6); c.fill(); c.stroke(); c.beginPath(); c.arc(22, -4, 9, -1.4, 1.4); c.stroke(); c.strokeStyle = "rgba(13,19,48,.45)"; c.beginPath(); c.moveTo(-6, -30); c.quadraticCurveTo(-12, -40, -4, -48); c.moveTo(6, -30); c.quadraticCurveTo(0, -40, 8, -48); c.stroke(); }
    else if (kind === "house") { c.beginPath(); c.moveTo(-30, -6); c.lineTo(0, -34); c.lineTo(30, -6); c.closePath(); c.fillStyle = "#ff5a5f"; c.fill(); c.stroke(); c.fillStyle = col; rr(c, -24, -6, 48, 34, 2); c.fill(); c.stroke(); c.fillStyle = "#fff"; rr(c, -6, 8, 12, 20, 2); c.fill(); c.stroke(); }
    else if (kind === "note") { c.beginPath(); c.ellipse(-10, 16, 11, 8, -0.4, 0, 7); c.fill(); c.stroke(); c.beginPath(); c.moveTo(0, 14); c.lineTo(0, -30); c.lineTo(22, -22); c.stroke(); }
    else if (kind === "planet") { c.beginPath(); c.arc(0, 0, 24, 0, 7); c.fill(); c.stroke(); c.beginPath(); c.ellipse(0, 0, 40, 10, -0.35, 0, 7); c.stroke(); }
    else if (kind === "car") { rr(c, -34, -10, 68, 22, 8); c.fill(); c.stroke(); rr(c, -18, -26, 36, 18, 6); c.fillStyle = "#c9ecff"; c.fill(); c.stroke(); c.fillStyle = "#0d1330"; c.beginPath(); c.arc(-18, 13, 8, 0, 7); c.arc(18, 13, 8, 0, 7); c.fill(); }
    else if (kind === "wave") { c.beginPath(); c.moveTo(-40, 14); c.quadraticCurveTo(-20, -30, 10, -10); c.quadraticCurveTo(0, -2, 14, 4); c.quadraticCurveTo(30, 10, 40, 14); c.closePath(); c.fillStyle = "#2bb4ff"; c.fill(); c.stroke(); }
    else if (kind === "plate") { c.beginPath(); c.ellipse(0, 10, 36, 12, 0, 0, 7); c.fillStyle = "#fff"; c.fill(); c.stroke(); c.beginPath(); c.arc(0, 0, 18, Math.PI, 0); c.fillStyle = col; c.fill(); c.stroke(); }
    else { c.beginPath(); for (var i = 0; i < 10; i++) { var a = i * Math.PI / 5 - Math.PI / 2, r = i % 2 ? 11 : 26; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); c.fillStyle = "#ffd83a"; c.fill(); c.stroke(); }
    c.restore();
  }
  function person(c, x, y, s, cast, smile) {
    c.save(); c.translate(x, y); c.scale(s, s); c.lineWidth = 2.4; c.strokeStyle = "#0d1330";
    rr(c, -16, 0, 32, 40, 12); c.fillStyle = cast.shirt; c.fill(); c.stroke();
    c.beginPath(); c.arc(0, -16, 15, 0, 7); c.fillStyle = cast.skin; c.fill(); c.stroke();
    c.beginPath(); c.arc(0, -19, 15.5, Math.PI * 1.05, Math.PI * 1.95); c.lineTo(9, -24); c.quadraticCurveTo(0, -27, -10, -22); c.closePath(); c.fillStyle = cast.hair; c.fill();
    c.fillStyle = "#0d1330"; c.beginPath(); c.arc(-5, -16, 1.8, 0, 7); c.arc(5, -16, 1.8, 0, 7); c.fill();
    c.beginPath(); c.arc(0, -11, smile ? 6 : 4, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
    c.restore();
  }
  /* framing: 0 wide, 1 medium, 2 close-up, 3 product/title. v2 = after the director's note (tighter, punchier). */
  function scene(c, W, H, idea, th, cast, shot, v2, r) {
    var g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, th.sky[0]); g.addColorStop(1, th.sky[1]); c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.fillStyle = "rgba(255,255,255,.75)";
    for (var i = 0; i < 3; i++) { var cx = r() * W, cy = r() * H * 0.35; c.beginPath(); c.ellipse(cx, cy, 22 + r() * 18, 7 + r() * 4, 0, 0, 7); c.fill(); }
    c.fillStyle = "#ffd83a"; c.beginPath(); c.arc(W * (0.75 + r() * 0.15), H * 0.22, H * 0.09, 0, 7); c.fill();
    var zoom = [1, 1.7, 3.1, 1.2][shot] * (v2 ? 1.25 : 1), gy = H * (shot === 2 ? 0.95 : 0.74);
    c.fillStyle = th.ground; c.beginPath(); c.moveTo(0, gy); c.quadraticCurveTo(W * 0.5, gy - H * 0.08, W, gy); c.lineTo(W, H); c.lineTo(0, H); c.fill();
    var u = H / 135;
    if (shot === 3) {
      prop(c, th.prop, W * 0.5, H * 0.58, 1.3 * u * (v2 ? 1.2 : 1), cast.shirt);
      var words = idea.replace(/[^\w\s'&-]/g, "").trim().split(/\s+/).slice(0, 3).join(" ").toUpperCase() || "YOUR IDEA";
      c.font = "900 " + Math.round(15 * u) + "px Inter, system-ui, sans-serif"; c.textAlign = "center"; c.lineWidth = 4 * u; c.strokeStyle = "#fff";
      c.strokeText(words, W / 2, H * 0.2, W * 0.84); c.fillStyle = "#0d1330"; c.fillText(words, W / 2, H * 0.2, W * 0.84);
    } else {
      if (shot === 0) prop(c, th.prop, W * 0.72, gy - 20 * u, 0.9 * u, cast.shirt);
      var sc = zoom * u * 0.9, px = shot === 0 ? W * 0.34 : W * 0.5, py = shot === 2 ? H * 0.56 : gy - 26 * sc;
      person(c, px, py, sc, cast, shot === 2);
    }
    if (v2) { c.strokeStyle = "rgba(255,255,255,.85)"; c.lineWidth = 2 * u; for (var k = 0; k < 5; k++) { var a = r() * 6.28; c.beginPath(); c.moveTo(W / 2 + Math.cos(a) * W * 0.32, H / 2 + Math.sin(a) * H * 0.32); c.lineTo(W / 2 + Math.cos(a) * W * 0.6, H / 2 + Math.sin(a) * H * 0.6); c.stroke(); } }
  }

  function renderFrame(cv, idea, th, cast, shot, v2, id, done) {
    var W = cv.width, H = cv.height, off = document.createElement("canvas"); off.width = W; off.height = H;
    scene(off.getContext("2d"), W, H, idea, th, cast, shot, v2, rng(seedOf(idea) + shot * 97 + (v2 ? 7 : 0)));
    var c = cv.getContext("2d"), fig = cv.parentNode;
    if (RM.matches) { c.drawImage(off, 0, 0); fig.classList.add("done"); if (done) done(); return; }
    var steps = [0.06, 0.12, 0.25, 0.5, 1], i = 0, tiny = document.createElement("canvas"), tc = tiny.getContext("2d");
    fig.classList.remove("done"); fig.classList.add("rendering");
    (function next() {
      if (id !== runId) return;
      var f = steps[i], w = Math.max(2, Math.round(W * f)), h = Math.max(2, Math.round(H * f));
      tiny.width = w; tiny.height = h; tc.drawImage(off, 0, 0, w, h);
      c.imageSmoothingEnabled = f >= 1; c.clearRect(0, 0, W, H); c.drawImage(tiny, 0, 0, w, h, 0, 0, W, H);
      i++;
      if (i < steps.length) setTimeout(next, 150);
      else { fig.classList.remove("rendering"); fig.classList.add("done"); if (done) done(); }
    })();
  }
  function setMeter(v, ms) {
    var from = meterVal; meterVal = v;
    tween(from, v, ms, function (x) { var n = Math.round(x); crEl.textContent = String(n); usdEl.textContent = money(n); barEl.style.width = Math.min(100, n / 1.2) + "%"; });
  }
  function typeInto(el, text, ms, id, done) {
    if (RM.matches) { el.textContent = text; if (done) done(); return; }
    var i = 0, step = Math.max(14, ms / Math.max(1, text.length));
    el.textContent = "";
    (function t() { if (id !== runId) return; el.textContent = text.slice(0, ++i); if (i < text.length) setTimeout(t, step); else if (done) done(); })();
  }

  function run(idea) {
    idea = (idea || "").trim().slice(0, 80) || input.placeholder;
    var id = ++runId, th = theme(idea), r = rng(seedOf(idea));
    var cast = { shirt: SHIRTS[Math.floor(r() * SHIRTS.length)], hair: HAIR[Math.floor(r() * HAIR.length)], skin: SKIN[Math.floor(r() * SKIN.length)] };
    var base = credits("fast", 8, 1) * frames.length;
    card.classList.add("is-running"); lock.classList.remove("on"); card.querySelector(".lr-diff").classList.remove("on");
    del.classList.remove("struck"); ins.textContent = ""; noteEl.textContent = "";
    del.textContent = "Slow pan across " + th.scene + ", calm music";
    mathEl.textContent = frames.length + " shots × 8 s × Fast × 1 take";
    stat.textContent = "Drafting a shot list for “" + idea + "”";
    setMeter(0, 0);
    frames.forEach(function (cv) { cv.getContext("2d").clearRect(0, 0, cv.width, cv.height); cv.parentNode.classList.remove("done", "v2"); });
    var n = 0;
    function nextFrame() {
      if (id !== runId) return;
      if (n >= frames.length) return afterFrames();
      var k = n++;
      renderFrame(frames[k], idea, th, cast, k, false, id, function () {
        setMeter(credits("fast", 8, 1) * (k + 1), 300);
        if (k === 0) setTimeout(function () { if (id === runId) { lock.classList.add("on"); } }, 120);
        setTimeout(nextFrame, RM.matches ? 0 : 140);
      });
    }
    function afterFrames() {
      stat.textContent = "Storyboard ready. Price shown before any render.";
      setTimeout(function () {
        if (id !== runId) return;
        card.querySelector(".lr-diff").classList.add("on");
        typeInto(noteEl, "“make it punchier”", 500, id, function () {
          setTimeout(function () {
            if (id !== runId) return;
            del.classList.add("struck");
            typeInto(ins, "Fast push-in on " + th.scene + ", quick cuts, upbeat score", 900, id, function () {
              stat.textContent = "v2 preview of shot 1: +" + PREVIEW + " credits";
              mathEl.textContent = frames.length + " shots × 8 s × Fast + one 4 s preview";
              frames[0].parentNode.classList.add("v2");
              renderFrame(frames[0], idea, th, cast, 0, true, id, function () {
                setMeter(base + PREVIEW, 500);
                card.classList.remove("is-running");
              });
            });
          }, RM.matches ? 0 : 350);
        });
      }, RM.matches ? 0 : 450);
    }
    nextFrame();
  }

  form.addEventListener("submit", function (e) { e.preventDefault(); run(input.value); });
  card.querySelectorAll("[data-idea]").forEach(function (b) {
    b.addEventListener("click", function () { input.value = b.getAttribute("data-idea"); run(input.value); });
  });
  /* first run once the card is on screen (immediately in reduced-motion mode) */
  if (RM.matches || !("IntersectionObserver" in window)) run(input.value);
  else {
    var io = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { io.disconnect(); setTimeout(function () { run(input.value); }, 350); } }, { threshold: 0.35 });
    io.observe(card);
  }
})();
