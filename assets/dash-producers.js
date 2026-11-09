/* "Your 2 AI producers" panel for the Creator Dashboard (/dashboard/).
   Shows only when GET /v2/agents says enabled (server flag AGENTS_ENABLED; owner-only at first).
   The server enforces every limit. This page only shows them and sends the user's choices.
   All server text goes in with textContent (never innerHTML). */
(function (root) {
  'use strict';
  var box = document.getElementById('producers');
  if (!box || !root.MWAuth) return;
  var API = root.MW_API_BASE || '';
  var state = null, timer = null, busy = false;
  var NAMES = { showrunner: 'Showrunner', promo: 'Promo producer' };
  var STATUS = { quoted: 'Waiting for your OK', approved: 'Approved, starting soon', running: 'Working', waiting: 'Paused at today\'s budget',
    done: 'Drafts ready', cancelled: 'Cancelled', stopped: 'Stopped', expired: 'Expired', failed: 'Stopped after a problem',
    over_cap: 'Over your per-task limit', paused_credits: 'Paused: out of credits', paused_budget: 'Paused: monthly budget' };

  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function usd(r) { return r ? '$' + r[0].toFixed(2) + ' to $' + r[1].toFixed(2) : ''; }
  function say(msg, bad) { var m = $('pr-msg'); m.textContent = msg || ''; m.classList.toggle('bad', !!bad); }

  function req(method, path, body) {
    var tok = root.MW_ID_TOKEN;
    if (!API || !tok) return Promise.reject(new Error('Sign in first.'));
    var opt = { method: method, credentials: 'omit', headers: { Authorization: 'Bearer ' + tok } };
    if (body) { opt.headers['Content-Type'] = 'application/json'; opt.body = JSON.stringify(body); }
    return fetch(API + path, opt).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok) { var e = new Error(j.message || 'Something went wrong. Nothing was charged.'); e.code = j.error; throw e; }
        return j;
      });
    });
  }

  function act(btn, fn) {
    if (busy) return;
    busy = true; if (btn) btn.disabled = true; say('Working on it…');
    fn().then(function (msg) { say(msg || ''); return load(); })
      .catch(function (e) { say(e.message, true); })
      .then(function () { busy = false; if (btn) btn.disabled = false; });
  }

  // ------------------------------------------------------------ render
  function render() {
    var s = state.settings || {};
    $('pr-killed').hidden = !state.killed;
    $('pr-terms').textContent = s.terms || '';
    $('pr-balance').textContent = (state.balance_credits || 0).toLocaleString() + ' credits';
    var daily = s.daily_credits || 0;
    $('pr-today').textContent = daily
      ? (s.used_today_credits || 0) + ' of ' + daily + ' credits used today (' + (s.left_today_credits || 0) + ' left)'
      : 'Set a daily budget to start.';
    var meter = $('pr-meter'); meter.max = Math.max(1, daily); meter.value = Math.min(daily, s.used_today_credits || 0);
    if (document.activeElement && box.contains(document.activeElement) && document.activeElement.tagName === 'INPUT') { /* keep typing */ }
    else {
      if (s.daily_usd) { $('pr-daily').value = s.daily_usd; $('pr-daily-range').value = s.daily_usd; }
      $('pr-cap').value = s.task_cap_credits || '';
      $('pr-auto').value = s.auto_approve_credits || 0;
    }
    $('pr-paused').hidden = !s.paused;
    var m = s.messages || {};
    $('pr-msgs').textContent = (m.used || 0) + ' of ' + (m.allowance || 0) + ' free producer messages used this month.';

    var list = $('pr-tasks'); list.textContent = '';
    (state.tasks || []).forEach(function (t) { list.appendChild(taskCard(t)); });
    if (!(state.tasks || []).length) list.appendChild(el('li', 'muted small', 'No tasks yet. Leave one above.'));

    var al = $('pr-alerts'); al.textContent = '';
    (state.alerts || []).slice(0, 5).forEach(function (a) { al.appendChild(el('li', 'pr-alert', a.text)); });

    var lg = $('pr-log'); lg.textContent = '';
    (state.log || []).forEach(function (r) {
      var li = el('li');
      li.appendChild(el('time', 'muted', (r.created_at || '').replace('T', ' ').slice(0, 16)));
      li.appendChild(document.createTextNode(' ' + (r.text || r.event) + (r.credits ? ' (' + r.credits + ' credits)' : '')));
      lg.appendChild(li);
    });

    var live = (state.tasks || []).some(function (t) { return ['approved', 'running', 'waiting'].indexOf(t.status) >= 0; });
    clearTimeout(timer);
    if (live) timer = setTimeout(load, 30000);
  }

  function taskCard(t) {
    var li = el('li', 'pr-task st-' + t.status);
    var head = el('div', 'pr-task-head');
    head.appendChild(el('b', '', NAMES[t.producer] || 'Producer'));
    head.appendChild(el('span', 'pr-status', STATUS[t.status] || t.status));
    li.appendChild(head);
    li.appendChild(el('p', 'pr-brief', t.brief));
    var price = el('p', 'small');
    price.textContent = 'Quote: ' + t.total_credits + ' credits (' + usd(t.price_usd_range) + ')' +
      (t.spent_credits ? '. Spent so far: ' + t.spent_credits : '') + (t.refunded_credits ? '. Credited back: ' + t.refunded_credits : '');
    li.appendChild(price);
    if (t.message) li.appendChild(el('p', 'muted small', t.message));
    var ol = el('ol', 'pr-steps');
    (t.steps || []).forEach(function (st) {
      var s = el('li');
      s.appendChild(el('span', '', st.title + ' · ' + st.credits + ' credits · ' + st.status));
      if (st.output) {
        var d = el('details'); d.appendChild(el('summary', '', 'Read the draft'));
        d.appendChild(el('pre', 'pr-out', st.output));
        var cp = el('button', 'btn-mini', 'Copy'); cp.type = 'button';
        cp.addEventListener('click', function () { if (navigator.clipboard) navigator.clipboard.writeText(st.output); cp.textContent = 'Copied'; });
        d.appendChild(cp); s.appendChild(d);
      }
      ol.appendChild(s);
    });
    li.appendChild(ol);
    (t.dropped || []).forEach(function (d) { li.appendChild(el('p', 'muted small', 'Left out: ' + d.title + ' (' + d.why + ')')); });
    var row = el('div', 'btn-row');
    if (t.status === 'quoted') {
      var ok = el('button', 'btn-big-solid', 'Approve ' + t.total_credits + ' credits'); ok.type = 'button';
      ok.addEventListener('click', function () { act(ok, function () { return req('POST', '/v2/agents/tasks/' + t.id + '/approve').then(function () { return 'Approved. Your producer starts on the next run, usually within a minute.'; }); }); });
      row.appendChild(ok);
    }
    if (['quoted', 'approved', 'running', 'waiting', 'over_cap'].indexOf(t.status) >= 0) {
      var no = el('button', 'btn-top', 'Cancel'); no.type = 'button';
      no.addEventListener('click', function () { act(no, function () { return req('POST', '/v2/agents/tasks/' + t.id + '/cancel').then(function () { return 'Cancelled. Nothing more will be charged.'; }); }); });
      row.appendChild(no);
    }
    if (row.childNodes.length) li.appendChild(row);
    return li;
  }

  // ------------------------------------------------------------ wire up
  function load() {
    return req('GET', '/v2/agents').then(function (j) {
      if (!j.enabled) { box.hidden = true; return; }
      state = j; box.hidden = false; render();
    }).catch(function () { box.hidden = true; });
  }

  $('pr-daily-range').addEventListener('input', function () { $('pr-daily').value = this.value; });
  $('pr-daily').addEventListener('input', function () { $('pr-daily-range').value = this.value; });
  $('pr-save').addEventListener('click', function () {
    var b = { daily_usd: Number($('pr-daily').value) };
    var cap = $('pr-cap').value, auto = $('pr-auto').value;
    if (cap !== '') b.task_cap_credits = Number(cap);
    if (auto !== '') b.auto_approve_credits = Number(auto);
    act(this, function () { return req('POST', '/v2/agents/settings', b).then(function () { return 'Saved. Your producers will stay inside these limits.'; }); });
  });
  $('pr-resume').addEventListener('click', function () {
    act(this, function () { return req('POST', '/v2/agents/settings', { paused: false }).then(function () { return 'Resumed. Stopped tasks stay stopped; leave a new task to keep going.'; }); });
  });
  $('pr-stop').addEventListener('click', function () {
    act(this, function () { return req('POST', '/v2/agents/stop').then(function (r) { return 'Stopped. ' + r.stopped_tasks + ' open task(s) stopped. No new work will start.'; }); });
  });
  $('pr-quote').addEventListener('click', function () {
    var brief = $('pr-brief').value.trim();
    if (!brief) { say('Tell your producer what you need.', true); return; }
    act(this, function () {
      return req('POST', '/v2/agents/tasks', { producer: $('pr-who').value, brief: brief }).then(function (t) {
        $('pr-brief').value = '';
        if (t.status === 'approved') return 'Auto-approved under your limit: ' + t.total_credits + ' credits.';
        if (t.status === 'over_cap') return 'That quote (' + t.total_credits + ' credits) is over your per-task limit, so it won\'t run.';
        return 'Quote ready: ' + t.total_credits + ' credits. Nothing runs until you approve it.';
      });
    });
  });
  $('pr-bible-open').addEventListener('toggle', function () {
    if (!this.open) return;
    req('GET', '/v2/agents/bible').then(function (b) { $('pr-bible').value = b.text || ''; }).catch(function () {});
  });
  $('pr-bible-save').addEventListener('click', function () {
    var text = $('pr-bible').value;
    act(this, function () { return req('POST', '/v2/agents/bible', { text: text }).then(function (r) { return 'Show bible saved (version ' + r.version + ').'; }); });
  });
  $('pr-chat-send').addEventListener('click', function () {
    var msg = $('pr-chat-in').value.trim();
    if (!msg) return;
    var out = $('pr-chat-out');
    act(this, function () {
      return req('POST', '/v2/agents/chat', { producer: $('pr-chat-who').value, message: msg }).then(function (r) {
        out.textContent = r.reply; $('pr-chat-in').value = ''; return '';
      });
    });
  });

  root.MWAuth.ready.then(load);
  if (root.MWAuth.onChange) root.MWAuth.onChange(load);
})(window);
