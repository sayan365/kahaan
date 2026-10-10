# Catalogue expansion: 10 October 2026

The catalogue grew from 19 to **31 listings**, staying within the existing `kolkata-central` boundary. No field visits, invented places or community votes were used. Every record starts at zero confirmations and reports; report/confirm remains available after sign-in.

| Type | Listings | Evidence and limits |
|---|---:|---|
| Toilets | 26 | OSM nodes/ways. Four restricted-access records were excluded from the fresh query. Some separate gender-specific toilets share a building; this is not a count of 26 independent buildings. |
| Bins/waste points | 2 | One OSM litter bin and one disposal container. Container access/acceptance is unknown and it is excluded from recommendations. Litter-bin suggestions are limited to plastic bottles, wrappers and paper. |
| E-waste | 2 | Croma's operator-published programme and KMC's named Dhapa Garage centre. Dhapa is a call-first candidate with an approximate garage pin and no evidenced entrance or item list. |
| Recycling | 1 | Vital Waste's recycling service is supported by institution-published client records. Its current map listing is a service office; walk-in drop-off is unconfirmed and it is excluded from recommendations. |

## Method

A single Overpass query covered the configured bbox `22.535,88.335,22.59,88.405` for `amenity=toilets`, `waste_basket`, `waste_disposal` and `recycling`, requesting geometry centres and source timestamps. It returned 30 toilet records, one litter bin, one disposal point and no `amenity=recycling` records. One private and three customer-only toilets were excluded. Ten previously missing OSM IDs were added: eight toilet records and the two waste points. Existing seed IDs and descriptions were preserved.

The litter-bin source is [OSM node 7048259546](https://www.openstreetmap.org/node/7048259546); the disposal-point source is [OSM node 7052489791](https://www.openstreetmap.org/node/7052489791). These records describe mapped facilities, not proof of current condition or waste segregation. Dates/tags are retained in the new records. The rerunnable Overpass script now includes disposal containers and excludes customer-only access.

[KMC's e-waste page](https://www.kmcgov.in/KMCPortal/jsp/EWaste.jsp) names Dhapa Garage, Tangra and publishes a disposal contact route. A manually inspected map listing supplies an approximate garage location. A nearby duplicate listing is not imported as a second centre. Call the municipal number before travel; no opening hours or specialist acceptance is inferred.

[Maulana Azad College's 2024 client record](https://www.maulanaazadcollegekolkata.ac.in/pdf/AQAR/2023-24/6/6%2C5.1.pdf) documents Vital Waste collecting paper, metal, plastic and e-waste. A current manually inspected map listing identifies a Fortuna Tower service office and its contact number. Older client/directory records use other addresses, and the operator website could not be resolved during research. Therefore this is a browse-only service-office candidate, with an approximate pin and empty accepted-item list.

## Leads kept out of the map

- Samsung's [current collection locator](https://www.samsung.com/in/care-for-clean-india/) was checked in the browser with West Bengal selected. It returned warehouse locations in Hooghly and Sankrail/Howrah, outside this pilot. Samsung's published pickup contact remains a useful research lead; no invented local store drop-off was added.
- [HTGMS](https://htgms.com/E-Waste-Management-%28EPR%29) lists a Lenin Sarani office but offers certification/EPR consultancy. It does not establish a public collection point.
- [Dealcom's policy](https://dealcom.in/pages/e-waste-policy) provides a contact address for inquiries. It does not establish walk-in disposal at that office.
- T-Series' older published collection PDF includes a Kolkata address, but its [current collection page](https://ced.tseries.com/e-waste-collection.php) no longer includes that entry. It needs confirmation before importing.
- KMC's 2015 toilet list and older compactor announcements are historical leads, not evidence of current access. Industrial recycling registrations, college waste contracts and scrap-business directory listings are not automatically public drop-off sites.

## Publishing and later correction

Keep `sourceUrl`, `locationSourceUrl` where applicable, research dates and uncertainty notes. Synchronise with `node scripts/sync-data.mjs`, validate the seeds and seed DynamoDB using conditional writes. Re-seeding adds missing records without replacing contributed data or votes. It does not update or remove an already seeded record automatically; a source correction needs a separately reviewed targeted update.

Reports indicate community concerns; they do not compensate for invented data or prove facility acceptance. Reported places are excluded from recommendations once the existing trust threshold is met. Browse-only records remain excluded even after community confirmations until access and acceptance evidence is reviewed.
