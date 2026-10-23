/* OET score calculator: grade per sub-test + which regulator minimums a result meets.
   Rules mirror the official pages linked on oet-score-calculator.html; update both together. */
(function (root) {
    "use strict";

    var SKILLS = [["L", "Listening"], ["R", "Reading"], ["W", "Writing"], ["S", "Speaking"]];

    // Official OET grade bands on the 0-500 scale.
    function grade(score) {
        if (score >= 450) { return "A"; }
        if (score >= 350) { return "B"; }
        if (score >= 300) { return "C+"; }
        if (score >= 200) { return "C"; }
        if (score >= 100) { return "D"; }
        return "E";
    }

    var RULES = [
        { name: "NMC (UK nurses and midwives)", min: { L: 350, R: 350, W: 300, S: 350 },
          note: "Two sittings can be combined under NMC rules.",
          url: "https://www.nmc.org.uk/registration/joining-the-register/english-language-requirements/accepted-english-language-tests/oet/" },
        { name: "GMC (UK doctors)", min: { L: 350, R: 350, W: 350, S: 350 },
          note: "Medicine version, all four sub-tests in one sitting.",
          url: "https://www.gmc-uk.org/registration-and-licensing/join-our-registers/before-you-apply-guide-for-doctors/evidence-of-your-knowledge-of-english/using-your-oet-certificate" },
        { name: "Ahpra (Australia, all National Boards)", min: { L: 350, R: 360, W: 350, S: 360 },
          note: "Tests from 23 April 2026. Two sittings within 12 months allowed if no score falls below 320/340/350/350 (L/R/W/S). OET@Home not accepted.",
          url: "https://www.ahpra.gov.au/Registration/Registration-Standards/English-language-skills/Accepted-English-language-tests" },
        { name: "NMBI (Ireland, nurses and midwives)", min: { L: 350, R: 350, W: 300, S: 350 },
          note: "One sitting only; OET@Home not accepted.",
          url: "https://www.nmbi.ie/Registration/Qualified-outside-the-EU/Application-Process/English-Language-Requirements" },
        { name: "Medical Council of Ireland (doctors)", min: { L: 350, R: 350, W: 350, S: 350 },
          note: "OET Medicine, one sitting; OET@Home not accepted.",
          url: "https://www.medicalcouncil.ie/registration-applications/first-time-applicants/english-language.html" },
        { name: "Nursing Council of New Zealand", min: { L: 350, R: 350, W: 300, S: 350 },
          note: "More than one sitting allowed within 12 months; OET@Home not accepted.",
          url: "https://nursingcouncil.org.nz/IQN/IQN/H5.aspx" },
        { name: "Medical Council of New Zealand", min: { L: 350, R: 350, W: 300, S: 350 },
          note: "One sitting or two within 12 months, no component below 300.",
          url: "https://www.mcnz.org.nz/assets/Policies/English-language-policy.pdf" },
        { name: "GPhC (UK pharmacists)", min: { L: 350, R: 350, W: 350, S: 350 },
          note: "OET Pharmacy, one sitting; paper or computer only.",
          url: "https://assets.pharmacyregulation.org/files/2025-06/gphc-guidance-on-evidence-of-english-language-skills-june-2025_0.pdf" },
        { name: "ECFMG 2027 Pathways (USA)", min: { L: 350, R: 350, W: 300, S: 350 },
          note: "OET Medicine, one sitting taken on or after 1 January 2025.",
          url: "https://www.ecfmg.org/certification-pathways/oet.html" },
        { name: "CGFNS VisaScreen (USA, registered nurses)", min: { L: 320, R: 340, W: 350, S: 360 },
          note: "Tests taken on or after 12 May 2026; at-home tests not accepted.",
          url: "https://www.trumerit.org/services/certification/visascreen-visa-credentials-assessment/" },
        { name: "Singapore Medical Council", min: { L: 350, R: 350, W: 350, S: 350 },
          note: "One sitting, within 2 years of the test date.",
          url: "https://www.smc.gov.sg/for-professionals/apply-for-registration/documents-for-submission-and-processing-time/" }
    ];

    // Returns [{rule, ok, short: [skill codes below the minimum]}] for a {L,R,W,S} result.
    function check(scores, rules) {
        return (rules || RULES).map(function (rule) {
            var short = SKILLS.map(function (s) { return s[0]; })
                .filter(function (k) { return scores[k] < rule.min[k]; });
            return { rule: rule, ok: short.length === 0, short: short };
        });
    }

    root.OetScoreCalc = { grade: grade, check: check, RULES: RULES, SKILLS: SKILLS };
    if (typeof document === "undefined") { return; }

    var form = document.getElementById("oet-calc-form");
    var out = document.getElementById("oet-calc-results");
    if (!form || !out) { return; }

    function esc(s) {
        return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }

    function render() {
        var scores = {};
        for (var i = 0; i < SKILLS.length; i++) {
            var input = form.elements["oet-" + SKILLS[i][0]];
            var v = Number(input.value);
            if (input.value === "" || !isFinite(v) || v < 0 || v > 500) {
                out.innerHTML = '<p class="oet-calc-hint">Enter a score from 0 to 500 for each sub-test.</p>';
                return;
            }
            scores[SKILLS[i][0]] = Math.round(v / 10) * 10; // OET reports scores in steps of 10
        }
        var grades = SKILLS.map(function (s) {
            return '<li><span>' + s[1] + '</span><strong>' + scores[s[0]] + ' &middot; Grade ' + grade(scores[s[0]]) + '</strong></li>';
        }).join("");
        var rows = check(scores).map(function (r) {
            var label = r.ok ? "Meets the minimum" : "Below the minimum in " + r.short.map(function (k) {
                return SKILLS.filter(function (s) { return s[0] === k; })[0][1];
            }).join(", ");
            return '<tr class="' + (r.ok ? "is-ok" : "is-short") + '"><th scope="row">' + esc(r.rule.name) + '</th><td>' + label +
                '<small>' + esc(r.rule.note) + ' <a href="' + esc(r.rule.url) + '" target="_blank" rel="noopener noreferrer">Official rules</a></small></td></tr>';
        }).join("");
        out.innerHTML = '<ul class="oet-calc-grades">' + grades + '</ul>' +
            '<table class="oet-calc-table"><thead><tr><th scope="col">Regulator</th><th scope="col">Your result</th></tr></thead><tbody>' + rows + '</tbody></table>' +
            '<p class="oet-calc-hint">A guide only. Always confirm the current rules with your regulator before booking or applying.</p>';
    }

    // oet-analytics.js already records every form submit (form_submit, form: "oet-calc-form").
    form.addEventListener("submit", function (e) { e.preventDefault(); render(); });
    form.addEventListener("input", function () { if (out.innerHTML) { render(); } });
})(typeof window !== "undefined" ? window : globalThis);
