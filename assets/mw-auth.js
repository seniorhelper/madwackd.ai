/* Madwackd Studio shared sign-in state for app pages (/dashboard/, /studio-board/).
   Watches the same Firebase sign-in as /studio/ (same site, so signing in there signs you in here) and sets:
     window.MW_API_BASE   API origin from /assets/config.js
     window.MW_ID_TOKEN   Firebase ID token (kept fresh), "" when signed out
     window.MW_USER_TIER  free | starter | pro | studio  (DISPLAY ONLY; the server enforces every limit)
     window.MW_TURNSTILE  () => Promise<token> for the human check on paid actions
   MWAuth.ready resolves once the first answer is known (signed in or not, never rejects, 8 s cap).
   MWAuth.onChange(fn) runs fn after a later sign-in / sign-out. Needs /assets/config.js loaded first. */
(function (root) {
  'use strict';
  var C = root.MW_CONFIG || {};
  var API = String(C.apiBase || '').trim().replace(/\/+$/, '');
  var FB = C.firebase || {};
  var TS_KEY = String(C.turnstileSiteKey || '').trim();
  var FB_VER = '10.12.2';
  var PLAN_TIER = { starter: 'starter', pro: 'pro', studio: 'studio', creators_beta: 'studio', business: 'studio', agency: 'studio', white_label: 'studio', whitelabel: 'studio' };
  var LIVE_STATUS = ['', 'active', 'trialing', 'past_due'];

  var state = { user: null, email: '', tier: 'free', boardTier: 'anon', known: false };
  var listeners = [];
  var resolveReady;
  var ready = new Promise(function (r) { resolveReady = r; });

  root.MW_API_BASE = API;
  root.MW_ID_TOKEN = '';
  root.MW_USER_TIER = 'free';

  function loadScript(src) {
    return new Promise(function (res, rej) {
      var s = document.createElement('script'); s.src = src; s.async = true; s.onload = res; s.onerror = rej; document.head.appendChild(s);
    });
  }
  function getJSON(path, tok) {
    return fetch(API + path, { headers: { Authorization: 'Bearer ' + tok }, credentials: 'omit' }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) { j._status = r.status; return j; });
    });
  }

  /* Tier from the server: /v2/studio/access (Studio board backend) first, else plan + status from /v2/me. */
  function lookupTier(tok) {
    return getJSON('/v2/studio/access', tok).then(function (a) {
      if (a._status === 200 && a.tier) return { board: a.tier, owner: a.tier === 'admin' };
      return getJSON('/v2/me', tok).then(function (m) {
        if (m._status !== 200 || !m.signed_up || m.locked) return { board: m._status === 200 ? 'free' : 'anon', owner: false };
        var t = LIVE_STATUS.indexOf(String(m.plan_status || '')) > -1 ? (PLAN_TIER[String(m.plan || '').toLowerCase()] || 'free') : 'free';
        return { board: t, owner: !!m.owner };
      });
    }).catch(function () { return { board: 'anon', owner: false }; });
  }

  function settle(user, tok, info) {
    state.user = user; state.email = user ? (user.email || '') : '';
    state.boardTier = info.board;
    // The Creator Dashboard knows free/starter/pro/studio. Owner and Studio-family plans use the studio set.
    state.tier = info.owner || info.board === 'admin' ? 'studio' : (PLAN_TIER[info.board] || 'free');
    root.MW_ID_TOKEN = tok || '';
    root.MW_USER_TIER = state.tier;
    paint();
    if (!state.known) { state.known = true; resolveReady(api); return; }
    listeners.forEach(function (fn) { try { fn(api); } catch (e) { /* keep going */ } });
  }

  function start() {
    if (!API || !FB.apiKey || !FB.projectId) { settle(null, '', { board: 'anon' }); return; }
    var base = 'https://www.gstatic.com/firebasejs/' + FB_VER + '/';
    loadScript(base + 'firebase-app-compat.js').then(function () { return loadScript(base + 'firebase-auth-compat.js'); }).then(function () {
      var fb = root.firebase;
      if (!fb.apps.length) fb.initializeApp(FB);
      var auth = fb.auth();
      var lastUid = null;
      // Fires on sign-in, sign-out and every automatic hourly token refresh.
      auth.onIdTokenChanged(function (u) {
        if (!u) { lastUid = null; settle(null, '', { board: 'anon' }); return; }
        u.getIdToken().then(function (tok) {
          if (state.known && u.uid === lastUid) { root.MW_ID_TOKEN = tok; return; }   // refresh only
          lastUid = u.uid;
          return lookupTier(tok).then(function (info) { settle(u, tok, info); });
        }).catch(function () { settle(null, '', { board: 'anon' }); });
      });
      api.signOut = function () { return auth.signOut(); };
    }).catch(function () { settle(null, '', { board: 'anon' }); });
    setTimeout(function () { if (!state.known) settle(null, '', { board: 'anon' }); }, 8000);
  }

  /* ---------- human check (Cloudflare Turnstile), run only when a paid action asks for it ---------- */
  var tsLoad = null, tsWidget = null, tsPending = null, tsBox = null;
  function finish(ok, val) {
    var p = tsPending; tsPending = null;
    if (tsBox) tsBox.hidden = true;
    if (p) { clearTimeout(p.timer); if (ok) p.res(val); else p.rej(new Error(val)); }
  }
  root.MW_TURNSTILE = function () {
    if (!TS_KEY) return Promise.resolve('');
    tsLoad = tsLoad || loadScript('https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit');
    return tsLoad.then(function () {
      return new Promise(function (res, rej) {
        if (tsPending) finish(false, 'The human check was restarted.');
        if (!tsBox) {
          tsBox = document.createElement('div');
          tsBox.setAttribute('role', 'dialog'); tsBox.setAttribute('aria-label', 'Quick human check');
          tsBox.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:2147483000;background:#15121F;border:1px solid #3a3550;border-radius:10px;padding:10px;';
          document.body.appendChild(tsBox);
          tsWidget = root.turnstile.render(tsBox, {
            sitekey: TS_KEY, appearance: 'interaction-only', execution: 'execute', action: 'studio',
            callback: function (t) { finish(true, t); },
            'error-callback': function () { finish(false, 'The human check failed. Please try again.'); },
            'expired-callback': function () { finish(false, 'The human check expired. Please try again.'); }
          });
        }
        tsBox.hidden = false;
        tsPending = { res: res, rej: rej, timer: setTimeout(function () { finish(false, 'The human check timed out. Please try again.'); }, 90000) };
        try { root.turnstile.reset(tsWidget); root.turnstile.execute(tsWidget); } catch (e) { finish(false, 'The human check could not start.'); }
      });
    }, function () { throw new Error("The human check couldn't load. Check your connection."); });
  };

  /* ---------- account chip: fills any [data-mw-account] element ---------- */
  function paint() {
    var slots = document.querySelectorAll('[data-mw-account]');
    for (var i = 0; i < slots.length; i++) {
      var el = slots[i]; el.textContent = '';
      if (!state.known) continue;
      if (state.user) {
        var who = document.createElement('span'); who.className = 'mw-acct-who'; who.textContent = state.email; who.title = 'Signed in';
        var out = document.createElement('button'); out.type = 'button'; out.className = el.getAttribute('data-mw-btn') || 'btn-top'; out.textContent = 'Sign out';
        out.addEventListener('click', function () { if (api.signOut) api.signOut(); });
        el.appendChild(who); el.appendChild(out);
      } else {
        // /studio/ has both sign-in options (Google, or an emailed sign-in link) and sends you back here afterwards.
        var back = ['/dashboard/', '/studio-board/', '/creator-studio/', '/owner/', '/my-studio/'].indexOf(location.pathname) > -1 ? '?return=' + encodeURIComponent(location.pathname) : '';
        var a = document.createElement('a'); a.className = el.getAttribute('data-mw-btn') || 'btn-top'; a.href = '/studio/' + back + '#live';
        a.textContent = 'Sign in'; a.title = 'Continue with Google or email';
        var hint = document.createElement('span'); hint.className = 'mw-acct-who'; hint.textContent = 'Google or email';
        el.appendChild(hint); el.appendChild(a);
      }
    }
  }

  var api = {
    ready: ready,
    state: state,
    paint: paint,
    signOut: null,
    onChange: function (fn) { listeners.push(fn); }
  };
  root.MWAuth = api;
  start();
})(window);
