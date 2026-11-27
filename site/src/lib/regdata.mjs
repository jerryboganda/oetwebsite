// Shared regulatory and venue data (owner brief of 26 Nov 2026, "reusable regulatory data model" + global test-centre directory).
// Two data files feed every page that shows a venue or a regulator rule, so a rule change is ONE edit:
//   src/data/test-centres.json  venues exactly as OET keys them in its own venue finder, with the date they were read ("checked")
//   src/data/regulators.json    one row per regulator: OET accepted or not, scores, sittings, formats (paper / computer / OET@Home), source
// Build markers (replaced by applyRegData, called from lib/page.mjs for EVERY page; none may survive into dist, verify.mjs checks):
//   <!--oet:venue-directory-->        the searchable directory: filters (country, city, mode, profession) + every country's venues
//   <!--oet:paper-2027-directory-->   the 16 paper countries (January 2027: Nursing and Medicine only) with their paper venues
//   <!--oet:venues:<country id>-->    one country's venue table
//   <!--oet:home-acceptance-->        OET@Home, regulator by regulator (accepted / conditional / not accepted / not confirmed)
//   <!--oet:clubbing-table-->         combining two sittings, regulator by regulator
//   <!--oet:recognition-matrix-->     the 12 OET professions by destination and regulator
//   <!--oet:data-checked:venues-->, <!--oet:data-checked:regulators-->   the "last checked" date as text
// Output language follows the page: Arabic under /ar/. A page that uses a marker also gets assets/css/oet-directory.css.
// Never type a venue or a regulator rule into a partial: edit the JSON (and its "checked" / "verified" date) after re-reading the source.
import fs from 'node:fs';
import path from 'node:path';

const DATA = path.join(process.cwd(), 'src', 'data');
const FINDER = 'https://oet.com/test/book-a-test';
export const DIRECTORY_CSS = '<link rel="stylesheet" href="/assets/css/oet-directory.css">';

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
const MONTHS = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
};
export const longDate = (iso, lang) => { const [y, m, d] = iso.split('-').map(Number); return `${d} ${MONTHS[lang][m - 1]} ${y}`; };

// The 16 countries where OET on Paper continues from January 2027 for Nursing and Medicine (OET customer-care email, November 2026).
export const PAPER_2027 = ['egypt', 'saudi-arabia', 'uae', 'turkey', 'ghana', 'kenya', 'uk', 'ireland', 'india', 'pakistan', 'nepal', 'sri-lanka', 'philippines', 'australia', 'new-zealand', 'canada'];
const REGIONS = [
  ['Middle East and Africa', 'الشرق الأوسط وأفريقيا'], ['Europe', 'أوروبا'], ['Asia', 'آسيا'], ['Oceania and North America', 'أوقيانوسيا وأمريكا الشمالية'],
];
export const PROFESSION_IDS = ['medicine', 'nursing', 'pharmacy', 'dentistry', 'dietetics', 'occupational-therapy', 'optometry', 'physiotherapy', 'podiatry', 'radiography', 'speech-pathology', 'veterinary-science'];
const PAPER_PROFESSIONS = ['medicine', 'nursing'];

const T = {
  en: {
    venue: 'Venue (as listed by OET)', city: 'City', address: 'Address', mode: 'Test mode', professions: 'Professions from January 2027', status2027: 'Paper in 2027',
    computer: 'OET on Computer (at a venue)', paper: 'OET on Paper', computerShort: 'Computer', paperShort: 'Paper',
    all12: 'All 12 professions, subject to availability', nm: 'Nursing and Medicine only',
    jan: 'Listed by OET for January 2027 (Speaking by live video at the venue)',
    old: 'Listed as a paper venue in 2026; OET has not shown whether it continues in 2027',
    not16: 'Paper venue in 2026; this country is not among the 16 paper countries from January 2027',
    last: (d) => `OET lists a last test date: ${d}`,
    country: 'Country', allCountries: 'All countries', cityPh: 'e.g. Cairo, London, Mumbai', allModes: 'All test modes', profession: 'Profession', allProf: 'All 12 professions',
    listings: (n, c) => `${n} listings in ${c} countries`, shown: (n) => `${n} ${n === 1 ? 'listing' : 'listings'} shown`, none: 'No listing matches these filters. Try another city or test mode, or check the official OET venue finder.',
    profNote: 'From January 2027 OET on Paper is for Nursing and Medicine only, so for this profession the directory shows OET on Computer venues.',
    counts: (c, p) => `${c} computer ${c === 1 ? 'venue' : 'venues'}${p ? `, ${p} paper ${p === 1 ? 'listing' : 'listings'}` : ', no paper venue listed'}`,
    paper16: 'One of the 16 countries where OET on Paper continues from January 2027, for Nursing and Medicine only.',
    noPaper16: 'Not among the 16 paper countries: from January 2027 this country has OET on Computer only.',
    finder: 'Check dates and book on the official OET venue finder', course: (n) => `OET course in ${n}`, jump: 'Jump to a country',
    usStates: (n, s) => `OET's finder lists ${n} OET on Computer venues across ${s} US states and districts. They are counted by state here; open the official finder for the venue nearest you.`,
    state: 'State', venues: 'Computer venues', noVenues: 'No venue of this kind is listed.',
    paperCount: (n, j) => `${n} paper ${n === 1 ? 'listing' : 'listings'}, ${j} added by OET for January 2027`, computerAlso: (n) => `${n} OET on Computer ${n === 1 ? 'venue' : 'venues'} for all 12 professions`,
    seeAll: 'see every venue', checked: 'Venues as listed in the official OET venue finder on',
    regulator: 'Regulator', destination: 'Destination', profs: 'Professions', home: 'OET@Home', basis: 'What the regulator says', source: 'Official source',
    minimum: 'Minimum OET scores (L / R / W / S)', combine: 'Two sittings combined?', window: 'Window', floors: 'Lowest score allowed in each sitting (L / R / W / S)', note: 'Note',
    oetStatus: 'OET', scores: 'Minimum scores (L / R / W / S)', validity: 'Validity', formats: 'Paper / Computer / OET@Home', route: 'Route',
    within: (n) => `within ${n} months`, sittings: (n) => `up to ${n} sittings`, allProfs: 'All regulated professions',
    noRow: 'No regulator rule was found for this profession: not confirmed. Ask the regulator before booking.', immigration: 'Immigration and credentialing bodies (separate from registration)',
    S: { accepted: 'Accepted', conditional: 'Conditional', 'not-accepted': 'Not accepted', 'not-confirmed': 'Not confirmed', 'not-listed': 'Not listed', 'not-stated': 'Not stated', yes: 'Yes', no: 'No, one sitting', 'one-subtest-retake': 'One sub-test retake only' },
    total: (n) => `total ${n}`,
  },
  ar: {
    venue: 'المركز (كما يسجّله OET)', city: 'المدينة', address: 'العنوان', mode: 'نوع الامتحان', professions: 'المهن من يناير 2027', status2027: 'الورقي في 2027',
    computer: 'OET على الكمبيوتر (في مركز)', paper: 'OET الورقي', computerShort: 'كمبيوتر', paperShort: 'ورقي',
    all12: 'كل المهن الاثنتي عشرة، حسب المتاح', nm: 'التمريض والطب فقط',
    jan: 'أدرجه OET لجلسات يناير 2027 (المحادثة بالفيديو المباشر داخل المركز)',
    old: 'مسجّل كمركز ورقي في 2026، ولم يوضّح OET هل يستمر في 2027',
    not16: 'مركز ورقي في 2026، وهذه الدولة ليست ضمن الدول الست عشرة للامتحان الورقي من يناير 2027',
    last: (d) => `OET يذكر آخر موعد امتحان: ${d}`,
    country: 'الدولة', allCountries: 'كل الدول', cityPh: 'مثلاً: Cairo أو Riyadh أو Dubai', allModes: 'كل الأنواع', profession: 'المهنة', allProf: 'كل المهن الاثنتي عشرة',
    listings: (n, c) => `${n} مركزاً مسجّلاً في ${c} دولة`, shown: (n) => `عدد النتائج: ${n}`, none: 'لا توجد نتيجة بهذه الاختيارات. جرّب مدينة أو نوع امتحان آخر، أو راجع أداة البحث الرسمية من OET.',
    profNote: 'من يناير 2027 الامتحان الورقي للتمريض والطب فقط، لذلك تظهر لهذه المهنة مراكز امتحان الكمبيوتر.',
    counts: (c, p) => `مراكز الكمبيوتر: ${c}${p ? `، المراكز الورقية المسجّلة: ${p}` : '، ولا يوجد مركز ورقي مسجّل'}`,
    paper16: 'إحدى الدول الست عشرة التي يستمر فيها OET الورقي من يناير 2027، للتمريض والطب فقط.',
    noPaper16: 'ليست ضمن دول الامتحان الورقي الست عشرة: من يناير 2027 المتاح فيها OET على الكمبيوتر فقط.',
    finder: 'راجع المواعيد واحجز من أداة البحث الرسمية من OET', course: (n) => `كورس OET في ${n}`, jump: 'انتقل إلى دولة',
    usStates: (n, s) => `أداة OET تسجّل ${n} مركزاً لامتحان الكمبيوتر في ${s} ولاية ومقاطعة أمريكية. نعرض العدد لكل ولاية، وأقرب مركز لك تجده في أداة البحث الرسمية.`,
    state: 'الولاية', venues: 'مراكز الكمبيوتر', noVenues: 'لا يوجد مركز مسجّل من هذا النوع.',
    paperCount: (n, j) => `المراكز الورقية المسجّلة: ${n}، منها ${j} أضافها OET لجلسات يناير 2027`, computerAlso: (n) => `مراكز OET على الكمبيوتر لكل المهن: ${n}`,
    seeAll: 'كل المراكز', checked: 'المراكز كما تظهر في أداة البحث الرسمية من OET بتاريخ',
    regulator: 'الجهة', destination: 'الدولة', profs: 'المهن', home: 'OET@Home', basis: 'ما تقوله الجهة', source: 'المصدر الرسمي',
    minimum: 'أقل درجات OET (L / R / W / S)', combine: 'هل يُقبل دمج جلستين؟', window: 'المدة', floors: 'أقل درجة مسموحة في كل جلسة (L / R / W / S)', note: 'ملاحظة',
    oetStatus: 'OET', scores: 'أقل الدرجات (L / R / W / S)', validity: 'الصلاحية', formats: 'ورقي / كمبيوتر / OET@Home', route: 'المسار',
    within: (n) => `خلال ${n} شهراً`, sittings: (n) => (n === 2 ? 'جلستان بحد أقصى' : `${n} جلسات بحد أقصى`), allProfs: 'كل المهن المنظَّمة',
    noRow: 'لم نجد قاعدة منشورة لهذه المهنة: غير مؤكد. اسأل الجهة قبل الحجز.', immigration: 'جهات الهجرة والاعتماد (منفصلة عن التسجيل المهني)',
    S: { accepted: 'مقبول', conditional: 'مشروط', 'not-accepted': 'غير مقبول', 'not-confirmed': 'غير مؤكد', 'not-listed': 'غير مدرج', 'not-stated': 'غير مذكور', yes: 'نعم', no: 'لا، جلسة واحدة', 'one-subtest-retake': 'إعادة جزء واحد فقط' },
    total: (n) => `المجموع ${n}`,
  },
};

// ---------------------------------------------------------------------------------------------------------------- loaders
let cache;
function read(file) { return JSON.parse(fs.readFileSync(path.join(DATA, file), 'utf8')); }

export function loadTestCentres() {
  const d = read('test-centres.json');
  const bad = (m) => { throw new Error(`test-centres.json: ${m}`); };
  if (!ISO_DAY.test(d.checked)) bad('"checked" must be YYYY-MM-DD');
  if (d.source?.url !== FINDER) bad(`"source.url" must be ${FINDER}`);
  const ids = new Set();
  for (const c of d.countries) {
    if (!/^[a-z-]+$/.test(c.id) || ids.has(c.id)) bad(`country id "${c.id}" is missing, malformed or repeated`);
    ids.add(c.id);
    if (!c.name || !c.nameAr) bad(`${c.id}: needs "name" and "nameAr"`);
    if (!REGIONS.some(([r]) => r === c.region)) bad(`${c.id}: unknown region "${c.region}"`);
    if (c.paper2027 !== PAPER_2027.includes(c.id)) bad(`${c.id}: "paper2027" must match the 16-country list`);
    for (const v of c.venues) {
      if (!v.name || !v.address) bad(`${c.id}: a venue has no name or address`);
      if (!['computer', 'paper'].includes(v.mode)) bad(`${c.id}: ${v.name}: mode must be computer or paper`);
      if (v.mode === 'paper' && typeof v.jan2027 !== 'boolean') bad(`${c.id}: ${v.name}: a paper venue needs "jan2027" true or false`);
      if (v.mode === 'paper' && v.jan2027 && !c.paper2027) bad(`${c.id}: ${v.name}: a January 2027 paper record outside the 16 countries`);
    }
    if (!c.venues.length && !c.computerCount) bad(`${c.id}: no venue`);
  }
  for (const id of PAPER_2027) if (!ids.has(id)) bad(`the paper country "${id}" is missing`);
  return d;
}

const FORMAT_STATUS = ['accepted', 'conditional', 'not-accepted', 'not-confirmed'];
export function loadRegulators() {
  const d = read('regulators.json');
  const bad = (m) => { throw new Error(`regulators.json: ${m}`); };
  if (!ISO_DAY.test(d.checked)) bad('"checked" must be YYYY-MM-DD');
  if (d.professions.map((p) => p.id).join() !== PROFESSION_IDS.join()) bad(`"professions" must be the 12 OET professions in this order: ${PROFESSION_IDS.join(', ')}`);
  for (const p of [...d.professions, ...d.destinations]) if (!p.en || !p.ar) bad(`${p.id}: needs "en" and "ar"`);
  const dest = new Set(d.destinations.map((x) => x.id));
  const ids = new Set();
  const both = (o, where) => { if (!o || typeof o.en !== 'string' || typeof o.ar !== 'string') bad(`${where} must be {"en": "...", "ar": "..."}`); if (!!o.en !== !!o.ar) bad(`${where}: English and Arabic must both be filled or both empty`); };
  for (const r of d.regulators) {
    const at = `regulator "${r.id}"`;
    if (!/^[a-z0-9-]+$/.test(r.id || '') || ids.has(r.id)) bad(`${at}: id missing, malformed or repeated`);
    ids.add(r.id);
    if (!dest.has(r.destination)) bad(`${at}: unknown destination "${r.destination}"`);
    if (!r.short || !r.name) bad(`${at}: needs "short" and "name"`);
    if (!Array.isArray(r.professions) || !r.professions.length) bad(`${at}: needs "professions"`);
    for (const p of r.professions) if (p !== 'all' && !PROFESSION_IDS.includes(p)) bad(`${at}: unknown profession "${p}"`);
    if (!['registration', 'immigration', 'credentialing'].includes(r.purpose)) bad(`${at}: purpose must be registration, immigration or credentialing`);
    if (!['accepted', 'not-accepted', 'not-listed', 'not-confirmed'].includes(r.oet)) bad(`${at}: "oet" must be accepted, not-accepted, not-listed or not-confirmed`);
    if (r.scores) for (const k of ['L', 'R', 'W', 'S']) if (!Number.isInteger(r.scores[k]) || r.scores[k] < 0 || r.scores[k] > 500) bad(`${at}: scores.${k} must be 0 to 500`);
    if (r.floors) for (const k of ['L', 'R', 'W', 'S']) if (!Number.isInteger(r.floors[k])) bad(`${at}: floors.${k} must be a number`);
    if (r.oet !== 'accepted' && r.scores) bad(`${at}: scores given although OET is not "accepted"`);
    if (!['no', 'yes', 'one-subtest-retake', 'not-stated', 'not-confirmed'].includes(r.combine)) bad(`${at}: "combine" has an unknown value`);
    // the window is always stated by a regulator that combines; the number of sittings sometimes is not (then "sittings" is null)
    if (r.combine === 'yes' && !r.windowMonths) bad(`${at}: combine "yes" needs "windowMonths"`);
    for (const k of ['paper', 'computer', 'home']) if (!FORMAT_STATUS.includes(r.formats?.[k])) bad(`${at}: formats.${k} must be one of ${FORMAT_STATUS.join(', ')}`);
    for (const k of ['route', 'scoresNote', 'combineNote', 'homeNote', 'validity', 'effective', 'note']) both(r[k], `${at}.${k}`);
    if (!/^https:\/\//.test(r.source?.url || '') || !r.source.label) bad(`${at}: needs source.label and an https source.url`);
    if (!ISO_DAY.test(r.verified || '')) bad(`${at}: "verified" must be YYYY-MM-DD`);
    if (!['confirmed', 'partly-confirmed', 'not-confirmed'].includes(r.status)) bad(`${at}: unknown "status"`);
    // every OET@Home claim is tied to the regulator's own words (acceptance criterion of the brief)
    if (r.formats.home !== 'not-confirmed' && !r.homeNote.en) bad(`${at}: an OET@Home status other than "not-confirmed" needs a homeNote (what the regulator says)`);
  }
  return d;
}

function data() {
  if (!cache) cache = { centres: loadTestCentres(), regs: fs.existsSync(path.join(DATA, 'regulators.json')) ? loadRegulators() : null };
  return cache;
}

// ---------------------------------------------------------------------------------------------------------------- venues
const cname = (c, lang) => (lang === 'ar' ? c.nameAr : c.name);
const counts = (c) => ({ computer: c.computerCount ?? c.venues.filter((v) => v.mode === 'computer').length, paper: c.venues.filter((v) => v.mode === 'paper').length, jan: c.venues.filter((v) => v.jan2027).length });
const hub = (lang) => (lang === 'ar' ? '/ar/oet-test-centres.html' : '/oet-test-centres.html');
const coursePage = (c, lang) => (c.coursePage ? `${lang === 'ar' ? '/ar' : ''}/${c.coursePage}.html` : null);

function paperStatus(v, c, t) {
  if (v.lastDate) return t.last(v.lastDate);
  if (v.jan2027) return t.jan;
  return c.paper2027 ? t.old : t.not16;
}

function venueRows(c, lang, { only } = {}) {
  const t = T[lang];
  return c.venues.filter((v) => !only || v.mode === only).map((v) => {
    // "all" = every profession (OET on Computer); paper rows carry the two paper professions, or none outside the 16 countries
    const profs = v.mode === 'computer' ? ['all'] : (c.paper2027 ? PAPER_PROFESSIONS : []);
    const status = v.mode === 'paper' ? paperStatus(v, c, t) : '';
    return `<tr data-mode="${v.mode}" data-city="${esc((v.city || '').toLowerCase())}" data-prof="${profs.join(' ')}"${v.jan2027 ? ' data-jan2027' : ''}>` +
      `<td><strong>${esc(v.name)}</strong></td><td>${esc(v.city)}</td><td>${esc(v.address)}</td>` +
      `<td><span class="oet-mode oet-mode--${v.mode}">${v.mode === 'computer' ? t.computerShort : t.paperShort}</span></td>` +
      `<td>${v.mode === 'computer' ? t.all12 : `${c.paper2027 ? `${t.nm}. ` : ''}${status}`}</td></tr>`;
  }).join('\n');
}

function venueTable(c, lang, opts = {}) {
  const t = T[lang];
  const rows = venueRows(c, lang, opts);
  if (!rows) return `<p class="oet-data-empty">${t.noVenues}</p>`;
  // venue names and addresses stay in Latin script, exactly as OET keys them
  return `<div class="oet-data-wrap" tabindex="0" role="region" aria-label="${esc(cname(c, lang))}"><table class="oet-data-table oet-venue-table" dir="ltr" lang="en"><thead><tr><th scope="col"${lang === 'ar' ? ' lang="ar" dir="rtl"' : ''}>${t.venue}</th><th scope="col"${lang === 'ar' ? ' lang="ar" dir="rtl"' : ''}>${t.city}</th><th scope="col"${lang === 'ar' ? ' lang="ar" dir="rtl"' : ''}>${t.address}</th><th scope="col"${lang === 'ar' ? ' lang="ar" dir="rtl"' : ''}>${t.mode}</th><th scope="col"${lang === 'ar' ? ' lang="ar" dir="rtl"' : ''}>${t.professions}</th></tr></thead><tbody>\n${lang === 'ar' ? rows.replace(/<td>(?=[^<]*[؀-ۿ])/g, '<td lang="ar" dir="rtl">').replace(/<span class="oet-mode/g, '<span lang="ar" class="oet-mode') : rows}\n</tbody></table></div>`;
}

function usStates(c, lang) {
  const t = T[lang];
  if (!c.computerByState) return '';
  return `<p>${t.usStates(c.computerCount, c.computerByState.length)}</p><ul class="oet-state-list" dir="ltr" lang="en">${c.computerByState.map((s) => `<li>${esc(s.state)} <span>${s.venues}</span></li>`).join('')}</ul>`;
}

function countrySection(c, lang, level = 3) {
  const t = T[lang];
  const n = counts(c);
  const course = coursePage(c, lang);
  return `<section class="oet-venues__country" id="${c.id}" data-country="${c.id}">
<h${level}>${esc(cname(c, lang))} <span class="oet-venues__count">${t.counts(n.computer, n.paper)}</span></h${level}>
<p class="oet-venues__meta">${c.paper2027 ? t.paper16 : t.noPaper16}${course ? ` <a href="${course}">${t.course(esc(cname(c, lang)))}</a>.` : ''} <a href="${FINDER}" target="_blank" rel="noopener noreferrer">${t.finder}</a>.</p>
${usStates(c, lang)}
${c.venues.length ? venueTable(c, lang) : ''}
</section>`;
}

const FILTER_JS = `(function(){var root=document.querySelector('[data-oet-venues]');if(!root)return;var f={country:root.querySelector('[data-f=country]'),city:root.querySelector('[data-f=city]'),mode:root.querySelector('[data-f=mode]'),prof:root.querySelector('[data-f=profession]')};var status=root.querySelector('.oet-venues__status'),empty=root.querySelector('.oet-venues__empty'),note=root.querySelector('.oet-venues__profnote');var all=status.textContent,tpl=status.getAttribute('data-shown');function run(){var c=f.country.value,q=f.city.value.trim().toLowerCase(),m=f.mode.value,p=f.prof.value,shown=0,on=c||q||m||p;root.querySelectorAll('.oet-venues__country').forEach(function(s){var vis=0,ok=!c||s.getAttribute('data-country')===c;s.querySelectorAll('tbody tr').forEach(function(r){var show=ok&&(!m||r.getAttribute('data-mode')===m)&&(!q||r.getAttribute('data-city').indexOf(q)!==-1)&&(!p||r.getAttribute('data-prof')==='all'||(' '+r.getAttribute('data-prof')+' ').indexOf(' '+p+' ')!==-1);r.hidden=!show;if(show)vis++;});var st=s.querySelector('.oet-state-list');var stateOnly=st&&ok&&!q&&m!=='paper';if(st)st.hidden=!stateOnly;s.hidden=!(ok&&(vis>0||stateOnly||!on));shown+=vis;});status.textContent=on?tpl.replace('{n}',shown):all;empty.hidden=!(on&&shown===0&&!root.querySelector('.oet-venues__country:not([hidden])'));note.hidden=!(p&&p!=='medicine'&&p!=='nursing');}Object.keys(f).forEach(function(k){f[k].addEventListener(k==='city'?'input':'change',run);});try{var h=location.hash.replace('#','');if(h&&root.querySelector('.oet-venues__country[data-country="'+h+'"]')){/* a deep link keeps the whole directory visible and lets the browser scroll to the country */}}catch(e){}})();`;

function venueDirectory(lang) {
  const { centres, regs } = data();
  const t = T[lang];
  const total = centres.countries.reduce((n, c) => n + c.venues.length, 0);
  const profs = regs ? regs.professions : PROFESSION_IDS.map((id) => ({ id, en: id, ar: id }));
  const byRegion = REGIONS.map(([r, ar]) => ({ label: lang === 'ar' ? ar : r, list: centres.countries.filter((c) => c.region === r) }));
  return `<div class="oet-venues" data-oet-venues>
<form class="oet-venues__filters" role="search" onsubmit="return false">
<label><span>${t.country}</span><select data-f="country"><option value="">${t.allCountries}</option>${byRegion.map((g) => `<optgroup label="${esc(g.label)}">${g.list.map((c) => `<option value="${c.id}">${esc(cname(c, lang))}</option>`).join('')}</optgroup>`).join('')}</select></label>
<label><span>${t.city}</span><input type="search" data-f="city" placeholder="${esc(t.cityPh)}" autocomplete="off" dir="ltr"></label>
<label><span>${t.mode}</span><select data-f="mode"><option value="">${t.allModes}</option><option value="computer">${t.computer}</option><option value="paper">${t.paper}</option></select></label>
<label><span>${t.profession}</span><select data-f="profession"><option value="">${t.allProf}</option>${profs.map((p) => `<option value="${p.id}">${esc(lang === 'ar' ? p.ar : p.en)}</option>`).join('')}</select></label>
</form>
<p class="oet-venues__status" aria-live="polite" data-shown="${esc(t.shown('{n}'))}">${t.listings(total, centres.countries.length)}</p>
<p class="oet-venues__profnote" hidden>${t.profNote}</p>
<p class="oet-venues__empty" hidden>${t.none} <a href="${FINDER}" target="_blank" rel="noopener noreferrer">oet.com/test/book-a-test</a></p>
<nav class="oet-venues__jump" aria-label="${esc(t.jump)}"><ul>${centres.countries.map((c) => `<li><a href="#${c.id}">${esc(cname(c, lang))}</a></li>`).join('')}</ul></nav>
${byRegion.map((g) => g.list.map((c) => countrySection(c, lang)).join('\n')).join('\n')}
<p class="oet-data-checked">${t.checked} ${longDate(centres.checked, lang)}. <a href="${FINDER}" target="_blank" rel="noopener noreferrer">${t.finder}</a>.</p>
</div>
<script>${FILTER_JS}</script>`;
}

function paperDirectory(lang) {
  const { centres } = data();
  const t = T[lang];
  return `<div class="oet-venues oet-venues--paper">
${REGIONS.map(([r, ar]) => {
    const list = centres.countries.filter((c) => c.region === r && c.paper2027);
    if (!list.length) return '';
    return `<h3 class="oet-venues__region">${lang === 'ar' ? ar : r}</h3>\n${list.map((c) => {
      const n = counts(c);
      return `<section class="oet-venues__country" id="${c.id}" data-country="${c.id}">
<h4>${esc(cname(c, lang))} <span class="oet-venues__count">${t.paperCount(n.paper, n.jan)}</span></h4>
<p class="oet-venues__meta">${t.computerAlso(n.computer)}: <a href="${hub(lang)}#${c.id}">${t.seeAll}</a>.${coursePage(c, lang) ? ` <a href="${coursePage(c, lang)}">${t.course(esc(cname(c, lang)))}</a>.` : ''}</p>
${venueTable(c, lang, { only: 'paper' })}
</section>`;
    }).join('\n')}`;
  }).join('\n')}
<p class="oet-data-checked">${t.checked} ${longDate(centres.checked, lang)}. <a href="${FINDER}" target="_blank" rel="noopener noreferrer">${t.finder}</a>.</p>
</div>`;
}

function countryVenues(id, lang) {
  const { centres } = data();
  const c = centres.countries.find((x) => x.id === id);
  if (!c) throw new Error(`regdata: <!--oet:venues:${id}--> names a country that is not in test-centres.json`);
  const t = T[lang];
  return `<div class="oet-venues oet-venues--one">${usStates(c, lang)}${c.venues.length ? venueTable(c, lang) : ''}<p class="oet-data-checked">${t.checked} ${longDate(centres.checked, lang)}. <a href="${FINDER}" target="_blank" rel="noopener noreferrer">${t.finder}</a>.</p></div>`;
}

// ---------------------------------------------------------------------------------------------------------------- regulators
const tx = (o, lang) => (o ? o[lang] || '' : '');
const badge = (s, lang) => `<span class="oet-status oet-status--${s}">${T[lang].S[s]}</span>`;
const lrws = (s) => (s ? `${s.L} / ${s.R} / ${s.W} / ${s.S}` : '');
const src = (r) => `<a href="${esc(r.source.url)}" target="_blank" rel="noopener noreferrer" lang="en" dir="ltr">${esc(r.source.label)}</a>`;
function profList(r, regs, lang) {
  if (r.professions.includes('all')) return T[lang].allProfs;
  return r.professions.map((id) => { const p = regs.professions.find((x) => x.id === id); return lang === 'ar' ? p.ar : p.en; }).join(lang === 'ar' ? '، ' : ', ');
}
const destName = (regs, id, lang) => { const d = regs.destinations.find((x) => x.id === id); return lang === 'ar' ? d.ar : d.en; };
const table = (cls, head, rows, label) => `<div class="oet-data-wrap" tabindex="0" role="region" aria-label="${esc(label)}"><table class="oet-data-table ${cls}"><thead><tr>${head.map((h) => `<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>\n${rows.join('\n')}\n</tbody></table></div>`;
const reg = (r) => `<strong lang="en" dir="ltr">${esc(r.short)}</strong><br><span class="oet-data-sub" lang="en" dir="ltr">${esc(r.name)}</span>`;
function scoreCell(r, lang) {
  const t = T[lang];
  const parts = [];
  if (r.scores) parts.push(`<span dir="ltr">${lrws(r.scores)}</span>`);
  if (r.total) parts.push(t.total(r.total));
  if (tx(r.scoresNote, lang)) parts.push(esc(tx(r.scoresNote, lang)));
  return parts.join('<br>') || badge('not-confirmed', lang);
}

function requireRegs() {
  const { regs } = data();
  if (!regs) throw new Error('regdata: src/data/regulators.json is missing');
  return regs;
}

function homeAcceptance(lang) {
  const regs = requireRegs();
  const t = T[lang];
  const order = { accepted: 0, conditional: 1, 'not-accepted': 2, 'not-confirmed': 3 };
  const rows = regs.destinations.flatMap((d) => regs.regulators.filter((r) => r.destination === d.id && r.oet !== 'not-listed')
    .sort((a, b) => order[a.formats.home] - order[b.formats.home])
    .map((r) => `<tr data-home="${r.formats.home}"><td>${esc(destName(regs, d.id, lang))}</td><td>${reg(r)}</td><td>${esc(profList(r, regs, lang))}</td><td>${badge(r.formats.home, lang)}</td><td>${esc(tx(r.homeNote, lang))}</td><td>${src(r)}</td></tr>`));
  return table('oet-home-table', [t.destination, t.regulator, t.profs, t.home, t.basis, t.source], rows, t.home);
}

function clubbingTable(lang) {
  const regs = requireRegs();
  const t = T[lang];
  const order = { yes: 0, 'one-subtest-retake': 1, no: 2, 'not-stated': 3, 'not-confirmed': 4 };
  const rows = regs.regulators.filter((r) => r.oet === 'accepted')
    .sort((a, b) => order[a.combine] - order[b.combine] || regs.destinations.findIndex((d) => d.id === a.destination) - regs.destinations.findIndex((d) => d.id === b.destination))
    .map((r) => {
      const win = r.combine === 'yes' ? `${r.sittings ? `${t.sittings(r.sittings)}, ` : ''}${t.within(r.windowMonths)}` : '';
      const combine = ['yes', 'no', 'one-subtest-retake'].includes(r.combine) ? `<span class="oet-status oet-status--${r.combine === 'yes' ? 'accepted' : r.combine === 'no' ? 'not-accepted' : 'conditional'}">${t.S[r.combine]}</span>` : badge(r.combine, lang);
      return `<tr data-combine="${r.combine}"><td>${reg(r)}<br><span class="oet-data-sub">${esc(destName(regs, r.destination, lang))}</span></td><td>${esc(profList(r, regs, lang))}</td><td>${scoreCell(r, lang)}</td><td>${combine}</td><td>${win}</td><td>${r.floors ? `<span dir="ltr">${lrws(r.floors)}</span>` : ''}</td><td>${esc(tx(r.combineNote, lang))}</td><td>${src(r)}</td></tr>`;
    });
  return table('oet-clubbing-table', [t.regulator, t.profs, t.minimum, t.combine, t.window, t.floors, t.note, t.source], rows, t.combine);
}

function recognitionMatrix(lang) {
  const regs = requireRegs();
  const t = T[lang];
  const fmt = (r) => ['paper', 'computer', 'home'].map((k) => T[lang].S[r.formats[k]]).join(' / ');
  const row = (r, d) => `<tr data-oet="${r.oet}"><td>${esc(destName(regs, d, lang))}</td><td>${reg(r)}</td><td>${badge(r.oet, lang)}</td><td>${r.oet === 'accepted' ? scoreCell(r, lang) : esc(tx(r.note, lang))}</td><td>${r.oet === 'accepted' ? fmt(r) : ''}</td><td>${src(r)}</td></tr>`;
  const head = [t.destination, t.regulator, t.oetStatus, t.scores, t.formats, t.source];
  const jump = `<nav class="oet-venues__jump" aria-label="${esc(t.profession)}"><ul>${regs.professions.map((p) => `<li><a href="#profession-${p.id}">${esc(lang === 'ar' ? p.ar : p.en)}</a></li>`).join('')}</ul></nav>`;
  const sections = regs.professions.map((p) => {
    const rows = regs.destinations.flatMap((d) => {
      const list = regs.regulators.filter((r) => r.destination === d.id && r.purpose === 'registration' && (r.professions.includes(p.id) || r.professions.includes('all')));
      return list.length ? list.map((r) => row(r, d.id)) : [`<tr data-oet="not-confirmed"><td>${esc(destName(regs, d.id, lang))}</td><td></td><td>${badge('not-confirmed', lang)}</td><td colspan="3">${t.noRow}</td></tr>`];
    });
    return `<section class="oet-matrix__profession" id="profession-${p.id}"><h3>${esc(lang === 'ar' ? p.ar : p.en)}</h3>\n${table('oet-matrix-table', head, rows, lang === 'ar' ? p.ar : p.en)}</section>`;
  });
  const other = regs.regulators.filter((r) => r.purpose !== 'registration');
  const otherBlock = other.length ? `<section class="oet-matrix__profession" id="immigration-and-credentialing"><h3>${t.immigration}</h3>\n${table('oet-matrix-table', head, other.map((r) => row(r, r.destination)), t.immigration)}</section>` : '';
  return `<div class="oet-matrix">${jump}\n${sections.join('\n')}\n${otherBlock}</div>`;
}

// ---------------------------------------------------------------------------------------------------------------- entry point
const ANY = /<!--oet:(?:venue-directory|paper-2027-directory|venues:[a-z-]+|home-acceptance|clubbing-table|recognition-matrix|data-checked:(?:venues|regulators))-->/;

/** Replace the data markers of a page. `key` is the page key from lib/page.mjs ("ar/…" = Arabic output). */
export function applyRegData(parts, key) {
  if (!ANY.test(parts.main) && !ANY.test(parts.meta) && !ANY.test(parts.headExtra)) return parts;
  const lang = key && key.startsWith('ar/') ? 'ar' : 'en';
  const fill = (html) => html
    .replace(/<!--oet:venue-directory-->/g, () => venueDirectory(lang))
    .replace(/<!--oet:paper-2027-directory-->/g, () => paperDirectory(lang))
    .replace(/<!--oet:venues:([a-z-]+)-->/g, (_, id) => countryVenues(id, lang))
    .replace(/<!--oet:home-acceptance-->/g, () => homeAcceptance(lang))
    .replace(/<!--oet:clubbing-table-->/g, () => clubbingTable(lang))
    .replace(/<!--oet:recognition-matrix-->/g, () => recognitionMatrix(lang))
    .replace(/<!--oet:data-checked:venues-->/g, () => longDate(data().centres.checked, lang))
    .replace(/<!--oet:data-checked:regulators-->/g, () => longDate(requireRegs().checked, lang));
  const out = { ...parts, meta: fill(parts.meta), main: fill(parts.main) };
  return out.headExtra.includes(DIRECTORY_CSS) ? out : { ...out, headExtra: `${out.headExtra}\n${DIRECTORY_CSS}` };
}
