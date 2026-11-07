/* Lead form: sends inquiries to the Madwackd API (POST /v2/leads).
   Protections: Cloudflare Turnstile, a hidden honeypot field, a 3-second minimum fill time (the submit button stays
   off until then), and a JSON POST body so no personal details ever land in a URL, history or log line.
   Used by any <form data-lead>. Producer Z's hand-off uses the same endpoint (see INTEGRATION.md). */
(function () {
  "use strict";
  var C = window.MW_CONFIG || {};
  var API = String(C.apiBase || "").replace(/\/+$/, "");
  var TS_KEY = String(C.turnstileSiteKey || "").trim();
  var MIN_MS = 3000;

  function $(f, sel) { return f.querySelector(sel); }

  function loadTurnstile() {
    if (window.turnstile) { return Promise.resolve(); }
    return new Promise(function (res, rej) {
      var s = document.createElement("script");
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      s.async = true; s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }

  function init(f) {
    var btn = $(f, "button[type=submit]"), note = $(f, ".lead-note"), slot = $(f, ".lead-ts");
    var started = Date.now(), token = "", widget = null, busy = false;
    var sms = $(f, "input[name=sms_consent]"), phone = $(f, "input[name=phone]");

    function say(msg, kind) {
      if (!note) { return; }
      note.textContent = msg; note.hidden = !msg; note.className = "notice lead-note" + (kind ? " " + kind : "");
    }
    function ready() { return !busy && Date.now() - started >= MIN_MS && (!TS_KEY || !!token); }
    function refresh() { if (btn) { btn.disabled = !ready(); } }

    if (btn) { btn.disabled = true; }
    setTimeout(refresh, MIN_MS + 50);
    if (TS_KEY && slot) {
      loadTurnstile().then(function () {
        widget = window.turnstile.render(slot, {
          sitekey: TS_KEY,
          callback: function (t) { token = t; refresh(); },
          "expired-callback": function () { token = ""; refresh(); }
        });
      }).catch(function () { say("The human check could not load. Please call us instead.", "bad"); });
    }
    var attached = document.getElementById("lead-chat-note");
    function showAttached() { var has = ""; try { has = sessionStorage.getItem("mw_chat_summary") || ""; } catch (e) { /* ignore */ } if (attached) { attached.hidden = !has; } }
    showAttached(); window.addEventListener("mw-chat-summary", showAttached);
    if (sms && phone) {   // a text-consent box only makes sense with a phone number
      phone.addEventListener("input", function () { sms.disabled = !phone.value.trim(); if (sms.disabled) { sms.checked = false; } });
      sms.disabled = !phone.value.trim();
    }

    f.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!ready()) { return; }
      if (!API) { say("Sending isn't available right now. Please call us.", "bad"); return; }
      var fd = new FormData(f), body = {};
      fd.forEach(function (v, k) { body[k] = typeof v === "string" ? v.trim() : v; });
      body.sms_consent = !!(sms && sms.checked);
      if (body.topic) {
        var TOPIC_CAT = { "Billing": "billing", "Credits": "billing", "Refund request": "billing", "Cancel my plan": "billing",
          "Delete my account": "account", "Privacy request": "account", "Privacy appeal": "account", "Something isn't working": "bug" };
        body.category = TOPIC_CAT[body.topic] || "other";
        body.message = "[" + body.topic + "] " + (body.message || ""); delete body.topic;
      }
      var cs = ""; try { cs = sessionStorage.getItem("mw_chat_summary") || ""; } catch (e0) { /* private mode */ }
      if (cs) { body.chat_summary = cs.slice(0, 1400); }   // what the visitor and Producer Z already said; no contact details
      body._t = started;            // when the form was shown, checked again on the server
      body.turnstile_token = token;
      // Ad attribution comes from the landing URL only; the details typed in the form never go into a URL.
      var q = new URLSearchParams(location.search);
      body.utm_source = (q.get("utm_source") || "").slice(0, 30);
      body.utm_campaign = (q.get("utm_campaign") || "").slice(0, 40);
      busy = true; refresh(); say("Sending...", "");
      fetch(API + "/v2/leads", { method: "POST", headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify(body), credentials: "omit", referrerPolicy: "no-referrer" })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (x) {
          if (x.ok) {
            f.reset(); f.hidden = true;
            try { sessionStorage.removeItem("mw_chat_summary"); } catch (e1) { /* ignore */ }
            var done = document.getElementById("lead-done"); if (done) { done.hidden = false; done.focus(); }
            return;
          }
          busy = false; token = "";
          if (widget !== null && window.turnstile) { try { window.turnstile.reset(widget); } catch (err) { /* ignore */ } }
          started = Date.now(); refresh();
          say((x.j && x.j.message) || "That didn't go through. Please check the form or call us.", "bad");
        })
        .catch(function () { busy = false; refresh(); say("We couldn't reach the server. Please try again or call us.", "bad"); });
    });
  }

  document.querySelectorAll("form[data-lead]").forEach(init);
})();
