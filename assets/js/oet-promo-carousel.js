/*!
 * OET promo carousel helper: the pricing-page hero slider and the homepage promo popup share ONE behaviour
 * (Final Master brief, owner 30 Oct 2026: "avoid 3-second auto-advance while users are reading, or allow accessible pause/swipe").
 *
 *  - autoplay every 7 seconds (never 3);
 *  - an accessible Pause / Play button ([data-oet-carousel-toggle], aria-pressed = "true" while the visitor has paused it);
 *  - autoplay also holds while the pointer is over the carousel or keyboard focus is inside it;
 *  - no autoplay at all under prefers-reduced-motion (the button is hidden: nothing is moving), also if that setting
 *    changes while the page is open;
 *  - swipe, keyboard, arrows and dots stay with Swiper (the caller's configuration).
 *
 * Usage (see partials/pricing/tail.html and partials/index/tail.html):
 *   var swiper = new Swiper(el, { autoplay: { delay: OetPromoCarousel.DELAY, disableOnInteraction: false, pauseOnMouseEnter: false }, ... });
 *   var ctl = OetPromoCarousel.attach(swiper, scopeEl, { isActive: function () { return popupIsOpen; } });
 *   ctl.sync();   // call again when isActive() may have changed (the popup opening)
 * ES5 on purpose; no dependencies.
 */
(function (root) {
  'use strict';

  var DELAY = 7000;
  var TEXT = {
    running: 'Auto-scrolls every 7 seconds. Pauses on hover or focus.',
    paused: 'Auto-scroll paused. Use the arrows or dots to browse.',
    still: 'Use the arrows or dots to browse the offers.',
  };

  function reducedMotionQuery() {
    return root.matchMedia ? root.matchMedia('(prefers-reduced-motion: reduce)') : null;
  }

  function attach(swiper, scope, opts) {
    var options = opts || {};
    var button = scope.querySelector('[data-oet-carousel-toggle]');
    var label = scope.querySelector('[data-oet-carousel-toggle-text]');
    var hint = scope.querySelector('[data-oet-carousel-hint]');
    var mq = reducedMotionQuery();
    var userPaused = false;
    var hovering = false;
    var focusing = false;
    var override = false; // the visitor pressed Play while the pointer / focus is still on the carousel

    function still() { return !!(mq && mq.matches); }
    function active() { return typeof options.isActive === 'function' ? !!options.isActive() : true; }

    function sync() {
      var ap = swiper && swiper.autoplay;
      var run = !still() && !userPaused && active() && (override || (!hovering && !focusing));
      if (ap) {
        if (run) { if (!ap.running) ap.start(); }
        else if (ap.running) ap.stop();
      }
      if (button) {
        button.hidden = still();
        button.setAttribute('aria-pressed', userPaused ? 'true' : 'false');
      }
      if (label) label.textContent = userPaused ? 'Play' : 'Pause';
      if (hint) hint.textContent = still() ? TEXT.still : (userPaused ? TEXT.paused : TEXT.running);
    }

    if (button) {
      button.addEventListener('click', function () {
        userPaused = !userPaused;
        override = !userPaused; // Play restarts even though the pointer / focus is on the carousel
        sync();
      });
    }
    scope.addEventListener('mouseenter', function () { hovering = true; sync(); });
    scope.addEventListener('mouseleave', function () {
      hovering = false;
      if (!focusing) override = false;
      sync();
    });
    scope.addEventListener('focusin', function () { focusing = true; sync(); });
    scope.addEventListener('focusout', function (ev) {
      if (ev.relatedTarget && scope.contains(ev.relatedTarget)) return;
      focusing = false;
      if (!hovering) override = false;
      sync();
    });
    if (mq) {
      if (mq.addEventListener) mq.addEventListener('change', sync);
      else if (mq.addListener) mq.addListener(sync);
    }

    sync();
    return { sync: sync };
  }

  root.OetPromoCarousel = { DELAY: DELAY, attach: attach, reducedMotion: function () { var q = reducedMotionQuery(); return !!(q && q.matches); } };
})(this);
