/* Madwackd One Launch button (BETA). Pure helpers + a small API client; the Publish desk in pro-studio.js draws the UI.
   No secrets here: the posting service key lives only on the API server. Safe to load when signed out. */
(function (root) {
  'use strict';
  var LABEL = { youtube: 'YouTube', tiktok: 'TikTok', instagram: 'Instagram', facebook: 'Facebook', x: 'X', linkedin: 'LinkedIn', pinterest: 'Pinterest', threads: 'Threads' };
  var ORDER = ['youtube', 'tiktok', 'instagram', 'facebook', 'x', 'linkedin', 'pinterest', 'threads'];
  var SITE = { youtube: 'yt', tiktok: 'tt', instagram: 'ig', facebook: 'fb', x: 'x', linkedin: 'li', pinterest: 'pin', threads: 'th' }; /* API id -> Publish desk switch id */
  var TEXT = { coming_soon: 'Not available', not_connected: 'Not connected', connected: 'Connected', sending: 'Sending', queued: 'Queued', posted: 'Posted', failed: 'Failed' };

  /* status payload (or null) -> [{id, label, state, text, tone}]; tone drives the light colour: off | warn | on | bad */
  function lights(status) {
    var by = {};
    ((status && status.platforms) || []).forEach(function (p) { by[p.platform] = p.state; });
    return ORDER.map(function (id) {
      var st = by[id] || 'coming_soon';
      return { id: id, label: LABEL[id], state: st, text: TEXT[st] || 'Not available', tone: st === 'connected' ? 'on' : st === 'not_connected' ? 'warn' : 'off' };
    });
  }

  /* what can the Launch button do right now? Returns {ok, why}. */
  function canLaunch(o) {
    o = o || {};
    if (!o.signedIn) return { ok: false, why: 'Sign in with a paid plan to use it.' };
    if (!o.status || o.status.state !== 'ready') return { ok: false, why: 'Not switched on. Use the copy-and-open kit below.' };
    if (!o.jobId) return { ok: false, why: 'Pick a finished video.' };
    if (!String(o.caption || '').trim()) return { ok: false, why: 'Write a caption first.' };
    if (String(o.caption).length > 2200) return { ok: false, why: 'Caption is over 2,200 characters.' };
    if (!o.platforms || !o.platforms.length) return { ok: false, why: 'Switch on at least one connected feed.' };
    return { ok: true, why: '' };
  }

  /* only feeds that are connected AND switched on in the patch bay */
  function pickPlatforms(status, socials) {
    return lights(status).filter(function (l) { return l.state === 'connected' && socials && socials[SITE[l.id]] && socials[SITE[l.id]].on; }).map(function (l) { return l.id; });
  }

  function newKey() {
    var a = new Uint8Array(12);
    (root.crypto || {}).getRandomValues ? root.crypto.getRandomValues(a) : a.forEach(function (_, i) { a[i] = Math.floor(Math.random() * 256); });
    return Array.prototype.map.call(a, function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
  }

  function apiBase() { var C = root.MW_CONFIG || {}; return String(C.apiBase || '').replace(/\/+$/, ''); }

  function call(method, path, body, fetchFn) {
    var base = apiBase(), tok = root.MW_ID_TOKEN || '';
    if (!base || !tok) return Promise.reject({ status: 0, message: 'Sign in first.' });
    return (fetchFn || root.fetch)(base + path, {
      method: method, credentials: 'omit',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tok },
      body: body ? JSON.stringify(body) : undefined
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok) throw { status: r.status, code: j.error || '', message: j.message || 'Something went wrong.' };
        return j;
      });
    });
  }

  root.MWLaunch = {
    lights: lights, canLaunch: canLaunch, pickPlatforms: pickPlatforms, newKey: newKey, LABEL: LABEL, ORDER: ORDER,
    status: function (f) { return call('GET', '/v2/social/status', null, f); },
    stats: function (f) { return call('GET', '/v2/social/stats', null, f); },
    connect: function (platforms, f) { return call('POST', '/v2/social/connect', { platforms: platforms || [], return_to: root.location ? root.location.origin + '/pro-studio/' : '' }, f); },
    publish: function (b, f) { return call('POST', '/v2/publish', b, f); },
    post: function (id, f) { return call('GET', '/v2/publish/' + encodeURIComponent(id), null, f); },
    jobs: function (f) { return call('GET', '/v2/jobs', null, f); }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.MWLaunch;
})(typeof window !== 'undefined' ? window : globalThis);
