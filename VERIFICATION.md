# Verification evidence

Date: 2026-10-10. Environment: Windows, Node 24.14.0.

- Final commands passed: `npm test` (12 tests), `npm run typecheck`, `npm run build`, strict premium UI audit and DESIGN.md lint (zero errors).
- Core unit tests: status thresholds/ties, malformed inputs, boundary coordinates, haversine known distance/antipodes, safe recommendation exclusions and no creator identity in public output.
- Service tests: authenticated create, creator rejection, independent confirmations, duplicate vote rejection, report status, missing-place errors.
- DynamoDB mock checks: unique vote and counter increment share one transaction; creator guard remains on the update; conflict reasons map to 409; infrastructure failures propagate; queries read all pages.
- Catalog/data checks: charger/চার্জার/चार्जर, batteri and plastic bottle resolve stable IDs; all items have Bengali/Hindi guidance; seeds validate and have zero votes.
- Chrome browser: real local API, initial browse without login; charger directs to operator-sourced Croma coordinates; 360px Bengali/Hindi switching preserves query; Bengali content width 350px in a 360px viewport, with no horizontal overflow.
- Contribution browser flow: sign-in requested on Add; invalid 0/0 coordinates rejected while preserving name; corrected coordinates save an unverified demo place; creator cannot confirm; Rahul's confirmation leaves one vote; duplicate confirmation rejected; Mira's second independent confirmation produces Community confirmed. Duplicate report rejection preserves entered reason and keeps report dialog open.
- Browser recovery: unmatched item shows category choices; empty Bins filter offers Add; mobile map renders at 312px wide and 420px tall. Chrome captured no error logs in the checked workflow. Temporary viewport override was reset.
- Strict premium static audit: zero findings. DESIGN.md lint: zero errors; some unused component-token warnings are documentation-only.

All browser identities were explicitly local simulations. Test place named “Demo collection point — not a real facility” was removed after testing along with its votes, preserving other local data; no synthetic facility is part of shipped seed data. AWS SAM CLI and AWS CLI are absent locally. The signed-in browser was subsequently used to create a $1 notification-only budget and a private, empty deployment bucket. CloudShell is blocked by account verification; direct file upload is blocked by extension local-file access. The template and Cognito/DynamoDB cloud paths still require live deployment validation. No field checks, physical-device test or native-language review was performed.

Demo cost preparation: API throttle lowered to 5 req/s, burst 10; stack-managed Lambda logs retain seven days. Pause/removal PowerShell script parses and both -WhatIf modes were exercised with stubbed read-only AWS responses; no AWS mutations occurred in those dry runs. Portable Lambda archive inspected: exactly the selected runtime files, no credentials or local state. Console seed tests cover zero initial votes, repeat-run preservation and infrastructure errors. These are local checks, not live shutdown or SAM validation.
