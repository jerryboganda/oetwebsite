/* GSAP + ScrollTrigger loader for desktop motion (SEO brief 21 Nov 2026, P6). Replaces the old document.write loader.

   The page declares the two libraries as inert <script type="text/plain" data-oet-motion src="..."> tags: browsers never fetch
   a script of an unknown type, and the build hashes their src (?v=) like every asset. This script is DEFERRED and listed before
   main.js, so it runs before it, and:
   - in lite-motion mode (class oet-lite-motion, set in <head> by layouts/Base.astro: narrow screens, touch, no hover, reduced
     motion) it does nothing: html[data-oet-motion="off"], nothing is downloaded, exactly like before;
   - otherwise it sets html[data-oet-motion="pending"], appends real scripts in order (async=false keeps GSAP before
     ScrollTrigger) and, once both have settled, sets "ready" (or "off" if one failed to load) and fires "oet-motion-ready" on
     document. Code that needs GSAP (main.js: smooth scroll ticker + image reveals, oet-home-motion.js, the contact widget)
     waits for that signal through window.oetWhenMotionReady(fn), so the behaviour matches the old parser-blocking order.
   To change a library version, rename the file in assets/js/plugins and update the src in the page partials. */
(function () {
  "use strict";
  var root = document.documentElement;

  // fn runs once: now if motion is not pending, otherwise when it settles. main.js defines the same helper for pages that
  // never load this file; whichever script runs first defines it.
  window.oetWhenMotionReady = window.oetWhenMotionReady || function (fn) {
    if (root.getAttribute("data-oet-motion") === "pending") {
      document.addEventListener("oet-motion-ready", function () { fn(); }, { once: true });
    } else {
      fn();
    }
  };

  var tags = Array.prototype.slice.call(document.querySelectorAll('script[type="text/plain"][data-oet-motion]'));
  if (!tags.length || root.classList.contains("oet-lite-motion")) {
    root.setAttribute("data-oet-motion", "off");
    return;
  }

  root.setAttribute("data-oet-motion", "pending");
  var left = tags.length;
  function settle() {
    left -= 1;
    if (left > 0) return;
    root.setAttribute("data-oet-motion", window.gsap && window.ScrollTrigger ? "ready" : "off");
    document.dispatchEvent(new Event("oet-motion-ready"));
  }
  tags.forEach(function (tag) {
    var script = document.createElement("script");
    script.src = tag.getAttribute("src");
    script.async = false; // ordered: GSAP before ScrollTrigger
    script.onload = settle;
    script.onerror = settle;
    document.head.appendChild(script);
  });
})();
