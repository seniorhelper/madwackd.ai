/* Madwackd Studio v1.3 - menu, forms, small helpers */
(function () {
  "use strict";
  // Mobile menu
  var btn = document.querySelector(".menu-btn");
  var nav = document.getElementById("site-nav");
  if (btn && nav) {
    btn.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") { nav.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("open")) { nav.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); btn.focus(); }
    });
  }

  // Forms post to FormSubmit. The address is assembled here so it never sits in the HTML.
  var parts = ["info", "eyetoad", "com"];
  var endpoint = "https://formsubmit.co/" + parts[0] + "@" + parts[1] + "." + parts[2];
  document.querySelectorAll("form[data-formsubmit]").forEach(function (f) {
    f.setAttribute("action", endpoint);
    f.setAttribute("method", "POST");
    var next = f.querySelector('input[name="_next"]');
    if (next) { next.value = location.origin + location.pathname + "?sent=1#form"; }
    f.addEventListener("submit", function (e) {
      if (!f.getAttribute("action")) { e.preventDefault(); }
    });
  });
  if (/[?&]sent=1/.test(location.search)) {
    var n = document.getElementById("sent-notice");
    if (n) { n.hidden = false; }
  }

  var y = document.getElementById("year");
  if (y) { y.textContent = String(new Date().getFullYear()); }
})();
