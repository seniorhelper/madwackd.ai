/* Madwackd Studio Board: media engine. Everything runs on the user's device ($0 per use):
   media library (IndexedDB), mixer audio graph, program compositor, real-time exporter.
   Reuses the Creator Dashboard sound library (MWDASH.audio) when its script is on the page. */
(function (root) {
  'use strict';
  var B = root.MWBoard;

  /* ------------------------------------------------------------------ media library */
  var DB = 'mw-studio-media', STORE = 'files';
  function idb() {
    return new Promise(function (res, rej) {
      if (!root.indexedDB) return rej(new Error('no-idb'));
      var r = root.indexedDB.open(DB, 1);
      r.onupgradeneeded = function () { r.result.createObjectStore(STORE, { keyPath: 'id' }); };
      r.onsuccess = function () { res(r.result); };
      r.onerror = function () { rej(r.error); };
    });
  }
  function tx(mode, fn) {
    return idb().then(function (db) {
      return new Promise(function (res, rej) {
        var t = db.transaction(STORE, mode), s = t.objectStore(STORE), out = fn(s);
        t.oncomplete = function () { res(out && out.result !== undefined ? out.result : out); };
        t.onerror = function () { rej(t.error); };
      });
    });
  }
  var items = {};   // id -> {id,name,kind,dur,w,h,url,blob,buffer,el,remote}
  var ACCEPT = /^(video|audio|image)\//;
  var MAX_FILE = 1024 * 1024 * 1024;   // 1 GB per file, on-device only

  function kindOf(type) { return /^video\//.test(type) ? 'video' : /^audio\//.test(type) ? 'audio' : 'image'; }
  function probe(it) {
    return new Promise(function (res) {
      if (it.kind === 'image') {
        var im = new Image();
        im.onload = function () { it.w = im.naturalWidth; it.h = im.naturalHeight; it.dur = Infinity; it.el = im; res(it); };
        im.onerror = function () { res(it); };
        im.src = it.url; return;
      }
      var el = document.createElement(it.kind === 'video' ? 'video' : 'audio');
      el.preload = 'auto'; el.muted = true; el.playsInline = true;
      if (it.remote) el.crossOrigin = 'anonymous';
      el.onloadedmetadata = function () { it.dur = isFinite(el.duration) ? el.duration : 0; it.w = el.videoWidth || 0; it.h = el.videoHeight || 0; res(it); };
      el.onerror = function () { it.error = true; res(it); };
      el.src = it.url; it.el = el;
    });
  }
  function decode(it) {
    if (it.buffer || it.noAudio || it.kind === 'image') return Promise.resolve(it.buffer || null);
    var src = it.blob ? it.blob.arrayBuffer() : fetch(it.url, { credentials: 'omit' }).then(function (r) { return r.arrayBuffer(); });
    return src.then(function (ab) { return audio.ctx().decodeAudioData(ab); })
      .then(function (b) { it.buffer = b; if (!it.dur) it.dur = b.duration; return b; })
      .catch(function () { it.noAudio = true; return null; });
  }
  var lib = {
    items: items,
    add: function (file) {
      if (!file || !ACCEPT.test(file.type || '')) return Promise.reject(new Error('Use a video, audio or image file.'));
      if (file.size > MAX_FILE) return Promise.reject(new Error('That file is over 1 GB.'));
      var it = { id: B.uid('m'), name: String(file.name || 'media').slice(0, 120), kind: kindOf(file.type), type: file.type, blob: file, url: URL.createObjectURL(file) };
      items[it.id] = it;
      return probe(it).then(function () {
        decode(it);
        return tx('readwrite', function (s) { return s.put({ id: it.id, name: it.name, kind: it.kind, type: it.type, blob: file }); }).catch(function () { }).then(function () { return it; });
      });
    },
    addRemote: function (id, url, name) {   // finished renders (signed URL from the studio API)
      if (items[id]) return Promise.resolve(items[id]);
      var it = { id: id, name: name || 'Render', kind: 'video', url: url, remote: true };
      items[id] = it;
      return probe(it).then(function () { decode(it); return it; });
    },
    load: function () {
      return tx('readonly', function (s) { return s.getAll(); }).then(function (rows) {
        return Promise.all((rows || []).map(function (r) {
          if (items[r.id]) return items[r.id];
          var it = { id: r.id, name: r.name, kind: r.kind, type: r.type, blob: r.blob, url: URL.createObjectURL(r.blob) };
          items[it.id] = it;
          return probe(it).then(function () { decode(it); return it; });
        }));
      }).catch(function () { return []; });
    },
    remove: function (id) {
      var it = items[id]; if (!it) return Promise.resolve();
      if (it.url && !it.remote) URL.revokeObjectURL(it.url);
      delete items[id];
      return tx('readwrite', function (s) { return s.delete(id); }).catch(function () { });
    },
    get: function (id) { return items[id] || (DEMOS[id] ? demoItem(id) : null); },
    duration: function (id) { var it = lib.get(id); return it ? (it.dur || Infinity) : Infinity; },
    buffer: function (id) { var it = lib.get(id); return it ? it.buffer || null : null; },
    ensureBuffer: function (id) { var it = lib.get(id); return it ? (it.demo ? demoBuffer(it) : decode(it)) : Promise.resolve(null); }
  };

  /* ------------------------------------------------------------------ demo media (procedural, no files, $0) */
  var DEMOS = {
    'demo:dawn': { name: 'Dawn skyline', kind: 'video', dur: 8, hue: 28, title: 'OPEN' },
    'demo:neon': { name: 'Neon alley', kind: 'video', dur: 8, hue: 300, title: 'THE PROBLEM' },
    'demo:product': { name: 'Product hero', kind: 'video', dur: 6, hue: 190, title: 'THE FIX' },
    'demo:crowd': { name: 'Happy crowd', kind: 'video', dur: 6, hue: 130, title: 'PROOF' },
    'demo:music': { name: 'Studio groove (demo)', kind: 'audio', dur: 32, music: true },
    'demo:vo': { name: 'Voice slate (tone)', kind: 'audio', dur: 4, tone: true }
  };
  function demoItem(id) {
    if (items[id]) return items[id];
    var d = DEMOS[id], it = { id: id, name: d.name, kind: d.kind, dur: d.dur, demo: d, w: 1920, h: 1080 };
    items[id] = it; return it;
  }
  function demoBuffer(it) {
    if (it.buffer) return Promise.resolve(it.buffer);
    var OAC = root.OfflineAudioContext || root.webkitOfflineAudioContext, sr = 44100;
    if (!OAC) return Promise.resolve(null);
    var oc = new OAC(2, Math.ceil(sr * it.dur), sr), out = oc.createGain(); out.gain.value = 0.5; out.connect(oc.destination);
    if (it.demo.music) {   // simple chord loop + kick at 100 bpm
      var beat = 0.6, chords = [[220, 277, 330], [196, 247, 294], [175, 220, 262], [196, 247, 294]];
      for (var bar = 0; bar * beat * 4 < it.dur; bar++) {
        chords[bar % 4].forEach(function (f) {
          var o = oc.createOscillator(), g = oc.createGain(), t0 = bar * beat * 4;
          o.type = 'sawtooth'; o.frequency.value = f; g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(0.05, t0 + 0.2); g.gain.linearRampToValueAtTime(0, t0 + beat * 4);
          var lp = oc.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1400;
          o.connect(lp); lp.connect(g); g.connect(out); o.start(t0); o.stop(t0 + beat * 4);
        });
        for (var k = 0; k < 4; k++) {
          var t = bar * beat * 4 + k * beat, ko = oc.createOscillator(), kg = oc.createGain();
          ko.frequency.setValueAtTime(110, t); ko.frequency.exponentialRampToValueAtTime(40, t + 0.25);
          kg.gain.setValueAtTime(0.7, t); kg.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
          ko.connect(kg); kg.connect(out); ko.start(t); ko.stop(t + 0.32);
        }
      }
    } else {
      var o2 = oc.createOscillator(), g2 = oc.createGain(); o2.frequency.value = 440; g2.gain.value = 0.15;
      o2.connect(g2); g2.connect(out); o2.start(0); o2.stop(it.dur);
    }
    return oc.startRendering().then(function (b) { it.buffer = b; return b; });
  }
  function paintDemo(c, W, H, d, local) {
    var g = c.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, 'hsl(' + d.hue + ',70%,' + (18 + 8 * Math.sin(local)) + '%)');
    g.addColorStop(1, 'hsl(' + ((d.hue + 60) % 360) + ',80%,12%)');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.globalAlpha = 0.25;
    for (var i = 0; i < 14; i++) {
      var x = ((i * 137 + local * 60 * (1 + i % 3)) % (W + 200)) - 100;
      c.fillStyle = 'hsl(' + ((d.hue + i * 20) % 360) + ',90%,60%)';
      c.beginPath(); c.arc(x, H * (0.2 + (i % 5) * 0.15), 18 + (i % 4) * 14, 0, Math.PI * 2); c.fill();
    }
    c.globalAlpha = 1;
    c.fillStyle = 'rgba(255,255,255,.9)'; c.font = '800 ' + Math.round(H * 0.09) + 'px system-ui, sans-serif';
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(d.title, W / 2, H / 2);
    c.font = '600 ' + Math.round(H * 0.035) + 'px system-ui, sans-serif'; c.fillStyle = 'rgba(255,255,255,.6)';
    c.fillText('demo clip', W / 2, H / 2 + H * 0.08);
  }

  /* ------------------------------------------------------------------ audio engine */
  var actx = null, master = null, limiter = null, mAnalyser = null, streamDest = null, channels = {}, live = null;
  var AUDIO_KINDS = { clipaudio: 1, music: 1, voice: 1, sfx: 1 };
  var audio = {
    ctx: function () {
      if (!actx) {
        var AC = root.AudioContext || root.webkitAudioContext; actx = new AC();
        master = actx.createGain(); limiter = actx.createDynamicsCompressor();
        limiter.threshold.value = -3; limiter.knee.value = 0; limiter.ratio.value = 20; limiter.attack.value = 0.003; limiter.release.value = 0.1;
        mAnalyser = actx.createAnalyser(); mAnalyser.fftSize = 1024;
        streamDest = actx.createMediaStreamDestination();
        master.connect(limiter); limiter.connect(mAnalyser); mAnalyser.connect(actx.destination); limiter.connect(streamDest);
      }
      if (actx.state === 'suspended' && actx.resume) actx.resume();
      return actx;
    },
    stream: function () { audio.ctx(); return streamDest.stream; },
    channel: function (track) {
      var c = audio.ctx(), ch = channels[track.id];
      if (!ch) {
        ch = channels[track.id] = { input: c.createGain(), gain: c.createGain(), pan: c.createStereoPanner ? c.createStereoPanner() : null, an: c.createAnalyser() };
        ch.an.fftSize = 1024;
        ch.input.connect(ch.gain);
        if (ch.pan) { ch.gain.connect(ch.pan); ch.pan.connect(ch.an); } else ch.gain.connect(ch.an);
        ch.an.connect(master);
      }
      return ch;
    },
    sync: function (board) {   // apply faders, pan, mute, solo now (smoothly)
      if (!actx) return;
      var anySolo = board.tracks.some(function (t) { return t.solo; });
      board.tracks.forEach(function (t) {
        if (!AUDIO_KINDS[t.kind] && t.kind !== 'video') return;
        if (t.kind === 'video') return;
        var ch = audio.channel(t);
        ch.gain.gain.setTargetAtTime(B.channelGain(t, anySolo), actx.currentTime, 0.015);
        if (ch.pan) ch.pan.pan.setTargetAtTime(B.clamp(t.pan || 0, -1, 1), actx.currentTime, 0.015);
      });
      if (board.masterFader != null) master.gain.setTargetAtTime(B.faderToGain(board.masterFader), actx.currentTime, 0.015);
    },
    /* until: when everything stops (default: end of program + end card). picUntil: where picture sound stops
       (cutdowns trim the picture early but let music run under the end card). */
    play: function (board, from, until, picUntil) {
      audio.stop();
      var c = audio.ctx(); audio.sync(board);
      var t0 = c.currentTime + 0.06, srcs = [];
      var allStop = until == null ? B.totalDuration(board) : until;
      var picStop = picUntil == null ? allStop : Math.min(picUntil, allStop);
      var clipAudio = board.tracks.filter(function (t) { return t.kind === 'clipaudio'; })[0];
      board.tracks.forEach(function (t) {
        var route = t.kind === 'video' ? clipAudio : (AUDIO_KINDS[t.kind] ? t : null);
        if (!route) return;
        var ch = audio.channel(route), stopAt = t.kind === 'video' ? picStop : allStop;
        t.clips.forEach(function (clip) {
          var buf = lib.buffer(clip.media);
          if (!buf) { lib.ensureBuffer(clip.media); return; }
          var end = Math.min(B.clipEnd(clip), stopAt);
          if (end <= from) return;
          var startTl = Math.max(from, clip.start), offset = clip.in + (startTl - clip.start), dur = end - startTl;
          if (offset >= buf.duration || dur <= 0) return;
          var s = c.createBufferSource(), g = c.createGain();
          s.buffer = buf; s.connect(g); g.connect(ch.input);
          var when = t0 + (startTl - from);
          // fades as automation, from clip-local time
          var loc0 = startTl - clip.start;
          g.gain.setValueAtTime(B.fadeGain(clip, loc0), when);
          if (clip.fadeIn > 0 && loc0 < clip.fadeIn) g.gain.linearRampToValueAtTime(1, when + (clip.fadeIn - loc0));
          if (clip.fadeOut > 0) {
            var fo = B.clipLen(clip) - clip.fadeOut;
            if (fo > loc0) g.gain.setValueAtTime(1, when + (fo - loc0));
            g.gain.linearRampToValueAtTime(0, when + (B.clipLen(clip) - loc0));
          }
          if (end < B.clipEnd(clip) && dur > 0.6) {   // cut short by the program end: quick fade, no click
            g.gain.setValueAtTime(g.gain.value, when + dur - 0.5); g.gain.linearRampToValueAtTime(0, when + dur);
          }
          s.start(when, offset, dur); srcs.push(s);
        });
      });
      live = { from: from, at: t0, srcs: srcs };
    },
    stop: function () {
      if (!live) return;
      live.srcs.forEach(function (s) { try { s.stop(); } catch (e) { } });
      live = null;
    },
    now: function () { return live && actx ? Math.max(live.from, live.from + (actx.currentTime - live.at)) : null; },
    playing: function () { return !!live; },
    level: function (trackId) {
      var an = trackId === 'master' ? mAnalyser : channels[trackId] && channels[trackId].an;
      if (!an) return 0;
      var buf = new Float32Array(an.fftSize); an.getFloatTimeDomainData(buf);
      var s = 0; for (var i = 0; i < buf.length; i++) s += buf[i] * buf[i];
      return B.rmsToMeter(Math.sqrt(s / buf.length));
    },
    reduction: function () { return limiter ? limiter.reduction : 0; },
    sounds: function () { return root.MWDASH && root.MWDASH.audio ? root.MWDASH.audio.SOUNDS : []; },
    soundToMedia: function (s) {   // render a library sound into a media item the timeline can use
      var id = 'sfx:' + s.id;
      if (items[id] && items[id].buffer) return Promise.resolve(items[id]);
      return root.MWDASH.audio.renderSound(s).then(function (b) {
        items[id] = { id: id, name: s.name, kind: 'audio', dur: b.duration, buffer: b, sfx: true };
        return items[id];
      });
    },
    preview: function (s) { if (root.MWDASH && root.MWDASH.audio) root.MWDASH.audio.previewSound(s); }
  };

  /* ------------------------------------------------------------------ compositor */
  function videoTrack(board) { return board.tracks.filter(function (t) { return t.kind === 'video'; })[0]; }
  function drawCover(c, src, sw0, sh0, W, H, focusX, zoom) {
    var r = B.cropRect(sw0, sh0, W / H, focusX, 0.5);
    if (zoom && zoom !== 1) { var nw = r.sw / zoom, nh = r.sh / zoom; r.sx += (r.sw - nw) / 2; r.sy += (r.sh - nh) / 2; r.sw = nw; r.sh = nh; }
    c.drawImage(src, r.sx, r.sy, r.sw, r.sh, 0, 0, W, H);
  }
  function wrap(c, text, maxW) {
    var words = String(text).split(/\s+/), lines = [], cur = '';
    words.forEach(function (w) { var n = cur ? cur + ' ' + w : w; if (c.measureText(n).width > maxW && cur) { lines.push(cur); cur = w; } else cur = n; });
    if (cur) lines.push(cur);
    return lines.slice(0, 3);
  }
  function drawCaption(c, W, H, cap, safe) {
    var fs = Math.round(Math.min(W, H) * 0.055);
    c.font = '800 ' + fs + 'px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    var maxW = W * (1 - (safe ? safe.l + safe.r : 0.1)) * 0.92;
    var lines = wrap(c, cap.text, maxW), lh = fs * 1.25;
    var cx = W * (safe ? (safe.l + (1 - safe.r)) / 2 : 0.5);
    var bottom = H * (1 - (safe ? safe.b : 0.08)) - lh * 0.4;
    lines.forEach(function (ln, i) {
      var y = bottom - (lines.length - 1 - i) * lh, w = c.measureText(ln).width;
      c.fillStyle = 'rgba(0,0,0,.62)'; c.fillRect(cx - w / 2 - fs * 0.35, y - lh / 2, w + fs * 0.7, lh);
      c.fillStyle = '#fff'; c.fillText(ln, cx, y);
    });
  }
  function drawEndcard(c, W, H, ec, local) {
    var a = B.clamp(local / 0.4, 0, 1);
    var g = c.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.7);
    if (ec.style === 'clean') { g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#e9e6df'); }
    else { g.addColorStop(0, '#2a1240'); g.addColorStop(1, '#07060c'); }
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.globalAlpha = a; c.textAlign = 'center'; c.textBaseline = 'middle';
    var dark = ec.style === 'clean', m = Math.min(W, H);
    c.fillStyle = dark ? '#111' : '#fff'; c.font = '900 ' + Math.round(m * 0.09) + 'px system-ui, sans-serif';
    wrap(c, ec.title || 'Your brand', W * 0.86).forEach(function (ln, i) { c.fillText(ln, W / 2, H * 0.38 + i * m * 0.1); });
    if (ec.sub) { c.font = '500 ' + Math.round(m * 0.042) + 'px system-ui, sans-serif'; c.fillStyle = dark ? '#444' : 'rgba(255,255,255,.75)'; c.fillText(ec.sub, W / 2, H * 0.53); }
    if (ec.cta) {
      c.font = '800 ' + Math.round(m * 0.045) + 'px system-ui, sans-serif';
      var w = c.measureText(ec.cta).width + m * 0.08, h = m * 0.085, x = W / 2 - w / 2, y = H * 0.64;
      c.fillStyle = dark ? '#111' : '#f5c84b'; roundRect(c, x, y, w, h, h / 2); c.fill();
      c.fillStyle = dark ? '#fff' : '#120b00'; c.fillText(ec.cta, W / 2, y + h / 2);
    }
    if (ec.url) { c.font = '600 ' + Math.round(m * 0.035) + 'px system-ui, sans-serif'; c.fillStyle = dark ? '#333' : 'rgba(255,255,255,.8)'; c.fillText(ec.url, W / 2, H * 0.82); }
    c.globalAlpha = 1;
  }
  function roundRect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function drawSafe(c, W, H, safe) {
    c.save(); c.fillStyle = 'rgba(255,60,90,.18)';
    c.fillRect(0, 0, W, H * safe.t); c.fillRect(0, H * (1 - safe.b), W, H * safe.b);
    c.fillRect(0, H * safe.t, W * safe.l, H * (1 - safe.t - safe.b)); c.fillRect(W * (1 - safe.r), H * safe.t, W * safe.r, H * (1 - safe.t - safe.b));
    c.strokeStyle = 'rgba(255,255,255,.5)'; c.setLineDash([8, 6]); c.strokeRect(W * safe.l, H * safe.t, W * (1 - safe.l - safe.r), H * (1 - safe.t - safe.b));
    c.restore();
  }
  /* Draw the program at time t. o: {programUntil, endcardDur, focusX, captions, safe, showSafe, aiLabel, seek} */
  function draw(c, W, H, board, t, o) {
    o = o || {};
    var prog = o.programUntil == null ? B.programEnd(board) : o.programUntil;
    c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
    if (t < prog) {
      var vt = videoTrack(board), clip = vt && B.clipAt(vt, t);
      if (clip) {
        var it = lib.get(clip.media), local = t - clip.start, fg = B.fadeGain(clip, local);
        c.globalAlpha = fg;
        if (it && it.demo) paintDemo(c, W, H, it.demo, clip.in + local);
        else if (it && it.kind === 'image' && it.el && it.w) drawCover(c, it.el, it.w, it.h, W, H, o.focusX, 1 + 0.05 * (local / Math.max(1, B.clipLen(clip))));
        else if (it && it.kind === 'video' && it.el && it.el.readyState >= 2) {
          var want = clip.in + local;
          if (o.seek || Math.abs(it.el.currentTime - want) > 0.25) { try { it.el.currentTime = want; } catch (e) { } }
          if (o.playing && it.el.paused) it.el.play().catch(function () { });
          if (!o.playing && !it.el.paused) it.el.pause();
          drawCover(c, it.el, it.w || W, it.h || H, W, H, o.focusX, 1);
        } else { c.fillStyle = '#222'; c.fillRect(0, 0, W, H); c.fillStyle = '#aaa'; c.textAlign = 'center'; c.font = '600 ' + Math.round(H * 0.04) + 'px system-ui'; c.fillText(!it ? 'Media offline: import it again in Media' : it.error ? 'This clip could not load' : 'Loading…', W / 2, H / 2); }
        c.globalAlpha = 1;
      }
      pauseOthers(board, clip);
      var cap = o.captions === false ? null : B.captionAt(board.captions, t);
      if (cap) drawCaption(c, W, H, cap, o.safe);
    } else if (board.endcard && board.endcard.on) {
      pauseOthers(board, null);
      drawEndcard(c, W, H, board.endcard, t - prog);
    }
    if (o.aiLabel) {
      var fs = Math.round(Math.min(W, H) * 0.026);
      c.font = '700 ' + fs + 'px system-ui, sans-serif'; c.textAlign = 'left'; c.textBaseline = 'top';
      var x = W * (o.safe ? o.safe.l : 0.03) + fs * 0.4, y = H * (o.safe ? o.safe.t : 0.03) + fs * 0.4;
      c.fillStyle = 'rgba(0,0,0,.5)'; c.fillRect(x - fs * 0.3, y - fs * 0.2, c.measureText('AI-generated').width + fs * 0.6, fs * 1.4);
      c.fillStyle = 'rgba(255,255,255,.92)'; c.fillText('AI-generated', x, y);
    }
    if (o.showSafe && o.safe) drawSafe(c, W, H, o.safe);
  }
  function pauseOthers(board, active) {
    var vt = videoTrack(board); if (!vt) return;
    vt.clips.forEach(function (cl) {
      if (cl === active) return;
      var it = lib.get(cl.media);
      if (it && it.el && it.el.pause && !it.el.paused) it.el.pause();
    });
  }
  function hasAiClips(board) {
    var vt = videoTrack(board);
    return !!(vt && vt.clips.some(function (c) { return /^job:/.test(c.media); }));
  }

  /* ------------------------------------------------------------------ real-time exporter */
  function pickMime() {
    var M = root.MediaRecorder; if (!M) return '';
    // MP4 first: every social platform takes it (Instagram does not take WebM). WebM is the fallback.
    var list = ['video/mp4;codecs=avc1.42E01F,mp4a.40.2', 'video/mp4;codecs=avc1,mp4a', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
    for (var i = 0; i < list.length; i++) if (M.isTypeSupported && M.isTypeSupported(list[i])) return list[i];
    return '';
  }
  /* Exports in real time (a 30 s cut takes about 30 s). o: {w,h,programUntil,endcardDur,focusX,safe,aiLabel,onProgress,signal} */
  function exportCut(board, o) {
    var mime = pickMime();
    if (!mime) return Promise.reject(new Error('This browser cannot record video. Use a current Chrome, Edge or Firefox.'));
    var scale = Math.min(1, 1920 / Math.max(o.w, o.h));
    var W = Math.round(o.w * scale / 2) * 2, H = Math.round(o.h * scale / 2) * 2;
    var cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    var c = cv.getContext('2d');
    var dur = o.programUntil + (o.endcardDur || 0);
    var ecBoard = JSON.parse(JSON.stringify(B.serializeBoard(board)));
    if (ecBoard.endcard) ecBoard.endcard.on = (o.endcardDur || 0) > 0;
    return Promise.all(board.tracks.reduce(function (a, t) { return a.concat(t.clips.map(function (cl) { return lib.ensureBuffer(cl.media); })); }, [])).then(function () {
      return new Promise(function (resolve, reject) {
        var stream = cv.captureStream(30);
        audio.stream().getAudioTracks().forEach(function (tr) { stream.addTrack(tr); });
        var rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8e6 }), chunks = [];
        rec.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
        rec.onstop = function () { audio.stop(); if (o.signal && o.signal.aborted) return reject(new Error('cancelled')); resolve(new Blob(chunks, { type: mime.split(';')[0] })); };
        audio.play(board, 0, dur, o.programUntil);
        var t0 = performance.now();
        rec.start(250);
        (function frame() {
          var t = (performance.now() - t0) / 1000;
          if (t >= dur || (o.signal && o.signal.aborted)) { rec.stop(); return; }
          draw(c, W, H, ecBoard, t, { programUntil: o.programUntil, focusX: o.focusX, safe: o.safe, aiLabel: o.aiLabel, playing: true });
          if (o.onProgress) o.onProgress(t / dur);
          // A timer, not animation frames: frames pause when the page isn't painting, timers keep the export moving.
          setTimeout(frame, 1000 / 30);
        })();
      });
    });
  }
  function download(blob, name) {
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 60000);
  }

  root.MWMedia = { lib: lib, audio: audio, draw: draw, exportCut: exportCut, download: download, hasAiClips: hasAiClips, DEMOS: DEMOS, pickMime: pickMime };
})(window);
