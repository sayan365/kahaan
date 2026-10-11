# Kahaan interaction contract

Public browsing needs no account. Create/confirm/report require Cognito JWTs in AWS. Local development has explicitly labelled demo users and server-issued temporary tokens; these are never accepted by the AWS handlers. One vote per account per place; creator cannot vote. No deletion or payments.

## Canonical UI Map
| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
|---|---|---|---|---|
| Select/Listbox | native select in Field | this contract | locale, place type | browser keyboard/popup |
| Form | Field and app form validation | shared/domain.mjs | create, auth, report | domain tests + browser |
| Scrollbar | frontend/src/styles.css | DESIGN.md | global | browser computed styles |
| Toast | app inline live status region | this contract | success, error | browser |
| CRUD | frontend/src/api.ts and backend/src/service.mjs | PRD + shared/domain.mjs | create, confirm, report | service tests + browser |
| Dialog | frontend/src/components.tsx | this contract | auth, add, report, detail | Escape, focus restore |

## State and recovery
Pending writes disable submit and preserve form values. Failed writes stay in the dialog with an inline error; retry is explicit. Successful creation selects the new place and restores the list; successful votes refresh counts without navigation. API failure shows retry; no silent substitution of demo records. Public lists are bounded to the configured single area, sorted client-side, with a load-more button. Search is local and has no asynchronous request race. Filter changes reset visible count.

Language persists locally; switching does not clear query, selection or map location. Start, Nearby and How it works are separate hash-routed views. Committed navigation creates a history entry; search/filter edits replace the current hash so back/forward and refresh restore the view, query and filter. Locale changes preserve that state and retain focus on the language selector. Screen navigation focuses the new heading. Typed input is never translated automatically. Distance is straight-line; default origin is area centre and is labelled. Location outside the pilot is not used for adding a place. Reported places are browsable but excluded from recommendations. Auth cancellation cancels the pending action.

No success or error is conveyed by colour alone. Dialog uses showModal with native focus containment, Escape dismissal and explicit focus restoration. Controls are semantic buttons/links; no browser alert/confirm/prompt. Language labels, form errors and accessibility text use the active locale. Local development explicitly discloses simulation; production with missing config disables contributions instead of substituting demo authentication.

## Presentation polish (11 October 2026)

Start prioritizes need choices; Nearby owns item guidance and results. Item-matched result lists show relevant accepted-item destinations instead of unrelated facilities. Unknown item input retains category fallback. How it works explains bounded sources and community trust without adding product capabilities. Source and unresolved access labels are visible in list rows. Place details separate practical notes, source and community checks. Contribution uses one shared responsive Dialog with desktop map/form columns; manual coordinates are an optional disclosure, automatically opened when coordinate validation requires focus.
