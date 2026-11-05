/* Madwackd Studio v1.3 - in-browser mock of the project API (same routes and response shapes
   as api/app/routes.py). Nothing leaves the browser and nothing is billed. Used when no API URL is set. */
(function () {
  "use strict";
  var CREDIT_USD = 0.10, FREE_PREVIEWS = 0, TTL = 900;
  var RATES = { "Top quality|720p|1": 0.40, "Top quality|1080p|1": 0.40, "Top quality|720p|0": 0.20, "Top quality|1080p|0": 0.20,
    "Fast|720p|1": 0.10, "Fast|1080p|1": 0.12, "Fast|720p|0": 0.08, "Fast|1080p|0": 0.10 };
  var MULT = { "Top quality": 2.25, "Fast": 2.5, image: 2.5, tts: 3.0 };
  var MODELS = { fast: "Fast", standard: "Top quality" };
  var CONSENT = "I confirm this is my own voice, or I have written permission from the person whose voice this is to create and use an AI version of it for this project. I will not use it to impersonate anyone or mislead viewers.";
  var STOCK = [
    { id: "stock_narrator_warm", name: "Warm narrator", style: "calm, friendly, mid-range" },
    { id: "stock_trailer_deep", name: "Trailer voice", style: "deep, dramatic, slow" },
    { id: "stock_upbeat_promo", name: "Upbeat promo", style: "bright, energetic, quick" },
    { id: "stock_neighbor", name: "Friendly neighbor", style: "casual, conversational" },
    { id: "stock_documentary", name: "Documentary", style: "measured, authoritative" }];
  var BLOCK = /\b(nude|naked|sexy|sexual|porn\w*|nsfw|gore|gory|bloody|behead\w*|tortur\w*|massacre|deep ?fake|face ?swap|lookalike|celebrity|taylor swift|elon musk|donald trump|joe biden|barack obama|beyonc[eé]|kim kardashian|tom cruise|mrbeast)\b/i;
  var FIELDS = ["subject", "action", "expression", "setting", "time_of_day", "camera", "lens", "lighting", "pacing", "style", "audio", "dialogue"];
  var RULES = [
    [/\bsmil\w*\b.*\b(more|bigger|wider)\b|\b(more|bigger|wider)\b.*\bsmil/, "expression", "a broad, warm, natural smile"],
    [/\b(less|stop|no)\b.*\bsmil|\bserious\b/, "expression", "calm and serious, no smile"],
    [/\b(happier|more cheerful|more joy)\b/, "expression", "bright, joyful and relaxed"],
    [/\b(sad|sadder|more emotional)\b/, "expression", "quietly emotional, eyes glistening"],
    [/\b(angr|furious|mad)\w*\b/, "expression", "frustrated, brow furrowed, jaw tight"],
    [/\b(closer|zoom in|tighter|close[- ]?up)\b/, "camera", "slow push-in to a close-up"],
    [/\b(wider|zoom out|pull back|show more)\b/, "camera", "wide establishing shot"],
    [/\b(handheld|shaky)\b/, "camera", "handheld documentary camera"],
    [/\b(steady|smooth|stable|less shaky)\b/, "camera", "smooth gimbal dolly"],
    [/\b(drone|aerial|from above)\b/, "camera", "slow aerial drone shot"],
    [/\b(brighter|more light|too dark)\b/, "lighting", "bright, soft daylight with lifted shadows"],
    [/\b(darker|moodier|more dramatic light)\b/, "lighting", "low-key dramatic lighting, deep shadows"],
    [/\b(golden hour|sunset)\b/, "time_of_day", "golden hour"],
    [/\b(night|nighttime|after dark)\b/, "time_of_day", "night"],
    [/\b(morning|sunrise)\b/, "time_of_day", "early morning"],
    [/\b(slower|slow it down|less rushed)\b/, "pacing", "slow, unhurried pacing"],
    [/\b(faster|speed it up|more energy|punchier)\b/, "pacing", "fast, energetic pacing"],
    [/\b(no|remove|without)\b.*\b(text|subtitles|captions|words)\b/, "avoid", "on-screen text"],
    [/\b(no|remove|without)\b.*\b(logo|logos|watermark)\b/, "avoid", "logos"],
    [/\b(no|remove|without)\b.*\bmusic\b/, "avoid", "music"],
    [/\b(quieter|less noise|too loud)\b/, "audio", "quiet room tone, soft ambience"],
    [/\b(cartoon|animated|pixar|3d animation)\b/, "style", "stylized 3D animation, soft shading"],
    [/\b(realistic|photoreal|live action)\b/, "style", "photorealistic live action, natural color"],
    [/\b(film look|cinematic|anamorphic)\b/, "lens", "anamorphic lens, shallow depth of field"]];
  var FORMATS = { ad: ["Hook: stop the scroll", "Problem", "Product or service in action", "Proof or payoff", "Offer and call to action"],
    trailer: ["Cold open", "World and hero", "Inciting moment", "Rising stakes montage", "Title card and tagline"],
    music_video: ["Intro mood", "Verse performance", "Story cutaway", "Chorus energy", "Outro image"],
    explainer: ["The question", "Why it matters", "How it works", "Example", "Next step"], social: ["Hook", "Twist", "Payoff"] };

  var S = { p: {}, used: {}, jobs: {} };
  try { var saved = JSON.parse(localStorage.getItem("mws_mock") || "null"); if (saved && saved.p) S = saved; } catch (e) {}
  function save() { try { localStorage.setItem("mws_mock", JSON.stringify(S)); } catch (e) {} }
  function now() { return new Date().toISOString().slice(0, 19) + "+00:00"; }
  function id(p) { return p + "_" + Math.random().toString(36).slice(2, 12); }
  function E(status, code, message, extra) { var e = new Error(message); e.status = status; e.body = Object.assign({ error: code, message: message }, extra || {}); return e; }
  function cost(model, res, audio, secs, takes) { var r = RATES[model + "|" + res + "|" + (audio ? 1 : 0)]; return Math.round((r == null ? 0.4 : r) * secs * (takes || 1) * 100) / 100; }
  function credits(usd, kind) { if (usd <= 0) return 0; return Math.ceil(Math.round(usd * (MULT[kind] || 2.5) / CREDIT_USD * 1e6) / 1e6); }
  function mod(text) { if (BLOCK.test(text || "")) throw E(422, "prompt_blocked", "Blocked by the safety pre-check (real people, sexual or violent content). Nothing was charged."); }
  function log(pr, ev, kw) { var r = Object.assign({ ts_utc: now(), event: ev }, kw || {}); pr.log.push(r); return r; }
  function P(pid) { var pr = S.p[pid]; if (!pr) throw E(404, "not_found", "Unknown project."); return pr; }
  function SH(pr, sid) { var s = pr.shots[sid]; if (!s) throw E(404, "not_found", "Unknown shot."); return s; }
  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
  function render(f) {
    var parts = [];
    if (f.camera) parts.push(f.camera);
    if (f.subject) parts.push(f.subject);
    if (f.action) parts.push(f.action);
    if (f.expression) parts.push("expression: " + f.expression);
    var place = [f.setting, f.time_of_day].filter(Boolean).join(", "); if (place) parts.push(place);
    ["lighting", "lens", "pacing", "style"].forEach(function (k) { if (f[k]) parts.push(f[k]); });
    var t = parts.length ? parts.map(function (p) { return cap(p.replace(/\.$/, "")); }).join(". ") + "." : "";
    if (f.dialogue) t += ' Dialogue: "' + f.dialogue + '"';
    if (f.audio) t += " Audio: " + f.audio.replace(/\.$/, "") + ".";
    return t.trim();
  }
  function fromScene(scene) {
    scene = (scene || "").trim().replace(/\s+/g, " ");
    var f = { subject: scene, style: "cinematic, natural color", avoid: [] };
    var m = scene.match(/\bAudio:\s*(.+)$/i);
    if (m) { f.audio = m[1].trim().replace(/\.$/, ""); f.subject = scene.slice(0, m.index).trim().replace(/\.$/, ""); }
    return f;
  }
  function diff(a, b) {
    var A = a.split(/\s+/).filter(Boolean), B = b.split(/\s+/).filter(Boolean), n = A.length, m = B.length, i, j;
    var L = []; for (i = 0; i <= n; i++) { L.push(new Array(m + 1).fill(0)); }
    for (i = n - 1; i >= 0; i--) for (j = m - 1; j >= 0; j--) L[i][j] = A[i] === B[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    var out = []; i = 0; j = 0;
    function push(op, w) { var l = out[out.length - 1]; if (l && l.op === op) l.text += " " + w; else out.push({ op: op, text: w }); }
    while (i < n && j < m) { if (A[i] === B[j]) { push("equal", A[i]); i++; j++; } else if (L[i + 1][j] >= L[i][j + 1]) { push("delete", A[i]); i++; } else { push("insert", B[j]); j++; } }
    while (i < n) push("delete", A[i++]); while (j < m) push("insert", B[j++]);
    return out;
  }
  function sign(q) { return "q_" + btoa(unescape(encodeURIComponent(JSON.stringify(q)))) + ".mock"; }
  function verify(qid) {
    var q; try { q = JSON.parse(decodeURIComponent(escape(atob(qid.slice(2).split(".")[0])))); } catch (e) { throw E(400, "bad_quote", "Quote not recognized. Get a new quote."); }
    if (Date.now() / 1000 > q.exp) throw E(409, "quote_expired", "That quote expired. Get a new one.");
    return q;
  }
  function useQuote(pr, qid, confirm, kind, target) {
    if (!confirm) throw E(428, "confirm_required", "Confirm the quote to continue. Nothing has been spent.");
    var q = verify(qid);
    if (q.pid !== pr.id || q.kind !== kind || q.target !== target) throw E(400, "bad_quote", "That quote is for something else.");
    if (S.used[qid]) throw E(409, "quote_used", "That quote was already used. Get a new one.");
    if (q.credits > pr.budget_credits - pr.spent_credits) throw E(402, "over_budget", "This would go over the project budget cap. Raise the cap or trim the shot.");
    S.used[qid] = 1; return q;
  }
  function charge(pr, q, detail, kw) { pr.spent_credits += q.credits; pr.provider_usd = Math.round((pr.provider_usd + q.usd) * 1e4) / 1e4; log(pr, "charged", Object.assign({ credits: q.credits, provider_usd: q.usd, detail: detail, model: q.model || "" }, kw || {})); }
  function summary(pid) {
    var pr = P(pid), out = JSON.parse(JSON.stringify(pr)); delete out.log;
    out.remaining_credits = pr.budget_credits - pr.spent_credits; out.credit_usd = CREDIT_USD;
    out.free_previews_left = Math.max(0, FREE_PREVIEWS - pr.free_previews_used);
    out.spend_log = pr.log.filter(function (r) { return /^(quoted|charged|refunded|free_preview|reroll_credit|reroll_used)$/.test(r.event); });
    return out;
  }

  var api = {
    plan: function (b) {
      var idea = (b.idea || "").trim(); if (!idea) throw E(400, "bad_plan", "Describe the idea in a sentence or two.");
      var len = Math.max(4, Math.min(+b.length_s || 30, 180)), takes = Math.max(1, Math.min(+b.takes || 2, 4)), n = Math.ceil(len / 8);
      var model = MODELS[b.quality] || MODELS.fast, base = FORMATS[b.format] || FORMATS.ad, shots = [];
      for (var i = 1; i <= n; i++) {
        var secs = (i < n || len % 8 === 0) ? 8 : Math.max(4, Math.min(8, 2 * Math.ceil((len % 8) / 2)));
        var usd = cost(model, "720p", true, secs, takes), beat = base[(i - 1) % base.length];
        shots.push({ n: i, beat: i === 1 ? beat + ": " + idea.replace(/\.$/, "") : beat, seconds: secs, aspect: b.aspect || "9:16", takes: takes, provider_usd: usd, credits: credits(usd, model), preview_provider_usd: cost(MODELS.fast, "720p", true, 4) });
      }
      var stills = n + (+b.characters || 0) * 3, stillsUsd = Math.round(stills * 0.04 * 100) / 100;
      var tot = shots.reduce(function (a, s) { return a + s.credits; }, 0) + credits(stillsUsd, "image");
      return { idea: idea, format: b.format, aspect: b.aspect, model: model, shots: shots, stills: stills, stills_provider_usd: stillsUsd,
        total_provider_usd: Math.round((shots.reduce(function (a, s) { return a + s.provider_usd; }, 0) + stillsUsd) * 100) / 100,
        total_credits: tot, total_price_usd: Math.round(tot * CREDIT_USD * 100) / 100, note: "Plan only. Nothing is generated or charged until you approve a quote." };
    },
    create: function (b) {
      var pid = id("p"), capc = b.budget_credits == null ? 300 : +b.budget_credits;
      S.p[pid] = { id: pid, name: (b.name || "Untitled project").slice(0, 120), owner: "studio", created: now(), budget_credits: capc, spent_credits: 0, reroll_credits: 0, free_previews_used: 0, house_usd: 0, provider_usd: 0, characters: {}, shots: {}, voices: {}, voice_lines: {}, takes: {}, exports: {}, log: [] };
      log(S.p[pid], "project_created", { detail: S.p[pid].name + "; budget cap " + capc + " credits" });
      return summary(pid);
    },
    budget: function (pr, b) { if (+b.budget_credits < pr.spent_credits) throw E(400, "bad_budget", "Cap can't be below what's already spent."); pr.budget_credits = +b.budget_credits; log(pr, "budget_changed", { detail: "cap now " + b.budget_credits + " credits" }); return summary(pr.id); },
    addChar: function (pr, b) {
      mod(b.description); var cid = id("c");
      pr.characters[cid] = { id: cid, name: (b.name || "Character").slice(0, 60), description: (b.description || "").slice(0, 1000), reference: b.reference_image_b64 ? "sha256:(browser)" : "", sheet: [], approved_still: "", locked: false };
      log(pr, "character_added", { detail: b.name + ": " + (b.description || "").slice(0, 200) }); return pr.characters[cid];
    },
    addShot: function (pr, b) {
      mod(b.scene_text); var sid = id("s"), f = fromScene(b.scene_text), p = render(f);
      pr.shots[sid] = { id: sid, n: Object.keys(pr.shots).length + 1, scene_text: b.scene_text, character_ids: b.character_ids || [], aspect: b.aspect || "16:9", seconds: +b.seconds || 8,
        versions: [{ v: 1, fields: f, prompt: p, negative: "", source: "scene text", note: "", diff: [], status: "approved", created: now() }], current: 1, start_still: "", still_approved: false, reroll_used: false };
      log(pr, "shot_added", { shot: sid, version: 1, prompt: p }); return pr.shots[sid];
    },
    note: function (pr, sid, b) {
      var sh = SH(pr, sid), note = (b.note || "").trim(); if (!note) throw E(400, "empty_note", "Write what you'd like changed.");
      var cur = sh.versions[sh.current - 1], f = JSON.parse(JSON.stringify(cur.fields)), nl = note.toLowerCase(), edits = {}, hit = false;
      RULES.forEach(function (r) { if (r[0].test(nl)) { hit = true; if (r[1] === "avoid") { f.avoid = f.avoid || []; if (f.avoid.indexOf(r[2]) < 0) f.avoid.push(r[2]); edits.avoid_add = f.avoid; } else if (!(r[1] in edits)) { edits[r[1]] = r[2]; f[r[1]] = r[2]; } } });
      var m = note.match(/\bsays?\s*[:"']\s*(.+?)["']?$/i); if (m) { hit = true; f.dialogue = m[1].replace(/^["']|["']$/g, ""); edits.dialogue = f.dialogue; }
      if (!hit) throw E(422, "note_not_understood", "Couldn't map that note to a field. Try naming what to change: expression, camera, lighting, time of day, pacing, style, audio or dialogue.");
      var p = render(f); mod(p);
      var ver = { v: sh.versions.length + 1, fields: f, prompt: p, negative: (f.avoid || []).join(", "), source: "director's note via rules-v1", note: note, edits: edits, diff: diff(cur.prompt, p), status: "proposed", created: now(), based_on: cur.v };
      sh.versions.push(ver); log(pr, "version_proposed", { shot: sid, version: ver.v, prompt: p, detail: "note: " + note }); return ver;
    },
    approve: function (pr, sid, b) { var sh = SH(pr, sid), v = +b.version; if (!sh.versions[v - 1]) throw E(404, "not_found", "Unknown version."); sh.versions[v - 1].status = "approved"; sh.current = v; sh.still_approved = false; log(pr, "version_approved", { shot: sid, version: v, prompt: sh.versions[v - 1].prompt }); return sh; },
    revert: function (pr, sid, b) {
      var sh = SH(pr, sid), v = +b.version, src = sh.versions[v - 1]; if (!src) throw E(404, "not_found", "Unknown version.");
      var cur = sh.versions[sh.current - 1], nv = Object.assign({}, src, { v: sh.versions.length + 1, source: "revert to v" + v, note: "", diff: diff(cur.prompt, src.prompt), status: "approved", created: now(), based_on: v });
      sh.versions.push(nv); sh.current = nv.v; sh.still_approved = false; log(pr, "version_reverted", { shot: sid, version: nv.v, detail: "copy of v" + v }); return sh;
    },
    quote: function (pr, b) {
      var kind = b.kind, target = b.target || "", lines = [], q = { pid: pr.id, kind: kind, target: target, nonce: id("n"), exp: Math.floor(Date.now() / 1000) + TTL }, usd, cr;
      if (kind === "preview" || kind === "full") {
        var sh = SH(pr, target), ver = sh.versions[sh.current - 1];
        if (ver.status !== "approved") throw E(409, "not_approved", "Approve the prompt version before rendering.");
        var unlocked = sh.character_ids.filter(function (c) { return !pr.characters[c].locked; }).map(function (c) { return pr.characters[c].name; });
        if (unlocked.length) throw E(409, "character_not_locked", "Lock these characters first: " + unlocked.join(", "));
        if (kind === "full" && sh.character_ids.length && !sh.still_approved) throw E(409, "still_not_approved", "Approve the shot's start still first (Character Lock).");
        var model, secs, res, aud, takes, free = false;
        if (kind === "preview") { model = MODELS.fast; secs = 4; res = "720p"; aud = true; takes = 1; free = pr.free_previews_used < FREE_PREVIEWS; }
        else { model = MODELS[b.quality] || MODELS.fast; secs = sh.seconds; res = b.resolution || "720p"; aud = b.audio !== false; takes = Math.max(1, Math.min(+b.takes || 1, 4));
          if (res === "1080p" && secs !== 8) throw E(400, "bad_resolution", "1080p needs an 8-second shot."); }
        usd = cost(model, res, aud, secs, takes); cr = free ? 0 : credits(usd, model);
        var rr = 0; if (kind === "full" && pr.reroll_credits > 0) { rr = Math.min(pr.reroll_credits, cr); cr -= rr; }
        lines.push({ item: (kind === "preview" ? "Preview" : "Full render") + ": shot " + sh.n + " v" + sh.current, math: secs + "s x " + model + " x " + takes + " take(s)", provider_usd: usd, credits: cr, free: free, reroll_credit_applied: rr });
        Object.assign(q, { version: sh.current, model: model, secs: secs, res: res, audio: aud, takes: takes, reroll: rr, free: free });
      } else if (kind === "cast_sheet" || kind === "shot_still") {
        var n = kind === "cast_sheet" ? 3 : 1; usd = Math.round(n * 0.04 * 100) / 100; cr = credits(usd, "image");
        lines.push({ item: n === 3 ? "Cast sheet (3 stills)" : "Shot start still", math: n + " x still", provider_usd: usd, credits: cr });
      } else if (kind === "voiceover") {
        if (!pr.voices[b.voice_id]) throw E(404, "not_found", "Unknown voice.");
        var text = (b.text || "").trim(); if (!text || text.length > 5000) throw E(400, "bad_text", "Voiceover script must be 1 to 5,000 characters."); mod(text);
        usd = 0; cr = 1; lines.push({ item: "Voiceover", math: text.length + " characters x mock", provider_usd: 0, credits: 1 }); q.voice_id = b.voice_id; q.text = text;
      } else if (kind === "export") {
        var es = Math.max(1, +b.export_seconds || 1); usd = 0; cr = Math.max(1, Math.ceil(es * 2 / 60));
        lines.push({ item: "Finished export (stitch, voice, music, captions, watermark)", math: es + "s of timeline", provider_usd: 0, credits: cr });
      } else throw E(400, "bad_kind", "Unknown quote kind.");
      var total = lines.reduce(function (a, l) { return a + l.credits; }, 0), rem = pr.budget_credits - pr.spent_credits;
      q.credits = total; q.usd = lines.reduce(function (a, l) { return a + l.provider_usd; }, 0);
      log(pr, "quoted", { shot: /preview|full|shot_still/.test(kind) ? target : "", version: q.version || "", model: q.model || "", credits: total, provider_usd: q.usd, detail: kind + "; " + lines[0].math });
      return { quote_id: sign(q), kind: kind, lines: lines, total_credits: total, total_price_usd: Math.round(total * CREDIT_USD * 100) / 100, provider_usd: q.usd, budget_credits: pr.budget_credits, remaining_credits: rem, over_budget: total > rem, expires_in_seconds: TTL, policy: "Technical failures are refunded. Safety-blocked videos and unwanted takes are not." };
    },
    sheet: function (pr, cid, b) { var ch = pr.characters[cid]; if (!ch) throw E(404, "not_found", "Unknown character."); var q = useQuote(pr, b.quote_id, b.confirm, "cast_sheet", cid); ch.sheet = ["front", "three-quarter", "profile"].map(function (v) { return "mock://" + cid + "/" + v; }); charge(pr, q, "cast sheet for " + ch.name); return ch; },
    lock: function (pr, cid, b) { var ch = pr.characters[cid]; if (!ch || !ch.sheet.length) throw E(400, "no_sheet", "Generate the cast sheet, then pick a still to lock."); ch.approved_still = ch.sheet[+b.still_index || 0]; ch.locked = true; log(pr, "character_locked", { detail: ch.name, ref: ch.approved_still }); return ch; },
    still: function (pr, sid, b) { var sh = SH(pr, sid), q = useQuote(pr, b.quote_id, b.confirm, "shot_still", sid); sh.start_still = "mock://" + sid + "/still_v" + sh.current; sh.still_approved = false; charge(pr, q, "start still for shot " + sh.n, { shot: sid, version: sh.current }); return sh; },
    stillOk: function (pr, sid) { var sh = SH(pr, sid); if (!sh.start_still) throw E(400, "no_still", "Make the start still first."); sh.still_approved = true; log(pr, "still_approved", { shot: sid, version: sh.current, ref: sh.start_still }); return sh; },
    render: function (pr, sid, b) {
      var sh = SH(pr, sid), q0 = verify(b.quote_id || ""), q = useQuote(pr, b.quote_id, b.confirm, q0.kind, sid);
      if (q.version !== sh.current) throw E(409, "stale_quote", "The prompt changed after this quote. Get a new quote.");
      var ver = sh.versions[sh.current - 1]; mod(ver.prompt);
      var per = Math.floor(q.credits / q.takes), rem = q.credits - per * q.takes, out = [];
      for (var t = 0; t < q.takes; t++) {
        var tid = id("t"), cr = per + (t === 0 ? rem : 0), pu = Math.round(q.usd / q.takes * 1e4) / 1e4;
        S.jobs[tid] = { start: Date.now(), filter: /\[\[mock-filter\]\]/.test(ver.prompt) };
        var take = { id: tid, shot: sid, version: sh.current, kind: q.kind, job_id: "mock_" + tid, model: q.model, credits: cr, provider_usd: pu, free: !!q.free, status: "running", created: now(), flag: "" };
        pr.takes[tid] = take; out.push(take); pr.spent_credits += cr; pr.provider_usd += pu; if (take.free) pr.house_usd = Math.round((pr.house_usd + pu) * 1e4) / 1e4;
        log(pr, take.free ? "free_preview" : "charged", { shot: sid, version: sh.current, model: q.model, prompt: ver.prompt, credits: cr, provider_usd: pu, ref: tid, detail: q.kind + " take " + (t + 1) + "/" + q.takes });
      }
      if (q.kind === "preview" && q.free) pr.free_previews_used++;
      if (q.reroll) { pr.reroll_credits -= q.reroll; log(pr, "reroll_used", { shot: sid, credits: q.reroll, detail: "re-roll credit applied" }); }
      return { takes: out, spent_credits: pr.spent_credits, remaining_credits: pr.budget_credits - pr.spent_credits };
    },
    poll: function (pr, tid) {
      var tk = pr.takes[tid]; if (!tk) throw E(404, "not_found", "Unknown take.");
      if (tk.status !== "running") return tk;
      var j = S.jobs[tid] || { start: 0 }; if (Date.now() - j.start < 3000) return tk;
      if (j.filter) { tk.status = "filtered"; tk.message = "Mock safety filter: no video returned.";
        log(pr, "flagged", { shot: tk.shot, version: tk.version, ref: tid, detail: "safety block (not refunded)" });
      } else { tk.status = "done"; tk.video_uri = "mock://" + tid + ".mp4"; tk.signed_url = ""; log(pr, "take_done", { shot: tk.shot, version: tk.version, model: tk.model, ref: tk.video_uri }); }
      return tk;
    },
    flag: function (pr, tid, b) {
      var tk = pr.takes[tid]; if (!tk) throw E(404, "not_found", "Unknown take."); var sh = SH(pr, tk.shot), msg;
      if (tk.status !== "done") throw E(409, "not_done", "Only finished takes can be flagged.");
      if (tk.flag) throw E(409, "already_flagged", "This take was already flagged.");
      tk.flag = b.reason;
      if (b.reason === "technical") { msg = "Logged for our team. Finished takes aren't refunded; adjust with a director's note and check it with a cheap preview."; log(pr, "flagged", { shot: sh.id, ref: tid, detail: "technical: " + (b.detail || "") }); }
      else { msg = "Creative changes go through director's notes: write what to change, approve the new version, and check it with a preview before the full render."; log(pr, "flagged", { shot: sh.id, ref: tid, detail: "creative" }); }
      return { take: tk, message: msg, reroll_credits: pr.reroll_credits };
    },
    addVoice: function (pr, b) {
      var kind = b.kind, rec;
      if (kind !== "stock") {
        var c = b.consent || {};
        if (!c.agreed) throw E(400, "consent_required", "Tick the consent box before uploading or recording a voice.");
        if (c.basis !== "own_voice" && c.basis !== "written_permission") throw E(400, "consent_required", "Choose 'my own voice' or 'I have written permission'.");
        if (c.basis === "written_permission" && !(c.speaker_name || "").trim()) throw E(400, "consent_required", "Name the person who gave written permission.");
        if (!b.audio_b64) throw E(400, "no_audio", "Add a voice sample.");
      }
      var vid = id("v");
      if (kind === "stock") { var sv = STOCK.filter(function (v) { return v.id === b.stock_id; })[0]; if (!sv) throw E(400, "bad_voice", "Unknown stock voice."); rec = { id: vid, kind: kind, name: sv.name, stock_id: sv.id, provider: "mock" }; }
      else { rec = { id: vid, kind: kind, name: (b.name || "Custom voice").slice(0, 60), provider: "mock", sample: "sha256:(browser)", consent: Object.assign({}, b.consent, { ts_utc: now() }) };
        log(pr, "voice_consent", { ref: rec.sample, detail: kind + "; basis=" + b.consent.basis + "; speaker=" + (b.consent.speaker_name || "") + "; text: " + CONSENT }); }
      pr.voices[vid] = rec; log(pr, "voice_added", { detail: rec.name + " (" + kind + ")", ref: vid }); return rec;
    },
    vo: function (pr, b) {
      var q = useQuote(pr, b.quote_id, b.confirm, "voiceover", "");
      if (q.voice_id !== b.voice_id || q.text !== (b.text || "").trim()) { delete S.used[b.quote_id]; throw E(400, "bad_quote", "Script or voice changed after the quote. Get a new quote."); }
      var lid = id("vo"), secs = Math.max(1, Math.round((b.text || "").split(/\s+/).length / 2.6 * 10) / 10);
      pr.voice_lines[lid] = { id: lid, voice_id: b.voice_id, text: b.text.trim(), audio_uri: "mock://" + lid + ".wav", seconds: secs, provider: "mock" };
      charge(pr, q, "voiceover " + secs + "s with " + pr.voices[b.voice_id].name, { prompt: b.text.trim().slice(0, 500), ref: lid }); return pr.voice_lines[lid];
    },
    exp: function (pr, b) {
      var q = useQuote(pr, b.quote_id, b.confirm, "export", ""), ids = b.take_ids || [];
      if (!ids.length) { delete S.used[b.quote_id]; throw E(400, "bad_timeline", "timeline needs at least one shot"); }
      ids.forEach(function (t) { if (!pr.takes[t] || pr.takes[t].status !== "done") { delete S.used[b.quote_id]; throw E(409, "take_not_done", "All takes in the timeline must be finished."); } });
      var eid = id("e"), wh = b.aspect === "9:16" ? "1080:1920" : "1920:1080";
      var cmd = ["ffmpeg", "-y"];
      ids.forEach(function (t) { cmd.push("-i", pr.takes[t].video_uri); });
      cmd = cmd.concat(["-filter_complex", "scale=" + wh + " ... concat=n=" + ids.length + ":v=1:a=1" + (b.captions ? ",subtitles" : "") + (b.watermark ? ",overlay(watermark)" : ""), "-metadata", "comment=Contains AI-generated video and audio (Madwackd Studio)", "/tmp/" + eid + ".mp4"]);
      var rec = { id: eid, aspect: b.aspect, takes: ids, voice_line: b.voice_line_id || "", status: "planned", ffmpeg: cmd, ai_label: true, created: now() };
      pr.exports[eid] = rec; charge(pr, q, "export " + b.aspect + ", " + ids.length + " shot(s)", { ref: eid }); return rec;
    }
  };

  var COLS = ["ts_utc", "event", "shot", "version", "model", "prompt", "detail", "credits", "provider_usd", "ref"];
  function csv(pr) { return COLS.join(",") + "\r\n" + pr.log.map(function (r) { return COLS.map(function (c) { var v = r[c] == null ? "" : String(r[c]); return /[",\r\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(","); }).join("\r\n") + "\r\n"; }
  function pdf(pr) {
    function esc(s) { return String(s).replace(/[^\x20-\x7e]/g, "?").replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)"); }
    function wrap(t, w) { var o = [], l = ""; String(t).split(" ").forEach(function (x) { if ((l + " " + x).length > w) { o.push(l); l = x; } else l = (l + " " + x).trim(); }); o.push(l); return o; }
    var lines = ["Madwackd Studio - Rights Pack", "", "Project: " + pr.name + " (" + pr.id + ")", "Credits spent: " + pr.spent_credits + " of " + pr.budget_credits, "Mock mode export from the browser. Video model IDs are listed per line.", ""];
    pr.log.forEach(function (r) { lines = lines.concat(wrap(r.ts_utc + "  " + r.event.toUpperCase() + "  shot=" + (r.shot || "") + " v=" + (r.version || "") + " model=" + (r.model || "") + " credits=" + (r.credits || ""), 95)); if (r.prompt) lines = lines.concat(wrap("   prompt: " + r.prompt, 95)); if (r.detail) lines = lines.concat(wrap("   " + r.detail, 95)); });
    var pages = []; for (var i = 0; i < lines.length; i += 58) pages.push(lines.slice(i, i + 58));
    var objs = ["<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [" + pages.map(function (_, i) { return (3 + i * 2) + " 0 R"; }).join(" ") + "] /Count " + pages.length + " >>"], font = 3 + pages.length * 2;
    pages.forEach(function (pg, i) { var st = "BT /F1 9 Tf 40 800 Td 12 TL " + pg.map(function (l) { return "(" + esc(l) + ") '"; }).join(" ") + " ET";
      objs.push("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents " + (4 + i * 2) + " 0 R /Resources << /Font << /F1 " + font + " 0 R >> >> >>");
      objs.push("<< /Length " + st.length + " >>\nstream\n" + st + "\nendstream"); });
    objs.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
    var out = "%PDF-1.4\n", offs = [];
    objs.forEach(function (o, i) { offs.push(out.length); out += (i + 1) + " 0 obj\n" + o + "\nendobj\n"; });
    var x = out.length; out += "xref\n0 " + (objs.length + 1) + "\n0000000000 65535 f \n" + offs.map(function (o) { return ("000000000" + o).slice(-10) + " 00000 n \n"; }).join("");
    return out + "trailer\n<< /Size " + (objs.length + 1) + " /Root 1 0 R >>\nstartxref\n" + x + "\n%%EOF\n";
  }

  function handle(method, path, body) {
    var parts = path.split("?")[0].replace(/^\/+|\/+$/g, "").split("/"), b = body || {};
    try {
      var res = (function () {
        if (method === "GET" && path === "/voices/stock") return [200, { voices: STOCK, consent_text: CONSENT }];
        if (method === "POST" && path === "/producer/plan") return [200, api.plan(b)];
        if (parts[0] !== "projects") throw E(404, "not_found", "No such route.");
        if (method === "POST" && parts.length === 1) return [201, api.create(b)];
        var pr = P(parts[1]), rest = parts.slice(2), r = rest.join("/");
        if (method === "GET") {
          if (!rest.length) return [200, summary(pr.id)];
          if (r === "rights-pack.csv") return [200, csv(pr), "text/csv"];
          if (r === "rights-pack.pdf") return [200, pdf(pr), "application/pdf"];
          if (rest[0] === "takes") return [200, api.poll(pr, rest[1])];
        } else {
          if (r === "budget") return [200, api.budget(pr, b)];
          if (r === "quote") return [200, api.quote(pr, b)];
          if (r === "characters") return [201, api.addChar(pr, b)];
          if (rest[0] === "characters" && rest[2] === "sheet") return [200, api.sheet(pr, rest[1], b)];
          if (rest[0] === "characters" && rest[2] === "approve") return [200, api.lock(pr, rest[1], b)];
          if (r === "shots") return [201, api.addShot(pr, b)];
          if (rest[0] === "shots") {
            var act = rest.slice(2).join("/");
            if (act === "notes") return [200, api.note(pr, rest[1], b)];
            if (act === "approve") return [200, api.approve(pr, rest[1], b)];
            if (act === "revert") return [200, api.revert(pr, rest[1], b)];
            if (act === "still") return [200, api.still(pr, rest[1], b)];
            if (act === "still/approve") return [200, api.stillOk(pr, rest[1])];
            if (act === "render") return [202, api.render(pr, rest[1], b)];
          }
          if (rest[0] === "takes" && rest[2] === "flag") return [200, api.flag(pr, rest[1], b)];
          if (r === "voices") return [201, api.addVoice(pr, b)];
          if (r === "voiceover") return [200, api.vo(pr, b)];
          if (r === "export") return [200, api.exp(pr, b)];
        }
        throw E(404, "not_found", "No such route.");
      })();
      save();
      return Promise.resolve({ status: res[0], json: res[2] ? null : res[1], text: res[2] ? res[1] : null, type: res[2] || "json" });
    } catch (e) {
      save();
      if (!e.status) { console.warn(e); return Promise.resolve({ status: 500, json: { error: "mock_error", message: String(e.message || e) } }); }
      return Promise.resolve({ status: e.status, json: e.body });
    }
  }
  window.MWStudioMock = { handle: handle, reset: function () { S = { p: {}, used: {}, jobs: {} }; save(); } };
})();
