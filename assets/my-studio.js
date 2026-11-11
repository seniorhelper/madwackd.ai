/* Private Custom Creator Studio. All data comes from GET/POST /v2/me/creator-dash, which only answers for
   accounts pinned on the server (uid + allow-listed, verified email). This file holds no names or emails, and
   it renders with textContent only. Hiding #dash is cosmetic; the server is the gate. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var TEAM = [
    { id: 'producer', name: 'Producer', job: 'Turns a wish into a shot list, quote and render plan.', href: '/dashboard/', tool: 'Creator Dashboard' },
    { id: 'publicist', name: 'Publicist', job: 'Writes the pitch, captions and the line people repeat.', href: '/dashboard/', tool: 'Ask the Producer' },
    { id: 'social', name: 'Social Editor', job: 'Plans posts across your channels on the board.', href: '/studio-board/', tool: 'Studio Board' },
    { id: 'analyst', name: 'Analyst', job: 'Shows what each render cost on your statement.', href: '/dashboard/', tool: 'Statement' },
    { id: 'talking-z', name: 'Talking Z', job: 'Voice notes and quick talk-throughs with your producer.', href: '/dashboard/', tool: 'Creator Dashboard' }
  ];
  var STATUS = ['wish', 'brewing', 'done'];
  var dash = null, stamp = '', saving = false, again = false;

  function api(method, body) {
    var base = String(window.MW_API_BASE || (window.MW_CONFIG && window.MW_CONFIG.apiBase) || '').replace(/\/$/, '');
    var tok = window.MW_ID_TOKEN || '';
    if (!base || !tok) return Promise.resolve({ status: 401, body: {} });
    return fetch(base + '/v2/me/creator-dash', {
      method: method, credentials: 'omit', cache: 'no-store',
      headers: { 'Authorization': 'Bearer ' + tok, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    }).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { status: r.status, body: j }; }); })
      .catch(function () { return { status: 0, body: {} }; });
  }

  function gate(msg, showSignIn) {
    dash = null; $('dash').hidden = true; $('gate').hidden = false;
    $('gate-msg').textContent = msg; $('gate-signin').hidden = !showSignIn;
  }

  function load() {
    var st = window.MWAuth && window.MWAuth.state;
    if (!st || !st.user) return gate('Sign in with the account this studio belongs to.', true);
    $('gate-msg').textContent = 'Opening your studio…';
    api('GET').then(function (r) {
      if (r.status === 200 && r.body && r.body.dash) return show(r.body);
      if (r.status === 401) return gate('Your sign-in expired. Please sign in again.', true);
      if (r.status === 403) return gate('This account doesn’t have a private studio here. If that’s wrong, sign out and use the right account.', false);
      gate('We couldn’t reach the studio just now. Try again in a minute.', false);
    });
  }

  function show(res) {
    dash = res.dash; stamp = dash.updated_at || '';
    if (/^#[0-9a-fA-F]{6}$/.test(dash.brand_color)) document.documentElement.style.setProperty('--brand', dash.brand_color);
    $('who-name').textContent = dash.display_name;
    $('who-tag').textContent = dash.tagline || 'Tell Genie what you want to make. Poof, it lands on your board.';
    $('tool-owner').hidden = !res.owner;
    $('gate').hidden = true; $('dash').hidden = false;
    document.title = dash.display_name + '’s Studio | Madwackd';
    paintBoard(); paintTeam(); paintKit();
  }

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

  function paintBoard() {
    STATUS.forEach(function (s) {
      var ul = $('col-' + s); ul.textContent = '';
      var items = dash.wishes.filter(function (w) { return w.status === s; });
      if (!items.length) ul.appendChild(el('li', 'ms-empty', s === 'wish' ? 'No wishes yet. Make one above.' : 'Nothing here yet.'));
      items.forEach(function (w) {
        var li = el('li'); li.appendChild(el('div', '', w.text));
        var acts = el('div', 'ms-acts'), i = STATUS.indexOf(s);
        if (i > 0) acts.appendChild(btn('← ' + STATUS[i - 1], function () { w.status = STATUS[i - 1]; paintBoard(); save(); }));
        if (i < 2) acts.appendChild(btn(STATUS[i + 1] + ' →', function () { w.status = STATUS[i + 1]; paintBoard(); save(); }));
        acts.appendChild(btn('Remove', function () { dash.wishes = dash.wishes.filter(function (x) { return x !== w; }); paintBoard(); save(); }));
        li.appendChild(acts); ul.appendChild(li);
      });
    });
  }
  function newId() {
    var b = new Uint8Array(5); window.crypto.getRandomValues(b);
    return Array.prototype.map.call(b, function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
  }
  function btn(label, fn) { var b = el('button', '', label); b.type = 'button'; b.addEventListener('click', fn); return b; }

  function paintTeam() {
    var ul = $('team'); ul.textContent = '';
    TEAM.forEach(function (t) {
      var on = dash.team.indexOf(t.id) > -1, li = el('li'), b = el('button');
      b.type = 'button'; b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.appendChild(el('b', '', t.name)); b.appendChild(el('span', '', t.job));
      b.appendChild(el('span', on ? 'ms-on' : '', on ? 'On your team' : 'Tap to add'));
      b.addEventListener('click', function () {
        dash.team = on ? dash.team.filter(function (x) { return x !== t.id; }) : dash.team.concat([t.id]);
        paintTeam(); save();
      });
      var a = el('a', '', 'Open ' + t.tool + ' →'); a.href = t.href;
      li.appendChild(b); li.appendChild(a); ul.appendChild(li);
    });
  }

  function addChannel(c) {
    var node = $('tpl-ch').content.firstElementChild.cloneNode(true);
    node.querySelector('select').value = (c && c.platform) || 'youtube';
    node.querySelector('input').value = (c && c.handle) || '';
    node.querySelector('button').addEventListener('click', function () { node.remove(); });
    $('k-channels').appendChild(node);
  }

  function paintKit() {
    $('k-name').value = dash.display_name; $('k-tag').value = dash.tagline;
    $('k-color').value = /^#[0-9a-fA-F]{6}$/.test(dash.brand_color) ? dash.brand_color : '#8B3DFF';
    $('k-goals').value = dash.goals.join('\n'); $('k-notes').value = dash.notes;
    $('k-channels').textContent = ''; dash.channels.forEach(addChannel);
  }

  function readKit() {
    dash.display_name = $('k-name').value.trim() || dash.display_name;
    dash.tagline = $('k-tag').value.trim(); dash.brand_color = $('k-color').value;
    dash.goals = $('k-goals').value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean).slice(0, 10);
    dash.notes = $('k-notes').value;
    dash.channels = Array.prototype.map.call($('k-channels').children, function (n) {
      return { platform: n.querySelector('select').value, handle: n.querySelector('input').value.trim() };
    }).filter(function (c) { return c.handle; });
  }

  function save() {
    if (!dash) return;
    if (saving) { again = true; return; }
    saving = true; $('save-state').textContent = 'Saving…';
    var body = { base_updated_at: stamp };
    ['display_name', 'tagline', 'brand_color', 'notes', 'goals', 'channels', 'team', 'wishes'].forEach(function (k) { body[k] = dash[k]; });
    api('POST', body).then(function (r) {
      saving = false;
      if (r.status === 200 && r.body.dash) {
        stamp = r.body.dash.updated_at;
        $('save-state').textContent = 'Saved';
        if (again) { again = false; save(); }
        return;
      }
      again = false;
      if (r.status === 409) { $('save-state').textContent = 'Changed in another tab. Reloading…'; return load(); }
      if (r.status === 401 || r.status === 403) return load();
      $('save-state').textContent = (r.body && r.body.message) || 'Not saved. Check your connection and try again.';
    });
  }

  $('wish-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var t = $('wish-text').value.trim();
    if (!t || !dash) return;
    dash.wishes.unshift({ id: newId(), text: t.slice(0, 500), status: 'wish', at: new Date().toISOString() });
    dash.wishes = dash.wishes.slice(0, 50);
    $('wish-text').value = ''; paintBoard(); save();
  });
  $('kit').addEventListener('submit', function (e) {
    e.preventDefault(); readKit(); show({ dash: dash, owner: !$('tool-owner').hidden }); save();
  });
  $('k-add-ch').addEventListener('click', function () { if ($('k-channels').children.length < 8) addChannel(null); });

  if (!window.MWAuth) return gate('Sign-in didn’t load. Refresh the page.', false);
  window.MWAuth.ready.then(load);
  window.MWAuth.onChange(load);
})();
