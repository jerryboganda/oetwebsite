(function () {
  var C = "oet_cookie_consent", box, lastOpenedFromBar = false;

  function read() {
    var m = document.cookie.match(new RegExp("(?:^|; )" + C + "=([^;]*)"));
    try {
      return m ? JSON.parse(decodeURIComponent(m[1])) : null;
    } catch (e) {
      return null;
    }
  }

  function write(v) {
    document.cookie = C + "=" + encodeURIComponent(JSON.stringify(v)) + ";path=/;max-age=31536000;SameSite=Lax";
  }

  function loadAnalytics() {
    if (window.oetAnalytics && typeof window.oetAnalytics.grantAnalytics === "function") {
      window.oetAnalytics.grantAnalytics();
    }
  }

  function loadMarketing() {
    if (window.oetAnalytics && typeof window.oetAnalytics.grantMarketing === "function") {
      window.oetAnalytics.grantMarketing();
    }
  }

  function apply(v) {
    if (v.analytics) loadAnalytics();
    if (v.marketing) loadMarketing();
  }

  function show(manage) {
    if (!box) return;
    box.hidden = false;
    var prefs = document.getElementById("oet-cc-prefs");
    if (prefs) prefs.hidden = !manage;
    box.classList.toggle("is-managing", !!manage);

    if (manage) {
      var v = read() || {};
      var chkA = document.getElementById("oet-cc-a");
      var chkM = document.getElementById("oet-cc-m");
      if (chkA) chkA.checked = !!v.analytics;
      if (chkM) chkM.checked = !!v.marketing;
    }
  }

  function hide() {
    if (!box) return;
    box.hidden = true;
    box.classList.remove("is-managing");
  }

  function save(a, m) {
    var v = { analytics: !!a, marketing: !!m, ts: Date.now() };
    write(v);
    apply(v);
    hide();
  }

  document.addEventListener("DOMContentLoaded", function () {
    box = document.createElement("section");
    box.className = "oet-cc";
    box.hidden = true;
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "false");
    box.setAttribute("aria-label", "Cookie preferences");
    box.setAttribute("aria-live", "polite");

    box.innerHTML = [
      '<div class="oet-cc-container">',
      '  <div class="oet-cc-bar">',
      '    <div class="oet-cc-bar-main">',
      '      <span class="oet-cc-badge" aria-hidden="true">',
      '        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">',
      '          <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"/>',
      '          <path d="M8.5 8.5v.01"/>',
      '          <path d="M7.5 15.5v.01"/>',
      '          <path d="M12 12v.01"/>',
      '          <path d="M11 17v.01"/>',
      '          <path d="M16 16v.01"/>',
      '        </svg>',
      '      </span>',
      '      <p class="oet-cc-text">',
      '        We use cookies to improve your experience and analyse site traffic. ',
      '        <a href="/cookie-policy">Cookie Policy</a>',
      '      </p>',
      '    </div>',
      '    <div class="oet-cc-actions">',
      '      <button type="button" class="oet-cc-btn oet-cc-btn-ghost" id="oet-cc-manage">Manage choices</button>',
      '      <button type="button" class="oet-cc-btn oet-cc-btn-secondary" id="oet-cc-none">Reject optional</button>',
      '      <button type="button" class="oet-cc-btn oet-cc-btn-primary" id="oet-cc-all">Accept all</button>',
      '    </div>',
      '  </div>',
      '  <div class="oet-cc-prefs-panel" id="oet-cc-prefs" hidden>',
      '    <div class="oet-cc-prefs-header">',
      '      <div class="oet-cc-prefs-title-group">',
      '        <span class="oet-cc-badge sm" aria-hidden="true">',
      '          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">',
      '            <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"/>',
      '            <path d="M8.5 8.5v.01"/>',
      '            <path d="M7.5 15.5v.01"/>',
      '            <path d="M12 12v.01"/>',
      '            <path d="M11 17v.01"/>',
      '            <path d="M16 16v.01"/>',
      '          </svg>',
      '        </span>',
      '        <div>',
      '          <h3>Cookie Preferences</h3>',
      '          <p>Control which optional cookies you allow us to use.</p>',
      '        </div>',
      '      </div>',
      '      <button type="button" class="oet-cc-close" id="oet-cc-close" aria-label="Close preferences">✕</button>',
      '    </div>',
      '    <div class="oet-cc-prefs-grid">',
      '      <div class="oet-cc-pref-card">',
      '        <div class="oet-cc-pref-meta">',
      '          <strong>Essential Cookies</strong>',
      '          <small>Required for site security, navigation, and core features.</small>',
      '        </div>',
      '        <span class="oet-cc-pill-tag">Always Active</span>',
      '      </div>',
      '      <label class="oet-cc-pref-card is-interactive" for="oet-cc-a">',
      '        <div class="oet-cc-pref-meta">',
      '          <strong>Analytics Cookies</strong>',
      '          <small>Helps us understand website performance and improve content.</small>',
      '        </div>',
      '        <div class="oet-cc-toggle">',
      '          <input id="oet-cc-a" type="checkbox" class="oet-cc-switch">',
      '          <span class="oet-cc-toggle-track"></span>',
      '        </div>',
      '      </label>',
      '      <label class="oet-cc-pref-card is-interactive" for="oet-cc-m">',
      '        <div class="oet-cc-pref-meta">',
      '          <strong>Marketing Cookies</strong>',
      '          <small>Helps us share relevant course updates and discount offers.</small>',
      '        </div>',
      '        <div class="oet-cc-toggle">',
      '          <input id="oet-cc-m" type="checkbox" class="oet-cc-switch">',
      '          <span class="oet-cc-toggle-track"></span>',
      '        </div>',
      '      </label>',
      '    </div>',
      '    <div class="oet-cc-prefs-footer">',
      '      <a href="/cookie-policy" class="oet-cc-policy-link">Read Cookie Policy</a>',
      '      <div class="oet-cc-prefs-buttons">',
      '        <button type="button" class="oet-cc-btn oet-cc-btn-ghost" id="oet-cc-prefs-reject">Reject optional</button>',
      '        <button type="button" class="oet-cc-btn oet-cc-btn-secondary" id="oet-cc-prefs-accept">Accept all</button>',
      '        <button type="button" class="oet-cc-btn oet-cc-btn-primary" id="oet-cc-save">Save choices</button>',
      '      </div>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join("\n");

    document.body.appendChild(box);

    // Event listeners
    document.getElementById("oet-cc-all").onclick = function () { save(1, 1); };
    document.getElementById("oet-cc-none").onclick = function () { save(0, 0); };
    document.getElementById("oet-cc-manage").onclick = function () {
      lastOpenedFromBar = true;
      show(1);
    };

    var closeBtn = document.getElementById("oet-cc-close");
    if (closeBtn) {
      closeBtn.onclick = function () {
        if (lastOpenedFromBar && !read()) {
          show(0);
        } else {
          hide();
        }
      };
    }

    var prefsReject = document.getElementById("oet-cc-prefs-reject");
    if (prefsReject) {
      prefsReject.onclick = function () { save(0, 0); };
    }

    var prefsAccept = document.getElementById("oet-cc-prefs-accept");
    if (prefsAccept) {
      prefsAccept.onclick = function () { save(1, 1); };
    }

    var saveBtn = document.getElementById("oet-cc-save");
    if (saveBtn) {
      saveBtn.onclick = function () {
        var chkA = document.getElementById("oet-cc-a");
        var chkM = document.getElementById("oet-cc-m");
        save(chkA ? chkA.checked : 0, chkM ? chkM.checked : 0);
      };
    }

    window.oetCookieSettings = function () {
      lastOpenedFromBar = false;
      show(1);
    };

    var v = read();
    if (v) {
      apply(v);
    } else {
      setTimeout(function () {
        show(0);
      }, 350);
    }
  });
})();
