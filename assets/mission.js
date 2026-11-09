/* Mission Control credit bonuses. The bonus for each pack is FIXED and shown before purchase.
   The reel animation only reveals the known number; nothing here is random.
   Stays hidden until the server grants these bonuses: set window.MW_CONFIG.missionBonus = true then
   (or open /pricing/?mission=preview to look at it; preview mode says so and sells nothing). */
(function () {
  'use strict';
  var BONUS = [
    { id: 'pack_100', name: 'Pad Boost', credits: 100, price: 14, bonus: 0, stage: 'Stage 1' },
    { id: 'pack_500', name: 'Orbit Pack', credits: 500, price: 63, bonus: 15, stage: 'Stage 2' },
    { id: 'pack_1000', name: 'Lunar Pack', credits: 1000, price: 115, bonus: 50, stage: 'Stage 3' },
    { id: 'pack_5000', name: 'Moon Base', credits: 5000, price: 515, bonus: 500, stage: 'Stage 4' }
  ];
  var sec = document.getElementById('mission'); if (!sec) return;
  var cfg = window.MW_CONFIG || {};
  var preview = /[?&]mission=preview\b/.test(location.search);
  if (cfg.missionBonus !== true && !preview) return;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function fmt(n) { return Number(n).toLocaleString('en-US'); }
  var h = '';
  BONUS.forEach(function (b, i) {
    var per = (b.price / (b.credits + b.bonus));
    h += '<li class="ms-card"><span class="ms-stage">' + b.stage + '</span><h3>' + b.name + '</h3><p class="ms-price">$' + fmt(b.price) + '</p>' +
      '<p><b>' + fmt(b.credits) + '</b> credits' + (b.bonus ? ' <span class="ms-plus">+ ' + fmt(b.bonus) + ' bonus</span>' : '') + '</p>' +
      '<p class="ms-fine">' + fmt(b.credits + b.bonus) + ' total · about $' + per.toFixed(3) + ' per credit</p>' +
      (b.bonus ? '<div class="ms-reel" data-b="' + b.bonus + '" aria-hidden="true"><span class="ms-digits">+' + fmt(b.bonus) + '</span></div><button class="btn btn-outline btn-sm ms-go" type="button" data-i="' + i + '">Fire the bonus reel</button>' : '<p class="ms-fine">No bonus on this pack.</p>') +
      (preview ? '' : '<a class="btn btn-sm" href="/studio/?buy=' + b.id + '">Buy</a>') + '</li>';
  });
  sec.querySelector('.ms-list').innerHTML = h;
  if (preview) sec.querySelector('.ms-prev').hidden = false;
  sec.hidden = false;
  /* The reel spins through digits for a moment, then always lands on the fixed bonus shown on the card. */
  sec.addEventListener('click', function (e) {
    var btn = e.target.closest('.ms-go'); if (!btn) return;
    var reel = btn.parentNode.querySelector('.ms-reel'), d = reel.firstChild, to = Number(reel.getAttribute('data-b'));
    if (reduce) { d.textContent = '+' + fmt(to); return; }
    btn.disabled = true; reel.classList.add('spin');
    var t0 = performance.now(), len = String(to).length;
    (function tick(t) {
      var k = (t - t0) / 1300;
      if (k < 1) { var s = ''; for (var j = 0; j < len; j++) s += Math.floor(Math.random() * 10); d.textContent = '+' + s; requestAnimationFrame(tick); }
      else { d.textContent = '+' + fmt(to); reel.classList.remove('spin'); btn.disabled = false; }
    })(t0);
  });
})();
