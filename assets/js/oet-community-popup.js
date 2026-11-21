/* "Join Free Community" popup: opens from every .oet-community-cta, from /community and from #oet-community-popup.
   Moved out of partials/chrome/community-popup.html (inlined on every page) so the HTML stays small and the script is cached. */
(function () {
    var popup = document.getElementById('oet-community-popup');
    var triggers = document.querySelectorAll('.oet-community-cta');
    if (!popup || !triggers.length) return;

    var closeButtons = popup.querySelectorAll('[data-oet-community-close]');
    var scrollBody = popup.querySelector('.oet-community-popup__body');
    var focusableSelector = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';
    var lastTrigger = null;
    var lastTouchY = 0;

    function firstFocusable() {
        return popup.querySelector(focusableSelector);
    }

    function openPopup(trigger) {
        lastTrigger = trigger || null;
        popup.classList.add('is-open');
        popup.setAttribute('aria-hidden', 'false');
        document.body.classList.add('oet-community-popup-lock');
        window.setTimeout(function () {
            var target = firstFocusable();
            if (target) target.focus({ preventScroll: true });
        }, 30);
    }

    function closePopup() {
        popup.classList.remove('is-open');
        popup.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('oet-community-popup-lock');
        if (lastTrigger && typeof lastTrigger.focus === 'function') {
            lastTrigger.focus({ preventScroll: true });
        }
    }

    triggers.forEach(function (trigger) {
        trigger.setAttribute('href', '#oet-community-popup');
        trigger.setAttribute('aria-haspopup', 'dialog');
        trigger.setAttribute('aria-controls', 'oet-community-popup');
        trigger.removeAttribute('target');
        trigger.removeAttribute('rel');
        trigger.addEventListener('click', function (event) {
            event.preventDefault();
            openPopup(trigger);
        });
    });

    closeButtons.forEach(function (button) {
        button.addEventListener('click', closePopup);
    });

    // Shareable direct links: /community (served as the homepage by .htaccess) and /#oet-community-popup
    // open the same popup on load, so a pinned post or in-app browser needs no second tap.
    function openedByUrl() {
        var path = window.location.pathname.replace(/\/+$/, '').toLowerCase();
        return path === '/community' || window.location.hash === '#oet-community-popup';
    }
    if (openedByUrl()) openPopup(null);
    window.addEventListener('hashchange', function () {
        if (window.location.hash === '#oet-community-popup') openPopup(null);
    });

    if (scrollBody) {
        scrollBody.addEventListener('wheel', function (event) {
            event.stopPropagation();
        }, { passive: true });

        scrollBody.addEventListener('touchstart', function (event) {
            if (event.touches && event.touches.length) {
                lastTouchY = event.touches[0].clientY;
            }
        }, { passive: true });

        scrollBody.addEventListener('touchmove', function (event) {
            if (!event.touches || !event.touches.length) return;
            var currentY = event.touches[0].clientY;
            var deltaY = lastTouchY - currentY;
            var atTop = scrollBody.scrollTop <= 0;
            var atBottom = Math.ceil(scrollBody.scrollTop + scrollBody.clientHeight) >= scrollBody.scrollHeight;

            if ((atTop && deltaY < 0) || (atBottom && deltaY > 0)) {
                event.preventDefault();
            }

            event.stopPropagation();
            lastTouchY = currentY;
        }, { passive: false });
    }

    document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && popup.classList.contains('is-open')) {
        closePopup();
        return;
    }
    if (event.key !== 'Tab' || !popup.classList.contains('is-open')) return;
    var items = Array.prototype.filter.call(popup.querySelectorAll(focusableSelector), function (el) {
        return el.offsetParent !== null;
    });
    if (!items.length) return;
    var first = items[0];
    var last = items[items.length - 1];
    if (event.shiftKey && (document.activeElement === first || !popup.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
    } else if (!event.shiftKey && (document.activeElement === last || !popup.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
    }
});
})();
