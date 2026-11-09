/* Madwackd Studio - AI guide launcher (Madi) (small, loads with the page).
   Entrance: once per visit, after the page has loaded, the claymation director walks on with a speech bubble
   (tour or help). Click him to chat. Leave him be (or press X) and he turns into a movie-set spotlight in the
   corner until someone needs him. The spotlight flickers now and then, a few times per page at most.
   The chat panel (guide-z.js + guide-z.css) loads only on first use or at idle.
   Plain JS, no inline handlers (CSP script-src 'self'). Same-origin files only. */
(function () {
  "use strict";
  if (typeof document === "undefined" || window.__mwzLauncher) return;

  var V = "20261107m";
  /* The guide's name, in one place (Zach, Nov 6: "Madi", she/her). MW_CONFIG.guideName can override it. */
  var NAME = String((window.MW_CONFIG && window.MW_CONFIG.guideName) || "Madi");
  var A = "/assets/z/";
  var APP = /^\/(studio|studio-board|dashboard)\//;          /* app pages: never walk on, never nudge */
  var REDUCED = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var CARD_MS = 14000;                                        /* how long he waits before becoming the spotlight */
  function sget(s, k) { try { return s.getItem(k); } catch (e) { return null; } }
  function sset(s, k, v) { try { s.setItem(k, v); } catch (e) { /* private mode */ } }
  var LS = window.localStorage, SS = window.sessionStorage;


  /* Page-aware openers. [opener, chips]. Every page gets its own line; repeat visits in a session rotate to a
     fresh line so she never greets the same way twice. */
  var TOUR = "Take the tour";
  var GREET = {
    "/": ["Welcome to the studio! Want the 30-second tour, or tell me what you're making?", [TOUR, "What does it cost?", "Make it for me"]],
    "/pricing/": ["You're on Pricing. Tell me what you're making and I'll point you to the cheapest plan that fits. No upsell theater, promise.", ["Which plan fits me?", "What's a credit?", "Make it for me"]],
    "/studio/": ["You're in the Studio, where the magic renders. Want help writing a shot that comes out right the first time?", ["Help me write a shot", "How do credits work?"]],
    "/creator-studio/": ["Free tools, no account, nothing uploaded. Want a hand with a hook, a script or captions?", ["Write me a hook", "Fit my script to 8 seconds", "What's free vs paid?"]],
    "/dashboard/": ["This is your Creator Dashboard: Mix, Sounds, Video and Voices. Want a one-click start, or help with your edit?", ["Help with my edit", "What's in my plan?"]],
    "/creator-dashboard-demo/": ["You're on the Creator Dashboard. Want help making the most of it? I'm here for you!", ["What could mine do?", "How is it priced?", "Book a call"]],
    "/studio-board/": ["The Studio board: our pro console for the Studio plan. Want a quick lap around what it's for?", ["What's on the board?", "Is Studio right for me?"]],
    "/producers/": ["Want a real producer to run it start to finish? Tell me the video and I'll point you to the right package.", ["An ad for my business", "A music video", "A trailer or series"]],
    "/apply/": ["Filling out a quote? Tell me the project in a sentence and I'll help you describe it so the team can price it fast.", ["Help me describe it", "What does it cost?"]],
    "/collaborate/": ["Got an idea to make together? Pitch me the one-sentence version and I'll help you shape it.", ["Help me pitch it", "How does it work?"]],
    "/awards/": ["Made something great in the studio? I can walk you through nominating it for Madwackd Picks.", ["How do I nominate?", "What do you judge?"]],
    "/launch-pad/": ["Launching something? Tell me the brand or project in one sentence and I'll point you to the right tool, or help you request a fit call.", ["Which tool fits me?", "Request a call", "What does it cost?"]],
    "/producers-corner/": ["Reading up? Ask me anything from the guides, or let's turn it into your video.", ["What does a commercial cost?", "Plan my first video"]],
    "/vision/": ["Big-ideas page! Ask me about the vision, or let's get back to making video.", ["Tell me the short version", "Make a video"]],
    "/vault/": ["Every clip in the Vault came out of this studio. Want to make one like it?", ["Make one like these", "What does it cost?"]],
    "/features/": ["Shopping features? Ask me which ones are live and which are launching.", ["What's live today?", "Which plan has what?"]],
    "/how-it-works/": ["Short version: describe it, see the price, render. Want to plan your first shot together?", ["Plan my first shot", "What does it cost?"]],
    "/voice/": ["Voices! Want help picking a narrator for your video?", ["Help me pick a voice", "Can I use my own voice?"]],
    "/trust/": ["Questions about safety, consent or who owns what? Ask away, plain English.", ["Who owns my videos?", "Can I use a real person?"]],
    "/our-mission/": ["Fun fact: 1.5% of our revenue goes to carbon removal, and it's never added to your price. Want to make something?", ["Tell me more", "Make a video"]],
    "/about/": ["Hi! I'm " + NAME + ", the studio's AI director. Want the tour, or tell me what you're making?", [TOUR, "Make it for me"]],
    "/early-access/": ["Joining early access? I can explain what you get while you're here.", ["What do I get?", "Can I start now?"]],
    "/refunds/": ["Reading the refund policy? I'll explain it in plain English; the page is the official word.", ["When do I get credits back?", "Can I cancel?"]],
    "/terms/": ["Fine print time. I can explain anything in plain English; the page is the official word.", ["Explain the basics"]],
    "/privacy/": ["Privacy questions? I'll explain in plain English; the page is the official word.", ["What do you collect?"]],
    "/acceptable-use/": ["Wondering what you can and can't make here? Ask me.", ["Can I use a real person?", "What gets blocked?"]],
    "/ai-disclosure/": ["Curious how we label AI content? Ask me anything.", ["How are videos labeled?"]]
  };
  var FOLLOW = ["Let's do it! What would you like to know?", "Action! Where do you want to start?", "Love it. Ask me anything, or pick one below."];
  var AGAIN = ["Back for more? What can I help with on this page?", "Look who's back! What are we making?",
    "Hey again! Want help with this page, or with your video?"];
  function greet(path) {
    var g = GREET[path] || (path.indexOf("/producers-corner/") === 0 ? GREET["/producers-corner/"] : null) ||
      ["Hi, I'm " + NAME + ", your AI director. I'm here to get your video made. What are you making?", [TOUR, "What does it cost?", "Make it for me"]];
    if (sget(SS, "mw_z_said") === g[0]) {          /* the walk-on bubble just said it: follow up instead */
      sset(SS, "mw_z_said", "");
      return [FOLLOW[Math.floor(Math.random() * FOLLOW.length)], g[1]];
    }
    var n = +(sget(SS, "mw_z_greets") || 0);
    sset(SS, "mw_z_greets", String(n + 1));
    return n === 0 ? g : [AGAIN[(n - 1) % AGAIN.length], g[1]];
  }

  var root = document.createElement("div");
  root.className = "zgl";
  root.innerHTML =
    '<div class="zgl-beam" aria-hidden="true"><i class="h"></i><i class="c"></i><i class="d"></i></div>' +
    '<button class="zgl-btn" type="button" aria-expanded="false" aria-controls="zg-panel" aria-label="Ask ' + NAME + ', the AI director">' +
    '<img src="' + A + 'z-spot.webp?v=' + V + '" width="64" height="64" alt="" decoding="async"><span class="zgl-glow"></span></button>' +
    '<div class="zgl-card" role="region" aria-label="' + NAME + '" hidden>' +
    '<div class="zgl-say"><button class="zgl-x" type="button" aria-label="Close ' + NAME + '">&times;</button>' +
    '<p aria-live="polite"></p>' +
    '<button class="go" type="button">Take the 30-second tour</button><button class="help" type="button">Help me make a video</button></div>' +
    '<button class="zgl-actor" type="button" aria-label="Chat with ' + NAME + '"></button></div>';

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
    var line = (GREET[location.pathname] || GREET["/"])[0];
    root.querySelector(".zgl-say p").textContent = line;
    sset(SS, "mw_z_said", line);
    sset(SS, "mw_z_greets", String(+(sget(SS, "mw_z_greets") || 0) + 1));
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
  window.__mwzLauncher.showCard = showCard;
  window.__mwzLauncher.greet = greet;
  window.__mwzLauncher.name = NAME;
})();
