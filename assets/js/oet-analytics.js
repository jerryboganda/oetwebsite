/* OET Analytics: Google Analytics 4 and Meta Pixel, both consent-gated (Consent Mode v2), plus event tracking.
 * The IDs come from the Web App admin (Marketing analytics > settings) through GET /v1/public/marketing-config; GA4 falls back to CONFIG.ga4
 * and the Pixel stays off until an ID is set there. Nothing loads until the visitor accepts the matching cookie choice.
 * Event contract (the same names the Web App uses):
 *   page_view / PageView        every page (page_type in {pricing, course_detail, other})
 *   view_item / ViewContent     a course page is shown
 *   generate_lead / Lead        the contact form was really delivered (contact.php adds v=1; bot and rate-limited redirects do not)
 *   click_whatsapp              a WhatsApp link was clicked: click intent only, never a lead
 *   app_cta_click               a button to the Web App (sign-up, sign-in, package) was clicked
 * Purchases, sign-ups and checkouts happen in the Web App and are reported there and by the server. */
(function () {
  "use strict";

  var CONFIG = {
    ga4: "G-PM9X3G8S3S",
    api: "https://api.oetwithdrhesham.co.uk"
  };
  var CAMPAIGN_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid"];

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

  var remote = null;
  var remoteRequested = false;
  var waiting = [];
  var ga4Loaded = false;
  var ga4Ready = false;
  var pixelLoaded = false;
  var pixelReady = false;
  var pendingGa = [];
  var pendingMeta = [];

  /* ---------- Consent ---------- */
  function readConsent() {
    var m = document.cookie.match(/(?:^|; )oet_cookie_consent=([^;]*)/);
    try { return m ? JSON.parse(decodeURIComponent(m[1])) : null; } catch (e) { return null; }
  }
  function allowed(kind) {
    var c = readConsent();
    return !!(c && c[kind]);
  }

  /* ---------- Public tag configuration (fetched once) ---------- */
  function withConfig(cb) {
    if (remote) { cb(remote); return; }
    waiting.push(cb);
    if (remoteRequested) return;
    remoteRequested = true;
    function done(cfg) {
      if (remote) return;
      remote = cfg || {};
      waiting.splice(0).forEach(function (f) { f(remote); });
    }
    try {
      var ctl = typeof AbortController === "function" ? new AbortController() : null;
      var timer = setTimeout(function () { if (ctl) ctl.abort(); done(null); }, 3000);
      fetch(CONFIG.api + "/v1/public/marketing-config", { credentials: "omit", signal: ctl ? ctl.signal : undefined })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (j) { clearTimeout(timer); done(j); })
        .catch(function () { clearTimeout(timer); done(null); });
    } catch (e) { done(null); }
  }

  function pageType() {
    var p = location.pathname;
    if (/^\/pricing(\.html)?\/?$/.test(p)) return "pricing";
    if (/^\/(ar\/)?oet-course-for-/.test(p) || /^\/oet-for-allied-health/.test(p)) return "course_detail";
    return "other";
  }

  /* ---------- Google Analytics 4 ---------- */
  function sendGa(name, params) {
    gtag("event", name, params || {});
  }

  function loadGA4() {
    if (ga4Loaded) return;
    ga4Loaded = true;
    gtag("consent", "update", { analytics_storage: "granted" });
    withConfig(function (cfg) {
      var id = (cfg && cfg.ga4MeasurementId) || CONFIG.ga4;
      if (!id) return;
      var s = document.createElement("script");
      s.async = true;
      s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(id);
      document.head.appendChild(s);
      gtag("js", new Date());
      // The default page_view is kept; page_type rides on it. Both subdomains share the _ga cookie, so the visitor stays one visitor.
      gtag("config", id, { page_type: pageType() });
      ga4Ready = true;
      pendingGa.splice(0).forEach(function (e) { sendGa(e[0], e[1]); });
    });
  }

  function grantMarketing() {
    loadPixel();
  }

  /* ---------- Meta Pixel ---------- */
  function sendMeta(name, params, eventId) {
    window.fbq("track", name, params || {}, eventId ? { eventID: eventId } : undefined);
  }

  function loadPixel() {
    if (pixelLoaded) return;
    pixelLoaded = true;
    withConfig(function (cfg) {
      var id = cfg && cfg.metaPixelId;
      if (!id) return;
      if (!window.fbq) {
        var n = window.fbq = function () { if (n.callMethod) n.callMethod.apply(n, arguments); else n.queue.push(arguments); };
        if (!window._fbq) window._fbq = n;
        n.push = n;
        n.loaded = true;
        n.version = "2.0";
        n.queue = [];
        var t = document.createElement("script");
        t.async = true;
        t.src = "https://connect.facebook.net/en_US/fbevents.js";
        document.head.appendChild(t);
      }
      window.fbq("init", id);
      window.fbq("track", "PageView");
      pixelReady = true;
      pendingMeta.splice(0).forEach(function (e) { sendMeta(e[0], e[1], e[2]); });
    });
  }

  /* ---------- Event helpers ---------- */
  function track(name, params) {
    try {
      if (!allowed("analytics") || !ga4Loaded) return;
      if (ga4Ready) sendGa(name, params); else pendingGa.push([name, params]);
    } catch (e) { /* never break the page for analytics */ }
  }

  function trackMeta(name, params, eventId) {
    try {
      if (!allowed("marketing") || !pixelLoaded) return;
      if (pixelReady) sendMeta(name, params, eventId); else pendingMeta.push([name, params, eventId]);
    } catch (e) { /* never break the page for analytics */ }
  }

  window.oetAnalytics = {
    grantAnalytics: loadGA4,
    grantMarketing: grantMarketing,
    track: track,
    trackMeta: trackMeta
  };

  var consent = readConsent();
  if (consent && consent.analytics) loadGA4();
  if (consent && consent.marketing) loadPixel();

  /* ---------- Campaign continuity into the Web App ---------- */
  // Campaign tags and the Meta click id are remembered for this browser session (analytics consent only) and added to links to the Web App,
  // which saves them as the candidate's first touch when the account is created.
  function currentCampaign() {
    var out = {};
    var q;
    try { q = new URLSearchParams(location.search); } catch (e) { return out; }
    var stored = {};
    try { stored = JSON.parse(sessionStorage.getItem("oet_campaign") || "{}"); } catch (e) { stored = {}; }
    CAMPAIGN_KEYS.forEach(function (k) {
      var v = q.get(k);
      if (v) out[k] = v.slice(0, 200);
      else if (stored[k]) out[k] = stored[k];
    });
    if (allowed("analytics") && Object.keys(out).length) {
      try { sessionStorage.setItem("oet_campaign", JSON.stringify(out)); } catch (e) { /* storage blocked */ }
    }
    return out;
  }

  function decorate(a) {
    var url;
    try { url = new URL(a.href, location.href); } catch (e) { return; }
    if (!/^app\.oetwithdrhesham\.co\.uk$/.test(url.hostname)) return;
    var campaign = currentCampaign();
    Object.keys(campaign).forEach(function (k) { if (!url.searchParams.has(k)) url.searchParams.set(k, campaign[k]); });
    a.href = url.toString();
  }

  /* ---------- Event tracking ---------- */
  function nearestLabel(el) {
    var t = (el.getAttribute("aria-label") || el.textContent || "").replace(/\s+/g, " ").trim();
    return t.slice(0, 80);
  }

  document.addEventListener("click", function (ev) {
    var a = ev.target && ev.target.closest ? ev.target.closest("a[href], button") : null;
    if (!a) return;
    var href = a.getAttribute("href") || "";
    var card = a.closest && a.closest(".oet-pricing-card");
    if (/wa\.me|api\.whatsapp\.com/.test(href)) {
      track("click_whatsapp", { link_text: nearestLabel(a), page: location.pathname, cta: a.getAttribute("data-oet-cta") || "" });
    } else if (/t\.me|telegram\.me/.test(href)) {
      track("telegram_click", { link_text: nearestLabel(a), page: location.pathname });
    } else if (/app\.oetwithdrhesham/.test(href)) {
      decorate(a);
      var h3 = card ? card.querySelector("h3") : null;
      // data-oet-cta names the pricing-page choices ("explore_packages" / "ask_sami"); a package card adds the package it belongs to.
      track("app_cta_click", { link_text: nearestLabel(a), page: location.pathname, cta: a.getAttribute("data-oet-cta") || "", package: h3 ? nearestLabel(h3) : "" });
    } else if (/youtube\.com|youtu\.be/.test(href)) {
      track("video_click", { link_text: nearestLabel(a), page: location.pathname });
    } else if (card) {
      var title = card.querySelector("h3");
      track("pricing_cta_click", { package: title ? nearestLabel(title) : "unknown" });
    } else if (a.closest && a.closest(".oet-contact-widget")) {
      track("chat_open", { page: location.pathname });
    }
  }, { passive: false, capture: true });

  document.addEventListener("submit", function (ev) {
    var f = ev.target;
    if (f && f.tagName === "FORM") {
      var id = f.getAttribute("id") || f.getAttribute("action") || "form";
      track("form_submit", { form: String(id).slice(0, 60), page: location.pathname });
    }
  }, true);

  /* A course page was shown. */
  if (pageType() === "course_detail") {
    var slug = location.pathname.replace(/^\/|\.html$|\/$/g, "").replace(/\//g, "_");
    track("view_item", { item_id: slug, item_name: document.title.slice(0, 100), page_type: "course_detail" });
    trackMeta("ViewContent", { content_ids: [slug], content_name: document.title.slice(0, 100), content_type: "product" });
  }

  /* The contact form really delivered: contact.php adds v=1 only then, so bot and rate-limited redirects are not leads. */
  if (/(^|[?&])sent=1(&|$)/.test(location.search) && /(^|[?&])v=1(&|$)/.test(location.search) && (allowed("analytics") || allowed("marketing"))) {
    var leadKey = "oet_lead_sent";
    var already = false;
    try { already = !!sessionStorage.getItem(leadKey); sessionStorage.setItem(leadKey, "1"); } catch (e) { already = false; }
    if (!already) {
      track("generate_lead", { form: "contact", page: location.pathname });
      trackMeta("Lead", {}, "lead_" + Date.now());
    }
  }

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
