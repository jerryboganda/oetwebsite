/* Announcement bar: dismiss button. The "dismissed" / "expired" state itself is applied BEFORE first paint by the
   small inline script in <head> (layouts/Base.astro), which reads the same storage key. Without JavaScript the bar
   simply stays visible and its link keeps working. */
(function () {
  "use strict";
  var bar = document.querySelector(".oet-announce[data-oet-announce]");
  if (!bar) return;
  var button = bar.querySelector(".oet-announce__close");
  if (!button) return;
  var key = "oet_announce_" + bar.getAttribute("data-oet-announce");
  button.addEventListener("click", function () {
    document.documentElement.classList.add("oet-bar-dismissed");
    try { localStorage.setItem(key, "1"); } catch (e) { /* private mode: dismissed for this page view only */ }
  });
})();
