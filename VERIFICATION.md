# Verification evidence

Date: 2026-10-10. Environment: Windows, Node 24.14.0.

- Final commands passed: `npm test` (14 tests), `npm run typecheck`, `npm run build`, strict premium UI audit and DESIGN.md lint (zero errors).
- Core unit tests: status thresholds/ties, malformed inputs, boundary coordinates, haversine known distance/antipodes, safe recommendation exclusions and no creator identity in public output.
- Service tests: authenticated create, creator rejection, independent confirmations, duplicate vote rejection, report status, missing-place errors.
- DynamoDB mock checks: unique vote and counter increment share one transaction; creator guard remains on the update; conflict reasons map to 409; infrastructure failures propagate; queries read all pages.
- Catalog/data checks: charger/চার্জার/चार्जर, batteri and plastic bottle resolve stable IDs; all items have Bengali/Hindi guidance; seeds validate and have zero votes.
- Chrome browser: real local API, initial browse without login; charger directs to operator-sourced Croma coordinates; 360px Bengali/Hindi switching preserves query; Bengali content width 350px in a 360px viewport, with no horizontal overflow.
- Contribution browser flow: sign-in requested on Add; invalid 0/0 coordinates rejected while preserving name; corrected coordinates save an unverified demo place; creator cannot confirm; Rahul's confirmation leaves one vote; duplicate confirmation rejected; Mira's second independent confirmation produces Community confirmed. Duplicate report rejection preserves entered reason and keeps report dialog open.
- Browser recovery: unmatched item shows category choices; empty Bins filter offers Add; mobile map renders at 312px wide and 420px tall. Chrome captured no error logs in the checked workflow. Temporary viewport override was reset.
- Strict premium static audit: zero findings. DESIGN.md lint: zero errors; some unused component-token warnings are documentation-only.

All local browser identities were explicitly simulations. Test place named “Demo collection point — not a real facility” was removed after testing along with its votes, preserving other local data; no synthetic facility is part of shipped seed data. No field checks, physical-device test or native-language review was performed.

## Live AWS checks

- CloudFormation successfully transformed the SAM template into 13 resources and created stack `kahaan` after the owner's IAM approval. Its later origin-only update affected the HTTP API without replacement and reached `UPDATE_COMPLETE`.
- Internal seed invocation succeeded: inserted 19 of 19 locations, 810.50 ms execution. The runtime handler was restored to `src/handlers/api.handler` and verified in the console.
- Public API GET returned HTTP 200 and 19 records, all with zero votes, with no creator identity exposed. Its allowed CORS origin matches `https://demo.dato5zt1h00lk.amplifyapp.com`. Unauthenticated POST returned 401.
- The connected production build passed and Amplify's `demo` branch deployed. Chrome loaded 19 live places; charger search selected Croma's sourced Park Street coordinates; Bengali and Hindi switching preserved the query and displayed localized disposal guidance. No error logs appeared in the checked live flow.
- The owner completed live account creation/email verification and signed in. Authenticated create through the browser succeeded and persisted a clearly labeled temporary QA place in DynamoDB. The creator's confirmation was rejected with the expected message; both counters remained zero. Cleanup of this single test record awaits the owner's irreversible-delete confirmation. Successful independent cloud voting still needs a second account; the local simulation checks do not prove that cloud path.
- Budget notification email is verified. Credit exclusion remains pending billing data availability. CloudShell remains unavailable during account verification. Local AWS CLI/SAM CLI are absent, so no CLI SAM validation is claimed.
- The original `main` branch retains an older unconfigured build and pending manual-upload jobs after failed file transfers. Use the `demo` URL. Both branches belong to the same Amplify app and are removed together during shutdown.

Demo cost preparation: API throttle lowered to 5 req/s, burst 10; stack-managed Lambda logs retain seven days. Pause/removal PowerShell script parses and both -WhatIf modes were exercised with stubbed read-only AWS responses; no AWS mutations occurred in those dry runs. Portable Lambda archive inspected: exactly the selected runtime files, no credentials or local state. Console seed tests cover zero initial votes, repeat-run preservation and infrastructure errors. These are local checks, not live shutdown or SAM validation.
