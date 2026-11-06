/* Madwackd Studio - Producer Z launcher (small, loads with the page).
   Entrance: once per visit, after the page has loaded, the claymation director walks on with a speech bubble
   (tour or help). Click him to chat. Leave him be (or press X) and he turns into a movie-set spotlight in the
   corner until someone needs him. The spotlight flickers now and then, a few times per page at most.
   The chat panel (guide-z.js + guide-z.css) loads only on first use or at idle.
   Plain JS, no inline handlers (CSP script-src 'self'). Same-origin files only. */
(function () {
  "use strict";
  if (typeof document === "undefined" || window.__mwzLauncher) return;

  var V = "20261106v3";
  var A = "/assets/z/";
  var APP = /^\/(studio|studio-board|dashboard)\//;          /* app pages: never walk on, never nudge */
  var REDUCED = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var CARD_MS = 14000;                                        /* how long he waits before becoming the spotlight */
  function sget(s, k) { try { return s.getItem(k); } catch (e) { return null; } }
  function sset(s, k, v) { try { s.setItem(k, v); } catch (e) { /* private mode */ } }
  var LS = window.localStorage, SS = window.sessionStorage;

  var root = document.createElement("div");
  root.className = "zgl";
  root.innerHTML =
    '<div class="zgl-beam" aria-hidden="true"><i class="h"></i><i class="c"></i><i class="d"></i></div>' +
    '<button class="zgl-btn" type="button" aria-expanded="false" aria-controls="zg-panel" aria-label="Ask Producer Z, the AI director">' +
    '<img src="' + A + 'z-spot.webp?v=' + V + '" width="64" height="64" alt="" decoding="async"><span class="zgl-glow"></span></button>' +
    '<div class="zgl-card" role="region" aria-label="Producer Z" hidden>' +
    '<div class="zgl-say"><button class="zgl-x" type="button" aria-label="Close Producer Z">&times;</button>' +
    '<p aria-live="polite">Hi! I\'m Producer Z, your AI director. Want a 30-second tour, or help making something?</p>' +
    '<button class="go" type="button">Take the 30-second tour</button><button class="help" type="button">Help me make a video</button></div>' +
    '<button class="zgl-actor" type="button" aria-label="Chat with Producer Z"></button></div>';

  var btn = root.querySelector(".zgl-btn"), card = root.querySelector(".zgl-card"), actor = root.querySelector(".zgl-actor");
  var loading = null, cardTimer = 0;

  /* ---------- lazy chat panel ---------- */
  function load() {
    if (window.MWZ) return Promise.resolve(window.MWZ);
    if (loading) return loading;
    loading = new Promise(function (resolve, reject) {
      var l = document.createElement("link");
      l.rel = "stylesheet"; l.href = "/assets/guide-z.css?v=" + V;
      document.head.appendChild(l);
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

  /* ---------- entrance card -> spotlight ---------- */
  function toSpotlight(remember) {
    clearTimeout(cardTimer);
    if (remember) sset(SS, "mw_z_card", "done");
    if (card.hidden) return;
    var finish = function () {
      card.hidden = true; card.classList.remove("is-in", "is-out");
      var v = actor.querySelector("video"); if (v) v.pause();
      root.classList.remove("is-card");
      if (!REDUCED) { root.classList.add("is-on"); setTimeout(function () { root.classList.remove("is-on"); }, 1300); }
    };
    if (REDUCED) return finish();
    card.classList.add("is-out");
    setTimeout(finish, 480);
  }
  function engage(fn) { toSpotlight(true); run(fn); }

  function showCard() {
    if (root.classList.contains("is-open")) return;
    var poster = A + "z-hero.webp?v=" + V;
    var media;
    if (REDUCED) {
      media = document.createElement("img"); media.alt = ""; media.src = poster;
    } else {
      media = document.createElement("video");
      media.muted = true; media.playsInline = true; media.setAttribute("playsinline", ""); media.preload = "auto"; media.poster = poster;
      media.innerHTML = '<source src="' + A + 'z-wave.mp4?v=' + V + '" type="video/mp4">';
    }
    media.setAttribute("aria-hidden", "true");
    actor.appendChild(media);
    var img = new Image();
    img.onload = function () {           /* only walk on once his picture is ready: no empty box */
      root.classList.add("is-card");
      card.hidden = false;
      card.classList.add("is-in");
      if (media.play) { var p = media.play(); if (p && p.catch) p.catch(function () {}); }
      cardTimer = setTimeout(function () { toSpotlight(true); }, CARD_MS);
    };
    img.src = poster;
  }
  /* pause the countdown while someone is reading or hovering */
  ["pointerenter", "focusin"].forEach(function (ev) { card.addEventListener(ev, function () { clearTimeout(cardTimer); }); });
  card.addEventListener("pointerleave", function () { if (!card.hidden) cardTimer = setTimeout(function () { toSpotlight(true); }, 6000); });

  root.querySelector(".zgl-x").addEventListener("click", function () { toSpotlight(true); btn.focus(); });
  actor.addEventListener("click", function () { engage(function (z) { z.open(); }); });
  root.querySelector(".go").addEventListener("click", function () { sset(LS, "mw_z_toured", "1"); engage(function (z) { z.tour(0); }); });
  root.querySelector(".help").addEventListener("click", function () { engage(function (z) { z.open("help"); }); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !card.hidden) toSpotlight(true); });

  /* ---------- spotlight ---------- */
  btn.addEventListener("click", function () { toSpotlight(true); run(function (z) { z.toggle(); }); });
  ["pointerenter", "focus", "touchstart"].forEach(function (ev) {
    btn.addEventListener(ev, function () { load().catch(function () {}); }, { once: true, passive: true });
  });
  window.addEventListener("mw:guide-open", function (e) { var t = e.detail && e.detail.topic; engage(function (z) { z.open(t); }); });
  window.addEventListener("mw:guide-tour", function () { engage(function (z) { z.tour(0); }); });

  /* rare flicker to catch the eye: first after ~25 s, then every 40-70 s, at most 3 times, never while busy */
  var flickers = 0;
  function flicker() {
    if (REDUCED || flickers >= 3) return;
    if (!document.hidden && card.hidden && !root.classList.contains("is-open")) {
      flickers++;
      root.classList.add("is-flicker");
      setTimeout(function () { root.classList.remove("is-flicker"); }, 1150);
    }
    setTimeout(flicker, 40000 + Math.random() * 30000);
  }

  window.__mwzLauncher = { root: root, button: btn, hideBubble: function () { toSpotlight(true); } };
  document.body.appendChild(root);
  setTimeout(function () { root.classList.add("is-dim"); }, 8000);
  setTimeout(flicker, 25000);

  /* Walk on once per visit, after load, never on app pages or tiny screens in landscape. */
  function afterLoad() {
    var c = navigator.connection, slow = c && (c.saveData || /2g/.test(c.effectiveType || ""));
    if (!APP.test(location.pathname) && !sget(SS, "mw_z_card") && innerHeight > 420 && !slow) setTimeout(showCard, 1800);
    if (!slow) (window.requestIdleCallback || function (f) { setTimeout(f, 3000); })(function () { load().catch(function () {}); }, { timeout: 9000 });
  }
  if (document.readyState === "complete") afterLoad(); else window.addEventListener("load", afterLoad);
  window.__mwzLauncher.showCard = showCard;   /* lets the tour or tests bring him back */
})();
