/* Madwackd Studio Creator Dashboard: audio engine + procedural sound library. Everything runs in the browser. */
(function (root) {
  'use strict';
  var D = root.MWDASH;
  var ctx = null, live = null, cache = {}, noiseBufs = new WeakMap();

  function getCtx() {
    if (!ctx) { var AC = root.AudioContext || root.webkitAudioContext; ctx = new AC(); }
    if (ctx.state === 'suspended' && ctx.resume) ctx.resume();
    return ctx;
  }
  function decodeFile(file) {
    return file.arrayBuffer().then(function (ab) { return getCtx().decodeAudioData(ab); });
  }
  function decodeBlob(blob) { return decodeFile(blob); }

  /* ---------- synth helpers ---------- */
  function noiseBuffer(c) {
    var b = noiseBufs.get(c);
    if (!b) {
      b = c.createBuffer(1, c.sampleRate * 3, c.sampleRate);
      var d = b.getChannelData(0), seed = 1;
      for (var i = 0; i < d.length; i++) { seed = (seed * 16807) % 2147483647; d[i] = (seed / 1073741823.5) - 1; }
      noiseBufs.set(c, b);
    }
    return b;
  }
  function envGain(c, out, t, a, d, peak) {
    var g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + Math.max(0.002, a));
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    g.connect(out); return g;
  }
  function osc(c, out, o) {
    var os = c.createOscillator(); os.type = o.type || 'sine';
    os.frequency.setValueAtTime(o.f0, o.t);
    if (o.f1) os.frequency.exponentialRampToValueAtTime(o.f1, o.t + o.d);
    os.connect(envGain(c, out, o.t, o.a || 0.01, o.d, o.peak == null ? 0.5 : o.peak));
    os.start(o.t); os.stop(o.t + o.d + 0.05);
  }
  function noise(c, out, o) {
    var s = c.createBufferSource(); s.buffer = noiseBuffer(c); s.loop = true;
    var f = c.createBiquadFilter(); f.type = o.ft || 'bandpass'; f.Q.value = o.q || 1;
    f.frequency.setValueAtTime(o.f0 || 1000, o.t);
    if (o.f1) f.frequency.exponentialRampToValueAtTime(o.f1, o.t + o.d);
    s.connect(f); f.connect(envGain(c, out, o.t, o.a || 0.01, o.d, o.peak == null ? 0.5 : o.peak));
    s.start(o.t, 0.1); s.stop(o.t + o.d + 0.05);
  }
  function bell(c, out, t, f, d, peak) {
    [1, 2.76, 5.4].forEach(function (m, i) { osc(c, out, { type: 'sine', f0: f * m, t: t, d: d / (1 + i * 0.6), peak: peak / (1 + i * 1.2), a: 0.004 }); });
  }

  var SOUNDS = [
    { id: 'whoosh', name: 'Whoosh', dur: 1.0, build: function (c, o) { noise(c, o, { t: 0, d: 1, a: 0.4, f0: 300, f1: 4000, q: 1.2, peak: 0.7 }); } },
    { id: 'riser', name: 'Riser', dur: 2.0, build: function (c, o) { noise(c, o, { t: 0, d: 2, a: 1.8, f0: 200, f1: 6000, q: 2, peak: 0.6 }); osc(c, o, { type: 'sawtooth', f0: 120, f1: 900, t: 0, d: 2, a: 1.8, peak: 0.12 }); } },
    { id: 'impact', name: 'Impact boom', dur: 1.6, build: function (c, o) { osc(c, o, { f0: 110, f1: 32, t: 0, d: 1.5, a: 0.004, peak: 0.95 }); noise(c, o, { t: 0, d: 0.5, a: 0.003, ft: 'lowpass', f0: 1800, f1: 120, peak: 0.6 }); } },
    { id: 'click', name: 'Click', dur: 0.08, build: function (c, o) { noise(c, o, { t: 0, d: 0.04, a: 0.001, ft: 'highpass', f0: 2500, peak: 0.6 }); osc(c, o, { type: 'square', f0: 1800, f1: 900, t: 0, d: 0.03, a: 0.001, peak: 0.15 }); } },
    { id: 'pop', name: 'Pop', dur: 0.15, build: function (c, o) { osc(c, o, { f0: 700, f1: 120, t: 0, d: 0.12, a: 0.002, peak: 0.8 }); } },
    { id: 'ding', name: 'Ding', dur: 1.5, build: function (c, o) { bell(c, o, 0, 1318, 1.4, 0.5); } },
    { id: 'swooshdown', name: 'Swoosh down', dur: 0.8, build: function (c, o) { noise(c, o, { t: 0, d: 0.8, a: 0.1, f0: 5000, f1: 250, q: 1.2, peak: 0.6 }); } },
    { id: 'kaching', name: 'Ka-ching', dur: 1.3, build: function (c, o) { noise(c, o, { t: 0, d: 0.06, a: 0.002, ft: 'highpass', f0: 3000, peak: 0.5 }); bell(c, o, 0.08, 2093, 1.1, 0.4); bell(c, o, 0.2, 3136, 1.0, 0.35); } },
    { id: 'heartbeat', name: 'Heartbeat', dur: 1.6, build: function (c, o) { [0, 0.22, 0.8, 1.02].forEach(function (t, i) { osc(c, o, { f0: 75, f1: 40, t: t, d: 0.16, a: 0.006, peak: i % 2 ? 0.55 : 0.9 }); }); } },
    { id: 'scratch', name: 'Record scratch', dur: 0.7, build: function (c, o) { noise(c, o, { t: 0, d: 0.25, a: 0.01, f0: 1500, f1: 3500, q: 4, peak: 0.5 }); noise(c, o, { t: 0.25, d: 0.3, a: 0.01, f0: 3500, f1: 700, q: 4, peak: 0.5 }); } },
    { id: 'blip', name: 'Notification blip', dur: 0.3, build: function (c, o) { osc(c, o, { type: 'triangle', f0: 880, t: 0, d: 0.1, peak: 0.5 }); osc(c, o, { type: 'triangle', f0: 1318, t: 0.09, d: 0.18, peak: 0.5 }); } },
    { id: 'glitch', name: 'Glitch', dur: 0.5, build: function (c, o) { for (var i = 0; i < 8; i++) osc(c, o, { type: 'square', f0: 200 + ((i * 397) % 1800), t: i * 0.055, d: 0.04, a: 0.002, peak: 0.25 }); noise(c, o, { t: 0, d: 0.45, ft: 'highpass', f0: 4000, peak: 0.15 }); } },
    { id: 'subdrop', name: 'Sub drop', dur: 1.8, build: function (c, o) { osc(c, o, { f0: 90, f1: 24, t: 0, d: 1.7, a: 0.02, peak: 0.95 }); } },
    { id: 'applause', name: 'Applause-ish burst', dur: 2.5, build: function (c, o) { noise(c, o, { t: 0, d: 2.4, a: 0.3, f0: 2500, q: 0.6, peak: 0.55 }); for (var i = 0; i < 40; i++) noise(c, o, { t: (i * 61) % 2000 / 1000, d: 0.03, a: 0.001, ft: 'highpass', f0: 1500, peak: 0.3 }); } },
    { id: 'laser', name: 'Laser zap', dur: 0.5, build: function (c, o) { osc(c, o, { type: 'sawtooth', f0: 2400, f1: 200, t: 0, d: 0.4, a: 0.005, peak: 0.3 }); } },
    { id: 'coin', name: 'Coin', dur: 0.6, build: function (c, o) { osc(c, o, { type: 'square', f0: 988, t: 0, d: 0.08, a: 0.002, peak: 0.2 }); osc(c, o, { type: 'square', f0: 1319, t: 0.08, d: 0.45, a: 0.002, peak: 0.2 }); } },
    { id: 'buzz', name: 'Error buzz', dur: 0.5, build: function (c, o) { osc(c, o, { type: 'sawtooth', f0: 110, t: 0, d: 0.45, a: 0.01, peak: 0.35 }); osc(c, o, { type: 'sawtooth', f0: 117, t: 0, d: 0.45, a: 0.01, peak: 0.3 }); } },
    { id: 'shutter', name: 'Camera shutter', dur: 0.25, build: function (c, o) { noise(c, o, { t: 0, d: 0.04, a: 0.001, ft: 'highpass', f0: 2000, peak: 0.5 }); noise(c, o, { t: 0.1, d: 0.06, a: 0.001, ft: 'highpass', f0: 1200, peak: 0.45 }); } },
    { id: 'bubble', name: 'Bubble', dur: 0.3, build: function (c, o) { osc(c, o, { f0: 300, f1: 900, t: 0, d: 0.15, a: 0.01, peak: 0.6 }); } },
    { id: 'chime', name: 'Success chime', dur: 1.3, build: function (c, o) { [523, 659, 784, 1047].forEach(function (f, i) { bell(c, o, i * 0.1, f, 1.0, 0.3); }); } },
    { id: 'swell', name: 'Pad swell', dur: 2.5, build: function (c, o) { [220, 277, 330].forEach(function (f) { osc(c, o, { type: 'sawtooth', f0: f, t: 0, d: 2.4, a: 1.2, peak: 0.08 }); }); noise(c, o, { t: 0, d: 2.4, a: 1.2, f0: 800, q: 0.7, peak: 0.1 }); } },
    { id: 'tick', name: 'Tick tock', dur: 1.0, build: function (c, o) { osc(c, o, { f0: 1400, f1: 1000, t: 0, d: 0.04, a: 0.001, peak: 0.5 }); osc(c, o, { f0: 1000, f1: 700, t: 0.5, d: 0.04, a: 0.001, peak: 0.5 }); } }
  ];

  function renderSound(s) {
    if (cache[s.id]) return Promise.resolve(cache[s.id]);
    var OAC = root.OfflineAudioContext || root.webkitOfflineAudioContext;
    var oc = new OAC(2, Math.ceil(44100 * (s.dur + 0.1)), 44100);
    var m = oc.createGain(); m.gain.value = 0.9; m.connect(oc.destination);
    s.build(oc, m);
    return oc.startRendering().then(function (b) { cache[s.id] = b; return b; });
  }
  var previewSrc = null;
  function previewSound(s) {
    return renderSound(s).then(function (b) {
      var c = getCtx(); if (previewSrc) { try { previewSrc.stop(); } catch (e) {} }
      var src = c.createBufferSource(); src.buffer = b; src.connect(c.destination); src.start(); previewSrc = src;
    });
  }

  /* ---------- mix graph (shared by live play, WAV render, video export) ---------- */
  function clipSegments(clip) {
    if (!clip._segs) clip._segs = D.voiceSegments(clip.buffer.getChannelData(0), clip.buffer.sampleRate, 0.02, 0.3);
    return clip._segs;
  }
  function duckAuto(S) {
    var segs = [];
    S.tracks.forEach(function (t) { if (t.kind === 'voice') t.clips.forEach(function (c) { clipSegments(c).forEach(function (s) { segs.push([s[0] + c.start, s[1] + c.start]); }); }); });
    return D.duckPoints(segs.sort(function (a, b) { return a[0] - b[0]; }), 0.3, 0.08, 0.4);
  }
  /* Build graph in context c, outputs to dest. Schedules everything from timeline time fromT at c-time base. extras: [{buffer,start}] */
  function buildAndStart(c, dest, S, fromT, base, opts) {
    opts = opts || {};
    var g = { nodes: {}, sources: [], master: c.createGain(), masterAn: null };
    g.master.gain.value = D.faderToGain(S.master);
    if (opts.meters) { g.masterAn = c.createAnalyser(); g.masterAn.fftSize = 1024; g.master.connect(g.masterAn); g.masterAn.connect(dest); } else g.master.connect(dest);
    var anySolo = S.tracks.some(function (t) { return t.solo; });
    var duck = S.autoDuck && D.can(S.tier, 'autoDuck') ? D.shiftPoints(duckAuto(S), fromT) : null;
    S.tracks.forEach(function (t) {
      var inG = c.createGain(), tg = c.createGain(), pan = c.createStereoPanner ? c.createStereoPanner() : null;
      tg.gain.value = D.trackGain(t, anySolo);
      if (duck && t.kind === 'music') {
        inG.gain.setValueAtTime(duck[0].g, base);
        for (var i = 1; i < duck.length; i++) inG.gain.linearRampToValueAtTime(duck[i].g, base + duck[i].t);
      }
      var an = null; inG.connect(tg);
      var last = tg;
      if (pan) { pan.pan.value = t.pan; tg.connect(pan); last = pan; }
      if (opts.meters) { an = c.createAnalyser(); an.fftSize = 1024; last.connect(an); an.connect(g.master); } else last.connect(g.master);
      g.nodes[t.id] = { inG: inG, tg: tg, pan: pan, an: an };
      t.clips.forEach(function (cl) {
        var end = cl.start + cl.buffer.duration;
        if (end <= fromT) return;
        var s = c.createBufferSource(); s.buffer = cl.buffer; s.connect(inG);
        var off = Math.max(0, fromT - cl.start), when = base + Math.max(0, cl.start - fromT);
        s.start(when, off); g.sources.push(s);
      });
    });
    (opts.extras || []).forEach(function (e) {
      var end = e.start + e.buffer.duration; if (end <= fromT) return;
      var s = c.createBufferSource(); s.buffer = e.buffer; s.connect(g.master);
      s.start(base + Math.max(0, e.start - fromT), Math.max(0, fromT - e.start)); g.sources.push(s);
    });
    return g;
  }
  function refreshLive(S) {
    if (!live) return;
    var anySolo = S.tracks.some(function (t) { return t.solo; });
    var c = getCtx();
    live.master.gain.setTargetAtTime(D.faderToGain(S.master), c.currentTime, 0.015);
    S.tracks.forEach(function (t) {
      var n = live.nodes[t.id]; if (!n) return;
      n.tg.gain.setTargetAtTime(D.trackGain(t, anySolo), c.currentTime, 0.015);
      if (n.pan) n.pan.pan.setTargetAtTime(t.pan, c.currentTime, 0.015);
    });
  }
  function play(S, fromT, onEnd, extraOpts) {
    stop(); var c = getCtx();
    var o = Object.assign({ meters: true }, extraOpts || {});
    live = buildAndStart(c, c.destination, S, fromT, c.currentTime + 0.05, o);
    live.startedAt = c.currentTime + 0.05; live.from = fromT;
    return live;
  }
  function stop() {
    if (!live) return;
    live.sources.forEach(function (s) { try { s.stop(); } catch (e) {} });
    try { live.master.disconnect(); } catch (e) {}
    live = null;
  }
  var buf = new Float32Array(1024);
  function rmsOf(an) { an.getFloatTimeDomainData(buf); var s = 0; for (var i = 0; i < buf.length; i++) s += buf[i] * buf[i]; return Math.sqrt(s / buf.length); }
  function levels() {
    var out = {}; if (!live) return out;
    Object.keys(live.nodes).forEach(function (k) { if (live.nodes[k].an) out[k] = rmsOf(live.nodes[k].an); });
    if (live.masterAn) out.master = rmsOf(live.masterAn);
    return out;
  }
  function mixDuration(S) {
    var d = 0; S.tracks.forEach(function (t) { t.clips.forEach(function (c) { d = Math.max(d, c.start + c.buffer.duration); }); }); return d;
  }
  function renderMix(S, seconds, extras) {
    var OAC = root.OfflineAudioContext || root.webkitOfflineAudioContext, sr = 44100;
    var oc = new OAC(2, Math.max(1, Math.ceil(seconds * sr)), sr);
    buildAndStart(oc, oc.destination, S, 0, 0, { extras: extras });
    return oc.startRendering();
  }
  function bufferToWavBlob(b) {
    var ch = []; for (var i = 0; i < b.numberOfChannels; i++) ch.push(b.getChannelData(i));
    return new Blob([D.encodeWav(ch, b.sampleRate)], { type: 'audio/wav' });
  }
  function nowTime(S) { return live && ctx ? live.from + (ctx.currentTime - live.startedAt) : null; }

  D.audio = { getCtx: getCtx, decodeFile: decodeFile, decodeBlob: decodeBlob, SOUNDS: SOUNDS, renderSound: renderSound, previewSound: previewSound,
    play: play, stop: stop, refreshLive: refreshLive, levels: levels, mixDuration: mixDuration, renderMix: renderMix,
    bufferToWavBlob: bufferToWavBlob, nowTime: nowTime, buildAndStart: buildAndStart, isPlaying: function () { return !!live; } };
})(window);
