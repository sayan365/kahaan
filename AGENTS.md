# Working on Kahaan

Read kahaan-prd.md, DESIGN.md and UX-CONTRACT.md before changes. Current user decisions take precedence: Kolkata pilot, English default, Bengali/Hindi support, online-only location research, open community contributions behind sign-in.

Build the smallest end-to-end MVP. Keep one repo and AWS region; ask before adding a dependency outside the PRD stack. Keep secrets in ignored env files, never in source or chat. data/area.json owns the pilot boundary; do not hardcode another area. Run node scripts/sync-data.mjs after data changes.

Keep status, validation and distance logic in backend/src/lib/domain.mjs with meaningful tests. All source records start at zero votes. Community confirmation is not regulatory authorisation. Preserve source URLs and uncertainty; never invent facilities, votes or impact statistics.

Run npm test, npm run typecheck and npm run build after implementation changes. SAM validation and live AWS acceptance are separate checks. Report actual results and limits. Missing AWS account/authentication must be resolved by the user locally; never request keys in chat. No human field visits are required for this pilot.
