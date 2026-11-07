/* Madwackd Studio Board: UI. Needs studio-core.js (MWBoard) and studio-media.js (MWMedia).
   Optional on the page: dash-core.js + dash-audio.js (sound library), the Producer Z widget, and the site's
   sign-in setting window.MW_ID_TOKEN + window.MW_API_BASE (+ window.MW_TURNSTILE() for render checks). */
(function (root) {
  'use strict';
  var B = root.MWBoard, M = root.MWMedia, esc = B.esc;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var LOCAL = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);

  var S = {
    tier: 'anon', access: null, me: null, boardId: 'main', boards: [], board: null, updatedAt: null,
    t: 0, playing: false, zoom: 48, snap: true, ripple: true, sel: null, monitorAspect: '16:9', showSafe: false,
    saveState: 'local', hist: new B.History(), jobs: {}, social: { platforms: ['tiktok', 'reels', 'shorts', 'youtube'], len: 15, focusX: 0.5, captions: true, hook: '', body: '', cta: '', tags: '' },
    exporting: null
  };

  /* ------------------------------------------------------------------ api */
  function apiBase() { return String(root.MW_API_BASE || '').replace(/\/$/, ''); }
  function token() { return root.MW_ID_TOKEN || ''; }
  function api(method, path, body) {
    var h = { 'Content-Type': 'application/json' };
    if (token()) h.Authorization = 'Bearer ' + token();
    return fetch(apiBase() + path, { method: method, headers: h, body: body ? JSON.stringify(body) : undefined, credentials: 'omit' })
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) {
          if (!r.ok) { var e = new Error(j.message || 'Something went wrong.'); e.status = r.status; e.code = j.error; e.body = j; throw e; }
          return j;
        });
      });
  }
  function can(f) { return B.unlocked(S.tier, f); }
  function cloud() { return can('cloud_save') && !!token(); }

  /* ------------------------------------------------------------------ ui helpers */
  function toast(msg, kind) {
    var t = document.createElement('div'); t.className = 'sb-toast ' + (kind || ''); t.setAttribute('role', 'status'); t.textContent = msg;
    $('#sb-toasts').appendChild(t); setTimeout(function () { t.classList.add('out'); }, 3200); setTimeout(function () { t.remove(); }, 3700);
  }
  function confirmBox(title, body, okText) {
    return new Promise(function (res) {
      var d = $('#sb-dialog');
      $('h3', d).textContent = title; $('p', d).textContent = body; $('[data-ok]', d).textContent = okText || 'OK';
      d.onclose = function () { res(d.returnValue === 'ok'); };
      d.showModal();
    });
  }
  function copy(text) {
    (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(function () { toast('Copied'); }, function () { toast('Select and copy it by hand.'); });
  }
  function dl(text, name, type) { M.download(new Blob([text], { type: type || 'text/plain' }), name); }
  function field(label, html) { return '<label class="fld"><span>' + esc(label) + '</span>' + html + '</label>'; }
  function commit(panels) { S.hist.push(S.board); scheduleSave(); (panels || []).forEach(refresh); }
  function changed(panels) { scheduleSave(); (panels || []).forEach(refresh); }

  /* ------------------------------------------------------------------ demo board (the showroom) */
  function demoBoard() {
    var b = B.newBoard('Demo spot: Neighborhood Painters');
    b.project = { title: 'Demo spot: Neighborhood Painters', client: 'Demo client', brief: 'A 15-second spot for a local painting crew. Hook fast, show the transformation, end on a clear call to action.', aspect: '16:9' };
    b.storyboard = [
      { id: 'sb1', title: 'Hook', notes: 'Peeling paint, close-up. "Your house is talking."', dur: 4, color: '#f5c84b' },
      { id: 'sb2', title: 'Problem', notes: 'Neighbors glance over. Owner winces.', dur: 4, color: '#c03dff' },
      { id: 'sb3', title: 'Fix', notes: 'Crew arrives, fast time-lapse.', dur: 5, color: '#22d3ee' },
      { id: 'sb4', title: 'Proof', notes: 'Fresh house, proud owner, wave.', dur: 4, color: '#4ade80' }
    ];
    b.shots = [
      { id: 'sh1', scene: '1', desc: 'Macro shot of peeling paint on a sunny porch rail', camera: 'slow push-in', lens: '100mm macro', dur: 4, quality: 'fast' },
      { id: 'sh2', scene: '2', desc: 'Homeowner on the sidewalk looking up at a tired house, neighbors walk past', camera: 'static wide', lens: '35mm', dur: 4, quality: 'fast' },
      { id: 'sh3', scene: '3', desc: 'Painting crew working, energetic time-lapse, clean drop cloths', camera: 'locked-off time-lapse', lens: '24mm', dur: 5, quality: 'fast' },
      { id: 'sh4', scene: '4', desc: 'Freshly painted house at golden hour, homeowner waves', camera: 'crane up', lens: '24mm', dur: 4, quality: 'standard' }
    ];
    var v = b.tracks[0];
    v.clips = [
      { id: 'c1', media: 'demo:dawn', name: 'Hook', start: 0, in: 0, out: 4, fadeIn: 0.3 },
      { id: 'c2', media: 'demo:neon', name: 'Problem', start: 4, in: 0, out: 4 },
      { id: 'c3', media: 'demo:product', name: 'Fix', start: 8, in: 0, out: 5 },
      { id: 'c4', media: 'demo:crowd', name: 'Proof', start: 13, in: 0, out: 4, fadeOut: 0.4 }
    ];
    b.tracks[2].clips = [{ id: 'c5', media: 'demo:music', name: 'Studio groove', start: 0, in: 0, out: 20, fadeIn: 0.5, fadeOut: 1.5 }];
    b.captions = B.scriptToCaptions('Your house is talking. Is it saying good things? One call, one crew, one weekend.', 0.3, { maxChars: 32 });
    b.endcard = { on: true, title: 'Your brand here', sub: 'Made in Madwackd Studio', cta: 'Book a free quote', url: 'madwackd.ai', dur: 3, style: 'neon' };
    return b;
  }

  /* ------------------------------------------------------------------ persistence */
  var saveTimer = null;
  function localKey() { return 'mw-studio-board:' + (S.tier === 'studio' || S.tier === 'admin' ? S.boardId : 'showroom'); }
  function saveLocal() {
    try { var s = JSON.stringify(B.serializeBoard(S.board)); if (s.length < 4e6) localStorage.setItem(localKey(), s); } catch (e) { }
  }
  function loadLocal() { try { var s = localStorage.getItem(localKey()); return s ? JSON.parse(s) : null; } catch (e) { return null; } }
  function scheduleSave() {
    saveLocal();
    if (!cloud()) return;
    setSave('unsaved');
    clearTimeout(saveTimer); saveTimer = setTimeout(saveCloud, 3500);
  }
  function saveCloud(force) {
    clearTimeout(saveTimer);
    if (!cloud()) return Promise.resolve();
    setSave('saving');
    return api('POST', '/v2/studio/boards/' + S.boardId, { board: B.serializeBoard(S.board), base_updated_at: force ? undefined : S.updatedAt })
      .then(function (r) { S.updatedAt = r.updated_at; setSave('saved'); })
      .catch(function (e) {
        setSave('error');
        if (e.code === 'board_conflict') {
          confirmBox('This board changed somewhere else', 'Another tab or device saved newer changes. Keep your version (overwrites theirs) or load theirs?', 'Keep mine')
            .then(function (mine) { if (mine) saveCloud(true); else openBoard(S.boardId); });
        } else toast(e.message, 'bad');
      });
  }
  function setSave(st) {
    S.saveState = st;
    var el = $('#sb-save'); if (!el) return;
    el.textContent = { local: 'Saved on this device', unsaved: 'Unsaved', saving: 'Saving…', saved: 'Saved to your account', error: 'Not saved' }[st] || st;
    el.dataset.state = st;
  }
  function openBoard(id) {
    return api('GET', '/v2/studio/boards/' + id).then(function (r) {
      S.boardId = id; S.board = hydrate(r.board); S.updatedAt = r.updated_at; S.hist = new B.History(); S.sel = null;
      setSave('saved'); relinkJobs(); renderAll();
    }).catch(function (e) { toast(e.message, 'bad'); });
  }
  function hydrate(b) {
    var d = B.newBoard(b && b.name);
    b = Object.assign(d, b || {});
    b.layout = B.normalizeLayout(b.layout);
    if (!Array.isArray(b.tracks) || !b.tracks.length) b.tracks = d.tracks;
    ['storyboard', 'shots', 'queue', 'captions', 'cutdowns'].forEach(function (k) { if (!Array.isArray(b[k])) b[k] = []; });
    // Saved boards are data: coerce every number, id and color so nothing in a board can become markup or script.
    var num = function (v, d, lo, hi) { v = Number(v); if (!isFinite(v)) v = d; return B.clamp(v, lo, hi); };
    var sid = function (v, pre) { v = String(v == null ? '' : v); return /^[A-Za-z0-9_:.-]{1,60}$/.test(v) ? v : B.uid(pre); };
    var col = function (v) { return /^#[0-9a-f]{6}$/i.test(String(v)) ? v : '#f5c84b'; };
    var KINDS = { video: 1, clipaudio: 1, music: 1, voice: 1, sfx: 1 };
    b.tracks = b.tracks.filter(function (t) { return t && KINDS[t.kind]; }).slice(0, 16);
    b.tracks.forEach(function (t) {
      t.id = sid(t.id, 't'); t.name = String(t.name || t.kind).slice(0, 24);
      t.fader = num(t.fader, B.UNITY, 0, 1); t.pan = num(t.pan, 0, -1, 1); t.mute = !!t.mute; t.solo = !!t.solo;
      t.clips = (Array.isArray(t.clips) ? t.clips : []).filter(function (c) { return c && typeof c === 'object'; }).map(function (c) {
        var inn = num(c.in, 0, 0, 36000);
        return { id: sid(c.id, 'c'), media: String(c.media || ''), name: String(c.name || 'clip').slice(0, 40), start: num(c.start, 0, 0, 36000),
          in: inn, out: num(c.out, inn + 1, inn + 0.1, 36000), fadeIn: num(c.fadeIn, 0, 0, 10), fadeOut: num(c.fadeOut, 0, 0, 10) };
      });
    });
    b.captions = b.captions.filter(Boolean).map(function (c) { var st = num(c.start, 0, 0, 36000); return { id: sid(c.id, 'cap'), start: st, end: num(c.end, st + 1, st + 0.1, 36000), text: String(c.text || '').slice(0, 120) }; });
    b.storyboard = b.storyboard.filter(Boolean).map(function (f) { return { id: sid(f.id, 'sb'), title: String(f.title || '').slice(0, 80), notes: String(f.notes || '').slice(0, 600), dur: num(f.dur, 4, 1, 60), color: col(f.color) }; });
    b.shots = b.shots.filter(Boolean).map(function (x) { return { id: sid(x.id, 'sh'), scene: String(x.scene || '').slice(0, 6), desc: String(x.desc || '').slice(0, 900), camera: String(x.camera || '').slice(0, 80), lens: String(x.lens || '').slice(0, 40), dur: num(x.dur, 8, 4, 8), quality: x.quality === 'standard' ? 'standard' : 'fast' }; });
    b.queue = b.queue.filter(function (q) { return q && q.req; }).map(function (q) {
      var r = q.req;
      return { id: sid(q.id, 'q'), shot: String(q.shot || ''), label: String(q.label || 'Shot').slice(0, 40),
        req: { prompt: String(r.prompt || '').slice(0, 1800), aspect_ratio: r.aspect_ratio === '9:16' ? '9:16' : '16:9', duration_seconds: [4, 6, 8].indexOf(r.duration_seconds) !== -1 ? r.duration_seconds : 8,
          quality: r.quality === 'standard' ? 'standard' : 'fast', resolution: r.resolution === '1080p' && r.duration_seconds === 8 ? '1080p' : '720p' },
        status: /^[a-z_]{1,20}$/.test(q.status) ? q.status : 'draft', job: q.job ? sid(q.job, 'j') : undefined, quote: q.quote ? String(q.quote).slice(0, 60) : undefined,
        credits: q.credits != null ? num(q.credits, 0, 0, 1e6) : undefined, range: Array.isArray(q.range) ? [num(q.range[0], 0, 0, 1e6), num(q.range[1], 0, 0, 1e6)] : undefined };
    });
    var ec = b.endcard || {};
    b.endcard = { on: ec.on !== false, title: String(ec.title || '').slice(0, 60), sub: String(ec.sub || '').slice(0, 80), cta: String(ec.cta || '').slice(0, 30), url: String(ec.url || '').slice(0, 60), dur: num(ec.dur, 3, 1, 10), style: ec.style === 'clean' ? 'clean' : 'neon' };
    b.bpm = num(b.bpm, 100, 40, 240);
    if (b.masterFader != null) b.masterFader = num(b.masterFader, B.UNITY, 0, 1);
    if (!b.theme || !ACCENTS[b.theme.accent]) b.theme = { accent: 'gold' };
    b.name = String(b.name || 'Untitled spot').slice(0, 80);
    return b;
  }
  function relinkJobs() {   // renders come back as signed links that expire; fetch fresh ones on load
    if (!token()) return;
    S.board.tracks.forEach(function (t) {
      t.clips.forEach(function (c) {
        var m = /^job:(.+)$/.exec(c.media || '');
        if (m && !M.lib.items[c.media]) api('GET', '/v2/jobs/' + encodeURIComponent(m[1])).then(function (j) {
          if (j.signed_url) M.lib.addRemote(c.media, j.signed_url, c.name).then(function () { drawMonitor(true); });
        }).catch(function () { });
      });
    });
  }

  /* ------------------------------------------------------------------ shell */
  function renderShell() {
    var app = $('#studio-board');
    app.innerHTML =
      '<header class="sb-top" role="banner">' +
        '<div class="sb-brand"><span class="sb-logo" aria-hidden="true">MW</span><div><strong>MADWACKD STUDIO</strong><input id="sb-name" class="sb-name" aria-label="Board name" maxlength="80"></div></div>' +
        '<div class="sb-transport" role="group" aria-label="Transport">' +
          '<button data-tr="home" aria-label="Back to start" title="Back to start (Home)">⏮</button>' +
          '<button data-tr="play" class="sb-play" aria-label="Play" title="Play / pause (Space)">▶</button>' +
          '<button data-tr="stop" aria-label="Stop" title="Stop">■</button>' +
          '<output id="sb-tc" class="sb-tc" aria-label="Timecode">00:00:00</output>' +
          '<label class="sb-bpm" title="Tempo for the beat grid">BPM <input id="sb-bpm" type="number" min="40" max="240" step="1"></label>' +
        '</div>' +
        '<div class="sb-status"><span id="sb-tier" class="sb-tier"></span><span id="sb-credits" class="sb-credits" hidden></span><span id="sb-save" class="sb-save"></span></div>' +
        '<div class="sb-tools">' +
          '<select id="sb-preset" aria-label="Board layout"><option value="everything">Layout: Everything</option><option value="director">Layout: Director</option><option value="music">Layout: Music</option><option value="social">Layout: Social</option><option value="automation">Layout: Automation</option><option value="custom" hidden>Layout: Custom</option></select>' +
          '<div class="sb-accents" role="group" aria-label="Accent color">' + ['gold', 'cyan', 'magenta', 'lime'].map(function (a) { return '<button data-accent="' + a + '" class="acc-' + a + '" aria-label="' + a + ' accent"></button>'; }).join('') + '</div>' +
          '<button id="sb-dock-btn" aria-haspopup="true" title="Hidden panels">Panels</button>' +
          '<button id="sb-ask" class="sb-ask" title="Ask Producer Z">Ask Producer Z</button>' +
          '<span class="sb-acct" data-mw-account data-mw-btn="sb-acct-btn"></span>' +
        '</div>' +
      '</header>' +
      '<div id="sb-banner"></div>' +
      '<div id="sb-dock" class="sb-dock" hidden></div>' +
      '<main id="sb-grid" class="sb-grid" aria-label="Studio board"></main>' +
      '<div id="sb-toasts" class="sb-toasts" aria-live="polite"></div>' +
      '<dialog id="sb-dialog" class="sb-dialog"><form method="dialog"><h3></h3><p></p><menu><button value="cancel">Cancel</button><button value="ok" data-ok class="pri">OK</button></menu></form></dialog>';
    $('#sb-name').addEventListener('change', function (e) { S.board.name = e.target.value.slice(0, 80) || 'Untitled spot'; commit(['projects']); });
    $('#sb-bpm').addEventListener('change', function (e) { S.board.bpm = B.clamp(Number(e.target.value) || 100, 40, 240); commit(['timeline']); });
    $$('[data-tr]').forEach(function (b) { b.addEventListener('click', function () { transport(b.dataset.tr); }); });
    $('#sb-preset').addEventListener('change', function (e) { S.board.layout = B.applyPreset(S.board.layout, e.target.value); changed(); renderGrid(); });
    $$('[data-accent]').forEach(function (b) { b.addEventListener('click', function () { S.board.theme = { accent: b.dataset.accent }; applyTheme(); changed(); }); });
    if (root.MWAuth) root.MWAuth.paint();
    $('#sb-dock-btn').addEventListener('click', function () { var d = $('#sb-dock'); d.hidden = !d.hidden; renderDock(); });
    $('#sb-ask').addEventListener('click', function () {
      var ev = new CustomEvent('mw:guide-open', { detail: { context: 'studio-board', tier: S.tier } });
      root.dispatchEvent(ev); document.dispatchEvent(ev);
      if (!root.MWGuide && !$('.mwg-root, #mw-guide-root')) location.href = '/creator-studio/';
    });
  }
  var ACCENTS = { gold: ['#f5c84b', '#1a1200'], cyan: ['#22d3ee', '#001418'], magenta: ['#e040fb', '#16001a'], lime: ['#a3e635', '#0d1400'] };
  function applyTheme() {
    var a = ACCENTS[(S.board.theme && S.board.theme.accent) || 'gold'] || ACCENTS.gold;
    var r = document.documentElement.style; r.setProperty('--acc', a[0]); r.setProperty('--acc-ink', a[1]);
  }
  function renderTop() {
    $('#sb-name').value = S.board.name || '';
    $('#sb-bpm').value = S.board.bpm || 100;
    var tier = $('#sb-tier'); tier.textContent = B.TIER_LABEL[S.tier]; tier.dataset.tier = S.tier;
    $('#sb-preset').value = B.PRESETS[S.board.layout.preset] !== undefined ? S.board.layout.preset : 'custom';
    setSave(cloud() ? (S.updatedAt ? 'saved' : 'unsaved') : 'local');
    var ban = $('#sb-banner');
    if (S.tier === 'studio' || S.tier === 'admin') ban.innerHTML = '';
    else if (S.tier === 'starter' || S.tier === 'pro') ban.innerHTML = '<div class="sb-banner">You are looking at the <strong>Studio board</strong>. Your ' + esc(B.TIER_LABEL[S.tier]) + ' plan includes the <a href="/dashboard/">Creator Dashboard</a>. Storyboard, shot list and captions here are yours to try. <a class="btn pri" href="/pricing/#studio">Upgrade to Studio</a></div>';
    else ban.innerHTML = '<div class="sb-banner">Welcome to the <strong>Studio board</strong> showroom. Press play on the demo spot, then try the storyboard, shot list and caption tools free. Nothing here is saved to an account. <a class="btn pri" href="/pricing/#studio">See the Studio plan</a></div>';
    if (cloud()) api('GET', '/v2/me').then(function (me) {
      S.me = me; var c = $('#sb-credits'); c.hidden = false;
      c.textContent = (me.balance_credits || 0).toLocaleString() + ' credits'; c.dataset.state = me.meter ? me.meter.state : 'ok';
    }).catch(function () { });
  }

  /* ------------------------------------------------------------------ grid of panels (drag to arrange) */
  function renderGrid() {
    var g = $('#sb-grid'); g.innerHTML = '';
    var L = S.board.layout = B.normalizeLayout(S.board.layout);
    L.order.forEach(function (id) {
      var p = B.panelById(id);
      if (L.hidden.indexOf(id) !== -1) return;
      if (id === 'admin' && S.tier !== 'admin') return;
      var locked = !can(p.feature) && id !== 'monitor';
      var sec = document.createElement('section');
      sec.className = 'panel size-' + L.size[id] + (locked ? ' locked' : '');
      sec.dataset.panel = id; sec.setAttribute('aria-label', p.title);
      sec.innerHTML = '<header class="ph"><span class="grip" draggable="true" title="Drag to move" aria-hidden="true">⠿</span><h2>' + esc(p.title) + '</h2>' +
        (locked ? '<span class="lock-tag">Studio</span>' : '') +
        '<div class="pa"><button data-pa="left" aria-label="Move ' + esc(p.title) + ' earlier">◀</button><button data-pa="right" aria-label="Move ' + esc(p.title) + ' later">▶</button>' +
        '<button data-pa="shrink" aria-label="Make ' + esc(p.title) + ' smaller">−</button><button data-pa="grow" aria-label="Make ' + esc(p.title) + ' bigger">+</button>' +
        '<button data-pa="hide" aria-label="Hide ' + esc(p.title) + '">×</button></div></header><div class="pb"></div>';
      g.appendChild(sec);
      wirePanelFrame(sec, id);
      refresh(id);
      if (locked) addLock(sec, p.feature);
    });
    renderDock();
  }
  function addLock(sec, feature) {
    var lc = B.lockCopy(feature, S.tier), body = $('.pb', sec);
    body.setAttribute('inert', ''); body.setAttribute('aria-hidden', 'true');
    var o = document.createElement('div'); o.className = 'lock';
    o.innerHTML = '<div class="lock-card"><span class="lock-ico" aria-hidden="true">🔒</span><h3>' + esc(lc.title) + '</h3><p>' + esc(lc.body) + '</p>' +
      '<a class="btn pri" href="' + esc(lc.href) + '">' + esc(lc.cta) + '</a>' + (lc.alt ? ' <a class="btn" href="' + esc(lc.alt.href) + '">' + esc(lc.alt.text) + '</a>' : '') + '</div>';
    sec.appendChild(o);
  }
  function wirePanelFrame(sec, id) {
    $$('[data-pa]', sec).forEach(function (b) {
      b.addEventListener('click', function () {
        var L = S.board.layout, a = b.dataset.pa, i = L.order.indexOf(id);
        if (a === 'hide') L = B.togglePanel(L, id, false);
        else if (a === 'grow' || a === 'shrink') L = B.resizePanel(L, id, a === 'grow' ? 1 : -1);
        else if (a === 'left' && i > 0) L = B.movePanel(L, id, L.order[i - 1]);
        else if (a === 'right' && i < L.order.length - 1) L = B.movePanel(L, L.order[i + 1], id);
        S.board.layout = L; changed(); renderGrid(); renderTop();
        var again = $('[data-panel="' + id + '"] [data-pa="' + a + '"]'); if (again) again.focus();
      });
    });
    $('.grip', sec).addEventListener('dragstart', function (e) { e.dataTransfer.setData('text/x-mw-panel', id); e.dataTransfer.effectAllowed = 'move'; sec.classList.add('dragging'); });
    $('.grip', sec).addEventListener('dragend', function () { sec.classList.remove('dragging'); $$('.panel.drop-on').forEach(function (x) { x.classList.remove('drop-on'); }); });
    sec.addEventListener('dragover', function (e) { if (e.dataTransfer.types.indexOf('text/x-mw-panel') !== -1) { e.preventDefault(); sec.classList.add('drop-on'); } });
    sec.addEventListener('dragleave', function () { sec.classList.remove('drop-on'); });
    sec.addEventListener('drop', function (e) {
      var from = e.dataTransfer.getData('text/x-mw-panel'); if (!from) return;
      e.preventDefault(); S.board.layout = B.movePanel(S.board.layout, from, id); changed(); renderGrid(); renderTop();
    });
  }
  function renderDock() {
    var d = $('#sb-dock'); if (!d || d.hidden) return;
    var hidden = S.board.layout.hidden.filter(function (id) { return id !== 'admin' || S.tier === 'admin'; });
    d.innerHTML = '<strong>Hidden panels</strong> ' + (hidden.length ? hidden.map(function (id) { return '<button data-show="' + id + '">+ ' + esc(B.panelById(id).title) + '</button>'; }).join('') : '<span class="muted">None. Use × on a panel to hide it.</span>') +
      ' <button data-reset class="ghost">Reset layout</button>';
    $$('[data-show]', d).forEach(function (b) { b.addEventListener('click', function () { S.board.layout = B.togglePanel(S.board.layout, b.dataset.show, true); changed(); renderGrid(); renderTop(); }); });
    $('[data-reset]', d).addEventListener('click', function () { S.board.layout = B.defaultLayout(); changed(); renderGrid(); renderTop(); });
  }
  function refresh(id) {
    var sec = $('[data-panel="' + id + '"]'); if (!sec) return;
    var body = $('.pb', sec);
    try { (PANELS[id] || function () { })(body); } catch (e) { body.textContent = 'This panel hit a snag. Reload the page.'; if (LOCAL) console.error(e); }
  }
  function renderAll() { applyTheme(); renderTop(); renderGrid(); drawMonitor(true); }

  /* ------------------------------------------------------------------ transport */
  var raf = 0;
  function transport(a) {
    if (a === 'play') return S.playing ? pause() : play();
    if (a === 'stop') { pause(); seek(0); }
    if (a === 'home') seek(0);
  }
  function play() {
    var end = B.totalDuration(S.board);
    if (S.t >= end - 0.05) S.t = 0;
    S.playing = true; M.audio.play(S.board, S.t);
    var pb = $('.sb-play'); pb.textContent = '❚❚'; pb.setAttribute('aria-label', 'Pause');
    tick();
  }
  function pause() {
    S.playing = false; M.audio.stop(); cancelAnimationFrame(raf);
    var pb = $('.sb-play'); if (pb) { pb.textContent = '▶'; pb.setAttribute('aria-label', 'Play'); }
    drawMonitor(true);
  }
  function seek(t) {
    S.t = B.clamp(t, 0, Math.max(0, B.totalDuration(S.board)));
    if (S.playing) M.audio.play(S.board, S.t);
    drawMonitor(true); movePlayhead();
  }
  function tick() {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(function loop() {
      if (S.playing) {
        var n = M.audio.now(); if (n != null) S.t = n;
        if (S.t >= B.totalDuration(S.board)) { pause(); S.t = B.totalDuration(S.board); }
        drawMonitor(false); movePlayhead();
      }
      meters();
      raf = requestAnimationFrame(loop);
    });
  }
  function movePlayhead() {
    var tc = $('#sb-tc'); if (tc) tc.textContent = B.timecode(S.t);
    var ph = $('.tl-playhead'); if (ph) ph.style.transform = 'translateX(' + (S.t * S.zoom) + 'px)';
    if (S.playing) { var sc = $('.tl-scroll'); if (sc) { var x = S.t * S.zoom; if (x > sc.scrollLeft + sc.clientWidth - 40) sc.scrollLeft = x - 80; } }
  }

  /* ------------------------------------------------------------------ monitor */
  function drawMonitor(seekVideo) {
    var cv = $('#sb-monitor'); if (!cv) return;
    var r = B.aspectRatio(S.monitorAspect), W = 960, H = Math.round(W / r);
    if (H > 960) { H = 960; W = Math.round(H * r); }
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    var pf = platformFor(S.monitorAspect);
    M.draw(cv.getContext('2d'), W, H, S.board, S.t, { seek: seekVideo, playing: S.playing, showSafe: S.showSafe, safe: pf && pf.safe, aiLabel: M.hasAiClips(S.board) });
  }
  function platformFor(aspect) { var k = { '9:16': 'tiktok', '16:9': 'youtube', '1:1': 'linkedin', '4:5': 'igfeed' }[aspect]; return B.PLATFORMS[k]; }

  /* ------------------------------------------------------------------ panels */
  var PANELS = {};

  PANELS.projects = function (el) {
    var p = S.board.project || {};
    el.innerHTML = (cloud() ? '<div class="row"><select id="pj-pick" aria-label="Open board">' + S.boards.map(function (b) { return '<option value="' + esc(b.id) + '"' + (b.id === S.boardId ? ' selected' : '') + '>' + esc(b.name || b.id) + '</option>'; }).join('') + '</select><button data-new>New board</button><button data-dup>Duplicate</button><button data-del class="ghost">Delete</button></div>'
      : '<p class="muted">Showroom: this demo lives on this device only.</p>') +
      field('Project', '<input data-k="title" maxlength="120" value="' + esc(p.title) + '">') +
      field('Client', '<input data-k="client" maxlength="120" value="' + esc(p.client) + '">') +
      field('Brief', '<textarea data-k="brief" rows="3" maxlength="2000">' + esc(p.brief) + '</textarea>') +
      field('Main shape', '<select data-k="aspect">' + ['16:9', '9:16'].map(function (a) { return '<option' + (p.aspect === a ? ' selected' : '') + '>' + a + '</option>'; }).join('') + '</select>');
    $$('[data-k]', el).forEach(function (i) { i.addEventListener('change', function () { S.board.project[i.dataset.k] = i.value; commit(); }); });
    if (!cloud()) return;
    $('#pj-pick', el).addEventListener('change', function (e) { saveCloud().then(function () { openBoard(e.target.value); }); });
    $('[data-new]', el).addEventListener('click', function () { newCloudBoard(B.newBoard('Untitled spot')); });
    $('[data-dup]', el).addEventListener('click', function () { var c = JSON.parse(JSON.stringify(B.serializeBoard(S.board))); c.name = (c.name || 'Board') + ' copy'; newCloudBoard(hydrate(c)); });
    $('[data-del]', el).addEventListener('click', function () {
      confirmBox('Delete this board?', 'This removes "' + (S.board.name || S.boardId) + '" from your account. Media on this device is kept.', 'Delete').then(function (ok) {
        if (!ok) return;
        api('DELETE', '/v2/studio/boards/' + S.boardId).then(listBoards).then(function () { var n = S.boards[0]; if (n) openBoard(n.id); else newCloudBoard(B.newBoard('Untitled spot')); });
      });
    });
  };
  function newCloudBoard(b) {
    var id = 'b' + Date.now().toString(36);
    return api('POST', '/v2/studio/boards/' + id, { board: B.serializeBoard(b) }).then(function (r) {
      S.boardId = id; S.board = hydrate(b); S.updatedAt = r.updated_at; S.hist = new B.History();
      return listBoards();
    }).then(renderAll).catch(function (e) { toast(e.message, 'bad'); });
  }
  function listBoards() { return api('GET', '/v2/studio/boards').then(function (r) { S.boards = r.boards || []; }); }

  PANELS.storyboard = function (el) {
    el.innerHTML = '<div class="sbd" role="list">' + S.board.storyboard.map(function (f, i) {
      return '<article class="frame" role="listitem" draggable="true" data-id="' + esc(f.id) + '"><div class="frame-art" data-color="' + esc(f.color || '#f5c84b') + '"><span>' + (i + 1) + '</span><input type="color" value="' + esc(f.color || '#f5c84b') + '" data-f="color" aria-label="Frame color"></div>' +
        '<input data-f="title" maxlength="80" value="' + esc(f.title) + '" aria-label="Frame title">' +
        '<textarea data-f="notes" rows="3" maxlength="600" aria-label="Frame notes">' + esc(f.notes) + '</textarea>' +
        '<div class="row"><label class="mini">sec <input data-f="dur" type="number" min="1" max="60" value="' + esc(f.dur || 4) + '"></label><button data-to-shot title="Make a shot from this frame">→ Shot</button><button data-mv="-1" class="ghost" aria-label="Move frame earlier">◀</button><button data-mv="1" class="ghost" aria-label="Move frame later">▶</button><button data-del class="ghost" aria-label="Delete frame">×</button></div></article>';
    }).join('') + '<button class="frame add" data-add>+ Frame</button></div>';
    $$('.frame-art', el).forEach(function (a) { a.style.background = 'linear-gradient(135deg,' + a.dataset.color + ',#0b0b12)'; });
    $$('.frame[data-id]', el).forEach(function (card) {
      var f = S.board.storyboard.filter(function (x) { return x.id === card.dataset.id; })[0];
      $$('[data-f]', card).forEach(function (i) { i.addEventListener('change', function () { f[i.dataset.f] = i.dataset.f === 'dur' ? B.clamp(Number(i.value) || 4, 1, 60) : i.value; commit(i.dataset.f === 'color' ? ['storyboard'] : []); }); });
      $('[data-del]', card).addEventListener('click', function () { S.board.storyboard.splice(S.board.storyboard.indexOf(f), 1); commit(['storyboard']); });
      $('[data-to-shot]', card).addEventListener('click', function () {
        S.board.shots.push({ id: B.uid('sh'), scene: String(S.board.storyboard.indexOf(f) + 1), desc: (f.title + ': ' + f.notes).slice(0, 600), camera: '', lens: '', dur: Math.min(8, f.dur || 4), quality: 'fast' });
        commit(['shots']); toast('Added to the shot list');
      });
      $$('[data-mv]', card).forEach(function (b) { b.addEventListener('click', function () { nudge(S.board.storyboard, f, Number(b.dataset.mv)); commit(['storyboard']); }); });
      reorderable(card, S.board.storyboard, f, 'storyboard');
    });
    $('[data-add]', el).addEventListener('click', function () { S.board.storyboard.push({ id: B.uid('sb'), title: 'New frame', notes: '', dur: 4, color: '#22d3ee' }); commit(['storyboard']); });
  };
  function nudge(list, item, d) {
    var i = list.indexOf(item), j = i + d;
    if (i < 0 || j < 0 || j >= list.length) return;
    list.splice(i, 1); list.splice(j, 0, item);
  }
  function reorderable(node, list, item, panel) {
    node.addEventListener('dragstart', function (e) { if (e.target !== node) return; e.dataTransfer.setData('text/x-mw-item', item.id); node.classList.add('dragging'); });
    node.addEventListener('dragend', function () { node.classList.remove('dragging'); });
    node.addEventListener('dragover', function (e) { if (e.dataTransfer.types.indexOf('text/x-mw-item') !== -1) e.preventDefault(); });
    node.addEventListener('drop', function (e) {
      var id = e.dataTransfer.getData('text/x-mw-item'); if (!id || id === item.id) return;
      e.preventDefault(); e.stopPropagation();
      var from = list.filter(function (x) { return x.id === id; })[0]; if (!from) return;
      list.splice(list.indexOf(from), 1); list.splice(list.indexOf(item), 0, from); commit([panel]);
    });
  }

  PANELS.shots = function (el) {
    el.innerHTML = '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>#</th><th>What we see</th><th>Camera</th><th>Lens</th><th>Sec</th><th>Quality</th><th></th></tr></thead><tbody>' +
      S.board.shots.map(function (s) {
        return '<tr draggable="true" data-id="' + esc(s.id) + '"><td><input data-f="scene" class="w3" maxlength="6" value="' + esc(s.scene) + '" aria-label="Scene"></td>' +
          '<td><textarea data-f="desc" rows="2" maxlength="900" aria-label="Description">' + esc(s.desc) + '</textarea></td>' +
          '<td><input data-f="camera" maxlength="80" value="' + esc(s.camera) + '" aria-label="Camera move"></td>' +
          '<td><input data-f="lens" class="w6" maxlength="40" value="' + esc(s.lens) + '" aria-label="Lens"></td>' +
          '<td><input data-f="dur" class="w3" type="number" min="4" max="8" step="2" title="Renders are 4, 6 or 8 seconds" value="' + esc(s.dur || 8) + '" aria-label="Seconds"></td>' +
          '<td><select data-f="quality" aria-label="Quality"><option value="fast"' + (s.quality !== 'standard' ? ' selected' : '') + '>Fast</option><option value="standard"' + (s.quality === 'standard' ? ' selected' : '') + '>Standard</option></select></td>' +
          '<td class="nowrap"><button data-q title="Send to the clip queue">Queue</button><button data-mv="-1" class="ghost" aria-label="Move shot up">↑</button><button data-mv="1" class="ghost" aria-label="Move shot down">↓</button><button data-del class="ghost" aria-label="Delete shot">×</button></td></tr>';
      }).join('') + '</tbody></table></div><div class="row"><button data-add>+ Shot</button><button data-csv class="ghost">Download shot list (CSV)</button></div>';
    $$('tr[data-id]', el).forEach(function (row) {
      var s = S.board.shots.filter(function (x) { return x.id === row.dataset.id; })[0];
      $$('[data-f]', row).forEach(function (i) { i.addEventListener('change', function () { s[i.dataset.f] = i.dataset.f === 'dur' ? B.clamp(Number(i.value) || 8, 4, 8) : i.value; commit(); }); });
      $('[data-del]', row).addEventListener('click', function () { S.board.shots.splice(S.board.shots.indexOf(s), 1); commit(['shots']); });
      $('[data-q]', row).addEventListener('click', function () {
        if (!can('clip_queue')) return toast('The clip queue is part of the Studio plan.', 'bad');
        S.board.queue.push({ id: B.uid('q'), shot: s.id, label: 'Shot ' + s.scene, req: B.shotToRender(s, S.board.project), status: 'draft' });
        commit(['queue']); toast('Queued. Get a price before rendering.');
      });
      $$('[data-mv]', row).forEach(function (b) { b.addEventListener('click', function () { nudge(S.board.shots, s, Number(b.dataset.mv)); commit(['shots']); }); });
      reorderable(row, S.board.shots, s, 'shots');
    });
    $('[data-add]', el).addEventListener('click', function () { S.board.shots.push({ id: B.uid('sh'), scene: String(S.board.shots.length + 1), desc: '', camera: '', lens: '', dur: 8, quality: 'fast' }); commit(['shots']); });
    $('[data-csv]', el).addEventListener('click', function () {
      var q = function (v) { v = String(v == null ? '' : v); if (/^[=+\-@]/.test(v)) v = "'" + v; return '"' + v.replace(/"/g, '""') + '"'; };
      dl(['Scene,Description,Camera,Lens,Seconds,Quality'].concat(S.board.shots.map(function (s) { return [s.scene, s.desc, s.camera, s.lens, s.dur, s.quality].map(q).join(','); })).join('\r\n'), 'shot-list.csv', 'text/csv');
    });
  };

  PANELS.queue = function (el) {
    var Q = S.board.queue;
    el.innerHTML = (Q.length ? '<ul class="queue">' + Q.map(function (q) {
      var j = S.jobs[q.job] || {};
      var st = q.job ? (j.status || q.status) : q.status;
      return '<li data-id="' + esc(q.id) + '" class="q-' + esc(st) + '"' + (st === 'done' ? ' draggable="true"' : '') + '><div><strong>' + esc(q.label) + '</strong> <span class="pill">' + esc(st) + '</span><p class="muted clamp2">' + esc(q.req.prompt) + '</p>' +
        '<span class="muted">' + esc(q.req.duration_seconds) + ' s · ' + esc(q.req.aspect_ratio) + ' · ' + esc(q.req.quality) + (q.credits ? ' · ' + esc(q.credits) + ' credits' : '') + '</span></div><div class="q-act">' +
        (st === 'draft' || st === 'quoted' ? '<button data-quote>' + (st === 'quoted' ? 'Re-price' : 'Get price') + '</button>' : '') +
        (st === 'quoted' ? '<button data-render class="pri">Render</button>' : '') +
        (st === 'done' ? '<button data-add class="pri">Add to timeline</button>' : '') +
        '<button data-del class="ghost" aria-label="Remove from queue">×</button></div></li>';
    }).join('') + '</ul>' : '<p class="muted">Send shots here from the shot list. You see the price in credits before anything renders.</p>') +
      '<p class="fine">Renders use credits from your plan. Every finished clip carries an "AI-generated" label when you publish.</p>';
    $$('li[data-id]', el).forEach(function (li) {
      var q = Q.filter(function (x) { return x.id === li.dataset.id; })[0];
      var on = function (sel, fn) { var b = $(sel, li); if (b) b.addEventListener('click', fn); };
      on('[data-del]', function () { Q.splice(Q.indexOf(q), 1); commit(['queue']); });
      on('[data-quote]', function () {
        api('POST', '/v2/quotes', q.req).then(function (r) { q.quote = r.quote_id; q.credits = r.credits; q.status = 'quoted'; q.range = r.price_usd_range; q.enough = r.enough; changed(['queue']); })
          .catch(function (e) { toast(e.message, 'bad'); });
      });
      on('[data-render]', function () {
        var msg = 'This render uses ' + q.credits + ' credits' + (q.range ? ' (about $' + q.range[0] + ' to $' + q.range[1] + ' of plan value)' : '') + '. Like a film shoot, it can take a few takes: a take you don\'t like isn\'t refunded, but if the engine errors and makes no video, your credits come back automatically.';
        confirmBox('Render ' + q.label + '?', msg, 'Render').then(function (ok) {
          if (!ok) return;
          Promise.resolve(root.MW_TURNSTILE ? root.MW_TURNSTILE() : '').then(function (tt) {
            var go = function () { return api('POST', '/v2/renders', { quote_id: q.quote, confirm: true, turnstile_token: tt || '' }); };
            return root.MWTakes ? root.MWTakes.run(api, go) : go();
          }).then(function (j) { q.job = j.job_id || j.id; q.status = 'running'; S.jobs[q.job] = j; commit(['queue']); pollJobs(); renderTop(); })
            .catch(function (e) { if (e.code !== 'policy_declined') toast(e.code === 'insufficient_credits' ? 'Not enough credits. Top up from the credit meter.' : e.message, 'bad'); });
        });
      });
      on('[data-add]', function () { addJobToTimeline(q); });
      li.addEventListener('dragstart', function (e) { if (q.job) e.dataTransfer.setData('text/x-mw-media', 'job:' + q.job); });
    });
  };
  var polling = null;
  function pollJobs() {
    clearTimeout(polling);
    var open = S.board.queue.filter(function (q) { return q.job && !/^(done|failed|refunded|submit_failed|blocked)$/.test((S.jobs[q.job] || {}).status || q.status); });
    if (!open.length || !token()) return;
    Promise.all(open.map(function (q) {
      return api('GET', '/v2/jobs/' + encodeURIComponent(q.job)).then(function (j) { S.jobs[q.job] = j; q.status = j.status; if (j.signed_url) M.lib.addRemote('job:' + q.job, j.signed_url, q.label); }).catch(function () { });
    })).then(function () { changed(['queue']); polling = setTimeout(pollJobs, 6000); });
  }
  function addJobToTimeline(q) {
    var j = S.jobs[q.job] || {};
    var go = function () {
      var v = S.board.tracks[0], d = q.req.duration_seconds || 8;
      S.hist.push(S.board);
      B.placeClip(v, { id: B.uid('c'), media: 'job:' + q.job, name: q.label, in: 0, out: d }, B.trackEnd(v));
      changed(['timeline']); drawMonitor(true); toast('Added to the timeline');
    };
    if (j.signed_url) M.lib.addRemote('job:' + q.job, j.signed_url, q.label).then(go);
    else api('GET', '/v2/jobs/' + encodeURIComponent(q.job)).then(function (r) { S.jobs[q.job] = r; return M.lib.addRemote('job:' + q.job, r.signed_url, q.label); }).then(go).catch(function (e) { toast(e.message, 'bad'); });
  }

  PANELS.monitor = function (el) {
    el.innerHTML = '<div class="mon"><canvas id="sb-monitor" width="960" height="540" aria-label="Program monitor"></canvas></div>' +
      '<div class="row"><select id="mon-aspect" aria-label="Monitor shape">' + ['16:9', '9:16', '1:1', '4:5'].map(function (a) { return '<option' + (a === S.monitorAspect ? ' selected' : '') + '>' + a + '</option>'; }).join('') + '</select>' +
      '<label class="chk"><input type="checkbox" id="mon-safe"' + (S.showSafe ? ' checked' : '') + '> Safe zones</label>' +
      '<button id="mon-full" class="ghost">Full screen</button>' + (can('export') ? '<button id="mon-export" class="pri">Export master</button>' : '<span class="muted">Demo playback is free. Export is part of Studio.</span>') + '</div><div id="mon-prog"></div>';
    $('#mon-aspect').addEventListener('change', function (e) { S.monitorAspect = e.target.value; drawMonitor(true); });
    $('#mon-safe').addEventListener('change', function (e) { S.showSafe = e.target.checked; drawMonitor(true); });
    $('#mon-full').addEventListener('click', function () { var c = $('#sb-monitor'); if (c.requestFullscreen) c.requestFullscreen(); });
    var ex = $('#mon-export');
    if (ex) ex.addEventListener('click', function () {
      var r = B.aspectRatio(S.monitorAspect), w = r >= 1 ? 1920 : 1080, h = Math.round(w / r);
      runExports([{ name: (S.board.name || 'spot') + ' master ' + S.monitorAspect.replace(':', 'x'), w: w, h: h, programUntil: B.programEnd(S.board), endcardDur: S.board.endcard.on ? S.board.endcard.dur : 0, safe: (platformFor(S.monitorAspect) || {}).safe }], $('#mon-prog'));
    });
    drawMonitor(true);
  };

  PANELS.mixer = function (el) {
    var strips = S.board.tracks.filter(function (t) { return t.kind !== 'video'; });
    el.innerHTML = '<div class="console">' + strips.map(function (t) {
      var f = t.fader == null ? B.UNITY : t.fader;
      return '<div class="strip k-' + esc(t.kind) + '" data-id="' + esc(t.id) + '"><canvas class="vu" width="14" height="150" data-vu="' + esc(t.id) + '" aria-hidden="true"></canvas>' +
        '<input class="fader" type="range" min="0" max="1" step="0.005" value="' + f + '" aria-label="' + esc(t.name) + ' level">' +
        '<output class="db">' + dbText(f) + '</output>' +
        '<input class="pan" type="range" min="-1" max="1" step="0.05" value="' + (t.pan || 0) + '" aria-label="' + esc(t.name) + ' pan">' +
        '<div class="ms"><button data-m class="' + (t.mute ? 'on' : '') + '" aria-pressed="' + !!t.mute + '" aria-label="Mute ' + esc(t.name) + '">M</button><button data-s class="' + (t.solo ? 'on' : '') + '" aria-pressed="' + !!t.solo + '" aria-label="Solo ' + esc(t.name) + '">S</button></div>' +
        '<input class="sname" value="' + esc(t.name) + '" maxlength="24" aria-label="Channel name"></div>';
    }).join('') +
      '<div class="strip master"><canvas class="vu" width="14" height="150" data-vu="master" aria-hidden="true"></canvas><input class="fader" type="range" min="0" max="1" step="0.005" value="' + (S.board.masterFader == null ? B.UNITY : S.board.masterFader) + '" aria-label="Master level"><output class="db">' + dbText(S.board.masterFader == null ? B.UNITY : S.board.masterFader) + '</output><span class="lim" title="Limiter keeps the mix from clipping">LIM</span><strong>MASTER</strong></div>' +
      '</div><div class="row"><button data-add="music">+ Music</button><button data-add="voice">+ Voice</button><button data-add="sfx">+ FX</button><span class="muted">The master limiter keeps exports from clipping.</span></div>';
    $$('.strip[data-id]', el).forEach(function (st) {
      var t = S.board.tracks.filter(function (x) { return x.id === st.dataset.id; })[0];
      $('.fader', st).addEventListener('input', function (e) { t.fader = Number(e.target.value); $('.db', st).textContent = dbText(t.fader); M.audio.sync(S.board); });
      $('.fader', st).addEventListener('change', function () { commit(); });
      $('.pan', st).addEventListener('input', function (e) { t.pan = Number(e.target.value); M.audio.sync(S.board); });
      $('.pan', st).addEventListener('change', function () { commit(); });
      $('.pan', st).addEventListener('dblclick', function (e) { t.pan = 0; e.target.value = 0; M.audio.sync(S.board); commit(); });
      $('[data-m]', st).addEventListener('click', function () { t.mute = !t.mute; M.audio.sync(S.board); commit(['mixer']); });
      $('[data-s]', st).addEventListener('click', function () { t.solo = !t.solo; M.audio.sync(S.board); commit(['mixer']); });
      $('.sname', st).addEventListener('change', function (e) { t.name = e.target.value.slice(0, 24) || t.kind; commit(['timeline']); });
    });
    var ms = $('.strip.master', el);
    $('.fader', ms).addEventListener('input', function (e) { S.board.masterFader = Number(e.target.value); $('.db', ms).textContent = dbText(S.board.masterFader); M.audio.sync(S.board); });
    $('.fader', ms).addEventListener('change', function () { commit(); });
    $$('[data-add]', el).forEach(function (b) {
      b.addEventListener('click', function () {
        if (S.board.tracks.length >= 16) return toast('16 tracks is the most a board holds.');
        var k = b.dataset.add, n = S.board.tracks.filter(function (t) { return t.kind === k; }).length + 1;
        S.board.tracks.push({ id: B.uid('t'), kind: k, name: { music: 'Music', voice: 'Voice', sfx: 'Sound FX' }[k] + ' ' + n, fader: B.UNITY, pan: 0, mute: false, solo: false, clips: [] });
        commit(['mixer', 'timeline']);
      });
    });
  };
  function dbText(f) { var d = B.faderToDb(f); return d === -Infinity ? '−∞' : (d > 0 ? '+' : '') + d.toFixed(1) + ' dB'; }
  var peaks = {};
  function meters() {
    $$('canvas[data-vu]').forEach(function (cv) {
      var id = cv.dataset.vu, lv = S.playing ? M.audio.level(id) : 0;
      var pk = peaks[id] = Math.max(lv, (peaks[id] || 0) - 0.012);
      var c = cv.getContext('2d'), H = cv.height, W = cv.width, n = 30;
      c.clearRect(0, 0, W, H);
      for (var i = 0; i < n; i++) {
        var on = i / n < lv, y = H - (i + 1) * (H / n) + 1;
        c.fillStyle = i > n * 0.86 ? (on ? '#ff4d5e' : '#3a1218') : i > n * 0.66 ? (on ? '#ffd23f' : '#3a3010') : (on ? '#3dff8b' : '#0f2a1a');
        c.fillRect(1, y, W - 2, H / n - 2);
      }
      c.fillStyle = '#fff'; c.fillRect(1, H - pk * H, W - 2, 2);
    });
  }

  /* ---------- timeline */
  var LANE_KINDS = { video: 'Picture', music: 'Music', voice: 'Voice', sfx: 'Sound FX' };
  PANELS.timeline = function (el) {
    var dur = Math.max(30, B.totalDuration(S.board) + 10), W = Math.ceil(dur * S.zoom);
    var lanes = S.board.tracks.filter(function (t) { return LANE_KINDS[t.kind]; });
    var prog = B.programEnd(S.board), ec = S.board.endcard;
    var sel = selected();
    el.innerHTML = '<div class="tl-tools row">' +
      '<button data-tool="split" title="Split at playhead (S)">Split</button><button data-tool="delete" title="Delete (Del)">Delete</button><button data-tool="stitch" title="Close gaps on every lane">Stitch</button>' +
      '<button data-tool="undo" title="Undo (Ctrl+Z)">Undo</button><button data-tool="redo" title="Redo (Ctrl+Shift+Z)">Redo</button>' +
      '<label class="chk"><input type="checkbox" data-opt="snap"' + (S.snap ? ' checked' : '') + '> Snap</label><label class="chk"><input type="checkbox" data-opt="ripple"' + (S.ripple ? ' checked' : '') + '> Ripple delete</label>' +
      '<label class="zoom">Zoom <input type="range" min="12" max="160" value="' + S.zoom + '" data-zoom aria-label="Timeline zoom"></label>' +
      '<label class="file-btn">Import media<input type="file" multiple accept="video/*,audio/*,image/*" data-import hidden></label></div>' +
      (sel ? '<div class="insp row"><strong>' + esc(sel.c.name || 'Clip') + '</strong><span class="muted">' + B.clipLen(sel.c).toFixed(2) + ' s</span>' +
        '<label class="mini">Fade in <input type="number" step="0.1" min="0" max="10" data-fade="fadeIn" value="' + (sel.c.fadeIn || 0) + '"></label>' +
        '<label class="mini">Fade out <input type="number" step="0.1" min="0" max="10" data-fade="fadeOut" value="' + (sel.c.fadeOut || 0) + '"></label>' +
        '<label class="mini">Start <input type="number" step="0.1" min="0" data-cstart value="' + B.round(sel.c.start, 2) + '"></label>' +
        '<label class="mini">Length <input type="number" step="0.1" min="0.1" data-clen value="' + B.round(B.clipLen(sel.c), 2) + '"></label>' +
        '<label class="mini">Name <input maxlength="40" data-cname value="' + esc(sel.c.name || '') + '"></label></div>' : '') +
      '<div class="tl"><div class="tl-heads">' + '<div class="tl-head ruler-h">Time</div>' + lanes.map(function (t) { return '<div class="tl-head k-' + esc(t.kind) + '">' + esc(t.name) + '</div>'; }).join('') + '<div class="tl-head">Captions</div><div class="tl-head">End card</div></div>' +
      '<div class="tl-scroll"><div class="tl-inner" data-w="' + W + '"><canvas class="tl-ruler" height="22" width="' + Math.min(W, 16000) + '"></canvas>' +
      lanes.map(function (t) {
        return '<div class="lane k-' + esc(t.kind) + '" data-track="' + esc(t.id) + '">' + t.clips.map(function (c) {
          return '<div class="clip' + (sel && sel.c === c ? ' sel' : '') + '" data-clip="' + esc(c.id) + '" data-l="' + (c.start * S.zoom) + '" data-w="' + Math.max(6, B.clipLen(c) * S.zoom) + '" tabindex="0" role="button" aria-label="' + esc((c.name || 'clip') + ', ' + B.clipLen(c).toFixed(1) + ' seconds at ' + c.start.toFixed(1)) + '">' +
            '<span class="h h-l" data-h="left"></span><span class="cn">' + esc(c.name || 'clip') + '</span>' + (t.kind !== 'video' ? '<canvas class="wave" height="34"></canvas>' : '') + '<span class="h h-r" data-h="right"></span></div>';
        }).join('') + '</div>';
      }).join('') +
      '<div class="lane caps">' + S.board.captions.map(function (c) { return '<div class="capblk" data-l="' + (c.start * S.zoom) + '" data-w="' + Math.max(4, (c.end - c.start) * S.zoom) + '" title="' + esc(c.text) + '">' + esc(c.text) + '</div>'; }).join('') + '</div>' +
      '<div class="lane ecl">' + (ec.on ? '<div class="ecblk" data-l="' + (prog * S.zoom) + '" data-w="' + (ec.dur * S.zoom) + '">End card · ' + esc(ec.cta || '') + '</div>' : '') + '</div>' +
      '<div class="tl-playhead" aria-hidden="true"></div></div></div></div>' +
      '<p class="fine">Drag clips to move, drag their edges to trim. Drop media, sounds or finished renders on a lane. Space plays, S splits, Delete removes.</p>';
    var inner = $('.tl-inner', el); inner.style.width = W + 'px';
    $$('[data-l]', el).forEach(function (n) { n.style.left = n.dataset.l + 'px'; n.style.width = n.dataset.w + 'px'; });
    drawRuler($('.tl-ruler', el), dur);
    $$('.clip canvas.wave', el).forEach(function (cv) { drawWave(cv); });
    movePlayhead();
    wireTimeline(el, lanes);
  };
  function selected() {
    if (!S.sel) return null;
    for (var i = 0; i < S.board.tracks.length; i++) {
      var t = S.board.tracks[i], c = t.clips.filter(function (x) { return x.id === S.sel; })[0];
      if (c) return { t: t, c: c };
    }
    return null;
  }
  function drawRuler(cv, dur) {
    var c = cv.getContext('2d'), z = S.zoom; c.clearRect(0, 0, cv.width, 22);
    var beat = S.board.bpm > 0 ? 60 / S.board.bpm : 0;
    if (beat && beat * z > 6) { c.fillStyle = 'rgba(255,255,255,.12)'; for (var b = 0; b < dur; b += beat) c.fillRect(Math.round(b * z), 14, 1, 8); }
    var step = z > 80 ? 1 : z > 30 ? 2 : 5;
    c.fillStyle = 'rgba(255,255,255,.55)'; c.font = '10px ui-monospace, monospace';
    for (var s = 0; s <= dur; s += step) { var x = Math.round(s * z); c.fillRect(x, 8, 1, 14); c.fillText(B.timecode(s).slice(0, 5), x + 3, 9); }
  }
  function drawWave(cv) {
    var clipEl = cv.closest('.clip'), id = clipEl.dataset.clip, f = findClip(id); if (!f) return;
    var w = Math.max(4, Math.floor(parseFloat(clipEl.dataset.w))); cv.width = Math.min(w, 8000);
    var buf = M.lib.buffer(f.c.media);
    if (!buf) { M.lib.ensureBuffer(f.c.media).then(function (b) { if (b && cv.isConnected) drawWave(cv); }); return; }
    var c = cv.getContext('2d'), d = buf.getChannelData(0), sr = buf.sampleRate, H = cv.height;
    c.fillStyle = 'rgba(255,255,255,.55)';
    for (var x = 0; x < cv.width; x++) {
      var t0 = f.c.in + (x / cv.width) * B.clipLen(f.c), i0 = Math.floor(t0 * sr), i1 = Math.min(d.length, i0 + Math.ceil(sr * B.clipLen(f.c) / cv.width)), mx = 0;
      for (var i = i0; i < i1; i += 16) { var v = Math.abs(d[i]); if (v > mx) mx = v; }
      var h = Math.max(1, mx * H); c.fillRect(x, (H - h) / 2, 1, h);
    }
  }
  function findClip(id) {
    for (var i = 0; i < S.board.tracks.length; i++) { var c = S.board.tracks[i].clips.filter(function (x) { return x.id === id; })[0]; if (c) return { t: S.board.tracks[i], c: c }; }
    return null;
  }
  function laneAccepts(kind, media) {
    var it = M.lib.get(media), mk = it ? it.kind : (/^job:/.test(media) ? 'video' : /^sfx:/.test(media) ? 'audio' : '');
    if (kind === 'video') return mk === 'video' || mk === 'image';
    return mk === 'audio' || mk === 'video';   // audio lanes can take a video's sound
  }
  function wireTimeline(el, lanes) {
    var scroll = $('.tl-scroll', el), inner = $('.tl-inner', el);
    var xToT = function (clientX) { var r = inner.getBoundingClientRect(); return Math.max(0, (clientX - r.left) / S.zoom); };
    $('.tl-ruler', el).addEventListener('pointerdown', function (e) {
      seek(xToT(e.clientX));
      var mv = function (ev) { seek(xToT(ev.clientX)); }, up = function () { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); };
      addEventListener('pointermove', mv); addEventListener('pointerup', up);
    });
    $$('.clip', el).forEach(function (node) {
      node.addEventListener('pointerdown', function (e) {
        if (e.button !== 0) return;
        var f = findClip(node.dataset.clip); if (!f) return;
        e.preventDefault(); node.setPointerCapture(e.pointerId);
        S.sel = f.c.id; $$('.clip.sel', el).forEach(function (x) { x.classList.remove('sel'); }); node.classList.add('sel');
        var mode = e.target.dataset.h || 'move', t0 = xToT(e.clientX), s0 = f.c.start, moved = false;
        var before = JSON.stringify(B.serializeBoard(S.board));
        var pts = S.snap ? B.snapPoints(S.board, f.c.id, S.board.bpm).concat([S.t]) : [];
        var thr = 8 / S.zoom;
        var mv = function (ev) {
          var t = xToT(ev.clientX); moved = moved || Math.abs(t - t0) * S.zoom > 3; if (!moved) return;
          if (mode === 'move') {
            var ns = Math.max(0, s0 + (t - t0)); if (S.snap) { var sn = B.snapTime(ns, pts, thr), se = B.snapTime(ns + B.clipLen(f.c), pts, thr) - B.clipLen(f.c); ns = Math.abs(sn - ns) <= Math.abs(se - ns) ? sn : se; }
            f.c.start = B.round(ns, 3); node.style.left = (f.c.start * S.zoom) + 'px';
          } else {
            var tt = S.snap ? B.snapTime(t, pts, thr) : t;
            B.trimClip(f.t, f.c, mode, tt, M.lib.duration(f.c.media));
            node.style.left = (f.c.start * S.zoom) + 'px'; node.style.width = Math.max(6, B.clipLen(f.c) * S.zoom) + 'px';
          }
          drawMonitor(true);
        };
        var up = function () {
          node.removeEventListener('pointermove', mv); node.removeEventListener('pointerup', up);
          if (moved) {
            S.hist.stack.push(before); S.hist.redoStack = [];
            if (mode === 'move') B.placeClip(f.t, f.c, f.c.start);
            changed(['timeline']); drawMonitor(true);
          } else refresh('timeline');
        };
        node.addEventListener('pointermove', mv); node.addEventListener('pointerup', up);
      });
      node.addEventListener('keydown', function (e) {
        var f = findClip(node.dataset.clip); if (!f) return;
        if (e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
          e.preventDefault(); S.hist.push(S.board); S.sel = f.c.id;
          B.placeClip(f.t, f.c, f.c.start + (e.key === 'ArrowRight' ? 1 : -1) * (e.shiftKey ? 1 : 1 / 30));
          changed(['timeline']); var n = $('[data-clip="' + f.c.id + '"]'); if (n) n.focus();
        } else if (e.key === 'Enter') { S.sel = f.c.id; refresh('timeline'); }
      });
    });
    $$('.lane[data-track]', el).forEach(function (lane) {
      var t = S.board.tracks.filter(function (x) { return x.id === lane.dataset.track; })[0];
      lane.addEventListener('dragover', function (e) { var ty = e.dataTransfer.types; if (ty.indexOf('text/x-mw-media') !== -1 || ty.indexOf('Files') !== -1) { e.preventDefault(); lane.classList.add('drop-on'); } });
      lane.addEventListener('dragleave', function () { lane.classList.remove('drop-on'); });
      lane.addEventListener('drop', function (e) {
        e.preventDefault(); lane.classList.remove('drop-on');
        if (!can('timeline')) return;
        var at = xToT(e.clientX), media = e.dataTransfer.getData('text/x-mw-media');
        if (media) return dropMedia(t, media, at);
        var files = Array.prototype.slice.call(e.dataTransfer.files || []);
        files.reduce(function (p, file) { return p.then(function (tAt) { return M.lib.add(file).then(function (it) { refresh('library'); return dropMedia(t, it.id, tAt); }).catch(function (er) { toast(er.message, 'bad'); return tAt; }); }); }, Promise.resolve(at));
      });
    });
    $$('[data-tool]', el).forEach(function (b) { b.addEventListener('click', function () { tool(b.dataset.tool); }); });
    $$('[data-opt]', el).forEach(function (i) { i.addEventListener('change', function () { S[i.dataset.opt] = i.checked; }); });
    $('[data-zoom]', el).addEventListener('input', function (e) { S.zoom = Number(e.target.value); var keep = S.t; refresh('timeline'); S.t = keep; movePlayhead(); });
    $('[data-import]', el).addEventListener('change', function (e) { importFiles(e.target.files); e.target.value = ''; });
    var sel = selected();
    if (sel) {
      $$('[data-fade]', el).forEach(function (i) { i.addEventListener('change', function () { S.hist.push(S.board); sel.c[i.dataset.fade] = B.clamp(Number(i.value) || 0, 0, B.clipLen(sel.c) / 2); changed(['timeline']); }); });
      $('[data-cname]', el).addEventListener('change', function (e) { S.hist.push(S.board); sel.c.name = e.target.value.slice(0, 40); changed(['timeline']); });
      // Typed start/length: the no-drag way to move and trim (WCAG 2.5.7).
      $('[data-cstart]', el).addEventListener('change', function (e) { S.hist.push(S.board); B.placeClip(sel.t, sel.c, Math.max(0, Number(e.target.value) || 0)); changed(['timeline']); drawMonitor(true); });
      $('[data-clen]', el).addEventListener('change', function (e) { S.hist.push(S.board); B.trimClip(sel.t, sel.c, 'right', sel.c.start + Math.max(0.1, Number(e.target.value) || 0.1), M.lib.duration(sel.c.media)); changed(['timeline']); drawMonitor(true); });
    }
    scroll.addEventListener('wheel', function (e) { if (e.ctrlKey) { e.preventDefault(); S.zoom = B.clamp(S.zoom * (e.deltaY < 0 ? 1.15 : 0.87), 12, 160); refresh('timeline'); } }, { passive: false });
  }
  function dropMedia(track, media, at) {
    var go = function (it) {
      if (!it) { toast('That media is not available.', 'bad'); return at; }
      if (!laneAccepts(track.kind, media)) { toast(track.kind === 'video' ? 'Drop video or images on Picture.' : 'Drop audio (or a video for its sound) here.', 'bad'); return at; }
      var len = it.kind === 'image' ? 4 : Math.max(0.5, Math.min(it.dur || 8, 600));
      S.hist.push(S.board);
      var clip = { id: B.uid('c'), media: media, name: it.name, in: 0, out: B.round(len, 3) };
      var start = S.snap ? B.snapTime(at, B.snapPoints(S.board, '', S.board.bpm), 8 / S.zoom) : at;
      B.placeClip(track, clip, start); S.sel = clip.id;
      if (track.kind !== 'video') M.lib.ensureBuffer(media);
      changed(['timeline']); drawMonitor(true);
      return B.clipEnd(clip);
    };
    if (/^sfx:/.test(media)) {
      var s = M.audio.sounds().filter(function (x) { return 'sfx:' + x.id === media; })[0];
      return s ? M.audio.soundToMedia(s).then(go) : at;
    }
    if (/^job:/.test(media) && !M.lib.get(media)) {
      var q = S.board.queue.filter(function (x) { return 'job:' + x.job === media; })[0];
      if (q) { addJobToTimeline(q); return at; }
    }
    return go(M.lib.get(media));
  }
  function importFiles(list) {
    var files = Array.prototype.slice.call(list || []);
    files.reduce(function (p, f) { return p.then(function () { return M.lib.add(f).then(function () { toast('Imported ' + f.name); }, function (e) { toast(e.message, 'bad'); }); }); }, Promise.resolve())
      .then(function () { refresh('library'); });
  }
  function tool(name) {
    var sel = selected();
    if (name === 'undo' || name === 'redo') {
      var b = name === 'undo' ? S.hist.undo(S.board) : S.hist.redo(S.board);
      if (b) { S.board = hydrate(b); changed(); renderGrid(); renderTop(); drawMonitor(true); }
      return;
    }
    if (name === 'stitch') { S.hist.push(S.board); S.board.tracks.forEach(function (t) { if (LANE_KINDS[t.kind]) B.stitch(t); }); changed(['timeline']); drawMonitor(true); return; }
    if (!sel) return toast('Click a clip first.');
    if (name === 'split') {
      S.hist.push(S.board);
      if (!B.splitClip(sel.t, sel.c.id, S.t)) { S.hist.stack.pop(); return toast('Put the playhead inside the selected clip.'); }
      changed(['timeline']);
    }
    if (name === 'delete') { S.hist.push(S.board); B.removeClip(sel.t, sel.c.id, S.ripple); S.sel = null; changed(['timeline']); drawMonitor(true); }
  }

  PANELS.library = function (el) {
    var mine = Object.keys(M.lib.items).map(function (k) { return M.lib.items[k]; }).filter(function (it) { return !it.demo && !it.sfx && !it.remote; });
    var demos = Object.keys(M.DEMOS);
    var sounds = M.audio.sounds();
    el.innerHTML = '<div class="dropzone" tabindex="0">Drop video, audio or images here<br><span class="muted">Files stay on this device. Nothing is uploaded.</span><label class="file-btn">Choose files<input type="file" multiple accept="video/*,audio/*,image/*" hidden></label></div>' +
      '<h3 class="sub">Your media</h3><ul class="media">' + (mine.length ? mine.map(mediaLi).join('') : '<li class="muted">Nothing yet.</li>') + '</ul>' +
      '<h3 class="sub">Demo clips</h3><ul class="media">' + demos.map(function (id) { return mediaLi(M.lib.get(id)); }).join('') + '</ul>' +
      '<h3 class="sub">Sound library</h3>' + (sounds.length ? '<div class="pads">' + sounds.map(function (s) { return '<button class="pad" draggable="true" data-sfx="' + esc(s.id) + '" title="Click to hear, drag to a lane">' + esc(s.name) + '</button>'; }).join('') + '</div>' : '<p class="muted">The sound library loads with the dashboard sound pack.</p>');
    var input = $('input[type=file]', el);
    input.addEventListener('change', function () { importFiles(input.files); input.value = ''; });
    var dz = $('.dropzone', el);
    dz.addEventListener('dragover', function (e) { if (e.dataTransfer.types.indexOf('Files') !== -1) { e.preventDefault(); dz.classList.add('drop-on'); } });
    dz.addEventListener('dragleave', function () { dz.classList.remove('drop-on'); });
    dz.addEventListener('drop', function (e) { e.preventDefault(); dz.classList.remove('drop-on'); importFiles(e.dataTransfer.files); });
    $$('[data-media]', el).forEach(function (li) {
      li.addEventListener('dragstart', function (e) { e.dataTransfer.setData('text/x-mw-media', li.dataset.media); e.dataTransfer.effectAllowed = 'copy'; });
      var rm = $('[data-rm]', li); if (rm) rm.addEventListener('click', function () { M.lib.remove(li.dataset.media).then(function () { refresh('library'); drawMonitor(true); }); });
      var add = $('[data-add]', li); if (add) add.addEventListener('click', function () {
        var it = M.lib.get(li.dataset.media), t = it.kind === 'audio' ? S.board.tracks.filter(function (x) { return x.kind === 'music'; })[0] : S.board.tracks[0];
        if (t) dropMedia(t, it.id, B.trackEnd(t));
      });
    });
    $$('[data-sfx]', el).forEach(function (b) {
      var s = sounds.filter(function (x) { return x.id === b.dataset.sfx; })[0];
      b.addEventListener('click', function () { M.audio.preview(s); });
      b.addEventListener('dragstart', function (e) { e.dataTransfer.setData('text/x-mw-media', 'sfx:' + s.id); });
    });
  };
  function mediaLi(it) {
    if (!it) return '';
    var ico = { video: '🎬', audio: '🎵', image: '🖼' }[it.kind] || '•';
    return '<li draggable="true" data-media="' + esc(it.id) + '"><span aria-hidden="true">' + ico + '</span><span class="mname">' + esc(it.name) + '</span><span class="muted">' + (it.dur && isFinite(it.dur) ? it.dur.toFixed(1) + ' s' : it.kind === 'image' ? 'still' : '') + '</span>' +
      '<button data-add class="ghost" aria-label="Add ' + esc(it.name) + ' to the end of the timeline">+</button>' + (it.demo ? '' : '<button data-rm class="ghost" aria-label="Remove ' + esc(it.name) + '">×</button>') + '</li>';
  }

  PANELS.captions = function (el) {
    var ec = S.board.endcard;
    el.innerHTML = field('Script or voice-over text', '<textarea id="cap-script" rows="3" maxlength="4000" placeholder="Paste your script. Each chunk becomes a caption, timed at a natural reading pace."></textarea>') +
      '<div class="row"><button data-time>Time captions from playhead</button><button data-clear class="ghost">Clear all</button><button data-srt class="ghost">SRT</button><button data-vtt class="ghost">VTT</button></div>' +
      '<ol class="caps-list">' + S.board.captions.map(function (c) {
        return '<li data-id="' + esc(c.id) + '"><input type="number" step="0.1" min="0" data-c="start" value="' + c.start + '" aria-label="Start seconds"><input type="number" step="0.1" min="0" data-c="end" value="' + c.end + '" aria-label="End seconds"><input data-c="text" maxlength="120" value="' + esc(c.text) + '" aria-label="Caption text"><button data-go class="ghost" aria-label="Go to caption">⏵</button><button data-del class="ghost" aria-label="Delete caption">×</button></li>';
      }).join('') + '</ol>' +
      '<h3 class="sub">End card</h3><label class="chk"><input type="checkbox" data-e="on"' + (ec.on ? ' checked' : '') + '> Show an end card</label>' +
      '<div class="grid2">' + field('Headline', '<input data-e="title" maxlength="60" value="' + esc(ec.title) + '">') + field('Line under it', '<input data-e="sub" maxlength="80" value="' + esc(ec.sub) + '">') +
      field('Button text', '<input data-e="cta" maxlength="30" value="' + esc(ec.cta) + '">') + field('Web address shown', '<input data-e="url" maxlength="60" value="' + esc(ec.url) + '">') +
      field('Seconds', '<input data-e="dur" type="number" min="1" max="10" step="0.5" value="' + esc(ec.dur) + '">') + field('Style', '<select data-e="style"><option value="neon"' + (ec.style !== 'clean' ? ' selected' : '') + '>Neon</option><option value="clean"' + (ec.style === 'clean' ? ' selected' : '') + '>Clean</option></select>') + '</div>';
    $('[data-time]', el).addEventListener('click', function () {
      var txt = $('#cap-script', el).value; if (!txt.trim()) return toast('Paste a script first.');
      S.hist.push(S.board); S.board.captions = S.board.captions.concat(B.scriptToCaptions(txt, S.t, { maxChars: 34 })).sort(function (a, b) { return a.start - b.start; });
      changed(['captions', 'timeline']); drawMonitor(true);
    });
    $('[data-clear]', el).addEventListener('click', function () { S.hist.push(S.board); S.board.captions = []; changed(['captions', 'timeline']); drawMonitor(true); });
    $('[data-srt]', el).addEventListener('click', function () { dl(B.toSRT(S.board.captions), 'captions.srt', 'application/x-subrip'); });
    $('[data-vtt]', el).addEventListener('click', function () { dl(B.toVTT(S.board.captions), 'captions.vtt', 'text/vtt'); });
    $$('.caps-list li', el).forEach(function (li) {
      var c = S.board.captions.filter(function (x) { return x.id === li.dataset.id; })[0];
      $$('[data-c]', li).forEach(function (i) { i.addEventListener('change', function () { S.hist.push(S.board); c[i.dataset.c] = i.dataset.c === 'text' ? i.value : Math.max(0, Number(i.value) || 0); if (c.end <= c.start) c.end = B.round(c.start + 0.5, 2); changed(['timeline']); drawMonitor(true); }); });
      $('[data-go]', li).addEventListener('click', function () { seek(c.start + 0.01); });
      $('[data-del]', li).addEventListener('click', function () { S.hist.push(S.board); S.board.captions.splice(S.board.captions.indexOf(c), 1); changed(['captions', 'timeline']); drawMonitor(true); });
    });
    $$('[data-e]', el).forEach(function (i) {
      i.addEventListener('change', function () {
        S.hist.push(S.board);
        var k = i.dataset.e; ec[k] = k === 'on' ? i.checked : k === 'dur' ? B.clamp(Number(i.value) || 3, 1, 10) : i.value;
        changed(['timeline']); seek(k === 'on' || k === 'dur' ? S.t : B.programEnd(S.board) + 0.8);
      });
    });
  };

  PANELS.social = function (el) {
    var so = S.social, ai = M.hasAiClips(S.board);
    el.innerHTML = '<p class="muted">Pick where it goes. Each cut is cropped to the right shape, trimmed to length, keeps your end card, and gets its own caption.</p>' +
      '<div class="chips" role="group" aria-label="Platforms">' + Object.keys(B.PLATFORMS).map(function (k) { var p = B.PLATFORMS[k]; return '<label class="chip"><input type="checkbox" data-pf="' + k + '"' + (so.platforms.indexOf(k) !== -1 ? ' checked' : '') + '> ' + esc(p.name) + ' <small>' + p.aspect + '</small></label>'; }).join('') + '</div>' +
      '<div class="row"><label class="mini">Length <select data-len>' + [6, 15, 30, 60, 0].map(function (n) { return '<option value="' + n + '"' + (so.len === n ? ' selected' : '') + '>' + (n ? n + ' s' : 'Full edit') + '</option>'; }).join('') + '</select></label>' +
      '<label class="mini">Crop focus <input type="range" min="0" max="1" step="0.01" value="' + so.focusX + '" data-focus aria-label="Crop focus, left to right"></label>' +
      '<label class="chk"><input type="checkbox" data-capon' + (so.captions ? ' checked' : '') + '> Burn in captions</label>' +
      '<span class="pill ' + (ai ? 'warn' : '') + '">' + (ai ? 'AI-generated label: on (required for AI clips)' : 'AI label: added automatically when AI clips are used') + '</span></div>' +
      '<div class="cuts">' + so.platforms.map(function (k) { var p = B.PLATFORMS[k], plan = B.planCutdown(S.board, k, so.len || 0); return '<figure class="cut"><canvas data-prev="' + k + '" aria-label="' + esc(p.name) + ' preview"></canvas><figcaption><strong>' + esc(p.name) + '</strong> ' + p.w + '×' + p.h + ' · ' + plan.duration + ' s' + (plan.warnings.length ? '<br><span class="warn-t">' + esc(plan.warnings.join(' ')) + '</span>' : '') + '</figcaption></figure>'; }).join('') + '</div>' +
      '<h3 class="sub">Captions for each platform</h3><div class="grid2">' + field('Hook (first line)', '<input data-cp="hook" maxlength="150" value="' + esc(so.hook) + '" placeholder="Your house is talking.">') + field('Call to action', '<input data-cp="cta" maxlength="120" value="' + esc(so.cta) + '" placeholder="Book a free quote at the link.">') + '</div>' +
      field('Body', '<textarea data-cp="body" rows="2" maxlength="1500">' + esc(so.body) + '</textarea>') + field('Hashtags (optional, comma separated)', '<input data-cp="tags" maxlength="200" value="' + esc(so.tags) + '" placeholder="We suggest them from your project if blank">') +
      '<div class="caps-out">' + so.platforms.map(function (k) { var txt = captionFor(k); return '<div class="capo"><div class="row"><strong>' + esc(B.PLATFORMS[k].name) + '</strong><span class="muted">' + txt.length + ' / ' + B.PLATFORMS[k].capMax + '</span><button data-copy="' + k + '" class="ghost">Copy</button></div><pre>' + esc(txt) + '</pre></div>'; }).join('') + '</div>' +
      '<div class="row"><button data-export class="pri"' + (so.platforms.length ? '' : ' disabled') + '>Export ' + so.platforms.length + ' cut' + (so.platforms.length === 1 ? '' : 's') + '</button><span class="fine">Exports run on your device in real time (a 15 s cut takes about 15 s). Keep this tab in front for the smoothest result. Platform limits change; check before posting.</span></div><div id="soc-prog"></div>';
    $$('[data-pf]', el).forEach(function (i) { i.addEventListener('change', function () { var k = i.dataset.pf, a = so.platforms; if (i.checked && a.indexOf(k) === -1) a.push(k); if (!i.checked) a.splice(a.indexOf(k), 1); refresh('social'); }); });
    $('[data-len]', el).addEventListener('change', function (e) { so.len = Number(e.target.value); refresh('social'); });
    $('[data-focus]', el).addEventListener('input', function (e) { so.focusX = Number(e.target.value); drawPreviews(el); });
    $('[data-capon]', el).addEventListener('change', function (e) { so.captions = e.target.checked; drawPreviews(el); });
    $$('[data-cp]', el).forEach(function (i) { i.addEventListener('change', function () { so[i.dataset.cp] = i.value; refresh('social'); }); });
    $$('[data-copy]', el).forEach(function (b) { b.addEventListener('click', function () { copy(captionFor(b.dataset.copy)); }); });
    $('[data-export]', el).addEventListener('click', function () {
      var jobs = so.platforms.map(function (k) {
        var p = B.PLATFORMS[k], plan = B.planCutdown(S.board, k, so.len || 0);
        return { name: (S.board.name || 'spot') + ' ' + k + ' ' + Math.round(plan.duration) + 's', w: p.w, h: p.h, programUntil: plan.programUntil, endcardDur: plan.endcardDur, focusX: so.focusX, safe: p.safe, captions: so.captions, caption: captionFor(k) };
      });
      runExports(jobs, $('#soc-prog', el));
    });
    drawPreviews(el);
  };
  function captionFor(k) {
    var so = S.social, p = S.board.project || {};
    return B.buildCaption({ hook: so.hook || p.title, body: so.body || p.brief, cta: so.cta || (S.board.endcard.on ? S.board.endcard.cta : ''), title: p.title,
      tags: so.tags ? so.tags.split(',').map(function (x) { return x.trim(); }).filter(Boolean) : null, aiGenerated: M.hasAiClips(S.board) || so.aiLabel !== false }, k);
  }
  function drawPreviews(el) {
    $$('canvas[data-prev]', el).forEach(function (cv) {
      var p = B.PLATFORMS[cv.dataset.prev], sc = 220 / Math.max(p.w, p.h);
      cv.width = Math.round(p.w * sc); cv.height = Math.round(p.h * sc);
      var plan = B.planCutdown(S.board, cv.dataset.prev, S.social.len || 0);
      var b = S.board; if (!S.social.captions) { b = JSON.parse(JSON.stringify(B.serializeBoard(S.board))); b.captions = []; }
      M.draw(cv.getContext('2d'), cv.width, cv.height, b, Math.min(S.t, Math.max(0, plan.duration - 0.05)), { programUntil: plan.programUntil, focusX: S.social.focusX, safe: p.safe, showSafe: true, aiLabel: M.hasAiClips(S.board) });
    });
  }
  function runExports(jobs, out) {
    if (S.exporting) return toast('An export is already running.');
    if (!can('export')) return toast('Export is part of the Studio plan.', 'bad');
    pause();
    var ctl = { aborted: false }; S.exporting = ctl;
    out.innerHTML = '<div class="prog"><div class="bar"><i></i></div><span class="pl"></span><button class="ghost" data-cancel>Cancel</button></div><ul class="exports"></ul>';
    $('[data-cancel]', out).addEventListener('click', function () { ctl.aborted = true; });
    var bar = $('.bar i', out), pl = $('.pl', out), list = $('.exports', out);
    jobs.reduce(function (p, j, n) {
      return p.then(function () {
        if (ctl.aborted) return;
        pl.textContent = 'Exporting ' + (n + 1) + ' of ' + jobs.length + ': ' + j.name;
        var b = S.board; if (j.captions === false) { b = hydrate(JSON.parse(JSON.stringify(B.serializeBoard(S.board)))); b.captions = []; }
        return M.exportCut(b, { w: j.w, h: j.h, programUntil: j.programUntil, endcardDur: j.endcardDur, focusX: j.focusX, safe: j.safe, aiLabel: M.hasAiClips(S.board), signal: ctl,
          onProgress: function (f) { bar.style.width = Math.round(((n + f) / jobs.length) * 100) + '%'; } })
          .then(function (blob) {
            var li = document.createElement('li');
            var fname = j.name.replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-').toLowerCase() + (blob.type === 'video/mp4' ? '.mp4' : '.webm');
            li.innerHTML = '<span>' + esc(j.name) + '</span> <span class="muted">' + (blob.size / 1048576).toFixed(1) + ' MB · ' + (blob.type === 'video/mp4' ? 'MP4' : 'WebM (this browser cannot record MP4; convert before posting to Instagram)') + '</span> <button data-dl class="pri">Download</button>' + (j.caption ? ' <button data-cap class="ghost">Copy caption</button>' : '');
            $('[data-dl]', li).addEventListener('click', function () { M.download(blob, fname); });
            if (j.caption) $('[data-cap]', li).addEventListener('click', function () { copy(j.caption); });
            list.appendChild(li);
          });
      });
    }, Promise.resolve()).then(function () { pl.textContent = ctl.aborted ? 'Cancelled.' : 'Done. Download each cut below.'; bar.style.width = '100%'; })
      .catch(function (e) { pl.textContent = e.message === 'cancelled' ? 'Cancelled.' : e.message; })
      .then(function () { S.exporting = null; var c = $('[data-cancel]', out); if (c) c.remove(); });
  }

  PANELS.publish = function (el) {
    el.innerHTML = '<p class="muted">After you post a cut, log it here: it goes to your studio feed (allofus.one can follow it), fires your webhooks, and gives you share links.</p>' +
      field('Title', '<input data-p="title" maxlength="120" value="' + esc(S.board.project.title || '') + '">') +
      field('Link to the post (https)', '<input data-p="link" type="url" maxlength="500" placeholder="https://…">') +
      field('Caption', '<textarea data-p="caption" rows="3" maxlength="2200">' + esc(captionFor('allofus')) + '</textarea>') +
      '<div class="chips">' + Object.keys(B.PLATFORMS).map(function (k) { return '<label class="chip"><input type="checkbox" data-pp="' + k + '"> ' + esc(B.PLATFORMS[k].name) + '</label>'; }).join('') + '</div>' +
      '<label class="chk"><input type="checkbox" data-p="ai" checked> This includes AI-generated video or audio (adds the label; TikTok, Meta and YouTube also ask you to tick their own AI toggle)</label>' +
      '<label class="chk"><input type="checkbox" data-p="feed" checked> Add to my studio feed</label>' +
      '<div class="row"><button data-go class="pri">Publish</button></div><div id="pub-out"></div><h3 class="sub">Recent</h3><ul class="posts"><li class="muted">Loading…</li></ul>';
    $('[data-go]', el).addEventListener('click', function () {
      var v = function (k) { var i = $('[data-p="' + k + '"]', el); return i.type === 'checkbox' ? i.checked : i.value.trim(); };
      if (v('link') && !B.isHttpsUrl(v('link'))) return toast('The link must start with https://', 'bad');
      api('POST', '/v2/studio/publish', { title: v('title'), link: v('link'), caption: v('caption'), ai_generated: v('ai'), to_feed: v('feed'),
        platforms: $$('[data-pp]:checked', el).map(function (i) { return i.dataset.pp; }) })
        .then(function (r) {
          var out = $('#pub-out', el);
          out.innerHTML = '<div class="ok-box"><strong>Published.</strong> Share it: ' + Object.keys(r.share).map(function (k) { return '<a class="btn" target="_blank" rel="noopener noreferrer" href="' + esc(r.share[k]) + '">' + esc({ allofus: 'allofus.one', x: 'X', facebook: 'Facebook', linkedin: 'LinkedIn' }[k] || k) + '</a>'; }).join(' ') + '</div>';
          loadPosts(el);
        }).catch(function (e) { toast(e.message, 'bad'); });
    });
    loadPosts(el);
  };
  function loadPosts(el) {
    var ul = $('.posts', el); if (!ul || !cloud()) { if (ul) ul.innerHTML = '<li class="muted">Your posts show here.</li>'; return; }
    api('GET', '/v2/studio/posts').then(function (r) {
      ul.innerHTML = (r.posts || []).slice(0, 8).map(function (p) { return '<li><strong>' + esc(p.title) + '</strong> <span class="muted">' + esc((p.created_at || '').slice(0, 10)) + ' · ' + esc((p.platforms || []).join(', ')) + '</span>' + (p.link ? ' <a target="_blank" rel="noopener noreferrer" href="' + esc(p.link) + '">open</a>' : '') + '</li>'; }).join('') || '<li class="muted">No posts yet.</li>';
    }).catch(function () { ul.innerHTML = '<li class="muted">Could not load posts.</li>'; });
  }

  PANELS.hub = function (el) {
    el.innerHTML = '<p class="muted">allofus.one is your community hub. Send cuts to your feed, message collaborators, and pull leads and follows into this board.</p>' +
      '<div class="row"><a class="btn" target="_blank" rel="noopener noreferrer" href="https://allofus.one/?compose=1">Post on allofus.one</a><a class="btn" target="_blank" rel="noopener noreferrer" href="https://allofus.one/?v=dm">Messages</a><a class="btn" target="_blank" rel="noopener noreferrer" href="https://allofus.one/?v=circles">Circles</a><a class="btn" target="_blank" rel="noopener noreferrer" href="https://allofus.one/?v=grow">Grow your business</a></div>' +
      '<h3 class="sub">1. Your studio feed</h3><div class="hub-feed muted">Loading…</div>' +
      '<h3 class="sub">2. Leads and follows into this board</h3><div class="hub-in muted">Loading…</div>' +
      '<h3 class="sub">Hub inbox</h3><ul class="inbox"><li class="muted">Nothing yet.</li></ul>';
    if (!cloud()) { $('.hub-feed', el).textContent = 'Part of the Studio plan.'; $('.hub-in', el).textContent = 'Part of the Studio plan.'; return; }
    api('GET', '/v2/studio/feed').then(function (f) {
      var box = $('.hub-feed', el); box.classList.remove('muted');
      box.innerHTML = '<div class="copyrow"><code>' + esc(f.feed_url) + '</code><button data-copy class="ghost">Copy</button><button data-rot class="ghost" title="Make a new link and turn the old one off">New link</button></div><p class="fine">' + esc(f.how) + '</p>';
      $('[data-copy]', box).addEventListener('click', function () { copy(f.feed_url); });
      $('[data-rot]', box).addEventListener('click', function () { api('POST', '/v2/studio/feed').then(function () { refresh('hub'); }); });
    }).catch(function () { });
    api('GET', '/v2/studio/hub').then(function (h) {
      var box = $('.hub-in', el); box.classList.remove('muted');
      box.innerHTML = (h.connected ? '<div class="copyrow"><code>' + esc(h.inbound_url) + '</code><button data-copy class="ghost">Copy</button><button data-off class="ghost">Disconnect</button></div><p class="fine">Connected. Events allofus.one signs with your secret land in the inbox below.</p>'
        : '<p class="fine">On allofus.one: Grow your business → Connected tools → Any webhook. Copy the signing secret it shows, paste it here, then paste the address we give you back into allofus.one.</p><div class="row"><input data-secret type="password" autocomplete="off" maxlength="200" placeholder="Signing secret from allofus.one" aria-label="Signing secret from allofus.one"><button data-conn class="pri">Connect</button></div>');
      var c = $('[data-copy]', box); if (c) c.addEventListener('click', function () { copy(h.inbound_url); });
      var off = $('[data-off]', box); if (off) off.addEventListener('click', function () { api('POST', '/v2/studio/hub/disconnect', {}).then(function () { refresh('hub'); }); });
      var conn = $('[data-conn]', box); if (conn) conn.addEventListener('click', function () {
        api('POST', '/v2/studio/hub/connect', { secret: $('[data-secret]', box).value }).then(function () { toast('Connected to allofus.one'); refresh('hub'); }).catch(function (e) { toast(e.message, 'bad'); });
      });
      if (h.connected) api('GET', '/v2/studio/hub/inbox').then(function (r) {
        $('.inbox', el).innerHTML = (r.events || []).map(function (e) { return '<li><span class="pill">' + esc(e.event) + '</span> ' + esc(e.summary) + ' <span class="muted">' + esc((e.received_at || '').slice(0, 16).replace('T', ' ')) + '</span></li>'; }).join('') || '<li class="muted">Nothing yet.</li>';
      }).catch(function () { });
    }).catch(function () { });
  };

  PANELS.api = function (el) {
    var base = (S.access && S.access.api && S.access.api.base) || '/v2/studio/api';
    el.innerHTML = '<p class="muted">Automate your studio: read projects and boards, price and render shots, log posts. Keys work only while your Studio plan is active, and renders spend your credits like the board does.</p>' +
      '<h3 class="sub">API keys</h3><ul class="keys"><li class="muted">Loading…</li></ul>' +
      '<div class="row"><input data-kname maxlength="60" placeholder="Key name (e.g. Zapier)" aria-label="Key name"><label class="chk"><input type="checkbox" data-scope="read" checked> read</label><label class="chk"><input type="checkbox" data-scope="render"> render</label><label class="chk"><input type="checkbox" data-scope="publish"> publish</label><button data-newkey class="pri">Create key</button></div><div class="key-out"></div>' +
      '<h3 class="sub">Webhooks</h3><ul class="hooks"><li class="muted">Loading…</li></ul>' +
      '<div class="row"><input data-hurl type="url" maxlength="500" placeholder="https://your-endpoint…" aria-label="Webhook address"><label class="chk"><input type="checkbox" data-ev="job.done" checked> clip finished</label><label class="chk"><input type="checkbox" data-ev="post.published" checked> post published</label><label class="chk"><input type="checkbox" data-ev="board.saved"> board saved</label><button data-newhook class="pri">Add webhook</button></div><div class="hook-out"></div>' +
      '<details class="docs"><summary>Quick reference</summary><pre>' + esc(
        'curl -H "Authorization: Bearer mws_…" ' + base + '/me\n' +
        'GET  ' + base + '/projects | /boards | /jobs | /jobs/{id} | /posts\n' +
        'POST ' + base + '/quotes    {"prompt":"…","quality":"fast","duration_seconds":8,"aspect_ratio":"16:9","resolution":"1080p"}\n' +
        'POST ' + base + '/renders   {"quote_id":"q_…","confirm":true}\n' +
        'POST ' + base + '/publish   {"title":"…","link":"https://…","caption":"…"}\n\n' +
        'Webhooks: header X-MW-Signature: t=<unix>,sha256=<hex>\n' +
        'Verify: HMAC-SHA256(secret, "<t>." + raw_body) == hex, and |now - t| < 300 s.\n' +
        'Limits: 60 requests a minute per key, 20 renders an hour per key.') + '</pre></details>';
    if (!cloud()) return;
    var loadKeys = function () {
      api('GET', '/v2/studio/keys').then(function (r) {
        $('.keys', el).innerHTML = (r.keys || []).map(function (k) { return '<li><code>' + esc(k.prefix) + '…</code> ' + esc(k.name) + ' <span class="pill">' + esc(k.scopes.join(', ')) + '</span> <span class="muted">' + (k.last_used_at ? 'used ' + esc(k.last_used_at.slice(0, 10)) : 'never used') + '</span> <button data-revoke="' + esc(k.id) + '" class="ghost">Revoke</button></li>'; }).join('') || '<li class="muted">No keys yet.</li>';
        $$('[data-revoke]', el).forEach(function (b) { b.addEventListener('click', function () { confirmBox('Revoke this key?', 'Anything using it stops working right away.', 'Revoke').then(function (ok) { if (ok) api('DELETE', '/v2/studio/keys/' + b.dataset.revoke).then(loadKeys); }); }); });
      }).catch(function (e) { $('.keys', el).innerHTML = '<li class="muted">' + esc(e.message) + '</li>'; });
    };
    var loadHooks = function () {
      api('GET', '/v2/studio/webhooks').then(function (r) {
        $('.hooks', el).innerHTML = (r.webhooks || []).map(function (w) { return '<li><code>' + esc(w.url) + '</code> <span class="pill">' + esc(w.events.join(', ')) + '</span> <span class="muted">last: ' + esc(w.last_status == null ? '—' : w.last_status) + '</span> <button data-test="' + esc(w.id) + '" class="ghost">Send test</button><button data-hdel="' + esc(w.id) + '" class="ghost">Delete</button></li>'; }).join('') || '<li class="muted">No webhooks yet.</li>';
        $$('[data-test]', el).forEach(function (b) { b.addEventListener('click', function () { api('POST', '/v2/studio/webhooks/' + b.dataset.test + '/test', {}).then(function (r2) { toast(r2.ok ? 'Delivered (' + r2.status + ')' : 'Your endpoint answered ' + (r2.status || 'nothing'), r2.ok ? '' : 'bad'); loadHooks(); }); }); });
        $$('[data-hdel]', el).forEach(function (b) { b.addEventListener('click', function () { api('DELETE', '/v2/studio/webhooks/' + b.dataset.hdel).then(loadHooks); }); });
      }).catch(function (e) { $('.hooks', el).innerHTML = '<li class="muted">' + esc(e.message) + '</li>'; });
    };
    loadKeys(); loadHooks();
    $('[data-newkey]', el).addEventListener('click', function () {
      api('POST', '/v2/studio/keys', { name: $('[data-kname]', el).value, scopes: $$('[data-scope]:checked', el).map(function (i) { return i.dataset.scope; }) }).then(function (k) {
        var o = $('.key-out', el); o.innerHTML = '<div class="ok-box"><strong>Copy this key now.</strong> It is shown once.<div class="copyrow"><code>' + esc(k.token) + '</code><button data-copy class="ghost">Copy</button></div></div>';
        $('[data-copy]', o).addEventListener('click', function () { copy(k.token); }); loadKeys();
      }).catch(function (e) { toast(e.message, 'bad'); });
    });
    $('[data-newhook]', el).addEventListener('click', function () {
      var url = $('[data-hurl]', el).value.trim();
      if (!B.isHttpsUrl(url)) return toast('Use a public https address.', 'bad');
      api('POST', '/v2/studio/webhooks', { url: url, events: $$('[data-ev]:checked', el).map(function (i) { return i.dataset.ev; }) }).then(function (w) {
        var o = $('.hook-out', el); o.innerHTML = '<div class="ok-box"><strong>Signing secret (shown once):</strong><div class="copyrow"><code>' + esc(w.secret) + '</code><button data-copy class="ghost">Copy</button></div></div>';
        $('[data-copy]', o).addEventListener('click', function () { copy(w.secret); }); loadHooks();
      }).catch(function (e) { toast(e.message, 'bad'); });
    });
  };

  PANELS.admin = function (el) {
    el.innerHTML = '<p class="muted">Owner only. Checked on the server on every request.</p><div class="tiles">Loading…</div>';
    if (S.tier !== 'admin') return;
    api('GET', '/v2/studio/admin/overview').then(function (o) {
      var tile = function (k, v) { return '<div class="tile"><span>' + esc(k) + '</span><strong>' + esc(v) + '</strong></div>'; };
      $('.tiles', el).innerHTML = tile('Render spend today', '$' + (o.spent_today_usd || 0)) + tile('Daily cap', '$' + (o.daily_cap_usd || 0)) + tile('Running renders', o.running_jobs) + tile('Waitlist', o.waitlist) +
        tile('Studio boards', o.studio.boards) + tile('Posts', o.studio.posts) + tile('Live API keys', o.studio.keys) + tile('Producer leads', (o.producer || {}).new_leads || 0) +
        ((o.issues || []).concat(o.studio.issues || []).length ? '<div class="issues"><strong>Needs attention</strong><ul>' + (o.issues || []).concat(o.studio.issues || []).map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') + '</ul></div>' : '');
    }).catch(function (e) { $('.tiles', el).textContent = e.message; });
  };

  /* ------------------------------------------------------------------ keyboard */
  function keys(e) {
    var tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable) return;
    if (e.key === ' ') { e.preventDefault(); transport('play'); }
    else if (e.key === 'Home') seek(0);
    else if ((e.key === 's' || e.key === 'S') && !e.ctrlKey && !e.metaKey && can('timeline')) tool('split');
    else if ((e.key === 'Delete' || e.key === 'Backspace') && can('timeline') && S.sel) { e.preventDefault(); tool('delete'); }
    else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && can('timeline')) { e.preventDefault(); tool(e.shiftKey ? 'redo' : 'undo'); }
    else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); if (cloud()) saveCloud(); else { saveLocal(); toast('Saved on this device'); } }
    else if (e.key === 'ArrowLeft' && !e.altKey) seek(S.t - (e.shiftKey ? 1 : 1 / 30));
    else if (e.key === 'ArrowRight' && !e.altKey) seek(S.t + (e.shiftKey ? 1 : 1 / 30));
  }

  /* ------------------------------------------------------------------ boot */
  function boot() {
    if (S.playing) pause();
    clearTimeout(polling); clearTimeout(saveTimer);
    var start = token() ? api('GET', '/v2/studio/access').catch(function () { return null; }) : Promise.resolve(null);
    start.then(function (access) {
      S.access = access;
      S.tier = B.resolveTier({ access: access, hostname: location.hostname, search: location.search });
      var full = S.tier === 'studio' || S.tier === 'admin';
      S.board = hydrate(loadLocal() || demoBoard());
      renderShell();
      var ready = Promise.resolve();
      if (full && cloud()) {
        ready = listBoards().then(function () {
          if (S.boards.some(function (b) { return b.id === S.boardId; })) return openBoard(S.boardId);
          return api('POST', '/v2/studio/boards/' + S.boardId, { board: B.serializeBoard(S.board) }).then(function (r) { S.updatedAt = r.updated_at; return listBoards(); });
        }).catch(function (e) { toast(e.message, 'bad'); });
      }
      if (full) ready = ready.then(function () { return M.lib.load(); });
      return ready.then(function () {
        renderAll(); tick(); relinkJobs(); pollJobs();
        S.board.tracks.forEach(function (t) { t.clips.forEach(function (c) { if (/^demo:/.test(c.media)) M.lib.ensureBuffer(c.media); }); });
      });
    });
    if (!S.wired) {   // boot() may run again after sign-in; wire global listeners once
      S.wired = true;
      document.addEventListener('keydown', keys);
      addEventListener('beforeunload', function () { if (S.board) saveLocal(); });
    }
  }
  root.MWStudioBoard = { boot: boot, state: S };
  // Sites that sign in asynchronously set window.MW_STUDIO_MANUAL_BOOT = true, then call MWStudioBoard.boot()
  // once MW_ID_TOKEN is set. Calling boot() again after sign-in or sign-out is safe.
  if (!root.MW_STUDIO_MANUAL_BOOT) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  }
})(window);
