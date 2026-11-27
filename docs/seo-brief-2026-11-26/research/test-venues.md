# OET test venues: official-source research

Last checked: **27 Nov 2026**. Sources used: oet.com and support.oet.com only. No third-party prep site was used for any venue.

## 1. How the data was obtained, and what that means

| Item | Result |
|---|---|
| `https://oet.com/test/book-a-test` | HTTP 200. Holds the finder form ("Search for a test near you" / "Find a test") and the published date tables. The venue results are rendered by JavaScript, so the HTML itself contains no venue. |
| `https://oet.com/test/test-venues` | **HTTP 404.** No such page. |
| `https://oet.com/test/find-a-test` | HTTP 200, JS-only shell (form + results block, no venue in the HTML). |
| Finder data endpoint | Found by reading the page's own scripts. The finder is an Algolia InstantSearch widget that queries the index **`agility_test_venue_en_au`** (Algolia application `UEE906EU2Q`, the public search-only key shipped in oet.com's scripts) with one filter: `country` = the last part of the location the visitor typed, sorted by distance. No other filter is applied by the page. |
| Records read | All **713** records of that index, read on 27 Nov 2026: 129 "OET Test on Paper", 395 "OET Test on Computer", 189 "OET@Home" placeholders (one per country/territory, not venues). |
| Per-venue test dates | **NOT VERIFIED.** The venue records carry no date, session or profession field. The scripts also reference a second index for test slots (`NEXT_PUBLIC_ALGOLIA_TEST_INDEX`), but its name is not present in the shipped scripts, so it could not be queried. Dates below are the global date tables on the booking page, not per venue. |
| Per-venue professions | **NOT VERIFIED** (no such field). Professions are published per test date only (section 5). |
| Per-venue fees | The `priceAud` / `priceUsd` fields exist but are empty on all venue records except one: Qatar, "Test Orbits (Prometric Test Center)", which carries 587 (AUD) and 393 (USD). The 393 figure conflicts with the US$455 in the support article (section 9) and is not shown as a published fee anywhere else, so do not quote it. |
| `support.oet.com/s/article/...` URLs | JS-only (Salesforce); a plain fetch returns "Sorry to interrupt / CSS Error". The same articles are readable at `support.oet.com/articles/Knowledge/<slug>`, which is what was used. Those were read through a summarising fetch tool, so only the short phrases in quotation marks are verbatim. |

**What "VERIFIED" means in this file:** the venue record (name, city, address, mode) exists in the official finder's data on 27 Nov 2026. It does **not** prove that the venue has an open session on a given date, nor that a paper venue will run paper sessions in 2027. Before publishing a venue as "available", open the finder for that city and confirm it offers a bookable date.

Things in the data to be aware of:

- **Two kinds of paper record.** 33 paper records are titled `<venue> - <city> <country> (<4-digit number>) - Online Speaking test at venue`, were created most recently (record IDs 21195-21227) and all carry the note "Special testing accommodations will not be available in January 2027". These match OET's 16 Nov 2026 announcement (speaking "via a live video connection" at some venues). The other 96 paper records are older listings with face-to-face details (registration times, parking). Whether each older paper venue continues in 2027 is **NOT VERIFIED**: the data has no end date or status field. Reading the 33 as "the January 2027 video-speaking paper venues" is an inference from the titles and the note, not a statement by OET.
- **The 2027-note records exist in 14 countries**: Australia, Canada, Egypt, Ghana, India, Ireland, Kenya, Nepal, New Zealand, Pakistan, Philippines, Saudi Arabia, United Arab Emirates, United Kingdom. **Turkey and Sri Lanka have none**; each has one older paper record only.
- Country values are keyed inconsistently in the source ("NEPAL", "SRI LANKA", " New Zealand" with a leading space, "Türkiye"). The index matches country case-insensitively ("Sri Lanka" returns the "SRI LANKA" record), so these are grouped below; the raw value is shown per country.
- Names and addresses are copied as keyed by OET, including capitalisation, typos and odd postcodes. Some computer venues are separate men's and women's centres in Saudi Arabia.
- A few records look mis-keyed in the source and should be checked in the finder before use, for example "Educate Learn Develop – Sharjah" whose address reads Al Garhoud, Dubai.
- Booking links on the records: paper -> `https://registration.myoet.com/register.jsp`; computer and OET@Home -> `https://booking.oet-global.com`.

## 2. Summary: records found per country

Official URL for every row: `https://oet.com/test/book-a-test` (finder; data index `agility_test_venue_en_au`). Last checked 27 Nov 2026.

| Country | Computer-at-venue records | Paper records (total) | of which "Online Speaking test at venue" records carrying the January 2027 note | Paper records without that note |
|---|---|---|---|---|
| Egypt | 2 | 5 | 2 | 3 |
| Saudi Arabia | 13 | 3 | 1 | 2 |
| United Arab Emirates | 2 | 10 | 2 | 8 |
| Turkey | 2 | 1 | 0 | 1 |
| Ghana | 1 | 2 | 1 | 1 |
| Kenya | 1 | 3 | 1 | 2 |
| United Kingdom | 9 | 24 | 7 | 17 |
| Ireland | 2 | 5 | 2 | 3 |
| India | 9 | 26 | 7 | 19 |
| Pakistan | 3 | 8 | 3 | 5 |
| Nepal | 1 | 3 | 1 | 2 |
| Sri Lanka | 2 | 1 | 0 | 1 |
| Philippines | 6 | 12 | 2 | 10 |
| Australia | 5 | 8 | 1 | 7 |
| New Zealand | 1 | 8 | 2 | 6 |
| Canada | 16 | 4 | 1 | 3 |
| Qatar | 1 | 0 | 0 | 0 |
| Kuwait | 1 | 0 | 0 | 0 |
| Oman | 1 | 0 | 0 | 0 |
| Bahrain | 1 | 0 | 0 | 0 |
| Jordan | 1 | 0 | 0 | 0 |
| Nigeria | 3 | 0 | 0 | 0 |
| South Africa | 2 | 2 | 0 | 2 |
| United States | 228 | 1 | 0 | 1 |
| Singapore | 1 | 0 | 0 | 0 |
| Malaysia | 1 | 2 | 0 | 2 |

OET@Home placeholder records are excluded from the counts.

## 3. The 16 paper countries

### Egypt

Finder records: 2 computer-at-venue, 5 paper (2 with the January 2027 note). Raw country value(s) in the data: "Egypt". Last checked 27 Nov 2026.

| # | Venue name (as shown) | City / region | Address (as shown) | Mode | Jan 2027 note | Record ID |
|---|---|---|---|---|---|---|
| 1 | American Center | Alexandria | American Center,3 Pharaana St., Azarita Alexandria 21111 Egypt [postcode field: 21111] | Computer | no | content-6576 |
| 2 | AMIDEAST - Cairo | Cairo | Amideast,38 Mohie El Din Abo El Ezz Street Dokki, Giza Cairo Egypt | Computer | no | content-5940 |
| 3 | American Center - Alexandria Egypt (8710) - Online Speaking test at venue | Alexandria | American Center, 3 Pharaana St., Azarita, Alexandria 21111, Egypt [postcode field: 21111] | Paper | yes | content-21212 |
| 4 | AMIDEAST - Cairo Egypt (8708) - Online Speaking test at venue | Cairo | AMIDEAST, 38 Mohie El Din Abo El Ezz Street, Dokki, Giza, Cairo, Egypt | Paper | yes | content-21213 |
| 5 | IEC - AASTMT | Alexandria | Arab Academy for Science and Technology and Maritime Transport, Miami Campus, Gamal Abdel Nasser Street, Main Building, Ground Floor, Miami Alexandria Egypt | Paper | no | content-5715 |
| 6 | Future University (FUE) | Cairo | Future University in Egypt (FUE) 90th Street, Fifth Settlement New Cairo, Cairo 11835 [postcode field: 11835] | Paper | no | content-5698 |
| 7 | IEC – AASTMT – Smart Village | GIZA | 28th Km- Cairo-Alexandria Desert Road- Smart Village Arab Academy for Science and Technology (AASTMT) Building B2401, Fourth Floor Egypt, Giza | Paper | no | content-5716 |

### Saudi Arabia

Finder records: 13 computer-at-venue, 3 paper (1 with the January 2027 note). Raw country value(s) in the data: "Saudi Arabia". Last checked 27 Nov 2026.

| # | Venue name (as shown) | City / region | Address (as shown) | Mode | Jan 2027 note | Record ID |
|---|---|---|---|---|---|---|
| 1 | National Institute, 1st Floor, WOMEN | Al Joaf (Sakaka) | National Institute, 1St Floor,King Fahd Street, Sakaka, Women Al Joaf (Sakaka) 4241 Saudi Arabia [postcode field: 4241] | Computer | no | content-6891 |
| 2 | AL JOAF - MEN ONLY, SAUDI ARABIA | Al Joaf Men (Sakaka) | Al Aziziyah 72345 1st Floor, Aisha bint Abi Bakr Street, Sakaka Al Joaf Men Saudi Arabia [postcode field: 4241] | Computer | no | content-6890 |
| 3 | MindMerge Training Center, Mousa Center | Al Khobar | Mindmerge Training Center, Mousa Center,Entrance C From The Back Of The Building Floor 1, King Faisal Street, Coastal Road Al Khobar 31952 Saudi Arabia [postcode field: 31952] | Computer | no | content-5926 |
| 4 | ALSHAFI INSTITUTE FOR TRAINING, MEN | El Taef Men | Alshafi Institute For Training (New Horizons/,Direct English) Next To Stc Building (Sharp) El Taef Men 26524-2244 Saudi Arabia [postcode field: 26524-2244] | Computer | no | content-6912 |
| 5 | ALSHAFI INSTITUTE FOR TRAINING, WOMEN | El Taef | Alshafi Institute For Training (New Horizons/,Direct English)Next To Stc Building Back Side El Taef 26524-2244 Saudi Arabia [postcode field: 26524-2244] | Computer | no | content-6913 |
| 6 | Institute Miqyas Al-Ma'rifah For Training, MEN | Hail | Institute Miqyas Al-Ma'Rifah For Training Men,1St Floor, 3763 - Sheikh Abdulaziz Bin Baz St Al-Matar District Hail 55421 - 7042 Saudi Arabia [postcode field: 55421 - 7042] | Computer | no | content-6914 |
| 7 | Institute Miqyas Al-Ma'rifah For Training, WOMEN | Hail | Institute Miqyas Al-Ma'Rifah For Training Women,1St Floor, 3763 - Sheikh Abdulaziz Bin Baz St Al-Matar District Hail 55421 - 7042 Saudi Arabia [postcode field: 55421 - 7042] | Computer | no | content-6915 |
| 8 | Saudi Business Center | Jeddah | Saudi Business Center, 4Th Flr, Office No.414,Al Madinah Al Munawarah Road, Alsharafiyah Jeddah 22234 Saudi Arabia [postcode field: 22234] | Computer | no | content-5912 |
| 9 | SCFHS Building, 1st Floor, Palestine Street | Jeddah | Scfhs Building, 1St Floor, Palestine Street,Next To Dallah Tower Jeddah Saudi Arabia | Computer | no | content-6918 |
| 10 | AMIDEAST Riyadh | Riyadh | AMIDEAST Saudi Arabia, King Fahad Branch Rd, 2nd Floor Al Murabba, Above Artis Medical Clinic Riyadh 12612, Saudi Arabia [postcode field: 12612] | Computer | no | content-5918 |
| 11 | Riyadh , SAUDI ARABIA | Riyadh | 7027 Akaria Mall 12244 - 2455,3Rd Akaria Mall 7Th Floor- Computerized Exam Riyadh 11495 Saudi Arabia [postcode field: 11495] | Computer | no | content-6924 |
| 12 | Prometric test center-New Horizons | Tabuk Men | Prometric Test Center-New Horizons,Geber Ibn Hayyan Tabuk Men 47912 Saudi Arabia [postcode field: 47912] | Computer | no | content-6930 |
| 13 | Prometric Test Centre - New Horizons | Tabuk Women | Prometric Test Centre - New Horizons,Geber Ibn Hayyan Tabuk Women 47912 Saudi Arabia [postcode field: 47912] | Computer | no | content-6931 |
| 14 | Amideast Saudi Arabia - Riyadh Saudi Arabia (4373) - Online Speaking test at venue | Riyadh | Amideast Saudi Arabia 2nd Floor, King Fahad Branch Road, Above Abeer Medical Clinic, Al Murabba (Near Murabba Metro Station), Riyadh 12162, Saudi Arabia [postcode field: 12162] | Paper | yes | content-21211 |
| 15 | Dar al Hekma University - North Campus | Jeddah | 4872 Prince Majid Rd Jeddah Makkah Province 22246 Saudi Arabia [postcode field: 22246] | Paper | no | content-5670 |
| 16 | Alfaisal University | Riyadh | Takhassusi Road, Al Zahrawi Street , P.O. Box 50927 Riyadh Riyadh Province 11533 Saudi Arabia [postcode field: 11533] | Paper | no | content-5637 |

### United Arab Emirates

Finder records: 2 computer-at-venue, 10 paper (2 with the January 2027 note). Raw country value(s) in the data: "United Arab Emirates". Last checked 27 Nov 2026.

| # | Venue name (as shown) | City / region | Address (as shown) | Mode | Jan 2027 note | Record ID |
|---|---|---|---|---|---|---|
| 1 | AMIDEAST, Abu Dhabi | Abu Dhabi | Amideast, Ground Floor Villa 100 And 102,Al Nahyan Commercial Complex Off Delma Street Al Nahyan Area Abu Dhabi United Arab Emirates | Computer | no | content-5917 |
| 2 | AMIDEAST Dubai | Dubai | Amideast Dubai, Office G01, Block 2B,Knowledge Village, Al Burouj Road, Al Sufouh Dubai United Arab Emirates | Computer | no | content-5920 |
| 3 | Amideast Abu Dhabi - Abu Dhabi UAE (8241) - Online Speaking test at venue | Abu Dhabi | Amideast Abu Dhabi, 100 Al Batoul St, Unit 100 - Villa 13B, Main Entrance, Ground Floor, Plaza 30, Al Nahyan Area, Abu Dhabi, United Arab Emirates | Paper | yes | content-21208 |
| 4 | Amideast Abu Dhabi (CFA) - Abu Dhabi UAE (4434) - Online Speaking test at venue | Abu Dhabi | 100 Al Batoul St, Unit100 -, Villa13B (Main Entrance), Ground Floor, Plaza 30 - Al Nahyan area, Al Nahyan, P.O. Box 26446, Abu Dhabi 26446, United Arab Emirates [postcode field: 26446] | Paper | yes | content-21209 |
| 5 | CERT, Abu Dhabi | Abu Dhabi | CERT (HCT-Abu Dhabi Women's College), Behind Lebanon Flower restaurant. Opposite to Burjeel Hospital - Abu Dhabi, UAE | Paper | no | content-5664 |
| 6 | Educate Learn Develop – Al Ain | Al Ain | Abu Dhabi University, Al Ain Campus Al Muwaij'iAlAl Sallan Al Ain Abu Dhabi United Arab Emirates | Paper | no | content-5684 |
| 7 | Royal Science & Technology Institute Al Ain | Al Ain | 244 Sultan Bin Wiqaish Al Dhaheri Street, Oud Bin Saghan Road 33, Al Muwaij'I Al Ain Abu Dhabi United Arab Emirates [postcode field: 00 971] | Paper | no | content-5772 |
| 8 | CERT - HCT DUBAI - AL NAHDA CAMPUS (OLD WOMEN'S COLLEGE) | Dubai | HCT- Dubai Al Nahda Women's College Campus, 55, Baghdad street , G Floor, Al Nahda 2, Dubai, Opposite Grand Service Station Al Qusais, Near Biryaniwalla & Co., Al Nadha, Dubai, UAE. | Paper | no | content-5665 |
| 9 | CERT - HCT - Fujairah Men's College | Fujairah | HCT Fujairah Men's College. Sheikh Khalifa Bin Zayed Rd, Near City Center Fujairah - Fujairah - United Arab Emirates | Paper | no | content-6070 |
| 10 | CERT - HCT - Ras Al Khaimah Men's College | Ras Al Khaimah | Ras Al Khaimah Men's College , Sultan Al Kabeer East Street, Seih Al Araibi, Ras Al-Khaimah, UAE | Paper | no | content-5663 |
| 11 | Educate Learn Develop – Sharjah | Sharjah | ALDAR Academy for Vocational Education, Al Gaizi Plaza, G Floor, 61A Street, Al Garhoud, Dubai, UAE | Paper | no | content-5685 |
| 12 | Educate Learn Develop – Abu Dhabi | (blank) | Abu Dhabi University, Zayed City, Mussafah-Shabia Area Near Capital Mall – E22 , Abu Dhabi, United Arab Emirates | Paper | no | content-10086 |

### Turkey

Finder records: 2 computer-at-venue, 1 paper (0 with the January 2027 note). Raw country value(s) in the data: "Türkiye". Last checked 27 Nov 2026.

| # | Venue name (as shown) | City / region | Address (as shown) | Mode | Jan 2027 note | Record ID |
|---|---|---|---|---|---|---|
| 1 | Turkish-American Association | Ankara | Turkish-American Association,Cinnah Caddesi 20, Kavaklidere Ankara 6690 Turkey [postcode field: 6690] | Computer | no | content-6986 |
| 2 | International Quality GuidanceTrainingService | Istanbul | International Quality Guidancetrainingservice,Onur Is Merkezi No:118 K:10, Esentepe Mah Buyukdere Cad, Sisli Istanbul 34394 Turkey [postcode field: 34394] | Computer | no | content-6988 |
| 3 | British Side, Istanbul, Turkey | Istanbul | CIHANNUMA MAH. BARBAROS BULVARI, NO:91 BESIKTAS ISTANBUL [postcode field: 34353] | Paper | no | content-5645 |

### Ghana

Finder records: 1 computer-at-venue, 2 paper (1 with the January 2027 note). Raw country value(s) in the data: "Ghana". Last checked 27 Nov 2026.

| # | Venue name (as shown) | City / region | Address (as shown) | Mode | Jan 2027 note | Record ID |
|---|---|---|---|---|---|---|
| 1 | Linear Assessment Services | Accra | Linear Assessment Services,1St Floor Total House Liberia Road Accra Ghana | Computer | no | content-5900 |
| 2 | Total Energies House - Accra Ghana (8238) - Online Speaking test at venue | Accra | Linear Assessment Services, 1st Floor Total Energies House, Liberia Road (near National Theatre), Accra, Ghana | Paper | yes | content-21217 |
| 3 | Wisconsin International University College | Accra | No. 23 Akoto Bamfo Street, Off Agbogba Street, Accra Greater Accra Region Ghana | Paper | no | content-5793 |

### Kenya

Finder records: 1 computer-at-venue, 3 paper (1 with the January 2027 note). Raw country value(s) in the data: "Kenya". Last checked 27 Nov 2026.

| # | Venue name (as shown) | City / region | Address (as shown) | Mode | Jan 2027 note | Record ID |
|---|---|---|---|---|---|---|
| 1 | Computer Pride Limited | Nairobi | Computer Pride Limited,1St Floor, Jkuat Towers, Kenyatta Avenue (Previously Known As Icea Building) Nairobi Kenya | Computer | no | content-5895 |
| 2 | Computer Pride Limited - Nairobi Kenya (8282) - Online Speaking test at venue | Nairobi | Computer Pride Limited, 1st Floor, JKUAT Towers, Kenyatta Avenue, (Previously known as ICEA Building), Nairobi, Kenya | Paper | yes | content-21210 |
| 3 | KenyanNurse - Moi University, Eldoret | Eldoret | Moi University, College of Health sciences school of Medicine P.O BOX 4606, Eldoret 30100 Kenya [postcode field: 30100] | Paper | no | content-10117 |
| 4 | International University Pathways College | Nairobi | NO. 3 KANJATA ROAD, OFF JAMES GICHURU ROAD, LAVINGTON Nairobi Nairobi County 00400 Kenya [postcode field: 00 400] | Paper | no | content-5734 |

### United Kingdom

Finder records: 9 computer-at-venue, 24 paper (7 with the January 2027 note). Raw country value(s) in the data: "United Kingdom". Last checked 27 Nov 2026.

| # | Venue name (as shown) | City / region | Address (as shown) | Mode | Jan 2027 note | Record ID |
|---|---|---|---|---|---|---|
| 1 | Birmingham City University, Faculty of Tech | Birmingham | Birmingham City University, Faculty Of Tech,Millennium Point, Curzon Street Birmingham B4 7Xg United Kingdom [postcode field: B4 7Xg] | Computer | no | content-7005 |
| 2 | Pitman Training Bristol | Bristol | Pitman Training Bristol, Unit 9, Ground Floor,Hide Market, Waterloo Road, St Phillips Bristol Bs2 0Pl United Kingdom [postcode field: Bs2 0Pl] | Computer | no | content-7012 |
| 3 | Mobile Testing Solutions | Cardiff | Mobile Testing Solutions, 5-7 Market Chambers,5Th Floor, St Mary'S Street Cardiff Cf101At United Kingdom [postcode field: Cf101At] | Computer | no | content-6041 |
| 4 | Pitman Training - Gemini Business Park | Leeds | Pitman Training - Gemini Business Park,Unit 8, Sheepscar Way Leeds Ls7 3Jb United Kingdom [postcode field: Ls7 3Jb] | Computer | no | content-6046 |
| 5 | High Holborn House | London | High Holborn House,52-54 High Holborn London Wc1V 6Rl United Kingdom [postcode field: Wc1V 6Rl] | Computer | no | content-6042 |
| 6 | International Testing & Training Services Ltd | Manchester | International Testing & Training Services Ltd,Universal Square, Main Building, 3Rd Floor Devonshire St. North Manchester M12 6Jh United Kingdom [postcode field: M12 6Jh] | Computer | no | content-7060 |
| 7 | Peterborough Uk(Cfa) | Peterborough, PE1 1YN | Peterborough United Kingdom | Computer | no | content-7064 |
| 8 | Online Exams Sefton House | Peterborough | Online Exams Sefton House,Adam Court, Newark Rd Peterborough Pe1 5Pp United Kingdom [postcode field: Pe1 5Pp] | Computer | no | content-7065 |
| 9 | Belfast South Community Resources | (blank) | 127-145 Sandy Row, Belfast BT12 5ET, United Kingdom | Computer | no | content-18242 |
| 10 | Leeds Media Centre - Leeds UK (4156) - Online Speaking test at venue | Leeds | 21 Savile Mount, Leeds LS7 3HZ, United Kingdom [postcode field: LS7 3HZ] | Paper | yes | content-21218 |
| 11 | High Holborn House - London UK (8495) - Online Speaking test at venue | London | High Holborn House, 52-54 High Holborn, London WC1V 6RL, United Kingdom [postcode field: WC1V 6RL] | Paper | yes | content-21219 |
| 12 | ITTS London - Colet Court, London UK (5492) - Online Speaking test at venue | London | Colet Court Lower Ground Floor, 100 Hammersmith Road, London W6 7JP, United Kingdom [postcode field: W6 7JP] | Paper | yes | content-21226 |
| 13 | ITTS London - Colet Court, London UK (5494) - Online Speaking test at venue | London | Colet Court Lower Ground Floor, 100 Hammersmith Road, London W6 7JP, United Kingdom [postcode field: W6 7JP] | Paper | yes | content-21227 |
| 14 | Universal Square - Manchester UK (4537) - Online Speaking test at venue | Manchester | Universal Square, Main Building, 3rd Floor, Devonshire St. North, Manchester M12 6JH, United Kingdom [postcode field: M12 6JH] | Paper | yes | content-21220 |
| 15 | Universal Square - Manchester UK (8652) - Online Speaking test at venue | Manchester | International Testing & Training Services Ltd, Universal Square, Main Building, 3rd Floor, Devonshire St. North, Manchester M12 6JH, United Kingdom [postcode field: M12 6JH] | Paper | yes | content-21225 |
| 16 | Vistpro Exam Centre - Newcastle UK (4920) - Online Speaking test at venue | Newcastle | Vistpro Exam Centre, Unit 9, Bankside, The Watermark, Metro Riverside Park, Tyne & Wear, Newcastle NE11 9SY, United Kingdom [postcode field: NE11 9SY] | Paper | yes | content-21216 |
| 17 | International House Bristol | Clifton, Bristol, Bristol | 2 Queens Avenue, Clifton, Bristol, BS8 1SE, UK [postcode field: BS8 1SE] | Paper | no | content-5722 |
| 18 | International House London – Belfast | Belfast, Northern Ireland | Stranmills University College, Stranmillis Road, Belfast, Co. Antrim, BT9 5DY [postcode field: BT9 5DY] | Paper | no | content-5884 |
| 19 | International House London Birmingham | Birmingham | Birmingham City University, Edgbaston Campus Westbourne Road Birmingham West Midlands B15 3TN United Kingdom [postcode field: B15 3TN] | Paper | no | content-5725 |
| 20 | Anglo-continental | BourNEMOUTH | ANGLO-CONTINENTAL 29-35 WIMBORNE ROAD BOURNEMOUTH DORSET BH2 6NA ENGLAND [postcode field: BH2 6NA] | Paper | no | content-5639 |
| 21 | Medical English Plus | Brighton | Stanford Junior School, Stanford Road, Brighton, East Sussex, BN1 5PR [postcode field: BN1 5PR] | Paper | no | content-5748 |
| 22 | International House London Cambridge | Cambridge | Anglia Ruskin University - Cambridge East Road Cambridge, CB1 1PT, UK [postcode field: CB1 1PT] | Paper | no | content-5726 |
| 23 | Celtic English Academy, Cardiff | Cardiff | 12-14 Park Grove, CF10 3BN, Cardiff [postcode field: CF10 3BN] | Paper | no | content-5660 |
| 24 | International House London Chelmsford | Chelmsford | Anglia Ruskin University - Chelmsford Bishop Hall Lane Chelmsford, CM1 1SQ, UK [postcode field: CM1 1SQ] | Paper | no | content-5727 |
| 25 | International House London Edinburgh | Edinburgh | 54 Manor Place Edinburgh Edinburgh EH37EH United Kingdom [postcode field: EH37EH] | Paper | no | content-5728 |
| 26 | Centre of English Studies, Leeds | Leeds | CES Leeds School, 9 Park Place, Leeds, LS1 2RU | Paper | no | content-5662 |
| 27 | Leicester College | Leicester | Leicester College Abbey Park Campus Painter Street Leicester LE1 3WA [postcode field: LE1 3WA] | Paper | no | content-5739 |
| 28 | LILA Liverpool | Liverpool | New Barratt House, 47 North John Street, Liverpool, L2 6SG, UK [postcode field: L2 6SG] | Paper | no | content-5741 |
| 29 | Ealing, Hammersmith and West London College | London | Ealing, Hammersmith and West London College - Hammersmith Campus Gliddon Road Hammersmith, London, W14 9BL UK [postcode field: W14 9BL] | Paper | no | content-5675 |
| 30 | International House London | London | International House London 16 Stukeley Street, London WC2B 5LQ [postcode field: WC2B 5LQ] | Paper | no | content-5724 |
| 31 | MTS Manchester | Manchester | Connell College, 301 Alan Turing Way, Manchester M11 3BS, UK [postcode field: M11 3BS] | Paper | no | content-5646 |
| 32 | International House London Newcastle | Newcastle | Gateshead College, Baltic Campus, Quarryfield Road, Baltic Business Quarter, Gateshead, Newcastle, NE8 3BE [postcode field: NE8 3BE] | Paper | no | content-5730 |
| 33 | Accent International Torquay | Torquay | 15 St Marychurch Rd Torquay Torbay TQ1 3HY United Kingdom [postcode field: TQ1 3HY] | Paper | no | content-5626 |

### Ireland

Finder records: 2 computer-at-venue, 5 paper (2 with the January 2027 note). Raw country value(s) in the data: "Ireland". Last checked 27 Nov 2026.

| # | Venue name (as shown) | City / region | Address (as shown) | Mode | Jan 2027 note | Record ID |
|---|---|---|---|---|---|---|
| 1 | CORK , IRELAND | Cork, Co Cork | Unit 2,The Stables,Alfred Street Cork Ireland | Computer | no | content-6699 |
| 2 | Dublin , IRELAND | Dublin, Co Dublin | Ground Floor, La Touche House,Ifsc Dublin D01 R5P3 Ireland [postcode field: D01 R5P3] | Computer | no | content-6710 |
| 3 | The Stables - Cork Ireland (8440) - Online Speaking test at venue | Cork | Unit 2,The Stables, Alfred Street, Cork, Ireland | Paper | yes | content-21215 |
| 4 | One Custom House Plaza - Dublin Ireland (8044) - Online Speaking test at venue | Dublin | Suite 1A, Level One, One Custom House Plaza, IFSC, Dublin D01 C2C5, Ireland [postcode field: D01 C2C5] | Paper | yes | content-21214 |
| 5 | Cork English College | Cork | St. Patrick's Bridge Cork County Cork T23 D863 Ireland | Paper | no | content-5669 |
| 6 | Centre of English Studies, Dublin | Dublin | LRW: Camden Court Hotel, Camden Street Lower, Saint Kevin's, Dublin, D02 W086 S: 31 Dame Street, Dublin 2,D02 CX73 [postcode field: D02 W086] | Paper | no | content-5661 |
| 7 | International House London Galway, Ireland | Galway | Atlantic Language School Galway, Fairgreen House, Fairgreen Road, Galway, Ireland [postcode field: H91 AXK8] | Paper | no | content-5729 |

### India

Finder records: 9 computer-at-venue, 26 paper (7 with the January 2027 note). Raw country value(s) in the data: "India". Last checked 27 Nov 2026.

| # | Venue name (as shown) | City / region | Address (as shown) | Mode | Jan 2027 note | Record ID |
|---|---|---|---|---|---|---|
| 1 | Ahmedabad , INDIA | Ahmedabad | Prometric Testing Pvt Ltd,5Th Floor, Unit 501, Parshwanath Esquare, Prahaladnagar Corporate Road, Prahaladnagar, Satellite Ahmedabad 3800051 India [postcode field: 3800051] | Computer | no | content-5915 |
| 2 | Bengaluru , INDIA | Bengaluru | Prometric Testing Pvt Ltd,3Rd Floor Tower B Prestige Shantiniketan White Field Itpl Road Bangalore South Taluk Bengaluru 560048 India [postcode field: 560048] | Computer | no | content-5904 |
| 3 | Chennai , INDIA | Chennai | Prometric Testing Pvt Ltd,Unit #8,3Rd Floor, Centennial Square, No 6A, Dr Ambedkar Road, Kodambakkam, Chennai 600024 India [postcode field: 600024] | Computer | no | content-5905 |
| 4 | GURGAON , INDIA | Gurgaon | Prometric Testing Pvt Ltd,Iris Tech Park, 2Nd Floor Tower A, Sector 48, Sohna Road Sohna Road Gurgaon 122018 India [postcode field: 122018] | Computer | no | content-6638 |
| 5 | GURGAON , INDIA | Gurgaon | Prometric Testing Pvt Ltd,Iris Tech Park, 2Nd Floor Tower A, Sector 48, Sohna Road Sohna Road Gurgaon 122018 India [postcode field: 122018] | Computer | no | content-5931 |
| 6 | HYDERABAD , INDIA | Hyderabad | Prometric Testing Pvt Ltd,9Th Floor, Unit - 2,Kapil Towers It Block Survey No 115/1, It Park, Opp Icici Bldg, Nanakramguda,Serilingampaly Mandal,Gachibowli Hyderabad 500032 India [postcode field: 500032] | Computer | no | content-5908 |
| 7 | Kolkata , INDIA | Kolkata | Prometric Testing Pvt Ltd,Millennium City,9Th Floor Block Dn-62, Sector V, Salt Lake Kolkata 700091 India [postcode field: 700091] | Computer | no | content-5914 |
| 8 | Mumbai , INDIA | Mumbai | Prometric Testing Pvt Ltd,6Th Floor,Techniplex1 (Gate No.2),Goregaon(W) Ratnakar Bank Building, Balwa Group, Off Veer Savarkar Flyover Goregaon (W) Mumbai India | Computer | no | content-5910 |
| 9 | Thiruvananthapuram , INDIA | Thiruvananthapuram | Prometric Testing Pvt. Ltd,7Th Floor, K.E.K Towers Opposite Trivandrum Club Vazhuthacaud Thiruvananthapuram 695010 India [postcode field: 695010] | Computer | no | content-5902 |
| 10 | Prometric Testing Pvt Ltd - Ahmedabad India (8902) - Online Speaking test at venue | Ahmedabad | Prometric Testing Pvt Ltd, 5th Floor, Unit 501, Parshwanath Esquare, Prahaladnagar Corporate Road, Prahaladnagar, Satellite, Ahmedabad 3800051, India [postcode field: 3800051] | Paper | yes | content-21200 |
| 11 | Prometric Testing Pvt Ltd - Bangalore India (8918) - Online Speaking test at venue | Bengaluru | Prometric Testing Pvt Ltd, 3rd Floor Tower B Prestige ShantiNiketan, White Field ITPL Road, Bangalore South Taluk, Bengaluru 560048, India [postcode field: 560048] | Paper | yes | content-21199 |
| 12 | Prometric Testing Pvt Ltd - Chennai India (8909) - Online Speaking test at venue | Chennai | Prometric Testing Pvt Ltd, Unit #8,3rd Floor, Centennial Square, No 6A, Dr Ambedkar Road, Kodambakkam, Chennai 600024, India [postcode field: 600024] | Paper | yes | content-21202 |
| 13 | Prometric Testing Pvt Ltd, Iris Tech Park - GURGAON India (8927) - Online Speaking test at venue | Gurgaon | PROMETRIC TESTING PVT LTD, Iris Tech Park, 2nd Floor Tower A, Sector 48, Sohna Road, Sohna Road, Gurgaon 122018, India [postcode field: 122018] | Paper | yes | content-21198 |
| 14 | Prometric Testing Pvt Ltd - Hyderabad India (8908) - Online Speaking test at venue | Hyderabad | Prometric Testing Pvt Ltd, 9th Floor, Unit - 2,Kapil Towers IT Block, Survey No 115/1, IT Park, Opp ICICI bldg, Nanakramguda,Serilingampaly Mandal,Gachibowli, Hyderabad 500032, India [postcode field: 500032] | Paper | yes | content-21203 |
| 15 | Prometric Testing Pvt Ltd - Calcutta India (8906) - Online Speaking test at venue | Kolkata | Prometric Testing Pvt Ltd, Millennium City,9th Floor, Block DN-62, Sector V, Salt Lake, Kolkata 700091, India [postcode field: 700091] | Paper | yes | content-21204 |
| 16 | Prometric Testing Pvt Ltd - Trivandrum India (8907) - Online Speaking test at venue | Thiruvananthapuram | Prometric Testing Pvt. Ltd, 7th Floor, K.E.K Towers, Opposite Trivandrum Club, Vazhuthacaud, Thiruvananthapuram 695010, India [postcode field: 695010] | Paper | yes | content-21201 |
| 17 | Ebek Ahmedabad | Ahmedabad, Gujarat | The New Tulip International School, Sterling City Road, Amidhara Society, Sterling City, Bopal, Ahmedabad, Gujarat [postcode field: 380058] | Paper | no | content-5676 |
| 18 | MeritTrac - Bangalore | Bangalore, Karnataka | MeritTrac / St. Joseph's Institute of Management No. 28/1 Primrose Road, (Off M.G. Road), Near Trinity metro station Bengaluru, Karnataka 560025 India [postcode field: 560025] | Paper | no | content-12132 |
| 19 | PEAR Academy Bangalore | Bengaluru, Karnataka | Jyoti Nivas College Autonomous Hosur Road, Koramangala Bengaluru 560095 [postcode field: 560029] | Paper | no | content-5760 |
| 20 | Ebek Chennai | Chennai, Tamil Nadu | Ebek Language Laboratories Pvt. Limited Old No. 23, New No. 45, 1st Floor, 1st Main Road, West Shenoy Nagar Chennai - 600 030, Tamil Nadu, India [postcode field: 600 030] | Paper | no | content-5679 |
| 21 | Ebek Cochin | Cochin | Muthoot Institute of Technology and Science Kochi-Madurai-Tondi Point Rd, Puthenkurish, Varikoli PO, Cochin, Kerala – 682308 India [postcode field: 682308] | Paper | no | content-5680 |
| 22 | PeopleCare Business Solutions Pvt Ltd (PeopleEnglish Coimbatore) | Coimbatore, Tamil Nadu | RATHINAM Techzone Campus Block III Pollachi Main Road, Eachanari Coimbatore, Tamil Nadu 641021 India [postcode field: 641021] | Paper | no | content-5766 |
| 23 | Ebek Delhi | Delhi | Jesus and Mary College, San Martin Marg, Bapu dham, Chanakyapuri New Delhi Delhi 110021 India [postcode field: 110021] | Paper | no | content-5681 |
| 24 | Ebek Angamaly | Ernakulam | ODEPC, 4th floor Intel tower 1, Angamaly South, Ernakulam, Kerala - 683573, India [postcode field: 683573] | Paper | no | content-5677 |
| 25 | Ebek Hyderabad | Hyderabad, Telangana | Vijay Marie College of Nursing, Street Number 3, Uma Nagar, Begumpet, Hyderabad, Telangana 500016 India [postcode field: 500016] | Paper | no | content-10124 |
| 26 | Burlington English, Idukki | Idukki, Kerala | Newman College, Thodupuzha Newman College Rd, Mangattukavala, Thodupuzha Idukki, Kerala 685585 India [postcode field: 685585] | Paper | no | content-8116 |
| 27 | PEAR Academy Jalandhar | Jalandhar, Punjab | DAV Institute of Engineering & Technology (DAVIET) Kabir Nagar, Jalandhar Punjab 144008, India., Punjab 144008 India [postcode field: 144008] | Paper | no | content-11179 |
| 28 | PEAR Academy Kannur | Kannur, KERALA | Sreepuram English Medium School Pallikunnu P O, Kannur-4, Kerala, India, Pin: 670 004 [postcode field: 670004] | Paper | no | content-8053 |
| 29 | PEAR Academy Kochi | Kochi | Viswajyothi College of Engineering Muvattupuzha-Thodupuzha Road Vazhakulam, PO, Muvattupuzha, Kerala 686670, India [postcode field: 686670] | Paper | no | content-5762 |
| 30 | Ebek Kolkata | Kolkata | South City International School 375, Prince Anwar Shah Road, South City Complex, Jadavpur Kolkata, West Bengal, 700068 [postcode field: 700068] | Paper | no | content-5682 |
| 31 | Ebek Kottayam | Kottayam | Mangalam College of Engineering Mangalam Campus, Ettumanoor, Kottayam, Kerala – 989 631 India [postcode field: 686 631] | Paper | no | content-5683 |
| 32 | Ebek Calicut | Kozhikode | St. Joseph's College (Autonomous), Devagiri Medical College P O, Kozhikode - 673008, Kerala, India [postcode field: 673008] | Paper | no | content-5678 |
| 33 | PEAR Academy Mangalore | Mangalore | Yenepoya (Deemed to be University) University Road, Deralakatte Mangalore Karnataka 575018 India [postcode field: 575018] | Paper | no | content-5763 |
| 34 | Burlington English, Thrissur | Thrissur | Holygrace Academy Of Engineering Mala, Kuruvilassery (po), Thrissur, Pin – 680732 [postcode field: 680732] | Paper | no | content-5649 |
| 35 | Ebek Trivandrum | Trivandrum, Kerala | Marian Engineering College Menamkulam, Kazhakkoottam, Menamkulam Trivandrum, Kerala 695582 [postcode field: 695582] | Paper | no | content-11837 |

### Pakistan

Finder records: 3 computer-at-venue, 8 paper (3 with the January 2027 note). Raw country value(s) in the data: "Pakistan". Last checked 27 Nov 2026.

| # | Venue name (as shown) | City / region | Address (as shown) | Mode | Jan 2027 note | Record ID |
|---|---|---|---|---|---|---|
| 1 | Prometric Testing Center Islamabad | Islamabad | Prometric Testing Center Islamabad, 2nd floor, Maaksons C5, Civic Center, Gulberg Greens, Islamabad, Pakistan [postcode field: 44000] | Computer | no | content-5957 |
| 2 | Prometric Testing Center Karachi | Karachi | Prometric Testing Center Karachi,17Th Floor, Brr Tower, Hassan Ali Street Off I.I. Chundrigar Road, Saddar Karachi Pakistan | Computer | no | content-5919 |
| 3 | PROMETRIC TESTING CENTER LAHORE | Lahore | Prometric Testing Center Lahore, Upper ground floor, Parklane Tower/ Mall of Lahore, 172 Tufail Road, Lahore Cantt, Lahore, Pakistan [postcode field: 54810] | Computer | no | content-5944 |
| 4 | International Testing & Assessment Services - Islamabad Pakistan (8782) - Online Speaking test at venue | Islamabad | International Testing & Assessment Services, 2nd floor, Maaksons C5, Civic Center, Gulberg Greens, Islamabad, Pakistan | Paper | yes | content-21206 |
| 5 | International Testing & Assessment Services - Karachi Pakistan (8781) - Online Speaking test at venue | Karachi | International Testing & Assessment Services, 17th floor, BRR Tower, Hassan Ali Street, Off I.I. Chundrigar Road, Saddar, Karachi, Pakistan | Paper | yes | content-21205 |
| 6 | International Testing & Assessment Services - Lahore Pakistan (8783) - Online Speaking test at venue | Lahore | International Testing & Assessment Services, Upper GF, Parklane Tower/ Mall of Lahore, 172 Tufail Road, Lahore Cantt, Lahore, Pakistan | Paper | yes | content-21207 |
| 7 | AEO Pakistan, Islamabad Centre | Islamabad | National University of Technology, Main IJP Road, Sector I-12, Islamabad 44000 [postcode field: 44000] | Paper | no | content-5631 |
| 8 | AEO Pakistan, Karachi Centre | Karachi | MITE UNIVERSITY, No. 10, Sector-47 Korangi Creek Rd, Korangi Creek, Karachi Sindh 75190 Pakistan [postcode field: 75190] | Paper | no | content-5632 |
| 9 | AEO Pakistan, Lahore Centre | Lahore | The Millennium Universal College (TMUC), 310 Street 1, Sector F DHA Phase 6, Lahore | Paper | no | content-5633 |
| 10 | Institute of Career Development Lahore (last test date on 21 Nov 2026) | Lahore, Punjab | ICD House, 107 Mamdot Block, Mustafa Town, Wahdet Road, Lahore, Pakistan - 54600 [postcode field: 54600] | Paper | no | content-10122 |
| 11 | AEO Pakistan, Multan Centre | Multan, Punjab | La Salle Higher Secondary School, 9 # Chowk, Main Bosan Road, Multan, Punjab, Pakistan [postcode field: 60000] | Paper | no | content-9987 |

### Nepal

Finder records: 1 computer-at-venue, 3 paper (1 with the January 2027 note). Raw country value(s) in the data: "Nepal", "NEPAL". Last checked 27 Nov 2026.

| # | Venue name (as shown) | City / region | Address (as shown) | Mode | Jan 2027 note | Record ID |
|---|---|---|---|---|---|---|
| 1 | Alfa Beta | Kathmandu, Nepal | Alfa Beta 3rd Floor, Alfa Beta Complex, New Baneshwor, Madan Bhandari Road, Kathmandu, Nepal 44600 [postcode field: 44600] | Computer | no | content-5929 |
| 2 | Alfa Beta Complex - Kathmandu Nepal (8893) - Online Speaking test at venue | Kathmandu | 3rd Floor, Alfa Beta Complex, New Baneshwor, Madan Bhandari Road, Kathmandu 44600, Nepal [postcode field: 44600] | Paper | yes | content-21224 |
| 3 | Chitwan Medical College, Bharatpur | BHARATPUR, CHITWAN | East-west highway, 5th floor chitwan medical college, bharatpur-10, chitwan [postcode field: 44200] | Paper | no | content-5668 |
| 4 | Universal Language & Computer Institute | Kathmandu | 415, 419 Dillibazar Height Marga Kathmandu Nepal 44600 [postcode field: 44600] | Paper | no | content-5782 |

### Sri Lanka

Finder records: 2 computer-at-venue, 1 paper (0 with the January 2027 note). Raw country value(s) in the data: "Sri Lanka", "SRI LANKA". Last checked 27 Nov 2026.

| # | Venue name (as shown) | City / region | Address (as shown) | Mode | Jan 2027 note | Record ID |
|---|---|---|---|---|---|---|
| 1 | Open Arc Campus, Ground Floor | Colombo 06 | Open Arc Campus, Ground Floor,126, High Level Road, Opposite Vajira Salon Colombo 06 600 Sri Lanka [postcode field: 600] | Computer | no | content-5901 |
| 2 | Nexgen Education | Kandy | 337/1 Katugastota Road, Kandy 20000, Sri Lanka [postcode field: 20000] | Computer | no | content-20559 |
| 3 | Australian College of Business and Technology Kandy | KANDY | Australian College of Business and Technology Kandy, Edith Cowan College, 670/5, Peradeniya Road, Kandy, Sri Lanka. [postcode field: 20000] | Paper | no | content-5643 |

### Philippines

Finder records: 6 computer-at-venue, 12 paper (2 with the January 2027 note). Raw country value(s) in the data: "Philippines". Last checked 27 Nov 2026.

| # | Venue name (as shown) | City / region | Address (as shown) | Mode | Jan 2027 note | Record ID |
|---|---|---|---|---|---|---|
| 1 | Cebu City , PHILIPPINES | Cebu City | C/O Train,Educ & Dev Cons Inc Suite,308-Centro Maximo D Jakosalem St Cebu City Philippines | Computer | no | content-5903 |
| 2 | 2/F Ateneo de Manila University | Makati City | 2/F Ateneo De Manila University,130 Hv Dela Costa St. Salcedo Village Makati City 1227 Philippines [postcode field: 1227] | Computer | no | content-5907 |
| 3 | 9.0 Niner CDO | Misamis Oriental | 3rd Floor, Rodisa Building, 9.0 Don Apolinar Velez St, Cagayan De Oro City, Misamis Oriental, Philippines, 9000 [postcode field: 9000] | Computer | no | content-18246 |
| 4 | 9.0 Niner Bacolod | (blank) | 9.0 NINER Bacolod, Room 321 & 325 3rd Floor, VSB Building, 6th, 7th Lacson St, Bacolod, 6100 Negros Occidental, Philippines [postcode field: 6100] | Computer | no | content-16207 |
| 5 | 9.0 Niner Dagupan | (blank) | 9.0 Niner Dagupan, 2nd Floor, Unit 201, RVT Office Suite, Old Judge Jose de Venecia Ave, Dagupan City, Pangasinan, Philippines | Computer | no | content-16205 |
| 6 | 9.0 Niner Imus Branch | (blank) | 9.0 Niner Imus Branch, 5th Floor, DCR Building, 7560 Aguinaldo Hwy, Imus, 4103 Cavite, Philippines [postcode field: 4103] | Computer | no | content-16206 |
| 7 | C/O Train, Educ & Dev Cons Inc - Cebu City Phillippines (8473) - Online Speaking test at venue | Cebu City | C/O Train,Educ & Dev Cons Inc Suite, 308-Centro Maximo D Jakosalem St, Cebu City, Philippines | Paper | yes | content-21222 |
| 8 | Ateneo de Manila University - Manila Philippines (8475) - Online Speaking test at venue | Makati City | 2/F Ateneo de Manila University, 130 HV Dela Costa St. Salcedo Village, Makati City 1227, Philippines [postcode field: 1227] | Paper | yes | content-21223 |
| 9 | UTP Beyond Borders - Pampanga | Pampanga | University of the Assumption Unisite Subdvision Del Pilar San Fernando City Pampanga 2000 Philippines [postcode field: 2000] | Paper | no | content-5788 |
| 10 | ICSEC Kaplan Bacolod | Bacolod | STI West Negros University Burgos Street, Bacolod City Negros Occidental 6100 Philippines [postcode field: 6100] | Paper | no | content-5709 |
| 11 | UTP Beyond Borders - CDO | Cagayan De Oro, Misamis Oriental | Vineyard International Polytechnic College, Antonio Luna Street, Mabulay Subdivision (adjacent to Water District, Corrales Street), Barangay 27, Cagayan de Oro City, Misamis Oriental, 9000, Philippines [postcode field: 9000] | Paper | no | content-8687 |
| 12 | UTP Beyond Borders - Davao | Davao | KRISTY DAWN COLLEGE OF DAVAO INDANGAN CAMPUS INC. PHASE 2 BLK 47 LOT 36-40 DECA HOMES INDANGAN PELICAN ST. DAVAO CITY, DAVAO DEL SUR 8000 PHILIPPINES [postcode field: 8000] | Paper | no | content-5786 |
| 13 | ICSEC Kaplan, Iloilo | Iloilo city | 3F Brillantes Building M.H. Del Pilar Street. Molo Iloilo City Province of Iloilo 5000 Philippines [postcode field: 5000] | Paper | no | content-5711 |
| 14 | UTP Beyond Borders - Laguna | Laguna | Km. 54 Pan-Philippine HWY Calamba Laguna Calamba 4027 Philippines [postcode field: 4027] | Paper | no | content-5787 |
| 15 | ICSEC Kaplan, Cebu | Mandaue | EC Masucol BuildingAC Cortes Avenue, Alang-Alang Street Mandaue City, Cebu, 6014 Philippines [postcode field: 6014] | Paper | no | content-5710 |
| 16 | ICSEC Kaplan, Manila | Manila | 2nd Floor Saint Thomas Square, 1150 Espana Boulevard corner P. Campa Street, Sampaloc Manila Metro Manila 1015 Philippines [postcode field: 1015] | Paper | no | content-5712 |
| 17 | ICSEC Kaplan, Quezon | Quezon City | U-401, 4th Floor, Pacific Corporate Center 131 West Avenue Quezon City, 1104 Philippines [postcode field: 1104] | Paper | no | content-5713 |
| 18 | ICSEC Kaplan, San Juan | San Jaun | U-3002 30 F Atlanta Centre 31 Annapolis St, Greenhills, San Juan City 1503 San Juan Metro Manila 1503 Philippines [postcode field: 1503] | Paper | no | content-5714 |

### Australia

Finder records: 5 computer-at-venue, 8 paper (1 with the January 2027 note). Raw country value(s) in the data: "Australia". Last checked 27 Nov 2026.

| # | Venue name (as shown) | City / region | Address (as shown) | Mode | Jan 2027 note | Record ID |
|---|---|---|---|---|---|---|
| 1 | ILSC Brisbane | Brisbane, QLD | Level 1, 232 Adelaide Street, CBD Brisbane City , QLD 4000 Australia [postcode field: 4000] | Computer | no | content-16066 |
| 2 | Melbourne International Graduate College | Melbourne, Victoria | Melbourne International Graduate College,Level 4 382-384 Lonsdale Street Melbourne 3000 Vic Australia [postcode field: 3000 Vic] | Computer | no | content-5888 |
| 3 | Perth - Prometric | Perth, Western Australia | 150 Saint Georges Terrace, Perth, 6000, Australia [postcode field: 6000] | Computer | no | content-11467 |
| 4 | Yukon Consultants, Suite 204, Crows Nest | Sydney, New South Wales | Yukon Consultants, Suite 204, Crows Nest,272 Pacific Highway, New South Wales Sydney 2065 Australia [postcode field: 2065] | Computer | no | content-6399 |
| 5 | ELPIS EDUCATION PTY LTD (Elpis College) | Victoria Park, Western Australia | 350 Albany Highway Victoria Park WA 6100 Australia [postcode field: 6100] | Computer | no | content-20587 |
| 6 | Melbourne International Graduate College - Melbourne Australia (8634) - Online Speaking test at venue | Melbourne | Melbourne International Graduate College, Level 4 382-384 Lonsdale Street, Melbourne 3000 VIC, Australia [postcode field: 3000 VIC] | Paper | yes | content-21197 |
| 7 | PEAR Academy Australia | Adelaide | L3-112-118 Rundle Mall Adelaide 5000 [postcode field: 5000] | Paper | no | content-5761 |
| 8 | ILSC Brisbane | Brisbane, QLD | Level 1, 232 Adelaide Street, CBD Brisbane City , QLD 4000 Australia [postcode field: 4000] | Paper | no | content-14548 |
| 9 | Lawson College Australia | Dandenong | 53-59 WALKER ST. DANDENONG, VIC, 3175 [postcode field: 3175] | Paper | no | content-5738 |
| 10 | Discover English Exam Centre | Melbourne | 7/628 Bourke Street, Melbourne, Victoria, 3000 [postcode field: 3000] | Paper | no | content-5673 |
| 11 | TAFE NSW Newcastle English Language Centre | Newcastle | 266 Maitland Rd Tighes Hill, NSW P block, waiting room PG12 [postcode field: 2297] | Paper | no | content-5777 |
| 12 | UTAS English Language Centre | Newham | Building F, English Language Centre Newnham Drive, Newnham 7248 Australia [postcode field: 7248] | Paper | no | content-5785 |
| 13 | MP Testing Services | Sydney | Suite 805, Level 8, 84 Pitt St Sydney New South Wales 2000 Australia [postcode field: 2000] | Paper | no | content-5749 |

### New Zealand

Finder records: 1 computer-at-venue, 8 paper (2 with the January 2027 note). Raw country value(s) in the data: "New Zealand", " New Zealand". Last checked 27 Nov 2026.

| # | Venue name (as shown) | City / region | Address (as shown) | Mode | Jan 2027 note | Record ID |
|---|---|---|---|---|---|---|
| 1 | PM Training School Limited | Manukau, Auckland | Level 3, 21 Putney Way Manukau, Auckland 2104 [postcode field: 2104] | Computer | no | content-20666 |
| 2 | Lumify Auckland (CFA) - Auckland New Zealand (5081) - Online Speaking test at venue | Auckland | Level 9, 120 Albert Street, (Huawei Centre), Auckland CBD, Auckland 1011, New Zealand [postcode field: 1011] | Paper | yes | content-21195 |
| 3 | PM Training School Limited - Auckland New Zealand (8485) - Online Speaking test at venue | Auckland | PM Training School Limited, Level 3, 21 Putney Way Manukau, (Parkview Tower) Manukau CBD, Auckland 2104, New Zealand [postcode field: 2104] | Paper | yes | content-21196 |
| 4 | Languages International | Auckland & Christchurch, Auckland | 23 Princes Street Auckland CBD 1010, Auckland, New Zealand [postcode field: 1010] | Paper | no | content-5737 |
| 5 | DynaSpeak | Auckland | Level 10, 238 Queen Street Auckland, 1143 [postcode field: 1143] | Paper | no | content-5674 |
| 6 | ExamHub - Auckland | Auckland | Level 1, Suite 21 357 Great North Road, Henderson, Auckland, Auckland 0612 New Zealand [postcode field: 0612] | Paper | no | content-12158 |
| 7 | Ara Institute of Canterbury | Christchurch, Canterbury | 128 Madras Street, Christchurch, 8011, Canterbury, New Zealand [postcode field: 8011] | Paper | no | content-5640 |
| 8 | Waikato Institute of Education | Hamilton | Level 5, 218 Anglesea Street, Hamilton Central, Hamilton 3204 [postcode field: 3204] | Paper | no | content-5790 |
| 9 | WINTEC (Waikato Inst. of Technology) | Hamilton | WINTEC Centre for Languages Hamilton City Campus, A Block, Gate 2, Wintec City Centre Campus, Tristram Street, Whitiora, Hamilton, New Zealand 3200 [postcode field: 3200] | Paper | no | content-5792 |

### Canada

Finder records: 16 computer-at-venue, 4 paper (1 with the January 2027 note). Raw country value(s) in the data: "Canada". Last checked 27 Nov 2026.

| # | Venue name (as shown) | City / region | Address (as shown) | Mode | Jan 2027 note | Record ID |
|---|---|---|---|---|---|---|
| 1 | Calgary , CANADA | Calgary, Alberta | 8989 Macleod Trail Sw,Suite 301 Calgary T2H0M2 Canada [postcode field: T2H0M2] | Computer | no | content-6040 |
| 2 | Edmonton , CANADA | Edmonton, Alberta | 8944 182Nd Street Nw,Suite 316 Edmonton T5T 2E3 Canada [postcode field: T5T 2E3] | Computer | no | content-6045 |
| 3 | Halifax , CANADA - 6090 | Halifax, Nova Scotia | 1959 Upper Water Street,Tower 1 - Suite 401 Halifax B3J 3N2 Canada [postcode field: B3J 3N2] | Computer | no | content-8769 |
| 4 | Hamilton , CANADA | Hamilton, Ontario | 4 Hughson Street South,5Th Floor, Trios Office Hamilton L8N3Z1 Canada [postcode field: L8N3Z1] | Computer | no | content-6024 |
| 5 | LONDON , CANADA | London, Ontario | 520 First Street,Unit 1 London N5V3C6 Canada [postcode field: N5V3C6] | Computer | no | content-6021 |
| 6 | Mississauga , CANADA | Mississauga, Ontario | 1290 Central Parkway West, Suite 104, Mississauga L5C4R3 Canada [postcode field: L5C4R3] | Computer | no | content-6025 |
| 7 | Ottawa , CANADA | Ottawa, Ontario | 450 March Rd.,Suite 101 Ottawa K2K 3K2 Canada [postcode field: K2K 3K2] | Computer | no | content-6031 |
| 8 | Pointe-Claire , CANADA | Pointe-Claire, Quebec | 1000 Boul. St. Jean,Suite 206 Pointe-Claire H9R 5P1 Canada [postcode field: H9R 5P1] | Computer | no | content-6033 |
| 9 | Quebec City , CANADA | Quebec City, Quebec | 1035, Avenue Wilfrid-Pelletier,Suite 150 (Building B) Quebec City G1W 0C5 Canada [postcode field: G1W 0C5] | Computer | no | content-6540 |
| 10 | Regina , CANADA | Regina, Saskatchewan | 3520 5Th Avenue, Regina S4T 0M2 Canada [postcode field: S4T 0M2] | Computer | no | content-6546 |
| 11 | Saskatoon , CANADA | Saskatoon, Saskatchewan | 502 Wellman Cres,Suite 140 Saskatoon S7T0J1 Canada [postcode field: S7T0J1] | Computer | no | content-6547 |
| 12 | Memorial University of Newfoundland | St. John'S, Newfoundland | Memorial University Of Newfoundland,1 Arctic Ave Univ. Center - 4Th Floor Uc4000 St. John'S A1B5S7 Canada [postcode field: A1B5S7] | Computer | no | content-8770 |
| 13 | Cestar College of Business Health &Technology | Toronto, Ontario | Cestar College Of Business Health &Technology,265 Yorkland Blvd Suite 302 Toronto M2J 1S5 Canada [postcode field: M2J 1S5] | Computer | no | content-8771 |
| 14 | Toronto , CANADA | Toronto, Ontario | 425 Bloor St. East,Suite 202 Toronto M4W 3R4 Canada [postcode field: M4W 3R4] | Computer | no | content-6026 |
| 15 | Vancouver , CANADA | Vancouver, British Columbia | 1190 Melville Street Suite 400 Vancouver V6E 3W1 Canada [postcode field: V6E 3W1] | Computer | no | content-6037 |
| 16 | Winnipeg , CANADA | Winnipeg, Manitoba | 40-1128 Henderson Highway Winnipeg R2G 3Z7 Canada [postcode field: R2G 3Z7] | Computer | no | content-6038 |
| 17 | Yonge and Eglinton Centre - Toronto ON (4805) - Online Speaking test at venue | Toronto | 2300 Yonge Street. 30th Floor, Suite #3006, Yonge and Eglinton Centre, Entrance to Aroma Cafe, Toronto M4P 1E4, Canada [postcode field: M4P 1E4] | Paper | yes | content-21221 |
| 18 | Oxford International Halifax | Halifax, NS | 1801 Hollis Street, Halifax, NS B3J 3N4 Canada [postcode field: B3J 3N4] | Paper | no | content-20904 |
| 19 | CES - TORONTO | Toronto | 112 Elizabeth Street, Toronto, ON, Canada M5G 1P5 [postcode field: M5G 1P5] | Paper | no | content-5666 |
| 20 | Oxford International Vancouver | Vancouver | 250-815 West Hastings Street Vancouver, BC V6C 1B4 Canad [postcode field: BC V6C 1B4] | Paper | no | content-5758 |

## 4. Additional countries

### Qatar

Finder records: 1 computer-at-venue, 0 paper (0 with the January 2027 note). Raw country value(s) in the data: "Qatar". Last checked 27 Nov 2026.

| # | Venue name (as shown) | City / region | Address (as shown) | Mode | Jan 2027 note | Record ID |
|---|---|---|---|---|---|---|
| 1 | Test Orbits (Prometric Test Center) | Doha | Al Emadi Business Center, C Ring Road, 1st Floor, Doha, Qatar [postcode field: 0000] | Computer | no | content-18441 |

### Kuwait

Finder records: 1 computer-at-venue, 0 paper (0 with the January 2027 note). Raw country value(s) in the data: "Kuwait". Last checked 27 Nov 2026.

| # | Venue name (as shown) | City / region | Address (as shown) | Mode | Jan 2027 note | Record ID |
|---|---|---|---|---|---|---|
| 1 | AMIDEAST - Kuwait | Kuwait | Amideast, Dalal Complex 8Th Floor,Al Dimna St., 7 Ln, Salmiya Entrance Through Dalal City Hotel Kuwait Kuwait | Computer | no | content-5934 |

### Oman

Finder records: 1 computer-at-venue, 0 paper (0 with the January 2027 note). Raw country value(s) in the data: "Oman". Last checked 27 Nov 2026.

| # | Venue name (as shown) | City / region | Address (as shown) | Mode | Jan 2027 note | Record ID |
|---|---|---|---|---|---|---|
| 1 | Muscat , OMAN | Muscat | National Education Network, 405 West Wing, Al Watan Newspaper Building, 4th Floor - Al-Azaiba North, 130/669, Muscat, 130/669, Oman [postcode field: 130] | Computer | no | content-6847 |

### Bahrain

Finder records: 1 computer-at-venue, 0 paper (0 with the January 2027 note). Raw country value(s) in the data: "Bahrain". Last checked 27 Nov 2026.

| # | Venue name (as shown) | City / region | Address (as shown) | Mode | Jan 2027 note | Record ID |
|---|---|---|---|---|---|---|
| 1 | BIT Ahlia UNV, Gate 2 | Manama | Bit Ahlia Unv, Gate 2,Gosi Shopping Complex, Exhibition Avenue 1St Floor Manama 319 Bahrain [postcode field: 319] | Computer | no | content-5924 |

### Jordan

Finder records: 1 computer-at-venue, 0 paper (0 with the January 2027 note). Raw country value(s) in the data: "Jordan". Last checked 27 Nov 2026.

| # | Venue name (as shown) | City / region | Address (as shown) | Mode | Jan 2027 note | Record ID |
|---|---|---|---|---|---|---|
| 1 | Amman , JORDAN | Amman | Amideast, 1St Floor ,Building No. C8,Princess Basma Street, Wadi Abdoon Amman Jordan | Computer | no | content-5947 |

### Nigeria

Finder records: 3 computer-at-venue, 0 paper (0 with the January 2027 note). Raw country value(s) in the data: "Nigeria". Last checked 27 Nov 2026.

| # | Venue name (as shown) | City / region | Address (as shown) | Mode | Jan 2027 note | Record ID |
|---|---|---|---|---|---|---|
| 1 | Dragnet Test Center - Abuja | Abuja, Nigeria | Galaxy Uniprep Center, Suite 309, Plot 106/107, NAWA COMPLEX, Abuja, 0, NGA | Computer | no | content-20530 |
| 2 | Initiative for Development, Education, and Learning - Asaba | Asaba, Delta State | 37 Jesus Saves Road (NEAR PRESIDENTIAL LODGE), off Summit Road, Asaba, Delta State, 320233, NGA [postcode field: 320233] | Computer | no | content-19090 |
| 3 | Dragnet Prometric Test Center - Lagos | Lagos | Dragnet Prometric Test Center, Katia Gardens,Plot 1676, 3Rd Floor, Oladele Olashore Street Off Sanusi Fafunwa Street, Victoria Island Lagos Nigeria | Computer | no | content-6840 |

### South Africa

Finder records: 2 computer-at-venue, 2 paper (0 with the January 2027 note). Raw country value(s) in the data: "South Africa". Last checked 27 Nov 2026.

| # | Venue name (as shown) | City / region | Address (as shown) | Mode | Jan 2027 note | Record ID |
|---|---|---|---|---|---|---|
| 1 | Skylar, Suite 105, 1st Floor | Claremont | Skylar, Suite 105, 1St Floor,Vineyard Centre Corner Of Vineyard And Dreyer Streets Claremont 7708 South Africa [postcode field: 7708] | Computer | no | content-5890 |
| 2 | Advanced Assessments & Training | Randburg | Advanced Assessments & Training,Building 1 & 3 Boskruin Village Office Park Cnr Hawken And President Fouche Dr, Boskruin Randburg 2188 South Africa [postcode field: 2188] | Computer | no | content-6956 |
| 3 | IH Cape Town Language Institute (last test date 7/11/2026) | Cape Town | 3rd Floor, 35 Wale Street, Cape Town, 8001 South Africa [postcode field: 8001] | Paper | no | content-5717 |
| 4 | International House Johannesburg (last test date 5/12/2026) | Johannesburg | 5 Winchester Road, Parktown, Johannesburg | Paper | no | content-5723 |

### United States

Finder records: 228 computer-at-venue, 1 paper (0 with the January 2027 note). Raw country value(s) in the data: "United States". Last checked 27 Nov 2026.

Computer-at-venue records by state/region field (full list not reproduced here; it is in the finder): Alabama 5, Alaska 1, Arizona 6, Arkansas 3, California 15, Colorado 5, Connecticut 3, Delaware 1, Florida 11, Georgia 8, Hawaii 1, Idaho 2, Illinois 6, Indiana 7, Iowa 4, Kansas 5, Kentucky 4, Louisiana 4, Maine 2, Maryland 4, Massachusetts 5, Michigan 5, Minnesota 2, Mississippi 2, Missouri 3, Montana 2, Nebraska 5, Nevada 2, New Hampshire 2, New Jersey 3, New Mexico 5, New York 12, North Carolina 7, North Dakota 2, Ohio 8, Oklahoma 5, Oregon 5, Pennsylvania 8, Rhode Island 1, South Carolina 4, South Dakota 2, Tennessee 5, Texas 15, Utah 4, Vermont 1, Virginia 6, Washington, Dc 1, Washington 4, West Virginia 1, Wisconsin 3, Wyoming 1.

Paper records:

| # | Venue name (as shown) | City / region | Address (as shown) | Mode | Jan 2027 note | Record ID |
|---|---|---|---|---|---|---|
| 1 | Rennert International Manhattan (last test date on 21 Nov 2026) | New York | Rennert International 12, E 41st Street, 6th floor New York , N.Y. 10017 USA [postcode field: 10017] | Paper | no | content-5771 |

### Singapore

Finder records: 1 computer-at-venue, 0 paper (0 with the January 2027 note). Raw country value(s) in the data: "Singapore". Last checked 27 Nov 2026.

| # | Venue name (as shown) | City / region | Address (as shown) | Mode | Jan 2027 note | Record ID |
|---|---|---|---|---|---|---|
| 1 | Studyworks Pte Ltd , Prometric Test Center | Singapore | Studyworks Pte Ltd , Prometric Test Center,26 Boon Lay Way, #01-85 Tradehub 21 Singapore 609970 Singapore [postcode field: 609970] | Computer | no | content-5897 |

### Malaysia

Finder records: 1 computer-at-venue, 2 paper (0 with the January 2027 note). Raw country value(s) in the data: "Malaysia". Last checked 27 Nov 2026.

| # | Venue name (as shown) | City / region | Address (as shown) | Mode | Jan 2027 note | Record ID |
|---|---|---|---|---|---|---|
| 1 | Prometric Testing Center | Kuala Lumpur | Prometric Testing Center,Suite 2-1-04, Level 1, Wisma E&C N0 2, Lorong Dungun Kiri, Bukit Damansara Kuala Lumpur 50490 Malaysia [postcode field: 50490] | Computer | no | content-5898 |
| 2 | ELC Malaysia | Kuala Lumpur | ELC English Language Company, Unit 3.03, 3rd Floor, Wisma Bukit Bintang, 28, Jalan Bukit Bintang, 55100 Kuala Lumpur [postcode field: 55100] | Paper | no | content-5687 |
| 3 | GPEX Penang (last test date 5/12/2026) | Penang | Sentral College, 3, Lebuh Penang, 10300 Penang [postcode field: 10300] | Paper | no | content-5704 |

## 5. Published test dates, December 2026 to March 2027

Source: `https://oet.com/test/book-a-test` (HTTP 200, read 27 Nov 2026). These are global tables, not per venue or per country.

Booking close rules stated on the page: "Bookings for OET Test on Paper close 24 days before the test date (subject to change)." and "Bookings for OET Test on Computer at a test venue and OET@Home closes 7 days before the test date (11:59PM UTC time)."

### OET Test on Paper, "Global" table

| Test date | Book between | Results published | Professions shown |
|---|---|---|---|
| Sat 5 Dec 2026 | 10 Sep 2025 - Wed 11 Nov 2026 (closed) | Tue 22 Dec 2026 | Nursing, Medicine, Dentistry, Pharmacy, Physiotherapy, Radiography, Veterinary Science |
| Sat 19 Dec 2026 | 10 Sep 2025 - Wed 25 Nov 2026 (closed) | Tue 5 Jan 2027 | Nursing, Medicine |
| Sat 23 Jan 2027 | Fri 6 Nov 2026 - Wed 30 Dec 2026 | Tue 9 Feb 2027 | Nursing, Medicine |
| Sat 30 Jan 2027 | Fri 6 Nov 2026 - Wed 6 Jan 2027 | Tue 16 Feb 2027 | Nursing, Medicine |

### OET Test on Paper, "Americas" table

| Test date | Book between | Results published | Professions shown |
|---|---|---|---|
| Fri 4 Dec 2026 | 10 Sep 2025 - Tue 10 Nov 2026 (closed) | Tue 22 Dec 2026 | Nursing, Medicine, Dentistry, Pharmacy, Physiotherapy, Radiography, Veterinary Science |
| Fri 18 Dec 2026 | 10 Sep 2025 - Tue 24 Nov 2026 (closed) | Tue 5 Jan 2027 | Nursing, Medicine |
| Fri 22 Jan 2027 | Fri 6 Nov 2026 - Tue 29 Dec 2026 | Tue 9 Feb 2027 | Nursing, Medicine |
| Sat 23 Jan 2027 | Fri 6 Nov 2026 - Wed 30 Dec 2026 | Tue 9 Feb 2027 | Nursing, Medicine |
| Fri 29 Jan 2027 | Fri 6 Nov 2026 - Tue 5 Jan 2027 | Tue 16 Feb 2027 | Nursing, Medicine |
| Sat 30 Jan 2027 | Fri 6 Nov 2026 - Wed 6 Jan 2027 | Tue 16 Feb 2027 | Nursing, Medicine |

- **No paper date after 30 Jan 2027 is published** on the page as of 27 Nov 2026. February and March 2027 paper dates: none shown.
- The page does not say which countries the "Americas" table covers.

### OET Test on Computer, "Global" table

- December 2026 dates listed: 1-5, 7-12, 14-19 and every day from 21 to 30 Dec 2026, all 12 professions on each.
- Results for the dates from 21 Dec to 30 Dec 2026 are shown as "Monday, 04 January 2027".
- **No 2027 computer date is published** on the page as of 27 Nov 2026 (the last listed is Wed 30 Dec 2026). January to March 2027 computer dates: none shown.

## 6. What OET has officially published about paper tests from January 2027

Source: `https://oet.com/post/oet-test-on-paper-update-2027` ("Update to the OET Test on Paper from 2027", dated 16 Nov 2026), HTTP 200, full text read. Key sentences, verbatim:

- "From January 2027, there are changes to how the OET Test on Paper is delivered."
- "The OET Test on Paper will continue to be available for Nursing and Medicine only. The OET Test on Computer will remain available for all 12 healthcare professions at approved test venues, subject to availability."
- "Candidates taking the OET Test on Paper will continue to attend an approved test venue to complete their Speaking sub-test. Depending on the venue, candidates will interact with an OET Speaking interlocutor either in person or via a live video connection."
- "At venues where the Speaking sub-test is delivered via video connection, candidates will be provided with headphones for both the Speaking and Listening sub-tests. For the Listening sub-test, audio will be played through headphones, with timing information displayed on screen."

Homepage banner (`https://oet.com/`, read 27 Nov 2026): "2027 OET Test on Paper bookings now open" / "Bookings are now open for Nursing and Medicine. The OET Test on Computer is also available to book for all 12 healthcare professions."

**NOT VERIFIED on any official web page: the list of 16 countries.** Neither the announcement, the homepage, the booking page nor the paper-test page names the countries where paper testing continues. The 16-country list therefore still rests on the OET customer-care email, not on oet.com. What the finder data adds: the January 2027 note appears on paper records in 14 of the 16 (not Turkey, not Sri Lanka), and older paper records still exist for countries outside the 16 (Malaysia 2, South Africa 2, Hong Kong 1, United States 1).

Also note: `https://oet.com/test/oet-test-on-paper` has **not** been updated for 2027. It still lists seven professions (Medicine, Nursing, Dentistry, Pharmacy, Physiotherapy, Radiology, Veterinary Science) and describes Speaking as "Conducted at centre, face-to-face with an interlocutor in a private room." Do not quote that page as the 2027 position.

## 7. How to book (official steps)

Sources: `https://support.oet.com/articles/Knowledge/How-do-I-book-OET` and Test Regulations section 4 (`https://oet.com/test-regulations`).

1. Go to `https://oet.com/test/book-a-test`, enter city and country, click "Find a test"; filter by Test Mode or Distance.
2. Click "Book now" on the chosen venue.
3. **Paper:** register or log in at `https://registration.myoet.com/login.jsp`, click "Apply for the test" on the dashboard, follow the prompts; payment must be completed "within 15 minutes to secure your booking."
4. **Computer at a venue / OET@Home:** book at `https://booking.oet-global.com/` (or log in to the OET account and click "Book Now"); 15 minutes to complete the booking from selecting the date, then pay.
5. A confirmation email follows (check junk/spam). The support article recommends a desktop or laptop, a Visa or MasterCard, and the ID to hand.

From the Test Regulations: an account must be created first, with a personal email; paper candidates upload a photo, computer and OET@Home candidates upload an image of their ID; fees are paid at booking; one booking per test administration across all modes; "not all OET Test delivery dates and testing modes are available in all countries."

## 8. ID accepted on test day

Sources: `https://oet.com/test/test-day-information`, Test Regulations section 4.6, `https://support.oet.com/articles/Knowledge/What-ID-can-I-use-to-book-and-sit-OET`.

- **Paper:** a valid passport, or a valid national ID "issued by the national government in the country in which you are sitting the OET Test" showing full name, photograph and date of birth on the one document.
- **Computer at a venue and OET@Home:** a valid passport, or a valid national ID as above that "must be in English lettering"; "Where a National ID is not in English, then a certified translated copy will need to be presented along with the original ID on test day."
- "a driver's license is not considered an acceptable form of ID." Exception stated in the support article for candidates testing in the US only: a single government-issued ID, with "Only REAL ID-compliant driver's licenses" accepted.
- The ID used for booking must be the ID presented on test day. Original document only.
- EU: an EU card counts as a national ID for candidates testing in the EU.
- UK: refugee/asylum candidates may use a Biometric Residence Permit or Application Registration Card (see the regulations for conditions). E-visas / digital ID are not accepted (effective 28 January 2025).
- Wrong ID: the candidate may be refused and "may not be entitled to a deferral or refund."
- **Country-by-country rules beyond the above (for example Egypt, Saudi Arabia, UAE, India, Pakistan): none published.** OET states one general rule; it does not publish a per-country table. NOT VERIFIED for any specific national ID card.

## 9. Fees, as OET states them

- `https://oet.com/test/oet-test-on-paper`, `/test/oet-test-on-computer`, `/test/oet-test-at-home`: "Test fee: AUD $587" on each.
- `https://support.oet.com/articles/Knowledge/How-much-does-OET-cost`: the full test "costs AU$587"; **US$455** for OET on Computer at a venue and OET@Home in the United States (paper in the US stays AU$587, per the same article as surfaced in search).
- Individual sub-tests (paper only, not in the USA, only after a first full test), including a AU$7 online booking fee: 1 sub-test AU$315, 2 AU$415, 3 AU$515.
- **Tax and local currency: OET's pages say nothing.** No statement on GST, VAT, local taxes, local-currency prices or exchange rates was found on the fee pages, the support fee article or the Test Regulations. NOT VERIFIED whether tax is added at checkout in any country. Do not state a local-currency or tax-inclusive price.
- Re-marking: AU$120 per sub-test (Test Regulations 8.3).

## 10. How Speaking is delivered

- **Computer at a venue:** "Conducted at home via a secure platform or for select countries, conducted at venue." (`https://oet.com/test/oet-test-on-computer`). Listening, Reading and Writing are taken together at the venue.
- Countries/cities where Speaking at a venue is offered for computer candidates, per `https://oet.com/post/speaking-sub-test-available-for-select-countries` (20 Jul 2026): Kenya, South Africa, New Zealand, Kuwait, Qatar, Saudi Arabia, Australia (Melbourne, Sydney), Nigeria (Lagos), Philippines, Uganda, Nepal, Ghana (Accra), Bangladesh, India (Mumbai, Gurgaon), Pakistan (Islamabad, Karachi and Lahore). "In selected countries, you will have an option to choose between taking the Speaking sub-test at home or at a test venue." Egypt, the UAE, the UK, Ireland, Canada, Turkey and Sri Lanka are **not** on that list.
- Booking page note: "When booking your OET Test on Computer, please ensure the Speaking mode you select is accepted by the organisation you are applying to."
- Timing: the computer page FAQ says Speaking is "up to 5 days before or after" the LRW date; the Test Regulations say within the same test administration, "usually 8 days before or after". The two official texts differ; quote neither figure as fixed.
- **Paper, to December 2026:** at the venue, face to face, all four sub-tests the same day.
- **Paper, from January 2027:** at the venue, "either in person or via a live video connection" depending on the venue (section 6).
- **OET@Home:** "Conducted via the OET Speaking platform with a live interlocutor."

## 11. Rescheduling and cancellation

Source: Test Regulations section 9 (`https://oet.com/test-regulations`), read in full 27 Nov 2026.

Rescheduling fees:

| Mode | Before booking closing date | After booking closing date | Late |
|---|---|---|---|
| Paper (all sub-tests), in myOET | AU$120 | AU$200, up until the day before the test | None: "You cannot reschedule an OET Test on Paper after 11:59pm (local time) on the day prior to the test." |
| Computer at venue (LRWS) | AU$120 | AU$200, up to 48 hours before LRW start or Speaking time, whichever is sooner | AU$200, within 48 hours (via customer care) |
| Computer / OET@Home, Speaking only | AU$30 within the same administration | AU$100, up to 48 hours before | AU$100, no later than 24 hours after the scheduled Speaking start |
| OET@Home (LRWS) | AU$120 | AU$200 | AU$200 |

- Not possible by rescheduling (cancel and rebook instead): changing test mode, changing profession, moving a computer/OET@Home test to another country; paper bookings bought at a discount directly from OET cannot be rescheduled.
- "A rescheduled booking cannot be reversed." "Your Speaking sub-test rescheduling can only be made once."

Cancellation:

- **Computer and OET@Home:** fee AU$120 before the LRW booking closing date; AU$200 after it and up to 48 hours before the test start time. Not possible once a sub-test has been taken. No refund after the test.
- **Paper:** "You can cancel up to one week before the test day." Friday test: no refund for a cancellation after 11.59PM local time the Saturday before. Saturday test: after 11.59PM the Sunday before. Fee AU$120 before the booking closing date, AU$200 after. No partial cancellation.
- Support article `How-do-I-withdraw` (surfaced through search, not read in full): US amounts are US$95 / US$155; refunds go to the original card within 7-10 business days.
- No-show without extenuating circumstances: no refund.

## 12. Not verified, in one place

1. Per-venue test dates and seat availability (slot index not readable; finder results are JS-only).
2. Whether each of the 96 older paper venue records continues after December 2026.
3. The 16-country paper list (not on any OET web page).
4. Professions per venue.
5. Any February or March 2027 date, paper or computer (none published).
6. Tax, GST/VAT and local-currency prices (OET is silent).
7. Country-specific ID rules beyond the general rule.
8. Each venue's own website was not opened; names and addresses are as keyed in OET's finder only.
9. The full list of 228 United States computer venues is counted by state, not reproduced.
