# Kahaan interaction contract

Public browsing needs no account. Create/confirm/report require Cognito JWTs in AWS. Local development has explicitly labelled demo users and server-issued temporary tokens; these are never accepted by the AWS handlers. One vote per account per place; creator cannot vote. No deletion or payments.

## Canonical UI Map
| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
|---|---|---|---|---|
| Select/Listbox | native select in Field | this contract | locale, place type | browser keyboard/popup |
| Form | Field and app form validation | shared/domain.mjs | create, auth, report | domain tests + browser |
| Scrollbar | frontend/src/styles.css | DESIGN.md | global | browser computed styles |
| Toast | app inline live status region | this contract | success, error | browser |
| CRUD | frontend/src/api.ts and backend/src/service.mjs | README.md + backend/src/lib/domain.mjs | create, confirm, report | service tests + browser |
| Dialog | frontend/src/components.tsx | this contract | auth, add, report; detail outside Nearby | Escape, focus restore |

## State and recovery
Pending writes disable submit and preserve form values. Failed writes stay in the dialog with an inline error; retry is explicit. Successful creation selects the new place and restores the list; successful votes refresh counts without navigation. API failure shows retry; no silent substitution of demo records. Public lists are bounded to the configured single area, sorted client-side, with a load-more button. Search is local and has no asynchronous request race. Choosing a category clears the item query and resets visible count so browsing is not hidden by a previous search.

Language persists locally; switching does not clear query, selection or map location. Start, Nearby and How it works are separate hash-routed views. Committed navigation creates a history entry; search/filter edits replace the current hash so back/forward and refresh restore the view, query and filter. Locale changes preserve that state and retain focus on the language selector. Screen navigation focuses the new heading. Typed input is never translated automatically. Distance is straight-line; default origin is area centre and is labelled. Location outside the pilot is not used for adding a place. Reported places are browsable but excluded from recommendations. Auth cancellation cancels the pending action.

No success or error is conveyed by colour alone. Dialog uses showModal with native focus containment, Escape dismissal and explicit focus restoration. Controls are semantic buttons/links; no browser alert/confirm/prompt. Language labels, form errors and accessibility text use the active locale. Local development explicitly discloses simulation; production with missing config disables contributions instead of substituting demo authentication.

## Presentation polish (11 October 2026)

Start prioritizes need choices; Nearby owns item guidance and results. Item-matched result lists show relevant accepted-item destinations instead of unrelated facilities. Unknown item input retains category fallback. How it works explains bounded sources and community trust without adding product capabilities. Source and unresolved access labels are visible in list rows. Place details separate practical notes, source and community checks. Contribution uses one shared responsive Dialog with desktop map/form columns; manual coordinates are an optional disclosure, automatically opened when coordinate validation requires focus.

## Map workspace
Nearby uses PlacePanel for modeless details. Opening focuses the heading; Escape and Close restore focus to the connected trigger when focus is inside the panel. Typing elsewhere does not steal focus on dismissal. Native auth/add/report dialogs remain modal and own Escape while open. Enter and Space select accessible type markers. Details retain source, uncertainty, directions and gated community actions. Mobile List shows a full-page single-column card surface and hides the map; Map restores the clear map canvas. The map stays mounted to preserve its state. Selecting a card returns to Map with details. Selecting a place opens the compact mobile detail panel. List uses document scrolling and unboxed results. Switching List/Map dismisses details and clears selection. Clicking outside details dismisses them unless a native dialog is open. Directions, Confirm and Report stay visible in a pinned footer; practical notes and source stay in the scrollable body, while community checks use a disclosure. Map retains attribution. Search/category changes close details and reset the visible count; locale changes retain query/selection and update marker labels.
