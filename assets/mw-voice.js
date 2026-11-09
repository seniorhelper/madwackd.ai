/* MWVoice: one speaker at a time across the site (the Genie stage, Producer Z's chat guide, anything else that talks).
   - claim(owner, stopFn): call right before you start audio; whoever was talking is stopped (their stopFn runs) and any
     browser speechSynthesis is cancelled. release(owner) when you finish.
   - hold(owner, on): "I'm performing, others stay quiet" (the stage holds while its show plays with sound on).
     held(me) is true while someone else holds; check it before speaking and wait for the "mw:voice-free" event.
   Plain JS, no libraries. Safe to load more than once. */
(function () {
  "use strict";
  if (window.MWVoice) return;
  var cur = null, holds = {};
  function emit(name, detail) { try { window.dispatchEvent(new CustomEvent(name, { detail: detail || {} })); } catch (e) { /* old browser */ } }
  function hush() { try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) { /* none */ } }
  window.MWVoice = {
    claim: function (owner, stop) {
      if (cur && cur.owner !== owner && cur.stop) { try { cur.stop(); } catch (e) { /* ignore */ } }
      if (!cur || cur.owner !== owner) hush();
      cur = { owner: owner, stop: stop || null };
      emit("mw:voice", { owner: owner });
    },
    release: function (owner) { if (cur && cur.owner === owner) { cur = null; emit("mw:voice", { owner: "" }); } },
    stopAll: function () { if (cur && cur.stop) { try { cur.stop(); } catch (e) { /* ignore */ } } cur = null; hush(); },
    hold: function (owner, on) {
      var was = this.held("");
      if (on) holds[owner] = 1; else delete holds[owner];
      if (was && !this.held("")) emit("mw:voice-free", {});
    },
    held: function (me) { return Object.keys(holds).some(function (k) { return k !== me; }); },
    speaking: function () { return cur ? cur.owner : ""; }
  };
})();
