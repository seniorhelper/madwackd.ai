/* Madwackd owner dashboard (/owner/). Holds no data of its own: everything comes from the owner-only API
   routes, which return 403 to anyone who isn't on the server's owner list. All text goes in with textContent. */
(function (root) {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var auth = root.MWAuth;
  var data = { summary: null, feed: [], win: 'today', filter: 'all' };
  var timer = null;

  function api(path, opts) {
    opts = opts || {};
    var h = { Authorization: 'Bearer ' + (root.MW_ID_TOKEN || '') };
    if (opts.body) h['Content-Type'] = 'application/json';
    return fetch(root.MW_API_BASE + path, { method: opts.method || 'GET', headers: h, credentials: 'omit', cache: 'no-store',
      body: opts.body ? JSON.stringify(opts.body) : undefined }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok) { var e = new Error(j.message || ('Request failed (' + r.status + ')')); e.status = r.status; e.code = j.error; throw e; }
        return j;
      });
    });
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = String(text);
    return n;
  }
  function usd(v) { return '$' + Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function num(v) { return Number(v || 0).toLocaleString('en-US'); }
  function n(v, one, many) { return num(v) + ' ' + (Number(v) === 1 ? one : (many || one + 's')); }
  function when(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    if (isNaN(d)) return iso;
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  }
  function state(msg, kind) {
    var s = $('own-state'); s.textContent = msg; s.className = 'own-state' + (kind ? ' own-' + kind : ''); s.hidden = !msg;
  }
  function pressed(group, attr, val) {
    var bs = document.querySelectorAll('[' + attr + ']');
    for (var i = 0; i < bs.length; i++) bs[i].setAttribute('aria-pressed', String(bs[i].getAttribute(attr) === val));
  }

  /* ---------- KPIs ---------- */
  function renderKpis() {
    var s = data.summary; if (!s) return;
    var m = s.money[data.win] || {};
    var box = $('kpis'); box.textContent = '';
    var tiles = [
      ['Revenue', usd(m.revenue_usd), 'Credit sales ' + usd(m.credit_sales_usd) + ' + service orders ' + usd(m.service_orders_usd)],
      ['Purchases', num(m.purchases + (m.service_orders || 0)), n(m.pack_purchases, 'pack') + ', ' + n(m.plan_payments, 'plan payment') + ', ' + n(m.service_orders, 'order')],
      ['New sign-ups', num(m.signups), num(s.users.waitlist) + ' on the waitlist'],
      ['Renders', num(m.renders), statusLine(m.renders_by_status)],
      ['Credits used', num(m.credits_used), num(m.credits_sold) + ' sold, ' + num(m.credits_refunded) + ' refunded'],
      ['Owner test credits', num((m.owner_grants || {}).credits), n((m.owner_grants || {}).count, 'grant') + '. Not revenue.']
    ];
    if (m.payment_flags) tiles.push(['Payment problems', num(m.payment_flags), 'Disputes, fraud warnings or refunds. Check Stripe.']);
    tiles.forEach(function (t, i) {
      var c = el('div', 'own-kpi' + (i === 5 ? ' own-kpi-owner' : '') + (t[0] === 'Payment problems' ? ' own-kpi-bad' : ''));
      c.appendChild(el('span', 'own-kpi-label', t[0]));
      c.appendChild(el('span', 'own-kpi-value', t[1]));
      c.appendChild(el('span', 'own-kpi-sub', t[2]));
      box.appendChild(c);
    });
    $('win-note').textContent = s.windows_note + ' Revenue is what Stripe reported at payment time, before fees and refunds.';
  }
  function statusLine(by) {
    by = by || {};
    var parts = [];
    ['done', 'running', 'failed', 'submit_failed', 'blocked', 'needs_review'].forEach(function (k) {
      if (by[k]) parts.push(num(by[k]) + ' ' + k.replace('_', ' '));
    });
    return parts.join(', ') || 'none yet';
  }

  /* ---------- spend meters ---------- */
  function meter(name, today, cap, note) {
    var pct = cap > 0 ? Math.min(100, Math.round(today / cap * 100)) : 0;
    var w = el('div', 'own-meter' + (pct >= 90 ? ' own-meter-hot' : pct >= 60 ? ' own-meter-warm' : ''));
    var top = el('div', 'own-meter-top');
    top.appendChild(el('span', 'own-meter-name', name));
    top.appendChild(el('span', 'own-meter-val', usd(today) + ' of ' + usd(cap) + ' (' + pct + '%)'));
    w.appendChild(top);
    var bar = el('div', 'own-bar'); bar.setAttribute('role', 'meter');
    bar.setAttribute('aria-label', name + ' spend today'); bar.setAttribute('aria-valuemin', '0');
    bar.setAttribute('aria-valuemax', String(cap)); bar.setAttribute('aria-valuenow', String(today));
    bar.setAttribute('aria-valuetext', usd(today) + ' of ' + usd(cap) + ' cap');
    var fill = el('span', 'own-bar-fill'); fill.style.width = pct + '%';
    bar.appendChild(fill); w.appendChild(bar);
    if (note) w.appendChild(el('span', 'own-kpi-sub', note));
    return w;
  }
  function renderSpend() {
    var sp = data.summary.spend, box = $('meters'); box.textContent = '';
    box.appendChild(meter('Google video', sp.google.today_usd, sp.google.cap_usd,
      '7 days ' + usd(sp.google['7d_usd']) + ', 30 days ' + usd(sp.google['30d_usd']) + '. ' + num(data.summary.jobs_running) + ' rendering now.'));
    box.appendChild(meter('Producer Z (site guide)', sp.producer_z.today_usd, sp.producer_z.cap_usd, ''));
    box.appendChild(meter('AI Producer', sp.ai_producer.today_usd, sp.ai_producer.cap_usd, sp.ai_producer.enabled ? '' : 'Turned off.'));
    var tb = $('spend-days').tBodies[0]; tb.textContent = '';
    (sp.google.by_day || []).forEach(function (d) {
      var tr = el('tr'); tr.appendChild(el('td', '', d.day)); tr.appendChild(el('td', 'num', usd(d.usd))); tb.appendChild(tr);
    });
  }

  /* ---------- transactions ---------- */
  var KIND = {
    purchase: 'Bought', order: 'Ordered', owner_grant: 'Owner test credits', render: 'Render', refund: 'Refund',
    voiceover: 'Voiceover', billing_flag: 'Payment problem'
  };
  function feedMatch(r) {
    var f = data.filter;
    if (f === 'all') return true;
    if (f === 'sales') return r.kind === 'purchase' || r.kind === 'order';
    if (f === 'renders') return r.kind === 'render' || r.kind === 'refund' || r.kind === 'voiceover';
    if (f === 'owner') return r.kind === 'owner_grant';
    if (f === 'problems') return r.kind === 'billing_flag' || (r.kind === 'render' && /failed|blocked|review/.test(r.status || ''));
    return true;
  }
  function renderFeed() {
    var tb = $('feed').tBodies[0]; tb.textContent = '';
    var rows = data.feed.filter(feedMatch);
    $('feed-empty').hidden = rows.length > 0;
    rows.forEach(function (r) {
      var tr = el('tr', 'own-row-' + r.kind);
      tr.appendChild(el('td', 'own-nowrap', when(r.at)));
      tr.appendChild(el('td', 'own-who', r.email || r.uid || 'unknown'));
      var what = el('td');
      var tag = el('span', 'own-tag own-tag-' + r.kind, KIND[r.kind] || r.kind);
      what.appendChild(tag);
      var detail = '';
      if (r.kind === 'purchase') detail = (r.name || r.item) + ' (' + r.source + ')';
      else if (r.kind === 'order') detail = (r.name || r.item) + (r.status ? ', ' + r.status : '');
      else if (r.kind === 'render') detail = [r.seconds ? r.seconds + 's' : '', r.quality, r.status].filter(Boolean).join(' · ') + (r.prompt ? ': ' + r.prompt : '');
      else if (r.kind === 'refund') detail = r.reason || '';
      else if (r.kind === 'owner_grant') detail = (r.reason ? r.reason : '') + (r.by ? ' by ' + r.by : '');
      else if (r.kind === 'billing_flag') detail = (r.flag || '') + (r.status ? ', ' + r.status : '');
      if (detail) what.appendChild(el('span', 'own-detail', ' ' + detail));
      tr.appendChild(what);
      tr.appendChild(el('td', 'num ' + (r.credits > 0 ? 'own-pos' : r.credits < 0 ? 'own-neg' : ''), r.credits ? (r.credits > 0 ? '+' : '') + num(r.credits) : ''));
      tr.appendChild(el('td', 'num', r.usd ? usd(r.usd) : (r.kind === 'render' && r.est_cost_usd ? 'cost ~' + usd(r.est_cost_usd) : '')));
      tb.appendChild(tr);
    });
  }

  /* ---------- leads ---------- */
  var STATUSES = ['new', 'contacted', 'quoted', 'won', 'lost', 'spam'];
  function renderLeads(j) {
    var tb = $('leads').tBodies[0]; tb.textContent = '';
    var c = j.counts || {}, parts = [];
    Object.keys(c).forEach(function (k) { parts.push(num(c[k]) + ' ' + k); });
    $('leads-counts').textContent = parts.join(' · ');
    var rows = (j.leads || []).filter(function (l) { return l.tier !== 'spam'; }).slice(0, 50);
    $('leads-empty').hidden = rows.length > 0;
    rows.forEach(function (l) {
      var tr = el('tr');
      tr.appendChild(el('td', 'own-nowrap', when(l.created_at)));
      tr.appendChild(el('td', '', '')).appendChild(el('span', 'own-tag own-tier-' + l.tier, l.tier));
      var who = el('td', 'own-who');
      who.appendChild(el('strong', '', l.name || ''));
      var mail = el('a', '', l.email || ''); mail.href = 'mailto:' + encodeURIComponent(l.email || '').replace(/%40/g, '@');
      who.appendChild(el('br')); who.appendChild(mail);
      if (l.phone) { who.appendChild(el('br')); who.appendChild(el('span', 'muted', l.phone)); }
      tr.appendChild(who);
      var wants = el('td'); wants.appendChild(el('span', '', (l.interest || '').replace(/_/g, ' ') + ', ' + (l.budget || '').replace(/_/g, ' ')));
      if (l.message) wants.appendChild(el('span', 'own-detail', ' ' + String(l.message).slice(0, 160)));
      tr.appendChild(wants);
      var td = el('td'); var sel = el('select');
      sel.setAttribute('aria-label', 'Status for ' + (l.name || 'lead'));
      STATUSES.forEach(function (s) { var o = el('option', '', s); o.value = s; if (s === l.status) o.selected = true; sel.appendChild(o); });
      sel.addEventListener('change', function () {
        sel.disabled = true;
        api('/v2/admin/leads/' + encodeURIComponent(l.id), { method: 'POST', body: { status: sel.value } })
          .then(function () { sel.disabled = false; })
          .catch(function (e) { sel.disabled = false; sel.value = l.status; alertMsg(e.message); });
      });
      td.appendChild(sel); tr.appendChild(td);
      tb.appendChild(tr);
    });
  }
  function alertMsg(m) { $('own-updated').textContent = m; }

  /* ---------- alerts + setup ---------- */
  function renderAlerts(j) {
    var ch = j.channels || {};
    var line = [];
    line.push('Phone push: ' + (ch.push ? 'on' : 'off'));
    line.push('Email: ' + (ch.email ? 'on' : 'off'));
    line.push('Render alerts: ' + (ch.renders || 'all'));
    line.push('Daily summary: ' + (ch.daily_summary ? 'on' : 'off'));
    $('alert-channels').textContent = line.join(' · ');
    var setup = [];
    if (!ch.smtp_set) setup.push('Email is OFF: the mail server (SMTP) is not set, so lead alerts, lead auto-replies and these owner emails are not sending. Make a free Gmail app password and run scripts\\set-owner-alerts.ps1.');
    else if (!ch.email_to_set) setup.push('Email is set up but no owner address is set (OWNER_ALERT_EMAIL_TO or LEAD_ALERT_EMAIL_TO).');
    if (!ch.push) setup.push('Phone push is OFF: LEAD_NTFY_TOPIC is not set. Install the free ntfy app and run the same script.');
    var ul = $('setup-list'); ul.textContent = '';
    setup.forEach(function (t) { ul.appendChild(el('li', '', t)); });
    $('own-setup').hidden = setup.length === 0;
    var tb = $('alerts').tBodies[0]; tb.textContent = '';
    (j.alerts || []).forEach(function (a) {
      var tr = el('tr');
      tr.appendChild(el('td', 'own-nowrap', when(a.created_at)));
      tr.appendChild(el('td', '', (a.kind || '').replace(/_/g, ' ')));
      tr.appendChild(el('td', 'own-who', a.email || ''));
      tr.appendChild(el('td', 'own-deliv own-deliv-' + a.notify, a.notify));
      tb.appendChild(tr);
    });
  }

  function renderLinks(s) {
    var ul = $('links'); ul.textContent = '';
    (s.links || []).forEach(function (l) {
      if (!/^https:\/\/(dashboard\.stripe\.com|console\.cloud\.google\.com|dash\.cloudflare\.com)\//.test(l.url)) return;
      var li = el('li'); var a = el('a', 'btn-top', l.name); a.href = l.url; a.target = '_blank'; a.rel = 'noopener noreferrer';
      li.appendChild(a); ul.appendChild(li);
    });
    var iss = $('issues'); iss.textContent = '';
    (s.issues || []).forEach(function (t) { iss.appendChild(el('li', '', 'Setup issue: ' + t)); });
    iss.hidden = !(s.issues || []).length;
  }

  /* ---------- load ---------- */
  function load() {
    $('own-refresh').disabled = true;
    return api('/v2/admin/owner/summary').then(function (s) {
      data.summary = s;
      state('');
      $('own-app').hidden = false; $('own-refresh').hidden = false;
      renderKpis(); renderSpend(); renderLinks(s); renderAlerts({ channels: s.alerts, alerts: [] });
      $('own-updated').textContent = 'Updated ' + when(s.as_of);
      return Promise.all([
        api('/v2/admin/owner/transactions').then(function (t) { data.feed = t.transactions || []; renderFeed(); }),
        api('/v2/admin/leads').then(renderLeads),
        api('/v2/admin/owner/alerts').then(renderAlerts)
      ]);
    }).catch(function (e) {
      $('own-app').hidden = true; $('own-refresh').hidden = true;
      if (e.status === 401) state('Please sign in to see the owner dashboard.', 'info');
      else if (e.status === 403 && e.code === 'signup_required') state('Finish signing up on the Studio page first, then come back.', 'info');
      else if (e.status === 403) state('This page is for the site owner only.', 'bad');
      else state("The dashboard couldn't load: " + e.message, 'bad');
    }).then(function () { $('own-refresh').disabled = false; });
  }

  function start() {
    if (!root.MW_ID_TOKEN) {
      $('own-app').hidden = true; $('own-refresh').hidden = true;
      state('Please sign in to see the owner dashboard.', 'info');
      return;
    }
    if (!$('grant-email').value && auth && auth.state.email) $('grant-email').value = auth.state.email;
    state('Loading…');
    load();
    clearInterval(timer);
    timer = setInterval(function () { if (!document.hidden && root.MW_ID_TOKEN) load(); }, 60000);
  }

  /* ---------- wiring ---------- */
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest && ev.target.closest('button[data-win],button[data-feed]');
    if (!b) return;
    if (b.hasAttribute('data-win')) { data.win = b.getAttribute('data-win'); pressed(null, 'data-win', data.win); renderKpis(); }
    else { data.filter = b.getAttribute('data-feed'); pressed(null, 'data-feed', data.filter); renderFeed(); }
  });
  $('own-refresh').addEventListener('click', load);

  $('grant-form').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var msg = $('grant-msg'), email = $('grant-email').value.trim(), credits = parseInt($('grant-credits').value, 10);
    var reason = $('grant-reason').value.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { msg.textContent = 'Enter the owner account email.'; return; }
    if (!(credits >= 1 && credits <= 5000)) { msg.textContent = 'Credits must be 1 to 5,000.'; return; }
    if (!reason) { msg.textContent = 'Add a short reason.'; return; }
    var btn = ev.target.querySelector('button'); btn.disabled = true; msg.textContent = 'Giving owner test credits…';
    var key = 'dash-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
    api('/v2/admin/grant', { method: 'POST', body: { email: email, credits: credits, reason: reason, idempotency_key: key } })
      .then(function (r) { msg.textContent = 'Done. ' + num(credits) + ' owner test credits added. Balance: ' + num(r.balance_credits) + '.'; load(); })
      .catch(function (e) { msg.textContent = e.message; })
      .then(function () { btn.disabled = false; });
  });

  $('send-summary').addEventListener('click', function () {
    var b = $('send-summary'), msg = $('summary-msg');
    b.disabled = true; msg.textContent = 'Sending…';
    api('/v2/admin/owner/daily-summary', { method: 'POST', body: { send: true } })
      .then(function (r) {
        msg.textContent = r.status === 'sent' ? "Sent yesterday's summary. Check your phone and inbox."
          : r.status === 'unconfigured' ? 'Nothing sent: no alert channel is set up yet (see the box at the top).'
          : r.status === 'partial' ? 'Sent on one channel; the other failed.'
          : r.why ? 'Not sent: ' + r.why + '.' : 'Sending failed. Check the alert settings.';
      })
      .catch(function (e) { msg.textContent = e.message; })
      .then(function () { b.disabled = false; });
  });

  if (!auth) { state('Sign-in could not load. Refresh the page.', 'bad'); return; }
  auth.ready.then(start);
  auth.onChange(start);
})(window);
