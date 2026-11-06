/* Madwackd credit tank: a green dashboard meter that fills up segment by segment.
   window.MWTank.build(el) makes the markup; MWTank.set(el, {credits, pct, state, msg}) animates it.
   On the pricing page, [data-tank-demo] runs a looping fill, drain, Boost refill demo. */
(function () {
  "use strict";
  var SEG = 24;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  function build(el) {
    if (el.getAttribute("data-built")) return el;
    el.setAttribute("data-built", "1");
    el.classList.add("tank");
    var segs = "";
    for (var i = 0; i < SEG; i++) segs += "<i></i>";
    el.innerHTML =
      '<div class="tank-head"><span class="tank-dot" aria-hidden="true"></span><span>Credit tank</span><span class="tank-state">Online</span></div>' +
      '<div class="tank-mid"><p class="tank-num"><b class="tank-val">0</b><small>credits</small></p>' +
      '<div class="tank-gauge"><div class="tank-bar" aria-hidden="true">' + segs + '</div>' +
      '<div class="tank-scale" aria-hidden="true"><span>E</span><span>25</span><span>50</span><span>75</span><span>F</span></div></div></div>' +
      '<div class="tank-foot"><span class="tank-msg" aria-live="polite"></span>' +
      '<button type="button" class="tank-boost"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7z" fill="currentColor"/></svg><span>Boost</span></button></div>';
    el._v = 0; el._p = 0;
    return el;
  }

  function set(el, o) {
    build(el);
    var pct = Math.max(0, Math.min(100, o.pct || 0));
    var state = o.state || (pct <= 0 ? "empty" : pct < 25 ? "low" : "ok");
    el.setAttribute("data-state", state);
    el.querySelector(".tank-state").textContent = state === "ok" ? "Online" : state === "low" ? "Low fuel" : "Empty";
    el.querySelector(".tank-msg").textContent = o.msg || (state === "ok" ? "Tank's good. Render away." : state === "low" ? "Running low. Boost to keep rolling." : "Tank's empty. Boost to render.");
    var segs = el.querySelectorAll(".tank-bar i"), on = Math.round(SEG * pct / 100);
    for (var i = 0; i < SEG; i++) {
      (function (s, k, lit) {
        s.style.transitionDelay = reduce ? "0s" : (Math.abs(k - (el._p * SEG / 100)) * 0.035) + "s";
        s.classList.toggle("on", lit);
      })(segs[i], i, i < on);
    }
    el._p = pct;
    countTo(el.querySelector(".tank-val"), el._v, o.credits || 0);
    el._v = o.credits || 0;
  }

  function countTo(node, from, to) {
    if (reduce || from === to) { node.textContent = to.toLocaleString("en-US"); return; }
    var t0 = null, dur = 900;
    function step(t) {
      if (!t0) t0 = t;
      var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      node.textContent = Math.round(from + (to - from) * e).toLocaleString("en-US");
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* pricing-page demo: fill, drain while rendering, flash low, Boost refill */
  function demo(el) {
    build(el);
    var btn = el.querySelector(".tank-boost"), timer = null, val = 0;
    var MAX = 900;
    function put(c, msg, state) { val = c; set(el, { credits: c, pct: 100 * c / MAX, msg: msg, state: state }); }
    function boost() {
      clearTimeout(timer); el.classList.add("tank-flash");
      setTimeout(function () { el.classList.remove("tank-flash"); }, 700);
      put(Math.min(MAX, val + 500), "Boosted +500 credits. No daily limits.", "ok");
      timer = setTimeout(drain, 2600);
    }
    function drain() {
      if (val <= 120) { put(val, null, "low"); timer = setTimeout(boost, reduce ? 4000 : 2400); return; }
      put(val - 120, "Rendering... 24 credits a shot", null);
      timer = setTimeout(drain, 700);
    }
    btn.addEventListener("click", boost);
    if (reduce) { put(180, null, "low"); return; }
    var io = "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { io.disconnect(); put(MAX, "Tank full. Ready to render.", "ok"); timer = setTimeout(drain, 1800); } });
    }, { threshold: .4 }) : null;
    if (io) io.observe(el); else { put(MAX, "Tank full. Ready to render.", "ok"); timer = setTimeout(drain, 1800); }
  }

  window.MWTank = { build: build, set: set };
  document.addEventListener("DOMContentLoaded", function () {
    [].forEach.call(document.querySelectorAll("[data-tank-demo]"), demo);
  });
})();
