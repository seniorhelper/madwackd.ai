/* Madwackd Studio public config. PUBLIC values only (Firebase web config and the Turnstile SITE key are
   meant to be public). Never put a secret key here. Leave apiBase empty to keep /studio/ in demo mode. */
window.MW_CONFIG = {
  apiBase: "",                 // e.g. "https://api.madwackd.ai" or the Cloud Run URL
  firebase: {                  // Firebase console > Project settings > Your apps > Web app config
    apiKey: "",
    authDomain: "",
    projectId: "",
    appId: ""
  },
  turnstileSiteKey: ""         // Cloudflare Turnstile site key (public)
};
