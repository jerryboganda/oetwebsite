/* OET Analytics — GA4 (consent-gated, Consent Mode v2) + Umami (cookieless) + event tracking.
 * Config: fill in the IDs below when available. Empty ID = that provider stays off (no requests). */
(function () {
  "use strict";

  var CONFIG = {
    ga4: "",   /* e.g. "G-XXXXXXXXXX" */
    umami: ""  /* e.g. "abcd1234-..." (Umami Cloud website ID) */
  };

  /* ---------- GA4 with Consent Mode v2 (basic: script loads only after consent) ---------- */
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;

  gtag("consent", "default", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    wait_for_update: 500
  });

  var ga4Loaded = false;
  function loadGA4() {
    if (ga4Loaded || !CONFIG.ga4) return;
    ga4Loaded = true;
    gtag("consent", "update", { analytics_storage: "granted" });
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + CONFIG.ga4;
    document.head.appendChild(s);
    gtag("js", new Date());
    gtag("config", CONFIG.ga4, { anonymize_ip: true });
  }
  function grantMarketing() {
    gtag("consent", "update", {
      ad_storage: "granted",
      ad_user_data: "granted",
      ad_personalization: "granted"
    });
  }

  /* ---------- Umami (cookieless, no PII — loads regardless of cookie consent) ---------- */
  function loadUmami() {
    if (!CONFIG.umami || document.getElementById("oet-umami")) return;
    var s = document.createElement("script");
    s.id = "oet-umami";
    s.defer = true;
    s.src = "https://cloud.umami.is/script.js";
    s.setAttribute("data-website-id", CONFIG.umami);
    s.setAttribute("data-auto-track", "true");
    document.head.appendChild(s);
  }

  /* ---------- Consent wiring: read banner cookie now, expose hooks for the banner ---------- */
  function readConsent() {
    var m = document.cookie.match(/(?:^|; )oet_cookie_consent=([^;]*)/);
    try { return m ? JSON.parse(decodeURIComponent(m[1])) : null; } catch (e) { return null; }
  }
  window.oetAnalytics = {
    grantAnalytics: loadGA4,
    grantMarketing: grantMarketing,
    track: track
  };
  var consent = readConsent();
  if (consent && consent.analytics) loadGA4();
  if (consent && consent.marketing) grantMarketing();
  loadUmami();

  /* ---------- Event tracking (fires to whichever providers are active) ---------- */
  function track(name, params) {
    try {
      if (ga4Loaded) gtag("event", name, params || {});
      if (window.umami && window.umami.track) window.umami.track(name, params || {});
    } catch (e) { /* never break the page for analytics */ }
  }

  function nearestLabel(el) {
    var t = (el.getAttribute("aria-label") || el.textContent || "").replace(/\s+/g, " ").trim();
    return t.slice(0, 80);
  }

  document.addEventListener("click", function (ev) {
    var a = ev.target && ev.target.closest ? ev.target.closest("a[href], button") : null;
    if (!a) return;
    var href = a.getAttribute("href") || "";
    if (/wa\.me|api\.whatsapp\.com/.test(href)) {
      track("whatsapp_click", { link_text: nearestLabel(a), page: location.pathname });
    } else if (/t\.me|telegram\.me/.test(href)) {
      track("telegram_click", { link_text: nearestLabel(a), page: location.pathname });
    } else if (/app\.oetwithdrhesham/.test(href)) {
      track("app_cta_click", { link_text: nearestLabel(a), page: location.pathname });
    } else if (/youtube\.com|youtu\.be/.test(href)) {
      track("video_click", { link_text: nearestLabel(a), page: location.pathname });
    } else if (a.closest && a.closest(".oet-pricing-card")) {
      var card = a.closest(".oet-pricing-card");
      var h3 = card.querySelector("h3");
      track("pricing_cta_click", { package: h3 ? nearestLabel(h3) : "unknown" });
    } else if (a.closest && a.closest(".oet-contact-widget")) {
      track("chat_open", { page: location.pathname });
    }
  }, { passive: true });

  document.addEventListener("submit", function (ev) {
    var f = ev.target;
    if (f && f.tagName === "FORM") {
      var id = f.getAttribute("id") || f.getAttribute("action") || "form";
      track("form_submit", { form: String(id).slice(0, 60), page: location.pathname });
    }
  }, true);

  /* Scroll depth: one-shot 50% / 90% */
  var sent50 = false, sent90 = false;
  function onScroll() {
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    if (max <= 0) return;
    var pct = (h.scrollTop || document.body.scrollTop) / max * 100;
    if (!sent50 && pct >= 50) { sent50 = true; track("scroll_depth", { depth: 50 }); }
    if (!sent90 && pct >= 90) { sent90 = true; track("scroll_depth", { depth: 90 }); window.removeEventListener("scroll", onScroll); }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
})();
