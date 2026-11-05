/* Madwackd Studio public config. PUBLIC values only (Firebase web config and the Turnstile SITE key are
   meant to be public). Never put a secret key here. Leave apiBase empty to keep /studio/ in demo mode. */
window.MW_CONFIG = {
  apiBase: "https://madwackd-studio-api-k5fhrvx7kq-uc.a.run.app", // e.g. "https://api.madwackd.ai" or the Cloud Run URL
  firebase: {                  // Firebase console > Project settings > Your apps > Web app config
    apiKey: "AIzaSyDNSqjDqD5jQBUXQt9h3j1vwiv2TWgAGYY",
    authDomain: "madwackd-studio.firebaseapp.com",
    projectId: "madwackd-studio",
    appId: "1:643956245063:web:a94552d287ac5cf4c96762"
  },
  turnstileSiteKey: ""         // Cloudflare Turnstile site key (public)
};
