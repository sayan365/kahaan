# Kahaan interface review and polish — 11 October 2026

## Findings

The original desktop and 390px mobile screens were inspected in Chrome. All journeys shared a long page: introduction, three equal cards, search, answer, filters, list/map and repeated contribution prompts. On mobile, actual results started below the first screen. There was no navigation to distinguish discovering a place from learning about the project. Small list metadata and a default font stack made the experience feel unfinished. The local development catalogue was an older persisted snapshot, so its count was not evidence of current cloud coverage.

## Direction

Modern minimalist wayfinding: self-hosted Manrope, charcoal text, quiet neutral surfaces and one deep green accent. Real Kolkata map data supplies context; no decorative city illustration, fabricated impact counters, facility photographs or invented opening hours. Existing type colours retain their meaning. Navigation and typography provide hierarchy before borders and cards.

## Planned journeys

- **Start:** a concise purpose, three need choices, optional item search and a real pilot map preview. A need or submitted query opens Nearby.
- **Nearby:** dedicated search, item guidance, nearest-first results, visible source/trust information and a companion map. Mobile keeps list/map controls readily available.
- **How it works:** explain the bounded pilot, source limitations, independent confirmations, reporting and adding a place. This moves explanatory content away from urgent discovery.
- **Place detail:** separate practical notes, source evidence and community checks; directions remain the primary action.
- **Contribution:** retain sign-in gating, use a wider map/form layout on desktop, clearly identify location and place details, and hide manual coordinates behind an optional disclosure.
- **Authentication/reporting:** shared visual language, visible errors, preserved values and keyboard dismissal/focus restoration.

Hash navigation avoids a routing dependency and works with static hosting. Search/filter URLs are restorable; back/forward return to the prior view. All owned labels support English, Bengali and Hindi. The existing API, data provenance, trust thresholds and AWS resources remain authoritative.

## References and interpretation

[Citymapper's user guide](https://content.citymapper.com/news/2958/a-guide-to-using-citymapper) demonstrates clear task entry points and nearby discovery. [Too Good To Go's official app explanation](https://www.toogoodtogo.com/en-us/how-does-the-app-work) distinguishes discovery from browsing the local map. Kahaan borrows this hierarchy, not their branding or additional product features. [Manrope](https://fonts.google.com/specimen/Manrope) is self-hosted with its SIL Open Font License.

## Verification

Implemented and deployed on 11 October. All 15 tests, TypeScript and the release build passed; the strict UI audit found no issues. Design-document lint had no errors and five unused-token warnings. Desktop and 360px layouts were inspected, including all three locales, browser history/refresh, mobile map switching, an empty battery result, details and contribution validation. The live release loaded 31 source records and the relevant charger result without warning/error logs. See [verification evidence](VERIFICATION.md) for remaining limits.

Check desktop and 360–390px mobile Start/Nearby/Guide, all three locales, filtered/empty/error results, item guidance, place detail, auth cancellation, add validation, report errors and browser back/forward. Run repository tests, TypeScript, build, design-context lint and the strict UI audit. Local simulated writes do not establish independent cloud voting or field verification.

## Map-first Nearby revision
The owner supplied [Bangalore Startup Map](https://www.bangalorestartupmap.com/) as a live browser reference and approved this direction. Nearby now has a full viewport map, floating search and type controls, compact nearest-first results and separate modeless details. The reference mobile Map and Grid modes were also inspected. Mobile List now shows full-page single-column cards; Map restores the map with compact results. Card selection returns to Map with details. Existing provenance, trust rules, item guidance and contribution gating remain. Start and How it works retain their document layouts.

Final map revision: all 18 tests, TypeScript and production build passed. Strict UI audit: zero findings. Design-document lint: zero errors, five existing unused-token warnings. Browser verification and remaining limits are recorded in VERIFICATION.md.
