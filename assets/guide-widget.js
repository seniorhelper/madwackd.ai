/* Madwackd Studio - Producer Z launcher (small, loads with the page).
   Closed state: a movie spotlight. The chat panel and the full-body character (guide-z.js + guide-z.css)
   load only on first use, or when the browser is idle, so they never slow the first paint.
   Plain JS, no inline handlers (CSP script-src 'self'). Same-origin files only. */
(function () {
  "use strict";
  if (typeof document === "undefined" || window.__mwzLauncher) return;

  var V = "20261106z";
  var NO_NUDGE = /^\/(studio|studio-board|dashboard)\//;   /* app pages: never pop anything up */
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } }
  };

  var LAMP =
    '<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">' +
    '<defs><linearGradient id="zgl-m" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6A6482"/>' +
    '<stop offset=".45" stop-color="#2E2A3C"/><stop offset="1" stop-color="#110F18"/></linearGradient>' +
    '<radialGradient id="zgl-l" cx=".4" cy=".45" r=".6"><stop offset="0" stop-color="#fff"/>' +
    '<stop offset=".45" stop-color="#FFF3C4"/><stop offset=".85" stop-color="#FFB648"/><stop offset="1" stop-color="#8A5A14"/></radialGradient></defs>' +
    '<path d="M32 46v8M24 58l8-4 8 4" fill="none" stroke="#8A84A0" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<path d="M21 39q0 9 11 9t11-9" fill="none" stroke="#7A7494" stroke-width="2.6" stroke-linecap="round"/>' +
    '<g transform="rotate(35 32 36)">' +
    '<rect x="22" y="27" width="24" height="18" rx="3" fill="url(#zgl-m)"/>' +
    '<path d="M34 28.5v15M37 28.5v15M40 28.5v15M43 28.5v15" stroke="#0B0A10" stroke-width="1.2"/>' +
    '<rect x="45" y="29.5" width="4" height="13" rx="1.6" fill="#1C1928"/>' +
    '<rect x="18" y="25" width="5" height="22" rx="1.5" fill="#3A3550"/>' +
    '<path d="M18.5 25.5 10 19.5l1.2-1.4 8.3 5.6zM18.5 46.5 10 52.5l1.2 1.4 8.3-5.6z" fill="#2A2638"/>' +
    '<ellipse cx="19" cy="36" rx="2.7" ry="9.6" fill="url(#zgl-l)"/>' +
    '<circle cx="32" cy="36" r="2.2" fill="#9A94B0"/></g></svg>';

  var root = document.createElement("div");
  root.className = "zgl";
  root.innerHTML =
    '<div class="zgl-beam" aria-hidden="true"><i class="h"></i><i class="c"></i><i class="d"></i></div>' +
    '<button class="zgl-btn" type="button" aria-expanded="false" aria-controls="zg-panel" ' +
    'aria-label="Ask Producer Z, the AI director">' + LAMP + '<span class="zgl-glow"></span></button>' +
    '<div class="zgl-bub" role="status" hidden><p>Psst. I\'m Producer Z, the AI director. Want a 30-second tour?</p>' +
    '<button class="go" type="button">Tour</button><button class="no" type="button">Not now</button></div>';

  var btn = root.querySelector(".zgl-btn"), bub = root.querySelector(".zgl-bub");
  var loading = null;

  function css(href) {
    var l = document.createElement("link");
    l.rel = "stylesheet"; l.href = href;
    document.head.appendChild(l);
  }
  /* Loads the heavy half once. Resolves when window.MWZ is ready. */
  function load() {
    if (window.MWZ) return Promise.resolve(window.MWZ);
    if (loading) return loading;
    loading = new Promise(function (resolve, reject) {
      css("/assets/guide-z.css?v=" + V);
      var s = document.createElement("script");
      s.src = "/assets/guide-z.js?v=" + V; s.async = true;
      s.onload = function () { window.MWZ ? resolve(window.MWZ) : reject(); };
      s.onerror = function () { loading = null; reject(); };
      document.head.appendChild(s);
    });
    return loading;
  }
  function run(fn) {
    btn.setAttribute("aria-busy", "true");
    load().then(function (z) { btn.removeAttribute("aria-busy"); fn(z); })
      .catch(function () { btn.removeAttribute("aria-busy"); location.href = "/producers/"; });
  }
  function hideBub(remember) { bub.hidden = true; if (remember) store.set("mw_z_toured", "1"); }

  btn.addEventListener("click", function () { hideBub(true); run(function (z) { z.toggle(); }); });
  /* Warm the cache when someone shows intent, so the first open feels instant. */
  ["pointerenter", "focus", "touchstart"].forEach(function (ev) {
    btn.addEventListener(ev, function () { load().catch(function () {}); }, { once: true, passive: true });
  });
  bub.querySelector(".go").addEventListener("click", function () { hideBub(true); run(function (z) { z.tour(0); }); });
  bub.querySelector(".no").addEventListener("click", function () { hideBub(true); btn.focus(); });
  window.addEventListener("mw:guide-open", function (e) { var t = e.detail && e.detail.topic; run(function (z) { z.open(t); }); });
  window.addEventListener("mw:guide-tour", function () { run(function (z) { z.tour(0); }); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !bub.hidden) hideBub(false); });

  window.__mwzLauncher = { root: root, button: btn, hideBubble: hideBub };
  document.body.appendChild(root);

  /* Dim the beam after a few seconds so it never competes with the page. */
  setTimeout(function () { root.classList.add("is-dim"); }, 7000);

  /* First visit only, never on app pages: a small teaser bubble (the panel never opens on its own). */
  if (!store.get("mw_z_toured") && !NO_NUDGE.test(location.pathname)) {
    setTimeout(function () { if (!root.classList.contains("is-open") && !document.querySelector("dialog[open]")) bub.hidden = false; }, 4000);
  }
  /* Idle prefetch after load, on decent connections only. */
  window.addEventListener("load", function () {
    var c = navigator.connection;
    if (c && (c.saveData || /2g/.test(c.effectiveType || ""))) return;
    (window.requestIdleCallback || function (f) { setTimeout(f, 3000); })(function () { load().catch(function () {}); }, { timeout: 8000 });
  });
})();
