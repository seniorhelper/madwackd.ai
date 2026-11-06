/* Madwackd Studio - Producer Z, the AI director (full half: chat panel, full-body character, tour, read-aloud).
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
    "/privacy/", "/refunds/", "/acceptable-use/", "/ai-disclosure/"];
  var FAMILY = ["https://www.eyetoad.com/", "https://www.searchconverts.com/", "https://doorhanger.ai/",
    "https://donkley.ai/", "https://winbuild.ai/", "https://www.madwackd.com/"];
  var SAFE = "Sorry, I couldn't answer that one well. Call 1-800-481-8638 and a producer will help.";

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

  /* Producer Z, full body: the madwackd logo come to life. Head = the logo's rainbow clapper (it claps when he
     talks), face = the two eyeball "a"s from the wordmark, body = a slate, plus rubber-hose arms and legs,
     sneakers and a megaphone. Plain SVG, same-origin, no images. */
  function character() {
    var COLORS = ["#FF2E93", "#FF8A00", "#FFD60A", "#7ED321", "#00B8F0", "#8B3DFF"], base = "", top = "", i, x;
    for (i = 0; i < 6; i++) {
      x = 29 + i * 12;
      base += '<polygon points="' + x + ',41 ' + (x + 6) + ',41 ' + (x + 2) + ',51 ' + (x - 4) + ',51" fill="' + COLORS[i] + '"/>';
      top += '<polygon points="' + x + ',29 ' + (x + 6) + ',29 ' + (x + 10) + ',38 ' + (x + 4) + ',38" fill="' + COLORS[5 - i] + '"/>';
    }
    function eye(cx, color, cls) {
      return '<g class="zc-eye ' + cls + '">' +
        '<rect x="' + (cx + 7) + '" y="61" width="6.5" height="22" rx="2.2" fill="' + color + '" stroke="#15121F" stroke-width="2.6"/>' +
        '<circle cx="' + cx + '" cy="72" r="11" fill="' + color + '" stroke="#15121F" stroke-width="2.8"/>' +
        '<circle cx="' + cx + '" cy="72" r="6.6" fill="#fff" stroke="#15121F" stroke-width="2.4"/>' +
        '<circle class="zc-pupil" cx="' + (cx + 0.8) + '" cy="72.8" r="3.3" fill="#15121F"/>' +
        '<circle cx="' + (cx - 1.6) + '" cy="70" r="1.1" fill="#fff" opacity=".9"/>' +
        '<ellipse class="zc-lid" cx="' + cx + '" cy="72" rx="7.6" ry="7.6" fill="' + color + '"/></g>';
    }
    return '<svg class="zc" viewBox="0 0 120 150" aria-hidden="true" focusable="false">' +
      '<ellipse class="zc-shadow" cx="60" cy="145" rx="32" ry="4.5" fill="#000" opacity=".35"/>' +
      '<g class="zc-bob">' +
      /* legs + sneakers */
      '<g class="zc-legL"><path d="M47 110q-3 14-7 25" fill="none" stroke="#15121F" stroke-width="5.5" stroke-linecap="round"/>' +
      '<path d="M27 141q0-10 11-10 10 0 12 7v3z" fill="#FF2E93" stroke="#15121F" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<path d="M27 141.5h23" stroke="#fff" stroke-width="3" stroke-linecap="round"/><path d="M36 133l5 2M34 136l5 2" stroke="#7ED321" stroke-width="1.6"/></g>' +
      '<g class="zc-legR"><path d="M73 110q3 14 7 25" fill="none" stroke="#15121F" stroke-width="5.5" stroke-linecap="round"/>' +
      '<path d="M93 141q0-10-11-10-10 0-12 7v3z" fill="#00B8F0" stroke="#15121F" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<path d="M70 141.5h23" stroke="#fff" stroke-width="3" stroke-linecap="round"/><path d="M84 133l-5 2M86 136l-5 2" stroke="#FFD60A" stroke-width="1.6"/></g>' +
      /* arms: left waves, right holds the megaphone */
      '<g class="zc-armL"><path d="M24 80q-13-1-15-18" fill="none" stroke="#15121F" stroke-width="5" stroke-linecap="round"/>' +
      '<circle cx="9" cy="58" r="6.5" fill="#fff" stroke="#15121F" stroke-width="2.5"/><path d="M5 55.5h4" stroke="#15121F" stroke-width="1.4" stroke-linecap="round"/></g>' +
      '<g class="zc-armR"><path d="M96 82q13 3 14 15" fill="none" stroke="#15121F" stroke-width="5" stroke-linecap="round"/>' +
      '<path d="M104 92l13-9v24l-13-6z" fill="#FFD60A" stroke="#15121F" stroke-width="2.4" stroke-linejoin="round"/>' +
      '<ellipse cx="117" cy="95" rx="2.2" ry="12" fill="#FF8A00" stroke="#15121F" stroke-width="2"/>' +
      '<circle cx="109" cy="99" r="6.5" fill="#fff" stroke="#15121F" stroke-width="2.5"/></g>' +
      /* body: the slate */
      '<rect x="22" y="50" width="76" height="62" rx="7" fill="#15121F"/>' +
      '<rect x="26.5" y="54" width="67" height="54" rx="4" fill="#2A2440"/>' +
      '<path d="M31 98h58M60 98v7" stroke="#F4F0FA" stroke-opacity=".45" stroke-width="1.2"/>' +
      '<text x="33" y="106" font-family="Inter,system-ui,sans-serif" font-size="6.5" font-weight="700" fill="#F4F0FA" fill-opacity=".6">SCENE 1</text>' +
      '<text x="64" y="106" font-family="Inter,system-ui,sans-serif" font-size="6.5" font-weight="700" fill="#F4F0FA" fill-opacity=".6">TAKE Z</text>' +
      eye(43, "#FF8A00", "l") + eye(71, "#00B8F0", "r") +
      '<path class="zc-smile" d="M51 88q9 7 18 0" fill="none" stroke="#FF2E93" stroke-width="3" stroke-linecap="round"/>' +
      '<ellipse class="zc-open" cx="60" cy="89.5" rx="6.5" ry="4.2" fill="#0B0A10" stroke="#FF2E93" stroke-width="2.2"/>' +
      /* head: the logo's clapper. Base bar is fixed; the top stick hinges at the left and claps. */
      '<rect x="22" y="40" width="76" height="12" rx="3" fill="#fff" stroke="#15121F" stroke-width="2.6"/>' + base +
      '<g class="zc-clap"><rect x="22" y="28" width="76" height="11" rx="3" fill="#fff" stroke="#15121F" stroke-width="2.6"/>' + top + '</g>' +
      '<circle cx="23.5" cy="39.5" r="2.4" fill="#FFD60A" stroke="#15121F" stroke-width="1.6"/>' +
      "</g></svg>";
  }

  if (typeof document === "undefined") { module.exports = { scrub: scrub, safeLink: safeLink, character: character }; return; }

  var C = window.MW_CONFIG || {};
  var API = String(C.apiBase || "").trim().replace(/\/+$/, "");
  var TS_KEY = String(C.turnstileSiteKey || "").trim();
  var TIER = String(window.MW_USER_TIER || "anon");
  var REDUCED = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var L = window.__mwzLauncher || null;
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
    '<header class="zg-stage"><div class="zg-actor">' + character() + '</div>' +
    '<div class="zg-name"><strong id="zg-title">Producer Z</strong><small>Your AI director</small></div>' +
    '<button class="zg-x" type="button" aria-label="Close Producer Z">&times;</button></header>' +
    '<div class="zg-log" role="log" aria-live="polite" aria-relevant="additions"></div>' +
    '<div class="zg-quick"></div>' +
    '<form class="zg-form"><label class="zg-sr" for="zg-in">Ask Producer Z</label>' +
    '<input id="zg-in" maxlength="800" autocomplete="off" placeholder="Ask about prices, tools, your video...">' +
    '<button class="zg-send" type="submit">Send</button></form>' +
    '<p class="zg-fine">Producer Z is an AI guide and can make mistakes. Prices on /pricing/ are final. Don\'t share card or personal details here.</p>' +
    "</section>";
  (L ? L.root : document.body).appendChild(root);

  var panel = root.querySelector(".zg-panel"), log = root.querySelector(".zg-log"), quick = root.querySelector(".zg-quick"),
    form = root.querySelector(".zg-form"), input = root.querySelector("#zg-in"), actor = root.querySelector(".zg-actor");
  var launcher = L ? L.button : null;

  function isOpen() { return !panel.hidden; }
  function open(topic) {
    if (L) L.hideBubble(false);
    if (!isOpen()) {
      panel.hidden = false;
      if (L) L.root.classList.add("is-open");
      if (launcher) { launcher.setAttribute("aria-expanded", "true"); launcher.setAttribute("aria-label", "Close Producer Z"); }
      actor.classList.remove("is-in"); void actor.offsetWidth; actor.classList.add("is-in");
      wave();
      document.addEventListener("pointermove", look, { passive: true });
    }
    if (!log.childNodes.length) say("Hi, I'm Producer Z, your AI director. I know this whole site, and I'm here to get your video made. Want a 30-second tour, or tell me what you're making?",
      [], ["Take the tour", "What does it cost?", "Make it for me"]);
    if (topic === "dashboard") say("This is your Creator Dashboard: Mix, Sounds, Video and Voices. Want a one-click start, or help with your edit?");
    input.focus();
  }
  function close() {
    if (!isOpen()) return;
    panel.hidden = true;
    if (L) L.root.classList.remove("is-open");
    if (launcher) { launcher.setAttribute("aria-expanded", "false"); launcher.setAttribute("aria-label", "Ask Producer Z, the AI director"); launcher.focus(); }
    document.removeEventListener("pointermove", look);
  }
  function toggle() { isOpen() ? close() : open(); }

  /* ---------------- the character: eyes follow the pointer, clapper talks ---------------- */
  var eyes = [].slice.call(root.querySelectorAll(".zc-eye")), raf = 0, px = 0, py = 0;
  function look(e) {
    if (REDUCED) return;
    px = e.clientX; py = e.clientY;
    if (raf) return;
    raf = requestAnimationFrame(function () {
      raf = 0;
      eyes.forEach(function (g) {
        var r = g.getBoundingClientRect(), dx = px - (r.left + r.width / 2), dy = py - (r.top + r.height / 2);
        var d = Math.sqrt(dx * dx + dy * dy) || 1, m = Math.min(2.6, d / 40);
        g.querySelector(".zc-pupil").setAttribute("transform", "translate(" + (dx / d * m).toFixed(2) + " " + (dy / d * m).toFixed(2) + ")");
      });
    });
  }
  var talkTimer = 0;
  function talk(ms) {
    if (REDUCED) return;
    actor.classList.add("is-talking");
    clearTimeout(talkTimer);
    talkTimer = setTimeout(function () { actor.classList.remove("is-talking"); }, Math.min(3200, Math.max(700, ms)));
  }
  function wave() {
    if (REDUCED) return;
    actor.classList.remove("is-waving"); void actor.offsetWidth; actor.classList.add("is-waving");
  }

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
      sp.addEventListener("click", function () { speak(row.firstChild.textContent); });
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

  /* ---------------- voice: browser speech for everyone (free); studio voice for paid tiers ---------------- */
  function speak(text) {
    if (["pro", "studio", "business", "agency", "whitelabel"].indexOf(TIER) > -1 && API && window.MW_ID_TOKEN) {
      fetch(API + "/v2/guide/voice", { method: "POST", headers: { "Content-Type": "application/json",
        Authorization: "Bearer " + window.MW_ID_TOKEN }, body: JSON.stringify({ text: text }) })
        .then(function (r) { if (!r.ok) throw 0; return r.blob(); })
        .then(function (b) { var a = new Audio(URL.createObjectURL(b)); a.play(); talk(text.length * 55); })
        .catch(function () { browserSpeak(text); });
      return;
    }
    browserSpeak(text);
  }
  function browserSpeak(text) {
    try { speechSynthesis.cancel(); var u = new SpeechSynthesisUtterance(text); u.rate = 1.03; speechSynthesis.speak(u); talk(text.length * 55); } catch (e) { /* no speech */ }
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
    if (!TS_KEY) { say("I need a quick human check that isn't loading right now. Sign in to keep chatting, or call 1-800-481-8638.", [{ href: "/studio/", label: "Sign in" }]); return; }
    var box = el("div", "zg-check");
    box.appendChild(el("p", "", "Quick human check, then I'm all yours."));
    var slot = el("div", "");
    box.appendChild(slot);
    log.appendChild(box); log.scrollTop = log.scrollHeight;
    loadTurnstile().then(function (ts) {
      ts.render(slot, { sitekey: TS_KEY, theme: "dark", size: "flexible",
        callback: function (token) { box.remove(); post(token); },
        "error-callback": function () { box.remove(); say(SAFE, [{ href: "/producers/", label: "Talk to a producer" }]); } });
    }).catch(function () { box.remove(); say(SAFE, [{ href: "/producers/", label: "Talk to a producer" }]); });
  }

  /* ---------------- chat ---------------- */
  function send(text) {
    text = String(text || "").trim().slice(0, 800);
    if (!text || busy) return;
    say(text, [], [], "you");
    history.push({ role: "user", text: text });
    if (!API) { say("I'm warming up. Meanwhile: Test Drive is $5 for about two shots, or call 1-800-481-8638.", [{ href: "/pricing/", label: "Pricing" }]); return; }
    post("");
  }
  function post(token) {
    busy = true;
    form.querySelector(".zg-send").disabled = true;
    var typing = el("div", "zg-msg bot zg-typing", "Producer Z is thinking...");
    log.appendChild(typing); log.scrollTop = log.scrollHeight;
    actor.classList.add("is-thinking");
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
        if (status === 403 && j.needs_check) { humanCheck(); return; }
        if (j.pass) session.set("mw_z_pass", String(j.pass).slice(0, 64));
        var reply = j.reply || SAFE;
        history.push({ role: "assistant", text: reply });
        say(reply, j.links || []);
        if (typeof j.messages_left === "number" && j.messages_left > 0 && j.messages_left <= 2) {
          note(j.messages_left + (j.messages_left === 1 ? " free message" : " free messages") + " left today." +
            (TIER === "anon" ? " A free account gets more." : ""));
        }
      })
      .catch(function () { say(SAFE, [{ href: "/pricing/", label: "Pricing" }]); })
      .then(function () {
        busy = false;
        form.querySelector(".zg-send").disabled = false;
        actor.classList.remove("is-thinking");
        if (typing.parentNode) typing.parentNode.removeChild(typing);
      });
  }

  /* ---------------- first-visit tour ---------------- */
  var STEPS = [
    /* The site marks tour targets with data-tour="..."; missing targets are skipped. */
    { sel: "[data-tour='best-work']", optional: true, text: "Our best work: music videos made by our studio team." },
    { sel: "[data-tour='creator-studio'], a[href='/creator-studio/']", text: "Free tools: hook writer, script fitter, captions and more. No account needed." },
    { sel: "[data-tour='start'], a[href='/studio/']", text: "Make a video: the Studio shows the exact price before every render. Start with the $5 Test Drive." },
    { sel: "[data-tour='pricing'], a[href='/pricing/']", text: "Rather not do it yourself? Our team makes commercial spots from $2,500, quoted on a free call: 1-800-481-8638." },
    { sel: ".zgl-btn", text: "That's me, in the spotlight. Click any time and ask me anything." }
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
  form.addEventListener("submit", function (e) { e.preventDefault(); var v = input.value; input.value = ""; send(v); });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (tip.parentNode) { endTour(); if (launcher) launcher.focus(); return; }
    if (isOpen()) close();
  });
  if (!L) {   /* loaded on its own (no launcher): give it a plain button so it still works */
    launcher = el("button", "zg-solo", "Ask Producer Z");
    launcher.type = "button";
    launcher.setAttribute("aria-controls", "zg-panel"); launcher.setAttribute("aria-expanded", "false");
    launcher.addEventListener("click", toggle);
    document.body.appendChild(launcher);
    window.addEventListener("mw:guide-open", function (e) { open(e.detail && e.detail.topic); });
    window.addEventListener("mw:guide-tour", function () { tour(0); });
  }

  window.MWZ = { open: open, close: close, toggle: toggle, tour: tour, scrub: scrub };
})();
