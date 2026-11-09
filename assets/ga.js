// Google Analytics (Google tag GTM-K22RN5B9). Loaded from a file so the strict CSP needs no inline script.
window.dataLayer = window.dataLayer || [];
function gtag(){ dataLayer.push(arguments); }
gtag('js', new Date());
(function () {
  /* The tag (about 180 KB) starts after the page has loaded, on first interaction or 4.5 s after load,
     whichever comes first. Events queued in dataLayer before then are kept and sent when it starts. */
  var started = false;
  function start() {
    if (started) return; started = true;
    ['pointerdown', 'keydown', 'scroll', 'touchstart'].forEach(function (e) { window.removeEventListener(e, start); });
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtm.js?id=GTM-K22RN5B9';
    document.head.appendChild(s);
  }
  ['pointerdown', 'keydown', 'scroll', 'touchstart'].forEach(function (e) { window.addEventListener(e, start, { passive: true, once: true }); });
  function arm() { setTimeout(start, 4500); }
  if (document.readyState === 'complete') arm(); else window.addEventListener('load', arm);
})();
