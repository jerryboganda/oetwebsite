/* OET Recalls page (EN + AR): the registration button reports the outbound conversion event recalls_cta_register.
   It goes through the site's own analytics layer (oet-analytics.js), so it follows the visitor's cookie consent like every
   other event. oet-analytics.js still sends the generic app_cta_click for the same click (cta = recalls_register). */
(function () {
  var link = document.querySelector('a[data-oet-event="recalls_cta_register"]');
  if (!link) return;
  link.addEventListener('click', function () {
    try {
      if (window.oetAnalytics) {
        window.oetAnalytics.track('recalls_cta_register', {
          page: location.pathname,
          language: document.documentElement.lang || 'en',
          link_text: (link.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80)
        });
      }
    } catch (e) { /* never break the page for analytics */ }
  });
})();
