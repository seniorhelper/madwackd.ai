/* Madwackd Pro Creator Studio. One console, two places:
   - <div id="pcs" data-variant="hero">  home page hero: always a live demo with sample numbers, nothing saved.
   - <div id="pcs" data-variant="full">  /pro-studio/: demo for visitors and Free accounts; Starter, Pro and Studio
     plans (checked with MWAuth when it is loaded) get their own studio, saved in this browser.
   Everything runs in the browser. Nothing here uploads data, sends email or posts to social accounts. */
(function () {
  'use strict';
  var root = document.getElementById('pcs');
  if (!root) return;
  var variant = root.getAttribute('data-variant') === 'hero' ? 'hero' : 'full';
  var KEY = 'mw_pro_studio_v1';
  var PAID = { starter: 1, pro: 1, studio: 1 };

  var PANELS = [
    { id: 'earn', name: 'Earnings desk' },
    { id: 'pitch', name: 'Pitch room' },
    { id: 'publish', name: 'Publish desk' },
    { id: 'mail', name: 'Mailing list' },
    { id: 'tips', name: 'Tip jar' },
    { id: 'market', name: 'Marketing bay' },
    { id: 'expert', name: 'Experts & upgrades' },
    { id: 'custom', name: 'Customize' }
  ];
  var SOURCES = ['Tips', 'Brand deals', 'Video sales', 'Client work', 'Platform payouts', 'Other'];
  var PLATFORMS = [
    { id: 'yt', n: 'YouTube', lim: 5000, up: 'https://studio.youtube.com/', pro: 'https://www.youtube.com/@' },
    { id: 'tt', n: 'TikTok', lim: 4000, up: 'https://www.tiktok.com/upload', pro: 'https://www.tiktok.com/@' },
    { id: 'ig', n: 'Instagram', lim: 2200, up: 'https://www.instagram.com/', pro: 'https://www.instagram.com/' },
    { id: 'fb', n: 'Facebook', lim: 63206, up: 'https://www.facebook.com/', pro: 'https://www.facebook.com/' },
    { id: 'x', n: 'X', lim: 280, up: 'https://x.com/compose/post', pro: 'https://x.com/' },
    { id: 'li', n: 'LinkedIn', lim: 3000, up: 'https://www.linkedin.com/feed/', pro: 'https://www.linkedin.com/in/' },
    { id: 'pin', n: 'Pinterest', lim: 500, up: 'https://www.pinterest.com/pin-creation-tool/', pro: 'https://www.pinterest.com/' },
    { id: 'th', n: 'Threads', lim: 500, up: 'https://www.threads.net/', pro: 'https://www.threads.net/@' }
  ];
  var TIPS = [
    { id: 'cashapp', n: 'Cash App', pre: 'https://cash.app/$', ph: 'yourcashtag' },
    { id: 'venmo', n: 'Venmo', pre: 'https://venmo.com/u/', ph: 'your-venmo' },
    { id: 'paypal', n: 'PayPal', pre: 'https://paypal.me/', ph: 'yourpaypalme' },
    { id: 'kofi', n: 'Ko-fi', pre: 'https://ko-fi.com/', ph: 'yourkofi' },
    { id: 'bmac', n: 'Buy Me a Coffee', pre: 'https://buymeacoffee.com/', ph: 'yourpage' },
    { id: 'patreon', n: 'Patreon', pre: 'https://www.patreon.com/', ph: 'yourpatreon' },
    { id: 'stripe', n: 'Stripe payment link', pre: '', ph: 'https://buy.stripe.com/...' }
  ];
  var BOOSTERS = [
    { id: 'b1', t: 'Put your tip links in every bio', go: 'tips' },
    { id: 'b2', t: 'Post one clip to 3 or more platforms', go: 'publish' },
    { id: 'b3', t: 'Pitch one brand or client this week', go: 'pitch' },
    { id: 'b4', t: 'Email your list about your newest video', go: 'mail' },
    { id: 'b5', t: 'Send out a press release for a launch', go: 'market' },
    { id: 'b6', t: 'Get a pro to review your work', go: 'expert' }
  ];
  var SERVICES = [
    { n: 'Madwackd producers', d: 'Real producers make the video for you.', u: '/producers/', c: '#FF2E93', dom: 'madwackd.ai' },
    { n: 'Eye To Ad Media', d: 'SEO and websites that get found in Google, Maps and AI answers.', u: 'https://www.eyetoad.com/', c: '#FF8A00', dom: 'eyetoad.com' },
    { n: 'Search Converts', d: 'Find out why traffic is not turning into calls, and fix it.', u: 'https://searchconverts.com/', c: '#FFD60A', dom: 'searchconverts.com' },
    { n: 'AI Speed to Leads', d: 'Every new lead answered in about 60 seconds by AI voice.', u: 'https://aispeedtoleads.com/', c: '#7ED321', dom: 'aispeedtoleads.com' },
    { n: 'Press Release For Business', d: 'Publish a press release at a permanent URL.', u: 'https://pressreleaseforbusiness.com/', c: '#00B8F0', dom: 'pressreleaseforbusiness.com' },
    { n: 'Distribute Press Releases', d: 'Send a release out across open news channels.', u: 'https://distributepressreleases.com/', c: '#8B3DFF', dom: 'distributepressreleases.com' },
    { n: 'Doorhanger AI', d: 'Make a local business bookable by AI assistants.', u: 'https://doorhanger.ai/', c: '#FF2E93', dom: 'doorhanger.ai' },
    { n: 'ProveHound', d: 'Local pro directory ordered by checked records.', u: 'https://www.provehound.com/', c: '#FF8A00', dom: 'provehound.com' },
    { n: 'Madwackd Productions', d: 'Our film and production company.', u: 'https://www.madwackd.com/', c: '#00B8F0', dom: 'madwackd.com' },
    { n: 'Video Propulsion', d: 'Video promotion service. Its own site is coming soon: call us to book it.', u: 'tel:+18004818638', c: '#7ED321', dom: '1-800-481-8638', soon: true }
  ];
  var FREE_TOOLS = [
    ['Hook writer', 'hk-h'], ['8-second script fitter', 'sf-h'], ['Prompt builder', 'pb-h'], ['Safe-zone checker', 'sz-h'], ['Caption maker', 'cp-h'],
    ['Teleprompter', 'tp-h'], ['Beat-cut planner', 'bt-h'], ['Brand palette and contrast', 'ct-h'], ['Share and embed code', 'em-h']
  ];

  /* ---------- helpers ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function money(n) { n = Math.round(Number(n) || 0); return '$' + n.toLocaleString('en-US'); }
  function uid() { return Math.random().toString(36).slice(2, 9); }
  function $(sel, el) { return (el || root).querySelector(sel); }
  function $$(sel, el) { return Array.prototype.slice.call((el || root).querySelectorAll(sel)); }
  function monthKey(d) { d = d || new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); }
  function today() { var d = new Date(); return monthKey(d) + '-' + String(d.getDate()).padStart(2, '0'); }
  function cleanHandle(s) { return String(s || '').trim().replace(/^@+/, '').replace(/[^A-Za-z0-9._-]/g, '').slice(0, 60); }
  function isEmail(s) { return /^[^\s@,;<>"]+@[^\s@,;<>"]+\.[A-Za-z]{2,}$/.test(String(s || '').trim()); }
  function tipUrl(t, v) {
    v = String(v || '').trim();
    if (!v) return '';
    if (t.id === 'stripe') return /^https:\/\/buy\.stripe\.com\/[A-Za-z0-9_]+$/.test(v) ? v : '';
    var h = t.id === 'cashapp' ? v.replace(/^\$+/, '').replace(/[^A-Za-z0-9_]/g, '') : cleanHandle(v);
    return h ? t.pre + h : '';
  }
  var toastTimer;
  function toast(msg) {
    var t = $('.pcs-toast'); if (!t) return;
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2200);
  }
  function copy(text, label) {
    function ok() { toast((label || 'Copied') + ' to your clipboard'); }
    if (navigator.clipboard && window.isSecureContext) { navigator.clipboard.writeText(text).then(ok, fallback); } else { fallback(); }
    function fallback() {
      var ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); ok(); } catch (e) { toast('Copy failed. Select the text and copy it.'); }
      document.body.removeChild(ta);
    }
  }
  function download(name, text, type) {
    var url = URL.createObjectURL(new Blob([text], { type: type || 'text/plain' }));
    var a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 500);
  }

  /* ---------- state ---------- */
  function blank() {
    var s = { v: 1, name: 'My Studio', accent: '#FF2E93', goal: 1500, entries: [], boosters: {}, pitch: { fmt: 'Short film' },
      socials: {}, caption: '', tags: '', link: '', contacts: [], subject: '', body: '', tips: {}, pr: {}, bio: {},
      order: PANELS.map(function (p) { return p.id; }), hidden: [] };
    PLATFORMS.forEach(function (p) { s.socials[p.id] = { on: false, h: '' }; });
    return s;
  }
  function sample() {
    var s = blank(), m = monthKey();
    s.name = 'Neon Alley Pictures'; s.goal = 2500;
    s.entries = [
      { id: uid(), d: m + '-02', amt: 420, src: 'Brand deals', note: 'Sneaker shop 30s spot' },
      { id: uid(), d: m + '-03', amt: 85, src: 'Tips', note: 'Live premiere tips' },
      { id: uid(), d: m + '-04', amt: 310, src: 'Client work', note: 'Music video edit' },
      { id: uid(), d: m + '-05', amt: 140, src: 'Platform payouts', note: 'Creator fund' },
      { id: uid(), d: m + '-06', amt: 260, src: 'Video sales', note: 'Stock clip license' },
      { id: uid(), d: m + '-06', amt: 55, src: 'Tips', note: 'Newsletter readers' }
    ];
    s.boosters = { b1: true, b2: true };
    s.pitch = { title: 'Midnight Laundromat', fmt: 'Short film', hero: 'a broke stand-up comic', want: 'needs one viral clip to land a tour', obstacle: 'every take is ruined by a haunted dryer', stakes: 'the clip that goes viral is the one he never wanted anyone to see', comp1: 'Ghostbusters', comp2: 'Hacks', audience: 'Comedy fans 18-34 on TikTok and YouTube', ask: '12000' };
    s.socials.yt = { on: true, h: 'neonalley' }; s.socials.tt = { on: true, h: 'neonalley' }; s.socials.ig = { on: true, h: 'neonalley' }; s.socials.x = { on: true, h: 'neonalley' };
    s.caption = 'New short film drops tonight. A comic, a haunted dryer, and one clip he never wanted out.'; s.tags = '#shortfilm #comedy #indiefilm'; s.link = 'https://example.com/watch';
    s.contacts = [
      { id: uid(), name: 'Ava R.', email: 'ava@example.com', tag: 'fans' },
      { id: uid(), name: 'Marcus T.', email: 'marcus@example.com', tag: 'fans' },
      { id: uid(), name: 'Juniper Co.', email: 'hello@example.com', tag: 'brands' },
      { id: uid(), name: 'Dee L.', email: 'dee@example.com', tag: 'crew' }
    ];
    s.subject = 'New video: Midnight Laundromat'; s.body = 'Hi! My new short film is out tonight. Watch it here: https://example.com/watch\n\nThanks for being on my list.';
    s.tips = { cashapp: 'neonalley', venmo: 'neonalley', kofi: 'neonalley' };
    s.pr = { head: 'Denver filmmaker releases haunted-laundromat comedy short', city: 'Denver, CO', what: 'Neon Alley Pictures today released Midnight Laundromat, a 9-minute comedy short made in Madwackd Studio.', quote: 'We wanted a ghost story you can laugh at in under ten minutes.', who: 'Jordan Vale, director', about: 'Neon Alley Pictures makes short comedy films and brand videos.' };
    s.bio = { name: 'Neon Alley Pictures', make: 'short comedy films and music videos', who: 'brands that want to be remembered', proof: '2M views across platforms', cta: 'Book a spot' };
    return s;
  }

  var mode = 'demo';          // 'demo' | 'live'
  var tier = 'anon';
  var userKey = KEY;
  var S = sample();
  var active = 'earn';

  function save() {
    if (mode !== 'live') return;
    try { localStorage.setItem(userKey, JSON.stringify(S)); } catch (e) { toast('Could not save in this browser.'); }
  }
  function load() {
    var s = null;
    try { s = JSON.parse(localStorage.getItem(userKey) || 'null'); } catch (e) { s = null; }
    var b = blank();
    if (!s || typeof s !== 'object') return b;
    Object.keys(b).forEach(function (k) { if (s[k] === undefined) s[k] = b[k]; });
    PLATFORMS.forEach(function (p) { if (!s.socials[p.id]) s.socials[p.id] = { on: false, h: '' }; });
    PANELS.forEach(function (p) { if (s.order.indexOf(p.id) < 0) s.order.push(p.id); });
    return s;
  }
  function changed() { save(); }

  /* ---------- shell ---------- */
  function shell() {
    root.innerHTML =
      '<div class="pcs-top">' +
        '<span class="pcs-onair" id="pcs-onair" title="Lights up while the pitch timer runs or when you hit your monthly goal">On air</span>' +
        '<p class="pcs-name"><small>Pro Creator Studio</small><span id="pcs-sname"></span></p>' +
        '<span class="pcs-badge" id="pcs-badge"></span>' +
        '<span class="pcs-clock" id="pcs-clock" aria-hidden="true">00:00:00</span>' +
      '</div>' +
      '<div class="pcs-demo" id="pcs-demo" hidden></div>' +
      '<div class="pcs-body">' +
        '<div class="pcs-strip"><div class="pcs-tabs" role="tablist" aria-label="Studio rooms" id="pcs-strip"></div><div id="pcs-foot"></div></div>' +
        '<div class="pcs-bay" id="pcs-bay"></div>' +
      '</div>' +
      '<div class="pcs-toast" role="status" aria-live="polite"></div>';
    tickClock(); setInterval(tickClock, 1000);
  }
  function tickClock() {
    var c = document.getElementById('pcs-clock'); if (!c) return;
    var d = new Date(); c.textContent = [d.getHours(), d.getMinutes(), d.getSeconds()].map(function (n) { return String(n).padStart(2, '0'); }).join(':');
  }
  function paintTop() {
    root.style.setProperty('--acc', S.accent || '#FF2E93');
    $('#pcs-sname').textContent = S.name || 'My Studio';
    var b = $('#pcs-badge'), demo = $('#pcs-demo');
    if (mode === 'live') {
      b.textContent = 'Your studio · saved on this device'; b.className = 'pcs-badge is-live'; demo.hidden = true;
    } else {
      b.textContent = tier === 'checking' ? 'Checking your plan…' : 'Live demo · sample numbers'; b.className = 'pcs-badge';
      demo.hidden = false;
      demo.innerHTML = '<b>Live demo.</b> Every control works. Names and numbers are made-up samples, and nothing is saved. ' +
        (tier === 'free' ? 'You are on the Free plan: ' : '') +
        'Pro Creator Studio comes with every paid plan (Starter, Pro and Studio). ' +
        (variant === 'hero' ? '<a href="/pro-studio/">Open the full studio</a> or <a href="/pricing/">see plans</a>.' : '<a href="/pricing/">See plans</a>' + (tier === 'anon' ? ' or <a href="/studio/?return=%2Fpro-studio%2F#live">sign in</a>.' : '.'));
    }
    paintOnAir();
    helloFlash();
  }
  var timerRunning = false, flashed = false;
  /* First paint only: the On Air light comes on for a moment, then goes off, so people notice it is there. */
  function helloFlash() {
    if (flashed) return; flashed = true;
    var el = document.getElementById('pcs-onair');
    if (!el || el.classList.contains('is-on')) return;
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setTimeout(function () {
      el.classList.add('is-on');
      setTimeout(function () { el.classList.remove('is-on'); paintOnAir(); }, 1500);
    }, 700);
  }
  function paintOnAir() {
    var hit = monthTotal() >= (Number(S.goal) || 1);
    var el = document.getElementById('pcs-onair');
    if (el) el.classList.toggle('is-on', timerRunning || hit);
  }
  function paintStrip() {
    var strip = $('#pcs-strip'), html = '';
    S.order.forEach(function (id) {
      if (S.hidden.indexOf(id) > -1 && id !== 'custom') return;
      var p = PANELS.filter(function (x) { return x.id === id; })[0]; if (!p) return;
      html += '<button type="button" class="pcs-tab" role="tab" id="pcs-t-' + id + '" aria-controls="pcs-bay" aria-selected="' + (id === active) + '" tabindex="' + (id === active ? 0 : -1) + '" data-tab="' + id + '"><span class="lamp" aria-hidden="true"></span>' + esc(p.name) + '</button>';
    });
    var foot = '<p class="pcs-strip-foot">' + (variant === 'hero' ? '<a href="/pro-studio/">Open the full studio &rarr;</a>' : 'Runs in your browser. Nothing is uploaded.') + '</p>';
    strip.innerHTML = html; $('#pcs-foot').innerHTML = foot;
  }
  function go(id) {
    if (S.hidden.indexOf(id) > -1 && id !== 'custom') { S.hidden = S.hidden.filter(function (x) { return x !== id; }); changed(); }
    active = id; paintStrip(); renderPanel();
  }

  root.addEventListener('click', function (e) {
    var t = e.target.closest('[data-tab]'); if (t) { go(t.getAttribute('data-tab')); var b = document.getElementById('pcs-t-' + active); if (b) b.focus(); return; }
    var g = e.target.closest('[data-go]'); if (g) { e.preventDefault(); go(g.getAttribute('data-go')); return; }
  });
  root.addEventListener('keydown', function (e) {
    var t = e.target.closest('[role=tab]'); if (!t) return;
    var tabs = $$('[role=tab]'), i = tabs.indexOf(t), n = -1;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') n = (i + 1) % tabs.length;
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length;
    if (e.key === 'Home') n = 0; if (e.key === 'End') n = tabs.length - 1;
    if (n > -1) { e.preventDefault(); go(tabs[n].getAttribute('data-tab')); var b = document.getElementById('pcs-t-' + active); if (b) b.focus(); }
  });

  function renderPanel() {
    // Fresh node each time so panel listeners never stack up.
    var old = $('#pcs-bay'), bay = old.cloneNode(false);
    old.parentNode.replaceChild(bay, old);
    bay.setAttribute('role', 'tabpanel'); bay.setAttribute('aria-labelledby', 'pcs-t-' + active);
    stopTimerIfLeaving();
    ({ earn: pEarn, pitch: pPitch, publish: pPublish, mail: pMail, tips: pTips, market: pMarket, expert: pExpert, custom: pCustom }[active] || pEarn)(bay);
  }
  function head(title, sub, extra) { return '<div class="pcs-h"><h2>' + title + '</h2>' + (extra || '') + '<p>' + sub + '</p></div>'; }
  function sampleTag() { return mode === 'demo' ? ' <span class="pcs-sample">Sample</span>' : ''; }

  /* ---------- knob ---------- */
  function knob(el, opt) {
    var v = opt.value;
    function set(nv, fire) {
      nv = Math.max(opt.min, Math.min(opt.max, Math.round(nv / opt.step) * opt.step));
      v = nv; el.style.setProperty('--rot', (-135 + 270 * (v - opt.min) / (opt.max - opt.min)) + 'deg');
      el.setAttribute('aria-valuenow', v); el.setAttribute('aria-valuetext', opt.fmt(v));
      var out = el.parentNode.querySelector('.pcs-knob-v'); if (out) out.textContent = opt.fmt(v);
      if (fire) opt.onChange(v);
    }
    el.setAttribute('role', 'slider'); el.setAttribute('tabindex', '0');
    el.setAttribute('aria-valuemin', opt.min); el.setAttribute('aria-valuemax', opt.max); el.setAttribute('aria-label', opt.label);
    set(v, false);
    var startY = 0, startV = 0, dragging = false;
    el.addEventListener('pointerdown', function (e) { dragging = true; startY = e.clientY; startV = v; el.setPointerCapture(e.pointerId); e.preventDefault(); });
    el.addEventListener('pointermove', function (e) { if (!dragging) return; set(startV + (startY - e.clientY) * (opt.max - opt.min) / 220, true); });
    el.addEventListener('pointerup', function () { dragging = false; });
    el.addEventListener('pointercancel', function () { dragging = false; });
    el.addEventListener('wheel', function (e) { e.preventDefault(); set(v + (e.deltaY < 0 ? opt.step : -opt.step), true); }, { passive: false });
    el.addEventListener('keydown', function (e) {
      var big = opt.step * 10;
      var m = { ArrowUp: opt.step, ArrowRight: opt.step, ArrowDown: -opt.step, ArrowLeft: -opt.step, PageUp: big, PageDown: -big }[e.key];
      if (m) { e.preventDefault(); set(v + m, true); }
      if (e.key === 'Home') { e.preventDefault(); set(opt.min, true); }
      if (e.key === 'End') { e.preventDefault(); set(opt.max, true); }
    });
  }

  /* ---------- Earnings desk ---------- */
  function monthEntries() { var m = monthKey(); return S.entries.filter(function (x) { return String(x.d).slice(0, 7) === m; }); }
  function monthTotal() { return monthEntries().reduce(function (a, x) { return a + (Number(x.amt) || 0); }, 0); }
  function gaugeSvg() {
    var ticks = '';
    for (var i = 0; i <= 10; i++) {
      var a = Math.PI - Math.PI * i / 10, c = Math.cos(a), s = Math.sin(a);
      var r1 = i % 5 === 0 ? 66 : 72;
      ticks += '<line x1="' + (110 + c * r1).toFixed(1) + '" y1="' + (112 - s * r1).toFixed(1) + '" x2="' + (110 + c * 80).toFixed(1) + '" y2="' + (112 - s * 80).toFixed(1) + '" stroke="#e9e2d0" stroke-width="' + (i % 5 === 0 ? 3 : 1.5) + '"/>';
    }
    return '<svg class="pcs-gauge" viewBox="0 0 220 132" role="img" aria-labelledby="pcs-gauge-t"><title id="pcs-gauge-t">Monthly goal meter</title>' +
      '<defs><linearGradient id="pcs-gg" x1="0" x2="1"><stop offset="0" stop-color="#FF4D4D"/><stop offset=".55" stop-color="#FFC23D"/><stop offset="1" stop-color="#39FF88"/></linearGradient>' +
      '<radialGradient id="pcs-face" cx=".5" cy="1" r="1"><stop offset="0" stop-color="#2a2232"/><stop offset="1" stop-color="#0d0a12"/></radialGradient></defs>' +
      '<path d="M6 116 A104 104 0 0 1 214 116 Z" fill="url(#pcs-face)" stroke="#000" stroke-width="3"/>' +
      '<path d="M24 112 A86 86 0 0 1 196 112" fill="none" stroke="url(#pcs-gg)" stroke-width="9" stroke-linecap="round" opacity=".9"/>' + ticks +
      '<text x="22" y="128" fill="#B9B2C8" font-size="10" font-family="Inter,sans-serif">0</text><text x="102" y="22" fill="#B9B2C8" font-size="10" font-family="Inter,sans-serif">50%</text><text x="184" y="128" fill="#B9B2C8" font-size="10" font-family="Inter,sans-serif">GOAL</text>' +
      '<g class="needle" style="transform:rotate(-90deg)"><line x1="110" y1="112" x2="110" y2="36" stroke="#fff" stroke-width="3" stroke-linecap="round"/><line x1="110" y1="112" x2="110" y2="124" stroke="#fff" stroke-width="5"/></g>' +
      '<circle cx="110" cy="112" r="9" fill="var(--acc)" stroke="#000" stroke-width="2"/></svg>';
  }
  function pEarn(bay) {
    var opts = SOURCES.map(function (s) { return '<option>' + esc(s) + '</option>'; }).join('');
    bay.innerHTML = head('Earnings desk', 'Set a monthly goal, log what comes in, and watch the meters move.', sampleTag()) +
      '<div class="pcs-grid">' +
        '<div class="pcs-card w7"><p class="pcs-led amber">Goal meter</p><div class="pcs-dial">' + gaugeSvg() +
          '<div><div class="pcs-big" id="pcs-tot"></div><p class="pcs-stat" id="pcs-pct"></p><p class="pcs-stat" id="pcs-pace"></p></div></div></div>' +
        '<div class="pcs-card w5"><p class="pcs-led pink">Goal setter</p><div class="pcs-knobs">' +
          '<div class="pcs-knob-w"><div class="pcs-knob" id="pcs-k-goal"></div><span class="pcs-knob-v"></span><span class="pcs-knob-l">Monthly goal</span></div>' +
          '<div style="flex:1;min-width:120px"><label for="pcs-goal-n">Or type it</label><input type="number" id="pcs-goal-n" min="100" max="100000" step="50" inputmode="numeric"><p class="pcs-note">Turn the dial, use the arrow keys, or type a number.</p></div>' +
        '</div></div>' +
        '<div class="pcs-card w12"><p class="pcs-led">Income meters this month</p><div class="pcs-vus" id="pcs-vus"></div></div>' +
        '<div class="pcs-card w6"><p class="pcs-led cyan">Log earnings</p><form id="pcs-earn-f" novalidate>' +
          '<div class="row"><div><label for="pcs-e-amt">Amount ($)</label><input type="number" id="pcs-e-amt" min="0" step="0.01" inputmode="decimal" required></div>' +
          '<div><label for="pcs-e-src">Source</label><select id="pcs-e-src">' + opts + '</select></div></div>' +
          '<div class="row"><div><label for="pcs-e-note">Note</label><input type="text" id="pcs-e-note" maxlength="80" placeholder="What was it for?"></div>' +
          '<div><label for="pcs-e-d">Date</label><input type="text" id="pcs-e-d" pattern="\\d{4}-\\d{2}-\\d{2}" placeholder="YYYY-MM-DD"></div></div>' +
          '<div class="pcs-btns"><button class="pcs-b hot" type="submit">Add to the board</button><button class="pcs-b ghost" type="button" id="pcs-e-csv">Export CSV</button></div></form>' +
          '<ul class="pcs-list" id="pcs-e-list" aria-label="This month\'s earnings"></ul></div>' +
        '<div class="pcs-card w6"><p class="pcs-led violet">Boosters</p><div class="pcs-meter" aria-hidden="true"><i id="pcs-bm"></i></div><p class="pcs-stat" id="pcs-bm-t"></p><div id="pcs-boost"></div>' +
          '<p class="pcs-note">Boosters are a checklist of proven moves, not a promise of income. What you earn depends on your work and your audience.</p></div>' +
      '</div>';
    $('#pcs-e-d').value = today();
    knob($('#pcs-k-goal'), { min: 100, max: 20000, step: 100, value: Number(S.goal) || 1500, label: 'Monthly goal in dollars', fmt: money,
      onChange: function (v) { S.goal = v; $('#pcs-goal-n').value = v; paintEarn(); changed(); } });
    var gn = $('#pcs-goal-n'); gn.value = S.goal;
    gn.addEventListener('change', function () { var v = Math.max(100, Math.min(100000, Math.round(Number(gn.value) || 0))); S.goal = v; gn.value = v; changed(); pEarn(bay); });
    $('#pcs-earn-f').addEventListener('submit', function (e) {
      e.preventDefault();
      var amt = Math.round((Number($('#pcs-e-amt').value) || 0) * 100) / 100, d = $('#pcs-e-d').value.trim();
      if (!(amt > 0)) { toast('Enter an amount above $0'); $('#pcs-e-amt').focus(); return; }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) d = today();
      S.entries.push({ id: uid(), d: d, amt: amt, src: $('#pcs-e-src').value, note: $('#pcs-e-note').value.trim().slice(0, 80) });
      $('#pcs-e-amt').value = ''; $('#pcs-e-note').value = ''; changed(); paintEarn();
      toast(d.slice(0, 7) === monthKey() ? 'Logged ' + money(amt) : 'Logged for ' + d.slice(0, 7) + ' (not this month)');
    });
    $('#pcs-e-csv').addEventListener('click', function () {
      var rows = [['date', 'amount', 'source', 'note']].concat(S.entries.map(function (x) { return [x.d, x.amt, x.src, x.note]; }));
      download('earnings.csv', rows.map(function (r) { return r.map(function (c) { return '"' + String(c == null ? '' : c).replace(/"/g, '""') + '"'; }).join(','); }).join('\n'), 'text/csv');
    });
    $('#pcs-e-list').addEventListener('click', function (e) {
      var x = e.target.closest('[data-del]'); if (!x) return;
      S.entries = S.entries.filter(function (en) { return en.id !== x.getAttribute('data-del'); }); changed(); paintEarn();
    });
    $('#pcs-boost').addEventListener('change', function (e) {
      if (!e.target.matches('input[type=checkbox]')) return;
      S.boosters[e.target.value] = e.target.checked; changed(); paintEarn();
    });
    paintEarn();
  }
  function paintEarn() {
    var tot = monthTotal(), goal = Number(S.goal) || 1, p = tot / goal;
    var d = new Date(), dim = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(), left = dim - d.getDate() + 1;
    $('#pcs-tot').innerHTML = money(tot) + ' <small>of ' + money(goal) + '</small>';
    $('#pcs-pct').textContent = Math.round(p * 100) + '% of your monthly goal';
    $('#pcs-pace').textContent = tot >= goal ? 'Goal hit. Raise the bar?' : money((goal - tot) / left) + ' a day for the next ' + left + ' days gets you there.';
    var needle = $('.pcs-gauge .needle');
    requestAnimationFrame(function () { needle.style.transform = 'rotate(' + (-90 + 180 * Math.min(p, 1.04)) + 'deg)'; });
    var by = {}; SOURCES.forEach(function (s) { by[s] = 0; });
    monthEntries().forEach(function (x) { by[x.src] = (by[x.src] || 0) + (Number(x.amt) || 0); });
    var scale = Math.max(goal / 3, 1), segs = 12, vus = '';
    SOURCES.forEach(function (s) {
      var lit = Math.min(segs, Math.round(by[s] / scale * segs)), col = '';
      for (var i = 0; i < segs; i++) col += '<i class="' + (i < lit ? 'on' : '') + (i >= 10 ? ' r' : i >= 7 ? ' a' : '') + '"></i>';
      vus += '<div class="pcs-vu"><div class="pcs-vu-col" aria-hidden="true">' + col + '</div><b>' + money(by[s]) + '</b><span>' + esc(s) + '</span></div>';
    });
    $('#pcs-vus').innerHTML = vus;
    var list = monthEntries().slice().sort(function (a, b) { return a.d < b.d ? 1 : -1; });
    $('#pcs-e-list').innerHTML = list.length ? list.map(function (x) {
      return '<li><span class="amt">' + money(x.amt) + '</span><span class="grow">' + esc(x.src) + (x.note ? ' · ' + esc(x.note) : '') + ' <small style="color:#8d86a0">' + esc(x.d.slice(5)) + '</small></span><button type="button" class="pcs-x" data-del="' + esc(x.id) + '" aria-label="Remove ' + esc(money(x.amt) + ' ' + x.src) + '">&times;</button></li>';
    }).join('') : '<li><span class="grow" style="color:#9d96b0">Nothing logged this month yet.</span></li>';
    var done = BOOSTERS.filter(function (b) { return S.boosters[b.id]; }).length, pct = Math.round(done / BOOSTERS.length * 100);
    var bm = $('#pcs-bm'); bm.style.width = pct + '%'; bm.className = pct < 34 ? 'r' : pct < 67 ? 'a' : '';
    $('#pcs-bm-t').textContent = done + ' of ' + BOOSTERS.length + ' boosters done';
    $('#pcs-boost').innerHTML = BOOSTERS.map(function (b) {
      return '<label class="pcs-check"><input type="checkbox" value="' + b.id + '"' + (S.boosters[b.id] ? ' checked' : '') + '><span>' + esc(b.t) + ' <a href="#" data-go="' + b.go + '">Open</a></span></label>';
    }).join('');
    paintOnAir();
  }

  /* ---------- Pitch room ---------- */
  var CUES = [['Hook', function (p) { return p.title ? 'Open cold. Say the title: ' + p.title + '.' : 'Open with one line that makes them lean in.'; }],
    ['Logline', function (p) { return logline(p) || 'Fill in the fields to build your logline.'; }],
    ['Why now', function () { return 'Why this story, and why you, right now? One sentence.'; }],
    ['Comps', function (p) { return p.comp1 && p.comp2 ? p.comp1 + ' meets ' + p.comp2 + '.' : 'Name two titles it sits between.'; }],
    ['Audience', function (p) { return p.audience || 'Who watches this, and where?'; }],
    ['The ask', function (p) { return p.ask ? 'We need ' + money(p.ask) + ' to make it. Here is what that buys.' : 'Say the number and what it buys.'; }]];
  function logline(p) {
    if (!p.hero || !p.want) return '';
    return 'When ' + p.hero + ' ' + p.want + (p.obstacle ? ', ' + p.obstacle : '') + (p.stakes ? ', and ' + p.stakes : '') + '.';
  }
  function pitchText(p) {
    return (p.title || 'Untitled') + '\n' + (p.fmt || '') + '\n\nLOGLINE\n' + (logline(p) || '-') +
      '\n\nCOMPS\n' + (p.comp1 && p.comp2 ? p.comp1 + ' meets ' + p.comp2 : '-') +
      '\n\nAUDIENCE\n' + (p.audience || '-') + '\n\nTHE ASK\n' + (p.ask ? money(p.ask) : '-') + '\n\n' + (S.name || '') ;
  }
  var timer = { left: 60, len: 60, id: 0, cue: 0 };
  function stopTimerIfLeaving() { if (active !== 'pitch' && timer.id) { clearInterval(timer.id); timer.id = 0; timerRunning = false; paintOnAir(); } }
  function pPitch(bay) {
    var p = S.pitch, f = function (k, lab, ph) { return '<div class="f"><label for="pcs-p-' + k + '">' + lab + '</label><input type="text" id="pcs-p-' + k + '" data-pk="' + k + '" maxlength="140" placeholder="' + esc(ph) + '" value="' + esc(p[k] || '') + '"></div>'; };
    var fmts = ['Short film', 'Series', 'Feature film', 'Music video', 'Brand campaign', 'Commercial', 'Documentary'];
    bay.innerHTML = head('Pitch room', 'Build the pitch, rehearse it against the clock, walk in with a one-sheet.', sampleTag()) +
      '<div class="pcs-grid"><div class="pcs-card w7"><p class="pcs-led pink">Pitch builder</p>' +
        '<div class="row"><div>' + f('title', 'Title', 'Midnight Laundromat') + '</div><div class="f"><label for="pcs-p-fmt">Format</label><select id="pcs-p-fmt" data-pk="fmt">' +
          fmts.map(function (x) { return '<option' + (p.fmt === x ? ' selected' : '') + '>' + x + '</option>'; }).join('') + '</select></div></div>' +
        '<div class="row"><div>' + f('hero', 'Who is the hero?', 'a broke stand-up comic') + '</div><div>' + f('want', 'What do they want?', 'needs one viral clip') + '</div></div>' +
        '<div class="row"><div>' + f('obstacle', 'What is in the way?', 'a haunted dryer ruins every take') + '</div><div>' + f('stakes', 'What happens if they fail?', 'the wrong clip goes viral') + '</div></div>' +
        '<div class="row3"><div>' + f('comp1', 'Comp 1', 'Ghostbusters') + '</div><div>' + f('comp2', 'Comp 2', 'Hacks') + '</div><div>' + f('ask', 'The ask ($)', '12000') + '</div></div>' +
        f('audience', 'Audience', 'Comedy fans 18-34') +
        '<p class="pcs-led amber" style="margin-top:6px">Your logline</p><div class="pcs-out" id="pcs-ll" aria-live="polite"></div>' +
        '<div class="pcs-btns"><button class="pcs-b hot" type="button" id="pcs-p-copy">Copy pitch</button><button class="pcs-b" type="button" id="pcs-p-print">Print one-sheet</button><button class="pcs-b ghost" type="button" id="pcs-p-dl">Download .txt</button></div></div>' +
      '<div class="pcs-card w5"><p class="pcs-led amber">Rehearsal clock</p><div class="pcs-timer" id="pcs-tm" role="timer" aria-live="off">1:00</div>' +
        '<div class="pcs-btns"><button class="pcs-b sm" type="button" data-len="60">60 sec</button><button class="pcs-b sm" type="button" data-len="180">3 min</button><button class="pcs-b sm" type="button" data-len="600">10 min</button></div>' +
        '<div class="pcs-btns"><button class="pcs-b hot" type="button" id="pcs-tm-go">Start</button><button class="pcs-b" type="button" id="pcs-tm-next">Next card</button><button class="pcs-b ghost" type="button" id="pcs-tm-reset">Reset</button></div>' +
        '<div class="pcs-cue" id="pcs-cue" aria-live="polite"></div><p class="pcs-note">The On Air light stays lit while the clock runs.</p></div></div>';
    function paintLL() { $('#pcs-ll').textContent = logline(S.pitch) || 'Fill in the hero and what they want, and your logline appears here.'; paintCue(); }
    function paintCue() { var c = CUES[timer.cue % CUES.length]; $('#pcs-cue').innerHTML = '<small>Card ' + (timer.cue % CUES.length + 1) + ' of ' + CUES.length + ': ' + c[0] + '</small>' + esc(c[1](S.pitch)); }
    function paintTm() { var t = Math.abs(timer.left), el = $('#pcs-tm'); if (!el) return; el.textContent = (timer.left < 0 ? '-' : '') + Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0'); el.classList.toggle('over', timer.left < 0); }
    bay.addEventListener('input', function (e) { var k = e.target.getAttribute('data-pk'); if (!k) return; S.pitch[k] = k === 'ask' ? e.target.value.replace(/[^\d.]/g, '') : e.target.value; changed(); paintLL(); });
    bay.addEventListener('change', function (e) { if (e.target.id === 'pcs-p-fmt') { S.pitch.fmt = e.target.value; changed(); } });
    $('#pcs-p-copy').addEventListener('click', function () { copy(pitchText(S.pitch), 'Pitch'); });
    $('#pcs-p-dl').addEventListener('click', function () { download((S.pitch.title || 'pitch').replace(/[^\w-]+/g, '-') + '.txt', pitchText(S.pitch)); });
    $('#pcs-p-print').addEventListener('click', function () { printSheet(S.pitch); });
    $$('[data-len]', bay).forEach(function (b) { b.addEventListener('click', function () { timer.len = timer.left = Number(b.getAttribute('data-len')); paintTm(); }); });
    $('#pcs-tm-go').addEventListener('click', function () {
      var btn = this;
      if (timer.id) { clearInterval(timer.id); timer.id = 0; timerRunning = false; btn.textContent = 'Start'; paintOnAir(); return; }
      timerRunning = true; btn.textContent = 'Pause'; paintOnAir();
      timer.id = setInterval(function () { timer.left--; paintTm(); }, 1000);
    });
    $('#pcs-tm-next').addEventListener('click', function () { timer.cue++; paintCue(); });
    $('#pcs-tm-reset').addEventListener('click', function () { clearInterval(timer.id); timer.id = 0; timerRunning = false; timer.left = timer.len; timer.cue = 0; $('#pcs-tm-go').textContent = 'Start'; paintTm(); paintCue(); paintOnAir(); });
    paintLL(); paintTm();
  }
  function printSheet(p) {
    var div = document.createElement('div'); div.className = 'pcs-print';
    div.innerHTML = '<h1 style="font:700 28px Georgia,serif;margin:0 0 4px">' + esc(p.title || 'Untitled') + '</h1><p style="margin:0 0 18px;color:#555">' + esc(p.fmt || '') + ' · ' + esc(S.name || '') + '</p>' +
      '<h2 style="font:700 14px Arial;letter-spacing:.1em">LOGLINE</h2><p>' + esc(logline(p) || '') + '</p>' +
      '<h2 style="font:700 14px Arial;letter-spacing:.1em">COMPS</h2><p>' + esc(p.comp1 && p.comp2 ? p.comp1 + ' meets ' + p.comp2 : '') + '</p>' +
      '<h2 style="font:700 14px Arial;letter-spacing:.1em">AUDIENCE</h2><p>' + esc(p.audience || '') + '</p>' +
      '<h2 style="font:700 14px Arial;letter-spacing:.1em">THE ASK</h2><p>' + esc(p.ask ? money(p.ask) : '') + '</p>';
    document.body.appendChild(div); document.body.classList.add('pcs-printing');
    function done() { document.body.classList.remove('pcs-printing'); div.remove(); window.removeEventListener('afterprint', done); }
    window.addEventListener('afterprint', done); window.print(); setTimeout(done, 1500);
  }

  /* ---------- Publish desk ---------- */
  function fullCaption() { return [S.caption, S.link, S.tags].filter(function (x) { return String(x || '').trim(); }).join('\n\n'); }
  function pPublish(bay) {
    bay.innerHTML = head('Publish desk', 'Plug in your channels, write once, and post everywhere from one kit.', sampleTag()) +
      '<div class="pcs-grid"><div class="pcs-card w12"><p class="pcs-led cyan">Patch bay: your channels</p><div class="pcs-patch">' +
        PLATFORMS.map(function (p) {
          var s = S.socials[p.id];
          return '<div class="pcs-jack"><label class="pcs-sw" title="Include ' + p.n + ' in my feed and publish kit"><input type="checkbox" data-on="' + p.id + '"' + (s.on ? ' checked' : '') + ' aria-label="Use ' + p.n + '"><span></span></label>' +
            '<span class="nm">' + p.n + '</span><input type="text" data-h="' + p.id + '" value="' + esc(s.h) + '" placeholder="@handle" aria-label="' + p.n + ' handle" maxlength="60"></div>';
        }).join('') + '</div><p class="pcs-note">Flip a switch to put that channel in your feed wall and publish kit. Handles stay in this browser.</p></div>' +
      '<div class="pcs-card w7"><p class="pcs-led pink">Write once</p><div class="f"><label for="pcs-cap">Caption</label><textarea id="pcs-cap" maxlength="5000">' + esc(S.caption) + '</textarea></div>' +
        '<div class="row"><div><label for="pcs-lnk">Link</label><input type="url" id="pcs-lnk" value="' + esc(S.link) + '" placeholder="https://"></div><div><label for="pcs-tags">Hashtags</label><input type="text" id="pcs-tags" value="' + esc(S.tags) + '" placeholder="#shortfilm #comedy"></div></div>' +
        '<p class="pcs-led amber">Length meters</p><div id="pcs-lens"></div></div>' +
      '<div class="pcs-card w12 pcs-launchcard"><p class="pcs-led pink">One Launch button <span class="pcs-beta">Beta</span></p>' +
        '<div class="pcs-lights" id="pcs-lights" aria-live="polite"></div>' +
        '<div class="row"><div><label for="pcs-lj">Finished video</label><select id="pcs-lj" disabled><option value="">Sign in to pick a render</option></select></div>' +
        '<div class="pcs-lbtns"><button class="pcs-b hot pcs-biglaunch" type="button" id="pcs-launch" disabled>Launch to my feeds</button>' +
        '<button class="pcs-b" type="button" id="pcs-lconn" disabled>Connect my feeds</button></div></div>' +
        '<p class="pcs-note" id="pcs-lmsg" role="status">Coming soon. Use the copy-and-open kit below for now.</p>' +
        '<div class="pcs-lstats" id="pcs-lstats"></div></div>' +
      '<div class="pcs-card w5"><p class="pcs-led">Mass publish kit</p><div class="pcs-kit" id="pcs-kit"></div>' +
        '<div class="pcs-btns"><button class="pcs-b hot" type="button" id="pcs-copyall">Copy caption</button></div>' +
        '<p class="pcs-note">The kit always works: it copies your caption and opens each upload page, so a full rollout takes a few clicks. Use it for any feed the Launch button does not cover yet.</p></div>' +
      '<div class="pcs-card w12"><p class="pcs-led violet">Feed wall</p><div class="pcs-launch" id="pcs-wall"></div><p class="pcs-note"><span class="pcs-soon">Coming soon</span> Live posts from each channel shown right here. Today each switch adds a one-click link to that profile.</p></div></div>';
    function paint() {
      var cap = fullCaption(), on = PLATFORMS.filter(function (p) { return S.socials[p.id].on; });
      $('#pcs-lens').innerHTML = on.length ? on.map(function (p) {
        var r = cap.length / p.lim, w = Math.min(100, Math.round(r * 100));
        return '<div style="font-size:.78rem;margin-bottom:6px"><div style="display:flex;justify-content:space-between"><span>' + p.n + '</span><span class="cnt">' + cap.length + ' / ' + p.lim.toLocaleString('en-US') + (r > 1 ? ' · too long' : '') + '</span></div><div class="pcs-meter"><i class="' + (r > 1 ? 'r' : r > .9 ? 'a' : '') + '" style="width:' + w + '%"></i></div></div>';
      }).join('') : '<p class="pcs-note">Switch on a channel above to see its meter.</p>';
      $('#pcs-kit').innerHTML = on.length ? on.map(function (p) {
        var over = cap.length > p.lim;
        return '<div class="pcs-kit-row"><b>' + p.n + '</b><span class="cnt">' + (over ? 'Trim to ' + p.lim + ' characters' : 'Ready') + '</span>' +
          '<button class="pcs-b sm" type="button" data-cp="' + p.id + '">Copy</button><a class="pcs-b sm hot" href="' + p.up + '" target="_blank" rel="noopener">Open ' + p.n + '</a></div>';
      }).join('') : '<p class="pcs-note">No channels switched on yet.</p>';
      $('#pcs-wall').innerHTML = on.length ? on.map(function (p) {
        var h = cleanHandle(S.socials[p.id].h);
        if (!h) return '<div class="pcs-lb" style="--c:#5a5170"><b>' + p.n + '</b><span>Add your handle to link your profile.</span></div>';
        if (mode === 'demo') return '<div class="pcs-lb"><b>' + p.n + '</b><span>@' + esc(h) + '</span><em>Sample handle, not linked</em></div>';
        return '<a class="pcs-lb" href="' + esc(p.pro + h) + '" target="_blank" rel="noopener"><b>' + p.n + '</b><span>@' + esc(h) + '</span><em>Open profile</em></a>';
      }).join('') : '<p class="pcs-note">Switch on a channel to add it to your wall.</p>';
    }
    bay.addEventListener('change', function (e) { var id = e.target.getAttribute('data-on'); if (id) { S.socials[id].on = e.target.checked; changed(); paint(); } });
    bay.addEventListener('input', function (e) {
      var t = e.target, id = t.getAttribute('data-h');
      if (id) { S.socials[id].h = t.value; changed(); paint(); return; }
      if (t.id === 'pcs-cap') S.caption = t.value; else if (t.id === 'pcs-lnk') S.link = t.value.trim(); else if (t.id === 'pcs-tags') S.tags = t.value; else return;
      changed(); paint();
    });
    bay.addEventListener('click', function (e) { var b = e.target.closest('[data-cp]'); if (b) copy(fullCaption(), 'Caption'); });
    $('#pcs-copyall').addEventListener('click', function () { copy(fullCaption(), 'Caption'); });
    /* ---- One Launch button (Beta). Needs a paid plan, a finished render, a connected feed, and the server switched on. ---- */
    var L = window.MWLaunch, LS = { status: null, jobs: [], busy: false, shown: false };
    function lsay(t) { var m = $('#pcs-lmsg'); if (m) m.textContent = t; }
    function lpaint() {
      var box = $('#pcs-lights'); if (!box || !L) return;
      box.innerHTML = L.lights(LS.status).map(function (l) { return '<span class="pcs-light ' + l.tone + '"><i aria-hidden="true"></i>' + l.label + ' <em>' + l.text + '</em></span>'; }).join('');
      var plats = L.pickPlatforms(LS.status, S.socials), c = L.canLaunch({ signedIn: mode === 'live', status: LS.status, jobId: $('#pcs-lj').value, caption: fullCaption(), platforms: plats });
      $('#pcs-launch').disabled = !c.ok || LS.busy;
      $('#pcs-lconn').disabled = !(mode === 'live' && LS.status && LS.status.state === 'ready') || LS.busy;
      if (!LS.busy && !LS.shown) lsay(c.ok ? 'Ready: ' + plats.length + ' feed' + (plats.length === 1 ? '' : 's') + '.' : c.why);
    }
    function lstats() {
      L.stats().then(function (st) {
        var ks = Object.keys(st.platforms || {});
        $('#pcs-lstats').innerHTML = ks.length ? '<p class="pcs-led amber">Your numbers</p>' + ks.map(function (k) {
          var v = st.platforms[k] || {};
          return '<div class="pcs-lstat"><b>' + esc(L.LABEL[k] || k) + '</b><span>' + (v.followers == null ? 'n/a' : Number(v.followers).toLocaleString('en-US')) + ' followers</span><span>' + (v.views == null ? 'n/a' : Number(v.views).toLocaleString('en-US')) + ' views</span></div>';
        }).join('') + '<p class="pcs-note">' + (st.updated_at ? 'Updated ' + esc(String(st.updated_at).slice(0, 16).replace('T', ' ')) + ' UTC. ' : '') + 'Straight from each platform. Earnings are not shown.</p>' : '';
      }, function () {});
    }
    function lpoll(id, n) {
      L.post(id).then(function (r) {
        var res = r.results || {};
        lsay(Object.keys(res).map(function (k) { return (L.LABEL[k] || k) + ': ' + (res[k].state || '?') + (res[k].message ? ' (' + res[k].message + ')' : ''); }).join(' · '));
        if (r.state !== 'done' && n < 20) setTimeout(function () { lpoll(id, n + 1); }, 4000); else if (r.state === 'done') lstats();
      }, function () { if (n < 20) setTimeout(function () { lpoll(id, n + 1); }, 6000); });
    }
    if (L && mode === 'live') {
      L.status().then(function (st) { LS.status = st; lpaint(); if (st.state === 'ready') lstats(); }, function () { lpaint(); });
      L.jobs().then(function (r) {
        LS.jobs = (r.jobs || []).filter(function (j) { return j.status === 'done'; });
        var sel = $('#pcs-lj'); sel.disabled = !LS.jobs.length;
        sel.innerHTML = LS.jobs.length ? '<option value="">Pick a finished video</option>' + LS.jobs.map(function (j) { return '<option value="' + esc(j.id) + '">' + esc(String(j.prompt || 'Render').slice(0, 60)) + '</option>'; }).join('') : '<option value="">No finished renders yet</option>';
        lpaint();
      }, function () {});
      $('#pcs-lj').addEventListener('change', function () { LS.shown = false; lpaint(); });
      $('#pcs-lconn').addEventListener('click', function () {
        LS.busy = true; lpaint(); lsay('Opening the connect page...');
        L.connect().then(function (r) {
          LS.busy = false; LS.shown = true; lpaint();
          var m = $('#pcs-lmsg'); m.textContent = ''; var a = document.createElement('a');
          a.href = r.connect_url; a.target = '_blank'; a.rel = 'noopener'; a.textContent = 'Open the connect page (the link works for 48 hours)';
          m.appendChild(a); m.appendChild(document.createTextNode('. Then come back and reload this page.'));
        }, function (e) { LS.busy = false; LS.shown = false; lpaint(); lsay(e.message || 'Could not open the connect page.'); });
      });
      $('#pcs-launch').addEventListener('click', function () {
        var plats = L.pickPlatforms(LS.status, S.socials);
        LS.busy = true; LS.shown = true; lpaint(); lsay('Sending to ' + plats.length + ' feed' + (plats.length === 1 ? '' : 's') + '...');
        L.publish({ job_id: $('#pcs-lj').value, caption: fullCaption().slice(0, 2200), platforms: plats, idempotency_key: L.newKey() }).then(function (r) {
          LS.busy = false; lpaint(); lsay('Sent. Checking each feed...'); lpoll(r.post_id, 0);
        }, function (e) { LS.busy = false; lpaint(); lsay((e.message || 'Not sent.') + ' The copy-and-open kit still works.'); });
      });
    }
    bay.addEventListener('input', function () { LS.shown = false; if (L) lpaint(); });
    bay.addEventListener('change', function () { LS.shown = false; if (L) lpaint(); });
    if (L) lpaint();
    paint();
  }

  /* ---------- Mailing list ---------- */
  var mailTag = '';
  function pMail(bay) {
    bay.innerHTML = head('Mailing list', 'Your fans, brands and crew in one list. It stays in this browser.', sampleTag()) +
      '<div class="pcs-grid"><div class="pcs-card w5"><p class="pcs-led cyan">Add people</p><form id="pcs-m-f" novalidate>' +
        '<div class="f"><label for="pcs-m-n">Name</label><input type="text" id="pcs-m-n" maxlength="60"></div>' +
        '<div class="row"><div><label for="pcs-m-e">Email</label><input type="email" id="pcs-m-e" maxlength="120" required></div><div><label for="pcs-m-t">Tag</label><input type="text" id="pcs-m-t" maxlength="24" placeholder="fans"></div></div>' +
        '<div class="pcs-btns"><button class="pcs-b hot" type="submit">Add</button><label class="pcs-b ghost" style="margin:0;color:#fff;font-size:.84rem">Import CSV<input type="file" id="pcs-m-csv" accept=".csv,text/csv" hidden></label><button class="pcs-b ghost" type="button" id="pcs-m-exp">Export CSV</button></div></form>' +
        '<p class="pcs-note">Only add people who asked to hear from you.</p></div>' +
      '<div class="pcs-card w7"><p class="pcs-led">Your list</p><div class="row"><div><label for="pcs-m-filter">Show</label><select id="pcs-m-filter"></select></div><div><label>&nbsp;</label><p class="pcs-stat" id="pcs-m-count" style="margin:8px 0 0"></p></div></div>' +
        '<ul class="pcs-list" id="pcs-m-list" aria-label="Contacts"></ul></div>' +
      '<div class="pcs-card w12"><p class="pcs-led pink">Write to them</p><div class="f"><label for="pcs-m-sub">Subject</label><input type="text" id="pcs-m-sub" maxlength="140" value="' + esc(S.subject) + '"></div>' +
        '<div class="f"><label for="pcs-m-body">Message</label><textarea id="pcs-m-body" maxlength="4000">' + esc(S.body) + '</textarea></div>' +
        '<div class="pcs-btns"><button class="pcs-b hot" type="button" id="pcs-m-open">Open in my email app</button><button class="pcs-b" type="button" id="pcs-m-copy">Copy addresses</button><button class="pcs-b ghost" type="button" id="pcs-m-copyb">Copy message</button></div>' +
        '<p class="pcs-note">Your email app opens with everyone in BCC, so nobody sees the other addresses. Before you send: include your mailing address and a line telling people how to unsubscribe, and remove anyone who asks. For big lists, paste the addresses into an email marketing service. <span class="pcs-soon">Coming soon</span> Sending straight from the studio.</p></div></div>';
    function list() { return S.contacts.filter(function (c) { return !mailTag || c.tag === mailTag; }); }
    function paint() {
      var tags = []; S.contacts.forEach(function (c) { if (c.tag && tags.indexOf(c.tag) < 0) tags.push(c.tag); });
      if (mailTag && tags.indexOf(mailTag) < 0) mailTag = '';
      $('#pcs-m-filter').innerHTML = '<option value="">Everyone (' + S.contacts.length + ')</option>' + tags.map(function (t) { return '<option value="' + esc(t) + '"' + (t === mailTag ? ' selected' : '') + '>' + esc(t) + '</option>'; }).join('');
      var l = list();
      $('#pcs-m-count').textContent = l.length + (l.length === 1 ? ' person' : ' people') + ' selected';
      $('#pcs-m-list').innerHTML = l.length ? l.map(function (c) {
        return '<li><span class="grow"><b>' + esc(c.name || c.email) + '</b> <small style="color:#9d96b0">' + esc(c.email) + '</small></span>' + (c.tag ? '<span class="pcs-sample">' + esc(c.tag) + '</span>' : '') + '<button type="button" class="pcs-x" data-del="' + esc(c.id) + '" aria-label="Remove ' + esc(c.email) + '">&times;</button></li>';
      }).join('') : '<li><span class="grow" style="color:#9d96b0">No one here yet.</span></li>';
    }
    function add(name, email, tag) {
      email = String(email || '').trim().toLowerCase();
      if (!isEmail(email) || S.contacts.some(function (c) { return c.email === email; })) return false;
      S.contacts.push({ id: uid(), name: String(name || '').trim().slice(0, 60), email: email, tag: String(tag || '').trim().toLowerCase().slice(0, 24) }); return true;
    }
    $('#pcs-m-f').addEventListener('submit', function (e) {
      e.preventDefault();
      if (!isEmail($('#pcs-m-e').value)) { toast('That email does not look right'); $('#pcs-m-e').focus(); return; }
      if (!add($('#pcs-m-n').value, $('#pcs-m-e').value, $('#pcs-m-t').value)) { toast('Already on your list'); return; }
      $('#pcs-m-n').value = ''; $('#pcs-m-e').value = ''; changed(); paint(); toast('Added');
    });
    $('#pcs-m-csv').addEventListener('change', function () {
      var f = this.files && this.files[0]; if (!f) return;
      if (f.size > 2e6) { toast('That file is over 2 MB'); return; }
      var r = new FileReader();
      r.onload = function () {
        var n = 0, lines = String(r.result).split(/\r?\n/);
        lines.forEach(function (line) {
          var cells = (line.match(/("([^"]|"")*"|[^,]*)(,|$)/g) || []).map(function (c) { return c.replace(/,$/, '').replace(/^"|"$/g, '').replace(/""/g, '"').trim(); });
          var em = cells.filter(isEmail)[0]; if (!em) return;
          var nm = cells.filter(function (c) { return c && c !== em && !isEmail(c); })[0] || '';
          if (add(nm, em, 'imported')) n++;
        });
        changed(); paint(); toast('Imported ' + n + (n === 1 ? ' contact' : ' contacts'));
      };
      r.readAsText(f); this.value = '';
    });
    $('#pcs-m-exp').addEventListener('click', function () {
      download('mailing-list.csv', 'name,email,tag\n' + S.contacts.map(function (c) { return [c.name, c.email, c.tag].map(function (x) { return '"' + String(x || '').replace(/"/g, '""') + '"'; }).join(','); }).join('\n'), 'text/csv');
    });
    $('#pcs-m-filter').addEventListener('change', function () { mailTag = this.value; paint(); });
    $('#pcs-m-list').addEventListener('click', function (e) { var x = e.target.closest('[data-del]'); if (!x) return; S.contacts = S.contacts.filter(function (c) { return c.id !== x.getAttribute('data-del'); }); changed(); paint(); });
    $('#pcs-m-sub').addEventListener('input', function () { S.subject = this.value; changed(); });
    $('#pcs-m-body').addEventListener('input', function () { S.body = this.value; changed(); });
    $('#pcs-m-copy').addEventListener('click', function () { var l = list(); if (!l.length) { toast('No one selected'); return; } copy(l.map(function (c) { return c.email; }).join(', '), l.length + ' addresses'); });
    $('#pcs-m-copyb').addEventListener('click', function () { copy(S.subject + '\n\n' + S.body, 'Message'); });
    $('#pcs-m-open').addEventListener('click', function () {
      var l = list(); if (!l.length) { toast('No one selected'); return; }
      if (mode === 'demo') { toast('Demo list uses sample addresses. Add your own in your studio.'); return; }
      var url = 'mailto:?bcc=' + encodeURIComponent(l.map(function (c) { return c.email; }).join(',')) + '&subject=' + encodeURIComponent(S.subject) + '&body=' + encodeURIComponent(S.body);
      if (url.length > 1900) { toast('Too many people for an email app link. Use Copy addresses.'); return; }
      location.href = url;
    });
    paint();
  }

  /* ---------- Tip jar ---------- */
  function tipLinks() { return TIPS.map(function (t) { return { t: t, u: tipUrl(t, S.tips[t.id]) }; }).filter(function (x) { return x.u; }); }
  function tipPage() {
    var links = tipLinks(), name = esc(S.name || 'My Studio');
    return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Tip ' + name + '</title>' +
      '<style>body{margin:0;font-family:system-ui,sans-serif;background:#15121F;color:#fff;display:grid;place-items:center;min-height:100vh}main{max-width:420px;padding:32px 20px;text-align:center}h1{margin:0 0 8px}p{color:#cfc6de}a{display:block;margin:12px 0;padding:14px;border-radius:12px;background:' + esc(S.accent || '#FF2E93') + ';color:#15121F;font-weight:800;text-decoration:none;border:3px solid #000}small{display:block;margin-top:24px;color:#8d86a0}</style></head>' +
      '<body><main><h1>Tip ' + name + '</h1><p>Thanks for supporting my work. Pick any way below.</p>' +
      links.map(function (x) { return '<a href="' + esc(x.u) + '" rel="noopener">' + esc(x.t.n) + '</a>'; }).join('') +
      '<small>Tips go straight to my own accounts.</small></main></body></html>';
  }
  function pTips(bay) {
    bay.innerHTML = head('Tip jar', 'Give fans more ways to tip you. Every tip goes straight to your own accounts.', sampleTag()) +
      '<div class="pcs-grid"><div class="pcs-card w6"><p class="pcs-led pink">Your tip accounts</p>' +
        TIPS.map(function (t) { return '<div class="f"><label for="pcs-tip-' + t.id + '">' + t.n + '</label><input type="' + (t.id === 'stripe' ? 'url' : 'text') + '" id="pcs-tip-' + t.id + '" data-tip="' + t.id + '" value="' + esc(S.tips[t.id] || '') + '" placeholder="' + esc(t.ph) + '" maxlength="120"></div>'; }).join('') +
      '</div><div class="pcs-card w6"><p class="pcs-led">Preview</p><div class="pcs-tipbtns" id="pcs-tip-prev"></div>' +
        '<div class="pcs-btns"><button class="pcs-b hot" type="button" id="pcs-tip-dl">Download my tip page</button><button class="pcs-b" type="button" id="pcs-tip-bio">Copy link-in-bio text</button><button class="pcs-b ghost" type="button" id="pcs-tip-code">Copy button code</button></div>' +
        '<p class="pcs-note"><b style="color:#fff">Madwackd takes 0% of your tips.</b> Fans pay you directly through the app they pick, so the money never passes through us. Each payment app\'s own fees and terms still apply. Tips you receive may be taxable income.</p>' +
        '<p class="pcs-note">The tip page is a single file you can host anywhere, such as your own site. <span class="pcs-soon">Coming soon</span> A hosted tip page at a Madwackd link.</p></div></div>';
    function paint() {
      var l = tipLinks();
      $('#pcs-tip-prev').innerHTML = l.length ? l.map(function (x) {
        return mode === 'demo' ? '<span class="pcs-tipbtn" title="Sample handle, not linked">Tip on ' + esc(x.t.n) + '</span>' : '<a class="pcs-tipbtn" href="' + esc(x.u) + '" target="_blank" rel="noopener">Tip on ' + esc(x.t.n) + '</a>';
      }).join('') : '<p class="pcs-note">Add at least one account to see your buttons.</p>';
      $$('[data-tip]', bay).forEach(function (i) {
        var t = TIPS.filter(function (x) { return x.id === i.getAttribute('data-tip'); })[0];
        i.setAttribute('aria-invalid', i.value.trim() && !tipUrl(t, i.value) ? 'true' : 'false');
        i.style.borderColor = i.value.trim() && !tipUrl(t, i.value) ? '#FF4D4D' : '';
      });
    }
    bay.addEventListener('input', function (e) { var id = e.target.getAttribute('data-tip'); if (!id) return; S.tips[id] = e.target.value.trim(); changed(); paint(); });
    $('#pcs-tip-dl').addEventListener('click', function () { if (!tipLinks().length) { toast('Add a tip account first'); return; } download('tip-page.html', tipPage(), 'text/html'); });
    $('#pcs-tip-bio').addEventListener('click', function () { var l = tipLinks(); if (!l.length) { toast('Add a tip account first'); return; } copy('Tip me: ' + l.map(function (x) { return x.t.n + ' ' + x.u; }).join(' | '), 'Bio text'); });
    $('#pcs-tip-code').addEventListener('click', function () {
      var l = tipLinks(); if (!l.length) { toast('Add a tip account first'); return; }
      copy(l.map(function (x) { return '<a href="' + esc(x.u) + '" rel="noopener">Tip on ' + esc(x.t.n) + '</a>'; }).join('\n'), 'Button code');
    });
    paint();
  }

  /* ---------- Marketing bay ---------- */
  function prText(p) {
    var date = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    return 'FOR IMMEDIATE RELEASE\n\n' + (p.head || '[Headline]') + '\n\n' + (p.city || '[City, State]') + ', ' + date + ' - ' + (p.what || '[What happened, who did it, and why it matters.]') +
      '\n\n"' + (p.quote || '[A quote that sounds like a person, not a press release.]') + '" said ' + (p.who || '[Name, title]') + '.' +
      '\n\nAbout ' + (S.name || '[Your company]') + '\n' + (p.about || '[One or two sentences about you.]') + '\n\nMedia contact\n[Name, email, phone]\n\n###';
  }
  function bios(b) {
    var n = b.name || 'Your name', m = b.make || 'videos', w = b.who || 'people like you', pr = b.proof ? ' ' + b.proof + '.' : '', c = b.cta || 'Say hi';
    return ['Short: ' + n + ' makes ' + m + ' for ' + w + '.',
      'Medium: ' + n + ' makes ' + m + ' for ' + w + '.' + pr + ' ' + c + ' ↓',
      'Link-in-bio: ' + m.charAt(0).toUpperCase() + m.slice(1) + ' for ' + w + ' | ' + (b.proof || 'New drops weekly') + ' | ' + c + ' ↓'].join('\n\n');
  }
  function pMarket(bay) {
    var pr = S.pr, bi = S.bio;
    function fi(group, k, lab, ph, ta) {
      var v = esc((group === 'pr' ? pr : bi)[k] || '');
      return '<div class="f"><label for="pcs-' + group + '-' + k + '">' + lab + '</label>' + (ta ? '<textarea id="pcs-' + group + '-' + k + '" data-' + group + '="' + k + '" maxlength="600" placeholder="' + esc(ph) + '">' + v + '</textarea>' : '<input type="text" id="pcs-' + group + '-' + k + '" data-' + group + '="' + k + '" maxlength="160" placeholder="' + esc(ph) + '" value="' + v + '">') + '</div>';
    }
    bay.innerHTML = head('Marketing bay', 'Free generators, plus one-click launches to the services that get you seen.', sampleTag()) +
      '<div class="pcs-grid"><div class="pcs-card w6"><p class="pcs-led amber">Press release starter <span class="pcs-sample">Free</span></p>' +
        fi('pr', 'head', 'Headline', 'Denver filmmaker releases...') + '<div class="row"><div>' + fi('pr', 'city', 'City, State', 'Denver, CO') + '</div><div>' + fi('pr', 'who', 'Quote from', 'Name, title') + '</div></div>' +
        fi('pr', 'what', 'What happened', 'Who did what, and why it matters', true) + fi('pr', 'quote', 'Quote', 'Sounds like a person') + fi('pr', 'about', 'About you', 'One or two sentences') +
        '<div class="pcs-out" id="pcs-pr-out"></div><div class="pcs-btns"><button class="pcs-b hot" type="button" id="pcs-pr-copy">Copy release</button>' +
        '<a class="pcs-b" href="https://pressreleaseforbusiness.com/" target="_blank" rel="noopener">Publish it</a><a class="pcs-b ghost" href="https://distributepressreleases.com/" target="_blank" rel="noopener">Distribute it</a></div>' +
        '<p class="pcs-note">Publishing and distribution are paid services from sister sites in our network.</p></div>' +
      '<div class="pcs-card w6"><p class="pcs-led pink">Bio writer <span class="pcs-sample">Free</span></p>' +
        fi('bio', 'name', 'Name or brand', 'Neon Alley Pictures') + fi('bio', 'make', 'What you make', 'short comedy films') + fi('bio', 'who', 'Who it is for', 'brands that want to be remembered') +
        '<div class="row"><div>' + fi('bio', 'proof', 'Proof (true facts only)', '2M views') + '</div><div>' + fi('bio', 'cta', 'Call to action', 'Book a spot') + '</div></div>' +
        '<div class="pcs-out" id="pcs-bio-out"></div><div class="pcs-btns"><button class="pcs-b hot" type="button" id="pcs-bio-copy">Copy bios</button></div>' +
        '<p class="pcs-note">Both generators fill in proven templates on your device. No AI and no upload.</p></div>' +
      '<div class="pcs-card w12"><p class="pcs-led cyan">More free tools</p><div class="pcs-btns">' +
        FREE_TOOLS.map(function (t) { return '<a class="pcs-b sm" href="/creator-studio/#' + t[1] + '">' + t[0] + '</a>'; }).join('') + '</div></div>' +
      '<div class="pcs-card w12"><p class="pcs-led">Launch pad: paid marketing services</p><div class="pcs-launch">' + launchGrid() + '</div>' +
        '<p class="pcs-note">These are separate businesses in the Madwackd and Search Converts family, each with its own prices and terms. Buttons open their sites.</p></div></div>';
    function paint() { $('#pcs-pr-out').textContent = prText(S.pr); $('#pcs-bio-out').textContent = bios(S.bio); }
    bay.addEventListener('input', function (e) {
      var k = e.target.getAttribute('data-pr'); if (k) { S.pr[k] = e.target.value; changed(); paint(); return; }
      k = e.target.getAttribute('data-bio'); if (k) { S.bio[k] = e.target.value; changed(); paint(); }
    });
    $('#pcs-pr-copy').addEventListener('click', function () { copy(prText(S.pr), 'Press release'); });
    $('#pcs-bio-copy').addEventListener('click', function () { copy(bios(S.bio), 'Bios'); });
    paint();
  }
  function launchGrid() {
    return SERVICES.map(function (s) {
      var ext = /^https?:/.test(s.u);
      return '<a class="pcs-lb" style="--c:' + s.c + '" href="' + esc(s.u) + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + '><b>' + esc(s.n) + (s.soon ? ' <span class="pcs-soon">Site soon</span>' : '') + '</b><span>' + esc(s.d) + '</span><em>' + esc(s.dom) + '</em></a>';
    }).join('');
  }

  /* ---------- Experts & upgrades ---------- */
  function pExpert(bay) {
    bay.innerHTML = head('Experts & upgrades', 'Real people when you need them, and more power when you are ready.', '') +
      '<div class="pcs-grid"><div class="pcs-card w6"><p class="pcs-led pink">Expert access</p>' +
        '<div class="pcs-launch" style="grid-template-columns:1fr">' +
        '<a class="pcs-lb" style="--c:#FF2E93" href="/producers/"><b>Hire a Madwackd producer</b><span>Junior, Senior or Executive packages, from one social ad to a full trailer.</span></a>' +
        '<a class="pcs-lb" style="--c:#7ED321" href="tel:+18004818638"><b>Call a producer: 1-800-481-8638</b><span>Talk it through before you spend a credit.</span></a>' +
        '<a class="pcs-lb" style="--c:#00B8F0" href="/pricing/"><b>Masterclass and mentorship</b><span>Learn the full production method, with reviews of your own projects.</span></a>' +
        '<a class="pcs-lb" style="--c:#FFD60A" href="/producers-corner/"><b>Producer\'s Corner</b><span>Free how-to guides from our producers.</span></a></div></div>' +
      '<div class="pcs-card w6"><p class="pcs-led amber">Upgrades</p>' +
        '<div class="pcs-launch" style="grid-template-columns:1fr">' +
        '<a class="pcs-lb" style="--c:#FF8A00" href="/studio/?buy=starter"><b>Starter, $29/mo</b><span>250 credits a month. Pro Creator Studio included.</span></a>' +
        '<a class="pcs-lb" style="--c:#FF2E93" href="/studio/?buy=pro"><b>Pro, $89/mo</b><span>900 credits a month, video editor and voice mixing. Pro Creator Studio included.</span></a>' +
        '<a class="pcs-lb" style="--c:#8B3DFF" href="/studio/?buy=studio"><b>Studio, $299/mo</b><span>2,880 credits a month and the full studio board. Pro Creator Studio included.</span></a>' +
        '<a class="pcs-lb" style="--c:#7ED321" href="/pricing/#packs"><b>Credit packs</b><span>Top up any time. No plan needed.</span></a></div>' +
        '<p class="pcs-note">Prices from our <a href="/pricing/">pricing page</a>. Plans renew monthly until you cancel.</p></div>' +
      '<div class="pcs-card w12"><p class="pcs-led">Paid marketing services</p><div class="pcs-launch">' + launchGrid() + '</div></div></div>';
  }

  /* ---------- Customize ---------- */
  var SWATCHES = ['#FF2E93', '#FF8A00', '#FFD60A', '#7ED321', '#00B8F0', '#8B3DFF'];
  function pCustom(bay) {
    bay.innerHTML = head('Customize', 'Make it yours: name, color, and which rooms show up.', '') +
      '<div class="pcs-grid"><div class="pcs-card w6"><p class="pcs-led pink">Studio look</p>' +
        '<div class="f"><label for="pcs-c-name">Studio name</label><input type="text" id="pcs-c-name" maxlength="40" value="' + esc(S.name) + '"></div>' +
        '<label>Accent color</label><div class="pcs-btns" id="pcs-c-sw">' + SWATCHES.map(function (c) { return '<button type="button" class="pcs-b sm" data-acc="' + c + '" aria-label="Accent ' + c + '" aria-pressed="' + (S.accent === c) + '" style="background:' + c + ';width:40px"></button>'; }).join('') + '</div>' +
        '<div class="pcs-knobs" style="margin-top:12px"><div class="pcs-knob-w"><div class="pcs-knob" id="pcs-k-hue"></div><span class="pcs-knob-v"></span><span class="pcs-knob-l">Fine tune hue</span></div></div></div>' +
      '<div class="pcs-card w6"><p class="pcs-led cyan">Rooms</p><ul class="pcs-list pcs-order" id="pcs-c-rooms" style="max-height:none"></ul></div>' +
      '<div class="pcs-card w12"><p class="pcs-led amber">Your data</p><div class="pcs-btns"><button class="pcs-b" type="button" id="pcs-c-exp">Download a backup</button><label class="pcs-b ghost" style="margin:0;color:#fff;font-size:.84rem">Restore a backup<input type="file" id="pcs-c-imp" accept=".json,application/json" hidden></label><button class="pcs-b ghost" type="button" id="pcs-c-reset">Reset studio</button></div>' +
        '<p class="pcs-note">' + (mode === 'live' ? 'Your studio is saved in this browser on this device. Download a backup to move it to another device.' : 'In the demo nothing is saved. With a paid plan your studio is saved in this browser.') + ' <span class="pcs-soon">Coming soon</span> Sync across your devices.</p></div></div>';
    function rooms() {
      $('#pcs-c-rooms').innerHTML = S.order.map(function (id, i) {
        var p = PANELS.filter(function (x) { return x.id === id; })[0]; if (!p) return '';
        var shown = S.hidden.indexOf(id) < 0;
        return '<li>' + (id === 'custom' ? '<span style="width:46px"></span>' : '<label class="pcs-sw"><input type="checkbox" data-show="' + id + '"' + (shown ? ' checked' : '') + ' aria-label="Show ' + esc(p.name) + '"><span></span></label>') +
          '<span class="grow">' + esc(p.name) + '</span><button type="button" class="pcs-x" data-up="' + i + '" aria-label="Move ' + esc(p.name) + ' up"' + (i === 0 ? ' disabled' : '') + '>&uarr;</button><button type="button" class="pcs-x" data-down="' + i + '" aria-label="Move ' + esc(p.name) + ' down"' + (i === S.order.length - 1 ? ' disabled' : '') + '>&darr;</button></li>';
      }).join('');
    }
    function hexFromHue(h) {
      var s = .95, l = .58, a = s * Math.min(l, 1 - l);
      function f(n) { var k = (n + h / 30) % 12, c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); return Math.round(c * 255).toString(16).padStart(2, '0'); }
      return '#' + f(0) + f(8) + f(4);
    }
    $('#pcs-c-name').addEventListener('input', function () { S.name = this.value.slice(0, 40); changed(); paintTop(); });
    $('#pcs-c-sw').addEventListener('click', function (e) {
      var b = e.target.closest('[data-acc]'); if (!b) return; S.accent = b.getAttribute('data-acc'); changed(); paintTop();
      $$('[data-acc]', bay).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
    });
    knob($('#pcs-k-hue'), { min: 0, max: 355, step: 5, value: 330, label: 'Accent hue', fmt: function (v) { return v + '°'; }, onChange: function (v) { S.accent = hexFromHue(v); changed(); paintTop(); } });
    $('#pcs-c-rooms').addEventListener('change', function (e) {
      var id = e.target.getAttribute('data-show'); if (!id) return;
      S.hidden = S.hidden.filter(function (x) { return x !== id; }); if (!e.target.checked) S.hidden.push(id);
      changed(); paintStrip();
    });
    $('#pcs-c-rooms').addEventListener('click', function (e) {
      var u = e.target.closest('[data-up]'), d = e.target.closest('[data-down]'), i, j;
      if (u) { i = Number(u.getAttribute('data-up')); j = i - 1; } else if (d) { i = Number(d.getAttribute('data-down')); j = i + 1; } else return;
      if (j < 0 || j >= S.order.length) return;
      var t = S.order[i]; S.order[i] = S.order[j]; S.order[j] = t; changed(); paintStrip(); rooms();
      var nb = $('#pcs-c-rooms').querySelector('[data-' + (u ? 'up' : 'down') + '="' + j + '"]'); if (nb && !nb.disabled) nb.focus();
    });
    $('#pcs-c-exp').addEventListener('click', function () { download('pro-creator-studio-backup.json', JSON.stringify(S, null, 2), 'application/json'); });
    $('#pcs-c-imp').addEventListener('change', function () {
      var f = this.files && this.files[0]; if (!f) return;
      var r = new FileReader();
      r.onload = function () {
        try {
          var s = JSON.parse(r.result); if (!s || s.v !== 1 || !Array.isArray(s.entries)) throw 0;
          var b = blank(); Object.keys(b).forEach(function (k) { if (s[k] === undefined || typeof s[k] !== typeof b[k]) s[k] = b[k]; });
          S = s; changed(); paintTop(); paintStrip(); pCustom(bay); toast('Backup restored');
        } catch (e) { toast('That file is not a studio backup'); }
      };
      r.readAsText(f); this.value = '';
    });
    $('#pcs-c-reset').addEventListener('click', function () {
      if (!window.confirm(mode === 'live' ? 'Reset your studio? This clears everything saved in this browser.' : 'Reset the demo to its sample numbers?')) return;
      S = mode === 'live' ? blank() : sample(); changed(); paintTop(); paintStrip(); pCustom(bay); toast('Studio reset');
    });
    rooms();
  }

  /* ---------- boot ---------- */
  function renderAll() { paintTop(); paintStrip(); renderPanel(); }
  shell();
  if (variant === 'full' && window.MWAuth && window.MWAuth.ready) {
    tier = 'checking'; renderAll();
    var apply = function (api) {
      var st = api.state || {};
      tier = st.user ? (st.tier || 'free') : 'anon';
      if (st.user && PAID[tier]) {
        mode = 'live'; userKey = KEY + ':' + String(st.email || 'me').toLowerCase(); S = load();
      } else if (mode === 'live') { mode = 'demo'; S = sample(); }
      renderAll();
    };
    window.MWAuth.ready.then(apply);
    if (window.MWAuth.onChange) window.MWAuth.onChange(apply);
  } else {
    renderAll();
  }
})();
