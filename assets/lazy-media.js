/* Posters and the showcase reel load only when they are about to be on screen,
   so the first paint is not competing with ~1.5 MB of poster images and a 2.8 MB video. */
(function () {
  /* Pro Creator Studio demo: load its script when it is near the screen, on first touch/scroll, or 10 s after load. */
  var pcs = document.getElementById('pcs'), psDone = false;
  function loadStudio() {
    if (psDone) return; psDone = true;
    var s = document.createElement('script'); s.src = '/assets/pro-studio.js?v=20261108c'; document.body.appendChild(s);
  }
  if (pcs) {
    if ('IntersectionObserver' in window) {
      var po = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { po.disconnect(); loadStudio(); } }, { rootMargin: '200px 0px' });
      po.observe(pcs);
    }
    var later = function () { setTimeout(loadStudio, 10000); };
    if (document.readyState === 'complete') later(); else window.addEventListener('load', later);
  }
  var vids = [].slice.call(document.querySelectorAll('video[data-poster]'));
  var reel = document.getElementById('spot');
  var calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function poster(v) { var p = v.getAttribute('data-poster'); if (p) { v.setAttribute('poster', p); v.removeAttribute('data-poster'); } }
  if (!('IntersectionObserver' in window)) { vids.forEach(poster); if (reel && !calm) { var q = reel.play(); if (q && q.catch) q.catch(function () {}); } return; }
  var near = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { poster(e.target); near.unobserve(e.target); } });
  }, { rootMargin: '900px 0px' });
  vids.forEach(function (v) { near.observe(v); });
  if (reel && !calm) {
    var seen = false;
    new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { seen = true; var p = reel.play(); if (p && p.catch) p.catch(function () {}); }
        else if (seen) { reel.pause(); }
      });
    }, { threshold: 0.25 }).observe(reel);
  }
})();
