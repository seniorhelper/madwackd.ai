/* Video Vault: category filter + lightbox player (plays with sound). */
(function () {
  "use strict";
  var box = document.getElementById("vbox"), v = document.getElementById("vbox-v"), t = document.getElementById("vbox-t");
  var cards = [].slice.call(document.querySelectorAll(".vcard")), last = null;
  [].forEach.call(document.querySelectorAll(".vf button"), function (b, _, all) {
    b.addEventListener("click", function () {
      var f = b.getAttribute("data-f");
      [].forEach.call(document.querySelectorAll(".vf button"), function (x) { x.setAttribute("aria-pressed", String(x === b)); });
      cards.forEach(function (c) { c.hidden = !(f === "all" || c.getAttribute("data-cat") === f); c.classList.toggle("vbig", f === "all" && c === cards[0]); });
    });
  });
  function close() { v.pause(); v.removeAttribute("src"); v.load(); if (box.open) box.close(); if (last) last.focus(); }
  cards.forEach(function (c) {
    c.addEventListener("click", function () {
      last = c; t.textContent = c.getAttribute("data-title");
      v.src = c.getAttribute("data-src"); v.muted = false;
      if (box.showModal) box.showModal(); else box.setAttribute("open", "");
      var p = v.play(); if (p && p.catch) p.catch(function () { /* user can press play */ });
    });
  });
  document.getElementById("vbox-x").addEventListener("click", close);
  box.addEventListener("close", function () { v.pause(); });
  box.addEventListener("click", function (e) { if (e.target === box) close(); });
})();
