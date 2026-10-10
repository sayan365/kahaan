# Kahaan: nearby sanitation and correct waste disposal in Kolkata

**Tagline:** Find a toilet. Find a bin. Find the right place for old electronics.

**Pilot city:** Kolkata, starting with one compact area selected through online source research. No field visits or in-person testing are required for this build. Choose the boundary based on usable published data; do not invent collection points or present citywide coverage.
**Languages:** English by default, with Bengali (বাংলা) and Hindi (हिन्दी) available throughout the main flows.

**Hackathon:** WeMakeDevs x AWS "Environmental Hacks", Oct 8-11, 2026. **Track: Waste and Energy.**
**Date reality check:** today is Saturday Oct 10. Submission closes Sunday Oct 11 (exact hour not announced, so confirm on the hackathon page and aim to submit by Sunday midday). Everything below is scoped for ~1.5 days.

---

## 0. Instructions for Codex (read first)

- Build the **smallest thing that works end to end**. Do not add features that are not in section 4 "Must have".
- Keep it simple: one repo, one AWS region, no microservices, no extra frameworks. Ask before adding a dependency not listed here.
- Never commit secrets or AWS keys. Config goes in `.env` files that are git-ignored; commit `.env.example`.
- Put pure logic (status calculation, validation, distance) in small functions and **write unit tests for them**.
- After each task: run the tests, run the linter or build, and tell me exactly what to run to verify it.
- When something needs a human (AWS console clicks, account setup, choosing data), stop and list the exact steps instead of guessing.
- Read `data/area.json` for the area. Do not hardcode a city.
- Use stable IDs for items, categories and place types; translate presentation text without changing routing or API values. Use local translation dictionaries, with no new translation dependency.

---

## 1. Problem

People in the Kolkata pilot area need practical answers: where is a publicly accessible toilet, where can this waste be handed over, and which place accepts an old charger? They may not know waste categories or begin by typing a disposal query. Existing maps may list facilities, but local coverage, access and accepted waste must be checked. A better interface helps people use existing services; it cannot supply missing collection infrastructure. Validate these assumptions with five local users before claiming behaviour change.

## 2. Solution

A mobile-first web app for **one small Kolkata neighbourhood**:

1. **Choose a need:** Find a toilet / Find a bin or collection point / Give away old electronics. Show a short nearby list with the map available as supporting context.
2. **Choose or search an item** ("old phone charger") when needed. Familiar item buttons avoid requiring technical vocabulary. Show the category, a short disposal tip, and the nearest suitable destination with directions.
3. **Community contributions**: anyone can add a missing place, confirm a place exists, or report one that is wrong or gone. A place becomes trusted after independent confirmations.

**Differentiator:** simple access to locally checked facilities, item-specific disposal guidance, and transparent community confirmations. Do not claim that other maps have no toilet listings or that a community confirmation establishes regulatory authorisation.

## 3. Users and stories

- *Passer-by*: "I have a dead battery. Where do I take it?" (search, result, directions)
- *Passer-by*: "Where is the nearest toilet or dustbin?" (layer toggle, nearest first)
- *Contributor*: "This place is missing, I'll add it." (login, pin, form)
- *Contributor*: "This place no longer exists." (login, report)
- *Contributor*: "Yes, this is correct." (login, confirm)

No login is needed to browse or search. Login is required **only** to add, confirm or report.

---

## 4. Scope

### Must have (MVP)
1. Map of the configured area (Leaflet + OpenStreetMap tiles) with markers per place type.
2. Item search (typo-tolerant, client-side) over `items.json`. Result card: category, tip, and nearest matching place with distance and a "Directions" link.
3. Layer chips to filter by place type. Nearest-first list or sheet.
4. Place detail sheet: name, type, status badge, confirm/report counts, directions link.
5. Login (Cognito) shown only when the user taps Add / Confirm / Report.
6. Add a place: choose location (tap map or "use my location"), type, name, optional note.
7. Confirm / Report a place. One vote per user per place. Creator cannot vote on their own place.
8. Trust status derived from counts (section 8).
9. Seed script that loads OSM data plus hand-entered points into DynamoDB.
10. Deployed on AWS (backend and hosting), public HTTPS URL.
11. Need-based home screen with three primary choices; item search remains available without being mandatory.
12. English, Bengali and Hindi for navigation, item choices, tips, status labels, forms, authentication prompts and loading/error/empty states. A visible language switcher uses native names and remembers the choice on the device.

### Should have (only if Must is done and working)
- Duplicate guard: reject adding the same type within ~20 m of an existing place (return the existing place).
- "Not sure?" fallback screen for unmatched items showing the category chips.

### Cut list (do NOT build)
Photo recognition, AI/LLM calls, leaderboards, badges, points, multi-city support, native app, push notifications, admin dashboard, comments/ratings, offline mode. If time runs short, cut in this order: Should-haves, toilet layer, then simplify auth (see 12.3).

---

## 5. Architecture

```
Browser (React + Vite + Leaflet)
   |  HTTPS
   +--> AWS Amplify Hosting (static site)
   +--> API Gateway (HTTP API, JWT authorizer = Cognito)
            +--> Lambda (Node.js, 3-4 small handlers)
                    +--> DynamoDB (Places, Votes)
Cognito User Pool (email + password) <-- aws-amplify (client auth)
```

- **Region:** `ap-south-1` (Mumbai) by default. Confirm all services used are available there.
- **IaC:** AWS SAM (`template.yaml`) so everything is reproducible with `sam build && sam deploy`.
- **Lambda runtime:** a currently supported Node.js runtime (use `nodejs22.x` unless the console/SAM says otherwise). Plain ESM JavaScript with AWS SDK v3 (provided by the runtime), so no bundling step.
- **Single area, no geo-queries:** because the dataset is a few hundred points for one area, `GET /places` returns **all places** for the area in one call. The client computes distances (haversine). Document in the README that scaling beyond one area would need geohash indexing or Amazon Location Service.
- **Map:** Leaflet + OSM tiles via `react-leaflet`. Use `circleMarker` or `divIcon` markers. This avoids Leaflet's default-icon asset bundling bug in Vite. Keep the OSM attribution visible ("OpenStreetMap contributors").

---

## 6. Repo layout

```
/
  README.md
  AGENTS.md              (copy section 0 here)
  template.yaml          (SAM: HttpApi, Lambdas, DynamoDB, Cognito)
  samconfig.toml
  data/
    area.json            (name, center, bbox, zoom)
    manual_places.json   (hand-entered places)
  scripts/
    fetch-osm.mjs        (Overpass -> data/osm_places.json)
    seed-dynamo.mjs      (merge osm + manual -> DynamoDB)
  backend/
    src/handlers/        (listPlaces, createPlace, vote)
    src/lib/             (db, validate, status, geo, response)
    tests/
  frontend/
    public/data/items.json
    src/                 (React app)
    .env.example
```

## 7. Configuration

The city is Kolkata. Codex selects a manageable pilot boundary using online maps and source coverage, documents the choice, and fills the center and bbox. English is the default UI locale (`en`); Bengali (`bn`) and Hindi (`hi`) are supported. Locale is a frontend preference and does not require an account.

`data/area.json` (fill from online map research):
```json
{
  "name": "<<AREA NAME>>",
  "center": { "lat": 0.0, "lng": 0.0 },
  "zoom": 15,
  "bbox": { "south": 0.0, "west": 0.0, "north": 0.0, "east": 0.0 }
}
```
`frontend/.env.example`:
```
VITE_API_URL=
VITE_AWS_REGION=ap-south-1
VITE_USER_POOL_ID=
VITE_USER_POOL_CLIENT_ID=
```

---

## 8. Data model

### Place types
`ewaste`, `recycling`, `dustbin`, `toilet`

### Table `Places`
| Attribute | Type | Notes |
|---|---|---|
| `area` (PK) | string | constant from area.json, e.g. `"default"` |
| `placeId` (SK) | string | uuid |
| `type` | string | one of the place types |
| `name` | string | 1-80 chars |
| `lat`, `lng` | number | must be inside the bbox |
| `note` | string | optional, max 200 |
| `source` | string | `osm` / `manual` / `user` |
| `createdBy` | string | Cognito `sub`, or `seed` |
| `createdAt` | string | ISO time |
| `confirmCount` | number | all places start at 0; count only real independent user confirmations |
| `reportCount` | number | start at 0 |

**Status is derived, never stored**, by one pure function `computeStatus({confirmCount, reportCount})`:
- `verified` if `confirmCount >= 2` and `confirmCount > reportCount`
- `reported` if `reportCount >= 2` and `reportCount >= confirmCount`
- otherwise `unverified`

User-created places start at 0/0, so `unverified`. This avoids race conditions on status updates. Write unit tests for every branch.

Imported and manually entered places also start at 0/0. Display source separately from community status; locally checked evidence belongs in the note. Present `verified` as "Community confirmed" in the UI, not as proof of regulatory authorisation. Do not manufacture votes for seed data.

### Table `Votes`
| Attribute | Type | Notes |
|---|---|---|
| `placeId` (PK) | string | |
| `userId` (SK) | string | Cognito `sub` |
| `voteType` | string | `confirm` or `report` |
| `reason` | string | optional, for reports |
| `createdAt` | string | |

Voting uses a DynamoDB **TransactWriteItems**: (1) Put into `Votes` with `attribute_not_exists(userId)` (one vote per user per place), (2) Update `Places` with `ADD confirmCount 1` or `ADD reportCount 1`. If condition 1 fails, return 409 "already voted". Reject with 403 if `userId == place.createdBy`.

### Items file (static, not in DB)
`frontend/public/data/items.json`. See Appendix A. Each item: `id`, `name`, `aliases[]`, `category`, `placeTypes[]` (ordered by preference), `tip`.

Category to destination mapping:
- `ewaste` -> place type `ewaste`
- `dry` -> `recycling`, fallback `dustbin`
- `wet` -> `dustbin`
- `sanitary_medical`, `hazardous` -> no public place type; show the tip only ("ask your local municipal collector / pharmacy")

---

## 9. API (HTTP API)

| Method + path | Auth | Body | Result |
|---|---|---|---|
| `GET /places` | none | - | `200` array of places, each with computed `status` |
| `POST /places` | JWT | `{type,name,lat,lng,note?}` | `201` created place, or `409` duplicate (Should-have) |
| `POST /places/{id}/confirm` | JWT | - | `200` updated place, `409` already voted, `403` own place |
| `POST /places/{id}/report` | JWT | `{reason?}` | same as confirm |

Rules: validate every field (type whitelist, lengths, finite numbers, point inside bbox), return JSON with consistent `{error}` shape, CORS limited to the Amplify domain and `http://localhost:5173`. Set API throttling (e.g. burst 40, rate 20 req/s) so a public endpoint cannot burn credits. Use the JWT `sub` claim as `userId`. Never return `createdBy`.

---

## 10. Frontend UX (mobile-first, single page)

- **Home:** three large choices: "Find a toilet", "Find a bin or collection point", "Give away old electronics". Optional item search and familiar item buttons such as Charger, Old phone and Plastic bottle. No login required.
- **Language:** English / বাংলা / हिन्दी switcher visible from the home screen and results. Persist the selection in localStorage, update the page `lang`, and preserve the current query, selected place and map position when switching. Use dictionaries for `en`, `bn`, `hi` with English fallback; no translation service or additional package. Local reviewers should check Bengali and Hindi wording before submission.
- **Results:** nearest-first list with name, type, distance, community status, source and directions; map available alongside or behind the sheet. If location is unavailable, say "Distance from area centre" rather than claiming distance from the user. Reported places are excluded from automatic recommendations but remain visible in browsing with their status.
- **Facility notes:** include locally checked landmarks, public access and accepted items in the existing note field. Unknown details stay unknown; never label a toilet "open now" or a point "authorised" without evidence. Recommend demo e-waste destinations only after confirming they accept the demonstrated item.
- **Filters:** layer chips: E-waste, Recycling, Bins, Toilets.
- **Middle:** full-height map, the user's location dot (if permitted), markers coloured by type; unverified markers hollow or dashed, reported markers greyed.
- **Bottom sheet:** shows either the **item result card** or the **place detail**.
  - Result card: item name, category badge, tip, then "Nearest: <name> (<distance>)" with a Directions button. If no place of that type exists: "No place found nearby. Add one."
  - Place detail: name, type, status badge (Verified / Unverified / Reported), counts, [Confirm] [Report] [Directions].
- **Floating "+ Add place" button:** opens login if signed out, then a flow: pick location (tap on map or "use my location"), type, name, note, submit.
- **Directions link:** `https://www.google.com/maps/dir/?api=1&destination=<lat>,<lng>` (opens the user's maps app; no routing code needed).
- **Search:** `fuse.js` over `items.json` (`name`, `aliases`), threshold about 0.35. No match leads to a "Not sure?" screen with category chips.
- **Translated items:** keep the existing English fields and add `translations.bn` and `translations.hi`, each with `name`, `aliases` and `tip`. Search names and aliases in all three languages regardless of the selected UI language, including curated Roman-script aliases. Categories and `placeTypes` stay stable IDs. User-entered names and notes retain their original text; do not invent translations. OSM basemap labels follow the tile source and are not translated by the app.
- **Accessibility:** pair icons with text, show status using words as well as colour, allow Bengali/Hindi text to wrap, and keep touch targets at least 44px. Check all three locales at 360px width.
- **Geolocation** needs HTTPS (Amplify gives it). If denied, center the map on `area.center`.
- Login UI: `@aws-amplify/ui-react` `Authenticator` in a modal, only when needed. Send the **ID token** in the `Authorization` header (confirm in testing that the API Gateway JWT authorizer accepts it; if not, use the access token).

---

## 11. Build and deploy order

### Human-only tasks (Codex cannot do these)
1. Verify student status on AWS Builder Center; check in on the hackathon page; re-read the submission requirements and deadline hour.
2. Create/log into the AWS account, set a **budget alert** (AWS Budgets), and configure the AWS CLI + SAM CLI locally.
3. Codex selects the Kolkata pilot area using online maps and published facility coverage and fills `data/area.json` (center + bbox).
4. Codex researches published e-waste or recycling points for `data/manual_places.json`. Retain source URL, source date where available, research date and unresolved acceptance/access questions in an accompanying `data/sources.json`. Do not treat a recycler registration or a service-centre listing alone as proof of public drop-off access. If no suitable destination is evidenced, show the honest no-destination state.
5. Connect the GitHub repo to **Amplify Hosting** in the console (frontend deploy) and set the `VITE_*` env vars there.
6. Create 3 demo user accounts in advance (for showing confirm/verify in the video).
7. Review `items.json` tips against your local rules. I drafted them as safe, generic guidance; they must be checked locally.

### Saturday Oct 10 (today): working, deployed app by tonight
| Block | Task | Output |
|---|---|---|
| A (45 min) | Human tasks 1-4, then scaffold repo | `area.json`, repo, `AGENTS.md` |
| B (90 min) | SAM template + DynamoDB + `GET /places` + status/validate libs with tests; deploy | live `GET /places` |
| C (45 min) | `fetch-osm.mjs`, `seed-dynamo.mjs`; run seeds | seeded data returned by the live API |
| D (120 min) | Frontend: map, markers, layer chips, place sheet, item search, result card | local app on live API |
| E (90 min) | Cognito + login modal + add/confirm/report endpoints and UI | full contribution loop |
| F (45 min) | Deploy frontend to Amplify; test on a real phone, outdoors if possible | public URL |
| G (30 min) | Ask someone who has never seen it to use it unaided; fix the top 2 issues | notes |

**Definition of done for today:** a stranger can open the URL on their phone, search "charger", see the nearest e-waste point, and add a place after logging in.

### Sunday Oct 11: finish and submit
- Morning: freeze features by ~10:00. Record the demo video, write the README, publish the Builder Center blog post, submit well before the deadline hour. Browser/device emulation and remote usability checks replace field visits; do not claim in-person validation or measured environmental impact.

### Online data research policy
- Start with KMC facility publications, OpenStreetMap and operator-published collection information. Keep provenance and dates; do not assume all online data is current.
- KMC's published [pay-and-use toilet list](https://www.kmcgov.in/KMCPortal/downloads/pay_toilets_05_11_2015.pdf) dates to 2015. It is a historical candidate source, not evidence of current opening hours or availability.
- [Samsung's collection programme](https://www.samsung.com/in/care-for-clean-india/) is a starting point for operator research; individual locations and accepted products still require published evidence.
- [WBPCB's recycler list](https://www.wbpcb.gov.in/files/Mo-03-2025-03-57-02list%20of%20E%20Waste%20recyclers.pdf) provides registration leads, not automatic public drop-off destinations.
- Source-backed, community-confirmed and field-checked are different claims. This pilot has no field checks. Use the existing note and source display to explain uncertainty, including stale listings; never infer "open now", cleanliness, fees or public access.

---

## 12. Details and risks

### 12.1 OSM seed data
`scripts/fetch-osm.mjs` queries Overpass (`https://overpass-api.de/api/interpreter`) for the bbox (**order: south, west, north, east**):
```
[out:json][timeout:25];
(
  nwr["amenity"="toilets"]({{bbox}});
  nwr["amenity"="waste_basket"]({{bbox}});
  nwr["amenity"="recycling"]({{bbox}});
);
out center;
```
Map tags to types: `toilets` to `toilet`, `waste_basket` to `dustbin`, `recycling` to `recycling` (verify tag usage on the OSM wiki). Use `center` coordinates for ways. Name fallback: "Public toilet", "Dustbin", "Recycling point". OSM data is ODbL, so show attribution in the app and README. **If OSM returns little for the area, that is expected: hand-add 30-40 points in `manual_places.json` rather than widening the area.**

### 12.2 Cost and abuse safety
DynamoDB on-demand, HTTP API throttling, a Cognito email-verification flow, budget alert set, no unauthenticated writes.

### 12.3 If auth eats too much time
Fallback: keep Cognito but add a PreSignUp Lambda that auto-confirms users (removes the email-code step), or as a last resort use a per-device random ID plus throttling for votes. If you use a fallback, say so honestly in the demo.

### 12.4 Known limitations to state in the README
Single-area, full-dataset fetch; trust model is simple confirm/report (no moderation); tips are generic guidance and must be checked against local rules; OSM and user data may be incomplete.

---

## 13. Acceptance checklist
- [ ] `GET /places` returns seeded places with computed `status`
- [ ] Item search finds "charger", "batteri" (typo), and "plastic bottle"
- [ ] Result card shows the nearest correct place with distance and a working Directions link
- [ ] Signed-out user can browse/search but is prompted to log in on Add/Confirm/Report
- [ ] Adding a place creates an `unverified` place
- [ ] Two **different** users confirming flips it to `verified`; the same user cannot vote twice; the creator cannot vote
- [ ] Reports flip a place to `reported` only when there are at least two reports and reports equal or exceed confirmations; reported places are not automatic destinations
- [ ] All three home choices work without typing an item or signing in
- [ ] Switching English / বাংলা / हिन्दी preserves the current task and survives reload; translated item names and curated aliases find the same item IDs
- [ ] Main flows and loading/error/empty states are usable at 360px in all three languages
- [ ] Invalid input (bad type, out-of-area coordinates, 5,000-char name) is rejected with a clear error
- [ ] Works on a real phone over HTTPS; unit tests pass for `computeStatus`, validation, and haversine
- [ ] README has setup, architecture diagram, limitations, OSM attribution

## 14. Demo video outline (3 min)
- 0:00-0:30: you're outside holding a dead battery, no idea where it goes
- 0:30-1:15: search it, see the category, the tip, the nearest correct place; tap Directions
- 1:15-1:45: switch to toilets and bins layers
- 1:45-2:20: log in, add a missing place, then show two other accounts confirming it turning Verified
- 2:20-2:45: architecture slide (where AWS fits: Amplify, API Gateway, Lambda, DynamoDB, Cognito)
- 2:45-3:00: who it's for, what's next (more areas, moderators, photo recognition)

---

## 15. Copy-paste prompts for Codex (run in order)

1. **Scaffold + backend:** "Read PRD sections 0, 5-9. Create the repo layout from section 6. Write `template.yaml` (SAM) with an HttpApi with CORS and throttling, a DynamoDB `Places` table and `Votes` table (on-demand), a Cognito user pool and SPA app client, and a JWT authorizer. Implement `listPlaces` (`GET /places`) and the libs `status`, `validate`, `geo`, `response`, with unit tests. Don't implement create or vote yet. Tell me the exact commands to build, test and deploy."
2. **Seed:** "Implement `scripts/fetch-osm.mjs` and `scripts/seed-dynamo.mjs` per section 12.1 and the data model. Seeded places have `confirmCount = 0`, `reportCount = 0`, `createdBy = 'seed'`. Make the script idempotent. Tell me how to run it against the deployed table."
3. **Frontend map + search:** "Create the Vite + React + TypeScript app in `frontend/`. Implement section 10: map, markers, layer chips, place sheet, item search with fuse.js over `public/data/items.json`, result card with nearest place and the Directions link. Read from `VITE_API_URL`. Mobile-first."
4. **Write endpoints:** "Implement `createPlace` and `vote` handlers per sections 8-9, including the TransactWriteItems vote logic, the creator-cannot-vote rule, and bbox validation. Add tests for the vote rules (mock DynamoDB)."
5. **Auth + contribution UI:** "Add Amplify auth with the Authenticator modal, shown only on Add / Confirm / Report. Build the Add-place flow (tap-to-pin or my-location) and the Confirm/Report buttons. Send the ID token as the Authorization header."
6. **Polish + README:** "Write README per the acceptance checklist (setup, architecture, limitations, OSM attribution). Fix lint errors, add loading and error states, and make sure the app is usable at 360px width."

---

## Appendix A: starter `items.json` (tips are generic; VERIFY against your local rules)

Categories: `ewaste`, `dry`, `wet`, `sanitary_medical`, `hazardous`. Put this into `frontend/public/data/items.json` as an array.

```json
[
 {"id":"phone-charger","name":"Phone charger / adapter","aliases":["charger","adapter","charging adapter","purana charger"],"category":"ewaste","placeTypes":["ewaste"],"tip":"Electronic waste. Don't put it in a normal bin; take it to an e-waste point."},
 {"id":"usb-cable","name":"Charging / USB cable","aliases":["cable","wire","usb","data cable"],"category":"ewaste","placeTypes":["ewaste"],"tip":"E-waste. Hand it in at an e-waste point."},
 {"id":"old-phone","name":"Old mobile phone","aliases":["phone","mobile","smartphone","purana phone"],"category":"ewaste","placeTypes":["ewaste"],"tip":"Erase your data first, then hand it to an authorised e-waste collector."},
 {"id":"earphones","name":"Earphones / headphones","aliases":["earbuds","headset","earphone"],"category":"ewaste","placeTypes":["ewaste"],"tip":"E-waste. Take it to an e-waste point."},
 {"id":"laptop","name":"Laptop","aliases":["notebook computer","old laptop"],"category":"ewaste","placeTypes":["ewaste"],"tip":"Wipe your data, then use an authorised e-waste collector."},
 {"id":"keyboard-mouse","name":"Keyboard / mouse","aliases":["mouse","keyboard","computer accessories"],"category":"ewaste","placeTypes":["ewaste"],"tip":"E-waste. Take it to an e-waste point."},
 {"id":"power-bank","name":"Power bank","aliases":["powerbank","portable charger"],"category":"ewaste","placeTypes":["ewaste"],"tip":"Contains a lithium battery. Don't crush or puncture it; hand it in at an e-waste point."},
 {"id":"aa-battery","name":"AA / AAA battery","aliases":["battery","batteries","cell","dry cell","purani battery"],"category":"ewaste","placeTypes":["ewaste"],"tip":"Never put in a normal bin. Take used batteries to an e-waste or battery collection point."},
 {"id":"phone-battery","name":"Phone / lithium battery","aliases":["li-ion battery","lithium cell","swollen battery"],"category":"ewaste","placeTypes":["ewaste"],"tip":"Fire risk if damaged. Keep it away from heat and hand it in at an e-waste point."},
 {"id":"cfl-tube","name":"CFL / tube light","aliases":["tubelight","fluorescent","cfl bulb"],"category":"ewaste","placeTypes":["ewaste"],"tip":"Contains mercury. Don't break it; take it to an e-waste point."},
 {"id":"led-bulb","name":"LED bulb","aliases":["bulb","led","light bulb","bijli bulb"],"category":"ewaste","placeTypes":["ewaste"],"tip":"E-waste. Hand it in at an e-waste point."},
 {"id":"extension-board","name":"Extension board / electrical wires","aliases":["extension","power strip","wires","cord"],"category":"ewaste","placeTypes":["ewaste"],"tip":"E-waste. Take it to an e-waste point."},
 {"id":"remote","name":"Remote control","aliases":["tv remote","ac remote"],"category":"ewaste","placeTypes":["ewaste"],"tip":"Remove the batteries and take both to an e-waste point."},
 {"id":"printer-cartridge","name":"Printer cartridge","aliases":["ink cartridge","toner"],"category":"ewaste","placeTypes":["ewaste"],"tip":"Many shops and e-waste collectors take these back."},
 {"id":"plastic-bottle","name":"Plastic bottle","aliases":["pet bottle","water bottle","bottle"],"category":"dry","placeTypes":["recycling","dustbin"],"tip":"Empty and rinse if you can. Put in dry waste or a recycling point."},
 {"id":"plastic-wrapper","name":"Plastic wrapper / chips packet","aliases":["wrapper","packet","chips packet","plastic bag","polythene"],"category":"dry","placeTypes":["dustbin","recycling"],"tip":"Dry waste. Don't litter; use a dustbin."},
 {"id":"paper","name":"Paper / newspaper","aliases":["newspaper","notebook paper","kagaz","raddi"],"category":"dry","placeTypes":["recycling","dustbin"],"tip":"Keep it clean and dry; recyclable."},
 {"id":"cardboard","name":"Cardboard box","aliases":["carton","box","gatta"],"category":"dry","placeTypes":["recycling","dustbin"],"tip":"Flatten it and keep it dry for recycling."},
 {"id":"glass-bottle","name":"Glass bottle","aliases":["glass","jar","kaanch"],"category":"dry","placeTypes":["recycling","dustbin"],"tip":"Wrap broken glass in paper and label it so handlers are safe."},
 {"id":"metal-can","name":"Metal can / tin","aliases":["tin","can","steel can","soft drink can"],"category":"dry","placeTypes":["recycling","dustbin"],"tip":"Rinse it and put it in dry waste or a recycling point."},
 {"id":"food-scraps","name":"Food scraps / leftovers","aliases":["leftover food","khana","food waste","wet waste"],"category":"wet","placeTypes":["dustbin"],"tip":"Wet waste. Use a wet or general bin; composting is best if available."},
 {"id":"fruit-peels","name":"Fruit / vegetable peels","aliases":["peels","chilka","vegetable waste","banana peel"],"category":"wet","placeTypes":["dustbin"],"tip":"Wet waste, which is good for composting."},
 {"id":"tea-coffee","name":"Tea bags / coffee grounds","aliases":["tea leaves","chai patti","coffee"],"category":"wet","placeTypes":["dustbin"],"tip":"Wet waste, which is good for composting."},
 {"id":"garden-leaves","name":"Flowers / garden leaves","aliases":["leaves","flowers","garden waste","puja flowers"],"category":"wet","placeTypes":["dustbin"],"tip":"Wet waste or compost."},
 {"id":"sanitary-pad","name":"Sanitary pad / diaper","aliases":["pad","diaper","napkin","tampon"],"category":"sanitary_medical","placeTypes":[],"tip":"Wrap it in paper and mark it so handlers can identify it. Don't flush it."},
 {"id":"mask-bandage","name":"Used mask / bandage","aliases":["mask","bandage","cotton","gauze"],"category":"sanitary_medical","placeTypes":[],"tip":"Wrap it before disposal. Use the sanitary waste stream where your area has one."},
 {"id":"expired-medicine","name":"Expired medicine","aliases":["medicine","tablets","dawai","syrup"],"category":"sanitary_medical","placeTypes":[],"tip":"Don't flush or throw loose. Ask a pharmacy or hospital about take-back."},
 {"id":"paint-can","name":"Paint can","aliases":["paint","varnish","thinner"],"category":"hazardous","placeTypes":[],"tip":"Hazardous. Don't pour it down a drain; ask your municipal body about hazardous waste."},
 {"id":"aerosol","name":"Aerosol / spray can","aliases":["spray","deodorant can","insect spray"],"category":"hazardous","placeTypes":[],"tip":"Hazardous when pressurised. Don't puncture or burn; ask about hazardous waste collection."},
 {"id":"chemical-bottle","name":"Pesticide / chemical bottle","aliases":["pesticide","chemical","cleaner bottle","acid"],"category":"hazardous","placeTypes":[],"tip":"Hazardous. Don't reuse the bottle; ask your municipal body about hazardous waste."}
]
```

