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


sal();



;(function (window, document) {
    "use strict";

    var scrollManager = {
        lenis: null,
        isReady: false,
        isStopped: false,
        listeners: [],
        observer: null,
        ticker: null,
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
            if (this.lenis && this.isStopped) {
                this.lenis.start();
                this.isStopped = false;
            }
        },
        stop: function () {
            if (this.lenis && !this.isStopped) {
                this.lenis.stop();
                this.isStopped = true;
            }
        },
        refresh: function () {
            if (this.lenis && typeof this.lenis.resize === "function") {
                this.lenis.resize();
            }

            if (window.ScrollTrigger && typeof window.ScrollTrigger.refresh === "function") {
                window.ScrollTrigger.refresh();
            }

            this.emitScroll();
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

            this.scrollTo(target, {
                offset: -this.getHeaderOffset() - 16,
                duration: 1.05,
                lerp: this.isTouchDevice ? 0.16 : 0.11,
                lock: false,
                force: true
            });

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
                if (window.ScrollTrigger && typeof window.ScrollTrigger.update === "function") {
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
                this.observer = new MutationObserver(function (mutations) {
                    mutations.forEach(function (mutation) {
                        mutation.addedNodes.forEach(function (node) {
                            if (node.nodeType === 1) {
                                self.markPreventElements(node);
                            }
                        });
                    });
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
                self.refresh();
            });

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



(function($){
    "use strict";

    var scrollManager = window.OETSmoothScroll || null;
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

      var hasOpenOverlay = $(".vl-offcanvas").hasClass("vl-offcanvas-open") ||
        $(".vl-header-search-bar").hasClass("vl-search-open") ||
        $(".mfp-wrap").hasClass("mfp-ready");

      if (!hasOpenOverlay) {
        scrollManager.start();
      }
    };

    /*----------------------------------------*/
    /*  02.back-to-top
    /*----------------------------------------*/

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
            lerp: scrollManager.isTouchDevice ? 0.16 : 0.11,
            force: true
          });
        } else {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
        return false;
      });
    }
     

    /*----------------------------------------*/
    /*  03.stiky js
    /*----------------------------------------*/

    bindScrollEvent(function () {
      var scroll = getScrollTop();
      if (scroll < 100) {
        $("#vl-header-sticky").removeClass("header-sticky");
      } else {
        $("#vl-header-sticky").addClass("header-sticky");
      }
    });
    
    /*----------------------------------------*/
    /* 04. mobile menu js
    /*----------------------------------------*/

    var vlMenuWrap = $('.vl-mobile-menu-active > ul').clone();
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


        // data bg img 
    $("[data-background]").each(function () {
        $(this).css("background-image", "url(" + $(this).attr("data-background") + ")")
    })


    /*----------------------------------------*/
    /*  05. Search Bar
    /*----------------------------------------*/
    $(".vl-search-toggle").on('click', function(){
      $(".vl-header-search-bar").addClass("vl-search-open");
      $(".vl-offcanvas-overlay").addClass("vl-offcanvas-overlay-open");
      pauseSmoothScroll();
    });

    $(".vl-search-close,.vl-offcanvas-overlay").on('click', function(){
      $(".vl-header-search-bar").removeClass("vl-search-open");
      $(".vl-offcanvas-overlay").removeClass("vl-offcanvas-overlay-open");
      resumeSmoothScroll();
    });


    /*----------------------------------------*/
    /*  06. counter up
    /*----------------------------------------*/

    $('.counter').counterUp({
        delay: 10,
        time: 1000
    });

    /*----------------------------------------*/
    /*  07. popup image 
    /*----------------------------------------*/

    $('.popup-image').magnificPopup({
        type: 'image',
        callbacks: {
          open: pauseSmoothScroll,
          close: resumeSmoothScroll
        }
    });

    /*----------------------------------------*/
    /*  08. popup video 
    /*----------------------------------------*/

    $('.popup-video').magnificPopup({
      type: 'iframe',
      callbacks: {
        open: pauseSmoothScroll,
        close: resumeSmoothScroll
      }
    });

    /*----------------------------------------*/
    /*  09. nice select
    /*----------------------------------------*/

    $('select').niceSelect();
    if (scrollManager && typeof scrollManager.markPreventElements === "function") {
      scrollManager.markPreventElements(document);
    }

    
    /*----------------------------------------*/
    /*  10. preloader
    /*----------------------------------------*/
      var hidePreloader = function () {
        $(".preloader").fadeOut(200);
      };

      $(window).on("load", function () {
        setTimeout(hidePreloader, 200);
      });

      $(document).ready(function () {
        setTimeout(hidePreloader, 1200);
      });


    /*----------------------------------------*/
    /*  11. thumb slider (home one)
    /*----------------------------------------*/
    
    var swiper = new Swiper(".marquee-swiper", {
      slidesPerView: 5,
      spaceBetween: 6,
      loop: true,
      speed: 6000,
      allowTouchMove: false,
      autoplay: {
        delay: 1,
        disableOnInteraction: false
      },
      breakpoints: {
            0: {
              slidesPerView: 2,
            },
            768: {
              slidesPerView: 3,
            },
            992: {
              slidesPerView: 'auto',
            },
            1200: {
              slidesPerView: 'auto',
            }
        },
    });

    /*----------------------------------------*/
    /*  12. service slider (home one)
    /*----------------------------------------*/

    var swiper = new Swiper(".vlServiceActive", {
        slidesPerView: 5,
        spaceBetween: 30,
        loop: true,
        keyboard: {
            enabled: true,
        },
        autoplay: {
          delay: 2500, 
          disableOnInteraction: false,
        },
        pagination: {
            el: ".swiper-pagination",
            clickable: true,
        },
        breakpoints: {
          0: {
            slidesPerView: 1,
          },
          768: {
            slidesPerView: 2,
          },
          992: {
            slidesPerView: 3,
          },
          1200: {
            slidesPerView: 5,
          }
      },
    });

    /*----------------------------------------*/
    /*  13. testimonial slider (home one)
    /*----------------------------------------*/

    var swiper = new Swiper(".vl-testimonial-active", {
        slidesPerView: 5,
        spaceBetween: 30,
        centeredSlides: true, 
        keyboard: {
            enabled: true,
        },
        pagination: {
            el: ".swiper-pagination1",
            clickable: true,
        },
        loop:true,
        autoplay: {
          delay: 2500, 
          disableOnInteraction: false,
        },
        breakpoints: {
            0: {
              slidesPerView: 1,
            },
            768: {
              slidesPerView: 2,
            },
            992: {
              slidesPerView: 3,
            },
            1200: {
              slidesPerView: 5,
            }
        },
    });

    /*----------------------------------------*/
    /*  14. portfolioActive (home one)
    /*----------------------------------------*/
    
  
    /*----------------------------------------*/
    /*  about testimonial slider (about page)
    /*----------------------------------------*/

    var swiper = new Swiper(".about-testimonial-swiper", {
        slidesPerView: 5,
        spaceBetween: 30,
        centeredSlides: true,
        loop: true,
        keyboard: {
            enabled: true,
        },
        pagination: {
            el: ".about-swiper-pagination1",
            clickable: true,
        },
        autoplay: {
          delay: 2500,
          disableOnInteraction: false,
        },
        breakpoints: {
            0: {
              slidesPerView: 1,
            },
            768: {
              slidesPerView: 2,
            },
            992: {
              slidesPerView: 3,
            },
            1400: {
              slidesPerView: 5,
            }
        },
    });
    var swiper = new Swiper(".portfolioActive", {
        slidesPerView: 3,
        spaceBetween: 30,
        navigation: {
          nextEl: ".portfolio-button-next",
          prevEl: ".portfolio-button-prev",
        },
        loop:true,
        autoplay: {
          delay: 2500, 
          disableOnInteraction: false,
        },
        breakpoints: {
            0: {
              slidesPerView: 1,
            },
            768: {
              slidesPerView: 2,
            },
            992: {
              slidesPerView: 3,
            },
            1200: {
              slidesPerView: 3,
            }
        },
    });


  /*----------------------------------------*/
  /* 15. testimonial slider (home three)
  /*----------------------------------------*/
     var swiper = new Swiper(".testimonialSwiperActive3", {
      slidesPerView: 2,
      spaceBetween: 30,
      loop:true,
      pagination: {
        el: ".swiper-pagination3",
        clickable: true,
      },
      autoplay: {
          delay: 2500, 
          disableOnInteraction: false,
      },
      breakpoints: {
            0: {
              slidesPerView: 1,
            },
            768: {
              slidesPerView: 2,
            },
            992: {
              slidesPerView: 2,
            },
            1200: {
              slidesPerView: 2,
            }
        },
    });

  /*----------------------------------------*/
  /* 16. team slider (home three)
  /*----------------------------------------*/
  var swiper = new Swiper(".teamSwiperActive3", {
    slidesPerView: 4,
    spaceBetween: 30,
    loop:true,
    pagination: {
      el: ".swiper-team-pagination3",
      clickable: true,
    },
      autoplay: {
          delay: 2500, 
          disableOnInteraction: false,
      },
      breakpoints: {
          0: {
            slidesPerView: 1,
          },
          768: {
            slidesPerView: 2,
          },
          992: {
            slidesPerView: 3,
          },
          1200: {
            slidesPerView: 4,
          }
      },
  });


  /*----------------------------------------*/
  /* 17. portfolio slider (home three)
  /*----------------------------------------*/
  
  var swiper = new Swiper(".portfolioSwiperThree", {
    slidesPerView: 4,
    spaceBetween: 30,
    navigation: {
      nextEl: ".portfolio-button-next-3",
      prevEl: ".portfolio-button-prev-3",
    },
    loop:true,
    autoplay: {
        delay: 2500, 
        disableOnInteraction: false,
    },
    breakpoints: {
        0: {
          slidesPerView: 1,
        },
        768: {
          slidesPerView: 2,
        },
        992: {
          slidesPerView: 3,
        },
        1200: {
          slidesPerView: 4,
        }
    },
  });

  /*----------------------------------------*/
  /* 18. vlServiceActivefive (home five)
  /*----------------------------------------*/
  var swiper = new Swiper(".vlServiceActivefive", {
        slidesPerView: 4,
        spaceBetween: 30,
        loop:true,
        keyboard: {
            enabled: true,
        },
        autoplay: {
          delay: 2500, 
          disableOnInteraction: false,
        },
        pagination: {
            el: ".swiper-pagination",
            clickable: true,
        },
        breakpoints: {
          0: {
            slidesPerView: 1,
          },
          768: {
            slidesPerView: 2,
          },
          992: {
            slidesPerView: 3,
          },
          1200: {
            slidesPerView: 4,
          }
      },
    });


  /*----------------------------------------*/
  /*  19. caseSwiperActive5 (home five)
  /*----------------------------------------*/
   var swiper = new Swiper(".caseSwiperActive5", {
        slidesPerView: 4,
        spaceBetween: 30,
        loop:true,
        keyboard: {
            enabled: true,
        },
        autoplay: {
          delay: 2500, 
          disableOnInteraction: false,
        },
        navigation: {
          nextEl: ".case-button-next-5",
          prevEl: ".case-button-prev-5",
        },
        breakpoints: {
          0: {
            slidesPerView: 1,
          },
          768: {
            slidesPerView: 2,
          },
          992: {
            slidesPerView: 3,
          },
          1200: {
            slidesPerView: 4,
          }
      },
    });


  /*----------------------------------------*/
  /*  20. teamSwiperActivefive (home five)
  /*----------------------------------------*/  
    var swiper = new Swiper(".teamSwiperActivefive", {
        slidesPerView: 4,
        spaceBetween: 30,
        loop:true,
        keyboard: {
            enabled: true,
        },
        autoplay: {
          delay: 2500, 
          disableOnInteraction: false,
        },
        pagination: {
            el: ".swiper-pagination5",
            clickable: true,
        },
        breakpoints: {
          0: {
            slidesPerView: 1,
          },
          768: {
            slidesPerView: 2,
          },
          992: {
            slidesPerView: 3,
          },
          1200: {
            slidesPerView: 4,
          }
      },
    });

  /*----------------------------------------*/
  /*  21. teamSwiperActivesix (home six)
  /*----------------------------------------*/ 
    var swiper = new Swiper(".teamSwiperActivesix", {
        slidesPerView: 3,
        spaceBetween: 30,
        loop:true,
        keyboard: {
            enabled: true,
        },
        autoplay: {
          delay: 2500, 
          disableOnInteraction: false,
        },
        pagination: {
            el: ".swiper-pagination",
            clickable: true,
        },
        breakpoints: {
          0: {
            slidesPerView: 1,
          },
          768: {
            slidesPerView: 2,
          },
          992: {
            slidesPerView: 3,
          },
          1200: {
            slidesPerView: 3,
          }
      },
    });

  /*----------------------------------------*/
  /*  22. testimonialSwiperActivesix (home six)
  /*----------------------------------------*/ 
  var swiper = new Swiper(".testimonialSwiperActivesix", {
    autoplay: {
        delay: 2500, 
        disableOnInteraction: false,
      },
    navigation: {
      nextEl: ".testimonial-button-next-6",
      prevEl: ".testimonial-button-prev-6",
    },
  });


  /*----------------------------------------*/
  /*  23. teamSwiperActiveseven (home seven)
  /*----------------------------------------*/ 
  var swiper = new Swiper(".teamSwiperActiveseven", {
        slidesPerView: 3,
        spaceBetween: 30,
        keyboard: {
            enabled: true,
        },
        autoplay: {
          delay: 2500, 
          disableOnInteraction: false,
        },
        pagination: {
            el: ".swiper-pagination5",
            clickable: true,
        },
        breakpoints: {
          0: {
            slidesPerView: 1,
          },
          768: {
            slidesPerView: 2,
          },
          992: {
            slidesPerView: 3,
          },
          1200: {
            slidesPerView: 3,
          }
      },
    });


  /*----------------------------------------*/
  /*  24. testimonialSwiperActive7 (home seven)
  /*----------------------------------------*/ 
  var swiper = new Swiper(".testimonialSwiperActive7", {
    autoplay: {
        delay: 2500, 
        disableOnInteraction: false,
      },
    navigation: {
      nextEl: ".testimonial-button-next-7",
      prevEl: ".testimonial-button-prev-7",
    },
  });


  /*----------------------------------------*/
  /*  25. serviceSwiperActive7 (home seven)
  /*----------------------------------------*/
   var swiper = new Swiper(".serviceSwiperActive7", {
        slidesPerView: 4,
        spaceBetween: 30,
        keyboard: {
            enabled: true,
        },
        autoplay: {
          delay: 2500, 
          disableOnInteraction: false,
        },
        navigation: {
          nextEl: ".service-button-next-9",
          prevEl: ".service-button-prev-9",
        },
        breakpoints: {
          0: {
            slidesPerView: 1,
          },
          768: {
            slidesPerView: 2,
          },
          992: {
            slidesPerView: 3,
          },
          1200: {
            slidesPerView: 4,
          }
      },
    });

  /*----------------------------------------*/
  /*  26. testiSwiperActive7 (home seven)
  /*----------------------------------------*/
   var swiper = new Swiper(".testiSwiperActive7", {
        slidesPerView: 3,
        spaceBetween: 60,
        keyboard: {
            enabled: true,
        },
        autoplay: {
          delay: 2500, 
          disableOnInteraction: false,
        },
        navigation: {
          nextEl: ".testi-button-next-9",
          prevEl: ".testi-button-prev-9",
        },
        breakpoints: {
          0: {
            slidesPerView: 1,
          },
          768: {
            slidesPerView: 2,
          },
          992: {
            slidesPerView: 2,
          },
          1200: {
            slidesPerView: 3,
          }
      },
    });


  /*----------------------------------------*/
  /*  27. testiSwiperActive10 (home 10)
  /*----------------------------------------*/
    
  var swiper = new Swiper(".testvertical", {
      direction: "vertical",
      slidesPerView: 1,
      //loop: true,
      spaceBetween: 30,
      speed: 10000,
      autoplay: {
        delay: 2500,             
      },
      breakpoints: {
          0: {
            slidesPerView: 1,
          },
          768: {
            slidesPerView: 2,
          },
          992: {
            slidesPerView: 2,
          },
          1200: {
            slidesPerView: 3,
          }
      },
    });

  /*----------------------------------------*/
  /*  28. testiSwiperActive4 (home 4)
  /*----------------------------------------*/
    var swiper = new Swiper(".testiSwiperActive4", {
      slidesPerView: 2,
      spaceBetween: 30,
      pagination: {
        el: ".swiper-pagination4",
        clickable:true,
      },
      breakpoints: {
          0: {
            slidesPerView: 1,
          },
          768: {
            slidesPerView: 2,
          },
          992: {
            slidesPerView: 2,
          },
          1200: {
            slidesPerView: 2,
          }
      },
    });

  /*----------------------------------------*/
  /*  29. teamSwiperActive4 (home 4)
  /*----------------------------------------*/
    var swiper = new Swiper(".teamSwiperActive4", {
        slidesPerView: 4,
        spaceBetween: 30,
        loop:true,
        keyboard: {
            enabled: true,
        },
        autoplay: {
          delay: 2500, 
          disableOnInteraction: false,
        },
        navigation: {
          nextEl: ".team-button-next-4",
          prevEl: ".team-button-prev-4",
        },
        breakpoints: {
          0: {
            slidesPerView: 1,
          },
          768: {
            slidesPerView: 2,
          },
          992: {
            slidesPerView: 3,
          },
          1200: {
            slidesPerView: 4,
          }
      },
    });
    

  /*----------------------------------------*/
  /*  30. caseActive4 (home 4)
  /*----------------------------------------*/
    var swiper = new Swiper(".caseActive4", {
      slidesPerView: 2,
      spaceBetween: 30,
      loop:true,
      pagination: {
        el: ".swiper-paginationCase4",
        clickable:true,
      },
      breakpoints: {
          0: {
            slidesPerView: 1,
          },
          768: {
            slidesPerView: 2,
          },
          992: {
            slidesPerView: 2,
          },
          1200: {
            slidesPerView: 2,
          }
      },
    });


  /*----------------------------------------*/
  /*  31. serviceSwiperActive4 (home 4)
  /*----------------------------------------*/
    var swiper = new Swiper(".serviceSwiperActive4", {
        slidesPerView: 4,
        spaceBetween: 30,
        loop:true,
        keyboard: {
            enabled: true,
        },
        autoplay: {
          delay: 2500, 
          disableOnInteraction: false,
        },
        navigation: {
          nextEl: ".service-button-next-4",
          prevEl: ".service-button-prev-4",
        },
        breakpoints: {
          0: {
            slidesPerView: 1,
          },
          768: {
            slidesPerView: 2,
          },
          992: {
            slidesPerView: 2,
          },
          1200: {
            slidesPerView: 4,
          }
      },
    });

  /*----------------------------------------*/
  /*  32. testimonialSwiperActive2 (home 2)
  /*----------------------------------------*/
    var swiper = new Swiper(".testimonialSwiperActive2", {
      slidesPerView: 3,
      spaceBetween: 30,
      pagination: {
        el: ".swiper-pagination4",
        clickable:true,
      },
      loop:true,
      autoplay: {
          delay: 2500, 
          disableOnInteraction: false,
      },
      breakpoints: {
          0: {
            slidesPerView: 1,
          },
          768: {
            slidesPerView: 2,
          },
          992: {
            slidesPerView: 2,
          },
          1200: {
            slidesPerView: 3,
          }
      },
    });


  /*----------------------------------------*/
  /*  33. teamSwiperActive2 (home 4)
  /*----------------------------------------*/
    var swiper = new Swiper(".teamSwiperActive2", {
        slidesPerView: 4,
        spaceBetween: 30,
        loop:true,
        keyboard: {
            enabled: true,
        },
        autoplay: {
          delay: 2500, 
          disableOnInteraction: false,
        },
        navigation: {
          nextEl: ".team-button-next-2",
          prevEl: ".team-button-prev-2",
        },
        breakpoints: {
          0: {
            slidesPerView: 1,
          },
          768: {
            slidesPerView: 2,
          },
          992: {
            slidesPerView: 3,
          },
          1200: {
            slidesPerView: 4,
          }
      },
    });

  /*----------------------------------------*/
  /*  34. portfolioSwiperActive2 (home 2)
  /*----------------------------------------*/
    var swiper = new Swiper(".portfolioSwiperActive2", {
        slidesPerView: 4,
        spaceBetween: 30,
        loop:true,
        keyboard: {
            enabled: true,
        },
        autoplay: {
          delay: 2500, 
          disableOnInteraction: false,
        },
        navigation: {
          nextEl: ".portfolio-button-next-2",
          prevEl: ".portfolio-button-prev-2",
        },
        breakpoints: {
          0: {
            slidesPerView: 1,
          },
          768: {
            slidesPerView: 2,
          },
          992: {
            slidesPerView: 3,
          },
          1200: {
            slidesPerView: 4,
          }
      },
    });    
    


  /*----------------------------------------*/
  /*  35. bannerSliderAc2 (home 2)
  /*----------------------------------------*/ 

 var swiper = new Swiper(".bannerSliderAc2", {
      spaceBetween: 30,
      centeredSlides: true,
      loop:true,
      effect: "fade",
      autoplay: {
        delay: 3500,
        disableOnInteraction: false,
      },
      pagination: {
        el: ".swiper-pagination",
        type: "fraction",
      },
 });

  /*----------------------------------------*/
  /*  36. bannerabActive (about page)
  /*----------------------------------------*/ 

    var swiper = new Swiper(".bannerabActive", {
      slidesPerView: 4,
      spaceBetween: 30,
      loop: true,
      speed: 6000,
      allowTouchMove: false,
      autoplay: {
        delay: 1,
        disableOnInteraction: false
      },
      breakpoints: {
            0: {
              slidesPerView: 1,
            },
            768: {
              slidesPerView: 2,
            },
            992: {
              slidesPerView: 3,
            },
            1200: {
              slidesPerView: 4,
            }
        },
    });

  /*----------------------------------------*/
  /*  37. team slider about page (about page)
  /*----------------------------------------*/

  var swiper = new Swiper(".teamAbSwiperActive3", {
    slidesPerView: 4,
    spaceBetween: 30,
    pagination: {
      el: ".swiper-team-pagination3",
      clickable: true,
    },
      autoplay: {
          delay: 2500, 
          disableOnInteraction: false,
      },
      breakpoints: {
          0: {
            slidesPerView: 1,
          },
          768: {
            slidesPerView: 2,
          },
          992: {
            slidesPerView: 3,
          },
          1200: {
            slidesPerView: 4,
          }
      },
  });

  /*----------------------------------------*/
  /*  38. bannerSliderAc4 (home 4)
  /*----------------------------------------*/ 

 var swiper = new Swiper(".bannerSliderAc4", {
      spaceBetween: 30,
      centeredSlides: true,
      loop:true,
      effect: 'fade',
      autoplay: {
        delay: 3500,
        disableOnInteraction: false,
      },
      navigation: {
        nextEl: ".banner-button-next-4",
        prevEl: ".banner-button-prev-4",
      },
 });
    
/*----------------------------------------*/
/*   39. bannerSwiperActive7 (home 7)
/*----------------------------------------*/ 

 var swiper = new Swiper(".bannerSwiperActive7", {
      spaceBetween: 30,
      centeredSlides: true,
      loop:true,
      effect: 'fade',
      autoplay: {
        delay: 3500,
        disableOnInteraction: false,
      },
      autoplay: {
        delay: 2000,
      },
      speed: 2000,
      navigation: {
        nextEl: ".baner-button-next-7",
        prevEl: ".baner-button-prev-7",
      },
 });


   /*----------------------------------------*/
  /*  40. caseSwiperActive7 (home 7)
  /*----------------------------------------*/
    var swiper = new Swiper(".caseSwiperActive7", {
        slidesPerView: 4,
        spaceBetween: 30,
        loop:true,
        keyboard: {
            enabled: true,
        },
        autoplay: {
          delay: 2500, 
          disableOnInteraction: false,
        },
        navigation: {
          nextEl: ".service-button-next-4",
          prevEl: ".service-button-prev-4",
        },
        breakpoints: {
          0: {
            slidesPerView: 1,
          },
          768: {
            slidesPerView: 2,
          },
          992: {
            slidesPerView: 3,
          },
          1200: {
            slidesPerView: 4,
          }
      },
    });


  /*----------------------------------------*/
  /*  41. teamSwiperActive7 (home 7)
  /*----------------------------------------*/
    var swiper = new Swiper(".teamSwiperActive7", {
        slidesPerView: 3,
        spaceBetween: 30,
        loop:true,
        keyboard: {
            enabled: true,
        },
        autoplay: {
          delay: 2500, 
          disableOnInteraction: false,
        },
        pagination: {
            el: ".swiper-pagination7",
            clickable: true,
        },
        breakpoints: {
          0: {
            slidesPerView: 1,
          },
          768: {
            slidesPerView: 2,
          },
          992: {
            slidesPerView: 3,
          },
          1200: {
            slidesPerView: 3,
          }
      },
    });

  /*----------------------------------------*/
  /*  42. teamSwiperActive8 (home 8)
  /*----------------------------------------*/
    var swiper = new Swiper(".teamSwiperActive8", {
        slidesPerView: 4,
        spaceBetween: 30,
        loop:true,
        keyboard: {
            enabled: true,
        },
        autoplay: {
          delay: 2500, 
          disableOnInteraction: false,
        },
        navigation: {
          nextEl: ".team-button-next-8",
          prevEl: ".team-button-prev-8",
        },
        breakpoints: {
          0: {
            slidesPerView: 1,
          },
          768: {
            slidesPerView: 2,
          },
          992: {
            slidesPerView: 3,
          },
          1200: {
            slidesPerView: 4,
          }
      },
    });


  // tp-testimonial-content-active
    var slider = new Swiper ('.tp-testimonial-content-active', {
      slidesPerView: 1,
      centeredSlides: true,
      loop: true,
      loopedSlides: 3,
      navigation: {
          nextEl: '.tp-swiper-test-button-next',
          prevEl: '.tp-swiper-test-button-prev',
      },
    });
    var thumbs = new Swiper ('.tp-testimonial-thumb-active', {
      slidesPerView: 3,
      spaceBetween: 10,
      centeredSlides: false,
      centeredSlides: true,
      loop: true,
      slideToClickedSlide: true,
    });
    
    slider.controller.control = thumbs;
    thumbs.controller.control = slider;

/*----------------------------------------*/
/*  43. caseSwiperActive10 (home 10) 
/*----------------------------------------*/
    var swiper = new Swiper(".caseSwiperActive10", {
        slidesPerView: 3,
        spaceBetween: 30,
        loop:true,
        keyboard: {
            enabled: true,
        },
        autoplay: {
          delay: 2500, 
          disableOnInteraction: false,
        },
        breakpoints: {
          0: {
            slidesPerView: 1,
          },
          768: {
            slidesPerView: 2,
          },
          992: {
            slidesPerView: 3,
          },
          1200: {
            slidesPerView: 3,
          }
      },
    });

/*----------------------------------------*/
/*  44. swiper1 (home 10)  
/*----------------------------------------*/
    new Swiper('.swiper1', {
      direction: 'vertical',
      slidesPerView: 3,
      spaceBetween: 30,
      loop: true,
      speed: 6000,
      allowTouchMove: false,
      autoplay: {
        delay: 1,
        disableOnInteraction: false
      },
    });


/*----------------------------------------*/
/*  45. swiper2 (home 10)  
/*----------------------------------------*/
    new Swiper('.swiper2', {
      direction: 'vertical',
      slidesPerView: 3,
      spaceBetween: 30,
      loop: true,
      speed: 5000,
      allowTouchMove: false,
      autoplay: {
        delay: 1,
        disableOnInteraction: false
      },
    });

/*----------------------------------------*/
/*  46. testimocSwiperActive (home 5)  
/*----------------------------------------*/
    var swiper = new Swiper(".testimocSwiperActive", {
      slidesPerView: 2,
      spaceBetween: 30,
      loop:true,
        keyboard: {
            enabled: true,
        },
        autoplay: {
          delay: 2500, 
          disableOnInteraction: false,
        },
        navigation: {
          nextEl: ".case-button-next-55",
          prevEl: ".case-button-prev-55",
        },
        breakpoints: {
          0: {
            slidesPerView: 1,
          },
          768: {
            slidesPerView: 1,
          },
          992: {
            slidesPerView: 1,
          },
          1200: {
            slidesPerView: 2,
          }
      },
    });

    // mission thumb
      var swiper = new Swiper(".MissionSwiper", {
      navigation: {
        nextEl: ".vlmission-button-next",
        prevEl: ".vlmission-button-prev",
      },
    });



const panels = document.querySelectorAll('.panel')
         
      panels.forEach(panel => {
          panel.addEventListener('mousemove', () =>{
              removeActiveClasses()
              panel.classList.add('active')
          })
      })
      
      
      function removeActiveClasses(){
          panels.forEach(panel =>{
              panel.classList.remove('active')
          })
      }


  // jarallax  
  if($('.jarallax').length){
    $('.jarallax').jarallax({
      speed: 0.2,
    });
  }




})(jQuery);



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

    /*----------------------------------------*/
/*   revel animation
/*----------------------------------------*/  
   if($('.reveal').length){gsap.registerPlugin(ScrollTrigger);let revealContainers=document.querySelectorAll(".reveal");revealContainers.forEach((container)=>{let image=container.querySelector("img");let tl=gsap.timeline({scrollTrigger:{trigger:container,toggleActions:"play none none none"}});tl.set(container,{autoAlpha:1});tl.from(container,1.5,{xPercent:-100,ease:Power2.out});tl.from(image,1.5,{xPercent:100,scale:1.3,delay:-1.5,ease:Power2.out});});}



/*----------------------------------------*/
/*  02.image musking animation
/*----------------------------------------*/  
    //image cliping effect
    document.addEventListener("DOMContentLoaded", () => {
        const initialClipPaths = [
            "polygon(0% 0%, 0% 0%, 0% 0%, 0% 0%)",
            "polygon(33.33% 0%, 33.33% 0%, 33.33% 0%, 33.33% 0%)",
            "polygon(65.66% 0%, 66.66% 0%, 66.66% 0%, 66.66% 0%)",
            "polygon(0% 33.33%, 0% 33.33%, 0% 33.33%, 0% 33.33%)",
            "polygon(33.33% 33.33%, 33.33% 33.33%, 33.33% 33.33%, 33.33% 33.33%)",
            "polygon(65.66% 33.33%, 66.66% 33.33%, 66.66% 33.33%, 66.66% 33.33%)",
            "polygon(0% 66.66%, 0% 66.66%, 0% 66.66%, 0% 66.66%)",
            "polygon(33.33% 66.66%, 33.33% 66.66%, 33.33% 66.66%, 33.33% 66.66%)",
            "polygon(65.66% 66.66%, 66.66% 66.66%, 66.66% 66.66%, 66.66% 66.66%)"
        ];

        const finalClipPaths = [
            "polygon(0% 0%, 34.33% 0%, 34.33% 34.33%, 0% 34.33%)",
            "polygon(32.33% 0%, 66.66% 0%, 66.66% 33.33%, 33.33% 34.33%)",
            "polygon(65.66% 0%, 100% 0%, 100% 33.33%, 65.66% 34.33%)",
            "polygon(0% 33.33%, 33.33% 33.33%, 33.33% 66.66%, 0% 66.66%)",
            "polygon(30.33% 33.33%, 66.66% 33.33%, 66.66% 66.66%, 33.33% 66.66%)",
            "polygon(65.66% 33.33%, 100% 32.33%, 100% 66.66%, 65.66% 66.66%)",
            "polygon(0% 65.66%, 33.33% 66.66%, 33.33% 100%, 0% 100%)",
            "polygon(30.33% 66.66%, 66.66% 65.66%, 66.66% 100%, 33.33% 100%)",
            "polygon(65.66% 66.66%, 100% 65.66%, 100% 100%, 65.66% 100%)"
        ];

        // Create mask divs for each wrapper
        document.querySelectorAll(".vl-clip-anim").forEach(wrapper => {
            const img = wrapper.querySelector(".vl-anim-img[data-animate='true']");
            if (!img) return;
            const url = img.src;

            // Remove old masks if any (reuse safe)
            wrapper.querySelectorAll(".mask").forEach(m => m.remove());

            for (let i = 0; i < 9; i++) {
                const mask = document.createElement("div");
                mask.className = `mask mask-${i + 1}`;
                Object.assign(mask.style, {
                    backgroundImage: `url(${url})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    position: "absolute",
                    inset: "0"
                });
                wrapper.appendChild(mask);
            }
        });

        // Animate masks
        gsap.utils.toArray(".vl-clip-anim").forEach(wrapper => {
            const masks = wrapper.querySelectorAll(".mask");
            if (!masks.length) return;

            gsap.set(masks, { clipPath: (i) => initialClipPaths[i] });

            const order = [
                [".mask-1"],
                [".mask-2", ".mask-4"],
                [".mask-3", ".mask-5", ".mask-7"],
                [".mask-6", ".mask-8"],
                [".mask-9"]
            ];

            const tl = gsap.timeline({
                scrollTrigger: { trigger: wrapper, start: "top 75%" }
            });

            order.forEach((targets, i) => {
                const validTargets = targets
                    .map(c => wrapper.querySelector(c))
                    .filter(el => el); // filter out nulls

                if (validTargets.length) {
                    tl.to(validTargets, {
                        clipPath: (j, el) => finalClipPaths[Array.from(masks).indexOf(el)],
                        duration: 1,
                        ease: "power4.out",
                        stagger: 0.1
                    }, i * 0.125);
                }
            });
        });
    });
