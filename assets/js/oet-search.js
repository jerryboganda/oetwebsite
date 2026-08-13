/* OET site search — client-side, lazy-loaded index, zero dependencies. */
(function () {
    "use strict";

    var bar = document.querySelector(".vl-header-search-bar");
    if (!bar) { return; }
    var form = bar.querySelector("form");
    var input = form && form.querySelector('input[type="text"]');
    if (!form || !input) { return; }

    var INDEX_URL = "/assets/search-index.json";
    var index = null;
    var loading = null;
    var results = document.createElement("div");
    results.className = "oet-search-results";
    results.setAttribute("role", "listbox");
    results.hidden = true;
    var host = form.closest(".contact-search-form-box") || form.parentNode;
    host.parentNode.insertBefore(results, host.nextSibling);

    input.setAttribute("role", "combobox");
    input.setAttribute("aria-expanded", "false");
    input.setAttribute("aria-autocomplete", "list");
    input.setAttribute("autocomplete", "off");

    function loadIndex() {
        if (index || loading) { return loading; }
        loading = fetch(INDEX_URL)
            .then(function (r) { return r.ok ? r.json() : []; })
            .then(function (data) { index = data; return data; })
            .catch(function () { index = []; return index; });
        return loading;
    }

    function tokenize(q) {
        return q.toLowerCase().split(/[^a-z0-9]+/).filter(function (t) { return t.length > 1; });
    }

    function score(entry, tokens) {
        var title = entry.t.toLowerCase();
        var desc = (entry.d || "").toLowerCase();
        var heads = entry.h || [];
        var total = 0;
        var snippet = "";
        for (var i = 0; i < tokens.length; i++) {
            var tok = tokens[i];
            var got = 0;
            if (title.indexOf(tok) !== -1) { got += title.indexOf(tok) === 0 ? 8 : 5; }
            for (var j = 0; j < heads.length; j++) {
                if (heads[j].toLowerCase().indexOf(tok) !== -1) {
                    got += 2;
                    if (!snippet) { snippet = heads[j]; }
                    break;
                }
            }
            if (desc.indexOf(tok) !== -1) { got += 1; }
            if (!got) { return null; }
            total += got;
        }
        return { s: total, snip: snippet };
    }

    function highlight(text, tokens) {
        var out = text;
        for (var i = 0; i < tokens.length; i++) {
            var re = new RegExp("(" + tokens[i].replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "ig");
            out = out.replace(re, "\u0001$1\u0002");
        }
        return out
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
            .replace(/\u0001/g, "<mark>").replace(/\u0002/g, "</mark>");
    }

    var active = -1;

    function render(items, tokens) {
        active = -1;
        if (!items.length) {
            results.innerHTML =
                '<p class="oet-search-empty">No pages match. Try "writing", "pricing" or "pathway" &mdash; or ask us on ' +
                '<a href="https://wa.me/447961725989" target="_blank" rel="noopener noreferrer">WhatsApp</a>.</p>';
            results.hidden = false;
            input.setAttribute("aria-expanded", "true");
            return;
        }
        var htmlParts = items.map(function (item, i) {
            var sub = item.snip || item.e.d || "";
            if (sub.length > 110) { sub = sub.slice(0, 107) + "\u2026"; }
            return '<a class="oet-search-hit" role="option" id="oet-hit-' + i + '" href="' + item.e.u + '">' +
                '<span class="oet-search-hit-title">' + highlight(item.e.t, tokens) + "</span>" +
                (sub ? '<span class="oet-search-hit-sub">' + highlight(sub, tokens) + "</span>" : "") +
                "</a>";
        });
        results.innerHTML = htmlParts.join("");
        results.hidden = false;
        input.setAttribute("aria-expanded", "true");
    }

    function close() {
        results.hidden = true;
        results.innerHTML = "";
        input.setAttribute("aria-expanded", "false");
        active = -1;
    }

    function run() {
        var q = input.value.trim();
        if (q.length < 2) { close(); return; }
        loadIndex().then(function () {
            var tokens = tokenize(q);
            if (!tokens.length) { close(); return; }
            var hits = [];
            for (var i = 0; i < index.length; i++) {
                var r = score(index[i], tokens);
                if (r) { hits.push({ e: index[i], s: r.s, snip: r.snip }); }
            }
            hits.sort(function (a, b) { return b.s - a.s; });
            render(hits.slice(0, 8), tokens);
            if (window.oetAnalytics && q.length > 2) { window.oetAnalytics.track("site_search", { query: q }); }
        });
    }

    var timer = null;
    input.addEventListener("input", function () {
        window.clearTimeout(timer);
        timer = window.setTimeout(run, 120);
    });
    input.addEventListener("focus", loadIndex, { once: true });

    form.addEventListener("submit", function (event) {
        event.preventDefault();
        var first = results.querySelector(".oet-search-hit");
        if (first) { window.location.href = first.getAttribute("href"); }
        else { run(); }
    });

    function setActive(next) {
        var hits = results.querySelectorAll(".oet-search-hit");
        if (!hits.length) { return; }
        if (active >= 0) { hits[active].classList.remove("is-active"); }
        active = (next + hits.length) % hits.length;
        hits[active].classList.add("is-active");
        input.setAttribute("aria-activedescendant", hits[active].id);
        hits[active].scrollIntoView({ block: "nearest" });
    }

    input.addEventListener("keydown", function (event) {
        if (results.hidden) { return; }
        if (event.key === "ArrowDown") { event.preventDefault(); setActive(active + 1); }
        else if (event.key === "ArrowUp") { event.preventDefault(); setActive(active - 1); }
        else if (event.key === "Enter" && active >= 0) {
            event.preventDefault();
            var hit = results.querySelectorAll(".oet-search-hit")[active];
            if (hit) { window.location.href = hit.getAttribute("href"); }
        } else if (event.key === "Escape") { close(); }
    });

    document.addEventListener("click", function (event) {
        if (!bar.contains(event.target)) { close(); }
    });
})();
