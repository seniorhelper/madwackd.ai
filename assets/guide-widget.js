/* Madwackd Studio - Producer Z, the producer guide. Chat panel, first-visit tour, read-aloud.
   Plain JS, no inline handlers (CSP script-src 'self'). Needs /assets/config.js (MW_CONFIG.apiBase).
   Renders replies with textContent only. Links are rebuilt from an allowlist. */
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
  if (typeof document === "undefined") { module.exports = { scrub: scrub, safeLink: safeLink }; return; }

  var C = window.MW_CONFIG || {};
  var API = String(C.apiBase || "").trim().replace(/\/+$/, "");
  var TIER = String(window.MW_USER_TIER || "anon");
  var history = [];
  var busy = false;
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } }
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
    '<button class="zg-fab" type="button" aria-expanded="false" aria-controls="zg-panel">' +
    '<span class="zg-face" aria-hidden="true"></span><span class="zg-fab-t">Ask Producer Z</span></button>' +
    '<section class="zg-panel" id="zg-panel" role="dialog" aria-label="Producer Z, your AI director" hidden>' +
    '<header class="zg-head"><span class="zg-face" aria-hidden="true"></span>' +
    '<div><strong>Producer Z</strong><small>Your AI director</small></div>' +
    '<button class="zg-x" type="button" aria-label="Close">&times;</button></header>' +
    '<div class="zg-log" aria-live="polite"></div>' +
    '<div class="zg-quick"></div>' +
    '<form class="zg-form"><label class="sr-only" for="zg-in">Ask Producer Z</label>' +
    '<input id="zg-in" maxlength="800" autocomplete="off" placeholder="Ask about prices, tools, your video...">' +
    '<button class="zg-send" type="submit">Send</button></form>' +
    '<p class="zg-fine">Producer Z is an AI guide and can make mistakes. Prices on /pricing/ are final. Don\'t share card or personal details here.</p>' +
    "</section>";
  document.body.appendChild(root);

  var fab = root.querySelector(".zg-fab"), panel = root.querySelector(".zg-panel"),
    log = root.querySelector(".zg-log"), quick = root.querySelector(".zg-quick"),
    form = root.querySelector(".zg-form"), input = root.querySelector("#zg-in");

  function open(topic) {
    panel.hidden = false;
    fab.setAttribute("aria-expanded", "true");
    if (!log.childNodes.length) say("Hi, I'm Producer Z, your AI director. I know this whole site, and I'm here to get your video made. Want a 30-second tour, or tell me what you're making?",
      [], ["Take the tour", "What does it cost?", "Make it for me"]);
    if (topic === "dashboard") say("This is your Creator Dashboard: Mix, Sounds, Video and Voices. Want a one-click start, or help with your edit?");
    input.focus();
  }
  function close() { panel.hidden = true; fab.setAttribute("aria-expanded", "false"); fab.focus(); }

  function say(text, links, chips, who) {
    var row = el("div", "zg-msg " + (who || "bot"));
    row.appendChild(el("p", "", who === "you" ? text : scrub(text)));
    (links || []).forEach(function (l) {
      if (!safeLink(l.href)) return;
      var a = el("a", "zg-btn", l.label);
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
  }

  /* ---------------- voice: browser speech for everyone (free); studio voice for paid tiers ---------------- */
  function speak(text) {
    if (["pro", "studio", "business", "agency", "whitelabel"].indexOf(TIER) > -1 && API && window.MW_ID_TOKEN) {
      fetch(API + "/v2/guide/voice", { method: "POST", headers: { "Content-Type": "application/json",
        Authorization: "Bearer " + window.MW_ID_TOKEN }, body: JSON.stringify({ text: text }) })
        .then(function (r) { if (!r.ok) throw 0; return r.blob(); })
        .then(function (b) { var a = new Audio(URL.createObjectURL(b)); a.play(); })
        .catch(function () { browserSpeak(text); });
      return;
    }
    browserSpeak(text);
  }
  function browserSpeak(text) {
    try { speechSynthesis.cancel(); var u = new SpeechSynthesisUtterance(text); u.rate = 1.03; speechSynthesis.speak(u); } catch (e) { /* no speech */ }
  }

  /* ---------------- chat ---------------- */
  function send(text) {
    text = String(text || "").trim().slice(0, 800);
    if (!text || busy) return;
    say(text, [], [], "you");
    history.push({ role: "user", text: text });
    if (!API) { say("I'm warming up. Meanwhile: Test Drive is $5 for about two shots, or call 1-800-481-8638.", [{ href: "/pricing/", label: "Pricing" }]); return; }
    busy = true;
    var typing = el("div", "zg-msg bot zg-typing", "Producer Z is thinking...");
    log.appendChild(typing);
    var headers = { "Content-Type": "application/json" };
    if (window.MW_ID_TOKEN) headers.Authorization = "Bearer " + window.MW_ID_TOKEN;
    fetch(API + "/v2/guide/chat", { method: "POST", headers: headers,
      body: JSON.stringify({ messages: history.slice(-8), page: location.pathname }) })
      .then(function (r) { return r.json().catch(function () { return {}; }); })
      .then(function (j) {
        var reply = j.reply || SAFE;
        history.push({ role: "assistant", text: reply });
        say(reply, j.links || []);
      })
      .catch(function () { say(SAFE, [{ href: "/pricing/", label: "Pricing" }]); })
      .then(function () { busy = false; if (typing.parentNode) typing.parentNode.removeChild(typing); });
  }

  /* ---------------- first-visit tour ---------------- */
  var STEPS = [
    /* The site marks tour targets with data-tour="..." (see INTEGRATION.md); missing targets are skipped. */
    { sel: "[data-tour='best-work']", optional: true, text: "Our best work: music videos made by our studio team." },
    { sel: "[data-tour='creator-studio'], a[href='/creator-studio/']", text: "Free tools: hook writer, script fitter, captions and more. No account needed." },
    { sel: "[data-tour='start'], a[href='/studio/']", text: "Make a video: the Studio shows the exact price before every render. Start with the $5 Test Drive." },
    { sel: "[data-tour='pricing'], a[href='/pricing/']", text: "Rather not do it yourself? Done-for-you starts at $149, or call 1-800-481-8638." },
    { sel: ".zg-fab", text: "I'm always right here. Ask me anything." }
  ];
  var spot = el("div", "zg-spot"), tip = el("div", "zg-tip");
  tip.setAttribute("role", "status");
  function endTour() { spot.remove(); tip.remove(); store.set("mw_z_toured", "1"); }
  function tour(i) {
    if (i >= STEPS.length) { endTour(); open(); return; }
    close();
    var target = document.querySelector(STEPS[i].sel);
    var visible = target && target.getBoundingClientRect().width > 0;
    if (!visible && STEPS[i].optional) return tour(i + 1);
    if (visible) target.scrollIntoView({ block: "center", behavior: "smooth" });
    setTimeout(function () {
      /* Hidden target (e.g. nav inside the phone menu): show the tip on its own, centred low on screen. */
      var r = visible ? target.getBoundingClientRect() : { top: innerHeight - 200, bottom: innerHeight - 200, left: (innerWidth - 290) / 2, width: 0, height: 0 };
      spot.style.cssText = visible ? "top:" + (r.top - 6) + "px;left:" + (r.left - 6) + "px;width:" + (r.width + 12) + "px;height:" + (r.height + 12) + "px" : "display:none";
      tip.textContent = "";
      tip.appendChild(el("p", "", STEPS[i].text));
      var next = el("button", "zg-chip", i === STEPS.length - 1 ? "Done" : "Next"), skip = el("button", "zg-skip", "Skip tour");
      next.type = skip.type = "button";
      next.addEventListener("click", function () { tour(i + 1); });
      skip.addEventListener("click", endTour);
      tip.appendChild(next); tip.appendChild(skip);
      var top = r.bottom + 14 + 140 > innerHeight ? Math.max(8, r.top - 150) : r.bottom + 14;
      tip.style.top = top + "px";
      tip.style.left = Math.min(Math.max(8, r.left), innerWidth - 300) + "px";
      document.body.appendChild(spot); document.body.appendChild(tip);
      next.focus();
    }, 350);
  }

  /* ---------------- wiring ---------------- */
  fab.addEventListener("click", function () { panel.hidden ? open() : close(); });
  root.querySelector(".zg-x").addEventListener("click", close);
  form.addEventListener("submit", function (e) { e.preventDefault(); var v = input.value; input.value = ""; send(v); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !panel.hidden) close(); });
  window.addEventListener("mw:guide-open", function (e) { open(e.detail && e.detail.topic); });
  window.addEventListener("mw:guide-tour", function () { tour(0); });

  /* Offer the tour once, gently, on a first visit (not on the studio app or dashboard). */
  if (!store.get("mw_z_toured") && !/^\/(studio|studio-board|dashboard)\//.test(location.pathname)) {
    setTimeout(function () { if (panel.hidden && !document.querySelector("dialog[open]")) open(); }, 4000);
  }

  if (typeof module !== "undefined") module.exports = { scrub: scrub, safeLink: safeLink };
  window.MWZ = { open: open, tour: tour, scrub: scrub };
})();
