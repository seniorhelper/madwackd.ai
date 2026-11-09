/* Madwackd Studio - Producer Z, the AI producer (full half: chat panel, full-body character, tour, talking lips).
   Loaded on demand by /assets/guide-widget.js. Plain JS, no inline handlers (CSP script-src 'self').
   Renders replies with textContent only. Links are rebuilt from an allowlist. Needs /assets/config.js. */
(function () {
  "use strict";

  /* Blocked names are stored only as 32-bit FNV-1a hashes, so page source names no one. Source of truth:
     guide/mw_guide/guardrails.py (server); regenerate with tools/hash_terms.py. */
  var BLOCK_HASH = [0x8dd413bc,0x660dbe6f,0xb0d11833,0xede616c3,0xadaad958,0x1cd93fd7,0xf2362cc1,0x08fb8333,
    0x36cb88ff,0xd7ac1a8d,0x9da4e586,0x77305731,0x90e14d8e,0x292d430a,0xe1fc8517,0x463bef82,0x172be6ba,0xdcd757fc,
    0x8ccc3104,0x945367a7,0xeb7609fa,0x91ef7b40,0x796a932e,0xfa5219e8,0x7b009f24,0xb9d61633,0xc0729580];
  function fnv(s) { var h = 0x811c9dc5; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h >>> 0; }
  var PATHS = ["/", "/features/", "/how-it-works/", "/voice/", "/pricing/", "/producers/", "/vault/",
    "/creator-studio/", "/dashboard/", "/studio/", "/trust/", "/about/", "/our-mission/", "/terms/",
    "/privacy/", "/refunds/", "/acceptable-use/", "/ai-disclosure/", "/apply/", "/awards/", "/collaborate/",
    "/creator-dashboard-demo/", "/producers-corner/", "/studio-board/", "/vision/", "/early-access/", "/launch-pad/",
    "/book/", "/support/", "/contact/", "/pro-studio/", "/custom-creator-studio/",
    "/studio/?buy=test_drive", "/studio/?buy=starter", "/studio/?buy=pro", "/studio/?buy=studio",
    "/studio/?buy=pack_100", "/studio/?buy=pack_500", "/studio/?buy=pack_1000", "/studio/?buy=pack_5000"];
  /* family only (Zach, Nov 8): parent studio, Eye To Ad Media (SEO, AIO, websites), Search Converts (conversion) */
  var FAMILY = ["https://www.madwackd.com/", "https://eyetoad.com/", "https://searchconverts.com/"];
  var SAFE = "Sorry, I fumbled that one. Try me again, or see Pricing and the free tools.";

  /* Second line of defense; the server already filtered. */
  function scrub(text) {
    var t = String(text || "").normalize ? String(text || "").normalize("NFKC") : String(text || "");
    t = t.replace(/[​-‏⁠-⁤﻿­]/g, "");
    var w = t.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().split(" ");
    var lt = t.toLowerCase().replace(/[0134578@$]/g, function (c) { return { "0": "o", "1": "l", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", "$": "s" }[c]; })
      .replace(/[^a-z0-9]+/g, " ").trim().split(" ");
    var lists = [w, lt];
    for (var k = 0; k < 2; k++) {
      var ws = lists[k];
      for (var i = 0; i < ws.length; i++) {
        var cands = [ws[i], ws[i] + (ws[i + 1] || ""), ws[i] + (ws[i + 1] || "") + (ws[i + 2] || "")];
        if (ws[i].length > 1 && ws[i].slice(-1) === "s") cands.push(ws[i].slice(0, -1));
        for (var c = 0; c < cands.length; c++) if (BLOCK_HASH.indexOf(fnv(cands[c])) > -1) return SAFE;
      }
    }
    if (/sk-[a-z0-9_\-]{12,}|\.run\.app|aiza[0-9a-z_\-]{20,}/i.test(t)) return SAFE;
    return t;
  }
  function safeLink(href) { return PATHS.indexOf(href) > -1 || FAMILY.indexOf(href) > -1; }

  if (typeof document === "undefined") { module.exports = { scrub: scrub, safeLink: safeLink }; return; }

  var C = window.MW_CONFIG || {};
  var API = String(C.apiBase || "").trim().replace(/\/+$/, "");
  var TS_KEY = String(C.turnstileSiteKey || "").trim();
  var TIER = String(window.MW_USER_TIER || "anon");
  var REDUCED = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var L = window.__mwzLauncher || null;
  var NAME = String((L && L.name) || (window.MW_CONFIG && window.MW_CONFIG.guideName) || "Producer Z");
  var Z = "/assets/z/", ZV = "20261108z";
  var history = [];
  var busy = false;
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } }
  };
  var session = {
    get: function (k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* private mode */ } }
  };

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  /* ---------------- markup ---------------- */
  var root = el("div", "zg");
  root.innerHTML =
    '<section class="zg-panel" id="zg-panel" role="dialog" aria-modal="false" aria-labelledby="zg-title" hidden>' +
    '<header class="zg-stage"><button class="zg-actor" type="button" aria-label="' + NAME + ': your AI producer">' +
    '<video muted playsinline preload="metadata" aria-hidden="true" poster="' + Z + 'z-hero.webp?v=' + ZV + '"></video>' +
    '<img class="zg-mouth" alt="" aria-hidden="true" hidden></button>' +
    '<div class="zg-name"><strong id="zg-title">' + NAME + '</strong><small>AI producer</small></div>' +
    '<button class="zg-mute" type="button" aria-pressed="false">Sound on</button>' +
    '<button class="zg-x" type="button" aria-label="Close ' + NAME + '">&times;</button></header>' +
    '<div class="zg-log" role="log" aria-live="polite" aria-relevant="additions"></div>' +
    '<div class="zg-quick"></div>' +
    '<p class="zg-humanrow"><a class="zg-human" href="/support/#contact" data-human>Order or account help</a>' +
    '<span class="zg-live" hidden> <a class="zg-human zg-book" href="/book/">Request a call</a> <a class="zg-human" href="tel:+18004818638">Call 1-800-481-8638</a></span></p>' +
    '<form class="zg-form"><label class="zg-sr" for="zg-in">Ask ' + NAME + '</label>' +
    '<input id="zg-in" maxlength="800" autocomplete="off" placeholder="Ask about prices, tools, your video...">' +
    '<button class="zg-mic" type="button" aria-pressed="false" aria-label="Talk to ' + NAME + '" hidden>' +
    '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-2.08A7 7 0 0 0 19 12z"/></svg></button>' +
    '<button class="zg-send" type="submit">Send</button></form>' +
    '<p class="zg-fine">' + NAME + ' is an AI producer and can make mistakes. Prices on /pricing/ are final. Don\'t share card or personal details here.</p>' +
    "</section>";
  (L ? L.root : document.body).appendChild(root);

  var panel = root.querySelector(".zg-panel"), log = root.querySelector(".zg-log"), quick = root.querySelector(".zg-quick"),
    form = root.querySelector(".zg-form"), input = root.querySelector("#zg-in"), actor = root.querySelector(".zg-actor");
  var launcher = L ? L.button : null;

  function isOpen() { return !panel.hidden; }
  function open(topic, detail) {
    if (L) L.hideBubble(false);
    if (!isOpen()) {
      panel.hidden = false;
      if (L) L.root.classList.add("is-open");
      if (launcher) { launcher.setAttribute("aria-expanded", "true"); launcher.setAttribute("aria-label", "Close " + NAME); }
      wave();
      document.addEventListener("pointermove", look, { passive: true });
    }
    if (!log.childNodes.length && topic !== "help" && topic !== "dashboard" && topic !== "wish") {
      var g = L && L.greet ? L.greet(location.pathname) : ["Hi, I'm " + NAME + ", your AI producer. What are you making?", ["Take the tour", "What does it cost?"]];
      say(g[0], [], g[1]);
      if (VO && VO.canSpeak()) VO.speak(g[0], null, true);   /* greeting: never over the stage show */
    }
    if (topic === "wish") {   /* the Genie console's "Talk it over with Producer Z": grow the visitor's wish together */
      var wish = String((detail && detail.text) || "").replace(/\s+/g, " ").trim().slice(0, 600);
      if (wish) {
        say("Let's grow that wish together. I'll ask a couple of questions, then make it bigger and clearer.");
        send("Here's my wish so far: " + wish + ". Help me make it bigger and clearer.");
      } else {
        var wl = "Tell me your wish in a sentence: what should your dashboard do for you? I'll help you make it bigger and clearer.";
        say(wl, [], ["For my channel", "For my business", "A talking brand"]);
        if (VO && VO.canSpeak()) VO.speak(wl, null, true);
      }
    }
    if (topic === "help") {
      var hl = "Love it. What are you making, and what should it do for you? I'll plan it, price it, and point you to the right next step.";
      say(hl, [], ["An ad for my business", "A talking brand or website", "A music video"]);
      if (VO && VO.canSpeak()) VO.speak(hl, null, true);
    }
    if (topic === "dashboard") say("This is your Creator Dashboard: Mix, Sounds, Video and Voices. Want a one-click start, or help with your edit?");
    input.focus();
  }
  function close() {
    if (!isOpen()) return;
    panel.hidden = true;
    if (L) L.root.classList.remove("is-open");
    if (launcher) { launcher.setAttribute("aria-expanded", "false"); launcher.setAttribute("aria-label", "Ask " + NAME + ", the AI producer"); launcher.focus(); }
    document.removeEventListener("pointermove", look);
    rest();
  }
  function toggle() { isOpen() ? close() : open(); }

  /* "Talk to a human": always visible, one click. Carries a short summary of this chat (no contact details) to the form. */
  root.querySelector("[data-human]").addEventListener("click", function (e) {
    var lines = history.slice(-8).map(function (m) { return (m.role === "user" ? "Visitor: " : NAME + ": ") + String(m.text || "").slice(0, 220); });
    session.set("mw_chat_summary", scrub(lines.join(" | ")).slice(0, 1400));
    if (location.pathname.indexOf("/support") === 0) {
      e.preventDefault();
      var c = document.getElementById("contact");
      if (c) { c.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth" }); window.dispatchEvent(new Event("mw-chat-summary")); }
      close();
    }
  });

  /* ---------------- the character: claymation clips (wave, talk, clap); leans toward the pointer ---------------- */
  var vid = actor.querySelector("video"), clip = "", talkTimer = 0, raf = 0, px = 0, py = 0;
  function play(name, loop) {
    if (REDUCED || !vid) return;
    if (clip !== name) { vid.src = Z + "z-" + name + ".mp4?v=" + ZV; clip = name; }
    else { try { vid.currentTime = 0; } catch (e) { /* not ready */ } }
    vid.loop = !!loop;
    var pr = vid.play(); if (pr && pr.catch) pr.catch(function () {});
  }
  function rest() { if (vid && !REDUCED) { vid.loop = false; vid.pause(); } }
  if (vid) vid.addEventListener("ended", function () { if (clip !== "wave") play("wave"); });
  function look(e) {
    if (REDUCED) return;
    px = e.clientX; py = e.clientY;
    if (raf) return;
    raf = requestAnimationFrame(function () {
      raf = 0;
      var r = actor.getBoundingClientRect(), dx = (px - (r.left + r.width / 2)) / innerWidth, dy = (py - (r.top + r.height / 2)) / innerHeight;
      actor.style.transform = "perspective(500px) rotateY(" + Math.max(-9, Math.min(9, dx * 24)).toFixed(1) + "deg) rotateX(" +
        Math.max(-6, Math.min(6, -dy * 14)).toFixed(1) + "deg)";
    });
  }
  function talk(ms) {
    if (REDUCED) return;
    play("talk", true);
    clearTimeout(talkTimer);
    talkTimer = setTimeout(function () { vid.loop = false; }, Math.min(9000, Math.max(1500, ms)));
  }
  function wave() { play("wave"); }
  actor.addEventListener("click", function () { play("clap"); });

  function say(text, links, chips, who) {
    var row = el("div", "zg-msg " + (who || "bot"));
    var clean = who === "you" ? text : scrub(text);
    row.appendChild(el("p", "", clean));
    (links || []).forEach(function (l) {
      if (!l || !safeLink(l.href)) return;
      var a = el("a", "zg-btn", scrub(l.label));
      a.href = l.href;
      if (l.href.indexOf("http") === 0) { a.rel = "noopener"; a.target = "_blank"; }
      row.appendChild(a);
    });
    if (who !== "you" && "speechSynthesis" in window) {
      var sp = el("button", "zg-say", "Read aloud");
      sp.type = "button";
      sp.addEventListener("click", function () { if (VO && !VO.on()) VO.set(true); speak(row.firstChild.textContent); });
      row.appendChild(sp);
    }
    log.appendChild(row);
    log.scrollTop = log.scrollHeight;
    quick.textContent = "";
    (chips || []).forEach(function (c) {
      var b = el("button", "zg-chip", c);
      b.type = "button";
      b.addEventListener("click", function () { c === "Take the tour" ? tour(0) : send(c); });
      quick.appendChild(b);
    });
    if (who !== "you") talk(clean.split(/\s+/).length * 110);
    return row;
  }
  function note(text) { var n = el("p", "zg-note", text); log.appendChild(n); log.scrollTop = log.scrollHeight; }

  /* ---------------- voice: one engine in the launcher (guide-widget.js) ----------------
     Browser voice for everyone (free) with text-timed lips; the studio voice with its mouth timeline for paid plans.
     He speaks only after the visitor interacted and has his sound on; every spoken line is also in the chat log. */
  var VO = (L && L.voice) || null, mouth = root.querySelector(".zg-mouth");
  window.addEventListener("mw:z-mouth", function (e) {
    var d = e.detail || {};
    if (!d.src || REDUCED || panel.hidden) return;
    if (vid) { vid.pause(); vid.style.visibility = "hidden"; }
    mouth.hidden = false;
    if (mouth.getAttribute("src") !== d.src) mouth.setAttribute("src", d.src);
  });
  window.addEventListener("mw:z-talk", function (e) {
    if (e.detail && e.detail.on) { if (mouth.hidden && !REDUCED && vid) talk(4000); return; }
    mouth.hidden = true; if (vid) { vid.style.visibility = ""; vid.loop = false; }
  });
  function speak(text, ticket) {
    if (!VO) return;
    var paid = ["pro", "studio", "creators_beta", "genie_team", "business", "agency", "whitelabel"].indexOf(TIER) > -1;
    /* studio voice: paid plans (their minutes), or any visitor when the server signed this exact reply (ticket) */
    var signedIn = paid && window.MW_ID_TOKEN;
    if (API && VO.canSpeak() && (signedIn || ticket)) {
      var hd = { "Content-Type": "application/json" };
      if (signedIn) hd.Authorization = "Bearer " + window.MW_ID_TOKEN;
      fetch(API + "/v2/guide/voice", { method: "POST", headers: hd,
        body: JSON.stringify(signedIn ? { text: text, lips: true } : { text: text, say: ticket, lips: true }) })
        .then(function (r) { if (!r.ok) throw 0; return r.json(); })
        .then(function (j) {
          var bin = atob(j.audio_b64 || ""), buf = new Uint8Array(bin.length);
          for (var i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
          var a = new Audio(URL.createObjectURL(new Blob([buf], { type: "audio/mpeg" })));
          if (!VO.playAudio(a, j.mouths || [])) VO.speak(text);
        })
        .catch(function () { VO.speak(text); });
      return;
    }
    VO.speak(text);
  }
  function syncPanelMute() {
    var b = root.querySelector(".zg-mute"); if (!b || !VO) return;
    var on = VO.on();
    b.setAttribute("aria-pressed", on ? "false" : "true");
    b.setAttribute("aria-label", on ? "Mute " + NAME : "Turn on " + NAME + "'s voice");
    b.textContent = on ? "Sound on" : "Muted";
  }
  window.addEventListener("mw:z-voice", syncPanelMute);

  /* ---------------- push to talk: the browser's own speech recognition (free; Chrome, Edge, Safari) ---------------- */
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition, mic = root.querySelector(".zg-mic"), rec = null;
  if (SR && mic) {
    mic.hidden = false;
    mic.addEventListener("click", function () {
      if (rec) { rec.stop(); return; }
      try { speechSynthesis.cancel(); } catch (e) { /* none */ }
      rec = new SR();
      rec.lang = document.documentElement.lang || "en-US";
      rec.interimResults = true; rec.maxAlternatives = 1;
      var finalText = "";
      mic.setAttribute("aria-pressed", "true"); mic.classList.add("is-on"); input.placeholder = "Listening...";
      rec.onresult = function (ev) {
        var interim = "";
        for (var i = ev.resultIndex; i < ev.results.length; i++) {
          if (ev.results[i].isFinal) finalText += ev.results[i][0].transcript; else interim += ev.results[i][0].transcript;
        }
        input.value = (finalText + interim).slice(0, 800);
      };
      rec.onerror = function () { /* denied or no speech: just stop */ };
      rec.onend = function () {
        mic.setAttribute("aria-pressed", "false"); mic.classList.remove("is-on"); input.placeholder = "Ask about prices, tools, your video...";
        rec = null;
        var said = (finalText || input.value).trim();
        if (said) { input.value = ""; send(said, true); }
      };
      rec.start();
    });
  }

  /* ---------------- lead capture: a real person calls back (human callback only) ---------------- */
  var leadShown = false;
  function offerLead(lf) {
    if (leadShown || !API) return;
    leadShown = true;
    var b = el("button", "zg-chip zg-lead-go", "Have a producer reach out");
    b.type = "button";
    b.addEventListener("click", function () { b.remove(); leadForm(lf); });
    log.appendChild(b); log.scrollTop = log.scrollHeight;
  }
  function leadForm(lf) {
    var started = Date.now(), lastAsk = "";
    for (var i = history.length - 1; i >= 0; i--) if (history[i].role === "user") { lastAsk = history[i].text; break; }
    var f = el("form", "zg-lead");
    f.setAttribute("aria-label", "Request a callback");
    f.innerHTML =
      '<p class="zg-lead-h">A real person on our team will reach out within one business day (Mountain time).</p>' +
      '<label>Name<input name="name" autocomplete="name" required maxlength="120"></label>' +
      '<label>Email<input name="email" type="email" autocomplete="email" required maxlength="254"></label>' +
      '<label>Phone (optional)<input name="phone" type="tel" autocomplete="tel" maxlength="30"></label>' +
      '<label>What is it?<select name="interest"><option value="spot">A commercial or ad</option><option value="music_video">A music video</option>' +
      '<option value="high_end_commercial">A high-end commercial</option><option value="masterclass">The Masterclass</option>' +
      '<option value="question">A question</option><option value="not_sure" selected>Not sure yet</option></select></label>' +
      '<label>Budget<select name="budget"><option value="not_sure" selected>Not sure</option><option value="under_1000">Under $1,000</option>' +
      '<option value="1000_2500">$1,000 to $2,500</option><option value="2500_5000">$2,500 to $5,000</option>' +
      '<option value="5000_10000">$5,000 to $10,000</option><option value="10000_plus">$10,000 or more</option></select></label>' +
      '<label>About the project<textarea name="message" rows="3" maxlength="3000" required></textarea></label>' +
      '<label class="zg-consent"><input type="checkbox" name="sms_consent"> <span></span></label>' +
      '<input class="zg-hp" name="_honey" tabindex="-1" autocomplete="off" aria-hidden="true">' +
      '<div class="zg-ts"></div>' +
      '<p class="zg-lead-fine">We use this only to reply about your request. <a href="/privacy/">Privacy policy</a>.</p>' +
      '<button class="zg-send" type="submit">Send my request</button><p class="zg-lead-msg" role="status"></p>';
    f.querySelector(".zg-consent span").textContent = (lf && lf.sms_consent_text) || "";
    if (!(lf && lf.sms_consent_text)) f.querySelector(".zg-consent").remove();
    f.querySelector("textarea").value = lastAsk;
    log.appendChild(f); log.scrollTop = log.scrollHeight;
    f.querySelector("input[name=name]").focus();
    var token = "";
    if (TS_KEY) loadTurnstile().then(function (ts) {
      ts.render(f.querySelector(".zg-ts"), { sitekey: TS_KEY, theme: "dark", size: "flexible", callback: function (tk) { token = tk; } });
    }).catch(function () { /* the server will say if the check is required */ });
    f.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var msg = f.querySelector(".zg-lead-msg"), btn = f.querySelector(".zg-send");
      if (TS_KEY && !token) { msg.textContent = "Please finish the quick human check first."; return; }
      var d = new FormData(f), summary = history.filter(function (h) { return h.role === "user"; }).slice(-3)
        .map(function (h) { return h.text; }).join(" / ").slice(0, 600);
      var body = { name: d.get("name"), email: d.get("email"), phone: d.get("phone") || "", interest: d.get("interest"),
        budget: d.get("budget"), message: d.get("message"), source: "producer_chat", chat_summary: summary,
        sms_consent: !!d.get("sms_consent"), _honey: d.get("_honey") || "", _t: started, turnstile_token: token };
      btn.disabled = true; msg.textContent = "Sending...";
      fetch(API + "/v2/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (x) {
          if (!x.ok) { msg.textContent = (x.j && x.j.message) || "That didn't send. Try again in a minute, or use the quote form."; btn.disabled = false; return; }
          f.remove();
          say("Got it! A real person on our team will reach out within one business day. Anything else while you wait?");
        })
        .catch(function () { msg.textContent = "That didn't send. Try again in a minute, or use the quote form."; btn.disabled = false; });
    });
  }

  /* ---------------- human check (anonymous visitors, first model reply only) ---------------- */
  var tsLoad = null;
  function loadTurnstile() {
    tsLoad = tsLoad || new Promise(function (ok, bad) {
      var s = document.createElement("script");
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"; s.async = true;
      s.onload = function () { window.turnstile ? ok(window.turnstile) : bad(); };
      s.onerror = function () { tsLoad = null; bad(); };
      document.head.appendChild(s);
    });
    return tsLoad;
  }
  function humanCheck() {
    if (!TS_KEY) { say("I need a quick human check that isn't loading right now. Sign in to keep chatting, or browse the free tools.", [{ href: "/studio/", label: "Sign in" }, { href: "/creator-studio/", label: "Free tools" }]); return; }
    var box = el("div", "zg-check");
    box.appendChild(el("p", "", "Quick human check, then I'm all yours."));
    var slot = el("div", "");
    box.appendChild(slot);
    log.appendChild(box); log.scrollTop = log.scrollHeight;
    loadTurnstile().then(function (ts) {
      ts.render(slot, { sitekey: TS_KEY, theme: "dark", size: "flexible",
        callback: function (token) { box.remove(); post(token); },
        "error-callback": function () { box.remove(); say(SAFE, [{ href: "/producers/", label: "Talk to a producer" }, { href: "/support/", label: "Support" }]); } });
    }).catch(function () { box.remove(); say(SAFE, [{ href: "/producers/", label: "Talk to a producer" }, { href: "/support/", label: "Support" }]); });
  }

  /* ---------------- chat ---------------- */
  var spokenAsk = false;
  function send(text, byVoice) {
    spokenAsk = !!byVoice;
    text = String(text || "").trim().slice(0, 800);
    if (!text || busy) return;
    say(text, [], [], "you");
    history.push({ role: "user", text: text });
    if (!API) { say("I'm warming up. Meanwhile: the Test Drive is $5 for about two shots.", [{ href: "/pricing/", label: "Pricing" }]); return; }
    post("");
  }
  function post(token) {
    busy = true;
    form.querySelector(".zg-send").disabled = true;
    var typing = el("div", "zg-msg bot zg-typing", NAME + " is thinking...");
    log.appendChild(typing); log.scrollTop = log.scrollHeight;
    play("clap");
    var headers = { "Content-Type": "application/json" };
    if (window.MW_ID_TOKEN) headers.Authorization = "Bearer " + window.MW_ID_TOKEN;
    var body = { messages: history.slice(-6), page: location.pathname };
    var pass = session.get("mw_z_pass");
    if (pass) body.pass = pass;
    if (token) body.turnstile_token = token;
    var status = 0;
    fetch(API + "/v2/guide/chat", { method: "POST", headers: headers, body: JSON.stringify(body) })
      .then(function (r) { status = r.status; return r.json().catch(function () { return {}; }); })
      .then(function (j) {
        if (status === 403 && j.needs_check) {
          if (token) { say("That human check didn't go through. Sign in (free) to keep chatting.", [{ href: "/studio/", label: "Sign in free" }]); return; }
          humanCheck(); return;
        }
        if (j.pass) session.set("mw_z_pass", String(j.pass).slice(0, 64));
        var reply = j.reply || SAFE;
        history.push({ role: "assistant", text: reply });
        say(reply, j.links || []);
        if (j.offer_lead && j.lead_form) offerLead(j.lead_form);
        if (j.lead && j.lead.qualified) root.querySelector(".zg-live").hidden = false;   /* the server decides */
        if (spokenAsk || (VO && VO.canSpeak())) speak(reply, j.say);
        if (typeof j.messages_left === "number" && j.messages_left > 0 && j.messages_left <= 2) {
          note(j.messages_left + (j.messages_left === 1 ? " free message" : " free messages") + " left today." +
            (TIER === "anon" ? " A free account gets more." : ""));
        }
      })
      .catch(function () { say(SAFE, [{ href: "/pricing/", label: "Pricing" }, { href: "/support/", label: "Support" }]); })
      .then(function () {
        busy = false;
        form.querySelector(".zg-send").disabled = false;
        if (typing.parentNode) typing.parentNode.removeChild(typing);
      });
  }

  /* ---------------- first-visit tour ---------------- */
  var STEPS = [
    /* The site marks tour targets with data-tour="..."; missing targets are skipped. */
    { sel: "[data-tour='best-work']", optional: true, text: "Our best work: music videos made by our studio team." },
    { sel: "[data-tour='creator-studio'], a[href='/creator-studio/']", text: "Free tools: hook writer, script fitter, captions and more. No account needed." },
    { sel: "[data-tour='start'], a[href='/studio/']", text: "Make a video: the Studio shows the exact price before every render. Start with the $5 Test Drive." },
    { sel: "[data-tour='pricing'], a[href='/pricing/']", text: "Rather not do it yourself? Our team makes commercial spots from $2,500, with a written quote first." },
    { sel: ".zgl.is-stand .zgl-actor, .zgl-btn", text: "That's me. I'm always on set: click me any time and ask me anything." }
  ];
  var spot = el("div", "zg-spot"), tip = el("div", "zg-tip");
  tip.setAttribute("role", "dialog");
  tip.setAttribute("aria-label", "Site tour");
  function endTour() { spot.remove(); tip.remove(); store.set("mw_z_toured", "1"); }
  function tour(i) {
    if (i >= STEPS.length) { endTour(); open(); return; }
    close();
    var target = document.querySelector(STEPS[i].sel);
    var visible = target && target.getBoundingClientRect().width > 0;
    if (!visible && STEPS[i].optional) return tour(i + 1);
    if (visible) target.scrollIntoView({ block: "center", behavior: REDUCED ? "auto" : "smooth" });
    setTimeout(function () {
      /* Hidden target (e.g. nav inside the phone menu): show the tip on its own, centred low on screen. */
      var r = visible ? target.getBoundingClientRect() : { top: innerHeight - 200, bottom: innerHeight - 200, left: (innerWidth - 290) / 2, width: 0, height: 0 };
      spot.style.cssText = visible ? "top:" + (r.top - 6) + "px;left:" + (r.left - 6) + "px;width:" + (r.width + 12) + "px;height:" + (r.height + 12) + "px" : "display:none";
      tip.textContent = "";
      tip.appendChild(el("p", "", STEPS[i].text));
      var next = el("button", "zg-chip", i === STEPS.length - 1 ? "Done" : "Next"), skip = el("button", "zg-skip", "Skip tour");
      next.type = skip.type = "button";
      next.addEventListener("click", function () { tour(i + 1); });
      skip.addEventListener("click", function () { endTour(); if (launcher) launcher.focus(); });
      tip.appendChild(next); tip.appendChild(skip);
      var top = r.bottom + 14 + 140 > innerHeight ? Math.max(8, r.top - 150) : r.bottom + 14;
      tip.style.top = top + "px";
      tip.style.left = Math.min(Math.max(8, r.left), innerWidth - 300) + "px";
      document.body.appendChild(spot); document.body.appendChild(tip);
      next.focus();
    }, REDUCED ? 0 : 350);
  }

  /* ---------------- wiring ---------------- */
  root.querySelector(".zg-x").addEventListener("click", close);
  root.querySelector(".zg-mute").addEventListener("click", function () { if (VO) VO.set(!VO.on()); });
  syncPanelMute();
  form.addEventListener("submit", function (e) { e.preventDefault(); var v = input.value; input.value = ""; send(v); });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (tip.parentNode) { endTour(); if (launcher) launcher.focus(); return; }
    if (isOpen()) close();
  });
  if (!L) {   /* loaded on its own (no launcher): give it a plain button so it still works */
    launcher = el("button", "zg-solo", "Ask " + NAME);
    launcher.type = "button";
    launcher.setAttribute("aria-controls", "zg-panel"); launcher.setAttribute("aria-expanded", "false");
    launcher.addEventListener("click", toggle);
    document.body.appendChild(launcher);
    window.addEventListener("mw:guide-open", function (e) { open(e.detail && e.detail.topic, e.detail); });
    window.addEventListener("mw:guide-tour", function () { tour(0); });
  }

  window.MWZ = { open: open, close: close, toggle: toggle, tour: tour, scrub: scrub };
})();
