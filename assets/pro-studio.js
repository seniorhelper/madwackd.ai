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
    { id: 'web', name: 'Websites & SEO' },
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
      socials: {}, caption: '', tags: '', link: '', contacts: [], subject: '', body: '', tips: {}, pr: {}, bio: {}, site: { tpl: 'creator', color: '#FF2E93', theme: 'dark' },
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
    s.site = { tpl: 'creator', color: '#FF2E93', theme: 'dark', name: 'Neon Alley Pictures', tag: 'Short comedy films and brand videos people remember', about: 'Neon Alley Pictures is a Denver film crew making short comedy films, music videos and 30-second brand spots. We write, shoot and edit in house, and every project gets a cut ready for YouTube, TikTok and Instagram.', city: 'Denver, CO', phone: '', email: 'hello@example.com', url: 'https://example.com/', cta: 'Book a spot', ctaUrl: 'mailto:hello@example.com', items: 'Short films | Comedy shorts from 3 to 12 minutes, festival ready.\nMusic videos | Concept, shoot and edit for independent artists.\nBrand spots | 15 and 30-second ads cut for every social feed.', faq: 'How long does a brand spot take? | Most 30-second spots take two to three weeks from script to final cut.\nDo you travel? | Yes. We are based in Denver and shoot across Colorado.' };
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
    PANELS.forEach(function (p) { if (s.order.indexOf(p.id) < 0) { var ci = s.order.indexOf('custom'); if (ci < 0) s.order.push(p.id); else s.order.splice(ci, 0, p.id); } });
    if (!s.site || typeof s.site !== 'object') s.site = b.site;
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
    ({ earn: pEarn, pitch: pPitch, publish: pPublish, mail: pMail, tips: pTips, web: pWeb, market: pMarket, expert: pExpert, custom: pCustom }[active] || pEarn)(bay);
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
      '<div class="pcs-card w5"><p class="pcs-led">Mass publish kit</p><div class="pcs-kit" id="pcs-kit"></div>' +
        '<div class="pcs-btns"><button class="pcs-b hot" type="button" id="pcs-copyall">Copy caption</button></div>' +
        '<p class="pcs-note">Today the kit copies your caption and opens each upload page, so a full rollout takes a few clicks. <span class="pcs-soon">Coming soon</span> Posting straight to your accounts from here.</p></div>' +
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

  /* ---------- Websites & SEO ----------
     Landing-page generator, SEO gauge and crawl reader all run in this browser. Nothing is uploaded.
     Prices for buyweburl.com were read from its product pages on 2026-11-08. */
  var SITE_TPL = {
    creator: { n: 'Creator or artist portfolio', type: 'Person', h2: 'What I make', faqH: 'Questions people ask', ctaD: 'Work with me' },
    local: { n: 'Local service business', type: 'LocalBusiness', h2: 'Services', faqH: 'Common questions', ctaD: 'Get a free quote' },
    launch: { n: 'Product or brand launch', type: 'Organization', h2: 'What you get', faqH: 'Questions', ctaD: 'Get early access' }
  };
  var TIEINS = [
    { n: 'SEO gauge', st: 'go', now: 'Works today, right here: scores a page\'s on-page basics in your browser.', u: '#pcs-w-gauge', c: '#7ED321', dom: 'Built in' },
    { n: 'Conversion analysis', st: 'go', now: 'Quick checks in the gauge, then the free Conversion Audit and Conversion Gauge at Search Converts.', u: 'https://searchconverts.com/cro-audit/', c: '#FFD60A', dom: 'searchconverts.com' },
    { n: 'Launch a sales funnel', st: 'go', now: 'Opens Eye To Ad\'s lead generation team to plan and build the funnel. In-dash funnel builder: coming soon.', u: 'https://eyetoad.com/lead-generation-agency/', c: '#FF8A00', dom: 'eyetoad.com' },
    { n: 'AI Speed to Leads', st: 'go', now: 'Every new lead gets an email and an AI voice call in about 60 seconds. Hear the live demo call you.', u: 'https://aispeedtoleads.com/demo/', c: '#7ED321', dom: 'aispeedtoleads.com' },
    { n: 'Vettley', st: 'go', now: 'Free 0 to 100 trust score from public signals your site and listing show. Add your business free.', u: 'https://www.vettley.com/add-your-business/', c: '#00B8F0', dom: 'vettley.com' },
    { n: 'USA Business Search', st: 'go', now: 'Free business directory listing in about 2 minutes. Verified and Featured upgrades are optional.', u: 'https://usabusinesssearch.com/add-your-business/', c: '#8B3DFF', dom: 'usabusinesssearch.com' },
    { n: 'ProveHound', st: 'go', now: 'For licensed trade pros: claim your free listing, ranked by checked license records. No lead fees.', u: 'https://www.provehound.com/claim/', c: '#FF2E93', dom: 'provehound.com' },
    { n: 'allofus.one creator tools', st: 'go', now: 'Nine free creator tools: hooks, captions, teleprompter, safe zones and more.', u: 'https://allofus.one/creators/tools/', c: '#FFD60A', dom: 'allofus.one' }
  ];
  var ACCOUNTS = [
    { n: 'Google Search Console', st: 'soon', d: 'Clicks, impressions and positions for your own site, read-only. Google\'s API is free, but our app needs Google\'s OAuth review for read-only Search Console access first.', now: 'Open your Search Console', u: 'https://search.google.com/search-console' },
    { n: 'Ahrefs', st: 'soon', d: 'Backlinks and keyword data with your own Ahrefs API key. Ahrefs API access needs a paid Ahrefs plan (Lite and up, from $129/mo at ahrefs.com/pricing), billed by Ahrefs, not us.', now: 'About the Ahrefs API', u: 'https://docs.ahrefs.com/' },
    { n: 'Screaming Frog', st: 'go', d: 'Desktop crawler with no cloud API, so there is nothing to sign in to. Export the Internal: HTML tab as CSV and drop it in the crawl reader above. The free version crawls up to 500 URLs.', now: 'Get the SEO Spider', u: 'https://www.screamingfrog.co.uk/seo-spider/' },
    { n: 'SEO Time Machine', st: 'go', d: 'Eye To Ad\'s free planner: enter where you rank now, where you want to be and your budget, and it estimates an arrival window. An estimate, not a promise.', now: 'Start the machine', u: 'https://eyetoad.com/seo-time-machine/' }
  ];
  function safeUrl(u) { u = String(u || '').trim(); return /^https?:\/\/[^\s"'<>]+$/i.test(u) ? u : ''; }
  function safeCta(u) { u = String(u || '').trim(); if (/^mailto:[^\s"'<>]+$/i.test(u) || /^tel:\+?[\d-]+$/i.test(u)) return u; return safeUrl(u); }
  function telOf(p) { var d = String(p || '').replace(/[^\d+]/g, ''); return d.replace(/\D/g, '').length >= 7 ? d : ''; }
  function hexOk(c) { return /^#[0-9a-f]{6}$/i.test(String(c || '')) ? c : '#FF2E93'; }
  function inkOn(hex) {
    var n = parseInt(hex.slice(1), 16), ch = [n >> 16 & 255, n >> 8 & 255, n & 255].map(function (v) { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); });
    var L = .2126 * ch[0] + .7152 * ch[1] + .0722 * ch[2];
    return (L + .05) / .05 >= 1.05 / (L + .05) ? '#111111' : '#ffffff';
  }
  function pairs(text) {
    return String(text || '').split('\n').map(function (l) { var i = l.indexOf('|'); return i < 0 ? [l.trim(), ''] : [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }).filter(function (x) { return x[0]; }).slice(0, 12);
  }
  function sitePage(st) {
    var t = SITE_TPL[st.tpl] || SITE_TPL.creator, name = String(st.name || 'Your name').slice(0, 80), tag = String(st.tag || '').slice(0, 140);
    var about = String(st.about || '').slice(0, 1200), url = safeUrl(st.url), cta = String(st.cta || t.ctaD).slice(0, 40), ctaU = safeCta(st.ctaUrl);
    var tel = telOf(st.phone), email = isEmail(st.email) ? String(st.email).trim() : '', city = String(st.city || '').slice(0, 80);
    var acc = hexOk(st.color), ink = inkOn(acc), dark = st.theme !== 'light';
    var bg = dark ? '#0f0d14' : '#ffffff', fg = dark ? '#f4f1fa' : '#15121f', soft = dark ? '#1b1724' : '#f5f3f8', line = dark ? '#2e2840' : '#e3dfea', dim = dark ? '#c9c2d8' : '#4a4458';
    if (!ctaU) ctaU = email ? 'mailto:' + email : (tel ? 'tel:' + tel : '#contact');
    var title = (tag ? name + ' | ' + tag : name).slice(0, 65);
    var desc = (about || tag || name).replace(/\s+/g, ' ').slice(0, 158);
    var items = pairs(st.items), faq = pairs(st.faq).filter(function (x) { return x[1]; });
    var ent = { '@type': t.type, '@id': (url || '') + '#main-entity', name: name, description: desc };
    if (url) ent.url = url; if (tel) ent.telephone = tel; if (email) ent.email = email;
    if (city) { if (t.type === 'LocalBusiness') { ent.areaServed = city; ent.address = { '@type': 'PostalAddress', addressLocality: city.split(',')[0].trim(), addressRegion: (city.split(',')[1] || '').trim() || undefined }; } }
    if (t.type !== 'Person' && items.length) ent.makesOffer = items.map(function (x) { return { '@type': 'Offer', itemOffered: { '@type': 'Service', name: x[0], description: x[1] || undefined } }; });
    if (t.type === 'Person' && items.length) ent.knowsAbout = items.map(function (x) { return x[0]; });
    var graph = [{ '@type': 'WebPage', '@id': (url || '') + '#webpage', name: title, description: desc, url: url || undefined, about: { '@id': ent['@id'] } }, ent];
    if (faq.length) graph.push({ '@type': 'FAQPage', mainEntity: faq.map(function (x) { return { '@type': 'Question', name: x[0], acceptedAnswer: { '@type': 'Answer', text: x[1] } }; }) });
    var ld = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');
    var css = ':root{--a:' + acc + ';--ink:' + ink + ';--bg:' + bg + ';--fg:' + fg + ';--soft:' + soft + ';--line:' + line + ';--dim:' + dim + '}' +
      '*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}body{margin:0;background:var(--bg);color:var(--fg);font:17px/1.6 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif}' +
      'a{color:inherit}.w{max-width:960px;margin:0 auto;padding:0 20px}.skip{position:absolute;left:-999px}.skip:focus{left:12px;top:12px;background:var(--a);color:var(--ink);padding:8px 12px;z-index:9}' +
      'header{border-bottom:1px solid var(--line)}header .w{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:64px;flex-wrap:wrap}.brand{font-weight:800;font-size:1.1rem;text-decoration:none}' +
      '.btn{display:inline-block;background:var(--a);color:var(--ink);font-weight:700;text-decoration:none;padding:12px 20px;border-radius:10px;min-height:44px}.btn.o{background:transparent;color:var(--fg);border:2px solid var(--a)}' +
      '.hero{padding:64px 0 48px}h1{font-size:clamp(2rem,5vw,3.2rem);line-height:1.1;margin:0 0 16px}.lede{font-size:1.15rem;color:var(--dim);max-width:62ch;margin:0 0 24px}.row{display:flex;gap:12px;flex-wrap:wrap}' +
      'section{padding:40px 0;border-top:1px solid var(--line)}h2{font-size:1.6rem;margin:0 0 20px}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;list-style:none;margin:0;padding:0}' +
      '.cards li{background:var(--soft);border:1px solid var(--line);border-top:4px solid var(--a);border-radius:12px;padding:18px}.cards h3{margin:0 0 6px;font-size:1.1rem}.cards p{margin:0;color:var(--dim)}' +
      'details{border:1px solid var(--line);border-radius:10px;padding:12px 16px;margin:0 0 10px;background:var(--soft)}summary{font-weight:700;cursor:pointer}details p{margin:8px 0 0;color:var(--dim)}' +
      'address{font-style:normal}footer{padding:24px 0;color:var(--dim);font-size:.9rem;border-top:1px solid var(--line)}' +
      'a:focus-visible,summary:focus-visible{outline:3px solid var(--a);outline-offset:3px}@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}';
    var contact = [];
    if (tel) contact.push('<a class="btn" href="tel:' + esc(tel) + '">Call ' + esc(st.phone) + '</a>');
    if (email) contact.push('<a class="btn o" href="mailto:' + esc(email) + '">Email ' + esc(email) + '</a>');
    return '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
      '<title>' + esc(title) + '</title>\n<meta name="description" content="' + esc(desc) + '">\n' +
      (url ? '<link rel="canonical" href="' + esc(url) + '">\n<meta property="og:url" content="' + esc(url) + '">\n' : '') +
      '<meta name="twitter:card" content="summary">\n<meta property="og:type" content="website">\n<meta property="og:title" content="' + esc(title) + '">\n<meta property="og:description" content="' + esc(desc) + '">\n' +
      '<meta name="theme-color" content="' + acc + '">\n<style>' + css + '</style>\n<script type="application/ld+json">' + ld + '</script>\n</head>\n<body>\n' +
      '<a class="skip" href="#main">Skip to content</a>\n<header><div class="w"><a class="brand" href="#main">' + esc(name) + '</a><a class="btn" href="' + esc(ctaU) + '">' + esc(cta) + '</a></div></header>\n' +
      '<main id="main">\n<div class="hero"><div class="w"><h1>' + esc(tag || name) + '</h1>' + (about ? '<p class="lede">' + esc(about) + '</p>' : '') +
      '<div class="row"><a class="btn" href="' + esc(ctaU) + '">' + esc(cta) + '</a>' + (items.length ? '<a class="btn o" href="#offer">' + esc(t.h2) + '</a>' : '') + '</div></div></div>\n' +
      (items.length ? '<section id="offer" aria-labelledby="offer-h"><div class="w"><h2 id="offer-h">' + esc(t.h2) + '</h2><ul class="cards">' + items.map(function (x) { return '<li><h3>' + esc(x[0]) + '</h3>' + (x[1] ? '<p>' + esc(x[1]) + '</p>' : '') + '</li>'; }).join('') + '</ul></div></section>\n' : '') +
      (faq.length ? '<section aria-labelledby="faq-h"><div class="w"><h2 id="faq-h">' + esc(t.faqH) + '</h2>' + faq.map(function (x) { return '<details><summary>' + esc(x[0]) + '</summary><p>' + esc(x[1]) + '</p></details>'; }).join('') + '</div></section>\n' : '') +
      '<section id="contact" aria-labelledby="contact-h"><div class="w"><h2 id="contact-h">Contact ' + esc(name) + '</h2><address>' + (city ? '<p>' + esc(city) + '</p>' : '') +
      '<div class="row">' + (contact.join('') || '<a class="btn" href="' + esc(ctaU) + '">' + esc(cta) + '</a>') + '</div></address></div></section>\n</main>\n' +
      '<footer><div class="w">&copy; ' + new Date().getFullYear() + ' ' + esc(name) + '</div></footer>\n</body>\n</html>\n';
  }

  /* SEO gauge: parses HTML with DOMParser (scripts never run, nothing is fetched) and checks on-page basics. */
  function gaugeHtml(html) {
    var d = new DOMParser().parseFromString(String(html || ''), 'text/html');
    function q(s) { return d.querySelector(s); }
    function qa(s) { return Array.prototype.slice.call(d.querySelectorAll(s)); }
    var title = (q('title') && q('title').textContent.trim()) || '', md = q('meta[name="description" i]'), mdv = md ? (md.getAttribute('content') || '').trim() : '';
    var h1 = qa('h1').length, imgs = qa('img'), noalt = imgs.filter(function (i) { return !i.hasAttribute('alt'); }).length;
    var lds = qa('script[type="application/ld+json"]'), ldOk = lds.length > 0 && lds.every(function (s) { try { JSON.parse(s.textContent); return true; } catch (e) { return false; } });
    var body = d.body ? d.body.cloneNode(true) : null; if (body) Array.prototype.slice.call(body.querySelectorAll('script,style,noscript')).forEach(function (n) { n.remove(); });
    var words = body ? (body.textContent.match(/[A-Za-z0-9À-ɏ']+/g) || []).length : 0;
    var links = qa('a[href]'), tel = links.some(function (a) { return /^tel:/i.test(a.getAttribute('href')); });
    var mail = links.some(function (a) { return /^mailto:/i.test(a.getAttribute('href')); }), form = qa('form').length > 0;
    var seo = [
      [10, title.length >= 15 && title.length <= 65, 'Title tag 15 to 65 characters', title ? 'Yours is ' + title.length + ' characters.' : 'No title tag found.'],
      [10, mdv.length >= 50 && mdv.length <= 160, 'Meta description 50 to 160 characters', mdv ? 'Yours is ' + mdv.length + ' characters.' : 'No meta description found.'],
      [10, h1 === 1, 'Exactly one H1 heading', 'Found ' + h1 + '.'],
      [5, qa('h2').length > 0, 'H2 headings break up the page', 'Found ' + qa('h2').length + '.'],
      [10, !!q('meta[name="viewport" i]'), 'Mobile viewport tag', 'Needed for phones.'],
      [5, !!(q('html') && q('html').getAttribute('lang')), 'Page language set (html lang)', 'Helps screen readers and search engines.'],
      [5, !!q('link[rel="canonical" i]'), 'Canonical URL', 'Tells search engines the main address of the page.'],
      [10, ldOk, 'Schema (JSON-LD) present and valid', lds.length ? (ldOk ? lds.length + ' block(s) parse cleanly.' : 'A JSON-LD block does not parse.') : 'No JSON-LD found.'],
      [5, noalt === 0, 'Every image has alt text', imgs.length ? noalt + ' of ' + imgs.length + ' images missing alt.' : 'No images on the page.'],
      [5, !!q('meta[property="og:title" i]'), 'Social share tags (og:title)', 'Controls how the link looks when shared.'],
      [5, words >= 200, 'At least 200 words of visible text', 'Found about ' + words + '. Thin pages give search engines and AI tools little to quote.']
    ];
    var conv = [
      [7, tel, 'Tap-to-call phone link', 'A tel: link lets phone visitors call in one tap.'],
      [7, mail || form, 'A way to reach you (form or email link)', form ? 'Form found.' : (mail ? 'Email link found.' : 'No form or email link found.')],
      [6, links.length >= 2 && !!q('a.btn, button, a[class*="btn" i], a[class*="button" i]'), 'A clear call-to-action button', 'Visitors need one obvious next step.']
    ];
    var all = seo.concat(conv), tot = 0, got = 0;
    all.forEach(function (c) { tot += c[0]; if (c[1]) got += c[0]; });
    return { score: Math.round(got / tot * 100), seo: seo, conv: conv };
  }
  function seoGaugeSvg(score) {
    var a = Math.PI - Math.PI * Math.max(0, Math.min(100, score)) / 100, x = (110 + Math.cos(a) * 74).toFixed(1), y = (112 - Math.sin(a) * 74).toFixed(1);
    return '<svg class="pcs-gauge" viewBox="0 0 220 132" role="img" aria-label="SEO gauge: ' + score + ' out of 100">' +
      '<defs><linearGradient id="pcs-sg" x1="0" x2="1"><stop offset="0" stop-color="#FF4D4D"/><stop offset=".55" stop-color="#FFC23D"/><stop offset="1" stop-color="#39FF88"/></linearGradient></defs>' +
      '<path d="M6 116 A104 104 0 0 1 214 116 Z" fill="#14101c" stroke="#000" stroke-width="3"/><path d="M24 112 A86 86 0 0 1 196 112" fill="none" stroke="url(#pcs-sg)" stroke-width="9" stroke-linecap="round"/>' +
      '<line x1="110" y1="112" x2="' + x + '" y2="' + y + '" stroke="#fff" stroke-width="3" stroke-linecap="round"/><circle cx="110" cy="112" r="9" fill="var(--acc)" stroke="#000" stroke-width="2"/>' +
      '<text x="110" y="96" text-anchor="middle" fill="#fff" font-size="26" font-weight="800" font-family="Poppins,Inter,sans-serif">' + score + '</text></svg>';
  }

  /* Screaming Frog crawl reader: parses an exported CSV in the browser. */
  function parseCsv(text) {
    var rows = [], row = [], f = '', q = false, i, c;
    for (i = 0; i < text.length; i++) {
      c = text[i];
      if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
      else if (c === '"') q = true; else if (c === ',') { row.push(f); f = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(f); rows.push(row); row = []; f = ''; }
      else f += c;
    }
    if (f || row.length) { row.push(f); rows.push(row); }
    return rows.filter(function (r) { return r.length > 1 || r[0]; });
  }
  function crawlSummary(rows) {
    var h = rows[0].map(function (x) { return x.replace(/^﻿/, '').trim().toLowerCase(); });
    function col(n) { return h.indexOf(n); }
    var A = col('address'), S2 = col('status code'), CT = col('content type'), IX = col('indexability'), T = col('title 1'), M = col('meta description 1'), H = col('h1-1'), W = col('word count');
    if (A < 0) return null;
    var data = rows.slice(1).filter(function (r) { return CT < 0 || /html/i.test(r[CT] || ''); });
    var titles = {}, out = { n: data.length, s3: [], s4: [], s5: [], noidx: [], notitle: [], dupe: [], nometa: [], noh1: [], thin: [] };
    data.forEach(function (r) { var t = T > -1 ? (r[T] || '').trim() : ''; if (t) titles[t] = (titles[t] || 0) + 1; });
    data.forEach(function (r) {
      var u = r[A], s = S2 > -1 ? Number(r[S2]) : 0;
      if (s >= 300 && s < 400) out.s3.push(u); if (s >= 400 && s < 500) out.s4.push(u); if (s >= 500) out.s5.push(u);
      if (IX > -1 && /non/i.test(r[IX] || '')) out.noidx.push(u);
      if (s && s >= 300) return;
      if (T > -1) { var t = (r[T] || '').trim(); if (!t) out.notitle.push(u); else if (titles[t] > 1) out.dupe.push(u); }
      if (M > -1 && !(r[M] || '').trim()) out.nometa.push(u);
      if (H > -1 && !(r[H] || '').trim()) out.noh1.push(u);
      if (W > -1 && r[W] !== '' && Number(r[W]) < 200) out.thin.push(u);
    });
    return out;
  }

  function pWeb(bay) {
    var st = S.site;
    function fi(k, lab, ph, kind, max) {
      var v = esc(st[k] || ''), id = 'pcs-w-' + k;
      if (kind === 'ta') return '<div class="f"><label for="' + id + '">' + lab + '</label><textarea id="' + id + '" data-site="' + k + '" maxlength="' + (max || 1200) + '" placeholder="' + esc(ph) + '">' + v + '</textarea></div>';
      return '<div class="f"><label for="' + id + '">' + lab + '</label><input type="' + (kind || 'text') + '" id="' + id + '" data-site="' + k + '" maxlength="' + (max || 160) + '" placeholder="' + esc(ph) + '" value="' + v + '"></div>';
    }
    function stLamp(s) { return s === 'go' ? '<span class="pcs-st go">Works today</span>' : '<span class="pcs-st soon">Coming soon</span>'; }
    bay.innerHTML = head('Websites & SEO', 'Make a fast one-page site free, then pick how far you want to go: DIY hosting, a custom site, or a site built to win searches.', sampleTag()) +
      '<div class="pcs-grid">' +
      /* 1. Generator */
      '<div class="pcs-card w5"><p class="pcs-led pink">Landing-page generator <span class="pcs-sample">Free</span></p>' +
        '<div class="f"><label for="pcs-w-tpl">Template</label><select id="pcs-w-tpl" data-site="tpl">' + Object.keys(SITE_TPL).map(function (k) { return '<option value="' + k + '"' + (st.tpl === k ? ' selected' : '') + '>' + SITE_TPL[k].n + '</option>'; }).join('') + '</select></div>' +
        fi('name', 'Name or brand', 'Neon Alley Pictures', 'text', 80) + fi('tag', 'Headline (your H1)', 'What you do, for whom', 'text', 140) +
        fi('about', 'About (2 to 4 sentences, true facts only)', 'Who you are, what you do, where', 'ta', 1200) +
        '<div class="row"><div>' + fi('cta', 'Button text', 'Book a call', 'text', 40) + '</div><div>' + fi('ctaUrl', 'Button link', 'https://, mailto: or tel:', 'text', 300) + '</div></div>' +
        '<div class="row"><div>' + fi('phone', 'Phone', '303-555-0100', 'text', 30) + '</div><div>' + fi('email', 'Email', 'you@yourdomain.com', 'email', 120) + '</div></div>' +
        '<div class="row"><div>' + fi('city', 'City, State', 'Denver, CO', 'text', 80) + '</div><div>' + fi('url', 'Page address (for canonical)', 'https://yourdomain.com/', 'url', 300) + '</div></div>' +
        fi('items', 'Offer cards, one per line: Title | short line', 'Brand spots | 30-second ads for every feed', 'ta', 1500) +
        fi('faq', 'FAQ, one per line: Question? | Answer', 'Do you travel? | Yes, across Colorado.', 'ta', 2000) +
        '<label>Brand color</label><div class="pcs-btns" id="pcs-w-sw">' + SWATCHES.map(function (c) { return '<button type="button" class="pcs-b sm" data-wc="' + c + '" aria-label="Brand color ' + c + '" aria-pressed="' + (st.color === c) + '" style="background:' + c + ';width:40px"></button>'; }).join('') +
        '<label class="pcs-b sm ghost" style="margin:0">Custom <input type="color" id="pcs-w-color" value="' + hexOk(st.color) + '" aria-label="Custom brand color" style="width:28px;height:22px;border:0;padding:0;background:none"></label></div>' +
        '<div class="f" style="margin-top:8px"><label for="pcs-w-theme">Background</label><select id="pcs-w-theme" data-site="theme"><option value="dark"' + (st.theme !== 'light' ? ' selected' : '') + '>Dark</option><option value="light"' + (st.theme === 'light' ? ' selected' : '') + '>Light</option></select></div>' +
      '</div>' +
      '<div class="pcs-card w7"><p class="pcs-led cyan">Live preview</p><iframe class="pcs-site-prev" id="pcs-w-prev" title="Preview of your one-page site" sandbox="" loading="lazy"></iframe>' +
        '<div class="pcs-btns"><button class="pcs-b hot" type="button" id="pcs-w-dl">Download index.html</button><button class="pcs-b" type="button" id="pcs-w-copy">Copy HTML</button><button class="pcs-b ghost" type="button" id="pcs-w-check">Score it in the SEO gauge</button></div>' +
        '<p class="pcs-note" id="pcs-w-size"></p>' +
        '<p class="pcs-note">One file, no scripts, no trackers: mobile-ready, keyboard-friendly, with title, description, share tags and schema (JSON-LD) for search engines and AI tools. Schema helps them read the page; it does not guarantee rich results or rankings. Upload the file as index.html to any host, such as <a href="https://www.buyweburl.com/products/cpanel" target="_blank" rel="nofollow noopener">cPanel hosting from $4.99/mo</a>.</p></div>' +
      /* 2. Big upsell */
      '<div class="pcs-card w12 pcs-hero-offer"><p class="pcs-led amber">Zach\'s offer &middot; Eye To Ad Media, Denver SEO since 2012</p>' +
        '<h3>A website built to win searches and leads, then yours to buy.</h3>' +
        '<p>We custom-code an automated site for your business and run it every month: SEO, AIO (showing up in Google AI Overviews, ChatGPT and other AI answers) and AI agents that answer and follow up with your leads. It is built to compete for the top searches in your industry and your area.</p>' +
        '<ul class="pcs-ticks"><li>Custom-coded, fast, no page builder</li><li>Monthly SEO and AIO content, links and fixes</li><li>AI agents that answer leads around the clock</li><li>Prefer proof first? Ask about the option to buy the site once its first-page rankings and AI citations are bringing you money</li></ul>' +
        '<p class="pcs-price"><b>$20,000 to $50,000</b> depending on your market, scope and complexity. Terms, including any buy-later option, are agreed in writing before work starts.</p>' +
        '<div class="pcs-btns"><a class="pcs-b hot" href="/book/?want=web">Request a plan</a><a class="pcs-b" href="https://eyetoad.com/custom-website-design/#start" target="_blank" rel="nofollow noopener">Talk to Eye To Ad</a><a class="pcs-b ghost" href="https://eyetoad.com/seo-time-machine/" target="_blank" rel="nofollow noopener">Estimate your timeline</a><a class="pcs-b ghost" href="tel:+18004818638">1-800-481-8638</a></div>' +
        '<p class="pcs-note"><b style="color:#fff">No guarantees.</b> Nobody can promise rankings, AI citations, traffic or leads, and we don\'t. Google and AI tools decide what they show, and results depend on your market, competition and history. We show you the work and the numbers every month.</p></div>' +
      /* 3. Three levels */
      '<div class="pcs-card w12"><p class="pcs-led">Hosting and sites: pick your level</p><div class="pcs-levels">' +
        '<div class="pcs-lvl" style="--c:#7ED321"><p class="k">Do it yourself</p><h3>DIY site or hosting</h3><p class="p">Website builder from <b>$5.99/mo</b>. cPanel hosting from <b>$4.99/mo</b>. WordPress hosting from <b>$12.99/mo</b>.</p><p class="pcs-note">Through buyweburl.com. Prices as listed on its product pages on Nov 8, 2026; taxes and ICANN fees extra.</p>' +
          '<div class="pcs-btns"><a class="pcs-b sm" href="https://www.buyweburl.com/products/website-builder" target="_blank" rel="nofollow noopener">Website builder</a><a class="pcs-b sm" href="https://www.buyweburl.com/products/cpanel" target="_blank" rel="nofollow noopener">Hosting</a><a class="pcs-b sm ghost" href="https://www.buyweburl.com/products/domain-registration" target="_blank" rel="nofollow noopener">Domains</a></div></div>' +
        '<div class="pcs-lvl" style="--c:#00B8F0"><p class="k">Built for you</p><h3>Custom CMS site</h3><p class="p">A WordPress or Shopify site set up and designed for you, so you can edit pages and products yourself.</p><p class="pcs-note">Quoted per project after a short call.</p>' +
          '<div class="pcs-btns"><a class="pcs-b sm" href="/book/?want=web">Get a quote</a></div></div>' +
        '<div class="pcs-lvl" style="--c:#FF2E93"><p class="k">Custom code</p><h3>Custom website or app</h3><p class="p">Hand-coded sites, portals, booking and quote tools, and web apps. From about <b>$20,000</b>, depending on complexity.</p><p class="pcs-note">Scope and price agreed in writing first.</p>' +
          '<div class="pcs-btns"><a class="pcs-b sm hot" href="/book/?want=web">Request a call</a><a class="pcs-b sm ghost" href="https://eyetoad.com/custom-website-design/" target="_blank" rel="nofollow noopener">See custom work</a></div></div>' +
      '</div></div>' +
      /* 4. Gauge + crawl reader */
      '<div class="pcs-card w7" id="pcs-w-gauge"><p class="pcs-led amber">SEO gauge <span class="pcs-sample">Free</span></p>' +
        '<div class="f"><label for="pcs-w-html">Paste a page\'s HTML (open the page, View Source, select all, copy)</label><textarea id="pcs-w-html" maxlength="2000000" placeholder="&lt;!doctype html&gt;..."></textarea></div>' +
        '<div class="pcs-btns"><button class="pcs-b hot" type="button" id="pcs-w-gpaste">Score pasted HTML</button><button class="pcs-b" type="button" id="pcs-w-ggen">Score my generated page</button></div>' +
        '<div id="pcs-w-gout" aria-live="polite"></div>' +
        '<p class="pcs-note">Checks one page\'s on-page basics only. It cannot see speed, backlinks, rankings or competitors.</p></div>' +
      '<div class="pcs-card w5"><p class="pcs-led violet">Crawl reader for Screaming Frog <span class="pcs-sample">Free</span></p>' +
        '<p class="pcs-note" style="margin-top:0">In the SEO Spider, open the Internal tab, filter HTML, and Export to CSV. Drop the file here for a site-wide fix list. It is read in your browser and never uploaded.</p>' +
        '<label class="pcs-b" style="margin-top:8px">Choose crawl CSV<input type="file" id="pcs-w-csv" accept=".csv,text/csv" hidden></label>' +
        '<div id="pcs-w-cout" aria-live="polite"></div></div>' +
      /* 5. Tie-ins */
      '<div class="pcs-card w12"><p class="pcs-led cyan">Launch buttons: grow from here</p><div class="pcs-launch">' +
        TIEINS.map(function (x) { var ext = /^https?:/.test(x.u); return '<a class="pcs-lb" style="--c:' + x.c + '" href="' + esc(x.u) + '"' + (ext ? ' target="_blank" rel="nofollow noopener"' : ' data-jump="1"') + '><b>' + esc(x.n) + '</b>' + stLamp(x.st) + '<span>' + esc(x.now) + '</span><em>' + esc(x.dom) + '</em></a>'; }).join('') +
        '</div><p class="pcs-note">These are separate businesses in our network, each with its own prices and terms. Live results from each one inside this dashboard: coming soon.</p></div>' +
      /* 6. Account links */
      '<div class="pcs-card w12"><p class="pcs-led pink">Connect your SEO accounts</p><ul class="pcs-accts">' +
        ACCOUNTS.map(function (x) { return '<li><div><b>' + esc(x.n) + '</b> ' + stLamp(x.st) + '<p>' + esc(x.d) + '</p></div><a class="pcs-b sm" href="' + esc(x.u) + '" target="_blank" rel="nofollow noopener">' + esc(x.now) + '</a></li>'; }).join('') +
        '</ul><p class="pcs-note">We only connect read-only access, and only when you click to allow it. Nothing connects in the demo.</p></div>' +
      '</div>';

    var prev = $('#pcs-w-prev'), pend = 0;
    function paint() {
      var html = sitePage(S.site);
      prev.srcdoc = html;
      $('#pcs-w-size').textContent = 'File size: ' + (new Blob([html]).size / 1024).toFixed(1) + ' KB. Template: ' + (SITE_TPL[S.site.tpl] || SITE_TPL.creator).n + ', schema type ' + (SITE_TPL[S.site.tpl] || SITE_TPL.creator).type + '.';
      var cu = $('#pcs-w-ctaUrl'); if (cu) { var bad = cu.value.trim() && !safeCta(cu.value); cu.setAttribute('aria-invalid', bad ? 'true' : 'false'); cu.style.borderColor = bad ? '#FF4D4D' : ''; }
      var uu = $('#pcs-w-url'); if (uu) { var bad2 = uu.value.trim() && !safeUrl(uu.value); uu.setAttribute('aria-invalid', bad2 ? 'true' : 'false'); uu.style.borderColor = bad2 ? '#FF4D4D' : ''; }
    }
    function later() { clearTimeout(pend); pend = setTimeout(paint, 250); }
    function showGauge(html) {
      var r = gaugeHtml(html), out = $('#pcs-w-gout');
      function list(arr) { return '<ul class="pcs-checks">' + arr.map(function (c) { return '<li class="' + (c[1] ? 'ok' : 'no') + '"><span aria-hidden="true">' + (c[1] ? '&#10003;' : '&#10007;') + '</span><span class="sr-only">' + (c[1] ? 'Pass: ' : 'Fix: ') + '</span><b>' + esc(c[2]) + '</b> <small>' + esc(c[3]) + '</small></li>'; }).join('') + '</ul>'; }
      var convFails = r.conv.filter(function (c) { return !c[1]; }).length;
      out.innerHTML = '<div class="pcs-gwrap">' + seoGaugeSvg(r.score) + '<p class="pcs-note">' + (r.score >= 85 ? 'Strong basics.' : r.score >= 60 ? 'Good start, a few fixes to make.' : 'Several basics are missing.') + ' Score out of 100.</p></div>' +
        '<p class="pcs-led" style="margin-top:8px">Search basics</p>' + list(r.seo) +
        '<p class="pcs-led amber" style="margin-top:8px">Conversion quick check</p>' + list(r.conv) +
        '<p class="pcs-note">' + (convFails ? 'Traffic that cannot act is wasted. ' : 'Basics are in place. ') + 'For a full conversion analysis, run the free Conversion Audit at Search Converts.</p>' +
        '<div class="pcs-btns"><a class="pcs-b hot sm" href="https://searchconverts.com/cro-audit/" target="_blank" rel="nofollow noopener">Free conversion audit</a><a class="pcs-b sm" href="https://searchconverts.com/website-conversion-rate/" target="_blank" rel="nofollow noopener">Conversion gauge</a><a class="pcs-b sm ghost" href="https://eyetoad.com/free-seo-audit/" target="_blank" rel="nofollow noopener">Free full SEO audit</a></div>';
    }
    bay.addEventListener('input', function (e) {
      var k = e.target.getAttribute('data-site'); if (!k) return;
      S.site[k] = e.target.value; changed(); later();
    });
    bay.addEventListener('change', function (e) {
      var k = e.target.getAttribute('data-site'); if (k) { S.site[k] = e.target.value; changed(); paint(); return; }
      if (e.target.id === 'pcs-w-color') { S.site.color = hexOk(e.target.value); $$('[data-wc]', bay).forEach(function (x) { x.setAttribute('aria-pressed', 'false'); }); changed(); paint(); }
    });
    $('#pcs-w-sw').addEventListener('click', function (e) {
      var b = e.target.closest('[data-wc]'); if (!b) return; S.site.color = b.getAttribute('data-wc'); $('#pcs-w-color').value = S.site.color;
      $$('[data-wc]', bay).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); changed(); paint();
    });
    $('#pcs-w-dl').addEventListener('click', function () { download('index.html', sitePage(S.site), 'text/html'); });
    $('#pcs-w-copy').addEventListener('click', function () { copy(sitePage(S.site), 'HTML'); });
    $('#pcs-w-check').addEventListener('click', function () { showGauge(sitePage(S.site)); $('#pcs-w-gauge').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    $('#pcs-w-ggen').addEventListener('click', function () { showGauge(sitePage(S.site)); });
    $('#pcs-w-gpaste').addEventListener('click', function () { var v = $('#pcs-w-html').value; if (!v.trim()) { toast('Paste some HTML first'); return; } showGauge(v); });
    bay.addEventListener('click', function (e) { var j = e.target.closest('[data-jump]'); if (!j) return; e.preventDefault(); var g = $('#pcs-w-gauge'); g.scrollIntoView({ behavior: 'smooth', block: 'start' }); $('#pcs-w-html').focus({ preventScroll: true }); });
    $('#pcs-w-csv').addEventListener('change', function () {
      var f = this.files && this.files[0], out = $('#pcs-w-cout'); this.value = ''; if (!f) return;
      if (f.size > 25 * 1024 * 1024) { out.innerHTML = '<p class="pcs-note">That file is over 25 MB. Export just the Internal: HTML tab.</p>'; return; }
      var r = new FileReader();
      r.onload = function () {
        var rows = parseCsv(String(r.result || '')), s = rows.length > 1 ? crawlSummary(rows) : null;
        if (!s) { out.innerHTML = '<p class="pcs-note">That does not look like a Screaming Frog Internal export. It needs an Address column.</p>'; return; }
        var rowsOut = [['Pages crawled (HTML)', s.n, null], ['Broken (4xx)', s.s4.length, s.s4], ['Server errors (5xx)', s.s5.length, s.s5], ['Redirects (3xx)', s.s3.length, s.s3], ['Non-indexable', s.noidx.length, s.noidx],
          ['Missing title', s.notitle.length, s.notitle], ['Duplicate titles', s.dupe.length, s.dupe], ['Missing meta description', s.nometa.length, s.nometa], ['Missing H1', s.noh1.length, s.noh1], ['Under 200 words', s.thin.length, s.thin]];
        out.innerHTML = '<ul class="pcs-crawl">' + rowsOut.map(function (x) {
          return '<li class="' + (x[2] && x[1] ? 'bad' : '') + '"><span>' + x[0] + '</span><b>' + x[1].toLocaleString('en-US') + '</b>' + (x[2] && x[1] ? '<details><summary>Show up to 10</summary><ul>' + x[2].slice(0, 10).map(function (u) { return '<li>' + esc(u) + '</li>'; }).join('') + '</ul></details>' : '') + '</li>';
        }).join('') + '</ul><div class="pcs-btns"><a class="pcs-b sm hot" href="https://eyetoad.com/free-seo-audit/" target="_blank" rel="nofollow noopener">Have Eye To Ad fix it</a></div>';
      };
      r.readAsText(f);
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
