/* Madwackd Studio - Producer Z, always on set (small, loads with the page).
   Z stands in the corner on every page (he's the sales team): speech bubbles now and then, click him to chat.
   X sends him away for this visitor (remembered in localStorage) and leaves a small spotlight to call him back.
   On pages with the Genie stage (#gstage) he waits while the stage, where he already performs, is on screen.
   On app pages (/studio/, /dashboard/, /studio-board/) he stays a spotlight so he never covers work.

   Talking: window.__mwzLauncher.voice is the one voice + lip-sync engine (the chat panel uses it too).
   - Sound only after the visitor interacts with the page AND has Z's sound on (they clicked Z or the speaker).
     The speaker button mutes him; the choice is remembered.
   - Lips: six clay mouth frames (/assets/z/mouth-<shape>.webp) swapped from visemes: letter timing from the
     browser voice's word boundaries, the studio voice's per-character timeline, or the audio's loudness.
   - Every spoken line is also shown as text in a speech bubble (or the chat log).
   The chat panel (guide-z.js + guide-z.css) loads only on first use or at idle.
   Plain JS, no inline handlers (CSP script-src 'self'). Same-origin files only. */
(function () {
  "use strict";
  if (typeof document === "undefined" || window.__mwzLauncher) return;

  var V = "20261108z3";
  /* The guide's name, in one place (Zach, Nov 8: Producer Z, he/him). MW_CONFIG.guideName can override it. */
  var NAME = String((window.MW_CONFIG && window.MW_CONFIG.guideName) || "Producer Z");
  var A = "/assets/z/";
  var APP = /^\/(studio|studio-board|dashboard|owner)\//;      /* app pages: spotlight only, never stand over work */
  var REDUCED = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function sget(s, k) { try { return s.getItem(k); } catch (e) { return null; } }
  function sset(s, k, v) { try { s.setItem(k, v); } catch (e) { /* private mode */ } }
  var LS = window.localStorage, SS = window.sessionStorage;

  /* Page-aware openers. [opener, chips]. Repeat visits in a session rotate to a fresh line. */
  var TOUR = "Take the tour";
  var GREET = {
    "/": ["Welcome to the studio! I'm " + NAME + ", your AI producer. What are you making, and what should it do for you?", [TOUR, "What does it cost?", "Make it for me"]],
    "/pricing/": ["You're on Pricing. Tell me what you're making and I'll point you to the plan that fits. No upsell theater, promise.", ["Which plan fits me?", "What's a credit?", "Make it for me"]],
    "/studio/": ["You're in the Studio, where the magic renders. Want help writing a shot that comes out right the first time?", ["Help me write a shot", "How do credits work?"]],
    "/creator-studio/": ["Free tools, no account, nothing uploaded. Want a hand with a hook, a script or captions?", ["Write me a hook", "Fit my script to 8 seconds", "What's free vs paid?"]],
    "/dashboard/": ["This is your Creator Dashboard: Mix, Sounds, Video and Voices. Want a one-click start, or help with your edit?", ["Help with my edit", "What's in my plan?"]],
    "/creator-dashboard-demo/": ["Your dashboard can talk. Want me to show you what yours could do for your brand?", ["What could mine do?", "How is it priced?", "Talk to an expert"]],
    "/studio-board/": ["The Studio board: our pro console for the Studio plan. Want a quick lap around what it's for?", ["What's on the board?", "Is Studio right for me?"]],
    "/producers/": ["Want a real producer to run it start to finish? Tell me the video and what it should do, and I'll point you to the right package.", ["An ad for my business", "A music video", "A trailer or series"]],
    "/apply/": ["Filling out a quote? Tell me the project in a sentence and I'll help you describe it so the team can price it fast.", ["Help me describe it", "What does it cost?"]],
    "/collaborate/": ["Got an idea to make together? Pitch me the one-sentence version and I'll help you shape it.", ["Help me pitch it", "How does it work?"]],
    "/awards/": ["Made something great in the studio? I can walk you through nominating it for Madwackd Picks.", ["How do I nominate?", "What do you judge?"]],
    "/launch-pad/": ["Launching something? Tell me the brand in one sentence and I'll point you to the right tool.", ["Which tool fits me?", "What does it cost?", "Talk to an expert"]],
    "/pro-studio/": ["Pro Studio: video, talking brands and websites that convert. What's the big goal: sales, leads, or getting found?", ["More sales", "Get found in search", "A talking brand"]],
    "/custom-creator-studio/": ["Your dashboard can talk. We can make your brand or website talk, selling your merch or whatever you want. What's the dream?", ["Make my brand talk", "What does it cost?"]],
    "/book/": ["Requesting a call? Every request is reviewed. I can help you answer the questions so the right expert gets it.", ["Help me answer", "What happens next?"]],
    "/producers-corner/": ["Reading up? Ask me anything from the guides, or let's turn it into your video.", ["What does a commercial cost?", "Plan my first video"]],
    "/vision/": ["Big-ideas page! Ask me about the vision, or let's get back to making video.", ["Tell me the short version", "Make a video"]],
    "/vault/": ["Every clip in the Vault came out of this studio. Want to make one like it?", ["Make one like these", "What does it cost?"]],
    "/features/": ["Shopping features? Ask me which ones are live and which are launching.", ["What's live today?", "Which plan has what?"]],
    "/how-it-works/": ["Short version: describe it, see the price, render. Want to plan your first shot together?", ["Plan my first shot", "What does it cost?"]],
    "/voice/": ["Voices! Want help picking a narrator for your video?", ["Help me pick a voice", "Can I use my own voice?"]],
    "/trust/": ["Questions about safety, consent or who owns what? Ask away, plain English.", ["Who owns my videos?", "Can I use a real person?"]],
    "/our-mission/": ["Fun fact: 1.5% of our revenue goes to carbon removal, and it's never added to your price. Want to make something?", ["Tell me more", "Make a video"]],
    "/about/": ["Hi! I'm " + NAME + ", the studio's AI producer. Want the tour, or tell me what you're making?", [TOUR, "Make it for me"]],
    "/early-access/": ["Joining early access? I can explain what you get while you're here.", ["What do I get?", "Can I start now?"]],
    "/refunds/": ["Reading the refund policy? I'll explain it in plain English; the page is the official word.", ["When do I get credits back?", "Can I cancel?"]],
    "/terms/": ["Fine print time. I can explain anything in plain English; the page is the official word.", ["Explain the basics"]],
    "/privacy/": ["Privacy questions? I'll explain in plain English; the page is the official word.", ["What do you collect?"]],
    "/acceptable-use/": ["Wondering what you can and can't make here? Ask me.", ["Can I use a real person?", "What gets blocked?"]],
    "/ai-disclosure/": ["Curious how we label AI content? Ask me anything. I'm an AI too.", ["How are videos labeled?"]]
  };
  var FOLLOW = ["Let's do it! What would you like to know?", "Action! Where do you want to start?", "Love it. Ask me anything, or pick one below."];
  var AGAIN = ["Back for more? What can I help with on this page?", "Look who's back! What are we making?",
    "Hey again! Want help with this page, or with your video?"];
  /* Bubble lines now and then (true claims only; no prices here, no pressure). */
  var NUDGE = [
    "Your dashboard can talk. We can make your brand or website talk, selling your merch or whatever you want.",
    "A video is only as good as who finds it. Ask me how we get yours seen.",
    "Tell me what you're making and I'll point you to the right next step in about ten seconds.",
    "Every project here is reviewed. Tell me yours and I'll tell you honestly if we're the right fit.",
    "Need a website that actually sells? Ask me about that too."
  ];
  function lineFor(path) {
    return GREET[path] || (path.indexOf("/producers-corner/") === 0 ? GREET["/producers-corner/"] : null) ||
      ["Hi, I'm " + NAME + ", your AI producer. What are you making, and what should it do for you?", [TOUR, "What does it cost?", "Make it for me"]];
  }
  function greet(path) {
    var g = lineFor(path);
    if (sget(SS, "mw_z_said") === g[0]) {          /* the bubble just said it: follow up instead */
      sset(SS, "mw_z_said", "");
      return [FOLLOW[Math.floor(Math.random() * FOLLOW.length)], g[1]];
    }
    var n = +(sget(SS, "mw_z_greets") || 0);
    sset(SS, "mw_z_greets", String(n + 1));
    return n === 0 ? g : [AGAIN[(n - 1) % AGAIN.length], g[1]];
  }

  /* ================= voice + lip-sync engine ================= */
  var SHAPES = ["rest", "mbp", "fv", "a", "e", "o"];
  var LETTER = {};
  [["mbp", "mbp"], ["fv", "fv"], ["ah", "a"], ["ouwq", "o"], ["eiycdgknrstxzjl", "e"]].forEach(function (p) {
    for (var i = 0; i < p[0].length; i++) LETTER[p[0][i]] = p[1];
  });
  var voicePref = sget(LS, "mw_z_voice");         /* "on" | "off" | null (not chosen yet: silent) */
  var activated = false;                          /* a real gesture on this page (browser autoplay rules) */
  ["pointerdown", "keydown", "touchstart"].forEach(function (ev) {
    window.addEventListener(ev, function () { activated = true; }, { capture: true, passive: true, once: true });
  });
  var lipsReady = false, lipsLoading = false, talkRaf = 0, talkTimer = 0, curAudio = null;
  function emit(name, detail) { try { window.dispatchEvent(new CustomEvent(name, { detail: detail })); } catch (e) { /* old browser */ } }
  /* One speaker at a time across the site (the Genie stage, Z, anything else that talks).
     claim(id, stopFn) stops whoever is talking and takes the floor; release(id) when done; current() -> id or null.
     Created here only if the page hasn't made one, so a richer shared version can replace it with the same shape. */
  if (!window.MWAudio) window.MWAudio = (function () {
    var cur = null;
    return {
      claim: function (id, stop) {
        if (cur && cur.id !== id) { var prev = cur; cur = null; try { prev.stop(); } catch (e) { /* ignore */ } }
        cur = { id: id, stop: stop || function () {} };
        emit("mw:audio-claim", { id: id });
      },
      release: function (id) { if (cur && cur.id === id) cur = null; },
      current: function () { return cur ? cur.id : null; },
      stopAll: function () { if (cur) { var prev = cur; cur = null; try { prev.stop(); } catch (e) { /* ignore */ } } }
    };
  })();
  var ME = "z-guide";
  function othersTalking() { var c = window.MWAudio.current && window.MWAudio.current(); return !!c && c !== ME; }
  function loadLips() {
    if (lipsReady || lipsLoading || REDUCED) return;
    lipsLoading = true;
    var left = SHAPES.length;
    SHAPES.forEach(function (s) {
      var im = new Image();
      im.onload = function () { if (--left === 0) lipsReady = true; };
      im.onerror = function () { lipsLoading = false; };
      im.src = A + "mouth-" + s + ".webp?v=" + V;
    });
  }
  function mouth(shape) { emit("mw:z-mouth", { shape: lipsReady ? shape : null, src: lipsReady ? A + "mouth-" + shape + ".webp?v=" + V : "" }); }
  function talkStart() { emit("mw:z-talk", { on: true }); }
  function talkEnd() {
    cancelAnimationFrame(talkRaf); clearInterval(talkTimer); talkRaf = 0; talkTimer = 0;
    mouth("rest"); emit("mw:z-talk", { on: false });
    if (window.MWAudio) window.MWAudio.release(ME);
  }
  function shapesOf(word) {
    var out = [], w = String(word || "").toLowerCase().replace(/[^a-z]/g, "");
    for (var i = 0; i < w.length; i++) { var s = LETTER[w[i]] || "e"; if (out[out.length - 1] !== s) out.push(s); }
    if (out.length > 4) out = [out[0], out[Math.floor(out.length / 3)], out[Math.floor(2 * out.length / 3)], out[out.length - 1]];
    return out.length ? out : ["a"];
  }
  /* Text-driven visemes: a clock walks through the text at speaking speed; word-boundary events re-sync it. */
  function textLips(text, cps) {
    var pos = 0, t0 = performance.now(), sync = 0, last = "";
    var words = [], re = /\S+/g, m;
    while ((m = re.exec(text))) words.push({ i: m.index, w: m[0] });
    function step() {
      var now = performance.now(), at = sync + (now - t0) / 1000 * cps;
      var wd = null;
      for (var k = 0; k < words.length; k++) { if (words[k].i <= at) wd = words[k]; else break; }
      var shape = "rest";
      if (wd && at < wd.i + wd.w.length + 1) {
        var sh = shapesOf(wd.w), frac = Math.min(.999, (at - wd.i) / (wd.w.length + 1));
        shape = sh[Math.floor(frac * sh.length)];
      }
      if (shape !== last) { mouth(shape); last = shape; }
      talkRaf = requestAnimationFrame(step);
    }
    step();
    return function resync(charIndex) { sync = charIndex; t0 = performance.now(); pos = charIndex; };
  }
  function voiceName(v) { return /david|mark|guy|daniel|alex|fred|tom\b|aaron|arthur|george|ryan|christopher|eric|james|male/i.test(v.name); }
  function pickVoice() {
    var vs = (window.speechSynthesis && speechSynthesis.getVoices()) || [];
    var en = vs.filter(function (v) { return /^en(-|_|$)/i.test(v.lang); });
    return en.filter(voiceName)[0] || en.filter(function (v) { return /en-us/i.test(v.lang); })[0] || en[0] || null;
  }
  function forSpeech(text) {
    return String(text || "").replace(/\[\[[^\]]*\]\]/g, "").replace(/https?:\/\/(www\.)?/g, "").replace(/\/([a-z-]+)\//g, " $1 ")
      .replace(/\$(\d+)\/mo\b/g, "$$$1 a month").replace(/\s+/g, " ").trim().slice(0, 600);
  }
  var voice = {
    on: function () { return voicePref === "on"; },
    chosen: function () { return voicePref !== null; },
    set: function (on) { voicePref = on ? "on" : "off"; sset(LS, "mw_z_voice", voicePref); if (!on) voice.stop(); syncMute(); emit("mw:z-voice", { on: on }); if (on) loadLips(); },
    canSpeak: function () {
      var ua = navigator.userActivation;
      return voicePref === "on" && (activated || !!(ua && ua.hasBeenActive));
    },
    stop: function () {
      try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) { /* none */ }
      if (curAudio) { try { curAudio.pause(); } catch (e) { /* none */ } curAudio = null; }
      talkEnd();
    },
    /* the browser's own voice (free) with text-timed lips */
    /* polite = an idle bubble line: never talks over anyone else (the stage show, a video) */
    speak: function (text, done, polite) {
      text = forSpeech(text);
      if (!text || !voice.canSpeak() || !("speechSynthesis" in window) || (polite && othersTalking())) { if (done) done(); return false; }
      loadLips();
      voice.stop();
      window.MWAudio.claim(ME, voice.stop);
      try {
        var u = new SpeechSynthesisUtterance(text), pv = pickVoice(), resync = null;
        if (pv) u.voice = pv;
        u.rate = 1.04; u.pitch = 0.92;
        u.onstart = function () { talkStart(); if (!REDUCED) resync = textLips(text, 14.5 * u.rate); };
        u.onboundary = function (e) { if (resync && (!e.name || e.name === "word")) resync(e.charIndex || 0); };
        u.onend = u.onerror = function () { talkEnd(); if (done) done(); };
        speechSynthesis.speak(u);
        return true;
      } catch (e) { talkEnd(); if (done) done(); return false; }
    },
    /* a studio-voice clip (paid plans): per-character mouth timeline if given, else the audio's loudness */
    playAudio: function (audio, mouths) {
      if (!voice.canSpeak()) return false;
      loadLips(); voice.stop(); curAudio = audio; audio.__mwz = true;
      window.MWAudio.claim(ME, voice.stop);
      var ctx = null, an = null, buf = null, i = 0, last = "", flip = 0;
      if (!(mouths && mouths.length) && (window.AudioContext || window.webkitAudioContext)) {
        try {
          ctx = new (window.AudioContext || window.webkitAudioContext)();
          var src = ctx.createMediaElementSource(audio); an = ctx.createAnalyser(); an.fftSize = 512;
          src.connect(an); an.connect(ctx.destination); buf = new Uint8Array(an.fftSize);
        } catch (e) { ctx = null; }
      }
      function step() {
        var shape = "rest";
        if (mouths && mouths.length) {
          while (i + 1 < mouths.length && mouths[i + 1][0] <= audio.currentTime) i++;
          shape = mouths[i] ? mouths[i][1] : "rest";
        } else if (an) {
          an.getByteTimeDomainData(buf);
          var sum = 0; for (var k = 0; k < buf.length; k++) { var d = (buf[k] - 128) / 128; sum += d * d; }
          var rms = Math.sqrt(sum / buf.length);
          if (rms > 0.02) { flip = (flip + 1) % 12; }
          shape = rms < 0.02 ? "rest" : rms < 0.05 ? (flip < 6 ? "mbp" : "e") : rms < 0.11 ? "e" : (flip < 6 ? "a" : "o");
        }
        if (shape !== last) { mouth(shape); last = shape; }
        if (!audio.paused && !audio.ended) talkRaf = requestAnimationFrame(step);
      }
      audio.addEventListener("play", function () { talkStart(); if (!REDUCED) step(); }, { once: true });
      audio.addEventListener("ended", function () { talkEnd(); if (ctx) ctx.close(); }, { once: true });
      audio.addEventListener("pause", function () { talkEnd(); }, { once: true });
      var p = audio.play(); if (p && p.catch) p.catch(function () { talkEnd(); });
      return true;
    }
  };
  /* Safety net: any unmuted <audio>/<video> (including new Audio() clips the stage plays) takes the floor when it
     starts, so Z never talks over it, even on pages that don't call MWAudio themselves. Muted clips are ignored. */
  (function () {
    var MP = window.HTMLMediaElement && HTMLMediaElement.prototype;
    if (!MP || MP.__mwAudioHooked) return;
    MP.__mwAudioHooked = true;
    var play = MP.play;
    MP.play = function () {
      var el = this;
      try {
        if (!el.muted && el.volume > 0 && !el.__mwz) {
          window.MWAudio.claim("media", function () { try { el.pause(); } catch (e) { /* ignore */ } });
          var done = function () { if (window.MWAudio.current() === "media") window.MWAudio.release("media"); };
          el.addEventListener("ended", done, { once: true });
          el.addEventListener("pause", done, { once: true });
        }
      } catch (e) { /* never block playback */ }
      return play.apply(this, arguments);
    };
  })();
  /* someone else took the floor (stage line, video): Z goes quiet at once */
  window.addEventListener("mw:audio-claim", function (e) {
    if (e.detail && e.detail.id !== ME && (curAudio || (window.speechSynthesis && speechSynthesis.speaking))) voice.stop();
  });
  if (window.speechSynthesis && speechSynthesis.addEventListener) speechSynthesis.addEventListener("voiceschanged", function () { /* warm list */ });

  /* ================= markup ================= */
  var SPK_ON = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M4 9v6h4l5 4V5L8 9H4zm12.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z"/></svg>';
  var SPK_OFF = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M4 9v6h4l5 4V5L8 9H4zm15.6 3 2.2-2.2-1.4-1.4-2.2 2.2-2.2-2.2-1.4 1.4 2.2 2.2-2.2 2.2 1.4 1.4 2.2-2.2 2.2 2.2 1.4-1.4z"/></svg>';
  var root = document.createElement("div");
  root.className = "zgl";
  root.innerHTML =
    '<div class="zgl-beam" aria-hidden="true"><i class="h"></i><i class="c"></i><i class="d"></i></div>' +
    '<button class="zgl-btn" type="button" aria-expanded="false" aria-controls="zg-panel" aria-label="Bring back ' + NAME + ', the AI producer">' +
    '<img src="' + A + 'z-spot.webp?v=' + V + '" width="64" height="64" alt="" decoding="async"><span class="zgl-glow"></span></button>' +
    '<div class="zgl-card" role="region" aria-label="' + NAME + ', AI producer" hidden>' +
    '<div class="zgl-say" hidden><p aria-live="polite"></p><div class="zgl-acts"></div></div>' +
    '<div class="zgl-body"><button class="zgl-actor" type="button" aria-label="Chat with ' + NAME + ', the AI producer">' +
    '<img class="zgl-face" src="' + A + 'z-hero.webp?v=' + V + '" width="420" height="385" alt="" decoding="async"></button>' +
    '<div class="zgl-tools"><button class="zgl-mute" type="button" aria-pressed="false"></button>' +
    '<button class="zgl-x" type="button" aria-label="Hide ' + NAME + '">&times;</button></div></div></div>';

  var btn = root.querySelector(".zgl-btn"), card = root.querySelector(".zgl-card"), actor = root.querySelector(".zgl-actor"),
    face = root.querySelector(".zgl-face"), sayBox = root.querySelector(".zgl-say"), sayP = sayBox.querySelector("p"),
    acts = sayBox.querySelector(".zgl-acts"), muteBtn = root.querySelector(".zgl-mute");
  var FACE = A + "z-hero.webp?v=" + V;
  var loading = null, bubbleTimer = 0, nudges = 0, standing = false;

  function syncMute() {
    var on = voice.on();
    muteBtn.innerHTML = on ? SPK_ON : SPK_OFF;
    muteBtn.setAttribute("aria-pressed", on ? "false" : "true");
    muteBtn.setAttribute("aria-label", on ? "Mute " + NAME : "Turn on " + NAME + "'s voice");
    muteBtn.title = on ? "Mute" : "Sound on";
  }
  syncMute();

  /* lips on the standing Z */
  window.addEventListener("mw:z-mouth", function (e) {
    var d = e.detail || {};
    if (d.src) face.src = d.src;
  });
  window.addEventListener("mw:z-talk", function (e) {
    var on = e.detail && e.detail.on;
    root.classList.toggle("is-talking", !!on);
    if (!on) face.src = FACE;
  });

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

  /* ---------- speech bubble (text always shown; spoken too when his sound is on) ---------- */
  function hideBubble() { clearTimeout(bubbleTimer); sayBox.hidden = true; acts.textContent = ""; }
  function bubble(text, buttons, speakIt) {
    if (!standing || root.classList.contains("is-open")) return;
    clearTimeout(bubbleTimer);
    sayP.textContent = text;
    acts.textContent = "";
    (buttons || []).forEach(function (b) {
      var x = document.createElement("button");
      x.type = "button"; x.className = b[2] || ""; x.textContent = b[0];
      x.addEventListener("click", b[1]);
      acts.appendChild(x);
    });
    sayBox.hidden = false;
    sayBox.classList.remove("is-in"); void sayBox.offsetWidth; sayBox.classList.add("is-in");
    var ms = Math.max(7000, text.split(/\s+/).length * 380);
    function later() { bubbleTimer = setTimeout(hideBubble, ms); }
    if (speakIt && voice.canSpeak()) { voice.speak(text, later, true); } else later();
  }
  ["pointerenter", "focusin"].forEach(function (ev) { sayBox.addEventListener(ev, function () { clearTimeout(bubbleTimer); }); });
  sayBox.addEventListener("pointerleave", function () { if (!sayBox.hidden) bubbleTimer = setTimeout(hideBubble, 5000); });

  /* ---------- standing / away / waiting ---------- */
  function isAway() { return sget(LS, "mw_z_away") === "1"; }
  function setMode() {
    var stageUp = root.classList.contains("is-stage");
    var stand = !isAway() && !APP.test(location.pathname) && !stageUp && innerHeight > 420;
    standing = stand;
    root.classList.toggle("is-stand", stand);
    card.hidden = !stand;
    if (!stand) { hideBubble(); }
  }
  function engage(fn) {
    hideBubble();
    if (!voice.chosen()) voice.set(true);          /* clicking Z is the visitor asking him to talk */
    run(fn);
  }
  function sendAway() {
    sset(LS, "mw_z_away", "1");
    voice.stop();
    if (window.MWZ) window.MWZ.close();
    setMode();
    if (!REDUCED) { root.classList.add("is-on"); setTimeout(function () { root.classList.remove("is-on"); }, 1300); }
    btn.focus();
  }
  root.querySelector(".zgl-x").addEventListener("click", sendAway);
  actor.addEventListener("click", function () { engage(function (z) { z.open(); }); });
  muteBtn.addEventListener("click", function () { voice.set(!voice.on()); if (voice.on()) bubble("Sound on! Ask me anything.", [], true); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !sayBox.hidden) hideBubble(); });

  /* spotlight: calls him back (and opens the chat) */
  btn.addEventListener("click", function () {
    if (isAway()) { sset(LS, "mw_z_away", "0"); setMode(); }
    run(function (z) { z.toggle(); });
  });
  ["pointerenter", "focus", "touchstart"].forEach(function (ev) {
    btn.addEventListener(ev, function () { load().catch(function () {}); }, { once: true, passive: true });
    actor.addEventListener(ev, function () { load().catch(function () {}); }, { once: true, passive: true });
  });
  window.addEventListener("mw:guide-open", function (e) { var t = e.detail && e.detail.topic; engage(function (z) { z.open(t); }); });
  window.addEventListener("mw:guide-tour", function () { engage(function (z) { z.tour(0); }); });

  function firstHello() {
    if (!standing) return;
    var line = lineFor(location.pathname)[0];
    sset(SS, "mw_z_said", line);
    sset(SS, "mw_z_greets", String(+(sget(SS, "mw_z_greets") || 0) + 1));
    bubble(line, [
      ["Take the 30-second tour", function () { sset(LS, "mw_z_toured", "1"); engage(function (z) { z.tour(0); }); }, "go"],
      ["Help me make it", function () { engage(function (z) { z.open("help"); }); }, "help"]
    ], true);
  }
  /* a bubble now and then: first after ~35 s, then every 50-80 s, at most 3 per page, never while busy */
  function nudge() {
    if (nudges >= 3) return;
    if (standing && !document.hidden && sayBox.hidden && !root.classList.contains("is-open")) {
      bubble(NUDGE[(+(sget(SS, "mw_z_nudge") || 0) + nudges) % NUDGE.length], [], true);
      nudges++;
      sset(SS, "mw_z_nudge", String(+(sget(SS, "mw_z_nudge") || 0) + 1));
    }
    setTimeout(nudge, 50000 + Math.random() * 30000);
  }

  window.__mwzLauncher = {
    root: root, button: btn, name: NAME, voice: voice, greet: greet, bubble: bubble,
    /* stage.js and the chat panel call this; it only hides the bubble now (Z stays on set) */
    hideBubble: function () { hideBubble(); },
    showCard: function () { if (isAway()) sset(LS, "mw_z_away", "0"); setMode(); firstHello(); }
  };
  document.body.appendChild(root);

  /* wait while the Genie stage (where he already performs) is on screen */
  var stageEl = document.getElementById("gstage");
  if (stageEl && "IntersectionObserver" in window) {
    root.classList.add("is-stage");
    new IntersectionObserver(function (es) {
      var up = es[0].isIntersecting && es[0].intersectionRatio > 0.15;
      root.classList.toggle("is-stage", up);
      var was = standing;
      setMode();
      if (!was && standing && !sget(SS, "mw_z_hello")) { sset(SS, "mw_z_hello", "1"); setTimeout(firstHello, 600); }
    }, { threshold: [0, 0.15, 0.5] }).observe(stageEl);
  }

  function afterLoad() {
    var c = navigator.connection, slow = c && (c.saveData || /2g/.test(c.effectiveType || ""));
    setMode();
    if (standing && !REDUCED) { card.classList.add("is-in"); }
    if (!sget(SS, "mw_z_hello") && standing) { sset(SS, "mw_z_hello", "1"); setTimeout(firstHello, 1400); }
    setTimeout(nudge, 35000);
    if (!slow) (window.requestIdleCallback || function (f) { setTimeout(f, 3000); })(function () { load().catch(function () {}); }, { timeout: 9000 });
  }
  addEventListener("resize", function () {
    var was = standing; setMode();
    if (was !== standing && standing) {
      card.classList.add("is-in");
      if (!sget(SS, "mw_z_hello")) { sset(SS, "mw_z_hello", "1"); setTimeout(firstHello, 600); }
    }
  });
  if (document.readyState === "complete") afterLoad(); else window.addEventListener("load", afterLoad);
})();
