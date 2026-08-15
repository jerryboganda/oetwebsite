/***************************************************
==================== JS INDEX ======================
****************************************************
01. sal js
02. back-to-top
03. stiky js
04. mobile menu js
05. Search Bar
06. counter up
07. popup image 
08. popup video 
09. nice select
10. preloader
11. thumb slider (home one)
12. service slider (home one)
13. testimonial slider (home one)
14. portfolioActive (home one)
15. testimonial slider (home three)
16. team slider (home three)
17. portfolio slider (home three)
18. vlServiceActivefive (home five)
19. caseSwiperActive5 (home five)
20. teamSwiperActivefive (home five)
21. teamSwiperActivesix (home six)
22. testimonialSwiperActivesix (home six)
23. teamSwiperActiveseven (home seven)
24. testimonialSwiperActive7 (home seven)
25. serviceSwiperActive7 (home seven)
26. testiSwiperActive7 (home seven)
27. testiSwiperActive10 (home 10)
28. testiSwiperActive4 (home 4)
29. teamSwiperActive4 (home 4)
30. caseActive4 (home 4)
31. serviceSwiperActive4 (home 4)
32. testimonialSwiperActive2 (home 2)
33. teamSwiperActive2 (home 2)
34. portfolioSwiperActive2 (home 2)
35. bannerSliderAc2 (home 2)
36. bannerabActive (about page)
37. team slider about page (about page)
38. bannerSliderAc4 (home 4)
39. bannerSwiperActive7 (home 7)
40. caseSwiperActive7 (home 7)
41. teamSwiperActive7 (home 7)
42. teamSwiperActive8 (home 8)
43. caseSwiperActive10 (home 10) 
44. swiper1 (home 10) 
44. swiper2 (home 10) 


****************************************************/




/*----------------------------------------*/
/*  01.sal js
/*----------------------------------------*/


if (typeof sal === 'function') { sal(); }



;(function (window, document) {
    "use strict";

    var scrollManager = {
        lenis: null,
        isReady: false,
        isStopped: false,
        listeners: [],
        observer: null,
        ticker: null,
        // Starts optimistic so ScrollTrigger-driven sections never miss updates
        // before the first refresh(); narrowed to the real count on refresh.
        hasScrollTriggers: true,
        excludedSelector: [
            "[data-lenis-prevent]",
            "[data-scroll-island]",
            "[data-scroll-lock]",
            ".vl-offcanvas",
            ".vl-offcanvas-wrapper",
            ".vl-header-search-bar",
            ".vl-offcanvas-overlay",
            ".mfp-wrap",
            ".mfp-container",
            ".mfp-content",
            ".mfp-iframe-holder",
            ".contact__maps",
            ".contact__maps2",
            ".nice-select .list",
            ".oet-contact-widget__panel",
            ".oet-contact-widget__messages"
        ].join(", "),
        prefersReducedMotion: !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches),
        isTouchDevice: !!((window.matchMedia && window.matchMedia("(pointer: coarse)").matches) || navigator.maxTouchPoints > 0),
        getScrollY: function () {
            if (this.lenis && typeof this.lenis.scroll === "number") {
                return this.lenis.scroll;
            }

            return window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
        },
        getHeaderOffset: function () {
            var header = document.getElementById("vl-header-sticky");
            return header ? Math.round(header.getBoundingClientRect().height) : 0;
        },
        onScroll: function (callback) {
            if (typeof callback !== "function") {
                return function () {};
            }

            this.listeners.push(callback);

            return function () {
                scrollManager.listeners = scrollManager.listeners.filter(function (listener) {
                    return listener !== callback;
                });
            };
        },
        emitScroll: function () {
            var scrollY = this.getScrollY();
            this.listeners.forEach(function (listener) {
                listener(scrollY);
            });
        },
        markPreventElements: function (root) {
            var scope = root && typeof root.querySelectorAll === "function" ? root : document;
            var candidates = scope.querySelectorAll(this.excludedSelector);
            candidates.forEach(function (element) {
                element.setAttribute("data-lenis-prevent", "");
            });

            scope.querySelectorAll("iframe").forEach(function (frame) {
                if (frame.closest(".contact__maps, .contact__maps2, .mfp-wrap, .mfp-container, .vl-offcanvas, .vl-header-search-bar")) {
                    frame.setAttribute("data-lenis-prevent", "");
                }
            });
        },
        start: function () {
            if (!this.isStopped) return;
            this.isStopped = false;

            if (this.lenis) {
                this.lenis.start();
                return;
            }

            // Native-scroll mode (touch / reduced motion): release the lock and
            // restore the scroll position the browser drops when position:fixed
            // is removed from <body>.
            var body = document.body;
            if (!body.classList.contains("oet-scroll-locked")) return;
            var locked = parseFloat(body.dataset.oetLockedScroll || "0") || 0;
            body.classList.remove("oet-scroll-locked");
            body.style.removeProperty("top");
            delete body.dataset.oetLockedScroll;
            window.scrollTo(0, locked);
        },
        stop: function () {
            if (this.isStopped) return;
            this.isStopped = true;

            if (this.lenis) {
                this.lenis.stop();
                return;
            }

            var body = document.body;
            if (body.classList.contains("oet-scroll-locked")) return;
            body.dataset.oetLockedScroll = String(this.getScrollY());
            body.style.top = "-" + Math.round(this.getScrollY()) + "px";
            body.classList.add("oet-scroll-locked");
        },
        refresh: function () {
            if (this.lenis && typeof this.lenis.resize === "function") {
                this.lenis.resize();
            }

            if (window.ScrollTrigger && typeof window.ScrollTrigger.refresh === "function") {
                window.ScrollTrigger.refresh();
                this.hasScrollTriggers = typeof window.ScrollTrigger.getAll === "function" &&
                    window.ScrollTrigger.getAll().length > 0;
            }

            this.emitScroll();
        },
        // ScrollTrigger.refresh() re-measures every trigger and forces a full
        // layout pass, so it must never run per resize event / per rAF.
        scheduleRefresh: function () {
            var self = this;
            window.clearTimeout(this._refreshTimer);
            this._refreshTimer = window.setTimeout(function () {
                self.refresh();
            }, 180);
        },
        scrollTo: function (target, options) {
            var settings = options || {};

            if (this.lenis) {
                this.lenis.scrollTo(target, settings);
                return;
            }

            var topValue = 0;
            if (typeof target === "number") {
                topValue = target;
            } else if (typeof target === "string") {
                if (target === "top" || target === "start") {
                    topValue = 0;
                } else {
                    var stringTarget = document.querySelector(target);
                    if (!stringTarget) return;
                    topValue = stringTarget.getBoundingClientRect().top + this.getScrollY();
                }
            } else if (target && typeof target.getBoundingClientRect === "function") {
                topValue = target.getBoundingClientRect().top + this.getScrollY();
            } else {
                return;
            }

            topValue += settings.offset || 0;
            window.scrollTo({
                top: topValue,
                behavior: this.prefersReducedMotion ? "auto" : "smooth"
            });
        },
        handleAnchorClick: function (event) {
            var link = event.target.closest('a[href]');
            if (!link) return;

            var rawHref = link.getAttribute("href");
            if (!rawHref || rawHref === "#" || rawHref.indexOf("javascript:") === 0) return;
            if (link.hasAttribute("target") && link.getAttribute("target") === "_blank") return;
            if (link.matches("[data-bs-toggle], [data-toggle], [role='tab'], [data-lenis-ignore-anchor]")) return;

            var destination;
            var currentLocation;
            try {
                destination = new URL(link.href, window.location.href);
                currentLocation = new URL(window.location.href);
            } catch (error) {
                return;
            }

            if (!destination.hash || destination.hash.length <= 1) return;
            if (destination.origin !== currentLocation.origin || destination.pathname !== currentLocation.pathname) return;

            var target = document.querySelector(destination.hash);
            if (!target) return;

            event.preventDefault();

            var self = this;
            var anchorOffset = -this.getHeaderOffset() - 16;
            // Resync Lenis if native scrolls (keyboard, focus, find-in-page)
            // left its internal position stale; element targets are resolved
            // against animatedScroll, so a stale value lands short.
            if (this.lenis && Math.abs(this.lenis.animatedScroll - this.getScrollY()) > 2) {
                this.lenis.scrollTo(this.getScrollY(), { immediate: true, force: true });
            }
            this.scrollTo(target, {
                offset: anchorOffset,
                duration: 1.05,
                lerp: this.isTouchDevice ? 0.16 : 0.11,
                lock: false,
                force: true
            });

            // The tween target can be computed from a stale scroll position
            // (native scrolls Lenis has not synced yet) or drift when layout
            // grows mid-animation. Re-check once the scroll settles and
            // correct silently - unless the user took over scrolling.
            var userTookOver = false;
            var markUserScroll = function () { userTookOver = true; };
            window.addEventListener("wheel", markUserScroll, { passive: true, once: true });
            window.addEventListener("touchmove", markUserScroll, { passive: true, once: true });
            var correctLanding = function (isLast) {
                if (isLast) {
                    window.removeEventListener("wheel", markUserScroll);
                    window.removeEventListener("touchmove", markUserScroll);
                }
                if (userTookOver || !document.contains(target)) return;
                var scrollMargin = parseFloat(window.getComputedStyle(target).scrollMarginTop) || 0;
                // Header height differs between its top-of-page and stuck
                // states, so measure again now that the scroll has settled.
                var settledOffset = -self.getHeaderOffset() - 16;
                var desired = target.getBoundingClientRect().top + self.getScrollY() - scrollMargin + settledOffset;
                var maxScroll = Math.max(0, (document.scrollingElement || document.documentElement).scrollHeight - window.innerHeight);
                desired = Math.max(0, Math.min(desired, maxScroll));
                if (Math.abs(self.getScrollY() - desired) > 24) {
                    self.scrollTo(desired, { immediate: true, force: true });
                }
            };
            window.clearTimeout(this._anchorFixTimer);
            window.clearTimeout(this._anchorFixTimer2);
            this._anchorFixTimer = window.setTimeout(function () { correctLanding(false); }, 1250);
            this._anchorFixTimer2 = window.setTimeout(function () { correctLanding(true); }, 2600);

            if (window.history && typeof window.history.pushState === "function") {
                window.history.pushState(null, "", destination.hash);
            } else {
                window.location.hash = destination.hash;
            }
        },
        init: function () {
            var self = this;
            if (this.isReady) return;

            this.markPreventElements(document);
            document.documentElement.style.scrollBehavior = "auto";

            document.addEventListener("click", function (event) {
                self.handleAnchorClick(event);
            }, false);

            // Touch devices keep NATIVE scrolling. Lenis' syncTouch hijacks the
            // compositor-driven touch scroll and re-drives it from JS, which is
            // the single biggest cause of laggy scrolling on phones/tablets.
            if (this.prefersReducedMotion || this.isTouchDevice || typeof window.Lenis === "undefined") {
                this.isReady = true;
                return;
            }

            this.lenis = new window.Lenis({
                // 0.095 made the viewport chase the wheel for ~half a second,
                // which reads as lag. 0.2 still smooths, but stays under the
                // ~100ms threshold where motion feels attached to the input.
                lerp: 0.2,
                smoothWheel: true,
                syncTouch: false,
                touchMultiplier: 1,
                wheelMultiplier: 1,
                gestureOrientation: "vertical",
                autoResize: true,
                overscroll: true,
                autoRaf: false,
                prevent: function (node) {
                    return !!(node && (
                        (typeof node.closest === "function" && node.closest(self.excludedSelector)) ||
                        node.tagName === "IFRAME"
                    ));
                }
            });

            this.lenis.on("scroll", function () {
                self.emitScroll();
                if (self.hasScrollTriggers && window.ScrollTrigger && typeof window.ScrollTrigger.update === "function") {
                    window.ScrollTrigger.update();
                }
            });

            if (window.gsap && typeof window.gsap.ticker !== "undefined") {
                this.ticker = function (time) {
                    self.lenis.raf(time * 1000);
                };
                window.gsap.ticker.add(this.ticker);
                window.gsap.ticker.lagSmoothing(0);
            } else {
                this.ticker = function (time) {
                    self.lenis.raf(time);
                    window.requestAnimationFrame(self.ticker);
                };
                window.requestAnimationFrame(this.ticker);
            }

            if (window.location.hash && window.location.hash.length > 1) {
                window.addEventListener("load", function () {
                    var hashTarget = document.querySelector(window.location.hash);
                    if (!hashTarget) return;

                    window.setTimeout(function () {
                        self.scrollTo(hashTarget, {
                            offset: -self.getHeaderOffset() - 16,
                            immediate: true,
                            force: true
                        });
                    }, 120);
                });
            }

            if (typeof MutationObserver !== "undefined") {
                // Coalesce bursts (swiper clones, widget mounts) into one pass
                // per frame instead of a querySelectorAll per inserted node.
                var pendingNodes = [];
                var flushScheduled = false;
                var flush = function () {
                    flushScheduled = false;
                    var nodes = pendingNodes;
                    pendingNodes = [];
                    for (var i = 0; i < nodes.length; i++) {
                        self.markPreventElements(nodes[i]);
                    }
                };

                this.observer = new MutationObserver(function (mutations) {
                    for (var i = 0; i < mutations.length; i++) {
                        var added = mutations[i].addedNodes;
                        for (var j = 0; j < added.length; j++) {
                            if (added[j].nodeType === 1) {
                                pendingNodes.push(added[j]);
                            }
                        }
                    }

                    if (pendingNodes.length && !flushScheduled) {
                        flushScheduled = true;
                        window.requestAnimationFrame(flush);
                    }
                });

                this.observer.observe(document.body, {
                    childList: true,
                    subtree: true
                });
            }

            window.addEventListener("load", function () {
                self.refresh();
                window.setTimeout(function () {
                    self.refresh();
                }, 250);
            });

            window.addEventListener("resize", function () {
                self.scheduleRefresh();
            }, { passive: true });

            this.isReady = true;
        }
    };

    window.OETSmoothScroll = scrollManager;

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", function () {
            scrollManager.init();
        });
    } else {
        scrollManager.init();
    }
})(window, document);

;(function (window, document) {
    "use strict";

    var youtubeHostPattern = /(^|\.)youtube\.com$|(^|\.)youtu\.be$/i;
    var videoHostPattern = /(^|\.)youtube-nocookie\.com$/i;

    function getYoutubeEmbedUrl(rawUrl) {
        var url;
        try {
            url = new URL(rawUrl, window.location.href);
        } catch (error) {
            return "";
        }

        var host = url.hostname.replace(/^www\./i, "");
        var videoId = "";

        if (host === "youtu.be") {
            videoId = url.pathname.split("/").filter(Boolean)[0] || "";
        } else if (youtubeHostPattern.test(host) || videoHostPattern.test(host)) {
            if (url.pathname === "/watch") {
                videoId = url.searchParams.get("v") || "";
            } else if (url.pathname.indexOf("/embed/") === 0 || url.pathname.indexOf("/shorts/") === 0 || url.pathname.indexOf("/live/") === 0) {
                videoId = url.pathname.split("/").filter(Boolean)[1] || "";
            }
        }

        if (!videoId || videoId.indexOf("@") === 0) {
            return "";
        }

        var start = url.searchParams.get("start") || url.searchParams.get("t") || "";
        var startSeconds = "";
        if (/^\d+$/.test(start)) {
            startSeconds = start;
        } else if (/^\d+[smh]/i.test(start)) {
            var match = start.match(/(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/i);
            if (match) {
                startSeconds = String((parseInt(match[1] || "0", 10) * 3600) + (parseInt(match[2] || "0", 10) * 60) + parseInt(match[3] || "0", 10));
            }
        }

        var embed = new URL("https://www.youtube-nocookie.com/embed/" + encodeURIComponent(videoId));
        embed.searchParams.set("autoplay", "1");
        embed.searchParams.set("rel", "0");
        embed.searchParams.set("modestbranding", "1");
        embed.searchParams.set("playsinline", "1");
        embed.searchParams.set("enablejsapi", "1");
        if (startSeconds) {
            embed.searchParams.set("start", startSeconds);
        }

        return embed.toString();
    }

    function getLinkYoutubeUrl(link) {
        return link.getAttribute("data-youtube-url") || link.getAttribute("href") || link.href || "";
    }

    function findVideoTarget(link) {
        var card = link.closest(".teaching-video-card");
        if (card) {
            return card.querySelector(".teaching-video-thumb") || card;
        }

        var directThumb = link.closest(".teaching-video-thumb, .video-play-btn, .popup-video");
        if (directThumb && (directThumb.style.backgroundImage || directThumb.querySelector("img") || directThumb.classList.contains("teaching-video-thumb"))) {
            return directThumb;
        }

        var visualSelectors = [
            ".video-play-wrap-flex",
            ".video-play-wrap",
            ".vl-about-thumb",
            ".about-thumb",
            ".vl-banner-thumb",
            ".banner-thumb",
            ".vl-service-thumb",
            ".service-thumb",
            ".vl-portfolio-thumb",
            ".portfolio-thumb",
            ".vl-blog-thumb",
            ".blog-thumb",
            ".image-anime",
            ".reveal",
            ".thumb"
        ].join(", ");

        var visual = link.closest(visualSelectors);
        if (visual) {
            var imageBox = visual.querySelector("img") ? visual : null;
            return imageBox || visual;
        }

        return null;
    }

    function buildInlinePlayer(embedUrl, title) {
        var wrapper = document.createElement("div");
        wrapper.className = "oet-inline-youtube-player";
        wrapper.setAttribute("data-lenis-prevent", "");

        var iframe = document.createElement("iframe");
        iframe.src = embedUrl;
        iframe.title = title || "YouTube video player";
        iframe.loading = "lazy";
        iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
        iframe.allowFullscreen = true;
        iframe.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
        iframe.setAttribute("data-lenis-prevent", "");

        wrapper.appendChild(iframe);
        return wrapper;
    }

    function ensureInlineVideoStyles() {
        if (document.getElementById("oet-inline-youtube-styles")) {
            return;
        }

        var style = document.createElement("style");
        style.id = "oet-inline-youtube-styles";
        style.textContent = [
            ".oet-inline-youtube-player{position:relative;display:block;width:100%;aspect-ratio:16/9;min-height:210px;overflow:hidden;background:#050816;border-radius:inherit;box-shadow:0 18px 36px rgba(16,19,79,.16)}",
            ".oet-inline-youtube-player iframe{position:absolute;inset:0;width:100%;height:100%;border:0;display:block}",
            ".teaching-video-thumb .oet-inline-youtube-player,.teaching-video-card>.oet-inline-youtube-player{min-height:210px;border-radius:0}",
            ".video-play-wrap-flex .oet-inline-youtube-player,.video-play-wrap .oet-inline-youtube-player{min-width:min(100%,640px)}",
            ".oet-youtube-overlay{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(5,8,30,.76);backdrop-filter:blur(4px)}",
            ".oet-youtube-overlay__dialog{position:relative;width:min(960px,100%)}",
            ".oet-youtube-overlay__close{position:absolute;right:-14px;top:-14px;z-index:2;width:42px;height:42px;border:0;border-radius:50%;background:#fff;color:#10134f;font-size:26px;line-height:1;box-shadow:0 12px 30px rgba(0,0,0,.28);cursor:pointer}",
            ".oet-youtube-overlay .oet-inline-youtube-player{min-height:0;border-radius:14px}"
        ].join("\n");
        document.head.appendChild(style);
    }

    function openYoutubeOverlay(embedUrl, title) {
        ensureInlineVideoStyles();
        var existing = document.querySelector(".oet-youtube-overlay");
        if (existing) {
            existing.remove();
        }

        var overlay = document.createElement("div");
        overlay.className = "oet-youtube-overlay";
        overlay.setAttribute("role", "dialog");
        overlay.setAttribute("aria-modal", "true");
        overlay.setAttribute("data-lenis-prevent", "");

        var dialog = document.createElement("div");
        dialog.className = "oet-youtube-overlay__dialog";
        dialog.setAttribute("data-lenis-prevent", "");

        var close = document.createElement("button");
        close.type = "button";
        close.className = "oet-youtube-overlay__close";
        close.setAttribute("aria-label", "Close video");
        close.innerHTML = "&times;";

        dialog.appendChild(close);
        dialog.appendChild(buildInlinePlayer(embedUrl, title));
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        var closeOverlay = function () {
            overlay.remove();
            document.removeEventListener("keydown", onKeyDown, true);
        };
        var onKeyDown = function (keyboardEvent) {
            if (keyboardEvent.key === "Escape") {
                closeOverlay();
            }
        };

        close.addEventListener("click", closeOverlay);
        overlay.addEventListener("click", function (overlayEvent) {
            if (overlayEvent.target === overlay) {
                closeOverlay();
            }
        });
        document.addEventListener("keydown", onKeyDown, true);
        close.focus();
    }

    function playYoutubeInline(link) {
        var embedUrl = getYoutubeEmbedUrl(getLinkYoutubeUrl(link));
        if (!embedUrl) {
            return false;
        }

        var target = findVideoTarget(link);
        if (!target) {
            openYoutubeOverlay(embedUrl, link.getAttribute("aria-label") || link.textContent.trim());
            return true;
        }

        ensureInlineVideoStyles();

        var player = buildInlinePlayer(embedUrl, link.getAttribute("aria-label") || link.textContent.trim());
        target.replaceWith(player);

        if (window.OETSmoothScroll && typeof window.OETSmoothScroll.markPreventElements === "function") {
            window.OETSmoothScroll.markPreventElements(player);
        }

        if (window.OETSmoothScroll && typeof window.OETSmoothScroll.refresh === "function") {
            window.OETSmoothScroll.refresh();
        }

        return true;
    }

    document.addEventListener("click", function (event) {
        var link = event.target.closest && event.target.closest("a[href]");
        if (!link) {
            return;
        }

        if (!getYoutubeEmbedUrl(getLinkYoutubeUrl(link))) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        if (typeof event.stopImmediatePropagation === "function") {
            event.stopImmediatePropagation();
        }

        playYoutubeInline(link);
    }, true);
})(window, document);



(function () {
    "use strict";

    var scrollManager = window.OETSmoothScroll || null;

    function getScrollTop() {
        if (scrollManager && typeof scrollManager.getScrollY === "function") {
            return scrollManager.getScrollY();
        }
        return window.pageYOffset || document.documentElement.scrollTop || 0;
    }

    function bindScrollEvent(callback) {
        if (scrollManager && scrollManager.lenis && typeof scrollManager.onScroll === "function") {
            // Lenis already emits once per animation frame.
            scrollManager.onScroll(callback);
        } else {
            // Native scroll fires faster than the compositor paints, so collapse
            // bursts into one callback per frame.
            var ticking = false;
            window.addEventListener("scroll", function () {
                if (ticking) return;
                ticking = true;
                window.requestAnimationFrame(function () {
                    ticking = false;
                    callback();
                });
            }, { passive: true });
        }
        callback();
    }

    function pauseSmoothScroll() {
        if (scrollManager && typeof scrollManager.stop === "function") {
            scrollManager.stop();
        }
    }

    function resumeSmoothScroll() {
        if (!scrollManager || typeof scrollManager.start !== "function") {
            return;
        }
        var offcanvas = document.querySelector(".vl-offcanvas");
        var searchBar = document.querySelector(".vl-header-search-bar");
        var hasOpenOverlay = (offcanvas && offcanvas.classList.contains("vl-offcanvas-open")) ||
            (searchBar && searchBar.classList.contains("vl-search-open"));
        if (!hasOpenOverlay) {
            scrollManager.start();
        }
    }

    function slideUp(el, duration) {
        if (!el) return;
        el.style.height = el.scrollHeight + "px";
        el.style.overflow = "hidden";
        el.style.transition = "height " + (duration || 300) + "ms ease";
        requestAnimationFrame(function () {
            el.style.height = "0px";
        });
        window.setTimeout(function () {
            el.style.display = "none";
            el.style.removeProperty("height");
            el.style.removeProperty("overflow");
            el.style.removeProperty("transition");
        }, duration || 300);
    }

    function slideDown(el, duration) {
        if (!el) return;
        el.style.removeProperty("display");
        var display = window.getComputedStyle(el).display;
        if (display === "none") display = "block";
        el.style.display = display;
        var height = el.scrollHeight;
        el.style.height = "0px";
        el.style.overflow = "hidden";
        el.style.transition = "height " + (duration || 300) + "ms ease";
        requestAnimationFrame(function () {
            el.style.height = height + "px";
        });
        window.setTimeout(function () {
            el.style.removeProperty("height");
            el.style.removeProperty("overflow");
            el.style.removeProperty("transition");
        }, duration || 300);
    }

    /*----------------------------------------*/
    /*  back-to-top progress
    /*----------------------------------------*/
    var progressPath = document.querySelector(".progress-wrap path");
    if (progressPath) {
        var progressWrap = document.querySelector(".progress-wrap");
        var pathLength = progressPath.getTotalLength();
        progressPath.style.transition = progressPath.style.WebkitTransition = "none";
        progressPath.style.strokeDasharray = pathLength + " " + pathLength;
        progressPath.style.strokeDashoffset = pathLength;
        progressPath.getBoundingClientRect();
        progressPath.style.transition = progressPath.style.WebkitTransition = "stroke-dashoffset 10ms linear";
        var offset = 50;

        // Reading scrollHeight forces a synchronous layout. Doing that on every
        // scroll tick made the whole page janky, so the document height is
        // cached and only re-measured when the layout can actually change.
        var cachedDocHeight = 1;
        var measureDocHeight = function () {
            var docHeight = Math.max(
                document.body.scrollHeight,
                document.documentElement.scrollHeight
            ) - window.innerHeight;
            cachedDocHeight = Math.max(docHeight, 1);
        };

        measureDocHeight();
        window.addEventListener("load", measureDocHeight);
        window.addEventListener("resize", function () {
            window.clearTimeout(window.__oetDocHeightTimer);
            window.__oetDocHeightTimer = window.setTimeout(measureDocHeight, 180);
        }, { passive: true });

        if (typeof ResizeObserver !== "undefined") {
            var docHeightRaf = 0;
            new ResizeObserver(function () {
                if (docHeightRaf) return;
                docHeightRaf = window.requestAnimationFrame(function () {
                    docHeightRaf = 0;
                    measureDocHeight();
                });
            }).observe(document.body);
        }

        bindScrollEvent(function () {
            var scroll = getScrollTop();
            progressPath.style.strokeDashoffset = pathLength - (scroll * pathLength) / cachedDocHeight;
            if (progressWrap) {
                progressWrap.classList.toggle("active-progress", scroll > offset);
            }
        });
        if (progressWrap) {
            progressWrap.addEventListener("click", function (event) {
                event.preventDefault();
                if (scrollManager && typeof scrollManager.scrollTo === "function") {
                    scrollManager.scrollTo(0, {
                        duration: 1.05,
                        force: true
                    });
                } else {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                }
            });
        }
    }

    /*----------------------------------------*/
    /*  sticky header
    /*----------------------------------------*/
    var stickyHeader = document.getElementById("vl-header-sticky");
    if (stickyHeader) {
        bindScrollEvent(function () {
            stickyHeader.classList.toggle("header-sticky", getScrollTop() >= 100);
        });
    }

    /*----------------------------------------*/
    /*  mobile offcanvas menu
    /*----------------------------------------*/
    var desktopMenu = document.querySelector(".vl-mobile-menu-active > ul");
    var sideMenuNav = document.querySelector(".vl-offcanvas-menu nav");
    if (desktopMenu && sideMenuNav) {
        sideMenuNav.appendChild(desktopMenu.cloneNode(true));
        sideMenuNav.querySelectorAll(".sub-menu, .vl-mega-menu").forEach(function (submenu) {
            var toggleBtn = document.createElement("button");
            toggleBtn.className = "vl-menu-close";
            toggleBtn.setAttribute("aria-label", "Toggle submenu");
            toggleBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
            submenu.parentElement.appendChild(toggleBtn);
            submenu.style.display = "none";
        });
        sideMenuNav.addEventListener("click", function (event) {
            var trigger = event.target.closest("button.vl-menu-close, li.has-dropdown > a");
            if (!trigger || !sideMenuNav.contains(trigger)) return;
            var item = trigger.parentElement;
            var submenu = item.querySelector(":scope > .sub-menu, :scope > .vl-mega-menu");
            if (!submenu) return;
            event.preventDefault();
            if (item.classList.contains("active")) {
                item.classList.remove("active");
                slideUp(submenu, 300);
            } else {
                item.classList.add("active");
                slideDown(submenu, 300);
            }
        });
    }

    var offcanvasFocusableSel = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';
    var offcanvasLastTrigger = null;

    function isMenuOpen() {
        var oc = document.querySelector(".vl-offcanvas");
        return !!(oc && oc.classList.contains("vl-offcanvas-open"));
    }

    function setMenuOpen(open, trigger) {
        document.querySelectorAll(".vl-offcanvas").forEach(function (el) {
            el.classList.toggle("vl-offcanvas-open", open);
            el.setAttribute("aria-hidden", open ? "false" : "true");
            try { el.inert = !open; } catch (e) { /* older browsers */ }
        });
        document.querySelectorAll(".vl-offcanvas-overlay").forEach(function (el) { el.classList.toggle("vl-offcanvas-overlay-open", open); });
        document.querySelectorAll(".vl-offcanvas-toggle[aria-controls]").forEach(function (el) { el.setAttribute("aria-expanded", open ? "true" : "false"); });
        document.body.classList.toggle("oet-menu-open", open);
        if (open) {
            offcanvasLastTrigger = trigger || null;
            pauseSmoothScroll();
            var oc = document.querySelector(".vl-offcanvas");
            var first = oc ? oc.querySelector(offcanvasFocusableSel) : null;
            if (first) window.setTimeout(function () { first.focus({ preventScroll: true }); }, 40);
        } else {
            document.querySelectorAll(".vl-header-search-bar").forEach(function (el) { el.classList.remove("vl-search-open"); });
            resumeSmoothScroll();
            if (offcanvasLastTrigger && typeof offcanvasLastTrigger.focus === "function") {
                offcanvasLastTrigger.focus({ preventScroll: true });
                offcanvasLastTrigger = null;
            }
        }
    }

    document.querySelectorAll(".vl-offcanvas, .vl-header-search-bar").forEach(function (el) {
        el.setAttribute("aria-hidden", "true");
        try { el.inert = true; } catch (e) { /* older browsers */ }
    });

    document.querySelectorAll(".vl-offcanvas-toggle").forEach(function (btn) {
        btn.addEventListener("click", function () {
            if (btn.closest(".vl-offcanvas")) {
                setMenuOpen(false);
            } else {
                setMenuOpen(true, btn);
            }
        });
    });

    document.querySelectorAll(".vl-offcanvas-close-toggle, .vl-offcanvas-overlay").forEach(function (btn) {
        btn.addEventListener("click", function () { setMenuOpen(false); });
    });

    document.addEventListener("keydown", function (event) {
        if (!isMenuOpen()) return;
        if (event.key === "Escape") {
            setMenuOpen(false);
            return;
        }
        if (event.key !== "Tab") return;
        var oc = document.querySelector(".vl-offcanvas");
        if (!oc) return;
        var items = Array.prototype.filter.call(oc.querySelectorAll(offcanvasFocusableSel), function (el) {
            return el.offsetParent !== null;
        });
        if (!items.length) return;
        var first = items[0];
        var last = items[items.length - 1];
        if (event.shiftKey && (document.activeElement === first || !oc.contains(document.activeElement))) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && (document.activeElement === last || !oc.contains(document.activeElement))) {
            event.preventDefault();
            first.focus();
        }
    });

    /*----------------------------------------*/
    /*  data-background images
    /*----------------------------------------*/
    document.querySelectorAll("[data-background]").forEach(function (el) {
        el.style.backgroundImage = "url(" + el.getAttribute("data-background") + ")";
    });

    /*----------------------------------------*/
    /*  header search bar
    /*----------------------------------------*/
    var searchLastTrigger = null;

    function setSearchOpen(open, trigger) {
        document.querySelectorAll(".vl-header-search-bar").forEach(function (el) {
            el.classList.toggle("vl-search-open", open);
            el.setAttribute("aria-hidden", open ? "false" : "true");
            try { el.inert = !open; } catch (e) { /* older browsers */ }
        });
        document.querySelectorAll(".vl-offcanvas-overlay").forEach(function (el) { el.classList.toggle("vl-offcanvas-overlay-open", open); });
        if (open) {
            searchLastTrigger = trigger || null;
            pauseSmoothScroll();
            var input = document.querySelector(".vl-header-search-bar form input");
            if (input) window.setTimeout(function () { input.focus({ preventScroll: true }); }, 60);
        } else {
            resumeSmoothScroll();
            if (searchLastTrigger && typeof searchLastTrigger.focus === "function") {
                searchLastTrigger.focus({ preventScroll: true });
                searchLastTrigger = null;
            }
        }
    }

    document.querySelectorAll(".vl-search-toggle").forEach(function (btn) {
        btn.addEventListener("click", function (event) {
            event.stopPropagation();
            setSearchOpen(true, btn.closest("button") || btn);
        });
    });

    document.querySelectorAll(".vl-search-close").forEach(function (btn) {
        btn.addEventListener("click", function () { setSearchOpen(false); });
    });

    document.addEventListener("keydown", function (event) {
        if (event.key !== "Escape") return;
        var bar = document.querySelector(".vl-header-search-bar.vl-search-open");
        if (bar) setSearchOpen(false);
    });

    /*----------------------------------------*/
    /*  current page highlight in menus
    /*----------------------------------------*/
    (function () {
        var path = window.location.pathname.replace(/\/index\.html$/, "/").replace(/^\//, "");
        if (path === "" || path === "index.html") path = "index.html";
        document.querySelectorAll("header nav a[href], .vl-offcanvas nav a[href]").forEach(function (link) {
            var href = link.getAttribute("href").split("#")[0].split("?")[0].replace(/^\//, "");
            if (!href) return;
            if (href === path || (path === "index.html" && (href === "/" || href === "index.html"))) {
                link.setAttribute("aria-current", "page");
            }
        });
    })();

    /*----------------------------------------*/
    /*  swiper sliders (live pages only)
    /*----------------------------------------*/
    function initSwiper(selector, options) {
        if (typeof Swiper === "undefined" || !document.querySelector(selector)) {
            return;
        }
        if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches && options) {
            delete options.autoplay;
            options.allowTouchMove = true;
        }

        // Swiper resolves a string selector to the first match only; keep that
        // exact behaviour and just hold on to the instance.
        var instance = new Swiper(selector, options);

        if (!options || !options.autoplay) return;
        if (!instance || !instance.autoplay || !instance.el) return;

        // These marquees use delay:1, i.e. they animate continuously. Left
        // unmanaged they keep compositing while parked far off-screen or in a
        // background tab, stealing frames from whatever the user is doing.
        var shouldRunOnScreen = true;

        var sync = function () {
            if (!instance.autoplay) return;
            var run = shouldRunOnScreen && !document.hidden;
            if (run && !instance.autoplay.running) {
                instance.autoplay.start();
            } else if (!run && instance.autoplay.running) {
                instance.autoplay.stop();
            }
        };

        if (typeof IntersectionObserver !== "undefined") {
            new IntersectionObserver(function (entries) {
                shouldRunOnScreen = entries[0].isIntersecting;
                sync();
            }, { rootMargin: "150px 0px" }).observe(instance.el);
        }

        document.addEventListener("visibilitychange", sync);
    }

    // homepage platform marquee
    initSwiper(".marquee-swiper", {
        slidesPerView: 5,
        spaceBetween: 6,
        loop: true,
        speed: 6000,
        allowTouchMove: false,
        autoplay: { delay: 1, disableOnInteraction: false },
        breakpoints: {
            0: { slidesPerView: 2 },
            768: { slidesPerView: 3 },
            992: { slidesPerView: "auto" },
            1200: { slidesPerView: "auto" }
        }
    });

    // homepage vertical testimonial columns
    initSwiper(".swiper1", {
        direction: "vertical",
        slidesPerView: 3,
        spaceBetween: 30,
        loop: true,
        speed: 6000,
        allowTouchMove: false,
        autoplay: { delay: 1, disableOnInteraction: false }
    });

    initSwiper(".swiper2", {
        direction: "vertical",
        slidesPerView: 3,
        spaceBetween: 30,
        loop: true,
        speed: 5000,
        allowTouchMove: false,
        autoplay: { delay: 1, disableOnInteraction: false }
    });

    // about page testimonial carousel
    initSwiper(".about-testimonial-swiper", {
        slidesPerView: 5,
        spaceBetween: 30,
        centeredSlides: true,
        loop: true,
        keyboard: { enabled: true },
        pagination: { el: ".about-swiper-pagination1", clickable: true },
        autoplay: { delay: 2500, disableOnInteraction: false },
        breakpoints: {
            0: { slidesPerView: 1 },
            768: { slidesPerView: 2 },
            992: { slidesPerView: 3 },
            1400: { slidesPerView: 5 }
        }
    });

    // about page banner marquee
    initSwiper(".bannerabActive", {
        slidesPerView: 4,
        spaceBetween: 30,
        loop: true,
        speed: 6000,
        allowTouchMove: false,
        autoplay: { delay: 1, disableOnInteraction: false },
        breakpoints: {
            0: { slidesPerView: 1 },
            768: { slidesPerView: 2 },
            992: { slidesPerView: 3 },
            1200: { slidesPerView: 4 }
        }
    });

    // about page team slider
    initSwiper(".teamAbSwiperActive3", {
        slidesPerView: 4,
        spaceBetween: 30,
        pagination: { el: ".swiper-team-pagination3", clickable: true },
        autoplay: { delay: 2500, disableOnInteraction: false },
        breakpoints: {
            0: { slidesPerView: 1 },
            768: { slidesPerView: 2 },
            992: { slidesPerView: 3 },
            1200: { slidesPerView: 4 }
        }
    });

    // about page mission thumbs
    initSwiper(".MissionSwiper", {
        navigation: {
            nextEl: ".vlmission-button-next",
            prevEl: ".vlmission-button-prev"
        }
    });

    if (scrollManager && typeof scrollManager.markPreventElements === "function") {
        scrollManager.markPreventElements(document);
    }
})();

/*----------------------------------------*/
/*   reveal animation (.reveal image wipe)
/*   CSS ships .reveal{visibility:hidden}; this must always
/*   make the containers visible again, animated or not.
/*----------------------------------------*/
(function () {
    "use strict";

    var containers = document.querySelectorAll(".reveal");
    if (!containers.length) return;

    function showAll() {
        containers.forEach(function (container) {
            container.style.visibility = "visible";
        });
    }

    var reduceMotion = window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion || typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
        showAll();
        return;
    }

    try {
        gsap.registerPlugin(ScrollTrigger);
        containers.forEach(function (container) {
            var image = container.querySelector("img");
            var tl = gsap.timeline({
                scrollTrigger: {
                    trigger: container,
                    toggleActions: "play none none none"
                }
            });
            tl.set(container, { autoAlpha: 1 });
            tl.from(container, { xPercent: -100, duration: 1.5, ease: "power2.out" });
            if (image) {
                tl.from(image, { xPercent: 100, scale: 1.3, duration: 1.5, ease: "power2.out" }, "<");
            }
        });
    } catch (err) {
        showAll();
    }
})();
