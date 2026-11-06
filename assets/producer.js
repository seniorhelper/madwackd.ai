/* Madwackd Studio - AI Producer panel.
   "AI video, directed. Priced before it rolls."
   Self-contained: needs the #mwp markup (producer-snippet.html), /assets/config.js (MW_CONFIG) and
   studio-live.js (which loads Firebase). Talks to /v2/producer/* with the same api(method, path, body)
   pattern as studio-live.js. The hire form also posts to the Eye To Ad Media lead server from the browser. */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var root = $("mwp");
  if (!root) return;
  var C = window.MW_CONFIG || {};
  var API = String(C.apiBase || "").trim().replace(/\/+$/, "");
  var TS_KEY = String(C.turnstileSiteKey || "").trim();
  var LEAD_URL = "https://clients.eyetoad.com/lead/send.php";
  var LEAD_SUBJECT = "Madwackd hire request";
  var user = null, convId = "", afterJob = "", lastPlan = null, busy = false, maxChars = 2000;
  var ts = {};   /* slotId -> {w: widget id, t: token} */

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function show(el, on) { if (typeof el === "string") el = $(el); if (el) el.hidden = !on; }
  function note(text, kind) { var n = $("mwp-note"); n.textContent = text || ""; n.className = "mwp-note" + (kind ? " " + kind : ""); n.hidden = !text; }
  function money(r) { return r && r.length ? (r[0] === r[1] ? "$" + r[0].toFixed(2) : "$" + r[0].toFixed(2) + "-$" + r[1].toFixed(2)) : ""; }

  function api(method, path, body) {
    var tokP = user ? user.getIdToken() : Promise.resolve("");
    return tokP.then(function (tok) {
      var h = { "Content-Type": "application/json" };
      if (tok) h.Authorization = "Bearer " + tok;
      return fetch(API + path, { method: method, headers: h, body: body ? JSON.stringify(body) : undefined });
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (r.status >= 400) { var e = new Error(j.message || ("Request failed (" + r.status + ")")); e.code = j.error; e.status = r.status; e.body = j; throw e; }
        return j;
      });
    });
  }

  /* ---------- states: off | signin | ready ---------- */
  function state(name) {
    ["mwp-off", "mwp-signin", "mwp-ready"].forEach(function (id) { show(id, id === "mwp-" + name); });
  }

  /* Wait for studio-live.js to start Firebase, then follow the same signed-in user. */
  function boot() {
    if (!API) return;
    fetch(API + "/v2/config").then(function (r) { return r.ok ? r.json() : {}; }).then(function (c) {
      if (!c || !c.features || !c.features.producer) return;          // stays hidden until the Producer is live
      var sec = document.getElementById("mwp"); if (sec) sec.hidden = false;
      bootLive();
    }).catch(function () {});
  }
  function bootLive() {
    var tries = 0;
    (function wait() {
      var fb = window.firebase;
      if (fb && fb.apps && fb.apps.length && fb.auth) {
        fb.auth().onAuthStateChanged(function (u) { user = u; if (!u) { state("signin"); return; } check(); });
        return;
      }
      if (++tries > 60) { state("off"); return; }   // about 15 seconds
      setTimeout(wait, 250);
    })();
  }

  function check() {
    api("GET", "/v2/me").then(function (m) {
      if (!m.signed_up) { state("signin"); return; }
      if (m.locked) { state("off"); $("mwp-off-why").textContent = "This account is paused for a safety review."; return; }
      state("ready");
      loadHistory();
    }).catch(function () { state("signin"); });
  }

  /* ---------- Turnstile (to open a conversation and to send a hire request, when a site key is set) ---------- */
  function ensureTurnstile(slot) {
    slot = slot || "mwp-ts";
    if (!TS_KEY || (slot === "mwp-ts" && convId)) { show(slot, false); return Promise.resolve(); }
    show(slot, true);
    var ready = window.turnstile ? Promise.resolve() : new Promise(function (res, rej) {
      var s = document.createElement("script");
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"; s.async = true; s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
    return ready.then(function () {
      if (ts[slot]) return;
      ts[slot] = { w: null, t: "" };
      ts[slot].w = window.turnstile.render($(slot), { sitekey: TS_KEY, callback: function (t) { ts[slot].t = t; }, "expired-callback": function () { ts[slot].t = ""; } });
    }).catch(function () { note("The human check couldn't load. Refresh the page and try again.", "bad"); });
  }
  function hasToken(slot) { return !!(ts[slot] && ts[slot].t); }
  function useToken(slot) {
    var x = ts[slot]; if (!x) return "";
    var t = x.t; x.t = "";
    if (window.turnstile && x.w !== null) { try { window.turnstile.reset(x.w); } catch (e) { /* ignore */ } }
    return t;
  }

  /* ---------- chat ---------- */
  function bubble(who, html) {
    var d = document.createElement("div");
    d.className = "mwp-msg mwp-" + who;
    d.innerHTML = html;
    $("mwp-log").appendChild(d);
    $("mwp-log").scrollTop = $("mwp-log").scrollHeight;
    return d;
  }

  function limits(l) {
    if (!l) return;
    maxChars = l.max_input_chars || maxChars;
    $("mwp-input").maxLength = maxChars;
    var left = l.messages_left;
    $("mwp-left").textContent = left + " of " + l.messages_per_day + " Producer messages left today";
    $("mwp-left").className = "mwp-left" + (left <= 5 ? " low" : "");
  }

  function send(ev) {
    if (ev) ev.preventDefault();
    if (busy) return;
    var text = $("mwp-input").value.trim();
    if (!text) { note("Tell the Producer your idea.", "bad"); return; }
    if (text.length > maxChars) { note("Keep it under " + maxChars + " characters.", "bad"); return; }
    if (TS_KEY && !convId && !hasToken("mwp-ts")) { ensureTurnstile(); note("Please finish the quick human check first.", "bad"); return; }
    note("");
    busy = true; $("mwp-send").disabled = true;
    bubble("user", esc(text));
    var wait = bubble("bot", '<span class="mwp-dots" aria-label="The Producer is thinking"><i></i><i></i><i></i></span>');
    var body = { message: text };
    if (convId) body.conversation_id = convId; else if (TS_KEY) body.turnstile_token = useToken("mwp-ts");
    if (afterJob) body.after_job_id = afterJob;
    api("POST", "/v2/producer/chat", body).then(function (r) {
      afterJob = "";
      convId = r.conversation_id || convId;
      show("mwp-ts", false);
      $("mwp-input").value = "";
      wait.innerHTML = esc(r.reply);
      if (r.plan) { lastPlan = r.plan; renderPlan(r.plan); }
      renderChoices(r.choices, r.upsell);
      limits(r.limits);
      if (r.usage) $("mwp-owner").textContent = "Owner: " + r.usage.input_tokens + " in / " + r.usage.output_tokens + " out tokens, about $" + r.usage.est_usd.toFixed(4) + " (today $" + r.usage.spent_today_usd.toFixed(2) + " of $" + r.usage.cap_usd + ")";
      loadHistory();
    }).catch(function (e) {
      wait.remove();
      var m = e.message || "Something went wrong.";
      if (e.code === "prompt_blocked") m = e.message + " Try describing an original character or scene instead.";
      if (e.status === 0 || !e.status) m = "Can't reach the studio right now. Check your connection and try again.";
      note(m, "bad");
      if (e.body && e.body.limits) limits(e.body.limits);
      if (e.code === "producer_daily_cap" || e.code === "producer_user_cap" || e.code === "producer_offline" || e.code === "producer_off") renderChoices(null, { highlight: "done_for_you", message: "Want it made for you instead? Our team can take it from here." });
      if (e.code === "not_found") convId = "";
      if (e.code === "bot_check_failed") { convId = ""; ensureTurnstile(); }
    }).then(function () { busy = false; $("mwp-send").disabled = false; });
  }

  /* ---------- plan card ---------- */
  function renderPlan(p) {
    var h = '<div class="mwp-plan-head"><h3>' + esc(p.title) + '</h3>' +
      '<p class="mwp-total"><b>' + esc(p.total_credits) + ' credits</b> &middot; ' + esc(money(p.price_usd_range)) + ' &middot; ' + esc(p.total_seconds) + 's</p></div>';
    if (p.logline) h += '<p class="mwp-logline">' + esc(p.logline) + '</p>';
    if (p.script) h += '<details class="mwp-script"><summary>Script and voiceover</summary><p>' + esc(p.script).replace(/\n/g, "<br>") + '</p></details>';
    h += '<ol class="mwp-shots">';
    p.shots.forEach(function (s, i) {
      h += '<li class="mwp-shot"><div class="mwp-shot-top"><span class="mwp-beat">' + esc(s.n) + '. ' + esc(s.beat) + '</span>' +
        '<span class="mwp-chip">' + esc(s.seconds) + 's &middot; ' + esc(s.aspect_ratio) + ' &middot; ' + (s.quality === "standard" ? "Top quality" : "Fast") + ' &middot; ' + esc(s.resolution) + '</span>' +
        '<span class="mwp-cost">' + esc(s.credits) + ' credits <small>' + esc(money(s.price_usd_range)) + '</small></span></div>' +
        '<p class="mwp-prompt">' + esc(s.prompt) + '</p>' +
        (s.note ? '<p class="mwp-warn">' + esc(s.note) + '</p>' : '') +
        '<button class="mwp-btn mwp-btn-ghost" type="button" data-shot="' + i + '">Render this shot</button></li>';
    });
    h += '</ol>';
    if (p.tips) h += '<p class="mwp-tip">' + esc(p.tips) + '</p>';
    h += '<p class="mwp-fine">' + (p.enough ? "You have " + esc(p.balance_credits) + " credits: enough for the whole plan." : "You have " + esc(p.balance_credits) + " credits. Add credits to render every shot.") +
      ' ' + esc(p.price_note) + '</p>';
    $("mwp-plan").innerHTML = h;
    show("mwp-plan", true);
  }

  /* Prefill the existing render form (studio-live.js) with one shot, then let the user get a quote there. */
  function prefill(s) {
    var set = function (id, v) { var el = $(id); if (el) el.value = v; };
    set("lv-prompt", s.prompt);
    set("lv-asp", s.aspect_ratio);
    set("lv-q", s.quality);
    set("lv-sec", String(s.seconds));
    set("lv-res", s.resolution);
    var a = $("lv-audio"); if (a) a.checked = s.generate_audio !== false;
    var neg = $("lv-neg"); if (neg) neg.value = s.negative_prompt || "";
    var form = $("lv-form");
    if (!form) { note("The render form isn't on this page.", "bad"); return; }
    form.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(function () { var q = $("lv-quote-btn"); if (q) q.focus(); }, 400);
  }
  $("mwp-plan").addEventListener("click", function (ev) {
    var b = ev.target.closest("[data-shot]");
    if (b && lastPlan) prefill(lastPlan.shots[Number(b.getAttribute("data-shot"))]);
  });

  /* ---------- the 3 choices + upsell ---------- */
  function renderChoices(choices, upsell) {
    choices = choices || window.__mwpChoices || [];
    window.__mwpChoices = choices;
    if (!choices.length) return;
    var hi = upsell && upsell.highlight;
    var h = upsell && upsell.message ? '<p class="mwp-upsell">' + esc(upsell.message) + '</p>' : '';
    h += '<div class="mwp-choices">';
    choices.forEach(function (c) {
      h += '<div class="mwp-choice' + (c.id === hi ? " hot" : "") + '"><h4>' + esc(c.label) + '</h4><p>' + esc(c.detail) + '</p>';
      if (c.price) h += '<p class="mwp-price">' + esc(c.price) + '</p>';
      if (c.packages) {
        h += '<ul class="mwp-pkgs">';
        c.packages.forEach(function (p) { h += '<li><button type="button" class="mwp-pkg" data-pkg="' + esc(p.item) + '">' + esc(p.name) + ' <b>$' + esc(p.usd) + (p.monthly ? "/mo" : "") + '</b></button></li>'; });
        h += '</ul>';
      }
      if (c.action === "render") h += '<button type="button" class="mwp-btn mwp-btn-ghost" data-diy>Render shot 1</button>';
      else if (c.package) h += '<button type="button" class="mwp-btn mwp-btn-ghost" data-pkg="' + esc(c.package) + '">Talk to a pro</button>';
      h += '</div>';
    });
    h += '</div>';
    $("mwp-choices").innerHTML = h;
    show("mwp-choices", true);
  }
  $("mwp-choices").addEventListener("click", function (ev) {
    var p = ev.target.closest("[data-pkg]");
    if (p) { openHire(p.getAttribute("data-pkg")); return; }
    if (ev.target.closest("[data-diy]")) { if (lastPlan) prefill(lastPlan.shots[0]); else $("mwp-input").focus(); }
  });

  /* ---------- hire form ---------- */
  function openHire(pkg) {
    var sel = $("mwp-h-package");
    if (pkg && sel.querySelector('option[value="' + pkg + '"]')) sel.value = pkg;
    if (lastPlan && !$("mwp-h-project").value) $("mwp-h-project").value = lastPlan.title + (lastPlan.logline ? ": " + lastPlan.logline : "");
    if (user && !$("mwp-h-email").value) $("mwp-h-email").value = user.email || "";
    show("mwp-hire", true); show("mwp-hire-done", false);
    ensureTurnstile("mwp-h-ts");
    $("mwp-hire").scrollIntoView({ behavior: "smooth", block: "center" });
    $("mwp-h-name").focus();
  }
  $("mwp-hire-cancel").addEventListener("click", function () { show("mwp-hire", false); });

  function postLead(fields) {
    /* The lead server checks the browser Origin (www.madwackd.ai), so this must run in the browser.
       URL-encoded body = a "simple" request; no-cors means we can't read the reply, so the API copy is the record. */
    var data = new URLSearchParams();
    Object.keys(fields).forEach(function (k) { data.append(k, fields[k] == null ? "" : String(fields[k])); });
    return fetch(LEAD_URL, { method: "POST", mode: "no-cors", body: data }).catch(function () { /* the API already stored it */ });
  }

  $("mwp-hire").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var f = {
      name: $("mwp-h-name").value.trim(), email: $("mwp-h-email").value.trim(), phone: $("mwp-h-phone").value.trim(),
      project: $("mwp-h-project").value.trim(), package: $("mwp-h-package").value, budget: $("mwp-h-budget").value,
      _honey: $("mwp-h-honey").value
    };
    if (f.name.length < 2 || !/^[^@\s]+@[^@\s]+\.[A-Za-z]{2,}$/.test(f.email) || f.project.length < 10) {
      $("mwp-hire-msg").textContent = "Please add your name, a valid email and a sentence about the project."; return;
    }
    if (TS_KEY && !hasToken("mwp-h-ts")) { ensureTurnstile("mwp-h-ts"); $("mwp-hire-msg").textContent = "Please finish the quick human check first."; return; }
    $("mwp-hire-go").disabled = true; $("mwp-hire-msg").textContent = "";
    var body = Object.assign({}, f, { plan_id: lastPlan ? lastPlan.id : "" });
    if (TS_KEY) body.turnstile_token = useToken("mwp-h-ts");
    api("POST", "/v2/producer/hire", body).then(function (r) {
      if (!f._honey) {
        var pkgName = $("mwp-h-package").selectedOptions[0].textContent;
        postLead({ name: f.name, email: f.email, phone: f.phone, package: pkgName, budget: f.budget,
          project: f.project + (lastPlan ? "\n\nProducer plan: " + lastPlan.title + " (" + lastPlan.total_credits + " credits, " + lastPlan.shots.length + " shots)" : "") + (r.lead_id ? "\nLead ID: " + r.lead_id : ""),
          _subject: (r.forward && r.forward.subject) || LEAD_SUBJECT, _honey: "" });
      }
      show("mwp-hire", false);
      $("mwp-hire-done").textContent = r.message || "Got it! We'll be in touch soon.";
      show("mwp-hire-done", true);
    }).catch(function (e) {
      $("mwp-hire-msg").textContent = e.code === "bot_check_failed" ? "Please finish the human check, then send again." : (e.message || "That didn't send. Call 1-800-481-8638.");
      if (e.code === "bot_check_failed") ensureTurnstile("mwp-h-ts");
    }).then(function () { $("mwp-hire-go").disabled = false; });
  });

  /* ---------- dashboard: your plans ---------- */
  function loadHistory() {
    api("GET", "/v2/producer/history").then(function (h) {
      limits(h.limits);
      if (!window.__mwpChoices) window.__mwpChoices = h.choices;
      if (h.producer && !h.producer.configured) { note("The AI Producer is switching on soon. You can still render shots below.", ""); }
      var list = $("mwp-history");
      if (!h.plans || !h.plans.length) { list.innerHTML = '<p class="mwp-fine">Your plans show up here.</p>'; return; }
      list.innerHTML = h.plans.map(function (p, i) {
        return '<button type="button" class="mwp-hist" data-plan="' + i + '"><b>' + esc(p.title) + '</b><span>' +
          esc((p.shots || []).length) + ' shots &middot; ' + esc(p.total_credits) + ' credits &middot; ' + esc(String(p.created_at || "").slice(0, 10)) + '</span></button>';
      }).join("");
      list.onclick = function (ev) {
        var b = ev.target.closest("[data-plan]"); if (!b) return;
        var p = h.plans[Number(b.getAttribute("data-plan"))];
        lastPlan = Object.assign({ balance_credits: 0, enough: false, price_note: "Re-quoted at today's prices before each render." }, p);
        convId = p.conversation_id || "";
        renderPlan(lastPlan); renderChoices(null, null);
        $("mwp-plan").scrollIntoView({ behavior: "smooth", block: "start" });
      };
    }).catch(function () { /* the chat still works */ });
  }

  $("mwp-form").addEventListener("submit", send);
  $("mwp-input").addEventListener("keydown", function (ev) { if (ev.key === "Enter" && (ev.metaKey || ev.ctrlKey)) send(ev); });
  $("mwp-input").addEventListener("focus", function () { ensureTurnstile(); }, { once: true });
  $("mwp-new").addEventListener("click", function () {
    convId = ""; lastPlan = null; afterJob = ""; $("mwp-log").innerHTML = ""; show("mwp-plan", false); show("mwp-choices", false); note(""); ensureTurnstile();
  });
  Array.prototype.forEach.call(root.querySelectorAll("[data-idea]"), function (b) {
    b.addEventListener("click", function () { $("mwp-input").value = b.getAttribute("data-idea"); $("mwp-input").focus(); });
  });

  /* Public hooks for studio-live.js (optional, see INTEGRATION.md). */
  window.MWProducer = {
    afterFailedJob: function (jobId) {
      afterJob = String(jobId || "");
      note("That render didn't finish. Ask the Producer for a safer rewrite, or let a pro make it.", "");
      renderChoices(null, { highlight: "done_for_you", message: "Rather have it handled? Madwackd can make it for you." });
    },
    lowCredits: function () { renderChoices(null, { highlight: "pro", message: "Low on credits? Top up, or let a pro make it with you." }); }
  };

  boot();
})();
