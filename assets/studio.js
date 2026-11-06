/* Madwackd Studio v2.0 - studio workspace UI (demo tabs). Talks to the API, or to the in-browser mock when no API URL is set. */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var CREDIT_USD = 0.10;
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k) || ""; localStorage.setItem(k, v); } catch (e) { return ""; } }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  /* Credits cost about $0.08 (Studio plan) to $0.12 (100-credit pack) each, so dollars show as a range. */
  function money(c) { return "$" + (c * 0.08).toFixed(2) + " to $" + (c * 0.12).toFixed(2); }

  /* ---------- connection ---------- */
  $("api").value = store("mws_api"); $("tok").value = store("mws_tok");
  /* v2.0: the workspace tabs below always run on the in-browser demo. Real renders go through the
     signed-in Live render panel (studio-live.js). The old v1 token connection only works with mws_legacy=1. */
  function apiBase() { if (store("mws_legacy") !== "1") return ""; return ($("api").value || "").trim().replace(/\/+$/, ""); }
  function setMode() { var live = !!apiBase(); $("mode").textContent = live ? "API: " + apiBase().replace(/^https?:\/\//, "") : "Demo workspace"; $("mode").className = "mode" + (live ? " live" : ""); }
  setMode();
  $("open-conn").addEventListener("click", function () { $("conn-dlg").showModal(); });
  $("conn-dlg").addEventListener("close", function () { if ($("conn-dlg").returnValue === "save") { store("mws_api", $("api").value.trim()); store("mws_tok", $("tok").value); setMode(); loadProjectList(); refresh(); } });

  function call(method, path, body) {
    if (!apiBase()) return window.MWStudioMock.handle(method, path, body);
    var h = { "Content-Type": "application/json" }; if ($("tok").value) h.Authorization = "Bearer " + $("tok").value;
    return fetch(apiBase() + path, { method: method, headers: h, body: body ? JSON.stringify(body) : undefined }).then(function (r) {
      var ct = r.headers.get("Content-Type") || "";
      if (ct.indexOf("application/json") > -1) return r.json().then(function (j) { return { status: r.status, json: j }; });
      if (ct.indexOf("pdf") > -1) return r.blob().then(function (b) { return { status: r.status, blob: b, type: ct }; });
      return r.text().then(function (t) { return { status: r.status, text: t, type: ct }; });
    });
  }
  function must(r) { if (r.status >= 400) { var e = new Error((r.json && r.json.message) || "Request failed (" + r.status + ")"); e.code = r.json && r.json.error; throw e; } return r.json; }
  function showErr(e) { $("err").textContent = e.message || String(e); $("err").hidden = false; $("err").scrollIntoView({ block: "nearest" }); }
  function clearErr() { $("err").hidden = true; }
  function act(p) { clearErr(); return p.catch(showErr); }

  /* ---------- tabs ---------- */
  var tabs = [].slice.call(document.querySelectorAll(".st-tabs [role=tab]"));
  function showTab(name) {
    tabs.forEach(function (t) { t.setAttribute("aria-selected", t.dataset.tab === name ? "true" : "false"); });
    document.querySelectorAll(".st-panel").forEach(function (p) { p.hidden = p.dataset.panel !== name; });
    store("mws_tab", name);
  }
  tabs.forEach(function (t) { t.addEventListener("click", function () { showTab(t.dataset.tab); }); });
  showTab(store("mws_tab") || "producer");

  /* ---------- projects ---------- */
  var pid = store("mws_pid"), P = null;
  function projList() { try { return JSON.parse(store("mws_projects") || "[]"); } catch (e) { return []; } }
  function loadProjectList() {
    var key = apiBase() ? "api" : "mock", list = projList().filter(function (p) { return p.where === key; }), sel = $("proj-select");
    sel.innerHTML = list.length ? "" : '<option value="">No project yet</option>';
    list.forEach(function (p) { var o = document.createElement("option"); o.value = p.id; o.textContent = p.name; sel.appendChild(o); });
    if (!list.some(function (p) { return p.id === pid; })) pid = list.length ? list[list.length - 1].id : "";
    sel.value = pid;
  }
  $("proj-select").addEventListener("change", function () { pid = this.value; store("mws_pid", pid); refresh(); });
  function createProject(name, budget) {
    return call("POST", "/projects", { name: name, budget_credits: budget }).then(must).then(function (p) {
      var l = projList(); l.push({ id: p.id, name: p.name, where: apiBase() ? "api" : "mock" }); store("mws_projects", JSON.stringify(l));
      pid = p.id; store("mws_pid", pid); loadProjectList(); return refresh();
    });
  }
  $("new-proj").addEventListener("click", function () {
    var box = $("new-box");
    if (!box) {
      box = document.createElement("div"); box.id = "new-box"; box.className = "st-newbox";
      box.innerHTML = '<label for="np-name">Project name</label><input id="np-name" maxlength="120" placeholder="Project name"><label for="np-cap">Budget cap (credits)</label><input id="np-cap" type="number" min="0" step="10" value="300"><div class="cta-row"><button class="btn btn-primary btn-sm" type="button" id="np-go">Create</button><button class="btn btn-outline btn-sm" type="button" id="np-x">Cancel</button></div>';
      $("bar").appendChild(box);
      $("np-go").addEventListener("click", function () { act(createProject($("np-name").value || "Untitled project", +$("np-cap").value || 0).then(function () { box.remove(); })); });
      $("np-x").addEventListener("click", function () { box.remove(); });
    }
    $("np-name").focus();
  });
  function needProject() { if (!pid) throw new Error("Create a project first (New project, at the top)."); }

  function refresh() {
    if (!pid) { P = null; renderAll(); return Promise.resolve(); }
    return call("GET", "/projects/" + pid).then(function (r) {
      if (r.status === 404) { pid = ""; store("mws_pid", ""); P = null; renderAll(); return; }
      P = must(r); renderAll(); pollRunning();
    }).catch(showErr);
  }

  /* ---------- quote dialog ---------- */
  function quoteThen(body, run) {
    needProject();
    return call("POST", "/projects/" + pid + "/quote", body).then(must).then(function (q) {
      $("q-lines").innerHTML = q.lines.map(function (l) {
        return '<div class="q-line"><b>' + esc(l.item) + "</b><span>" + esc(l.math) + "</span><strong>" + (l.free ? "Free preview" : l.credits + " credits (" + money(l.credits) + ")") + "</strong>" +
          (l.reroll_credit_applied ? '<em>Re-roll credit applied: ' + l.reroll_credit_applied + "</em>" : "") + "</div>";
      }).join("");
      $("q-total").textContent = q.total_credits ? "Total: " + q.total_credits + " credits (" + money(q.total_credits) + ")" : "Total: free";
      $("q-budget").textContent = "Budget left before this: " + q.remaining_credits + " of " + q.budget_credits + " credits.";
      $("q-over").hidden = !q.over_budget; $("q-ok").disabled = q.over_budget;
      $("q-ok").textContent = q.total_credits ? "Confirm and spend " + q.total_credits + " credits" : "Confirm";
      return new Promise(function (resolve) {
        var dlg = $("quote-dlg");
        dlg.returnValue = "";
        dlg.addEventListener("close", function h() { dlg.removeEventListener("close", h); resolve(dlg.returnValue === "ok" ? run(q.quote_id) : null); });
        dlg.showModal();
      });
    }).then(function (x) { return refresh().then(function () { return x; }); });
  }

  /* ---------- 1. producer ---------- */
  $("plan-form").addEventListener("submit", function (ev) {
    ev.preventDefault();
    act(call("POST", "/producer/plan", { idea: $("idea").value, format: $("fmt").value, length_s: +$("plen").value, aspect: $("pasp").value,
      quality: $("pq").value, takes: +$("ptakes").value, characters: +$("pchars").value }).then(must).then(function (pl) {
      var rows = pl.shots.map(function (s) { return "<tr><td>" + s.n + "</td><td>" + esc(s.beat) + "</td><td>" + s.seconds + "s &times; " + s.takes + "</td><td>" + s.credits + "</td></tr>"; }).join("");
      $("plan-out").innerHTML = '<div class="st-card"><h3>Shot list and budget</h3><div class="tbl-wrap"><table class="tbl"><tr><th>#</th><th>Beat</th><th>Length</th><th>Credits</th></tr>' + rows +
        "</table></div><p class=\"est\">Estimated total: " + pl.total_credits + " credits (" + money(pl.total_credits) + "), including " + pl.stills + " stills.</p><p class=\"fine\">" + esc(pl.note) +
        '</p><button class="btn btn-primary" type="button" id="plan-use">Create a project from this plan</button></div>';
      $("plan-use").addEventListener("click", function () {
        var budget = Math.ceil(pl.total_credits * 1.25 / 10) * 10;
        act(createProject(pl.idea.slice(0, 60), budget).then(function () {
          return pl.shots.reduce(function (p, s) { return p.then(function () { return call("POST", "/projects/" + pid + "/shots", { scene_text: s.beat, aspect: s.aspect, seconds: s.seconds }).then(must); }); }, Promise.resolve());
        }).then(refresh).then(function () { showTab("shots"); }));
      });
    }));
  });

  /* ---------- 2. cast ---------- */
  function fileB64(input, max) {
    var f = input.files && input.files[0]; if (!f) return Promise.resolve("");
    if (f.size > max) return Promise.reject(new Error("File is too big."));
    return new Promise(function (res, rej) { var fr = new FileReader(); fr.onload = function () { res(fr.result); }; fr.onerror = rej; fr.readAsDataURL(f); });
  }
  $("char-form").addEventListener("submit", function (ev) {
    ev.preventDefault();
    act(Promise.resolve().then(needProject).then(function () { return fileB64($("cref"), 10 * 1024 * 1024); }).then(function (img) {
      return call("POST", "/projects/" + pid + "/characters", { name: $("cname").value, description: $("cdesc").value, reference_image_b64: img }).then(must);
    }).then(function () { $("char-form").reset(); return refresh(); }));
  });
  function renderCast() {
    var box = $("cast-list"); if (!P) { box.innerHTML = ""; return; }
    var cs = Object.values(P.characters);
    box.innerHTML = cs.length ? "" : '<p class="fine">No characters yet.</p>';
    cs.forEach(function (c) {
      var d = document.createElement("div"); d.className = "st-card";
      var views = ["Front", "Three-quarter", "Profile"];
      d.innerHTML = '<div class="st-card-top"><h3>' + esc(c.name) + "</h3>" + (c.locked ? '<span class="pill ok">Locked</span>' : '<span class="pill soon">Not locked</span>') + '</div><p class="fine">' + esc(c.description) + "</p>" +
        (c.sheet.length ? '<div class="sheet">' + c.sheet.map(function (s, i) { return '<div class="still' + (c.approved_still === s ? " sel" : "") + '"><span>' + views[i] + "</span>" + (c.locked && c.approved_still === s ? "<b>Locked</b>" : '<button class="btn btn-outline btn-sm" data-lock="' + i + '" type="button">Lock this one</button>') + "</div>"; }).join("") + "</div>" :
          '<button class="btn btn-primary btn-sm" type="button" data-sheet>Quote cast sheet (3 stills)</button>');
      box.appendChild(d);
      var sb = d.querySelector("[data-sheet]");
      if (sb) sb.addEventListener("click", function () { act(quoteThen({ kind: "cast_sheet", target: c.id }, function (qid) { return call("POST", "/projects/" + pid + "/characters/" + c.id + "/sheet", { quote_id: qid, confirm: true }).then(must); })); });
      d.querySelectorAll("[data-lock]").forEach(function (b) { b.addEventListener("click", function () { act(call("POST", "/projects/" + pid + "/characters/" + c.id + "/approve", { still_index: +b.dataset.lock }).then(must).then(refresh)); }); });
    });
    var fs = $("shot-chars");
    fs.innerHTML = "<legend>Characters in this shot</legend>" + (cs.length ? cs.map(function (c) { return '<label class="radio"><input type="checkbox" value="' + c.id + '"> ' + esc(c.name) + "</label>"; }).join("") : '<p class="fine">No characters yet.</p>');
  }

  /* ---------- 3. shots ---------- */
  $("shot-form").addEventListener("submit", function (ev) {
    ev.preventDefault();
    act(Promise.resolve().then(needProject).then(function () {
      var ids = [].slice.call(document.querySelectorAll("#shot-chars input:checked")).map(function (i) { return i.value; });
      return call("POST", "/projects/" + pid + "/shots", { scene_text: $("scene").value, aspect: $("sasp").value, seconds: +$("ssec").value, character_ids: ids }).then(must);
    }).then(function () { $("scene").value = ""; return refresh(); }));
  });
  function diffHtml(d) { return d.map(function (x) { return x.op === "equal" ? esc(x.text) : x.op === "insert" ? "<ins>" + esc(x.text) + "</ins>" : "<del>" + esc(x.text) + "</del>"; }).join(" "); }
  function renderShots() {
    var box = $("shot-list"); if (!P) { box.innerHTML = '<p class="fine">Create a project to add shots.</p>'; return; }
    var shots = Object.values(P.shots).sort(function (a, b) { return a.n - b.n; });
    box.innerHTML = shots.length ? "" : '<p class="fine">No shots yet. Add one above, or plan them with Producer Z.</p>';
    shots.forEach(function (sh) {
      var cur = sh.versions[sh.current - 1], prop = sh.versions.filter(function (v) { return v.status === "proposed" && v.v > sh.current; }).pop();
      var takes = Object.values(P.takes).filter(function (t) { return t.shot === sh.id; });
      var chars = sh.character_ids.map(function (c) { return P.characters[c] ? esc(P.characters[c].name) : ""; }).join(", ");
      var d = document.createElement("div"); d.className = "st-card";
      d.innerHTML = '<div class="st-card-top"><h3>Shot ' + sh.n + " &middot; v" + sh.current + '</h3><span class="fine">' + sh.aspect + " &middot; " + sh.seconds + "s" + (chars ? " &middot; " + chars : "") + "</span></div>" +
        '<p class="st-prompt">' + esc(cur.prompt) + "</p>" + (cur.negative ? '<p class="fine">Avoid: ' + esc(cur.negative) + "</p>" : "") +
        (prop ? '<div class="st-proposed"><b>Proposed v' + prop.v + "</b> from your note &ldquo;" + esc(prop.note) + '&rdquo;<p class="st-diff">' + diffHtml(prop.diff) + '</p><div class="cta-row"><button class="btn btn-primary btn-sm" type="button" data-approve="' + prop.v + '">Approve v' + prop.v + "</button></div></div>" : "") +
        '<div class="st-note"><label for="n-' + sh.id + '">Director\'s note</label><div class="st-inline"><input id="n-' + sh.id + '" maxlength="300" placeholder="e.g. make him smile more, golden hour"><button class="btn btn-outline btn-sm" type="button" data-note>Rewrite prompt</button></div></div>' +
        (sh.character_ids.length ? '<div class="st-still"><b>Start still (Character Lock):</b> ' + (sh.start_still ? (sh.still_approved ? '<span class="pill ok">Approved</span>' : '<span class="pill soon">Ready to check</span> <button class="btn btn-outline btn-sm" type="button" data-still-ok>Approve still</button>') : "none yet") +
          ' <button class="btn btn-outline btn-sm" type="button" data-still>' + (sh.start_still ? "Remake" : "Quote start still") + "</button></div>" : "") +
        '<div class="st-render"><div class="opts">' +
        '<div><label for="q-' + sh.id + '">Model</label><select id="q-' + sh.id + '"><option value="fast">Fast</option><option value="standard">Top quality</option></select></div>' +
        '<div><label for="r-' + sh.id + '">Resolution</label><select id="r-' + sh.id + '"><option>720p</option>' + (sh.seconds === 8 ? "<option>1080p</option>" : "") + "</select></div>" +
        '<div><label for="t-' + sh.id + '">Takes</label><select id="t-' + sh.id + '"><option>1</option><option>2</option><option>3</option><option>4</option></select></div></div>' +
        '<div class="cta-row"><button class="btn btn-lime btn-sm" type="button" data-preview>Preview (4s, low-res)</button><button class="btn btn-primary btn-sm" type="button" data-full>Quote full render</button></div></div>' +
        '<details class="st-hist"><summary>Version history (' + sh.versions.length + ")</summary>" + sh.versions.slice().reverse().map(function (v) {
          return '<div class="st-ver"><b>v' + v.v + "</b> <span class=\"pill " + (v.status === "approved" ? "ok" : "ea") + '">' + v.status + "</span> <span class=\"fine\">" + esc(v.source) + "</span>" +
            (v.diff && v.diff.length ? '<p class="st-diff">' + diffHtml(v.diff) + "</p>" : '<p class="st-diff">' + esc(v.prompt) + "</p>") +
            (v.v !== sh.current ? '<button class="btn btn-outline btn-sm" type="button" data-revert="' + v.v + '">Revert to v' + v.v + "</button>" : '<span class="fine">Current</span>') + "</div>";
        }).join("") + "</details>" +
        '<div class="st-takes">' + takes.map(function (t) {
          return '<div class="st-take"><span class="st st-' + t.status + '">' + esc(t.status) + "</span> " + (t.kind === "preview" ? "Preview" : "Full") + " &middot; v" + t.version + " &middot; " + (t.free ? "free" : t.credits + " cr") +
            (t.status === "done" ? (t.signed_url && t.signed_url.indexOf("mock") < 0 ? '<video controls src="' + esc(t.signed_url) + '"></video>' : ' <span class="fine">(mock result, no real video)</span>') +
              (t.flag ? ' <span class="pill later">Flagged: ' + esc(t.flag) + "</span>" : ' <button class="btn btn-outline btn-sm" type="button" data-flag="technical" data-take="' + t.id + '">Technical fault</button> <button class="btn btn-outline btn-sm" type="button" data-flag="creative" data-take="' + t.id + '">Creative change</button>') : "") +
            (t.message ? '<p class="fine">' + esc(t.message) + " Credits returned.</p>" : "") + "</div>";
        }).join("") + "</div>";
      box.appendChild(d);
      var base = "/projects/" + pid + "/shots/" + sh.id;
      d.querySelector("[data-note]").addEventListener("click", function () { act(call("POST", base + "/notes", { note: $("n-" + sh.id).value }).then(must).then(refresh)); });
      var ap = d.querySelector("[data-approve]"); if (ap) ap.addEventListener("click", function () { act(call("POST", base + "/approve", { version: +ap.dataset.approve }).then(must).then(refresh)); });
      d.querySelectorAll("[data-revert]").forEach(function (b) { b.addEventListener("click", function () { act(call("POST", base + "/revert", { version: +b.dataset.revert }).then(must).then(refresh)); }); });
      var st = d.querySelector("[data-still]"); if (st) st.addEventListener("click", function () { act(quoteThen({ kind: "shot_still", target: sh.id }, function (qid) { return call("POST", base + "/still", { quote_id: qid, confirm: true }).then(must); })); });
      var so = d.querySelector("[data-still-ok]"); if (so) so.addEventListener("click", function () { act(call("POST", base + "/still/approve", {}).then(must).then(refresh)); });
      function renderNow(kind) { return function (qid) { return call("POST", base + "/render", { quote_id: qid, confirm: true }).then(must); }; }
      d.querySelector("[data-preview]").addEventListener("click", function () { act(quoteThen({ kind: "preview", target: sh.id }, renderNow("preview"))); });
      d.querySelector("[data-full]").addEventListener("click", function () {
        act(quoteThen({ kind: "full", target: sh.id, quality: $("q-" + sh.id).value, resolution: $("r-" + sh.id).value, takes: +$("t-" + sh.id).value, audio: true }, renderNow("full")));
      });
      d.querySelectorAll("[data-flag]").forEach(function (b) { b.addEventListener("click", function () {
        act(call("POST", "/projects/" + pid + "/takes/" + b.dataset.take + "/flag", { reason: b.dataset.flag, detail: "" }).then(must).then(function (r) { return refresh().then(function () { alertBox(r.message); }); }));
      }); });
    });
  }
  function alertBox(msg) { var n = document.createElement("div"); n.className = "notice st-toast"; n.setAttribute("role", "status"); n.textContent = msg; document.body.appendChild(n); setTimeout(function () { n.remove(); }, 6000); }

  var pollT = 0;
  function pollRunning() {
    clearTimeout(pollT); if (!P) return;
    var running = Object.values(P.takes).filter(function (t) { return t.status === "running"; });
    if (!running.length) return;
    pollT = setTimeout(function () {
      Promise.all(running.map(function (t) { return call("GET", "/projects/" + pid + "/takes/" + t.id).then(must); })).then(refresh).catch(showErr);
    }, apiBase() ? 10000 : 1500);
  }

  /* ---------- 4. voice ---------- */
  var CONSENT = "";
  call("GET", "/voices/stock").then(must).then(function (v) {
    CONSENT = v.consent_text; $("consent-text").textContent = v.consent_text;
    $("vstock").innerHTML = v.voices.map(function (s) { return '<option value="' + s.id + '">' + esc(s.name) + " (" + esc(s.style) + ")</option>"; }).join("");
  }).catch(showErr);
  function vkind() { var k = $("vkind").value; $("v-stock").hidden = k !== "stock"; $("v-custom").hidden = k === "stock"; $("v-upload").hidden = k !== "upload"; $("v-record").hidden = k !== "record"; }
  $("vkind").addEventListener("change", vkind); vkind();
  document.querySelectorAll('input[name=vbasis]').forEach(function (r) { r.addEventListener("change", function () { $("v-speaker").hidden = document.querySelector('input[name=vbasis]:checked').value !== "written_permission"; }); });
  var recB64 = "", mr = null, chunks = [];
  $("rec-start").addEventListener("click", function () {
    clearErr();
    if (!navigator.mediaDevices || !window.MediaRecorder) { showErr(new Error("This browser can't record audio. Upload a sample instead.")); return; }
    navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
      chunks = []; mr = new MediaRecorder(stream);
      mr.ondataavailable = function (e) { if (e.data.size) chunks.push(e.data); };
      mr.onstop = function () {
        stream.getTracks().forEach(function (t) { t.stop(); });
        var blob = new Blob(chunks, { type: mr.mimeType || "audio/webm" });
        $("rec-play").src = URL.createObjectURL(blob); $("rec-play").hidden = false;
        var fr = new FileReader(); fr.onload = function () { recB64 = fr.result; $("rec-status").textContent = "Recorded " + Math.round(blob.size / 1024) + " KB. Listen back, then add the voice."; }; fr.readAsDataURL(blob);
      };
      mr.start(); $("rec-status").textContent = "Recording... read naturally, then press Stop."; $("rec-start").disabled = true; $("rec-stop").disabled = false;
    }).catch(function () { showErr(new Error("Microphone permission was blocked. Allow it in the browser, or upload a sample.")); });
  });
  $("rec-stop").addEventListener("click", function () { if (mr && mr.state !== "inactive") mr.stop(); $("rec-start").disabled = false; $("rec-stop").disabled = true; });
  $("add-voice").addEventListener("click", function () {
    act(Promise.resolve().then(needProject).then(function () {
      var k = $("vkind").value;
      if (k === "stock") return { kind: "stock", stock_id: $("vstock").value };
      return (k === "upload" ? fileB64($("vfile"), 15 * 1024 * 1024) : Promise.resolve(recB64)).then(function (b64) {
        return { kind: k, name: $("vname").value, audio_b64: b64, consent: { agreed: $("vagree").checked, basis: document.querySelector('input[name=vbasis]:checked').value, speaker_name: $("vspeaker").value, text: CONSENT } };
      });
    }).then(function (body) { return call("POST", "/projects/" + pid + "/voices", body).then(must); }).then(function () { alertBox("Voice added."); return refresh(); }));
  });
  $("vo-go").addEventListener("click", function () {
    var vid = $("vo-voice").value, text = $("vo-text").value.trim();
    act(Promise.resolve().then(needProject).then(function () {
      if (!vid) throw new Error("Add a voice first.");
      return quoteThen({ kind: "voiceover", voice_id: vid, text: text }, function (qid) { return call("POST", "/projects/" + pid + "/voiceover", { voice_id: vid, text: text, quote_id: qid, confirm: true }).then(must); });
    }));
  });
  function renderVoice() {
    var vs = P ? Object.values(P.voices) : [], ls = P ? Object.values(P.voice_lines) : [];
    $("vo-voice").innerHTML = vs.length ? vs.map(function (v) { return '<option value="' + v.id + '">' + esc(v.name) + " (" + v.kind + ")</option>"; }).join("") : '<option value="">Add a voice first</option>';
    $("vo-list").innerHTML = ls.map(function (l) { return '<div class="st-take"><b>' + l.seconds + "s</b> " + esc(l.text.slice(0, 120)) + "</div>"; }).join("");
    $("ex-vo").innerHTML = '<option value="">None</option>' + ls.map(function (l) { return '<option value="' + l.id + '">' + esc(l.text.slice(0, 40)) + "</option>"; }).join("");
  }

  /* ---------- 5. export ---------- */
  function doneTakes() {
    if (!P) return [];
    return Object.values(P.takes).filter(function (t) { return t.status === "done"; }).sort(function (a, b) { return P.shots[a.shot].n - P.shots[b.shot].n; });
  }
  function renderExport() {
    var ts = doneTakes();
    $("ex-takes").innerHTML = "<legend>Takes (in shot order)</legend>" + (ts.length ? ts.map(function (t) { var s = P.shots[t.shot]; return '<label class="radio"><input type="checkbox" value="' + t.id + '"' + (t.kind === "full" ? " checked" : "") + "> Shot " + s.n + " v" + t.version + " &middot; " + (t.kind === "preview" ? "preview" : "full") + "</label>"; }).join("") : '<p class="fine">No finished takes yet.</p>');
    var ex = P ? Object.values(P.exports) : [];
    $("ex-out").innerHTML = ex.map(function (e) { return '<div class="st-card"><b>Export ' + esc(e.id) + "</b> &middot; " + e.aspect + " &middot; " + esc(e.status) + '<p class="fine">AI-content label written to the file data. Mock mode shows the planned ffmpeg command:</p><pre class="st-pre">' + esc(e.ffmpeg.join(" ")) + "</pre></div>"; }).join("");
  }
  $("ex-go").addEventListener("click", function () {
    act(Promise.resolve().then(needProject).then(function () {
      var ids = [].slice.call(document.querySelectorAll("#ex-takes input:checked")).map(function (i) { return i.value; });
      if (!ids.length) throw new Error("Pick at least one finished take.");
      var secs = ids.reduce(function (a, t) { var tk = P.takes[t]; return a + (tk.kind === "preview" ? 4 : P.shots[tk.shot].seconds); }, 0);
      return quoteThen({ kind: "export", export_seconds: secs }, function (qid) {
        return call("POST", "/projects/" + pid + "/export", { take_ids: ids, aspect: $("ex-asp").value, voice_line_id: $("ex-vo").value, captions: $("ex-cap").checked, watermark: $("ex-wm").checked, quote_id: qid, confirm: true }).then(must);
      });
    }));
  });

  /* ---------- 6. spend + rights ---------- */
  $("cap-save").addEventListener("click", function () { act(Promise.resolve().then(needProject).then(function () { return call("POST", "/projects/" + pid + "/budget", { budget_credits: +$("cap").value }).then(must); }).then(refresh)); });
  function download(name, r) {
    var blob = r.blob || new Blob([r.text], { type: r.type === "application/pdf" ? "application/pdf" : "text/csv" });
    if (r.type === "application/pdf" && !r.blob) { var bytes = new Uint8Array(r.text.length); for (var i = 0; i < r.text.length; i++) bytes[i] = r.text.charCodeAt(i) & 255; blob = new Blob([bytes], { type: "application/pdf" }); }
    var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  $("dl-csv").addEventListener("click", function () { act(Promise.resolve().then(needProject).then(function () { return call("GET", "/projects/" + pid + "/rights-pack.csv"); }).then(function (r) { if (r.status >= 400) must(r); download("rights-pack-" + pid + ".csv", r); })); });
  $("dl-pdf").addEventListener("click", function () { act(Promise.resolve().then(needProject).then(function () { return call("GET", "/projects/" + pid + "/rights-pack.pdf"); }).then(function (r) { if (r.status >= 400) must(r); download("rights-pack-" + pid + ".pdf", r); })); });
  function renderSpend() {
    var tb = document.querySelector("#spend-tbl tbody");
    if (!P) { tb.innerHTML = '<tr><td colspan="4">No project yet.</td></tr>'; return; }
    $("cap").value = P.budget_credits;
    tb.innerHTML = P.spend_log.slice().reverse().map(function (r) { return "<tr><td>" + esc(r.ts_utc.slice(0, 19).replace("T", " ")) + "</td><td>" + esc(r.event.replace("_", " ")) + "</td><td>" + esc(r.detail || "") + "</td><td>" + (r.event === "refunded" ? "+" : "") + esc(r.credits == null ? "" : r.credits) + "</td></tr>"; }).join("") || '<tr><td colspan="4">Nothing spent yet.</td></tr>';
  }
  function renderMeter() {
    if (!P) { $("meter").hidden = true; return; }
    $("meter").hidden = false; $("m-spent").textContent = P.spent_credits; $("m-cap").textContent = P.budget_credits;
    $("m-free").textContent = P.free_previews_left; $("m-reroll").textContent = P.reroll_credits;
    $("m-fill").style.width = Math.min(100, P.budget_credits ? P.spent_credits / P.budget_credits * 100 : 0) + "%";
  }
  function renderAll() { renderMeter(); renderCast(); renderShots(); renderVoice(); renderExport(); renderSpend(); }

  loadProjectList(); refresh();
})();
