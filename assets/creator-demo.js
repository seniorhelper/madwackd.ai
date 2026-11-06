/* Custom creator dashboard DEMO (/creator-dashboard-demo/). Fictional creator, SAMPLE DATA only.
   Nothing here calls an API or costs anything; the logo picked by a visitor stays on their device. */
(function (root, doc) {
  'use strict';
  var $ = function (id) { return doc.getElementById(id); };

  /* ---------------- sample data (fictional; adds up so the page is internally consistent) ---------------- */
  var WEEKS = [2900, 3150, 3400, 3100, 3800, 4050, 3700, 4300, 4500, 4180, 4740, 5000];   // last 4 = 18,420
  var SOURCES = [['Brand deals', 9200], ['Platform payouts', 4310], ['Merch', 2870], ['Memberships', 2040]];   // = 18,420
  var COSTS = [['Video editor (part time)', 2400], ['Paid promotion', 700], ['Gear and software', 611], ['Madwackd Studio plan', 249]];   // = 3,960
  var REELS = [
    { t: 'Neon night drive (song teaser)', p: 'TikTok', img: 'still-neon-960.webp', v: 612000, w: 78, e: 1340 },
    { t: 'Burger run: honest review', p: 'Instagram Reels', img: 'still-burger-960.webp', v: 388000, w: 69, e: 2100 },
    { t: 'Alien cameo skit', p: 'YouTube Shorts', img: 'still-alien-960.webp', v: 541000, w: 74, e: 860 },
    { t: 'Studio day: painting the set', p: 'YouTube', img: 'still-painter-960.webp', v: 96000, w: 52, e: 1210 },
    { t: 'Behind the scenes, part 2', p: 'Instagram Reels', img: 'still-alien-a-960.webp', v: 274000, w: 66, e: 0 },
    { t: 'Q&A with the crew', p: 'allofus.one', img: 'still-alien-c-960.webp', v: 41000, w: 81, e: 0 }
  ];
  var DEALS = [['Water bottle brand', '3 reels + 1 story', 4500, 'Signed'], ['Headphone brand', '1 YouTube video', 3600, 'Negotiating'], ['Local coffee shop', '2 reels', 900, 'Proposal sent']];
  var NEXT = [['Thu 7:00 pm', 'TikTok', 'Neon night drive: full song'], ['Fri 12:00 pm', 'Instagram Reels', 'Water bottle brand reel 2'], ['Sun 10:00 am', 'YouTube', 'Making the music video']];
  var revenue = SOURCES.reduce(function (a, s) { return a + s[1]; }, 0);
  var costs = COSTS.reduce(function (a, s) { return a + s[1]; }, 0);
  var KPIS = [
    ['Revenue this month', usd(revenue), pct(sum(WEEKS.slice(-4)), sum(WEEKS.slice(-8, -4))) + ' vs the 4 weeks before'],
    ['Profit this month', usd(revenue - costs), 'after ' + usd(costs) + ' in costs'],
    ['Views this month', '2.4M', 'across 5 platforms'],
    ['New followers', '+18,900', '+9% vs last month'],
    ['Avg. watch-through', '71%', 'share of each video watched'],
    ['Brand deal pipeline', usd(DEALS.reduce(function (a, d) { return a + d[2]; }, 0)), DEALS.length + ' in the pipeline']
  ];

  var BRANDS = {
    nova: { name: 'Nova Rae', handle: '@novarae · music + lifestyle', mono: 'NR', color: '#A77BFF' },
    basil: { name: 'Basil & Brine', handle: '@basilandbrine · home cooking', mono: 'BB', color: '#3FBF7F' },
    kilo: { name: 'Kilo Kart', handle: '@kilokart · fitness on a budget', mono: 'KK', color: '#FF9A3D' }
  };
  var SURFACE = [23, 19, 31];   // --cd-panel #17131F

  function sum(a) { return a.reduce(function (x, y) { return x + y; }, 0); }
  function pct(a, b) { var d = Math.round((a - b) / b * 100); return (d >= 0 ? '+' : '') + d + '%'; }
  function usd(n) { return '$' + Math.round(n).toLocaleString('en-US'); }
  function compact(n) { return n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? Math.round(n / 1e3) + 'K' : String(n); }
  function el(tag, cls, text) { var e = doc.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function badge() { var b = el('span', 'cd-sample', 'Sample'); b.title = 'Sample data'; return b; }

  /* ---------------- brand color: keep marks and text readable on the dark panel ---------------- */
  function rgb(hex) { var m = /^#?([0-9a-f]{6})$/i.exec(hex || ''); if (!m) return null; var n = parseInt(m[1], 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function hex(c) { return '#' + c.map(function (v) { return ('0' + Math.round(v).toString(16)).slice(-2); }).join(''); }
  function lum(c) { var a = c.map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2]; }
  function contrast(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  function readable(hexIn) {   // lighten toward white until >= 4.5:1 on the panel (works for text and marks)
    var c = rgb(hexIn) || rgb('#A77BFF');
    for (var i = 0; i < 20 && contrast(c, SURFACE) < 4.5; i++) c = c.map(function (v) { return v + (255 - v) * 0.12; });
    return c;
  }
  function applyBrand(b) {
    var c = readable(b.color);
    var r = doc.documentElement.style;
    r.setProperty('--brand', hex(c));
    r.setProperty('--brand-soft', 'rgba(' + c.map(Math.round).join(',') + ',.16)');
    r.setProperty('--on-brand', contrast(c, [0, 0, 0]) >= contrast(c, [255, 255, 255]) ? '#0B0910' : '#FFFFFF');
    $('cd-name').textContent = b.name;
    $('cd-handle').textContent = b.handle;
    $('cd-mono').textContent = b.mono;
    var img = $('cd-logo-img');
    if (b.logo) { img.src = b.logo; img.hidden = false; $('cd-mono').hidden = true; } else { img.hidden = true; img.removeAttribute('src'); $('cd-mono').hidden = false; }
  }
  function initials(name) { var w = String(name).trim().split(/\s+/).filter(Boolean); return ((w[0] || 'Y')[0] + ((w[1] || w[0] || 'B')[w[1] ? 0 : 1] || '')).toUpperCase(); }

  function wireBrand() {
    var radios = doc.querySelectorAll('[data-brand]');
    function pick(btn) {
      [].forEach.call(radios, function (r) { var on = r === btn; r.setAttribute('aria-checked', on); r.tabIndex = on ? 0 : -1; });
      if (btn) applyBrand(BRANDS[btn.getAttribute('data-brand')]);
    }
    [].forEach.call(radios, function (r, i) {
      r.tabIndex = i ? -1 : 0;
      r.addEventListener('click', function () { pick(r); });
      r.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
        if (!d) return; e.preventDefault();
        var n = radios[(i + d + radios.length) % radios.length]; pick(n); n.focus();
      });
    });
    var logoUrl = null;
    $('cd-own-logo').addEventListener('change', function () {
      var f = this.files && this.files[0];
      if (logoUrl) { URL.revokeObjectURL(logoUrl); logoUrl = null; }
      if (f && /^image\/(png|jpeg|webp|svg\+xml)$/.test(f.type) && f.size <= 5e6) logoUrl = URL.createObjectURL(f);
      else if (f) { this.value = ''; tip('Pick a PNG, JPG, WebP or SVG under 5 MB.'); }
    });
    $('cd-own').addEventListener('submit', function (e) {
      e.preventDefault();
      var name = $('cd-own-name').value.trim().slice(0, 32) || 'Your brand';
      pick(null);
      applyBrand({ name: name, handle: 'Your channels · your colors', mono: initials(name), color: $('cd-own-color').value, logo: logoUrl });
      tip('Your look is on. It stays on this device.');
    });
  }

  /* ---------------- KPIs ---------------- */
  function renderKpis() {
    var box = $('cd-kpis');
    KPIS.forEach(function (k) {
      var c = el('div', 'cd-kpi');
      var h = el('p', 'cd-kpi-l', k[0]); h.appendChild(badge());
      c.appendChild(h); c.appendChild(el('p', 'cd-kpi-v', k[1])); c.appendChild(el('p', 'cd-kpi-n', k[2]));
      box.appendChild(c);
    });
  }

  /* ---------------- weekly revenue: single series, brand color, hover/focus tooltip, table view ---------------- */
  function renderRevenue() {
    var box = $('cd-rev'), max = Math.max.apply(null, WEEKS), top = Math.ceil(max / 1000) * 1000;
    var grid = el('div', 'cd-grid');
    [top, top / 2, 0].forEach(function (v) { var g = el('span', 'cd-gl'); g.appendChild(el('span', 'cd-gl-t', v ? '$' + v / 1000 + 'K' : '$0')); grid.appendChild(g); });
    box.appendChild(grid);
    var bars = el('div', 'cd-bar-row');
    var tbody = $('cd-rev-table').tBodies[0];
    WEEKS.forEach(function (v, i) {
      var label = i === WEEKS.length - 1 ? 'This week' : (WEEKS.length - 1 - i) + ' wk ago';
      var b = el('button', 'cd-bar'); b.type = 'button';
      b.setAttribute('aria-label', label + ': ' + usd(v) + ' (sample)');
      var fill = el('span', 'cd-bar-fill'); fill.style.height = (v / top * 100) + '%';
      b.appendChild(fill);
      var show = function () { tip(label + ': ' + usd(v) + ' · sample', b); };
      b.addEventListener('mouseenter', show); b.addEventListener('focus', show);
      b.addEventListener('mouseleave', hideTip); b.addEventListener('blur', hideTip);
      bars.appendChild(b);
      var tr = doc.createElement('tr'); tr.appendChild(el('td', '', label)); tr.appendChild(el('td', '', usd(v))); tbody.appendChild(tr);
    });
    box.appendChild(bars);
    var axis = el('div', 'cd-axis'); axis.appendChild(el('span', '', '12 wk ago')); axis.appendChild(el('span', '', 'This week'));
    box.appendChild(axis);
  }

  /* ---------------- sources (ranked magnitude, one hue) and lists ---------------- */
  function renderLists() {
    var src = $('cd-src'), max = SOURCES[0][1];
    SOURCES.forEach(function (s) {
      var li = el('li');
      var row = el('div', 'cd-hb-l'); row.appendChild(el('span', '', s[0])); row.appendChild(el('b', '', usd(s[1]) + ' · ' + Math.round(s[1] / revenue * 100) + '%'));
      var track = el('span', 'cd-hb-t'); var f = el('span', 'cd-hb-f'); f.style.width = (s[1] / max * 100) + '%'; track.appendChild(f);
      li.appendChild(row); li.appendChild(track); src.appendChild(li);
    });
    var cost = $('cd-cost');
    COSTS.forEach(function (c) { var li = el('li'); li.appendChild(el('span', '', c[0])); li.appendChild(el('b', '', usd(c[1]))); cost.appendChild(li); });
    var tot = el('li', 'cd-total'); tot.appendChild(el('span', '', 'Profit (revenue − costs)')); tot.appendChild(el('b', '', usd(revenue - costs))); cost.appendChild(tot);

    var deals = $('cd-deals');
    DEALS.forEach(function (d) {
      var li = el('li'); var l = el('span'); l.appendChild(el('b', '', d[0])); l.appendChild(el('small', '', d[1] + ' · ' + d[3]));
      li.appendChild(l); li.appendChild(el('b', '', usd(d[2]))); deals.appendChild(li);
    });
    var next = $('cd-next');
    NEXT.forEach(function (n) {
      var li = el('li'); var l = el('span'); l.appendChild(el('b', '', n[2])); l.appendChild(el('small', '', n[1]));
      li.appendChild(l); li.appendChild(el('span', 'cd-when', n[0])); next.appendChild(li);
    });

    var reels = $('cd-reels');
    REELS.forEach(function (r) {
      var li = el('li', 'cd-reel');
      var fig = el('div', 'cd-thumb'); var im = doc.createElement('img'); im.src = '/assets/img/' + r.img; im.alt = ''; im.loading = 'lazy'; im.width = 320; im.height = 180;
      fig.appendChild(im); fig.appendChild(el('span', 'cd-plat', r.p)); fig.appendChild(badge());
      var body = el('div', 'cd-reel-b'); body.appendChild(el('p', 'cd-reel-t', r.t));
      var stats = el('dl', 'cd-stats');
      [['Views', compact(r.v)], ['Watched', r.w + '%'], ['Earned', r.e ? usd(r.e) : '—']].forEach(function (s) { var d = el('div'); d.appendChild(el('dt', '', s[0])); d.appendChild(el('dd', '', s[1])); stats.appendChild(d); });
      body.appendChild(stats); li.appendChild(fig); li.appendChild(body); reels.appendChild(li);
    });
  }

  /* ---------------- tooltip ---------------- */
  var tipTimer = null;
  function tip(text, anchor) {
    var t = $('cd-tip'); t.textContent = text; t.hidden = false; t.classList.toggle('cd-tip-float', !!anchor);
    if (anchor) { var r = anchor.getBoundingClientRect(); t.style.left = Math.min(Math.max(8, r.left + r.width / 2 - 90), root.innerWidth - 188) + 'px'; t.style.top = Math.max(8, r.top - 44) + 'px'; }
    else { t.style.left = ''; t.style.top = ''; clearTimeout(tipTimer); tipTimer = setTimeout(hideTip, 3500); }
  }
  function hideTip() { $('cd-tip').hidden = true; }

  function boot() {
    applyBrand(BRANDS.nova); wireBrand(); renderKpis(); renderRevenue(); renderLists();
    $('cd-z').addEventListener('click', function () {
      root.dispatchEvent(new CustomEvent('mw:guide-open', { detail: { context: 'creator-dashboard-demo' } }));
    });
    root.addEventListener('scroll', function () { if (!$('cd-tip').classList.contains('cd-tip-float')) return; hideTip(); }, { passive: true });
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot); else boot();
  root.MWCreatorDemo = { revenue: revenue, costs: costs, weeks: WEEKS, readable: readable, contrast: contrast };
})(window, document);
