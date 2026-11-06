/* Madwackd Studio Board: pure logic (tiers, layout, timeline math, captions, platform cutdowns, mix math).
   No DOM here, so it is unit-tested in Node. Tier checks here only shape the interface:
   the server decides what is allowed (GET /v2/studio/access) and enforces everything that costs money. */
(function (root) {
  'use strict';

  /* ---------------------------------------------------------------- tiers (mirror of the server's table) */
  var SHOWROOM = ['layout', 'storyboard', 'shotlist', 'captions', 'safezones'];
  var ALL = SHOWROOM.concat(['mixer', 'timeline', 'export', 'cutdowns', 'clip_queue', 'cloud_save', 'publish', 'hub', 'feed', 'api', 'webhooks']);
  var TIER_FEATURES = {
    anon: SHOWROOM, free: SHOWROOM,
    starter: SHOWROOM.concat(['dashboard']), pro: SHOWROOM.concat(['dashboard']),
    studio: ALL.concat(['dashboard']), admin: ALL.concat(['dashboard', 'admin'])
  };
  var TIER_LABEL = { anon: 'Guest', free: 'Free', starter: 'Starter', pro: 'Pro', studio: 'Studio', admin: 'Owner' };

  function resolveTier(o) {
    o = o || {};
    var t = o.access && o.access.tier;
    var host = String(o.hostname || '');
    var local = host === 'localhost' || host === '127.0.0.1';
    if (local && o.search) {   // preview override, localhost only
      var m = /[?&]as=([a-z]+)/i.exec(o.search);
      if (m) t = m[1].toLowerCase();
    }
    return TIER_FEATURES[t] ? t : 'anon';
  }
  function unlocked(tier, feature) {
    return (TIER_FEATURES[tier] || TIER_FEATURES.anon).indexOf(feature) !== -1;
  }
  function lockCopy(feature, tier) {
    var paidDash = tier === 'starter' || tier === 'pro';
    var what = {
      mixer: 'Mix music, voice, clip audio and sound effects on a real console: faders, pan, solo, mute and live meters.',
      timeline: 'Cut your spot on a multi-track timeline: trim, split, stitch, captions and end cards.',
      export: 'Export finished spots in full resolution, no watermark.',
      cutdowns: 'One click makes every social size: vertical, square, 4:5 and wide, cut to the right length with captions.',
      clip_queue: 'Send shots straight from your shot list to the render queue and drop finished clips on the timeline.',
      cloud_save: 'Your boards saved to your account, on every device.',
      publish: 'Publish with the AI-generated label handled, share links ready, and your own feed updated.',
      hub: 'Link your allofus.one hub: share to your feed, message collaborators, get leads into your board.',
      feed: 'Your own studio feed that allofus.one and readers can follow.',
      api: 'Personal API keys and signed webhooks to automate your studio.',
      webhooks: 'Signed webhooks when clips finish and posts go out.'
    }[feature] || 'Part of the Studio plan.';
    return {
      title: 'Studio plan', body: what,
      cta: paidDash ? 'Upgrade to Studio' : 'See the Studio plan', href: '/pricing/#studio',
      alt: paidDash ? { text: 'Open my Creator Dashboard', href: '/dashboard/' } : null
    };
  }

  /* ---------------------------------------------------------------- panels + layout */
  var PANELS = [
    { id: 'monitor', title: 'Program monitor', feature: 'timeline', size: 'l' },
    { id: 'library', title: 'Media + sounds', feature: 'mixer', size: 's' },
    { id: 'timeline', title: 'Edit timeline', feature: 'timeline', size: 'xl' },
    { id: 'mixer', title: 'Mixer', feature: 'mixer', size: 'l' },
    { id: 'projects', title: 'Projects', feature: 'storyboard', size: 's' },
    { id: 'storyboard', title: 'Storyboard', feature: 'storyboard', size: 'xl' },
    { id: 'shots', title: 'Shot list', feature: 'shotlist', size: 'm' },
    { id: 'queue', title: 'Clip queue', feature: 'clip_queue', size: 'm' },
    { id: 'social', title: 'Social feed generator', feature: 'cutdowns', size: 'l' },
    { id: 'publish', title: 'Publish', feature: 'publish', size: 's' },
    { id: 'captions', title: 'Captions + end card', feature: 'captions', size: 'm' },
    { id: 'hub', title: 'allofus.one hub', feature: 'hub', size: 'm' },
    { id: 'api', title: 'API + webhooks', feature: 'api', size: 'm' },
    { id: 'admin', title: 'Owner console', feature: 'admin', size: 'm' }
  ];
  var SIZES = ['s', 'm', 'l', 'xl'];
  var PRESETS = {
    everything: null,
    director: ['projects', 'storyboard', 'shots', 'queue', 'monitor', 'timeline'],
    music: ['monitor', 'mixer', 'library', 'timeline', 'captions'],
    social: ['monitor', 'social', 'captions', 'publish', 'hub'],
    automation: ['queue', 'publish', 'hub', 'api']
  };
  function panelById(id) { for (var i = 0; i < PANELS.length; i++) if (PANELS[i].id === id) return PANELS[i]; return null; }
  function defaultLayout() {
    var size = {};
    PANELS.forEach(function (p) { size[p.id] = p.size; });
    return { order: PANELS.map(function (p) { return p.id; }), size: size, hidden: [], preset: 'everything' };
  }
  function normalizeLayout(l) {
    var d = defaultLayout();
    if (!l || typeof l !== 'object') return d;
    var order = (Array.isArray(l.order) ? l.order : []).filter(function (id, i, a) { return panelById(id) && a.indexOf(id) === i; });
    d.order.forEach(function (id) { if (order.indexOf(id) === -1) order.push(id); });   // new panels appear
    var size = {};
    order.forEach(function (id) { size[id] = SIZES.indexOf(l.size && l.size[id]) !== -1 ? l.size[id] : d.size[id]; });
    var hidden = (Array.isArray(l.hidden) ? l.hidden : []).filter(function (id) { return panelById(id); });
    return { order: order, size: size, hidden: hidden, preset: typeof l.preset === 'string' ? l.preset : 'custom' };
  }
  function movePanel(l, id, beforeId) {
    l = normalizeLayout(l);
    if (id === beforeId || !panelById(id)) return l;
    var o = l.order.filter(function (x) { return x !== id; });
    var at = beforeId ? o.indexOf(beforeId) : -1;
    if (at === -1) o.push(id); else o.splice(at, 0, id);
    l.order = o; l.preset = 'custom';
    return l;
  }
  function resizePanel(l, id, dir) {
    l = normalizeLayout(l);
    var i = SIZES.indexOf(l.size[id]) + (dir > 0 ? 1 : -1);
    l.size[id] = SIZES[Math.max(0, Math.min(SIZES.length - 1, i))];
    l.preset = 'custom';
    return l;
  }
  function togglePanel(l, id, show) {
    l = normalizeLayout(l);
    var h = l.hidden.indexOf(id);
    var wantShow = show === undefined ? h !== -1 : show;
    if (wantShow && h !== -1) l.hidden.splice(h, 1);
    if (!wantShow && h === -1) l.hidden.push(id);
    l.preset = 'custom';
    return l;
  }
  function applyPreset(l, name) {
    l = normalizeLayout(l);
    var keep = PRESETS[name];
    if (keep === undefined) return l;
    if (keep === null) { l.hidden = []; }
    else {
      l.hidden = l.order.filter(function (id) { return keep.indexOf(id) === -1 && id !== 'admin'; });
      l.order = keep.concat(l.order.filter(function (id) { return keep.indexOf(id) === -1; }));
    }
    l.preset = name;
    return l;
  }

  /* ---------------------------------------------------------------- ids, escaping, time */
  var seq = 0;
  function uid(prefix) { seq = (seq + 1) % 1e6; return (prefix || 'x') + Date.now().toString(36) + seq.toString(36) + Math.floor(Math.random() * 1296).toString(36); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }
  function round(n, p) { var f = Math.pow(10, p || 3); return Math.round(n * f) / f; }
  function timecode(t, fps) {
    fps = fps || 30; t = Math.max(0, t || 0);
    var f = Math.floor((t % 1) * fps + 1e-6), s = Math.floor(t) % 60, m = Math.floor(t / 60);
    return pad(m) + ':' + pad(s) + ':' + pad(f);
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  /* ---------------------------------------------------------------- timeline math */
  var MIN_CLIP = 0.1;
  function clipLen(c) { return Math.max(0, c.out - c.in); }
  function clipEnd(c) { return c.start + clipLen(c); }
  function sortClips(track) { track.clips.sort(function (a, b) { return a.start - b.start; }); return track; }
  function trackEnd(track) { return track.clips.reduce(function (m, c) { return Math.max(m, clipEnd(c)); }, 0); }
  /* The program runs as long as the picture. Music or voice that runs past the last shot plays under the end card
     and stops at the end; with no picture yet, the longest audio track sets the length. */
  function programEnd(board) {
    var v = (board.tracks || []).filter(function (t) { return t.kind === 'video' && t.clips.length; })[0];
    if (v) return trackEnd(v);
    return (board.tracks || []).reduce(function (m, t) { return Math.max(m, trackEnd(t)); }, 0);
  }
  function totalDuration(board) {
    var e = programEnd(board);
    var ec = board.endcard && board.endcard.on ? Number(board.endcard.dur) || 0 : 0;
    return round(e + ec, 3);
  }
  function clipAt(track, t) {
    for (var i = 0; i < track.clips.length; i++) {
      var c = track.clips[i];
      if (t >= c.start && t < clipEnd(c)) return c;
    }
    return null;
  }
  /* Insert or move a clip; anything it overlaps is pushed right (ripple), so clips never stack. */
  function placeClip(track, clip, start) {
    clip.start = Math.max(0, round(start, 3));
    var others = track.clips.filter(function (c) { return c !== clip; });
    others.sort(function (a, b) { return a.start - b.start; });
    var out = [], placed = false;
    others.forEach(function (c) {
      if (!placed && c.start + clipLen(c) / 2 > clip.start) { out.push(clip); placed = true; }
      out.push(c);
    });
    if (!placed) out.push(clip);
    // resolve overlaps left to right, never moving anything left of where it was
    for (var i = 1; i < out.length; i++) {
      var prevEnd = clipEnd(out[i - 1]);
      if (out[i].start < prevEnd) out[i].start = round(prevEnd, 3);
    }
    track.clips = out;
    return track;
  }
  function splitClip(track, clipId, t) {
    var c = track.clips.filter(function (x) { return x.id === clipId; })[0];
    if (!c || t <= c.start + MIN_CLIP || t >= clipEnd(c) - MIN_CLIP) return null;
    var cut = round(c.in + (t - c.start), 3);
    var right = JSON.parse(JSON.stringify(c));
    right.id = uid('c'); right.in = cut; right.start = round(t, 3); right.fadeIn = 0;
    c.out = cut; c.fadeOut = 0;
    track.clips.splice(track.clips.indexOf(c) + 1, 0, right);
    return right;
  }
  /* Trim an edge to timeline time t. mediaDur = full length of the source (Infinity for stills/demo). */
  function trimClip(track, clip, edge, t, mediaDur) {
    mediaDur = mediaDur == null ? Infinity : mediaDur;
    sortClips(track);
    var i = track.clips.indexOf(clip);
    var prev = track.clips[i - 1], next = track.clips[i + 1];
    if (edge === 'left') {
      var minT = Math.max(prev ? clipEnd(prev) : 0, clip.start - clip.in);
      var nt = clamp(t, minT, clipEnd(clip) - MIN_CLIP);
      clip.in = round(clip.in + (nt - clip.start), 3); clip.start = round(nt, 3);
    } else {
      var maxT = Math.min(next ? next.start : Infinity, clip.start + (mediaDur - clip.in));
      var et = clamp(t, clip.start + MIN_CLIP, maxT);
      clip.out = round(clip.in + (et - clip.start), 3);
    }
    return clip;
  }
  /* Stitch: close every gap so clips play back to back. */
  function stitch(track) {
    sortClips(track);
    var t = 0;
    track.clips.forEach(function (c) { c.start = round(t, 3); t = clipEnd(c); });
    return track;
  }
  function removeClip(track, clipId, ripple) {
    var i = -1;
    track.clips.forEach(function (c, k) { if (c.id === clipId) i = k; });
    if (i === -1) return false;
    var gone = track.clips.splice(i, 1)[0];
    if (ripple) track.clips.forEach(function (c) { if (c.start > gone.start) c.start = round(c.start - clipLen(gone), 3); });
    return true;
  }
  function snapTime(t, points, threshold) {
    var best = t, d = threshold;
    (points || []).forEach(function (p) { var k = Math.abs(p - t); if (k < d) { d = k; best = p; } });
    return best;
  }
  function snapPoints(board, exceptClipId, bpm) {
    var pts = [0];
    (board.tracks || []).forEach(function (tr) {
      tr.clips.forEach(function (c) { if (c.id !== exceptClipId) { pts.push(c.start, clipEnd(c)); } });
    });
    if (bpm > 0) { var beat = 60 / bpm, end = totalDuration(board) + 30; for (var b = 0; b < end; b += beat) pts.push(round(b, 3)); }
    return pts;
  }
  /* Fade gain for a clip at local time (seconds since clip start). */
  function fadeGain(clip, local) {
    var len = clipLen(clip), g = 1;
    if (clip.fadeIn > 0 && local < clip.fadeIn) g = Math.min(g, local / clip.fadeIn);
    if (clip.fadeOut > 0 && local > len - clip.fadeOut) g = Math.min(g, (len - local) / clip.fadeOut);
    return clamp(g, 0, 1);
  }

  /* ---------------------------------------------------------------- mix math (same fader scale as the Creator Dashboard) */
  function faderToDb(f) { f = clamp(f, 0, 1); return f <= 0 ? -Infinity : -60 + f * 66; }
  function faderToGain(f) { var d = faderToDb(f); return d === -Infinity ? 0 : Math.pow(10, d / 20); }
  var UNITY = 60 / 66;
  function channelGain(track, anySolo) {
    if (track.mute) return 0;
    if (anySolo && !track.solo) return 0;
    return faderToGain(track.fader == null ? UNITY : track.fader);
  }
  function panLR(p) { p = clamp(p || 0, -1, 1); var a = (p + 1) * Math.PI / 4; return [Math.cos(a), Math.sin(a)]; }
  function rmsToMeter(rms) { if (!(rms > 0)) return 0; var db = 20 * Math.log10(rms); return clamp((db + 60) / 60, 0, 1); }

  /* ---------------------------------------------------------------- captions */
  function scriptToCaptions(text, startAt, opts) {
    opts = opts || {};
    var wps = (opts.wpm || 165) / 60, maxChars = opts.maxChars || 42, gap = opts.gap == null ? 0.05 : opts.gap;
    var words = String(text || '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
    var chunks = [], cur = '';
    words.forEach(function (w) {
      var next = cur ? cur + ' ' + w : w;
      var endsSentence = /[.!?]$/.test(cur);
      if ((next.length > maxChars || endsSentence) && cur) { chunks.push(cur); cur = w; } else cur = next;
    });
    if (cur) chunks.push(cur);
    var t = startAt || 0;
    return chunks.map(function (c) {
      var n = c.split(' ').length, d = Math.max(1.0, n / wps);
      var cap = { id: uid('cap'), start: round(t, 2), end: round(t + d, 2), text: c };
      t += d + gap;
      return cap;
    });
  }
  function captionAt(caps, t) {
    for (var i = 0; i < (caps || []).length; i++) if (t >= caps[i].start && t < caps[i].end) return caps[i];
    return null;
  }
  function srtTime(t, sep) {
    t = Math.max(0, t); var ms = Math.round((t % 1) * 1000), s = Math.floor(t);
    if (ms === 1000) { ms = 0; s++; }
    return pad(Math.floor(s / 3600)) + ':' + pad(Math.floor(s / 60) % 60) + ':' + pad(s % 60) + sep + ('00' + ms).slice(-3);
  }
  function toSRT(caps) {
    return (caps || []).slice().sort(function (a, b) { return a.start - b.start; }).map(function (c, i) {
      return (i + 1) + '\n' + srtTime(c.start, ',') + ' --> ' + srtTime(c.end, ',') + '\n' + String(c.text).replace(/\r?\n+/g, ' ');
    }).join('\n\n') + '\n';
  }
  function toVTT(caps) {
    return 'WEBVTT\n\n' + (caps || []).slice().sort(function (a, b) { return a.start - b.start; }).map(function (c) {
      return srtTime(c.start, '.') + ' --> ' + srtTime(c.end, '.') + '\n' + String(c.text).replace(/\r?\n+/g, ' ');
    }).join('\n\n') + '\n';
  }

  /* ---------------------------------------------------------------- social platforms
     Limits are from the platforms' published limits as known in 2025 and NOT re-checked live for this build
     [CONFIRM before ads]; platforms change them, so the UI says "check before posting".
     safe = fraction of the frame covered by the app's own buttons/captions (approximate) */
  var PLATFORMS = {
    tiktok:   { name: 'TikTok', aspect: '9:16', w: 1080, h: 1920, maxSec: 600, lens: [15, 30, 60], capMax: 4000, tags: 5, safe: { t: 0.09, b: 0.22, l: 0.04, r: 0.16 } },
    reels:    { name: 'Instagram Reels', aspect: '9:16', w: 1080, h: 1920, maxSec: 180, lens: [15, 30, 60], capMax: 2200, tags: 5, safe: { t: 0.1, b: 0.22, l: 0.05, r: 0.14 } },
    shorts:   { name: 'YouTube Shorts', aspect: '9:16', w: 1080, h: 1920, maxSec: 180, lens: [15, 30, 60], capMax: 5000, tags: 3, safe: { t: 0.08, b: 0.2, l: 0.04, r: 0.14 } },
    youtube:  { name: 'YouTube', aspect: '16:9', w: 1920, h: 1080, maxSec: 3600, lens: [15, 30, 60], capMax: 5000, tags: 3, safe: { t: 0.05, b: 0.1, l: 0.04, r: 0.04 } },
    igfeed:   { name: 'Instagram feed', aspect: '4:5', w: 1080, h: 1350, maxSec: 180, lens: [15, 30, 60], capMax: 2200, tags: 5, safe: { t: 0.05, b: 0.08, l: 0.04, r: 0.04 } },
    x:        { name: 'X', aspect: '16:9', w: 1280, h: 720, maxSec: 140, lens: [6, 15, 30], capMax: 280, tags: 2, safe: { t: 0.05, b: 0.1, l: 0.04, r: 0.04 } },
    linkedin: { name: 'LinkedIn', aspect: '1:1', w: 1080, h: 1080, maxSec: 600, lens: [15, 30, 60], capMax: 3000, tags: 3, safe: { t: 0.05, b: 0.1, l: 0.04, r: 0.04 } },
    allofus:  { name: 'allofus.one', aspect: '16:9', w: 1920, h: 1080, maxSec: 600, lens: [15, 30, 60], capMax: 2000, tags: 3, safe: { t: 0.05, b: 0.1, l: 0.04, r: 0.04 } }
  };
  function aspectRatio(a) { var p = String(a || '16:9').split(':'); return (Number(p[0]) || 16) / (Number(p[1]) || 9); }
  /* Cover-crop a source frame to a target aspect, centred on focus (0..1). */
  function cropRect(srcW, srcH, aspect, focusX, focusY) {
    var r = typeof aspect === 'number' ? aspect : aspectRatio(aspect);
    var fx = focusX == null ? 0.5 : clamp(focusX, 0, 1), fy = focusY == null ? 0.5 : clamp(focusY, 0, 1);
    var sw = srcW, sh = srcH;
    if (srcW / srcH > r) sw = srcH * r; else sh = srcW / r;
    return { sx: round(clamp(fx * srcW - sw / 2, 0, srcW - sw), 2), sy: round(clamp(fy * srcH - sh / 2, 0, srcH - sh), 2), sw: round(sw, 2), sh: round(sh, 2) };
  }
  /* Plan a cutdown: how much program to keep and how long the end card runs. */
  function planCutdown(board, platformKey, len) {
    var pf = PLATFORMS[platformKey];
    if (!pf) throw new Error('unknown platform');
    var prog = programEnd(board);
    var ec = board.endcard && board.endcard.on ? Number(board.endcard.dur) || 0 : 0;
    var target = Math.min(len || prog + ec, pf.maxSec);
    var ecUse = ec ? Math.min(ec, Math.max(1.5, target * 0.15)) : 0;
    var keep = Math.max(0, Math.min(prog, target - ecUse));
    var warn = [];
    if ((len || 0) > pf.maxSec) warn.push(pf.name + ' allows up to ' + pf.maxSec + ' s; trimmed.');
    if (prog + ec < (len || 0)) warn.push('Your edit is shorter than ' + len + ' s; the cut uses the full edit.');
    return { platform: platformKey, w: pf.w, h: pf.h, aspect: pf.aspect, programUntil: round(keep, 2), endcardDur: round(ecUse, 2), duration: round(keep + ecUse, 2), warnings: warn };
  }
  var STOP = ('a an and are as at be but by for from has have i in is it its of on or our so that the their this to was we were what when where which who will with you your my me us they them how why all new more get just make made').split(' ');
  function keywords(text, n) {
    var counts = {};
    String(text || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).forEach(function (w) {
      if (w.length < 3 || STOP.indexOf(w) !== -1 || /^\d+$/.test(w)) return;
      counts[w] = (counts[w] || 0) + 1;
    });
    return Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a] || a.localeCompare(b); }).slice(0, n || 5);
  }
  function hashtag(w) { return '#' + w.replace(/[^a-z0-9]/gi, '').replace(/^./, function (c) { return c.toUpperCase(); }); }
  /* Caption builder: hook + body + CTA + hashtags, trimmed to the platform's limit. AI label is kept when on. */
  function buildCaption(o, platformKey) {
    var pf = PLATFORMS[platformKey] || PLATFORMS.tiktok;
    var hook = String(o.hook || '').trim(), body = String(o.body || '').trim(), cta = String(o.cta || '').trim();
    var tags = (o.tags && o.tags.length ? o.tags : keywords([o.title, o.body, o.hook].join(' '), pf.tags)).slice(0, pf.tags).map(function (t) { return t.charAt(0) === '#' ? t : hashtag(t); });
    var label = o.aiGenerated === false ? '' : 'AI-generated';
    if (label) tags.push('#AIgenerated');
    var tail = [cta, label ? label + '.' : ''].filter(Boolean).join(' ');
    var tagLine = tags.join(' ');
    var reserved = (tail ? tail.length + 2 : 0) + (tagLine ? tagLine.length + 2 : 0);
    var head = [hook, body].filter(Boolean).join('\n\n');
    var room = pf.capMax - reserved;
    if (room < 0) { tagLine = label ? '#AIgenerated' : ''; room = pf.capMax - (tail ? tail.length + 2 : 0) - (tagLine ? tagLine.length + 2 : 0); }
    if (head.length > room) head = head.slice(0, Math.max(0, room - 1)).replace(/\s+\S*$/, '') + '…';
    var out = [head, tail, tagLine].filter(Boolean).join('\n\n');
    return out.length > pf.capMax ? out.slice(0, pf.capMax) : out;
  }

  /* ---------------------------------------------------------------- hub + share links ($0 hand-offs) */
  function shareLinks(link, text) {
    var e = encodeURIComponent;
    var out = { allofus: 'https://allofus.one/?share=' + e(link || 'https://madwackd.ai') + '&text=' + e(String(text || '').slice(0, 500)) };
    if (link) {
      out.x = 'https://x.com/intent/post?text=' + e(String(text || '').slice(0, 240)) + '&url=' + e(link);
      out.facebook = 'https://www.facebook.com/sharer/sharer.php?u=' + e(link);
      out.linkedin = 'https://www.linkedin.com/sharing/share-offsite/?url=' + e(link);
    }
    return out;
  }
  function isHttpsUrl(s) {
    try { var u = new URL(String(s)); return u.protocol === 'https:' && !!u.hostname && u.hostname.indexOf('.') !== -1 && !u.username && !u.password; }
    catch (e) { return false; }
  }

  /* ---------------------------------------------------------------- board doc */
  function newBoard(name) {
    return {
      version: 1, name: name || 'Untitled spot', bpm: 100,
      theme: { accent: 'gold' }, layout: defaultLayout(),
      project: { title: name || 'Untitled spot', client: '', brief: '', aspect: '16:9' },
      storyboard: [], shots: [], queue: [],
      tracks: [
        { id: 'v1', kind: 'video', name: 'Picture', fader: UNITY, pan: 0, mute: false, solo: false, clips: [] },
        { id: 'a1', kind: 'clipaudio', name: 'Clip audio', fader: UNITY, pan: 0, mute: false, solo: false, clips: [] },
        { id: 'm1', kind: 'music', name: 'Music', fader: 0.82, pan: 0, mute: false, solo: false, clips: [] },
        { id: 'vo1', kind: 'voice', name: 'Voice', fader: UNITY, pan: 0, mute: false, solo: false, clips: [] },
        { id: 'fx1', kind: 'sfx', name: 'Sound FX', fader: 0.85, pan: 0, mute: false, solo: false, clips: [] }
      ],
      captions: [], endcard: { on: true, title: '', sub: '', cta: 'Learn more', url: '', dur: 3, style: 'neon' },
      cutdowns: [], notes: ''
    };
  }
  /* Strip runtime-only fields (prefixed _) and anything the server would refuse, before saving. */
  function serializeBoard(b) {
    return JSON.parse(JSON.stringify(b, function (k, v) {
      if (k && k.charAt(0) === '_') return undefined;
      if (typeof v === 'string' && /^\s*(javascript|vbscript|data|blob|file):/i.test(v)) return '';
      if (typeof v === 'number' && !isFinite(v)) return 0;
      return v;
    }));
  }
  function History(limit) { this.stack = []; this.redoStack = []; this.limit = limit || 60; }
  History.prototype.push = function (b) { this.stack.push(JSON.stringify(serializeBoard(b))); if (this.stack.length > this.limit) this.stack.shift(); this.redoStack = []; };
  History.prototype.undo = function (cur) { if (!this.stack.length) return null; this.redoStack.push(JSON.stringify(serializeBoard(cur))); return JSON.parse(this.stack.pop()); };
  History.prototype.redo = function (cur) { if (!this.redoStack.length) return null; this.stack.push(JSON.stringify(serializeBoard(cur))); return JSON.parse(this.redoStack.pop()); };

  /* Shot list -> render request (the server re-validates and quotes; quality names are customer-facing). */
  function shotToRender(shot, project) {
    var parts = [shot.desc, shot.camera ? 'Camera: ' + shot.camera : '', shot.lens ? 'Lens: ' + shot.lens : '', shot.mood ? 'Mood: ' + shot.mood : ''].filter(Boolean);
    var aspect = (shot.aspect || (project && project.aspect) || '16:9');
    if (aspect !== '16:9' && aspect !== '9:16') aspect = '16:9';
    // The studio renders 4, 6 or 8 second shots; full HD is for 8-second shots.
    var d = Number(shot.dur) || 8, sec = d <= 5 ? 4 : d <= 7 ? 6 : 8;
    return { prompt: parts.join('. ').slice(0, 1800), aspect_ratio: aspect, duration_seconds: sec,
      quality: shot.quality === 'standard' ? 'standard' : 'fast', resolution: sec === 8 ? '1080p' : '720p' };
  }

  var api = {
    TIER_FEATURES: TIER_FEATURES, TIER_LABEL: TIER_LABEL, resolveTier: resolveTier, unlocked: unlocked, lockCopy: lockCopy,
    PANELS: PANELS, PRESETS: PRESETS, SIZES: SIZES, panelById: panelById, defaultLayout: defaultLayout, normalizeLayout: normalizeLayout,
    movePanel: movePanel, resizePanel: resizePanel, togglePanel: togglePanel, applyPreset: applyPreset,
    uid: uid, esc: esc, round: round, timecode: timecode, clamp: clamp,
    clipLen: clipLen, clipEnd: clipEnd, trackEnd: trackEnd, programEnd: programEnd, totalDuration: totalDuration, clipAt: clipAt,
    placeClip: placeClip, splitClip: splitClip, trimClip: trimClip, stitch: stitch, removeClip: removeClip,
    snapTime: snapTime, snapPoints: snapPoints, fadeGain: fadeGain, sortClips: sortClips,
    faderToDb: faderToDb, faderToGain: faderToGain, UNITY: UNITY, channelGain: channelGain, panLR: panLR, rmsToMeter: rmsToMeter,
    scriptToCaptions: scriptToCaptions, captionAt: captionAt, toSRT: toSRT, toVTT: toVTT,
    PLATFORMS: PLATFORMS, aspectRatio: aspectRatio, cropRect: cropRect, planCutdown: planCutdown, keywords: keywords, buildCaption: buildCaption,
    shareLinks: shareLinks, isHttpsUrl: isHttpsUrl, newBoard: newBoard, serializeBoard: serializeBoard, History: History, shotToRender: shotToRender
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.MWBoard = api;
})(typeof window !== 'undefined' ? window : this);
