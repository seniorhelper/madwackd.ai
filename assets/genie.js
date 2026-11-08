/* Custom Creator Studio ("Genie") page: the poof-and-paint hero, the look tabs, and the Genie intake form.
   Plain JS, no libraries, no inline handlers (CSP script-src 'self').
   The intake posts to the network lead server (URL-encoded, no-cors, same as the other site forms), with a honeypot and a
   minimum fill time. The server checks the browser Origin, so this runs in the browser only. */
(function () {
  "use strict";
  var REDUCED = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var LOOKS = [
    { key: "music", dream: "a music channel that pays the rent", img: "/assets/img/genie/dash-nova.webp", paint: "/assets/img/genie/paint-a.webp", alt: "Sample creator dashboard for a music creator: brand header, this-month tiles and a revenue-by-week chart, all marked sample." },
    { key: "food", dream: "a cooking channel with a line out the door", img: "/assets/img/genie/dash-basil.webp", paint: "/assets/img/genie/paint-b.webp", alt: "Sample creator dashboard for a home-cooking creator in green, every number marked sample." },
    { key: "fitness", dream: "a fitness channel people actually finish", img: "/assets/img/genie/dash-kilo.webp", paint: "/assets/img/genie/paint-c.webp", alt: "Sample creator dashboard for a fitness creator in orange, every number marked sample." }
  ];

  /* ---------------- hero ---------------- */
  var hero = document.querySelector(".genie-hero");
  var frame = document.getElementById("stage-frame");
  if (hero && frame) {
    var bubble = frame.querySelector(".stage-bubble p");
    var poofer = frame.querySelector(".poofer");
    var poofWord = document.querySelector(".genie-line .poof");
    var imgs = frame.querySelectorAll(".stage-svg image");
    var tabs = document.querySelectorAll(".stage-tabs button");
    var cur = 0, timer = 0, typing = 0, rounds = 0, inView = false, manual = false;

    function setLook(i) {
      cur = i;
      hero.setAttribute("data-look", LOOKS[i].key);
      for (var k = 0; k < imgs.length; k++) {
        var src = imgs[k].classList.contains("paint") ? LOOKS[i].paint : LOOKS[i].img;
        imgs[k].setAttribute("href", src);
        imgs[k].setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", src);
      }
      frame.setAttribute("aria-label", LOOKS[i].alt);
      for (var t = 0; t < tabs.length; t++) tabs[t].setAttribute("aria-pressed", t === i ? "true" : "false");
      var nxt = new Image(); nxt.src = LOOKS[(i + 1) % LOOKS.length].img;   /* warm the next look */
      var nxp = new Image(); nxp.src = LOOKS[(i + 1) % LOOKS.length].paint;
    }
    function type(text, done) {
      var i = 0; bubble.textContent = "";
      var tn = document.createTextNode(""), cursor = document.createElement("span"); cursor.className = "cur";
      bubble.appendChild(tn); bubble.appendChild(cursor);
      (function step() {
        if (i <= text.length) { tn.nodeValue = text.slice(0, i); i += 2; typing = setTimeout(step, 56); }   /* two characters a step: half the layouts */
        else { done(); }
      })();
    }
    function poof() {
      poofer.classList.remove("go"); void poofer.offsetWidth; poofer.classList.add("go");
      if (poofWord) { poofWord.classList.remove("pop"); void poofWord.offsetWidth; poofWord.classList.add("pop"); }
    }
    /* scene 2: brush strokes paint the Tell Me Why frame over the gray storyboard */
    function paintScene(then) {
      frame.classList.remove("fade", "painted", "s2");
      frame.classList.add("s1");
      timer = setTimeout(then, 1900);
    }
    /* scene 3: a second pass of strokes paints the live dashboard over the painting */
    function paintDash(then) {
      frame.classList.add("s2");
      timer = setTimeout(function () { frame.classList.add("painted"); if (then) then(); }, 2000);
    }
    function showFinal(i) {   /* reduced motion or a tab click: no typing, no poof */
      clearTimeout(timer); clearTimeout(typing); timer = 0; typing = 0;
      setLook(i);
      frame.classList.remove("fade");
      frame.classList.add("s1", "s2", "painted");
    }
    function clearTimers() { clearTimeout(timer); clearTimeout(typing); timer = 0; typing = 0; }
    function cycle() {
      if (!active || manual) return;
      frame.classList.add("fade");
      frame.classList.remove("s1", "s2", "painted");
      setLook(cur);
      timer = setTimeout(function () {
        frame.classList.remove("fade");
        type("I dream of " + LOOKS[cur].dream + "…", function () {
          timer = setTimeout(function () {
            poof();
            timer = setTimeout(function () {
              paintScene(function () {
                poof();
                timer = setTimeout(function () {
                  paintDash(function () {
                    timer = setTimeout(function () {
                      cur = (cur + 1) % LOOKS.length;
                      if (cur === 0) rounds++;
                      if (rounds >= 2) { active = false; finished = true; cur = LOOKS.length - 1; setLook(cur); frame.classList.add("s1", "s2", "painted"); return; }
                      cycle();
                    }, 3200);
                  });
                }, 350);
              });
            }, 450);
          }, 500);
        });
      }, 420);
    }
    var active = false, finished = false;
    function start() { if (active || finished || manual) return; active = true; cycle(); }
    function stop() { if (!active) return; active = false; clearTimers(); }
    for (var t = 0; t < tabs.length; t++) {
      (function (idx) {
        tabs[idx].addEventListener("click", function () { manual = true; stop(); showFinal(idx); });
      })(t);
    }
    if (REDUCED) {
      showFinal(0);
    } else {
      setLook(0);
      bubble.textContent = "";
      setTimeout(function () { var w = new Image(); w.src = LOOKS[0].paint; }, 900);   /* the painted frame arrives before scene 2 needs it */
      document.addEventListener("visibilitychange", function () { if (document.hidden) stop(); else if (inView) start(); });
      /* Start only once the page is idle after load, so the sequence never competes with first paint or input. */
      var warm = false;
      function whenIdle(fn) {
        var go = function () { if ("requestIdleCallback" in window) requestIdleCallback(fn, { timeout: 2500 }); else setTimeout(fn, 1200); };
        if (document.readyState === "complete") setTimeout(go, 1600); else window.addEventListener("load", function () { setTimeout(go, 1600); });
      }
      whenIdle(function () {
        warm = true;
        if ("IntersectionObserver" in window) {
          new IntersectionObserver(function (en) {
            inView = en[0].isIntersecting;
            if (inView) start(); else stop();
          }, { threshold: .25 }).observe(frame);
        } else {
          start();
        }
      });
    }
  }

  /* ---------------- Producer Z buttons ---------------- */
  document.querySelectorAll("[data-ask-z]").forEach(function (b) {
    b.addEventListener("click", function () {
      window.dispatchEvent(new CustomEvent("mw:guide-open", { detail: { topic: "help", context: "custom-creator-studio" } }));
    });
  });

  /* ---------------- Genie: wish -> starter plan -> Start / Think about it ----------------
     The plan is built here, in the browser, from the visitor's own words. No model call, no video, no fake wait.
     Every item maps to something the studio does today (Included) or is wiring now (Rolling out). */
  var LEAD_URL = "https://clients.eyetoad.com/lead/send.php";
  var MIN_MS = 3000, shown = Date.now();
  var wishForm = document.getElementById("wish-form"), wishBox = document.getElementById("wish");
  var card = document.getElementById("genie"), planBody = document.getElementById("plan-body");
  var f = document.getElementById("genie-form"), done = document.getElementById("genie-done");
  var current = null;   /* {wish, items:[{t,w,s}], text} */

  function lget(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lset(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } }
  function setHidden(el, v) { if (el) el.hidden = !!v; }
  function has(t, re) { return re.test(t); }

  function buildPlan(wish) {
    var t = " " + wish.toLowerCase() + " ";
    var plats = [];
    if (has(t, /tiktok|tik tok/)) plats.push("TikTok");
    if (has(t, /youtube|shorts|yt\b/)) plats.push("YouTube and Shorts");
    if (has(t, /instagram|insta\b|\big\b|reels/)) plats.push("Instagram and Reels");
    if (has(t, /facebook|\bfb\b/)) plats.push("Facebook");
    if (has(t, /twitter|\bx\b|tweet/)) plats.push("X");
    if (has(t, /linkedin/)) plats.push("LinkedIn");
    if (has(t, /twitch|stream/)) plats.push("Twitch");
    if (has(t, /podcast|spotify|episode/)) plats.push("your podcast feed");
    var platText = plats.length ? plats.join(", ") : "TikTok, Reels and Shorts to start (tell us where you actually post)";
    var topic = has(t, /music|song|album|band|single|beat|rap|country|guitar|sing/) ? "your music" :
                has(t, /cook|recipe|bak|food|kitchen|restaurant|chef|meal/) ? "your cooking" :
                has(t, /fitness|workout|gym|train|yoga|run|coach/) ? "your training" :
                has(t, /podcast|interview|talk show/) ? "your show" :
                has(t, /comedy|sketch|funny|skit/) ? "your comedy" :
                has(t, /game|gaming|stream|twitch/) ? "your streams" :
                has(t, /real estate|realtor|listing|home/) ? "your listings and local market" :
                has(t, /church|faith|ministry|sermon/) ? "your ministry" :
                has(t, /business|shop|store|salon|contractor|service|client|customer/) ? "your business" : "what you make";
    var wantsIncome = has(t, /rent|money|income|revenue|sponsor|brand deal|monetiz|paid|pay the|profit|earn/);
    var wantsAudience = has(t, /fans|follower|subscriber|audience|grow|views|reach|blow up|viral/);
    var wantsClients = has(t, /client|customer|lead|book|appointment|local|hire me|inquir/);
    var wantsSales = has(t, /merch|sell|shop|store|course|product|tickets|album sales|buy/);
    var cadence = has(t, /daily|every day/) ? "a daily rhythm" : has(t, /every week|weekly|a week/) ? "a weekly rhythm" : has(t, /month/) ? "a monthly rhythm" : "a rhythm you can actually keep";
    var items = [
      { t: "Your brand on everything", w: "Your name, logo and colors on your dashboard, and on exports and end cards as your producer sets them up.", s: "Included" },
      { t: "A 30-day calendar for " + platText, w: "Drafted around " + cadence + ", with each post moving from idea to cut to exported to posted.", s: "Rolling out" },
      { t: "Hook, script and caption starters for " + topic, w: "Five openers and script starters from Creator Studio, plus caption templates inside each platform's limits.", s: "Included" },
      { t: "Cut once, export for " + platText, w: "One cut becomes the version each platform wants, from the studio board, with one-tap share from your phone.", s: "Included" },
      { t: "120 Fast render credits a month", w: "About five 8-second AI clips on the Founding plan, each priced before you confirm. Credit packs from $14 when you want more.", s: "Included" },
      { t: "Producer Z, with a voice", w: "Ask what to post next or what a shot costs; 3 Talking Z minutes a month on the Founding plan.", s: "Included" }
    ];
    if (wantsSales) items.push({ t: "A place to send buyers", w: "A storefront path for " + topic + ": allofus.one brand page today, and a World VR Mall storefront or landing page quoted separately when you want it.", s: "Included" });
    else if (wantsClients) items.push({ t: "Clients from your channel", w: "Your posts link to a page people and AI answers can read; free AI-search tools from Denver SEO, and done-for-you help quoted separately.", s: "Included" });
    else if (wantsAudience) items.push({ t: "A home for your audience", w: "An allofus.one brand page the algorithm can't take away, linked from every export.", s: "Included" });
    if (wantsIncome) items.push({ t: "Numbers you can trust", w: "Log or import views and revenue by source next to what you posted. Never sample data shown as yours.", s: "Rolling out" });
    items.push({ t: "One published press release and a Creator Spotlight", w: "A producer drafts the release from your words; you approve every line; we publish it on our distribution network and feature you on madwackd.ai.", s: "Included" });
    items.push({ t: "A human producer pass", w: "A real producer reviews this plan, your brand kit and your tone within one business day, then it counts.", s: "Included" });
    var text = items.map(function (it, i) { return (i + 1) + ". " + it.t + " [" + it.s + "]: " + it.w; }).join("\n");
    return { wish: wish, items: items, text: text };
  }

  function renderPlan(plan, scroll) {
    current = plan;
    document.getElementById("plan-wish").textContent = plan.wish.length > 220 ? plan.wish.slice(0, 217) + "\u2026" : plan.wish;
    var ol = document.getElementById("plan-list"); ol.textContent = "";
    plan.items.forEach(function (it, i) {
      var li = document.createElement("li"); li.style.animationDelay = (i * 60) + "ms";
      var d = document.createElement("div"); var b = document.createElement("b"); b.textContent = it.t;
      var w = document.createElement("span"); w.className = "what"; w.textContent = it.w; d.appendChild(b); d.appendChild(w);
      var st = document.createElement("span"); st.className = "state" + (it.s === "Included" ? "" : " soon"); st.textContent = it.s;
      li.appendChild(d); li.appendChild(st); ol.appendChild(li);
    });
    setHidden(card, false); setHidden(planBody, false); setHidden(f, true); setHidden(done, true);
    lset("mw_genie_plan", JSON.stringify({ wish: plan.wish, at: Date.now() }));
    if (scroll) { card.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth", block: "start" }); }
    var h = card.querySelector("h2"); if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
  }

  function note(el, msg, bad) { if (!el) return; el.textContent = msg; el.className = "notice genie-note" + (msg ? " show" : "") + (bad ? " bad" : ""); }

  if (wishForm && wishBox && card && f) {
    wishForm.querySelector('input[name="_loadtime"]').value = String(shown);
    wishForm.querySelector('input[name="_next"]').value = location.origin + location.pathname + "?sent=1#genie";
    f.querySelector('input[name="_loadtime"]').value = String(shown);
    f.querySelector('input[name="_next"]').value = location.origin + location.pathname + "?sent=1#genie";

    wishForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var wish = wishBox.value.trim();
      if (wish.length < 10) { note(document.getElementById("wish-note"), "Give Genie a sentence or two: what you make, where you post, what a great month looks like.", true); wishBox.focus(); return; }
      if (wishForm.querySelector('input[name="_honey"]').value) { return; }
      note(document.getElementById("wish-note"), "", false);
      renderPlan(buildPlan(wish), true);
      /* save the wish itself (no contact details yet) so no dream is lost if they leave before Start / Think */
      if (Date.now() - shown >= MIN_MS && !wishForm.getAttribute("data-sent")) {
        wishForm.setAttribute("data-sent", "1");
        var wb = new URLSearchParams(new FormData(wishForm)); wb.set("name", "Genie wish (no contact yet)"); wb.set("page", location.pathname);
        fetch(LEAD_URL, { method: "POST", mode: "no-cors", body: wb, credentials: "omit", referrerPolicy: "strict-origin-when-cross-origin" }).catch(function () { /* the Start / Think step sends it again */ });
      }
    });

    /* a saved plan from an earlier visit (this device only) */
    var saved = null; try { saved = JSON.parse(lget("mw_genie_plan") || "null"); } catch (e) { saved = null; }
    var openSaved = document.getElementById("saved-plan-open");
    if (saved && saved.wish && openSaved) {
      setHidden(document.getElementById("saved-plan-wrap"), false);
      openSaved.addEventListener("click", function () { wishBox.value = saved.wish; renderPlan(buildPlan(saved.wish), true); });
    }

    function openForm(mode) {
      if (!current) return;
      f.setAttribute("data-mode", mode);
      f.querySelector('input[name="intent"]').value = mode;
      f.querySelector('input[name="dream"]').value = current.wish;
      f.querySelector('input[name="plan"]').value = current.text.slice(0, 4000);
      f.querySelector('input[name="_subject"]').value = "Genie " + mode.toUpperCase() + ": Custom Creator Studio (madwackd.ai)";
      var plat = document.getElementById("g-platform"), nm = document.getElementById("g-name");
      plat.required = (mode === "start"); nm.required = (mode === "start");
      document.getElementById("form-lead").textContent = mode === "start"
        ? "Start: a producer gets your dream and this plan, and replies within one business day with your founding-rate checkout link. Nothing is charged now."
        : "Think about it: we keep this plan under your email, and nobody calls unless you ask.";
      document.getElementById("genie-submit").textContent = mode === "start" ? "Put me on the Founding Creator list" : "Keep my plan";
      setHidden(planBody, true); setHidden(f, false); setHidden(done, true);
      note(document.getElementById("genie-note"), "", false);
      document.getElementById(mode === "start" ? "g-name" : "g-email").focus();
    }
    document.getElementById("plan-start").addEventListener("click", function () { openForm("start"); });
    document.getElementById("plan-think").addEventListener("click", function () { openForm("think"); });
    document.getElementById("plan-redo").addEventListener("click", function () { setHidden(card, true); wishBox.focus(); wishBox.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth", block: "center" }); });
    document.getElementById("form-back").addEventListener("click", function () { setHidden(f, true); setHidden(planBody, false); });
    document.getElementById("done-reopen").addEventListener("click", function () { setHidden(done, true); setHidden(planBody, false); });

    function finish(mode, name, email) {
      setHidden(f, true); setHidden(planBody, true); setHidden(done, false);
      setHidden(document.getElementById("done-start"), mode !== "start");
      setHidden(document.getElementById("done-think"), mode !== "think");
      var first = name ? ", " + name.split(/\s+/)[0] : "";
      done.querySelectorAll(".done-name").forEach(function (el) { el.textContent = first; });
      done.querySelectorAll(".done-email").forEach(function (el) { el.textContent = email || "your email"; });
      if (email) lset("mw_genie_plan", JSON.stringify({ wish: current ? current.wish : "", email: email, intent: mode, at: Date.now() }));
      done.setAttribute("tabindex", "-1"); done.focus();
      card.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth", block: "start" });
    }
    if (/[?&]sent=1/.test(location.search)) { setHidden(card, false); finish("start", "", ""); }   /* no-JS fallback return */

    var busy = false;
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      if (busy || !current) return;
      var mode = f.getAttribute("data-mode") || "start";
      var fd = new FormData(f), gn = document.getElementById("genie-note");
      var name = String(fd.get("name") || "").trim(), email = String(fd.get("email") || "").trim();
      if (!/^[^@\s]+@[^@\s]+\.[A-Za-z]{2,}$/.test(email)) { note(gn, "Please add a valid email.", true); return; }
      if (mode === "start" && (name.length < 2 || !String(fd.get("platform") || ""))) { note(gn, "Please add your name and your main platform.", true); return; }
      if (Date.now() - shown < MIN_MS) { note(gn, "One moment, then try again.", true); return; }
      if (String(fd.get("_honey") || "")) { finish(mode, name, email); return; }   /* bots see success, nothing is sent */
      var body = new URLSearchParams();
      fd.forEach(function (v, k) { body.append(k, typeof v === "string" ? v.trim() : ""); });
      body.set("handle", String(fd.get("handle") || "").trim().replace(/^@+/, ""));
      body.set("page", location.pathname);
      var q = new URLSearchParams(location.search);
      body.set("utm_source", (q.get("utm_source") || "").slice(0, 30));
      body.set("utm_campaign", (q.get("utm_campaign") || "").slice(0, 40));
      busy = true; note(gn, "Sending to the studio\u2026", false);
      var btn = document.getElementById("genie-submit"); btn.disabled = true;
      /* The lead server replies without CORS headers for fetch, so the reply is opaque: a resolved promise means it was delivered. */
      fetch(LEAD_URL, { method: "POST", mode: "no-cors", body: body, credentials: "omit", referrerPolicy: "strict-origin-when-cross-origin" })
        .then(function () { busy = false; btn.disabled = false; note(gn, "", false); finish(mode, name, email); })
        .catch(function () { busy = false; btn.disabled = false; note(gn, "We couldn't reach the studio. Please try again, or call 1-800-481-8638.", true); });
    });
  }

  /* ---------------- example plan (same logic, sample wish, labeled as an example) ---------------- */
  var exList = document.getElementById("example-list");
  if (exList && typeof buildPlan === "function") {
    var exPlan = buildPlan("A home cooking channel on TikTok and YouTube Shorts, posting every week, that pays the rent and sells my recipe ebook.");
    exPlan.items.forEach(function (it) {
      var li = document.createElement("li");
      var d = document.createElement("div"); var b = document.createElement("b"); b.textContent = it.t;
      var w = document.createElement("span"); w.className = "what"; w.textContent = it.w; d.appendChild(b); d.appendChild(w);
      var st = document.createElement("span"); st.className = "state" + (it.s === "Included" ? "" : " soon"); st.textContent = it.s;
      li.style.animation = "none"; li.appendChild(d); li.appendChild(st); exList.appendChild(li);
    });
  }

  /* ---------------- Producer Z clay clip: loads and plays only when on screen ---------------- */
  var clay = document.querySelector(".z-clay");
  if (clay && !REDUCED && "IntersectionObserver" in window) {
    new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) {
        if (!clay.getAttribute("src")) { clay.setAttribute("src", clay.getAttribute("data-src")); clay.load(); }
        var p = clay.play(); if (p && p.catch) p.catch(function () { /* autoplay blocked: poster stays */ });
      } else if (!clay.paused) { clay.pause(); }
    }, { threshold: .3 }).observe(clay);
  }

  /* ---------------- gentle 3D tilt + parallax (desktop pointers only, transform only) ---------------- */
  var FINE = window.matchMedia && matchMedia("(pointer: fine)").matches;
  if (!REDUCED && FINE && hero && frame) {
    document.documentElement.classList.add("tilt-on");
    var rafId = 0, px = 0, py = 0, sy = 0;
    function apply() {
      rafId = 0;
      frame.style.transform = "perspective(1400px) rotateX(" + (-py * 4).toFixed(2) + "deg) rotateY(" + (px * 6).toFixed(2) + "deg) translate3d(0," + (sy * -0.04).toFixed(1) + "px,0)";
      if (clay) clay.style.transform = "translate3d(" + (px * 8).toFixed(1) + "px," + (py * 6).toFixed(1) + "px,0) rotate(" + (px * 2).toFixed(2) + "deg)";
    }
    function queue() { if (!rafId) rafId = requestAnimationFrame(apply); }
    hero.addEventListener("pointermove", function (e) {
      var r = hero.getBoundingClientRect();
      px = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width - .5) * 2));
      py = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height - .5) * 2));
      queue();
    }, { passive: true });
    hero.addEventListener("pointerleave", function () { px = 0; py = 0; queue(); });
    window.addEventListener("scroll", function () { sy = Math.min(window.scrollY, 600); queue(); }, { passive: true });
  }

  var y = document.getElementById("year");
  if (y) y.textContent = String(new Date().getFullYear());
})();
