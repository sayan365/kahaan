# Contributing to Kahaan

Start with [local setup](docs/SETUP.md), then read `AGENTS.md`, `kahaan-prd.md`, `DESIGN.md` and `UX-CONTRACT.md`. Keep the pilot to its configured Kolkata boundary and keep English, Bengali and Hindi main flows consistent.

For a missing place in the current live pilot, use Add a place after signing in. Confirm only places you have evidence for. Online sourcing and community confirmation are different from field checks or regulatory authorisation. Do not add fake facilities or vote on test records as if they were real.

For repository changes, fork the repository, create a branch and submit a pull request describing the problem, change and verification. Run from the root:

```sh
npm test
npm run typecheck
npm run build
```

Source data lives in `data/area.json`, `data/osm_places.json` and `data/manual_places.json`; provenance belongs in `data/sources.json`. Preserve stable IDs, source URLs, research dates and uncertainty. Run `node scripts/sync-data.mjs` after data edits. Imported places start with zero votes. Do not infer opening hours, fees, cleanliness, public access or accepted waste without evidence.

The item catalogue is `frontend/public/data/items.json`. Preserve item/category IDs, add Bengali/Hindi translations and useful aliases, and check safety guidance against published sources. User-entered names and notes stay in their original language. Never automatically route hazardous items to a generic bin.

Status, validation and distance rules belong in `backend/src/lib/domain.mjs`; write meaningful tests for changes to those rules. Shared UI primitives live in `frontend/src/components.tsx`; retain accessible labels, visible focus, 44px targets and loading/error recovery. Check all three locales at 360px width after UI changes.

Keep credentials, `.env` files, private AWS details and local test state out of commits. Use labelled local simulations for testing; do not expose the development API publicly. Report whether a check ran locally or against AWS.

The project currently has no explicit software licence. Resolve the intended licence with the owner before assuming permission for unrestricted reuse or redistribution; preserve third-party attribution in all cases.
