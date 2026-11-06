/* Madwackd Studio - pricing estimator and the hero quote panel. Nothing here renders or is sent anywhere. */
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
  /* Credits cost $0.09 (Agency plan) to $0.12 (100-credit pack) each, so dollars show as a range. */
  function money(c) { return "$" + (c * 0.09).toFixed(2) + " to $" + (c * 0.12).toFixed(2); }
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

  /* ================= monitor: per-shot quote in the hero ================= */
  document.querySelectorAll("[data-monitor]").forEach(function (root) {
    var view = root.querySelector("[data-mon=view]"), label = root.querySelector("[data-mon=label]"), tc = root.querySelector("[data-mon=tc]");
    var cr = root.querySelector("[data-mon=cr]"), usd = root.querySelector("[data-mon=usd]"), math = root.querySelector("[data-mon=math]");
    var approve = root.querySelector("[data-mon=approve]"), status = root.querySelector("[data-mon=status]");
    var shots = [].slice.call(root.querySelectorAll("[data-shot]")), shown = 0;
    function val(n) { var r = root.querySelector("input[name=" + n + "]:checked"); return r ? r.value : ""; }
    function calc() {
      var s = +val("mon-sec"), t = +val("mon-takes"), m = val("mon-model"), total = credits(m, s, t);
      math.textContent = s + " s × " + MODEL[m].name + " × " + t + (t > 1 ? " takes" : " take");
      tc.textContent = "00:00:0" + s + ":00";
      var from = shown; shown = total;
      tween(from, total, 300, function (v) { cr.textContent = Math.round(v); usd.textContent = money(Math.round(v)); });
      approve.disabled = false; approve.textContent = "Approve quote"; status.textContent = "Nothing is spent until you approve.";
    }
    root.addEventListener("change", calc);
    approve.addEventListener("click", function () {
      approve.disabled = true; approve.textContent = "Approved"; status.textContent = "Preview only. Nothing rendered, nothing charged.";
    });
    shots.forEach(function (b) {
      b.addEventListener("click", function () {
        shots.forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        var img = b.querySelector("img");
        view.removeAttribute("srcset"); view.src = window.innerWidth > 700 ? img.getAttribute("data-full") : img.getAttribute("src"); view.alt = img.getAttribute("data-alt");
        view.style.objectPosition = img.style.objectPosition; view.style.transform = img.style.transform; view.style.transformOrigin = img.style.transformOrigin;
        label.textContent = b.getAttribute("data-shot");
      });
    });
    calc();
  });
})();
