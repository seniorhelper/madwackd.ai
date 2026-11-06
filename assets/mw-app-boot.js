/* Starts an app page only after sign-in is known (see mw-auth.js), so the page sees the right plan on first paint.
   Use on the script tag:
     data-load="/assets/a.js /assets/b.js"   scripts to run, in order, once sign-in is known
     data-mode="reload"                      reload the page after a later sign-in / sign-out (Creator Dashboard)
     data-mode="board"                       call MWStudioBoard.boot() now and again after sign-in / sign-out */
(function (root) {
  'use strict';
  var me = document.currentScript;
  var list = String((me && me.getAttribute('data-load')) || '').split(/\s+/).filter(function (s) { return /^\/assets\/[\w.\-\/]+(\?v=[\w.\-]+)?$/.test(s); });
  var mode = (me && me.getAttribute('data-mode')) || '';
  if (mode === 'board') root.MW_STUDIO_MANUAL_BOOT = true;

  function loadInOrder(srcs) {
    return srcs.reduce(function (p, src) {
      return p.then(function () {
        return new Promise(function (res) {
          var s = document.createElement('script'); s.src = src; s.async = false;
          s.onload = res; s.onerror = res;   // one missing extra (e.g. Producer Z) must not stop the page
          document.body.appendChild(s);
        });
      });
    }, Promise.resolve());
  }
  function domReady() {
    return new Promise(function (res) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', res); else res(); });
  }

  var auth = root.MWAuth;
  var known = auth ? auth.ready : Promise.resolve(null);
  Promise.all([known, domReady()]).then(function () {
    if (mode === 'board' && root.MWStudioBoard) root.MWStudioBoard.boot();
    return loadInOrder(list);
  }).then(function () {
    if (auth) auth.paint();
    if (!auth) return;
    auth.onChange(function () {
      if (mode === 'reload') root.location.reload();
      else if (mode === 'board' && root.MWStudioBoard) { root.MWStudioBoard.boot(); auth.paint(); }
    });
  });
})(window);
