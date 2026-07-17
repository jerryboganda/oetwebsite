;(function (window, document) {
    "use strict";

    var scrollManager = {
        lenis: null,
        isReady: false,
        isStopped: false,
        listeners: [],
        excludedSelector: [
            "[data-lenis-prevent]",
            ".vl-offcanvas",
            ".vl-offcanvas-wrapper",
            ".vl-offcanvas-overlay"
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
            scope.querySelectorAll(this.excludedSelector).forEach(function (element) {
                element.setAttribute("data-lenis-prevent", "");
            });
        },
        stop: function () {
            if (this.lenis && !this.isStopped) {
                this.lenis.stop();
                this.isStopped = true;
            }
        },
        start: function () {
            if (this.lenis && this.isStopped) {
                this.lenis.start();
                this.isStopped = false;
            }
        },
        scrollTo: function (target, options) {
            var settings = options || {};

            if (this.lenis) {
                this.lenis.scrollTo(target, settings);
                return;
            }

            var topValue = typeof target === "number" ? target : 0;
            if (target && typeof target.getBoundingClientRect === "function") {
                topValue = target.getBoundingClientRect().top + this.getScrollY() + (settings.offset || 0);
            }

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
            this.scrollTo(target, {
                offset: -this.getHeaderOffset() - 16,
                duration: 1.05,
                lerp: this.isTouchDevice ? 0.16 : 0.11
            });

            if (window.history && typeof window.history.pushState === "function") {
                window.history.pushState(null, "", destination.hash);
            } else {
                window.location.hash = destination.hash;
            }
        },
        refresh: function () {
            if (this.lenis && typeof this.lenis.resize === "function") {
                this.lenis.resize();
            }

            this.emitScroll();
        },
        init: function () {
            var self = this;
            if (this.isReady) return;

            this.markPreventElements(document);
            document.documentElement.style.scrollBehavior = "auto";
            document.addEventListener("click", function (event) {
                self.handleAnchorClick(event);
            }, false);

            if (this.prefersReducedMotion || typeof window.Lenis === "undefined") {
                this.isReady = true;
                return;
            }

            this.lenis = new window.Lenis({
                lerp: this.isTouchDevice ? 0.14 : 0.095,
                smoothWheel: true,
                syncTouch: this.isTouchDevice,
                syncTouchLerp: this.isTouchDevice ? 0.13 : 0.08,
                touchInertiaExponent: this.isTouchDevice ? 1.35 : 1.45,
                touchMultiplier: 1,
                wheelMultiplier: this.isTouchDevice ? 1 : 0.95,
                autoResize: true,
                overscroll: true,
                autoRaf: false,
                prevent: function (node) {
                    return !!(node && typeof node.closest === "function" && node.closest(self.excludedSelector));
                }
            });

            this.lenis.on("scroll", function () {
                self.emitScroll();
            });

            this.ticker = function (time) {
                self.lenis.raf(time);
                window.requestAnimationFrame(self.ticker);
            };
            window.requestAnimationFrame(this.ticker);

            window.addEventListener("load", function () {
                self.refresh();
            });

            window.addEventListener("resize", function () {
                self.refresh();
            });

            this.isReady = true;
        }
    };

    window.OETPreviewSmoothScroll = scrollManager;

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", function () {
            scrollManager.init();
        });
    } else {
        scrollManager.init();
    }
})(window, document);

(function($){
    "use strict";

    var scrollManager = window.OETPreviewSmoothScroll || null;
    var getScrollTop = function () {
      if (scrollManager && typeof scrollManager.getScrollY === "function") {
        return scrollManager.getScrollY();
      }

      return $(window).scrollTop();
    };
    var bindScrollEvent = function (callback) {
      if (scrollManager && scrollManager.lenis && typeof scrollManager.onScroll === "function") {
        scrollManager.onScroll(callback);
      } else {
        $(window).on("scroll", callback);
      }

      callback();
    };
    var pauseSmoothScroll = function () {
      if (scrollManager && typeof scrollManager.stop === "function") {
        scrollManager.stop();
      }
    };
    var resumeSmoothScroll = function () {
      if (!scrollManager || typeof scrollManager.start !== "function") {
        return;
      }

      if (!$(".vl-offcanvas").hasClass("vl-offcanvas-open")) {
        scrollManager.start();
      }
    };

    // page-progress
    var progressPath = document.querySelector(".progress-wrap path");
    if (progressPath) {
      var pathLength = progressPath.getTotalLength();
      progressPath.style.transition = progressPath.style.WebkitTransition =
        "none";
      progressPath.style.strokeDasharray = pathLength + " " + pathLength;
      progressPath.style.strokeDashoffset = pathLength;
      progressPath.getBoundingClientRect();
      progressPath.style.transition = progressPath.style.WebkitTransition =
        "stroke-dashoffset 10ms linear";
      var offset = 50;
      var updateProgress = function () {
        var scroll = getScrollTop();
        var height = Math.max($(document).height() - $(window).height(), 1);
        var progress = pathLength - (scroll * pathLength) / height;
        progressPath.style.strokeDashoffset = progress;

        if (scroll > offset) {
          jQuery(".progress-wrap").addClass("active-progress");
        } else {
          jQuery(".progress-wrap").removeClass("active-progress");
        }
      };
      bindScrollEvent(updateProgress);
      jQuery(".progress-wrap").on("click", function (event) {
        event.preventDefault();
        if (scrollManager && typeof scrollManager.scrollTo === "function") {
          scrollManager.scrollTo(0, {
            duration: 1.05,
            lerp: scrollManager.isTouchDevice ? 0.16 : 0.11
          });
        } else {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
        return false;
      });
    }

 
     // mobile menu 
     var vlMenuWrap = $('.vl-preview-menu-active > ul').clone();
     var vlSideMenu = $('.vl-offcanvas-menu nav');
     vlSideMenu.append(vlMenuWrap);
     if ($(vlSideMenu).find('.sub-menu, .vl-mega-menu').length != 0) {
       $(vlSideMenu).find('.sub-menu, .vl-mega-menu').parent().append('<button class="vl-menu-close"><i class="fas fa-chevron-right"></i></button>');
     }
 
     var sideMenuList = $('.vl-offcanvas-menu nav > ul > li button.vl-menu-close, .vl-offcanvas-menu nav > ul li.has-dropdown > a');
     $(sideMenuList).on('click', function (e) {
       console.log(e);
       e.preventDefault();
       if (!($(this).parent().hasClass('active'))) {
         $(this).parent().addClass('active');
         $(this).siblings('.sub-menu, .vl-mega-menu').slideDown();
       } else {
         $(this).siblings('.sub-menu, .vl-mega-menu').slideUp();
         $(this).parent().removeClass('active');
       }
     });


 $(".vl-offcanvas-toggle").on('click',function(){
     $(".vl-offcanvas").addClass("vl-offcanvas-open");
     $(".vl-offcanvas-overlay").addClass("vl-offcanvas-overlay-open");
     pauseSmoothScroll();
 });

 $(".vl-offcanvas-close-toggle,.vl-offcanvas-overlay").on('click', function(){
     $(".vl-offcanvas").removeClass("vl-offcanvas-open");
     $(".vl-offcanvas-overlay").removeClass("vl-offcanvas-overlay-open");
     resumeSmoothScroll();
 });
    
    // stiky js
    bindScrollEvent(function () {
      var scroll = getScrollTop();
      if (scroll < 100) {
        $("#vl-header-sticky").removeClass("header-sticky");
      } else {
        $("#vl-header-sticky").addClass("header-sticky");
      }
    });

    // jarallax  
  if($('.jarallax').length){
    $('.jarallax').jarallax({
      speed: 0.2,
    });
  }

})(jQuery);


/* ================================
	Smooth Scroller And Title Animation Js Start
================================ */
    if ($('#smooth-wrapper').length && $('#smooth-content').length) {
        gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText);

        gsap.config({
            nullTargetWarn: false,
        });

        let smoother = ScrollSmoother.create({
            wrapper: "#smooth-wrapper",
            content: "#smooth-content",
            smooth: 2,
            effects: true,
            smoothTouch: 0.1,
            normalizeScroll: false,
            ignoreMobileResize: true,
        });
    }


    function initHeadingAnimation() {
		
		if($('.text-effect').length) {
			var textheading = $(".text-effect");

			if(textheading.length === 0) return; gsap.registerPlugin(SplitText); textheading.each(function(index, el) {
				
				el.split = new SplitText(el, { 
					type: "lines,words,chars",
					linesClass: "split-line"
				});
				
				if( $(el).hasClass('text-effect') ){
					gsap.set(el.split.chars, {
						opacity: .3,
						x: "-7",
					});
				}
				el.anim = gsap.to(el.split.chars, {
					scrollTrigger: {
						trigger: el,
						start: "top 92%",
						end: "top 60%",
						markers: false,
						scrub: 1,
					},

					x: "0",
					y: "0",
					opacity: 1,
					duration: .7,
					stagger: 0.2,
				});
				
			});
		}
		
		if ($('.text-anime-style-1').length) {
			let staggerAmount 	= 0.05,
				translateXValue = 0,
				delayValue 		= 0.5,
			   animatedTextElements = document.querySelectorAll('.text-anime-style-1');
			
			animatedTextElements.forEach((element) => {
				let animationSplitText = new SplitText(element, { type: "chars, words" });
					gsap.from(animationSplitText.words, {
					duration: 1,
					delay: delayValue,
					x: 20,
					autoAlpha: 0,
					stagger: staggerAmount,
					scrollTrigger: { trigger: element, start: "top 85%" },
					});
			});		
		}
		
		if ($('.text-anime-style-2').length) {				
			let	 staggerAmount 		= 0.03,
				 translateXValue	= 20,
				 delayValue 		= 0.1,
				 easeType 			= "power2.out",
				 animatedTextElements = document.querySelectorAll('.text-anime-style-2');
			
			animatedTextElements.forEach((element) => {
				let animationSplitText = new SplitText(element, { type: "chars, words" });
					gsap.from(animationSplitText.chars, {
						duration: 1,
						delay: delayValue,
						x: translateXValue,
						autoAlpha: 0,
						stagger: staggerAmount,
						ease: easeType,
						scrollTrigger: { trigger: element, start: "top 85%"},
					});
			});		
		}
		
		if ($('.text-anime-style-3').length) {		
			let	animatedTextElements = document.querySelectorAll('.text-anime-style-3');
			
			 animatedTextElements.forEach((element) => {
				//Reset if needed
				if (element.animation) {
					element.animation.progress(1).kill();
					element.split.revert();
				}

				element.split = new SplitText(element, {
					type: "lines,words,chars",
					linesClass: "split-line",
				});
				gsap.set(element, { perspective: 400 });

				gsap.set(element.split.chars, {
					opacity: 0,
					x: "50",
				});

				element.animation = gsap.to(element.split.chars, {
					scrollTrigger: { trigger: element,	start: "top 90%" },
					x: "0",
					y: "0",
					rotateX: "0",
					opacity: 1,
					duration: 1,
					ease: Back.easeOut,
					stagger: 0.02,
				});
			});		
		}
	}
	
	if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
            initHeadingAnimation();
        });
    } else {
        window.addEventListener("load", initHeadingAnimation);
    }
