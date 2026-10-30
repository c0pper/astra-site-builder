## Identity

Lead row (batch 2026-10-30-campania_leads, id 029): "Gommista", Via Pigna 42, 80126 Napoli, 081 7141902, Google category "Negozio di pneumatici", 4.4 from 195 reviews, no website.

Matched on phone and street. PagineGialle https://www.paginegialle.it/napoli-na/pneumatici/esposito-domenico and Virgilio https://aziende.virgilio.it/pneumatici/napoli-na/esposito-domenico (one Italiaonline database) list "Gommista Esposito Domenico", category "Pneumatici - commercio e riparazione", **Via Pigna 80, 80128 Napoli**, phone 081 7141902 (plus 331 5736334 on WhatsApp and 081 2781664).

House number and CAP differ from the lead row (42 / 80126 vs 80 / 80128); the phone and street are the same, so it is treated as the same business. The only other tyre shop on Via Pigna in PagineGialle is Autore Salvatore (Via Pigna 96/A, 333 1970157), a different phone: not a match. No listing at Via Pigna 42 found.

Address used: Via Pigna 80, 80128 (Italiaonline), because OpenStreetMap places Via Pigna in CAP 80127 (Vomero) and 80128 (Arenella), not 80126. **Confirm the house number with the owner.**

Sub-type: `tyre-shop`, backed by the Google category "Negozio di pneumatici" and the PagineGialle category.

## Searched, not found

- `legalName`, `vatNumber`: a P.IVA 09753881219 appears only inside the encoded data of the PagineGialle/Virgilio "claim this listing" link, not as visible text. VIES (https://ec.europa.eu/taxation_customs/vies/rest-api/ms/IT/vat/09753881219) returns `isValid: false`; reportaziende.it/09753881219 returns 404; a web search on the number finds nothing. Left out: the page does not state it.
- `geo`: Nominatim matches only the street (Via Pigna ways, no house number, no named node). Left out.
- `hours`: not on PagineGialle or Virgilio (both empty), no other source.
- `email`, `socials`: none found (PagineGialle, Virgilio, web searches for name + Via Pigna and for the phone numbers).
- `seasonalClosures`, `automotive.booking`, `automotive.brands`: no source.
- Services: none named by any source (the directories give only the category). Registry generic services for `tyre-shop` used, marked `generic`. The single PagineGialle review mentions roadside help for a flat tyre: review text, not used.
- Own domain: gommistaesposito.it/.com, espositogomme.it, gommistaespositodomenico.it do not resolve.
- `theme.brandColors`: no logo or signage seen.

## Existing web presence

**none**: no own site, no social pages found. Directory listings only (PagineGialle, Virgilio) and the Google Maps listing named just "Gommista".
