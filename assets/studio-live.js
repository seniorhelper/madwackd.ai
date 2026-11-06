/* Madwackd Studio v2.0 - Live render panel.
   Signs in with Firebase (Google or email link), talks to the v2 API, and falls back to the demo
   workspace whenever the API isn't configured, can't be reached, or you're signed out.
   Config comes from /assets/config.js (public values only). */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var C = window.MW_CONFIG || {};
  var API = String(C.apiBase || "").trim().replace(/\/+$/, "");
  var FB = C.firebase || {};
  var TS_KEY = String(C.turnstileSiteKey || "").trim();
  var FB_VER = "10.12.2";
  var auth = null, user = null, me = null, cfg = null, quote = null, pollTimer = null, tsWidget = null, tsToken = "";

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k) || ""; if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return ""; } }
  function show(id, on) { var el = $(id); if (el) el.hidden = !on; }
  function msg(text, kind) { var m = $("lv-msg"); m.textContent = text || ""; m.className = "lv-msg" + (kind ? " " + kind : ""); m.hidden = !text; }
  function state(name) {
    ["lv-off", "lv-signin", "lv-wait", "lv-signup", "lv-ready"].forEach(function (id) { show(id, id === name); });
    var badge = $("lv-badge");
    badge.textContent = name === "lv-ready" ? "Live" : "Demo";
    badge.className = "mode" + (name === "lv-ready" ? " live" : "");
  }
  function loadScript(src) {
    return new Promise(function (res, rej) { var s = document.createElement("script"); s.src = src; s.async = true; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
  }
  function timeout(ms, p) { return Promise.race([p, new Promise(function (_, rej) { setTimeout(function () { rej(new Error("timeout")); }, ms); })]); }

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

  /* ---------- boot ---------- */
  function boot() {
    if (!API || !FB.apiKey || !FB.projectId) { state("lv-off"); $("lv-off-why").textContent = "Live rendering isn't connected on this site yet."; return; }
    timeout(5000, fetch(API + "/v2/config").then(function (r) { if (!r.ok) throw new Error("bad"); return r.json(); }))
      .then(function (c) { cfg = c; return loadFirebase(); })
      .catch(function () { state("lv-off"); $("lv-off-why").textContent = "The studio server can't be reached right now."; });
  }

  function loadFirebase() {
    var base = "https://www.gstatic.com/firebasejs/" + FB_VER + "/";
    return loadScript(base + "firebase-app-compat.js").then(function () { return loadScript(base + "firebase-auth-compat.js"); }).then(function () {
      window.firebase.initializeApp(FB);
      auth = window.firebase.auth();
      if (auth.isSignInWithEmailLink(location.href)) {
        var em = store("mw_email_for_link");
        if (em) {
          auth.signInWithEmailLink(em, location.href).then(function () { store("mw_email_for_link", null); history.replaceState(null, "", location.pathname); }).catch(function (e) { msg(e.message, "bad"); });
        } else { msg("Type your email again and press Email me a link to finish signing in.", ""); }
      }
      auth.onAuthStateChanged(function (u) { user = u; if (!u) { state("lv-signin"); return; } refreshMe(); });
    });
  }

  function refreshMe() {
    return api("GET", "/v2/me").then(function (m) {
      me = m;
      if (!m.signed_up) { state("lv-signup"); renderTurnstile("lv-ts-signup"); return; }
      state("lv-ready"); paintMe(); loadJobs(); checkoutReturn();
    }).catch(function (e) {
      if (e.code === "waitlist") { state("lv-wait"); $("lv-wait-msg").textContent = e.message; return; }
      if (e.code === "signed_out" || e.code === "bad_token") { state("lv-signin"); return; }
      state("lv-off"); $("lv-off-why").textContent = e.message;
    });
  }

  function paintMe() {
    $("lv-who").textContent = me.email;
    $("lv-bal").textContent = me.balance_credits;
    show("lv-owner", !!me.owner);
    show("lv-locked", !!me.locked);
    var buy = $("lv-buy");
    buy.innerHTML = "";
    if (cfg && cfg.stripe_enabled) {
      cfg.catalog.filter(function (i) { return i.available; }).forEach(function (i) {
        var b = document.createElement("button"); b.type = "button"; b.className = "btn btn-outline btn-sm";
        b.textContent = i.name + " $" + i.usd + (i.monthly ? "/mo" : "") + (i.credits ? " (" + i.credits.toLocaleString("en-US") + " credits)" : ""); b.addEventListener("click", function () { checkout(i.item); }); buy.appendChild(b);
      });
      if (me.has_billing) { var p = document.createElement("button"); p.type = "button"; p.className = "btn btn-outline btn-sm"; p.textContent = "Manage billing"; p.addEventListener("click", portal); buy.appendChild(p); }
    }
    show("lv-buy-closed", !(cfg && cfg.stripe_enabled));
    paintMeter();
    loadVoices();
  }

  /* ---------- credit meter + Boost ---------- */
  function paintMeter() {
    var m = me && me.meter;
    if (!m) { show("lv-meter", false); return; }
    show("lv-meter", true);
    var pct = Math.max(4, Math.min(100, Math.round(100 * m.balance_credits / Math.max(1, m.low_threshold * 4))));
    $("lv-meter-fill").style.width = pct + "%";
    $("lv-meter").className = "lv-meter lv-" + m.state;
    $("lv-boost").hidden = !m.boost;
  }
  $("lv-boost").addEventListener("click", function () {
    var items = (me && me.meter && me.meter.boost_items) || ["pack_100"];
    if (cfg && cfg.stripe_enabled) { checkout(items[1] || items[0]); }
  });

  /* ---------- voiceover ---------- */
  var voicesLoaded = false;
  function loadVoices() {
    if (voicesLoaded) return;
    api("GET", "/v2/voices").then(function (r) {
      var sel = $("lv-vo-voice"); sel.innerHTML = "";
      (r.voices || []).forEach(function (v) { var o = document.createElement("option"); o.value = v.id; o.textContent = v.name + " (" + v.style + ")"; sel.appendChild(o); });
      voicesLoaded = true; show("lv-vo", (r.voices || []).length > 0);
    }).catch(function () { show("lv-vo", false); });
  }
  function voBody(confirm) { return { voice_id: $("lv-vo-voice").value, text: $("lv-vo-text").value, confirm: !!confirm }; }
  $("lv-vo-quote").addEventListener("click", function () {
    $("lv-vo-msg").textContent = "Pricing...";
    api("POST", "/v2/voiceover", voBody(false)).then(function (q) {
      $("lv-vo-msg").textContent = q.credits + " credits for about " + q.seconds_estimate + " seconds of voice. You have " + q.balance_credits + " credits.";
      $("lv-vo-go").hidden = false;
    }).catch(function (e) { $("lv-vo-msg").textContent = e.message; $("lv-vo-go").hidden = true; });
  });
  $("lv-vo-text").addEventListener("input", function () { $("lv-vo-go").hidden = true; });
  $("lv-vo-voice").addEventListener("change", function () { $("lv-vo-go").hidden = true; });
  $("lv-vo-go").addEventListener("click", function () {
    var btn = this; btn.disabled = true; $("lv-vo-msg").textContent = "Recording your narrator...";
    api("POST", "/v2/voiceover", voBody(true)).then(function (r) {
      $("lv-vo-msg").textContent = "Done. " + r.credits + " credits used.";
      $("lv-vo-out").innerHTML = '<audio controls src="' + esc(r.signed_url) + '"></audio><p class="fine">Private link, expires soon. <a download href="' + esc(r.signed_url) + '">Download the MP3</a>.</p>';
      $("lv-bal").textContent = r.balance_credits; btn.hidden = true;
    }).catch(function (e) { $("lv-vo-msg").textContent = e.message; }).then(function () { btn.disabled = false; });
  });

  /* ---------- Turnstile (only when a site key is set) ---------- */
  var tsReady = null;
  function renderTurnstile(slotId) {
    if (!TS_KEY) return;
    tsReady = tsReady || loadScript("https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit");
    tsReady.then(function () {
      var slot = $(slotId); if (!slot || slot.dataset.done) return;
      slot.dataset.done = "1";
      tsWidget = window.turnstile.render(slot, { sitekey: TS_KEY, callback: function (t) { tsToken = t; }, "expired-callback": function () { tsToken = ""; } });
    }).catch(function () { msg("The human check couldn't load. Check your connection.", "bad"); });
  }
  function useToken() { var t = tsToken; tsToken = ""; if (window.turnstile && tsWidget !== null) { try { window.turnstile.reset(tsWidget); } catch (e) { /* ignore */ } } return t; }

  /* ---------- sign in / out ---------- */
  $("lv-google").addEventListener("click", function () {
    var p = new window.firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(p).catch(function (e) {
      if (e && (e.code === "auth/popup-blocked" || e.code === "auth/operation-not-supported-in-this-environment")) return auth.signInWithRedirect(p);
      if (e && e.code !== "auth/popup-closed-by-user") msg(e.message, "bad");
    });
  });
  $("lv-email-form").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var em = $("lv-email").value.trim(); if (!em) return;
    if (auth.isSignInWithEmailLink(location.href)) {
      auth.signInWithEmailLink(em, location.href).then(function () { history.replaceState(null, "", location.pathname); }).catch(function (e) { msg(e.message, "bad"); });
      return;
    }
    auth.sendSignInLinkToEmail(em, { url: location.origin + "/studio/", handleCodeInApp: true }).then(function () {
      store("mw_email_for_link", em); msg("Check your inbox for a sign-in link from Madwackd Studio.", "ok");
    }).catch(function (e) { msg(e.message, "bad"); });
  });
  [].forEach.call(document.querySelectorAll("[data-signout]"), function (b) { b.addEventListener("click", function () { if (auth) auth.signOut(); msg(""); }); });

  $("lv-signup-go").addEventListener("click", function () {
    if (!$("lv-terms").checked) { msg("Please accept the Terms and the Acceptable Use Policy.", "bad"); return; }
    if (TS_KEY && !tsToken) { msg("Please finish the human check first.", "bad"); return; }
    api("POST", "/v2/signup", { accept_terms: true, turnstile_token: useToken() }).then(function () { msg(""); refreshMe(); }).catch(function (e) { msg(e.message, "bad"); });
  });

  /* ---------- quote -> confirm -> render -> poll ---------- */
  function shotBody() {
    return { prompt: $("lv-prompt").value.trim(), aspect_ratio: $("lv-asp").value, duration_seconds: Number($("lv-sec").value),
      quality: $("lv-q").value, resolution: $("lv-res").value, generate_audio: $("lv-audio").checked };
  }
  $("lv-sec").addEventListener("change", function () { if (this.value !== "8" && $("lv-res").value === "1080p") $("lv-res").value = "720p"; });
  $("lv-res").addEventListener("change", function () { if (this.value === "1080p") $("lv-sec").value = "8"; });

  $("lv-form").addEventListener("submit", function (ev) {
    ev.preventDefault(); msg("");
    var b = shotBody(); if (!b.prompt) { msg("Describe the shot first.", "bad"); return; }
    $("lv-quote-btn").disabled = true;
    api("POST", "/v2/quotes", b).then(function (q) {
      quote = q;
      var r = q.price_usd_range || [0, 0];
      $("lv-q-price").textContent = q.credits + " credits (about $" + r[0].toFixed(2) + " to $" + r[1].toFixed(2) + ", depending on your plan or pack)";
      $("lv-q-detail").textContent = q.seconds + "-second shot on " + (b.quality === "fast" ? "Fast" : "Top quality") + " at " + b.resolution +
        (q.provider_cost_usd != null ? ". Engine cost estimate: $" + q.provider_cost_usd.toFixed(2) + "." : ".");
      $("lv-q-bal").textContent = q.enough ? "You have " + q.balance_credits + " credits." : "You have " + q.balance_credits + " credits. Add credits to render this.";
      $("lv-confirm").disabled = !q.enough;
      show("lv-quote", true);
      renderTurnstile("lv-ts-render");
    }).catch(function (e) { msg(e.message, "bad"); }).then(function () { $("lv-quote-btn").disabled = false; });
  });
  $("lv-cancel").addEventListener("click", function () { quote = null; show("lv-quote", false); });
  $("lv-confirm").addEventListener("click", function () {
    if (!quote) return;
    if (TS_KEY && !tsToken) { msg("Please finish the human check first.", "bad"); return; }
    $("lv-confirm").disabled = true;
    api("POST", "/v2/renders", { quote_id: quote.quote_id, confirm: true, turnstile_token: useToken() }).then(function (j) {
      show("lv-quote", false); quote = null;
      if (j.balance_credits != null) { me.balance_credits = j.balance_credits; paintMe(); }
      msg("Rendering. This usually takes 1 to 3 minutes. You can leave this tab open.", "ok");
      watch(j.job_id); loadJobs();
    }).catch(function (e) { msg(e.message, "bad"); $("lv-confirm").disabled = false; });
  });

  function watch(id) {
    clearTimeout(pollTimer);
    var started = Date.now();
    (function tick() {
      api("GET", "/v2/jobs/" + encodeURIComponent(id)).then(function (j) {
        if (j.status === "running" || j.status === "submitting") {
          if (Date.now() - started < 15 * 60 * 1000) pollTimer = setTimeout(tick, 6000);
          return;
        }
        loadJobs();
        if (j.status === "done") { msg("Done. Your video is below.", "ok"); play(j); }
        else { msg(j.message || "The render didn't finish.", "bad"); refreshMe(); }
      }).catch(function () { pollTimer = setTimeout(tick, 10000); });
    })();
  }

  function play(j) {
    var out = $("lv-out");
    out.innerHTML = '<div class="st-card"><video controls playsinline preload="metadata"></video><p class="fine">Private link, expires in ' +
      esc(j.signed_url_expires_minutes) + ' minutes. <a download href="' + esc(j.signed_url) + '">Download the MP4</a>. AI-generated, with an invisible provenance mark.</p></div>';
    out.querySelector("video").src = j.signed_url;
  }

  function loadJobs() {
    api("GET", "/v2/jobs").then(function (r) {
      var list = $("lv-jobs");
      if (!r.jobs.length) { list.innerHTML = '<p class="fine">No renders yet.</p>'; return; }
      list.innerHTML = r.jobs.slice(0, 12).map(function (j) {
        return '<div class="st-take"><span class="st st-' + esc(j.status === "blocked" ? "filtered" : j.status === "failed" ? "error" : j.status) + '">' + esc(j.status) + "</span> " +
          esc(j.seconds) + "s &middot; " + esc(j.credits) + " credits &middot; " + esc(String(j.prompt || "").slice(0, 90)) +
          (j.status === "done" ? ' <button class="btn btn-outline btn-sm" type="button" data-job="' + esc(j.job_id) + '">Play</button>' : "") +
          (j.status === "running" ? ' <button class="btn btn-outline btn-sm" type="button" data-watch="' + esc(j.job_id) + '">Check</button>' : "") + "</div>";
      }).join("");
    }).catch(function () { /* list is optional */ });
  }
  $("lv-jobs").addEventListener("click", function (ev) {
    var t = ev.target;
    if (t.dataset.job) api("GET", "/v2/jobs/" + encodeURIComponent(t.dataset.job)).then(play).catch(function (e) { msg(e.message, "bad"); });
    if (t.dataset.watch) watch(t.dataset.watch);
  });

  /* ---------- billing ---------- */
  function checkout(item) { api("POST", "/v2/billing/checkout", { item: item }).then(function (r) { location.href = r.url; }).catch(function (e) { msg(e.message, "bad"); }); }
  function portal() { api("POST", "/v2/billing/portal").then(function (r) { location.href = r.url; }).catch(function (e) { msg(e.message, "bad"); }); }
  function checkoutReturn() {
    var q = new URLSearchParams(location.search).get("checkout");
    if (q === "success") { msg("Thanks! Your credits appear as soon as Stripe confirms the payment, usually within a minute.", "ok"); setTimeout(refreshMe, 8000); history.replaceState(null, "", location.pathname); }
    if (q === "cancel") { msg("Checkout canceled. Nothing was charged.", ""); history.replaceState(null, "", location.pathname); }
  }

  /* ---------- owner tools ---------- */
  $("lv-grant").addEventListener("click", function () {
    var n = Number($("lv-grant-n").value || 0);
    if (!(n > 0 && n <= 5000)) { msg("Enter 1 to 5,000 credits.", "bad"); return; }
    var key = "ui-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
    api("POST", "/v2/admin/grant", { email: me.email, credits: n, reason: "owner test credits (studio UI)", idempotency_key: key })
      .then(function (r) { me.balance_credits = r.balance_credits; paintMe(); msg("Added " + n + " owner test credits.", "ok"); })
      .catch(function (e) { msg(e.message, "bad"); });
  });

  boot();
})();
