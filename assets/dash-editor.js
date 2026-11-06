/* Madwackd Studio Creator Dashboard: simple video editor (canvas preview + MediaRecorder export). Runs in the browser only. */
(function (root) {
  'use strict';
  var D = root.MWDASH, doc = root.document;
  var $ = function (id) { return doc.getElementById(id); };
  var H; // hooks from dashboard.js
  var E = { clips: [], overlays: [], aspect: '16:9', sel: -1, brand: { logo: null, color: '#FF2E93' }, origSound: true };
  var vid = doc.createElement('video');
  vid.playsInline = true; vid.preload = 'auto'; vid.setAttribute('playsinline', '');
  var curUrl = null, uid = 1, exporting = null, lastDrawnT = 0;
  var cv, c2d;

  function nid(p) { return p + (uid++); }
  function total() { return D.totalDuration(E.clips); }
  function tier() { return H.tier(); }

  /* ---- loading clips ---- */
  function addFiles(files) {
    var list = Array.prototype.slice.call(files).filter(function (f) { return /^video\//.test(f.type) || /\.(mp4|webm|mov|m4v)$/i.test(f.name); });
    if (!list.length) { H.notify('Pick video files (mp4 or webm).'); return; }
    list.forEach(function (f) {
      var url = URL.createObjectURL(f), probe = doc.createElement('video');
      probe.preload = 'metadata'; probe.muted = true;
      probe.onloadedmetadata = function () {
        var d = isFinite(probe.duration) ? probe.duration : 0;
        if (!d) { H.notify('Could not read ' + f.name + '.'); return; }
        E.clips.push({ id: nid('c'), name: f.name, url: url, file: f, srcDur: d, in: 0, out: d, abuf: undefined });
        E.sel = E.clips.length - 1;
        renderAll(); H.notify('Added ' + f.name + ' (' + D.fmtTime(d) + ').');
        var lim = D.limitSeconds(tier());
        if (total() > lim) { H.upgrade('length'); H.notify('Heads up: your plan exports up to ' + lim + ' seconds, so the end will be cut off.'); }
        seek(H.getT());
      };
      probe.onerror = function () { H.notify('Your browser cannot play ' + f.name + '. Try mp4 (H.264) or webm.'); };
      probe.src = url;
    });
  }

  /* ---- playback sync + drawing ---- */
  function syncVideo(T, playing) {
    var at = D.clipAt(E.clips, T); if (!at) return;
    var clip = E.clips[at.index];
    if (curUrl !== clip.url) { curUrl = clip.url; vid.src = clip.url; vid.load(); }
    var target = clip.in + at.local;
    if (!playing) { vid.pause(); if (Math.abs(vid.currentTime - target) > 0.03) { try { vid.currentTime = target; } catch (e) {} } }
    else {
      if (Math.abs(vid.currentTime - target) > 0.35) { try { vid.currentTime = target; } catch (e) {} }
      if (vid.paused) { var p = vid.play(); if (p && p.catch) p.catch(function () {}); }
    }
    vid.muted = !E.origSound || !!exporting;
  }
  function wrap(g, text, maxW) {
    var words = String(text).split(/\s+/), lines = [], line = '';
    words.forEach(function (w) { var t = line ? line + ' ' + w : w; if (g.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; });
    if (line) lines.push(line); return lines;
  }
  function draw(g, w, h, T, st) {
    g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
    if (vid.videoWidth && E.clips.length) {
      var sc = Math.max(w / vid.videoWidth, h / vid.videoHeight), dw = vid.videoWidth * sc, dh = vid.videoHeight * sc;
      try { g.drawImage(vid, (w - dw) / 2, (h - dh) / 2, dw, dh); } catch (e) {}
    } else {
      g.fillStyle = '#B9B2C8'; g.font = '600 ' + Math.round(h * 0.04) + 'px Inter, system-ui, sans-serif'; g.textAlign = 'center';
      g.fillText('Drop a video clip to start', w / 2, h / 2);
    }
    var accent = st.brandKit ? E.brand.color : '#FFFFFF';
    E.overlays.forEach(function (o) {
      if (T < o.start || T > o.end) return;
      var caption = o.kind === 'caption', fs = Math.round(h * (caption ? 0.04 : 0.07));
      g.font = (caption ? '600 ' : '800 ') + fs + 'px Inter, system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      var lines = wrap(g, o.text, w * 0.88), lh = fs * 1.25, blockH = lines.length * lh;
      var cy = o.pos === 'top' ? h * 0.14 : o.pos === 'middle' ? h * 0.5 : h * 0.84;
      cy = Math.max(blockH / 2 + 6, Math.min(h - blockH / 2 - 6, cy));
      if (caption) {
        var mw = 0; lines.forEach(function (l) { mw = Math.max(mw, g.measureText(l).width); });
        g.fillStyle = 'rgba(0,0,0,.65)'; g.fillRect(w / 2 - mw / 2 - fs * 0.5, cy - blockH / 2 - fs * 0.3, mw + fs, blockH + fs * 0.6);
      }
      lines.forEach(function (l, i) {
        var y = cy - blockH / 2 + lh * (i + 0.5);
        if (!caption) { g.lineWidth = fs * 0.14; g.strokeStyle = 'rgba(0,0,0,.8)'; g.lineJoin = 'round'; g.strokeText(l, w / 2, y); }
        g.fillStyle = caption ? '#FFFFFF' : accent; g.fillText(l, w / 2, y);
      });
    });
    if (st.brandKit) {
      g.fillStyle = E.brand.color; g.fillRect(0, h - Math.max(3, h * 0.008), w, Math.max(3, h * 0.008));
      if (E.brand.logo) { var lh2 = h * 0.09, lw = lh2 * (E.brand.logo.naturalWidth / E.brand.logo.naturalHeight || 1); g.drawImage(E.brand.logo, w - lw - h * 0.03, h * 0.03, lw, lh2); }
    }
    if (st.watermark) {
      g.font = '700 ' + Math.round(h * 0.026) + 'px Inter, system-ui, sans-serif'; g.textAlign = 'right'; g.textBaseline = 'bottom';
      g.fillStyle = 'rgba(255,255,255,.75)'; g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 4;
      g.fillText('Madwackd Studio', w - h * 0.025, h - h * 0.025); g.shadowBlur = 0;
    }
  }
  function previewSize() { var r = D.exportSettings('free', E.aspect), k = 720 / Math.max(r.width, r.height); return [Math.round(r.width * k), Math.round(r.height * k)]; }
  function render(T) {
    lastDrawnT = T == null ? lastDrawnT : T;
    var s = previewSize();
    if (cv.width !== s[0] || cv.height !== s[1]) { cv.width = s[0]; cv.height = s[1]; }
    var ex = D.exportSettings(tier(), E.aspect);
    draw(c2d, s[0], s[1], lastDrawnT, { watermark: ex.watermark, brandKit: ex.brandKit });
  }
  function seek(T) { syncVideo(T, false); render(T); }
  function tick(T) { syncVideo(T, true); render(T); }
  vid.addEventListener('seeked', function () { if (!exporting) render(); });
  vid.addEventListener('loadeddata', function () { if (!exporting) render(); });

  /* ---- timeline UI ---- */
  function renderTimeline() {
    var tl = $('timeline'); tl.textContent = '';
    if (!E.clips.length) { var p = doc.createElement('p'); p.className = 'muted'; p.textContent = 'No clips yet. Drop videos above.'; tl.appendChild(p); return; }
    E.clips.forEach(function (c, i) {
      var b = doc.createElement('button'); b.type = 'button'; b.className = 'tl-clip' + (i === E.sel ? ' is-sel' : '');
      b.draggable = true; b.style.flexGrow = String(Math.max(0.5, D.clipDur(c)));
      b.setAttribute('aria-label', 'Clip ' + (i + 1) + ': ' + c.name + ', ' + D.fmtTime(D.clipDur(c)) + (i === E.sel ? ', selected' : ''));
      var n = doc.createElement('span'); n.className = 'tl-name'; n.textContent = (i + 1) + '. ' + c.name;
      var d = doc.createElement('span'); d.className = 'tl-dur'; d.textContent = D.fmtTime(D.clipDur(c));
      b.appendChild(n); b.appendChild(d);
      b.addEventListener('click', function () { E.sel = i; renderAll(); });
      b.addEventListener('dragstart', function (e) { e.dataTransfer.setData('text/plain', String(i)); e.dataTransfer.effectAllowed = 'move'; });
      b.addEventListener('dragover', function (e) { e.preventDefault(); b.classList.add('is-over'); });
      b.addEventListener('dragleave', function () { b.classList.remove('is-over'); });
      b.addEventListener('drop', function (e) {
        e.preventDefault(); b.classList.remove('is-over');
        var from = parseInt(e.dataTransfer.getData('text/plain'), 10); if (isNaN(from)) return;
        E.clips = D.moveClip(E.clips, from, i); E.sel = i; renderAll();
      });
      tl.appendChild(b);
    });
  }
  function renderControls() {
    var c = E.clips[E.sel], has = !!c;
    ['clip-in', 'clip-out', 'clip-left', 'clip-right', 'clip-split', 'clip-del'].forEach(function (id) { $(id).disabled = !has; });
    if (has) {
      $('clip-in').value = c.in.toFixed(1); $('clip-out').value = c.out.toFixed(1);
      $('clip-in').max = $('clip-out').max = c.srcDur.toFixed(1);
      $('clip-info').textContent = 'Clip ' + (E.sel + 1) + ' of ' + E.clips.length + ' - source ' + D.fmtTime(c.srcDur);
      $('clip-left').disabled = E.sel === 0; $('clip-right').disabled = E.sel === E.clips.length - 1;
    } else $('clip-info').textContent = 'Select a clip to trim, split or move it.';
    var tot = total(), lim = D.limitSeconds(tier());
    $('ed-total').textContent = 'Total ' + D.fmtTime(tot) + (isFinite(lim) ? ' of ' + lim + ' s on your plan' : ' (no length limit)');
    $('ed-total').classList.toggle('over', tot > lim);
    H.onTotalChange();
  }
  function renderOverlays() {
    var ul = $('ov-list'); ul.textContent = '';
    E.overlays.forEach(function (o, i) {
      var li = doc.createElement('li'); var sp = doc.createElement('span');
      sp.textContent = (o.kind === 'caption' ? 'Caption' : 'Title') + ' (' + o.pos + ', ' + o.start.toFixed(1) + '-' + o.end.toFixed(1) + ' s): ' + o.text;
      var rm = doc.createElement('button'); rm.type = 'button'; rm.className = 'btn-mini'; rm.textContent = 'Remove'; rm.setAttribute('aria-label', 'Remove text: ' + o.text);
      rm.addEventListener('click', function () { E.overlays.splice(i, 1); renderOverlays(); render(); });
      li.appendChild(sp); li.appendChild(rm); ul.appendChild(li);
    });
  }
  function renderAll() { renderTimeline(); renderControls(); renderOverlays(); render(); }

  /* ---- editing actions ---- */
  function applyTrim() {
    var c = E.clips[E.sel]; if (!c) return;
    E.clips[E.sel] = D.trimClip(c, parseFloat($('clip-in').value) || 0, parseFloat($('clip-out').value) || c.srcDur, c.srcDur);
    renderAll(); seek(H.getT());
  }
  function move(delta) {
    var to = E.sel + delta; if (to < 0 || to >= E.clips.length) return;
    E.clips = D.moveClip(E.clips, E.sel, to); E.sel = to; renderAll();
  }
  function split() {
    var T = H.getT(), at = D.clipAt(E.clips, T);
    if (!at) return;
    var before = E.clips.length;
    E.clips = D.splitClip(E.clips, at.index, T, nid('c'));
    if (E.clips.length === before) { H.notify('Move the playhead into the middle of a clip, then split.'); return; }
    E.sel = at.index; renderAll(); H.notify('Split at ' + D.fmtTime(T) + '.');
  }
  function del() {
    if (E.sel < 0) return; E.clips.splice(E.sel, 1); E.sel = Math.min(E.sel, E.clips.length - 1); renderAll(); seek(H.getT());
  }
  function addOverlay() {
    var text = $('ov-text').value.trim(), kind = $('ov-kind').value;
    if (!text) { H.notify('Type some text first.'); $('ov-text').focus(); return; }
    if (kind === 'caption' && !D.can(tier(), 'captions')) { H.upgrade('captions'); return; }
    var s = parseFloat($('ov-start').value) || 0, e = parseFloat($('ov-end').value);
    if (!(e > s)) e = s + 3;
    E.overlays.push({ kind: kind, text: text, pos: $('ov-pos').value, start: s, end: e });
    $('ov-text').value = ''; renderOverlays(); render(); H.notify('Text added.');
  }
  function setAspect(a) { E.aspect = a; render(); }

  /* ---- brand kit ---- */
  function setLogo(file) {
    if (!D.can(tier(), 'brandKit')) { H.upgrade('brandKit'); return; }
    var img = new Image(); img.onload = function () { E.brand.logo = img; render(); H.notify('Logo added.'); };
    img.onerror = function () { H.notify('Could not read that image.'); }; img.src = URL.createObjectURL(file);
  }

  /* ---- export ---- */
  function sliceBuffer(ac, b, a, z) {
    var sr = b.sampleRate, s = Math.floor(a * sr), e = Math.min(b.length, Math.floor(z * sr)), n = Math.max(1, e - s);
    var out = ac.createBuffer(b.numberOfChannels, n, sr);
    for (var ch = 0; ch < b.numberOfChannels; ch++) out.copyToChannel(b.getChannelData(ch).subarray(s, s + n), ch);
    return out;
  }
  function clipAudioExtras(ac, dur) {
    var pos = 0, jobs = [];
    E.clips.forEach(function (c) {
      var start = pos, d = D.clipDur(c); pos += d;
      if (start >= dur) return;
      jobs.push((c.abuf !== undefined ? Promise.resolve(c.abuf) : c.file.arrayBuffer().then(function (ab) { return ac.decodeAudioData(ab); }).catch(function () { return null; }))
        .then(function (b) { c.abuf = b; return b ? { buffer: sliceBuffer(ac, b, c.in, c.out), start: start } : null; }));
    });
    return Promise.all(jobs).then(function (a) { return a.filter(Boolean); });
  }
  function pickMime() {
    var opts = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
    for (var i = 0; i < opts.length; i++) if (root.MediaRecorder && MediaRecorder.isTypeSupported(opts[i])) return opts[i];
    return '';
  }
  function exportVideo() {
    if (exporting) return;
    if (!E.clips.length) { H.notify('Add at least one video clip first.'); return; }
    if (!root.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) { H.notify('This browser cannot export video. Try a current Chrome, Edge or Firefox.'); return; }
    var ex = D.exportSettings(tier(), E.aspect), tot = total(), dur = Math.min(tot, ex.maxSeconds);
    if (tot > ex.maxSeconds) H.upgrade('length');
    if (ex.watermark) H.notify('Exporting with the Madwackd Studio watermark at ' + ex.height + 'p-class size. Keep this tab open.');
    else H.notify('Exporting ' + ex.width + 'x' + ex.height + '. Keep this tab open.');
    H.stopPlayback(); H.setExporting(true);
    var ac = D.audio.getCtx(), S = H.S, ecv = doc.createElement('canvas'); ecv.width = ex.width; ecv.height = ex.height;
    var eg = ecv.getContext('2d'), chunks = [], rec, graph, raf, cancelled = false;
    var prog = $('export-progress'); prog.hidden = false; prog.value = 0; $('export-cancel').hidden = false; $('export-video').disabled = true;
    var prevDl = $('download'); prevDl.hidden = true;
    exporting = { cancel: function () { cancelled = true; } };
    clipAudioExtras(ac, dur).then(function (extras) {
      if (!E.origSound) extras = [];
      var mdest = ac.createMediaStreamDestination(), stream = ecv.captureStream(30);
      var base = ac.currentTime + 0.15;
      graph = D.audio.buildAndStart(ac, mdest, S, 0, base, { extras: extras });
      mdest.stream.getAudioTracks().forEach(function (t) { stream.addTrack(t); });
      var mime = pickMime(), o = { videoBitsPerSecond: ex.height >= 1080 ? 8e6 : 4e6 }; if (mime) o.mimeType = mime;
      rec = new MediaRecorder(stream, o);
      rec.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
      rec.onstop = function () {
        graph.sources.forEach(function (s) { try { s.stop(); } catch (e) {} });
        try { graph.master.disconnect(); } catch (e) {}
        exporting = null; H.setExporting(false); prog.hidden = true; $('export-cancel').hidden = true; $('export-video').disabled = false;
        if (cancelled) { H.notify('Export cancelled.'); return; }
        var blob = new Blob(chunks, { type: 'video/webm' }), a = $('download');
        if (a.dataset.url) URL.revokeObjectURL(a.dataset.url);
        a.href = URL.createObjectURL(blob); a.dataset.url = a.href; a.download = 'madwackd-export.webm'; a.hidden = false;
        a.textContent = 'Download your video (' + (blob.size / 1048576).toFixed(1) + ' MB, webm)';
        H.notify('Export done. Use the download link.'); seek(H.getT());
      };
      rec.start(250);
      var t0 = performance.now() + 150;
      (function frame() {
        if (cancelled) { rec.stop(); return; }
        var T = Math.max(0, (performance.now() - t0) / 1000);
        if (T >= dur) { setTimeout(function () { rec.stop(); }, 250); return; }
        syncVideo(T, true);
        draw(eg, ecv.width, ecv.height, T, { watermark: ex.watermark, brandKit: ex.brandKit });
        prog.value = T / dur; raf = root.requestAnimationFrame(frame);
      })();
    }).catch(function (err) {
      exporting = null; H.setExporting(false); prog.hidden = true; $('export-cancel').hidden = true; $('export-video').disabled = false;
      H.notify('Export failed: ' + (err && err.message ? err.message : 'unknown error') + '.');
    });
  }

  function init(hooks) {
    H = hooks; cv = $('preview'); c2d = cv.getContext('2d');
    var drop = $('drop'), file = $('file-video');
    file.addEventListener('change', function () { addFiles(file.files); file.value = ''; });
    ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('is-over'); }); });
    ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('is-over'); }); });
    drop.addEventListener('drop', function (e) { if (e.dataTransfer && e.dataTransfer.files.length) addFiles(e.dataTransfer.files); });
    $('clip-in').addEventListener('change', applyTrim); $('clip-out').addEventListener('change', applyTrim);
    $('clip-left').addEventListener('click', function () { move(-1); }); $('clip-right').addEventListener('click', function () { move(1); });
    $('clip-split').addEventListener('click', split); $('clip-del').addEventListener('click', del);
    $('ov-add').addEventListener('click', addOverlay);
    Array.prototype.forEach.call(doc.querySelectorAll('input[name="aspect"]'), function (r) { r.addEventListener('change', function () { if (r.checked) setAspect(r.value); }); });
    $('orig-sound').addEventListener('change', function () { E.origSound = $('orig-sound').checked; });
    $('brand-logo').addEventListener('change', function () { if ($('brand-logo').files[0]) setLogo($('brand-logo').files[0]); });
    $('brand-color').addEventListener('input', function () { if (!D.can(tier(), 'brandKit')) { $('brand-color').value = E.brand.color; H.upgrade('brandKit'); return; } E.brand.color = $('brand-color').value; render(); });
    $('export-video').addEventListener('click', exportVideo);
    $('export-cancel').addEventListener('click', function () { if (exporting) exporting.cancel(); });
    renderAll();
  }
  D.editor = { init: init, state: E, total: total, seek: seek, tick: tick, render: render, renderAll: renderAll, addFiles: addFiles, setAspect: setAspect, pausePreview: function () { vid.pause(); } };
})(window);
