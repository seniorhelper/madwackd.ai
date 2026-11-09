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

/* Conversion events for ads (GA4 G-G7JZJY1KQ2 through the Google tag above). No personal data in any event.
   buy_click: a link to /studio/?buy=<item>. phone_click: a tel: link. Leads, checkouts, purchases and sign-ups
   are sent by site.js, book.js, genie.js and studio-live.js with window.mwTrack. */
window.mwTrack = function (name, params) { try { gtag('event', name, params || {}); } catch (e) { /* never block the page */ } };
document.addEventListener('click', function (e) {
  var a = e.target && e.target.closest ? e.target.closest('a[href]') : null; if (!a) return;
  var h = a.getAttribute('href') || '', m = h.match(/[?&]buy=([a-z0-9_]{2,40})/);
  if (m) window.mwTrack('buy_click', { item_id: m[1], link_page: location.pathname });
  else if (/^tel:/.test(h)) window.mwTrack('phone_click', { link_page: location.pathname });
}, true);
