/* Pro Creator Studio: animated example dashboards on /pro-studio/.
   Every widget carries a lamp: green = works in the studio today, amber = in development.
   All numbers are made up and labeled that way. */
(function () {
  'use strict';
  var root = document.getElementById('pcx');
  if (!root) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var uidN = 0;
  function gauge(pct, label, value, color) {
    var id = 'pcxg' + (++uidN), ticks = '';
    for (var i = 0; i <= 10; i++) {
      var a = Math.PI - Math.PI * i / 10, c = Math.cos(a), s = Math.sin(a), r1 = i % 5 ? 46 : 40;
      ticks += '<line x1="' + (60 + c * r1).toFixed(1) + '" y1="' + (62 - s * r1).toFixed(1) + '" x2="' + (60 + c * 52).toFixed(1) + '" y2="' + (62 - s * 52).toFixed(1) + '" stroke="#e9e2d0" stroke-width="' + (i % 5 ? 1 : 2) + '"/>';
    }
    return '<div class="pcx-g"><svg viewBox="0 0 120 74" aria-hidden="true"><defs><linearGradient id="' + id + '" x1="0" x2="1"><stop offset="0" stop-color="#FF4D4D"/><stop offset=".55" stop-color="#FFC23D"/><stop offset="1" stop-color="' + (color || '#39FF88') + '"/></linearGradient></defs>' +
      '<path d="M4 64 A56 56 0 0 1 116 64 Z" fill="#0d0a12" stroke="#000" stroke-width="2"/><path d="M14 62 A46 46 0 0 1 106 62" fill="none" stroke="url(#' + id + ')" stroke-width="6" stroke-linecap="round"/>' + ticks +
      '<g class="pcx-needle" data-p="' + pct + '" style="transform:rotate(-90deg)"><line x1="60" y1="62" x2="60" y2="18" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></g><circle cx="60" cy="62" r="5" fill="#FF2E93" stroke="#000" stroke-width="1.5"/></svg>' +
      '<b class="pcx-num" data-to="' + esc(value) + '">' + esc(value) + '</b><span>' + esc(label) + '</span></div>';
  }
  function bars(n, label) { var h = ''; for (var i = 0; i < n; i++) h += '<i></i>'; return '<div class="pcx-bars" data-live>' + h + '</div><span class="pcx-cap">' + esc(label) + '</span>'; }
  function meter(pct, label, val) { return '<div class="pcx-m"><div class="pcx-m-top"><span>' + esc(label) + '</span><b>' + esc(val) + '</b></div><div class="pcx-m-bar"><i data-w="' + pct + '"></i></div></div>'; }
  function line(points, label) {
    var d = points.map(function (y, i) { return (i ? 'L' : 'M') + (i * (200 / (points.length - 1))).toFixed(1) + ' ' + (60 - y * .55).toFixed(1); }).join(' ');
    return '<svg class="pcx-line" viewBox="0 0 200 64" aria-hidden="true"><path d="' + d + '" fill="none" stroke="#5fdcff" stroke-width="2.5" stroke-linejoin="round"/></svg><span class="pcx-cap">' + esc(label) + '</span>';
  }
  function lights(list) { return '<ul class="pcx-lights">' + list.map(function (x) { return '<li class="' + (x[1] ? 'on' : '') + '"><i></i>' + esc(x[0]) + '</li>'; }).join('') + '</ul>'; }
  function clock(sec, label) { return '<div class="pcx-clock" data-sec="' + sec + '">' + Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0') + '</div><span class="pcx-cap">' + esc(label) + '</span>'; }
  function agents() {
    return '<div class="pcx-agents"><div><b>Showrunner</b><span>Plans the episode, keeps the show bible</span></div><div><b>Promo producer</b><span>Writes the posts, picks the clips</span></div></div>';
  }
  function w(title, live, body, note) {
    return '<div class="pcx-w"><p class="pcx-wt"><i class="pcx-lamp ' + (live ? 'go' : 'soon') + '" title="' + (live ? 'Works today' : 'Planned') + '"></i>' + esc(title) + '</p>' + body + (note ? '<p class="pcx-wn">' + esc(note) + '</p>' : '') + '</div>';
  }

  var EX = [
    { k: 'Filmmaker', n: 'Neon Alley Pictures', t: 'Short film launch week', c: '#FF2E93', ws: [
      w('Monthly goal', true, gauge(.68, 'of $2,500 goal', '$1,700'), 'Earnings desk'),
      w('Render budget', true, gauge(.42, 'of project cap used', '42%', '#5fdcff'), 'Studio budget cap'),
      w('Pitch clock', true, clock(47, 'Rehearsal, card 3 of 6'), 'Pitch room'),
      w('Publish kit', true, lights([['YouTube', 1], ['TikTok', 1], ['Instagram', 1], ['X', 1], ['LinkedIn', 0]]), 'Copy and open each upload page') ] },
    { k: 'Musician', n: 'Juniper Vale', t: 'Single release', c: '#7ED321', ws: [
      w('Voice + music mix', true, bars(16, 'Live levels'), 'Creator Dashboard mixer'),
      w('Tips this month', true, meter(.74, 'Cash App', '$310') + meter(.52, 'Venmo', '$215') + meter(.28, 'Ko-fi', '$120'), 'Logged in Earnings desk'),
      w('Mailing list', true, '<div class="pcx-big" data-count="1240">1,240</div><span class="pcx-cap">fans on the list</span>', 'Mailing list'),
      w('Streams goal', false, gauge(.55, 'of 50k streams', '27.5k', '#b98cff'), 'Live platform stats: planned') ] },
    { k: 'Show host', n: 'Late Shift Live', t: 'Weekly show, episode 12', c: '#00B8F0', ws: [
      w('Your 2 AI producers', false, agents(), 'Planned'),
      w('Audience retention', false, line([92, 84, 80, 74, 71, 69, 66, 64, 63, 60, 58], 'Episode 11, by minute'), 'Live platform stats: planned'),
      w('One-button launch', false, '<div class="pcx-launch"><span>LAUNCH</span></div><span class="pcx-cap">Post to every feed at once</span>', 'Planned; today the publish kit does it in a few clicks'),
      w('Show earnings', true, gauge(.81, 'of $4,000 goal', '$3,240', '#5fdcff'), 'Earnings desk') ] },
    { k: 'Brand or agency', n: 'Kilo Kart', t: '3 client brands, Q4 push', c: '#FF8A00', ws: [
      w('Credits tank', true, gauge(.63, 'credits left this month', '1,814'), 'Studio plan credits'),
      w('Brand kits', true, lights([['Kilo Kart', 1], ['Basil & Brine', 1], ['Nova Rae', 1]]), 'Multiple brand kits on Studio'),
      w('Campaign pitch', true, clock(165, '3-minute client pitch'), 'Pitch room'),
      w('Press push', true, meter(1, 'Release written', 'Done') + meter(.5, 'Published', 'Today') + meter(0, 'Distributed', 'Next'), 'Press release starter + launch pad') ] }
  ];

  root.innerHTML = EX.map(function (e, i) {
    return '<article class="pcx-card" style="--c:' + e.c + '" aria-labelledby="pcx-h' + i + '">' +
      '<header class="pcx-head"><span class="pcx-onair">On air</span><div><h3 id="pcx-h' + i + '">' + esc(e.n) + '</h3><p>' + esc(e.k) + ' &middot; ' + esc(e.t) + '</p></div><span class="pcx-ex">Example</span></header>' +
      '<div class="pcx-grid">' + e.ws.join('') + '</div></article>';
  }).join('');

  /* animation */
  function start(card) {
    if (card._on) return; card._on = true;
    card.querySelectorAll('.pcx-needle').forEach(function (n) {
      var p = Number(n.getAttribute('data-p')) || 0;
      if (reduce) { n.style.transform = 'rotate(' + (-90 + 180 * p) + 'deg)'; return; }
      n.style.transition = 'transform 1.4s cubic-bezier(.2,.9,.25,1.25)';
      requestAnimationFrame(function () { n.style.transform = 'rotate(' + (-90 + 180 * p) + 'deg)'; });
      // small live wobble, like a real needle
      setInterval(function () { if (!document.hidden) n.style.transform = 'rotate(' + (-90 + 180 * p + (Math.random() * 3 - 1.5)) + 'deg)'; }, 1600);
    });
    card.querySelectorAll('.pcx-m-bar i').forEach(function (b) { b.style.width = (Number(b.getAttribute('data-w')) * 100) + '%'; });
    card.querySelectorAll('.pcx-line path').forEach(function (p) {
      if (reduce) return; var L = p.getTotalLength(); p.style.strokeDasharray = L; p.style.strokeDashoffset = L;
      requestAnimationFrame(function () { p.style.transition = 'stroke-dashoffset 2s ease-out'; p.style.strokeDashoffset = 0; });
    });
    card.querySelectorAll('[data-count]').forEach(function (el) {
      var to = Number(el.getAttribute('data-count')), t0 = performance.now();
      if (reduce) return;
      (function step(t) { var k = Math.min(1, (t - t0) / 1400); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))).toLocaleString('en-US'); if (k < 1) requestAnimationFrame(step); })(t0);
    });
    card.querySelectorAll('.pcx-clock').forEach(function (el) {
      var s = Number(el.getAttribute('data-sec')), base = s;
      if (reduce) return;
      setInterval(function () { if (document.hidden) return; s = s > 0 ? s - 1 : base; el.textContent = Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }, 1000);
    });
    var bs = card.querySelectorAll('.pcx-bars i');
    if (bs.length && !reduce) {
      var lv = Array.prototype.map.call(bs, function () { return Math.random(); });
      setInterval(function () {
        if (document.hidden) return;
        for (var i = 0; i < bs.length; i++) { lv[i] = Math.max(.08, Math.min(1, lv[i] + (Math.random() - .5) * .45)); bs[i].style.transform = 'scaleY(' + lv[i].toFixed(2) + ')'; }
      }, 140);
    } else { Array.prototype.forEach.call(bs, function (b, i) { b.style.transform = 'scaleY(' + (.3 + (i % 5) / 8) + ')'; }); }
  }
  var cards = root.querySelectorAll('.pcx-card');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { start(e.target); io.unobserve(e.target); } }); }, { threshold: .25 });
    cards.forEach(function (c) { io.observe(c); });
  } else { cards.forEach(start); }
})();
