/* Madwackd Studio Creator Dashboard: pure logic (tiers, mix math, timeline math, WAV, export settings).
   UI ONLY: every limit here is a convenience for the interface. The server must enforce real limits. */
(function (root) {
  'use strict';
  var INF = Infinity;
  var TIERS = {
    free:       { key: 'free',       label: 'Free',        price: 0,   projects: 1,  tracks: 3,   sounds: 12,  maxSeconds: 60,  exportRes: 720,  watermark: true,  captions: false, autoDuck: false, brandKit: false, multiBrandKits: false, seats: 1,  studioVoiceMin: 0,   talkingProducer: false, dashboard: false },
    starter:    { key: 'starter',    label: 'Starter',     price: 29,  projects: 5,  tracks: 6,   sounds: INF, maxSeconds: 180, exportRes: 1080, watermark: false, captions: true,  autoDuck: false, brandKit: false, multiBrandKits: false, seats: 1,  studioVoiceMin: 0,   talkingProducer: false, dashboard: true },
    pro:        { key: 'pro',        label: 'Pro',         price: 89,  projects: 25, tracks: INF, sounds: INF, maxSeconds: INF, exportRes: 1080, watermark: false, captions: true,  autoDuck: true,  brandKit: true,  multiBrandKits: false, seats: 1,  studioVoiceMin: 30,  talkingProducer: true, dashboard: true },
    studio:     { key: 'studio',     label: 'Studio',      price: 299, projects: INF, tracks: INF, sounds: INF, maxSeconds: INF, exportRes: 1080, watermark: false, captions: true,  autoDuck: true,  brandKit: true,  multiBrandKits: true,  seats: 3,  studioVoiceMin: 90,  talkingProducer: true, dashboard: true }
  };
  var UPGRADE = {
    autoDuck: ['pro', 'Pro unlocks auto-ducking: your music dips under your voice automatically.'],
    tracks: ['starter', 'Starter adds more tracks (6). Pro removes the limit.'],
    tracksMore: ['pro', 'Pro removes the track limit.'],
    sounds: ['starter', 'Starter unlocks the whole sound library.'],
    captions: ['starter', 'Starter unlocks burned-in captions.'],
    brandKit: ['pro', 'Pro unlocks your brand kit: logo and colors on every export.'],
    hd: ['starter', 'Starter exports in 1080p with no watermark.'],
    length: ['starter', 'Free exports are capped at 60 seconds. Starter allows 180; Pro is unlimited.'],
    lengthStarter: ['pro', 'Pro removes the length cap.'],
    voices: ['pro', 'Pro includes studio voice minutes when they launch.']
  };

  function resolveTier(o) {
    o = o || {};
    var t = o.userTier;
    var host = String(o.hostname || '');
    var local = host === 'localhost' || host === '127.0.0.1';
    if (local && o.search) {
      var m = /[?&]tier=([a-z]+)/i.exec(o.search);
      if (m) t = m[1];
    }
    t = String(t || 'free').toLowerCase();
    if (t === 'business' || t === 'agency' || t === 'whitelabel') t = 'studio';
    return TIERS[t] ? t : 'free';
  }
  function upgradeNote(feature, tierKey) {
    var u = UPGRADE[feature];
    if (feature === 'length' && tierKey === 'starter') u = UPGRADE.lengthStarter;
    if (feature === 'tracks' && tierKey === 'starter') u = UPGRADE.tracksMore;
    return u ? { need: u[0], text: u[1] } : null;
  }
  function can(tierKey, feature) {
    var t = TIERS[tierKey] || TIERS.free;
    return !!t[feature];
  }
  function canAddTrack(tierKey, count) { return count < (TIERS[tierKey] || TIERS.free).tracks; }
  function soundUnlocked(tierKey, index) { return index < (TIERS[tierKey] || TIERS.free).sounds; }

  /* Mix math */
  function faderToDb(f) { f = Math.max(0, Math.min(1, f)); return f <= 0 ? -Infinity : -60 + f * 66; }
  function faderToGain(f) { var d = faderToDb(f); return d === -Infinity ? 0 : Math.pow(10, d / 20); }
  var UNITY_FADER = 60 / 66;
  function trackGain(track, anySolo) {
    if (track.mute) return 0;
    if (anySolo && !track.solo) return 0;
    return faderToGain(track.fader);
  }
  function rmsToLeds(rms, n) {
    n = n || 12;
    if (!(rms > 0)) return 0;
    var db = 20 * Math.log10(rms);
    var f = (db + 48) / 48;
    return Math.max(0, Math.min(n, Math.round(f * n)));
  }
  /* Voice activity: returns [[start,end],...] in seconds */
  function voiceSegments(data, sr, thresh, minGap, win) {
    thresh = thresh == null ? 0.02 : thresh; minGap = minGap == null ? 0.25 : minGap;
    var w = Math.max(1, Math.floor(sr * (win || 0.02)));
    var segs = [], cur = null;
    for (var i = 0; i + w <= data.length; i += w) {
      var s = 0; for (var k = i; k < i + w; k++) s += data[k] * data[k];
      var r = Math.sqrt(s / w), t = i / sr;
      if (r >= thresh) { if (cur && t - cur[1] <= minGap) cur[1] = t + w / sr; else { cur = [t, t + w / sr]; segs.push(cur); } }
    }
    return segs;
  }
  /* Automation points [{t,g}] for a ducked track. depth = gain multiplier while voice is active. */
  function duckPoints(segments, depth, attack, release) {
    depth = depth == null ? 0.3 : depth; attack = attack == null ? 0.08 : attack; release = release == null ? 0.4 : release;
    var pts = [{ t: 0, g: 1 }], last = 0;
    segments.slice().sort(function (a, b) { return a[0] - b[0]; }).forEach(function (s) {
      var a = Math.max(last, s[0] - attack);
      pts.push({ t: a, g: 1 }, { t: Math.max(a, s[0]), g: depth }, { t: s[1], g: depth }, { t: s[1] + release, g: 1 });
      last = s[1] + release;
    });
    return pts;
  }
  function shiftPoints(pts, by) {
    var out = [], i, g0 = 1;
    for (i = 0; i < pts.length; i++) { if (pts[i].t <= by) g0 = pts[i].g; }
    out.push({ t: 0, g: g0 });
    for (i = 0; i < pts.length; i++) if (pts[i].t > by) out.push({ t: pts[i].t - by, g: pts[i].g });
    return out;
  }

  /* WAV (16-bit PCM) */
  function encodeWav(channels, sr) {
    var nch = channels.length, len = channels[0].length;
    var buf = new ArrayBuffer(44 + len * nch * 2), v = new DataView(buf);
    function str(o, s) { for (var i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); }
    str(0, 'RIFF'); v.setUint32(4, 36 + len * nch * 2, true); str(8, 'WAVE'); str(12, 'fmt ');
    v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, nch, true);
    v.setUint32(24, sr, true); v.setUint32(28, sr * nch * 2, true); v.setUint16(32, nch * 2, true); v.setUint16(34, 16, true);
    str(36, 'data'); v.setUint32(40, len * nch * 2, true);
    var o = 44;
    for (var i = 0; i < len; i++) for (var c = 0; c < nch; c++) {
      var s = Math.max(-1, Math.min(1, channels[c][i]));
      v.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true); o += 2;
    }
    return buf;
  }

  /* Timeline math. A clip: {id, in, out}. */
  function clipDur(c) { return Math.max(0, c.out - c.in); }
  function totalDuration(clips) { return clips.reduce(function (a, c) { return a + clipDur(c); }, 0); }
  function clipStart(clips, index) { var a = 0; for (var i = 0; i < index; i++) a += clipDur(clips[i]); return a; }
  function clipAt(clips, t) {
    var acc = 0;
    for (var i = 0; i < clips.length; i++) {
      var d = clipDur(clips[i]);
      if (t < acc + d || i === clips.length - 1) return { index: i, local: Math.max(0, Math.min(d, t - acc)), start: acc };
      acc += d;
    }
    return null;
  }
  function splitClip(clips, index, t, newId) {
    var c = clips[index];
    if (!c) return clips;
    var local = t - clipStart(clips, index);
    if (local <= 0.05 || local >= clipDur(c) - 0.05) return clips;
    var a = Object.assign({}, c, { out: c.in + local });
    var b = Object.assign({}, c, { id: newId, in: c.in + local });
    return clips.slice(0, index).concat([a, b], clips.slice(index + 1));
  }
  function trimClip(c, inV, outV, srcDur) {
    var i = Math.max(0, Math.min(inV, srcDur)), o = Math.max(0, Math.min(outV, srcDur));
    if (o - i < 0.1) { if (inV !== c.in) i = Math.max(0, o - 0.1); else o = Math.min(srcDur, i + 0.1); }
    return Object.assign({}, c, { in: i, out: o });
  }
  function moveClip(clips, from, to) {
    if (from === to || from < 0 || to < 0 || from >= clips.length || to >= clips.length) return clips.slice();
    var a = clips.slice(), x = a.splice(from, 1)[0]; a.splice(to, 0, x); return a;
  }
  function limitSeconds(tierKey) { return (TIERS[tierKey] || TIERS.free).maxSeconds; }
  function effectiveDuration(total, tierKey) { return Math.min(total, limitSeconds(tierKey)); }

  /* Export */
  var RATIOS = { '9:16': [9, 16], '16:9': [16, 9], '1:1': [1, 1] };
  function exportSettings(tierKey, aspect) {
    var t = TIERS[tierKey] || TIERS.free, r = RATIOS[aspect] || RATIOS['16:9'], s = t.exportRes;
    var w, h;
    if (r[0] === r[1]) { w = h = s; } else if (r[0] > r[1]) { h = s; w = Math.round(s * r[0] / r[1]); } else { w = s; h = Math.round(s * r[1] / r[0]); }
    return { width: w, height: h, watermark: t.watermark, captions: t.captions, maxSeconds: t.maxSeconds, brandKit: t.brandKit };
  }
  function fmtTime(s) {
    s = Math.max(0, s || 0); var m = Math.floor(s / 60), r = s - m * 60;
    return m + ':' + (r < 10 ? '0' : '') + r.toFixed(1);
  }

  var api = { TIERS: TIERS, UPGRADE: UPGRADE, resolveTier: resolveTier, upgradeNote: upgradeNote, can: can, canAddTrack: canAddTrack,
    soundUnlocked: soundUnlocked, faderToDb: faderToDb, faderToGain: faderToGain, UNITY_FADER: UNITY_FADER, trackGain: trackGain,
    rmsToLeds: rmsToLeds, voiceSegments: voiceSegments, duckPoints: duckPoints, shiftPoints: shiftPoints, encodeWav: encodeWav,
    clipDur: clipDur, totalDuration: totalDuration, clipAt: clipAt, splitClip: splitClip, clipStart: clipStart, trimClip: trimClip,
    moveClip: moveClip, limitSeconds: limitSeconds, effectiveDuration: effectiveDuration, exportSettings: exportSettings, fmtTime: fmtTime };
  root.MWDASH = Object.assign(root.MWDASH || {}, api);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
