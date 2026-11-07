/* Madwackd Studio Creator Dashboard: page wiring.
   The tier is read from window.MW_USER_TIER (set by the site after sign-in).
   A ?tier= override works ONLY on localhost / 127.0.0.1 for demos.
   THIS IS UI ONLY. The server must enforce every plan limit; nothing here is a security boundary. */
(function (root) {
  'use strict';
  var D = root.MWDASH, doc = root.document, A = D.audio;
  var $ = function (id) { return doc.getElementById(id); };
  var tierKey = D.resolveTier({ hostname: root.location.hostname, search: root.location.search, userTier: root.MW_USER_TIER });
  var T = D.TIERS[tierKey];
  var uid = 1;
  var S = { tier: tierKey, tracks: [], master: D.UNITY_FADER, autoDuck: false, playhead: 0 };
  var playing = false, exporting = false, rec = null, micLevel = null, rafId = 0;
  var rows = {};

  /* ---------- status + single upgrade prompt ---------- */
  function notify(msg) { $('status').textContent = msg; }
  function upgrade(feature) {
    var n = D.upgradeNote(feature, tierKey); if (!n) return;
    var box = $('upgrade'); $('upgrade-text').textContent = n.text; box.hidden = false;
    $('upgrade-link').textContent = 'See plans'; $('upgrade-link').href = '/pricing/';
    box.dataset.feature = feature;
  }
  $('upgrade-close').addEventListener('click', function () { $('upgrade').hidden = true; });

  /* ---------- tracks ---------- */
  function addTrack(kind, name) {
    var t = { id: 't' + (uid++), kind: kind, name: name, fader: kind === 'music' ? 0.8 : D.UNITY_FADER, pan: 0, mute: false, solo: false, clips: [] };
    S.tracks.push(t); buildRow(t); return t;
  }
  function trackOf(kind) { return S.tracks.filter(function (t) { return t.kind === kind; })[0]; }
  function buildRow(t) {
    var li = doc.createElement('li'); li.className = 'strip kind-' + t.kind; li.id = 'row-' + t.id;
    function el(tag, cls, txt) { var e = doc.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
    var head = el('div', 'strip-head'); head.appendChild(el('h3', 'strip-name', t.name));
    var ms = el('div', 'strip-ms');
    var mute = el('button', 'btn-ms', 'M'); mute.type = 'button'; mute.setAttribute('aria-pressed', 'false'); mute.setAttribute('aria-label', 'Mute ' + t.name);
    var solo = el('button', 'btn-ms solo', 'S'); solo.type = 'button'; solo.setAttribute('aria-pressed', 'false'); solo.setAttribute('aria-label', 'Solo ' + t.name);
    mute.addEventListener('click', function () { t.mute = !t.mute; mute.setAttribute('aria-pressed', String(t.mute)); A.refreshLive(S); });
    solo.addEventListener('click', function () { t.solo = !t.solo; solo.setAttribute('aria-pressed', String(t.solo)); A.refreshLive(S); });
    ms.appendChild(mute); ms.appendChild(solo); head.appendChild(ms); li.appendChild(head);

    var meter = el('div', 'meter'); meter.setAttribute('role', 'img'); meter.setAttribute('aria-label', t.name + ' level meter');
    var fill = el('i'); meter.appendChild(fill); li.appendChild(meter);

    function slider(label, min, max, step, val, cls, on) {
      var w = el('label', 'ctl ' + cls); w.appendChild(el('span', null, label));
      var r = doc.createElement('input'); r.type = 'range'; r.min = min; r.max = max; r.step = step; r.value = val;
      r.addEventListener('input', function () { on(parseFloat(r.value)); A.refreshLive(S); });
      w.appendChild(r); return w;
    }
    li.appendChild(slider('Level', 0, 1, 0.01, t.fader, 'fader', function (v) { t.fader = v; }));
    li.appendChild(slider('Pan', -1, 1, 0.05, 0, 'pan', function (v) { t.pan = v; }));

    var acts = el('div', 'strip-acts');
    var lab = el('label', 'btn-file', 'Load audio');
    var inp = doc.createElement('input'); inp.type = 'file'; inp.accept = 'audio/*'; inp.className = 'sr-file';
    inp.setAttribute('aria-label', 'Load an audio file onto ' + t.name);
    inp.addEventListener('change', function () { if (inp.files[0]) loadAudio(t, inp.files[0]); inp.value = ''; });
    lab.appendChild(inp); acts.appendChild(lab);
    var rb = el('button', 'btn-rec', 'Record'); rb.type = 'button'; rb.setAttribute('aria-pressed', 'false');
    rb.addEventListener('click', function () { toggleRecord(t, rb); });
    acts.appendChild(rb); li.appendChild(acts);
    var clips = el('ul', 'clip-chips'); clips.setAttribute('aria-label', t.name + ' clips'); li.appendChild(clips);
    $('tracks').appendChild(li);
    rows[t.id] = { fill: fill, clips: clips, rec: rb };
  }
  function renderClips(t) {
    var ul = rows[t.id].clips; ul.textContent = '';
    t.clips.forEach(function (c, i) {
      var li = doc.createElement('li'); var s = doc.createElement('span');
      s.textContent = c.name + ' @ ' + c.start.toFixed(1) + ' s (' + c.buffer.duration.toFixed(1) + ' s)';
      var x = doc.createElement('button'); x.type = 'button'; x.className = 'btn-mini'; x.textContent = 'Remove'; x.setAttribute('aria-label', 'Remove ' + c.name + ' from ' + t.name);
      x.addEventListener('click', function () { t.clips.splice(i, 1); renderClips(t); updateDuration(); if (playing) restartAt(S.playhead); });
      li.appendChild(s); li.appendChild(x); ul.appendChild(li);
    });
  }
  function addClip(t, name, buffer, start) {
    t.clips.push({ id: 'k' + (uid++), name: name, buffer: buffer, start: start }); renderClips(t); updateDuration();
    if (playing) restartAt(S.playhead);
  }
  function loadAudio(t, file) {
    notify('Reading ' + file.name + '...');
    A.decodeFile(file).then(function (b) { addClip(t, file.name, b, S.playhead); notify('Added ' + file.name + ' to ' + t.name + ' at ' + D.fmtTime(S.playhead) + '.'); })
      .catch(function () { notify('Could not read that audio file. Try mp3, wav or m4a.'); });
  }
  function updateAddTrack() {
    var b = $('add-track'), ok = D.canAddTrack(tierKey, S.tracks.length);
    b.classList.toggle('is-locked', !ok);
    b.querySelector('.lbl').textContent = ok ? 'Add track' : 'Add track (more on a bigger plan)';
    b.setAttribute('aria-disabled', String(!ok));
  }
  $('add-track').addEventListener('click', function () {
    if (!D.canAddTrack(tierKey, S.tracks.length)) { upgrade('tracks'); return; }
    addTrack('extra', 'Audio ' + (S.tracks.length + 1)); updateAddTrack(); notify('Track added.');
  });

  /* ---------- mic recording ---------- */
  function toggleRecord(t, btn) {
    if (rec) { rec.stop(); return; }
    if (!navigator.mediaDevices || !root.MediaRecorder) { notify('Recording is not supported in this browser.'); return; }
    navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
      var chunks = [], mr = new MediaRecorder(stream), ac = A.getCtx(), src = ac.createMediaStreamSource(stream), an = ac.createAnalyser();
      an.fftSize = 1024; src.connect(an); var b = new Float32Array(1024), startPos = S.playhead, t0 = performance.now();
      micLevel = function () { an.getFloatTimeDomainData(b); var s = 0; for (var i = 0; i < b.length; i++) s += b[i] * b[i]; return { id: t.id, rms: Math.sqrt(s / b.length) }; };
      rec = { stop: function () { mr.stop(); }, t: t, t0: t0 };
      mr.ondataavailable = function (e) { if (e.data.size) chunks.push(e.data); };
      mr.onstop = function () {
        stream.getTracks().forEach(function (x) { x.stop(); }); src.disconnect(); rec = null; micLevel = null;
        btn.setAttribute('aria-pressed', 'false'); btn.textContent = 'Record'; $('rec-indicator').hidden = true; doc.body.classList.remove('is-recording');
        A.decodeBlob(new Blob(chunks, { type: mr.mimeType })).then(function (buf) { addClip(t, 'Recording', buf, startPos); notify('Recording added to ' + t.name + '.'); })
          .catch(function () { notify('Could not use that recording.'); });
      };
      mr.start(); btn.setAttribute('aria-pressed', 'true'); btn.textContent = 'Stop';
      $('rec-indicator').hidden = false; $('rec-track').textContent = t.name; doc.body.classList.add('is-recording'); notify('Recording ' + t.name + ' from your microphone.');
    }).catch(function () { notify('Microphone access was blocked. Allow it in your browser, or load an audio file instead.'); });
  }

  /* ---------- transport ---------- */
  function duration() { return Math.max(D.editor.total(), A.mixDuration(S)); }
  function updateDuration() {
    var d = duration(); $('t-seek').max = String(Math.max(0.1, d)); $('t-len').textContent = D.fmtTime(d); $('export-wav').disabled = A.mixDuration(S) <= 0;
  }
  function setT(t) { S.playhead = Math.max(0, t); $('t-seek').value = String(S.playhead); $('t-time').textContent = D.fmtTime(S.playhead); }
  function restartAt(t) { A.play(S, t); }
  function play() {
    if (exporting) return;
    var d = duration(); if (d <= 0) { notify('Nothing to play yet. Load a voice, add a sound or drop a video.'); return; }
    if (S.playhead >= d - 0.05) setT(0);
    A.getCtx(); A.play(S, S.playhead); playing = true; setPlayBtn();
  }
  function stopPlayback() { if (!playing && !A.isPlaying()) return; A.stop(); playing = false; D.editor.pausePreview(); setPlayBtn(); }
  function setPlayBtn() { var b = $('t-play'); b.setAttribute('aria-pressed', String(playing)); b.querySelector('.lbl').textContent = playing ? 'Pause' : 'Play'; }
  $('t-play').addEventListener('click', function () { if (playing) { stopPlayback(); D.editor.seek(S.playhead); } else play(); });
  $('t-stop').addEventListener('click', function () { stopPlayback(); setT(0); D.editor.seek(0); });
  $('t-seek').addEventListener('input', function () {
    var v = parseFloat($('t-seek').value) || 0; setT(v); if (playing) restartAt(v); D.editor.seek(v);
  });

  function loop() {
    if (playing) {
      var t = A.nowTime(S);
      if (t != null) {
        if (t >= duration()) { stopPlayback(); setT(duration()); D.editor.seek(S.playhead); notify('Reached the end.'); }
        else { setT(t); D.editor.tick(t); }
      }
    }
    var lv = A.levels(), mic = micLevel && micLevel();
    S.tracks.forEach(function (t) {
      var r = lv[t.id] || 0; if (mic && mic.id === t.id) r = mic.rms;
      rows[t.id].fill.style.width = (D.rmsToLeds(r, 12) / 12 * 100) + '%';
    });
    $('master-fill').style.width = (D.rmsToLeds(lv.master || 0, 12) / 12 * 100) + '%';
    if (rec) { var sec = Math.floor((performance.now() - rec.t0) / 1000); $('rec-time').textContent = Math.floor(sec / 60) + ':' + (sec % 60 < 10 ? '0' : '') + sec % 60; }
    rafId = root.requestAnimationFrame(loop);
  }

  /* ---------- master / duck / WAV ---------- */
  $('master-fader').addEventListener('input', function () { S.master = parseFloat($('master-fader').value); A.refreshLive(S); });
  function setDuck(on) {
    S.autoDuck = on; $('duck-toggle').setAttribute('aria-pressed', String(on));
    $('duck-toggle').querySelector('.lbl').textContent = on ? 'Auto-duck: ON' : 'Auto-duck: off';
    if (playing) restartAt(S.playhead);
  }
  $('duck-toggle').addEventListener('click', function () {
    if (!D.can(tierKey, 'autoDuck')) { upgrade('autoDuck'); return; }
    var on = !S.autoDuck; setDuck(on);
    notify(on ? 'Auto-duck on: music dips under your voice.' : 'Auto-duck off.');
  });
  $('export-wav').addEventListener('click', function () {
    var d = A.mixDuration(S); if (d <= 0) { notify('Add some audio first.'); return; }
    notify('Rendering your mix...'); $('export-wav').disabled = true;
    A.renderMix(S, d + 0.2).then(function (b) {
      var blob = A.bufferToWavBlob(b), a = $('wav-link'); if (a.dataset.url) URL.revokeObjectURL(a.dataset.url);
      a.href = URL.createObjectURL(blob); a.dataset.url = a.href; a.download = 'madwackd-mix.wav'; a.hidden = false;
      a.textContent = 'Download mix.wav (' + (blob.size / 1048576).toFixed(1) + ' MB)'; notify('Mix ready. Use the download link.');
    }).catch(function () { notify('Could not render the mix.'); }).then(function () { $('export-wav').disabled = false; });
  });

  /* ---------- sound library ---------- */
  function buildSounds() {
    var grid = $('sound-grid'); grid.textContent = '';
    A.SOUNDS.forEach(function (s, i) {
      var ok = D.soundUnlocked(tierKey, i), li = doc.createElement('li'); li.className = 'sound' + (ok ? '' : ' is-locked');
      var nm = doc.createElement('span'); nm.className = 'sound-name'; nm.textContent = s.name;
      var meta = doc.createElement('span'); meta.className = 'sound-meta'; meta.textContent = s.dur.toFixed(1) + ' s';
      li.appendChild(nm); li.appendChild(meta);
      var pv = doc.createElement('button'); pv.type = 'button'; pv.className = 'btn-mini'; pv.textContent = ok ? 'Preview' : 'Locked';
      pv.setAttribute('aria-label', (ok ? 'Preview ' : 'Locked sound: ') + s.name);
      var ad = doc.createElement('button'); ad.type = 'button'; ad.className = 'btn-mini add'; ad.textContent = ok ? 'Add at playhead' : 'Unlock';
      ad.setAttribute('aria-label', (ok ? 'Add ' + s.name + ' to the SFX track at the playhead' : 'Unlock ' + s.name));
      if (!ok) { pv.insertBefore(lockIcon(), pv.firstChild); }
      pv.addEventListener('click', function () { if (!ok) { upgrade('sounds'); return; } A.previewSound(s).catch(function () { notify('Could not play that sound.'); }); });
      ad.addEventListener('click', function () {
        if (!ok) { upgrade('sounds'); return; }
        var t = trackOf('sfx'); A.renderSound(s).then(function (b) { addClip(t, s.name, b, S.playhead); notify('Added ' + s.name + ' to the SFX track at ' + D.fmtTime(S.playhead) + '.'); });
      });
      li.appendChild(pv); li.appendChild(ad); grid.appendChild(li);
    });
  }
  function lockIcon() {
    var ns = 'http://www.w3.org/2000/svg', s = doc.createElementNS(ns, 'svg'); s.setAttribute('class', 'ico'); s.setAttribute('aria-hidden', 'true'); s.setAttribute('viewBox', '0 0 24 24');
    var u = doc.createElementNS(ns, 'use'); u.setAttribute('href', '#i-lock'); s.appendChild(u); return s;
  }

  /* ---------- studio voices (stub; no network) ---------- */
  function requestStudioVoice(text, voiceId) {
    return Promise.resolve({ ok: false, status: 'launching', message: 'Studio voices are launching soon. Nothing was generated and nothing was used from your plan.' });
  }
  D.requestStudioVoice = requestStudioVoice;
  $('sv-go').addEventListener('click', function () {
    var txt = $('sv-text').value.trim(); if (!txt) { notify('Type what the voice should say.'); $('sv-text').focus(); return; }
    var v = doc.querySelector('input[name="sv-voice"]:checked');
    requestStudioVoice(txt, v ? v.value : '').then(function (r) { $('sv-msg').textContent = r.message; notify(r.message); if (!D.can(tierKey, 'talkingProducer')) upgrade('voices'); });
  });

  /* ---------- tabs, presets, plan, producer ---------- */
  function showPanel(name) {
    Array.prototype.forEach.call(doc.querySelectorAll('[role="tab"]'), function (b) { var on = b.dataset.panel === name; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; });
    Array.prototype.forEach.call(doc.querySelectorAll('.panel'), function (p) { p.classList.toggle('is-active', p.id === 'panel-' + name); });
  }
  Array.prototype.forEach.call(doc.querySelectorAll('[role="tab"]'), function (b, i, all) {
    b.addEventListener('click', function () { showPanel(b.dataset.panel); });
    b.addEventListener('keydown', function (e) {
      var n = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : null; if (n == null) return;
      n = (n + all.length) % all.length; all[n].focus(); showPanel(all[n].dataset.panel); e.preventDefault();
    });
  });
  function hint(title, steps) {
    var box = $('preset-hint'); box.hidden = false; $('preset-title').textContent = title;
    var ol = $('preset-steps'); ol.textContent = ''; steps.forEach(function (s) { var li = doc.createElement('li'); li.textContent = s; ol.appendChild(li); });
  }
  function setFader(kind, v) { var t = trackOf(kind), r = rows[t.id]; t.fader = v; doc.querySelector('#row-' + t.id + ' .fader input').value = v; }
  function preset(name) {
    if (name === 'voicemusic') {
      setFader('voice', D.UNITY_FADER); setFader('music', 0.6);
      if (D.can(tierKey, 'autoDuck')) setDuck(true);
      A.refreshLive(S); showPanel('mixer');
      hint('Voice + music ad', ['Press Record on the Voice track, or Load audio with your voiceover.', 'Load a music file on the Music track.', D.can(tierKey, 'autoDuck') ? 'Auto-duck is on: music dips under your voice.' : 'Lower the Music level so your voice stays clear.', 'Press Play to listen, then Export mix.']);
      notify('Voice + music ad set up: voice up front, music underneath.');
    } else {
      setFader('music', 0.95); setFader('voice', 0.8);
      D.editor.state.origSound = false; $('orig-sound').checked = false;
      A.refreshLive(S); showPanel('editor');
      hint('Music video cut', ['Drop your video clips in the editor.', 'Trim and reorder the clips to the beat.', 'Load your song on the Music track in the mixer.', 'Original clip sound is off. Press Export video.']);
      notify('Music video cut set up: music loud, original clip sound off.');
    }
  }
  Array.prototype.forEach.call(doc.querySelectorAll('[data-preset]'), function (b) { b.addEventListener('click', function () { preset(b.dataset.preset); }); });
  $('ask-producer').addEventListener('click', function () { root.dispatchEvent(new CustomEvent('mw:guide-open', { detail: { topic: 'dashboard' } })); });

  function planList() {
    var ul = $('plan-list'); ul.textContent = '';
    function row(label, ok, extra) { var li = doc.createElement('li'); li.className = ok ? 'on' : 'off'; li.textContent = label; if (extra) { var s = doc.createElement('span'); s.textContent = extra; li.appendChild(s); } ul.appendChild(li); }
    var inf = function (n) { return isFinite(n) ? String(n) : 'Unlimited'; };
    row('Tracks', true, inf(T.tracks)); row('Sound library', true, isFinite(T.sounds) ? T.sounds + ' sounds' : 'All sounds');
    row('Max video length', true, isFinite(T.maxSeconds) ? T.maxSeconds + ' s' : 'Unlimited');
    row('Export size', true, T.exportRes + 'p' + (T.watermark ? ', watermark' : ', no watermark'));
    row('Burned-in captions', T.captions); row('Auto-duck', T.autoDuck); row('Brand kit', T.brandKit, T.multiBrandKits ? 'Multiple kits' : '');
    row('Projects', true, inf(T.projects)); if (T.seats > 1) row('Team seats', true, String(T.seats));
    row('Studio voice minutes', T.studioVoiceMin > 0, T.studioVoiceMin > 0 ? T.studioVoiceMin + ' / mo (when launched)' : '');
  }
  function applyTier() {
    $('plan-badge').textContent = T.label + (T.price ? ' $' + T.price + '/mo' : '');
    $('plan-badge').className = 'plan-badge plan-' + tierKey;
    $('duck-toggle').classList.toggle('is-locked', !T.autoDuck);
    $('brand-box').classList.toggle('is-locked', !T.brandKit);
    $('brand-note').textContent = T.brandKit ? (T.multiBrandKits ? 'Multiple brand kits are on your plan.' : 'Logo and color are added to every export.') : 'Locked on your plan. Pro unlocks your brand kit: logo and colors on every export.';
    $('cap-opt').textContent = T.captions ? 'Caption (burned in)' : 'Caption (locked - Starter+)';
    var ex = D.exportSettings(tierKey, 'AUTO');
    $('export-note').textContent = 'Your plan exports ' + T.exportRes + 'p' + (T.watermark ? ' with a small Madwackd Studio watermark' : ' with no watermark') + (isFinite(T.maxSeconds) ? ', up to ' + T.maxSeconds + ' seconds.' : ', any length.');
    $('sv-minutes').textContent = T.studioVoiceMin > 0 ? 'Your plan includes ' + T.studioVoiceMin + ' studio voice minutes per month once they launch.' : 'Studio voice minutes start on Pro.';
    planList();
  }
  $('brand-logo').addEventListener('click', function (e) { if (!T.brandKit) { e.preventDefault(); upgrade('brandKit'); } });
  $('brand-color').addEventListener('click', function (e) { if (!T.brandKit) { e.preventDefault(); upgrade('brandKit'); } });

  /* project name */
  try { var saved = root.localStorage.getItem('mwdash.name'); if (saved) $('project-name').value = saved; } catch (e) {}
  $('project-name').addEventListener('change', function () { try { root.localStorage.setItem('mwdash.name', $('project-name').value); } catch (e) {} });

  /* ---------- init ---------- */
  addTrack('voice', 'Voice'); addTrack('music', 'Music'); addTrack('sfx', 'SFX');
  applyTier(); updateAddTrack(); buildSounds(); setDuck(false);
  D.editor.init({
    S: S, tier: function () { return tierKey; }, notify: notify, upgrade: upgrade, getT: function () { return S.playhead; },
    stopPlayback: stopPlayback, setExporting: function (v) { exporting = v; }, onTotalChange: updateDuration
  });
  showPanel('mixer'); setT(0); updateDuration(); rafId = root.requestAnimationFrame(loop);
  D.state = S; D.tierKey = tierKey;

  /* Subscribers only: Free and signed-out visitors get a preview of the paid dashboard instead of the tool.
     Plan limits are also enforced on the server; this is the page-level lock. */
  if (!T.dashboard) {
    var main = $('main');
    main.hidden = true; main.setAttribute('inert', ''); main.setAttribute('aria-hidden', 'true');
    var signedIn = !!(root.MWAuth && root.MWAuth.state && root.MWAuth.state.user);
    var lock = doc.createElement('section'); lock.className = 'dash-lock dash-lock-big'; lock.setAttribute('aria-labelledby', 'dash-lock-h');
    lock.innerHTML =
      '<p class="dash-lock-k">For Starter, Pro and Studio subscribers</p>' +
      '<h1 id="dash-lock-h">Subscribers get <span>THIS</span>.</h1>' +
      '<p class="dash-lock-lead">The Creator Dashboard: mix voice and music, drop in sounds, cut your clips and export, all in one place. ' +
        (signedIn ? 'You are on the Free plan, so it is locked for now.' : 'Already a subscriber? <a href="/studio/?return=%2Fdashboard%2F#live">Sign in</a> to open it.') + '</p>' +
      '<figure class="dash-lock-shot"><img src="/assets/img/creator-dashboard-pro.webp" width="1200" height="658" alt="The Creator Dashboard on the Pro plan: voice mixer with level and pan for each track, a sound library with Add at playhead buttons, and the plan panel showing unlimited tracks, all sounds, 1080p with no watermark, captions, auto-duck and brand kit." loading="eager">' +
        '<figcaption>The real Creator Dashboard, as a Pro subscriber sees it.</figcaption></figure>' +
      '<div class="dash-lock-cols"><div><h2>What you unlock</h2><ul class="dash-lock-list">' +
        '<li>Voice mixer: level, pan, mute and solo on every track, plus recording</li>' +
        '<li>The full sound library, made in your browser with no licensing</li>' +
        '<li>Video editor: trim, split and reorder clips, text on screen, 9:16, 16:9 or 1:1</li>' +
        '<li>Export at 1080p with no watermark, and burned-in captions</li>' +
        '<li>Pro adds unlimited tracks, auto-duck and your brand kit</li>' +
        '<li>Studio adds 3 team seats and multiple brand kits</li>' +
        '<li><a href="/pro-studio/">Pro Creator Studio</a> on every paid plan: earnings goals, pitch room, publish kit, mailing list and tip jar</li>' +
      '</ul></div><div class="dash-lock-plans"><h2>Pick your plan</h2>' +
        '<a class="dash-lock-plan" href="/studio/?buy=starter"><b>Starter</b><span>$29/mo</span></a>' +
        '<a class="dash-lock-plan hot" href="/studio/?buy=pro"><b>Pro</b><span>$89/mo</span><em>Most popular</em></a>' +
        '<a class="dash-lock-plan" href="/studio/?buy=studio"><b>Studio</b><span>$299/mo</span></a>' +
        '<p class="dash-lock-more"><a href="/pricing/">Compare every plan</a> &middot; <a href="/creator-studio/">Use the free tools</a></p>' +
      '</div></div>' +
      '<p class="dash-lock-new"><b>Always improving.</b> We add new features all the time, and subscribers get them as they launch on their plan.</p>' +
      '<p class="pay-trust">Payments are processed securely by Stripe. We never see or store your full card number. Plans renew monthly until you cancel.</p>';
    main.parentNode.insertBefore(lock, main);
  }
})(window);
