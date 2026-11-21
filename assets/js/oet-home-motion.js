/* Homepage desktop motion that needs GSAP: (1) the animated submenus of the main navigation, (2) the one-off typing of the
   "Join Free Community!" pill. Moved out of partials/index/tail.html (inline scripts, ~7 KB of the homepage HTML).
   GSAP now arrives through assets/js/oet-motion.js (not document.write), so both wait for its ready signal first
   (immediately when motion is off or already ready). Timing otherwise as before: submenus at DOMContentLoaded, typing at load. */
(function () {
  "use strict";
  function whenMotionReady(fn) {
    if (window.oetWhenMotionReady) window.oetWhenMotionReady(fn); else fn();
  }

  function navDropdowns() {
            if (typeof gsap === 'undefined') {
                return;
            }

            if (!window.matchMedia || !window.matchMedia('(min-width: 1200px)').matches) {
                return;
            }

            var menuRoot = document.querySelector('.vl-main-menu');
            if (!menuRoot) {
                return;
            }

            var dropdownItems = menuRoot.querySelectorAll('li.has-dropdown');
            dropdownItems.forEach(function (item) {
                var submenu = Array.from(item.children).find(function (child) {
                    return child.classList && child.classList.contains('sub-menu');
                });
                if (!submenu) {
                    return;
                }

                var submenuItems = Array.from(submenu.children).filter(function (child) {
                    return child.tagName === 'LI';
                });
                var closeTimer = null;
                var openTimeline = null;
                var closeTimeline = null;

                function clearTimers() {
                    if (closeTimer) {
                        clearTimeout(closeTimer);
                        closeTimer = null;
                    }
                }

                function killActiveTweens() {
                    gsap.killTweensOf([submenu].concat(submenuItems));
                    if (openTimeline) {
                        openTimeline.kill();
                        openTimeline = null;
                    }
                    if (closeTimeline) {
                        closeTimeline.kill();
                        closeTimeline = null;
                    }
                }

                function openDropdown() {
                    clearTimers();
                    killActiveTweens();
                    gsap.set(submenu, { transformOrigin: 'top center' });

                    openTimeline = gsap.timeline({
                        defaults: { overwrite: 'auto' },
                        onComplete: function () {
                            openTimeline = null;
                        }
                    });

                    openTimeline.fromTo(submenu, {
                        autoAlpha: 0,
                        y: 12,
                        scale: 0.98
                    }, {
                        autoAlpha: 1,
                        y: 0,
                        scale: 1,
                        duration: 0.3,
                        ease: 'power3.out'
                    }, 0).fromTo(submenuItems, {
                        autoAlpha: 0,
                        y: 8
                    }, {
                        autoAlpha: 1,
                        y: 0,
                        duration: 0.24,
                        ease: 'power2.out',
                        stagger: 0.03
                    }, 0.04);
                }

                function closeDropdown() {
                    clearTimers();
                    closeTimer = window.setTimeout(function () {
                        closeTimer = null;
                        killActiveTweens();

                        closeTimeline = gsap.timeline({
                            defaults: { overwrite: 'auto' },
                            onComplete: function () {
                                gsap.set(submenu, { clearProps: 'opacity,visibility,transform' });
                                gsap.set(submenuItems, { clearProps: 'opacity,transform' });
                                closeTimeline = null;
                            }
                        });

                        closeTimeline.to(submenuItems, {
                            autoAlpha: 0,
                            y: 6,
                            duration: 0.16,
                            ease: 'power2.in',
                            stagger: {
                                each: 0.015,
                                from: 'end'
                            }
                        }, 0).to(submenu, {
                            autoAlpha: 0,
                            y: 10,
                            scale: 0.98,
                            duration: 0.2,
                            ease: 'power3.in'
                        }, 0.02);
                    }, 90);
                }

                item.addEventListener('mouseenter', openDropdown);
                item.addEventListener('mouseleave', closeDropdown);
            });
  }

  function ctaTyping() {
            var cta = document.querySelector('.oet-community-cta');
            var fullText = 'Join Free Community!';

            if (!cta || typeof gsap === 'undefined') return;
            var contentEl = cta.querySelector('.oet-community-cta__content');
            var textEl = contentEl ? contentEl.querySelector('.oet-community-cta__text') : null;
            var cursorEl = contentEl ? contentEl.querySelector('.oet-community-cta__cursor') : null;
            cta.setAttribute('aria-label', fullText);

            if (!textEl || !cursorEl) {
                cta.textContent = fullText;
                return;
            }

            if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                textEl.textContent = fullText;
                cursorEl.style.display = 'none';
                return;
            }

            // Types once and then settles. The previous version looped forever,
            // rewriting text every frame inside the sticky header, so the
            // browser re-laid-out and repainted the header for the entire
            // session - main-thread work that competed with scrolling.
            var state = { progress: 0 };
            cursorEl.style.display = 'none';
            textEl.textContent = '';

            gsap.to(state, {
                progress: fullText.length,
                duration: 1.6,
                ease: 'none',
                onUpdate: function () {
                    var next = fullText.slice(0, Math.floor(state.progress));
                    if (next !== textEl.textContent) {
                        textEl.textContent = next;
                    }
                },
                onComplete: function () {
                    textEl.textContent = fullText;
                }
            });
  }

  function domReady(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn); else fn();
  }
  function windowLoaded(fn) {
    if (document.readyState === "complete") fn(); else window.addEventListener("load", fn);
  }
  domReady(function () { whenMotionReady(navDropdowns); });
  windowLoaded(function () { whenMotionReady(ctaTyping); });
})();
