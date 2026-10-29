/*!
 * OET bundles: Full OET Course and Full Crash Course tiers.
 *
 * One file, two homes (so the static HTML and the live-refreshed DOM can never drift):
 *  - build time: site/src/lib/bundles.mjs evaluates this file in a vm sandbox (no `document`) and calls the
 *    pure renderers below to write pricing.html and the course-page blocks;
 *  - browser: boots the profession and exam-format selectors and refreshes price, access months, counts,
 *    badges and upgrade hints from the public catalog (GET <catalogUrl>) by PLAN CODE. A card is never
 *    invented: only the slots rendered at build time exist. If the request fails (network, CORS, bad body)
 *    the build-time defaults stay and the section keeps data-catalog="static". Checkout re-prices on the
 *    server, so a stale page can never be charged a stale price.
 *
 * Defaults live in site/src/data/bundles.json (embedded in the page as #oet-bundles-data).
 * ES5 on purpose; no dependencies.
 */
(function (root, factory) {
  var kit = factory();
  if (typeof module === 'object' && module && module.exports) module.exports = kit;
  if (typeof document !== 'undefined') kit.boot(document, root);
})(this, function () {
  'use strict';

  var APP = 'https://app.oetwithdrhesham.co.uk';
  var FORMATS = ['computer', 'paper'];
  var CODE_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;
  var KEY_RE = /^[a-z0-9_]{1,40}$/;

  /* ---------- helpers ---------- */

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  // Plain text with **x** benefit markers -> escaped HTML with <strong>. Escape FIRST, then apply the marker
  // regex, so a description (default or live) can never inject markup. A stray unmatched ** is dropped.
  function rich(s) {
    return esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*\*/g, '');
  }
  // the same text without the markers (JSON-LD, aria text)
  function plain(s) { return String(s == null ? '' : s).replace(/\*\*/g, ''); }
  function isNum(n) { return typeof n === 'number' && isFinite(n) && n >= 0; }
  function round2(n) { return Math.round(n * 100) / 100; }
  function money(n) { return '&pound;' + (n % 1 === 0 ? String(n) : n.toFixed(2)); }
  function clean(s, max) { return typeof s === 'string' ? s.replace(/\s+/g, ' ').trim().slice(0, max) : ''; }
  function byId(list, id) {
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }
  function copy(o) {
    var out = {};
    Object.keys(o).forEach(function (k) { out[k] = o[k]; });
    return out;
  }
  // A negative inclusion line (one that starts with No, Not or Without, about Listening or Reading) never appears on
  // a price card: that rule lives in the entitlement and in help text (owner brief 28 Oct 2026, page 6).
  function isNegative(label) { return /^\s*(no|not|without)\b/i.test(label || ''); }

  /* ---------- defaults ---------- */

  function codeFor(fam, tier, prof) { return fam.perProfession ? tier.key + '-' + prof.suffix : tier.key; }

  function resolveLines(data, items) {
    return items.map(function (it) {
      var base = (data.lines && data.lines[it.key]) || {};
      return {
        key: it.key,
        label: it.label || base.label || it.key,
        detail: it.detail !== undefined ? it.detail : (base.detail || null),
        value: it.value !== undefined ? it.value : null,
        formats: it.formats || base.formats || FORMATS.slice(),
      };
    });
  }

  // code -> bundle, in the same shape the catalog API returns (plus `key`)
  function expandDefaults(data) {
    var out = {};
    data.families.forEach(function (fam) {
      var profs = fam.perProfession ? data.professions : [{ id: 'all', suffix: '' }];
      profs.forEach(function (p) {
        fam.tiers.forEach(function (t, i) {
          var code = codeFor(fam, t, p);
          out[code] = {
            code: code, key: t.key, family: fam.id, tier: i + 1, profession: p.id,
            name: t.name, price: t.price, currency: data.currency, accessMonths: t.accessMonths,
            recommended: !!t.recommended, badge: t.badge || null, description: t.description,
            tutorBookPermanent: !!t.tutorBookPermanent, included: resolveLines(data, t.included), upgrades: null,
          };
        });
      });
    });
    return withUpgrades(out);
  }

  // Upgrade = pay the difference to any higher tier of the same family and profession
  // (contract section 4). A live catalog may supply its own list; otherwise it is derived from prices.
  function withUpgrades(bundles) {
    var groups = {};
    Object.keys(bundles).forEach(function (c) {
      var b = bundles[c];
      if (!b) return;
      (groups[b.family + '|' + b.profession] = groups[b.family + '|' + b.profession] || []).push(b);
    });
    Object.keys(groups).forEach(function (g) {
      var list = groups[g].sort(function (a, b) { return a.tier - b.tier; });
      list.forEach(function (from, i) {
        if (from.upgrades) return;
        from.upgrades = [];
        for (var j = i + 1; j < list.length; j++) {
          var d = round2(list[j].price - from.price);
          if (d > 0) from.upgrades.push({ toCode: list[j].code, toName: list[j].name, difference: d });
        }
      });
    });
    return bundles;
  }

  // plan codes of one family for one profession, in tier order
  function slotCodes(data, famId, profId) {
    var fam = byId(data.families, famId);
    var prof = byId(data.professions, profId) || data.professions[0];
    return fam.tiers.map(function (t) { return codeFor(fam, t, prof); });
  }

  /* ---------- live catalog ---------- */

  function cleanIncluded(list) {
    if (!Array.isArray(list)) return null;
    var out = [];
    for (var i = 0; i < list.length && out.length < 24; i++) {
      var it = list[i];
      if (!it || typeof it !== 'object') continue;
      var key = clean(it.key, 40);
      var label = clean(it.label, 120);
      if (!KEY_RE.test(key) || !label) continue;
      var value = it.value === 'unlimited' ? 'unlimited' : (isNum(it.value) ? Math.floor(it.value) : null);
      var fm = Array.isArray(it.formats) ? it.formats.filter(function (f) { return FORMATS.indexOf(f) >= 0; }) : FORMATS.slice();
      if (!fm.length) continue;
      out.push({ key: key, label: label, detail: clean(it.detail, 160) || null, value: value, formats: fm });
    }
    return out.length ? out : null;
  }

  function cleanUpgrades(list) {
    if (!Array.isArray(list)) return null;
    var out = [];
    list.forEach(function (u) {
      if (u && typeof u === 'object' && typeof u.toCode === 'string' && CODE_RE.test(u.toCode) && isNum(u.difference)) {
        out.push({ toCode: u.toCode, toName: clean(u.toName, 80), difference: round2(u.difference) });
      }
    });
    return out;
  }

  // Overwrites defaults by plan code. Returns { bundles, count } or null when the body has nothing usable.
  // A default whose code is absent from a usable live catalog maps to null: the plan is not on sale
  // (an admin hid it), so its card is not shown. Codes the page has no slot for are ignored.
  function mergeLive(defaults, json) {
    var fams = json && Array.isArray(json.families) ? json.families : [];
    var live = {};
    var count = 0;
    fams.forEach(function (f) {
      (f && Array.isArray(f.bundles) ? f.bundles : []).forEach(function (b) {
        if (!b || typeof b.code !== 'string' || !CODE_RE.test(b.code) || !defaults[b.code] || !isNum(b.price)) return;
        live[b.code] = b;
        count += 1;
      });
    });
    if (!count) return null;
    var merged = {};
    Object.keys(defaults).forEach(function (code) {
      var l = live[code];
      if (!l) { merged[code] = null; return; }
      var m = copy(defaults[code]);
      m.price = l.price;
      if (isNum(l.accessMonths) && l.accessMonths >= 1 && l.accessMonths <= 60) m.accessMonths = Math.floor(l.accessMonths);
      var name = clean(l.name, 80);
      if (name) m.name = name;
      var desc = clean(l.description, 600);
      if (desc) m.description = desc;
      if (typeof l.recommended === 'boolean') m.recommended = l.recommended;
      if (Object.prototype.hasOwnProperty.call(l, 'badge')) m.badge = clean(l.badge, 24) || null;
      if (typeof l.tutorBookPermanent === 'boolean') m.tutorBookPermanent = l.tutorBookPermanent;
      var inc = cleanIncluded(l.included);
      if (inc) m.included = inc;
      m.upgrades = cleanUpgrades(l.upgrades);
      merged[code] = m;
    });
    // a live upgrade may only point at a plan that is on sale
    Object.keys(merged).forEach(function (c) {
      var m = merged[c];
      if (m && m.upgrades) m.upgrades = m.upgrades.filter(function (u) { return merged[u.toCode]; });
    });
    return { bundles: withUpgrades(merged), count: count, version: clean(json.catalogVersion, 64) };
  }

  /* ---------- rendering (pure; used at build time and in the browser) ---------- */

  // The app's register and sign-in pages keep only `next`, so the choice travels INSIDE it: the inner query
  // (/subscriptions?package=..&profession=..&format=..) is encoded once and is the only outer parameter.
  // The app reads package (plan code), profession and format from the /subscriptions query.
  function appLink(kind, code, profId, fmt) {
    return APP + '/' + kind + '?next=' + encodeURIComponent('/subscriptions?package=' + code + '&profession=' + profId + '&format=' + fmt);
  }

  function badgeHtml(b) {
    var text = b.badge || (b.recommended ? 'Recommended' : '');
    return text ? '<span class="oet-bundle-badge"><i class="fa-solid fa-star" aria-hidden="true"></i> ' + esc(text) + '</span>' : '';
  }

  function monthsText(n) { return n + (n === 1 ? ' month' : ' months') + ' access'; }

  // Personal human service (Dr Hesham's letters, the private session with an Expert Tutor, the TutorBook, and the
  // Basic English gift / SAMI that only Ultimate carries) renders in bold weight so it reads as different from the
  // website assessments (owner brief v4, 29 Oct 2026). A website assessment is never presented as human-marked.
  var HUMAN_LINES = { personal_letters: 1, private_session: 1, tutorbook: 1, basic_english: 1, sami: 1 };

  function renderLine(it, fmt) {
    if (it.formats.indexOf(fmt) < 0 || isNegative(it.label)) return '';
    var val = it.value === 'unlimited' ? 'Unlimited' : (it.value != null ? String(it.value) : '');
    return '<li data-key="' + esc(it.key) + '"' + (HUMAN_LINES[it.key] ? ' class="is-human"' : '') + '><span class="oet-bundle-line">' + (val ? '<b>' + esc(val) + '</b> ' : '') +
      esc(it.label) + '</span>' + (it.detail ? '<small>' + esc(it.detail) + '</small>' : '') + '</li>';
  }

  // "Unlimited Website Practice" when any website_* line is unlimited (Ultimate), else "Website Practice Included"
  function practiceText(b) {
    for (var i = 0; i < b.included.length; i++) {
      if (/^website_/.test(b.included[i].key) && b.included[i].value === 'unlimited') return 'Unlimited Website Practice';
    }
    return 'Website Practice Included';
  }

  // ctx = { profession: {id,label}, format: 'computer' | 'paper', formatLabel }
  function renderCard(b, ctx) {
    var chips = [];
    if (b.accessMonths) chips.push(monthsText(b.accessMonths));
    chips.push({ text: practiceText(b), practice: true });
    if (b.tutorBookPermanent) chips.push('TutorBook access: permanent');
    chips.push(b.profession === 'all' ? 'All eligible disciplines' : ctx.profession.label);
    chips.push(ctx.formatLabel);
    var lines = b.included.map(function (it) { return renderLine(it, ctx.format); }).join('');
    var ups = (b.upgrades || []).map(function (u) {
      return '<span>+' + money(u.difference) + ' to ' + esc(u.toName) + '</span>';
    }).join('');
    var cta = 'bundle_' + b.key;
    // id + data-key give the hero posters a stable target (the poster links are #bundle-<key>; assets/js boot() scrolls to
    // the card of the CURRENT profession/format selection, which is the card with this data-key)
    return '<article class="oet-bundle-card' + (b.recommended ? ' is-recommended' : '') + '" id="bundle-' + esc(b.key) + '" data-key="' + esc(b.key) +
      '" data-code="' + esc(b.code) + '" data-tier="' + b.tier + '"' + (b.recommended ? ' data-recommended="true"' : '') + '>' + badgeHtml(b) +
      '<h3>' + esc(b.name) + '</h3>' +
      '<div class="oet-bundle-price"><strong data-field="price">' + money(b.price) + '</strong></div>' +
      '<ul class="oet-bundle-chips" aria-label="Course summary">' + chips.map(function (c) {
        return typeof c === 'string' ? '<li>' + esc(c) + '</li>' : '<li class="is-practice">' + esc(c.text) + '</li>';
      }).join('') + '</ul>' +
      '<p class="oet-bundle-desc">' + rich(b.description) + '</p>' +
      '<ul class="oet-bundle-list" aria-label="What is included">' + lines + '</ul>' +
      (ups ? '<p class="oet-bundle-upgrade"><strong>Upgrade later and pay only the difference:</strong> ' + ups + '</p>' : '') +
      '<div class="oet-bundle-actions">' +
      '<a class="oet-bundle-cta" href="' + esc(appLink('register', b.code, ctx.profession.id, ctx.format)) + '" data-oet-cta="' + esc(cta) +
      '" data-plan="' + esc(b.code) + '" aria-label="Enrol now: ' + esc(b.name) + '">Enrol now</a>' +
      '<a class="oet-bundle-signin" href="' + esc(appLink('sign-in', b.code, ctx.profession.id, ctx.format)) + '" data-oet-cta="' + esc(cta) +
      '_signin" data-plan="' + esc(b.code) + '" aria-label="Already registered? Sign in to choose ' + esc(b.name) + '">Already registered? Sign in</a>' +
      '</div></article>';
  }

  var EMPTY = '<p class="oet-bundle-empty">These plans are not on sale right now. Open the Candidates App to see what is currently available.</p>';

  function renderGrid(codes, bundles, ctx) {
    var html = '';
    codes.forEach(function (c) { if (bundles[c]) html += renderCard(bundles[c], ctx); });
    return html || EMPTY;
  }

  // compact card for the profession course pages
  function renderMini(b, ctx) {
    var more = ' &middot; ' + esc(practiceText(b)) + (b.tutorBookPermanent ? ' &middot; permanent TutorBook' : '');
    return '<article class="oet-choose-card' + (b.recommended ? ' is-recommended' : '') + '" data-code="' + esc(b.code) + '" data-tier="' + b.tier + '">' +
      badgeHtml(b) + '<h3>' + esc(b.name) + '</h3>' +
      '<div class="oet-choose-price"><strong data-field="price">' + money(b.price) + '</strong>' +
      '<span>' + (b.accessMonths ? esc(monthsText(b.accessMonths)) : '') + more + '</span></div>' +
      '<p>' + rich(b.description) + '</p></article>';
  }

  function renderMiniGrid(codes, bundles, ctx) {
    var html = '';
    codes.forEach(function (c) { if (bundles[c]) html += renderMini(bundles[c], ctx); });
    return html || EMPTY;
  }

  function makeCtx(data, profId, fmt) {
    var prof = byId(data.professions, profId) || data.professions[0];
    var f = byId(data.formats, fmt) || data.formats[0];
    return { profession: prof, format: f.id, formatLabel: f.label };
  }

  // the line under the selectors; the Crash tiers are the same for every profession, so it names only the format
  function statusText(data, st, famId) {
    var ctx = makeCtx(data, st.profession, st.format);
    var f = byId(data.formats, ctx.format);
    var who = famId === 'crash' ? ctx.formatLabel : ctx.profession.label + ', ' + ctx.formatLabel;
    return 'Showing ' + who + '. ' + (f.summary || '') + (famId !== 'crash' && ctx.profession.note ? ' ' + ctx.profession.note : '');
  }

  /* ---------- browser behaviour ---------- */

  // Hero poster -> the card of that tier for the CURRENT profession and exam-format selection (the grid is already
  // rendered for it, so nothing about the selection changes). The poster is a plain /pricing.html#bundle-<key> link:
  // without JavaScript it lands on the static default card, and with JavaScript the site's in-page anchor handler
  // (assets/js/main.js, header offset + landing correction) does the scrolling. This code adds what that handler does
  // not: it moves keyboard focus to the card, marks it, and covers a plan an admin hid (no card: land on the section).
  function findCard(doc, key) {
    var sec = doc.getElementById('full-oet-courses');
    var cards = sec ? sec.querySelectorAll('[data-key]') : [];
    for (var i = 0; i < cards.length; i++) if (cards[i].getAttribute('data-key') === key) return cards[i];
    return null;
  }

  function focusCard(win, card) {
    card.setAttribute('tabindex', '-1');
    try { card.focus({ preventScroll: true }); } catch (e) { card.focus(); }
    card.classList.add('is-targeted');
    win.setTimeout(function () { card.classList.remove('is-targeted'); }, 2600);
  }

  function scrollTo(win, el) {
    var reduce = !!(win.matchMedia && win.matchMedia('(prefers-reduced-motion: reduce)').matches);
    try { el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); } catch (e) { el.scrollIntoView(); }
  }

  function bindPosters(doc, win) {
    doc.addEventListener('click', function (ev) {
      if (ev.button > 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
      var a = ev.target;
      while (a && a !== doc && !(a.getAttribute && a.getAttribute('data-oet-poster'))) a = a.parentNode;
      if (!a || a === doc) return;
      var key = a.getAttribute('data-oet-poster');
      if (!CODE_RE.test(key)) return;
      var card = findCard(doc, key);
      var target = card || doc.getElementById('full-oet-courses');
      if (!target) return; // not the pricing page: the link just navigates
      if (!ev.defaultPrevented) { // the site anchor handler did not scroll (it needs the #bundle-<key> element): do it here
        ev.preventDefault();
        scrollTo(win, target);
        try { win.history.replaceState(null, '', win.location.pathname + win.location.search + '#' + (card ? 'bundle-' + key : 'full-oet-courses')); } catch (e) { /* the scroll still happened */ }
      }
      if (card) focusCard(win, card);
    }, false);
  }

  function boot(doc, win) {
    var holder = doc.getElementById('oet-bundles-data');
    if (!holder) return;
    var data;
    try { data = JSON.parse(holder.textContent); } catch (e) { return; }
    bindPosters(doc, win);

    var defaults = expandDefaults(data);
    var catalog = defaults;
    var sections = [].slice.call(doc.querySelectorAll('[data-oet-bundles]'));
    var minis = [].slice.call(doc.querySelectorAll('[data-oet-bundles-mini]'));

    var state = { profession: data.professions[0].id, format: 'computer' };
    try {
      var q = new win.URLSearchParams(win.location.search);
      var p = q.get('profession');
      var f = q.get('format');
      var hit = p && (byId(data.professions, p) || (function () {
        for (var i = 0; i < data.professions.length; i++) if (data.professions[i].suffix === p) return data.professions[i];
        return null;
      })());
      if (hit) state.profession = hit.id;
      if (f === 'paper' || f === 'computer') state.format = f;
    } catch (e) { /* defaults */ }

    function renderPricing() {
      var ctx = makeCtx(data, state.profession, state.format);
      sections.forEach(function (sec) {
        var grid = sec.querySelector('[data-bundle-grid]');
        if (!grid) return;
        sec.setAttribute('data-profession', state.profession);
        sec.setAttribute('data-format', state.format);
        grid.innerHTML = renderGrid(slotCodes(data, sec.getAttribute('data-family'), state.profession), catalog, ctx);
        var status = sec.querySelector('[data-bundle-status]');
        if (status) status.textContent = statusText(data, state, sec.getAttribute('data-family'));
      });
    }

    function renderMinis() {
      minis.forEach(function (sec) {
        var grid = sec.querySelector('[data-bundle-mini-grid]');
        if (!grid) return;
        var profId = sec.getAttribute('data-profession');
        grid.innerHTML = renderMiniGrid(slotCodes(data, 'full', profId), catalog, makeCtx(data, profId, 'computer'));
      });
    }

    function syncUrl() {
      try {
        var u = new win.URL(win.location.href);
        if (state.profession === data.professions[0].id) u.searchParams.delete('profession'); else u.searchParams.set('profession', state.profession);
        if (state.format === 'computer') u.searchParams.delete('format'); else u.searchParams.set('format', state.format);
        win.history.replaceState(null, '', u.pathname + u.search + u.hash);
      } catch (e) { /* the selection still works without a shareable URL */ }
    }

    // selectors: one profession group (Full section) and one exam-format group per section, kept in sync.
    // They are hidden without JavaScript: the static page already shows Medicine, Computer-Based.
    var controlSets = [].slice.call(doc.querySelectorAll('[data-bundle-controls]'));
    function syncRadios() {
      controlSets.forEach(function (box) {
        [].forEach.call(box.querySelectorAll('input[type="radio"]'), function (r) {
          r.checked = r.value === state[r.getAttribute('data-bundle-radio')];
        });
      });
    }
    controlSets.forEach(function (box) {
      box.hidden = false;
      box.addEventListener('change', function (ev) {
        var t = ev.target;
        var group = t && t.type === 'radio' ? t.getAttribute('data-bundle-radio') : null;
        if (group !== 'profession' && group !== 'format') return;
        state[group] = t.value;
        syncRadios();
        renderPricing();
        syncUrl();
      });
    });
    syncRadios();

    if (sections.length) {
      if (state.profession !== data.professions[0].id || state.format !== 'computer') renderPricing();
    }

    function mark(value, version) {
      sections.concat(minis).forEach(function (sec) {
        sec.setAttribute('data-catalog', value);
        if (version) sec.setAttribute('data-catalog-version', version);
        // owner brief: never show outdated price data as if current - say so when the live prices could not be loaded
        [].forEach.call(sec.querySelectorAll('[data-bundle-stale]'), function (n) { n.hidden = value === 'live'; });
      });
    }

    // live refresh by plan code; any failure keeps the build-time defaults
    if (!data.catalogUrl || !win.fetch || (!sections.length && !minis.length)) { mark('static'); return; }
    var ctl = win.AbortController ? new win.AbortController() : null;
    var timer = win.setTimeout(function () { if (ctl) ctl.abort(); }, 8000);
    win.fetch(data.catalogUrl, {
      method: 'GET', headers: { Accept: 'application/json' }, credentials: 'omit', cache: 'no-store', mode: 'cors',
      signal: ctl ? ctl.signal : undefined,
    }).then(function (r) {
      if (!r.ok) throw new Error('catalog ' + r.status);
      return r.json();
    }).then(function (json) {
      win.clearTimeout(timer);
      var merged = mergeLive(defaults, json);
      if (!merged) { mark('static'); return; }
      catalog = merged.bundles;
      renderPricing();
      renderMinis();
      mark('live', merged.version);
    }).catch(function () {
      win.clearTimeout(timer);
      mark('static');
    });
  }

  return {
    esc: esc, rich: rich, plain: plain, practiceText: practiceText, expandDefaults: expandDefaults, slotCodes: slotCodes, mergeLive: mergeLive, makeCtx: makeCtx,
    renderCard: renderCard, renderGrid: renderGrid, renderMini: renderMini, renderMiniGrid: renderMiniGrid,
    statusText: statusText, appLink: appLink, boot: boot,
  };
});
