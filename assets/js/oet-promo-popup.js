/* Homepage promotional popup (the 17-slide carousel, deferred poster images, session dismissal).
   Moved out of partials/index/tail.html (it was inlined, 11 KB of the homepage HTML). Needs Swiper and
   assets/js/oet-promo-carousel.js, which load (deferred) before it. */
(function () {
    var popup = document.getElementById('oet-promo-popup');
    if (!popup) return;

    var closeButtons = popup.querySelectorAll('[data-oet-promo-close]');
    var dialog = popup.querySelector('.oet-promo-popup__dialog');
    var closeButton = popup.querySelector('.oet-promo-popup__close');
    var swiperElement = popup.querySelector('.oet-promo-popup__swiper');
    var focusableSelector = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';
    var storageKey = 'oetPromoPopupDismissedSession';
    var lastFocused = null;
    var promoSwiper = null;
    var promoCtl = null;
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var autoOpenScheduled = false;

    function storageGet() {
        try {
            if (window.sessionStorage.getItem(storageKey) === '1') return '1';

            // Clear stale legacy dismissals so the package slider can reappear even if
            // a browser previously stored a long-lived lock from an earlier build.
            if (window.localStorage.getItem('oetPromoClosedAt')) {
                window.localStorage.removeItem('oetPromoClosedAt');
            }
            return null;
        } catch (error) { return null; }
    }
    function storageSet() {
        try {
            window.sessionStorage.setItem(storageKey, '1');
            window.localStorage.removeItem('oetPromoClosedAt');
        } catch (error) {}
    }

    function initSwiper() {
        if (promoSwiper || !swiperElement || typeof Swiper === 'undefined') return;
        promoSwiper = new Swiper(swiperElement, {
            loop: true,
            speed: reduceMotion ? 0 : 620,
            grabCursor: true,
            slidesPerView: 1,
            effect: 'slide',
            roundLengths: true,
            watchSlidesProgress: false,
            preloadImages: true,
            updateOnImagesReady: true,
            // 7 seconds (never 3), held on hover / focus and by the Pause / Play button, off under reduced motion:
            // all of that lives in assets/js/oet-promo-carousel.js; without it there is no autoplay at all
            autoplay: window.OetPromoCarousel ? { delay: window.OetPromoCarousel.DELAY, disableOnInteraction: false, pauseOnMouseEnter: false } : false,
            keyboard: {
                enabled: true,
                onlyInViewport: false
            },
            pagination: {
                el: '.oet-promo-popup__pagination',
                clickable: true
            },
            navigation: {
                nextEl: '.oet-promo-popup__nav--next',
                prevEl: '.oet-promo-popup__nav--prev'
            }
        });
        if (window.OetPromoCarousel) {
            promoCtl = window.OetPromoCarousel.attach(promoSwiper, popup.querySelector('.oet-promo-popup__shell') || popup, {
                isActive: function () { return popup.classList.contains('is-open'); }
            });
        }
    }

    function animateActiveSlide() {
        var cta = popup.querySelector('.swiper-slide-active .oet-promo-popup__cta');
        if (!cta || reduceMotion || typeof gsap === 'undefined') return;
        gsap.fromTo(cta, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.34, ease: 'power3.out' });
    }

    function refreshSlider() {
        if (promoSwiper && typeof promoSwiper.update === 'function') {
            promoSwiper.update();
        }
    }

    // The posters carry their real URLs in data-src / data-srcset (src/lib/promo.mjs) so that nothing is
    // downloaded until the popup opens; copy them back BEFORE Swiper clones the looped slides.
    function hydrateImages() {
        popup.querySelectorAll('[data-src], [data-srcset]').forEach(function (el) {
            if (el.hasAttribute('data-srcset')) { el.setAttribute('srcset', el.getAttribute('data-srcset')); el.removeAttribute('data-srcset'); }
            if (el.hasAttribute('data-src')) { el.setAttribute('src', el.getAttribute('data-src')); el.removeAttribute('data-src'); }
        });
    }

    function openPopup() {
        if (popup.classList.contains('is-open')) return;
        lastFocused = document.activeElement;
        hydrateImages();
        initSwiper();
        refreshSlider();
        var preloader = document.querySelector('.preloader');
        if (preloader) {
            preloader.style.opacity = '0';
            preloader.style.visibility = 'hidden';
            preloader.style.pointerEvents = 'none';
            preloader.style.zIndex = '-1';
        }
        popup.classList.add('is-open');
        popup.setAttribute('aria-hidden', 'false');
        document.body.classList.add('oet-promo-popup-lock');
        if (promoCtl) promoCtl.sync();

        if (typeof gsap !== 'undefined' && !reduceMotion) {
            gsap.killTweensOf([popup, dialog]);
            gsap.set(popup, { autoAlpha: 1 });
            gsap.fromTo(dialog, { autoAlpha: 0, y: 28, scale: 0.955 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.58, ease: 'power4.out', onComplete: animateActiveSlide });
        } else if (dialog) {
            dialog.style.opacity = '1';
            dialog.style.transform = 'translateY(0) scale(1)';
        }

        window.setTimeout(function () {
            refreshSlider();
            if (closeButton) closeButton.focus({ preventScroll: true });
        }, 60);
    }

    function closePopup() {
        if (!popup.classList.contains('is-open')) return;
        storageSet();

        function finishClose() {
            popup.classList.remove('is-open');
            popup.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('oet-promo-popup-lock');
            if (typeof gsap !== 'undefined') {
                gsap.killTweensOf([popup, dialog]);
                gsap.set(popup, { clearProps: 'opacity,visibility' });
                if (dialog) gsap.set(dialog, { clearProps: 'opacity,visibility,transform' });
            } else {
                popup.style.opacity = '';
                popup.style.visibility = '';
                if (dialog) {
                    dialog.style.opacity = '';
                    dialog.style.visibility = '';
                    dialog.style.transform = '';
                }
            }
            if (promoCtl) promoCtl.sync();
            else if (promoSwiper && promoSwiper.autoplay) promoSwiper.autoplay.stop();
            if (lastFocused && typeof lastFocused.focus === 'function') {
                lastFocused.focus({ preventScroll: true });
            }
        }

        if (typeof gsap !== 'undefined' && !reduceMotion && dialog) {
            gsap.to(dialog, { autoAlpha: 0, y: 18, scale: 0.97, duration: 0.24, ease: 'power2.in', onComplete: finishClose });
        } else {
            finishClose();
        }
    }

    closeButtons.forEach(function (button) {
        button.addEventListener('click', closePopup);
    });

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

    window.addEventListener('resize', function () {
        if (popup.classList.contains('is-open')) {
            refreshSlider();
        }
    });

    function isMobileViewport() {
        return !!(window.matchMedia && (
            window.matchMedia('(max-width: 1023.98px)').matches ||
            window.matchMedia('(pointer: coarse)').matches ||
            window.matchMedia('(hover: none)').matches
        ));
    }
    function scheduleAutoOpen() {
    if (autoOpenScheduled) return;
    autoOpenScheduled = true;
    if (storageGet() === '1') return;
    var opened = false;
    var timer = null;
    function fire() {
        if (opened) return;
        opened = true;
        if (timer) { window.clearTimeout(timer); }
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('pointerdown', onEngage);
        window.removeEventListener('keydown', onEngage);
        openPopup();
    }
    function onScroll() { if ((window.pageYOffset || document.documentElement.scrollTop) > 320) fire(); }
    function onEngage() { window.setTimeout(fire, 900); }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pointerdown', onEngage, { once: true });
    window.addEventListener('keydown', onEngage, { once: true });
    timer = window.setTimeout(fire, 8000);
}

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', scheduleAutoOpen, { once: true });
    } else {
        scheduleAutoOpen();
    }
})();
