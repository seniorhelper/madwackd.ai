/* "Takes" policy: a one-time dialog before a person's first render (and again only if the policy version changes).
   The server decides: a render that needs it answers 409 "policy_required". We show the dialog, record the
   acceptance (POST /v2/me/takes-policy), then retry the render once. It never appears on any other action.
   Usage:  MWTakes.run(api, function () { return api("POST", "/v2/renders", body); })  */
(function () {
  "use strict";
  var DEFAULT_TEXT = "Like a real film shoot, it can take a few takes. AI renders aren't fully predictable, so we can't refund a take you don't like. Use a cheap preview first, then refine with director's notes.";
  var TECH_TEXT = "Technical failures are different: if the engine errors and makes no video, your credits come back automatically. If something isn't working, tell us (Talk to a human).";
  var HELP_TEXT = "Polished finished videos can take practice. Or let our producers make it for you.";
  var CHECK = "I understand takes aren't refundable; technical failures are.";

  function css() {
    if (document.getElementById("mwt-css")) return;
    var s = document.createElement("style"); s.id = "mwt-css";
    s.textContent = ".mwt-ov{position:fixed;inset:0;background:rgba(10,8,20,.62);display:flex;align-items:center;justify-content:center;z-index:2147483000;padding:16px}" +
      ".mwt{background:#fff;color:#15121F;max-width:520px;width:100%;border-radius:16px;padding:24px;box-shadow:0 20px 60px rgba(0,0,0,.35);font:16px/1.5 system-ui,sans-serif}" +
      ".mwt h2{margin:0 0 10px;font-size:1.25rem}.mwt p{margin:0 0 10px}.mwt label{display:flex;gap:10px;align-items:flex-start;margin:14px 0;font-weight:600}" +
      ".mwt label input{margin-top:4px;width:18px;height:18px}.mwt .mwt-row{display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;margin-top:6px}" +
      ".mwt button{font:inherit;font-weight:700;padding:10px 18px;border-radius:999px;border:2px solid #15121F;background:#fff;color:#15121F;cursor:pointer}" +
      ".mwt button.go{background:#15121F;color:#fff}.mwt button:disabled{opacity:.45;cursor:not-allowed}.mwt small{color:#555}";
    document.head.appendChild(s);
  }

  function dialog(info) {
    css();
    return new Promise(function (resolve, reject) {
      var prev = document.activeElement;
      var ov = document.createElement("div"); ov.className = "mwt-ov";
      var box = document.createElement("div"); box.className = "mwt"; box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); box.setAttribute("aria-labelledby", "mwt-h");
      box.innerHTML = '<h2 id="mwt-h">Before your first render: how takes work</h2>' +
        "<p></p><p></p><p></p>" +
        '<label><input type="checkbox" id="mwt-ck"> <span></span></label>' +
        '<div class="mwt-row"><button type="button" id="mwt-no">Not now</button><button type="button" class="go" id="mwt-go" disabled>Continue</button></div>' +
        '<p><small>Full details: <a href="/refunds/" target="_blank" rel="noopener">Credits and Refund Policy</a>.</small></p>';
      var ps = box.querySelectorAll("p");
      ps[0].textContent = DEFAULT_TEXT; ps[1].textContent = TECH_TEXT; ps[2].textContent = HELP_TEXT;
      box.querySelector("label span").textContent = (info && info.checkbox) || CHECK;
      ov.appendChild(box); document.body.appendChild(ov);
      var ck = box.querySelector("#mwt-ck"), go = box.querySelector("#mwt-go"), no = box.querySelector("#mwt-no");
      ck.addEventListener("change", function () { go.disabled = !ck.checked; });
      function done(ok) { document.removeEventListener("keydown", key, true); ov.remove(); if (prev && prev.focus) prev.focus(); ok ? resolve() : reject(Object.assign(new Error("Okay. Nothing was charged."), { code: "policy_declined" })); }
      function key(e) {
        if (e.key === "Escape") { e.preventDefault(); done(false); return; }
        if (e.key === "Tab") {   // keep focus inside the dialog
          var f = [].filter.call(box.querySelectorAll("input,button,a[href]"), function (x) { return !x.disabled; });
          var i = f.indexOf(document.activeElement);
          if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
          else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
        }
      }
      document.addEventListener("keydown", key, true);
      go.addEventListener("click", function () { if (ck.checked) done(true); });
      no.addEventListener("click", function () { done(false); });
      ck.focus();
    });
  }

  function run(api, fn) {
    return fn().catch(function (e) {
      if (!(e && e.code === "policy_required")) throw e;
      var info = e.body || {};
      return dialog(info).then(function () {
        return api("POST", "/v2/me/takes-policy", { accept: true, version: info.policy_version });
      }).then(fn);
    });
  }

  window.MWTakes = { run: run };
})();
