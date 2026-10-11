# Environmental Hacks submission preparation

Checked against the [official rules](https://www.wemakedevs.org/aws/env/rules), [schedule](https://www.wemakedevs.org/aws/env/schedule) and loaded [submission form](https://www.wemakedevs.org/aws/env/submit) on **11 October 2026**. The event runs 8–11 October; Sunday 11 October is submission day. The form is available. Neither the checked schedule nor the loaded form gives an exact deadline hour. Check organiser announcements; do not assume midnight.

The rules require a public repository, a YouTube demo under three minutes (public or unlisted), and a short writeup covering the problem, build and AWS use. They say there is no live demo or call, judges assess submitted material, and the video must show AWS. AI coding tools must be listed in the writeup. AWS Builder Center publication is encouraged on the event overview and is required for the blog-prize entry.

## Before submission

- [ ] Confirm registration/check-in and student-verification status on the event account.
- [ ] Complete independent live confirmations, duplicate rejection and reporting checks with real accounts; the current evidence only proves this lifecycle locally, plus live create and creator rejection.
- [ ] Check the HTTPS app on a real phone and review Bengali/Hindi text if a reviewer is available. Record actual limits if these checks cannot be completed.
- [ ] Record the final video under three minutes, showing the running app and actual AWS architecture/resources without private account details or credentials.
- [ ] Upload to YouTube as public or unlisted and verify access while signed out.
- [ ] Finish the writeup: problem, one-area solution, source coverage, AWS use, actual verification, limitations and AI-tool disclosure (Codex was used).
- [ ] Prepare the form's account/profile links, contributor roles and both AWS feedback answers. A deployed URL and blog links are optional; a resume is requested for interview consideration, not as a required project field. Keep personal profile/resume information out of this public repository.
- [ ] Verify the repository is public and link the exact submitted commit. Preserve original development history.
- [ ] Add the final video/writeup links to README; do not insert placeholders as if published.
- [ ] Submit once per team through the event's official form before its stated deadline and retain the receipt.

## Recording outline

Aim for **2 minutes 50 seconds**, leaving room under the limit. Lead with waste disposal, the track's core problem; toilets are a supporting everyday-use feature.

| Time | Show | Explain |
|---|---|---|
| 0:00–0:20 | Start, then an old-charger search | A generic bin is not a suitable destination for every item. This is a Central Kolkata pilot. |
| 0:20–0:55 | Croma result, acceptance note, source, distance and Directions | An item needs an acceptance-matching place; the source and uncertainty are visible before travel. |
| 0:55–1:15 | Bengali/Hindi, List/Map, one toilet lookup | The task survives language changes; the same map supports neighbourhood needs. |
| 1:15–1:30 | A battery search with no suitable destination | Missing evidence produces an honest empty state, not an invented recommendation. |
| 1:30–2:00 | Sign-in gate and contribution actions | Explain the creator and duplicate restrictions. Demonstrate independent votes only if actually tested, or clearly label a separate local simulation. |
| 2:00–2:35 | Actual Amplify deployment, API/Lambda resources, DynamoDB tables and Cognito | Show AWS running the app and contribution backend. Explain the unique vote/counter transaction. Hide private account details and credentials. |
| 2:35–2:50 | Closing view | 31 online-sourced listings, no field checks or measured outcomes; next work is acceptance evidence and moderation. |

Use a charger for the demonstrated destination, not a battery: specialist battery acceptance has not been established. State that the expanded pilot has 31 online-sourced listings: 26 toilet records, two waste points, two e-waste listings and one recycling-service office. Three uncertain listings are browse-only, not automatic recommendations. There are no field checks or measured disposal outcomes; counts describe listings, not independently verified public facilities.

## Project-answer drafts

These drafts describe the current project. Review them alongside the final video; do not claim features that the video does not demonstrate. Enter your own contributor roles and personal account links.

**Project title:** Kahaan — find the right place for everyday waste

**Track:** Waste and Energy

**Repository:** https://github.com/sayan365/kahaan

**Deployed app:** https://demo.dato5zt1h00lk.amplifyapp.com

### What does your project do?

Kahaan helps people in Central Kolkata find a suitable destination for everyday waste and old electronics, alongside nearby toilets and bins. Users search an item such as a charger, read disposal guidance, inspect a source-backed location and open directions. English, Bengali and Hindi interfaces preserve the current task when switching languages. Browsing is open; signed-in users can add, confirm or report places.

The pilot contains 31 online-sourced listings and 30 searchable items. Acceptance-specific matching excludes unsuitable or reported locations. Where evidence is missing, such as specialist battery acceptance, Kahaan shows no suitable destination. Source records start with zero votes. Community confirmation is not regulatory authorisation. We have not performed field checks or measured environmental outcomes; better disposal decisions are the intended benefit, not a proven result.

Codex assisted coding, research and interface refinement. OpenStreetMap and operator sources retain attribution and their applicable licences.

### How did you use AWS?

Amplify Hosting serves the React app over HTTPS. Cognito provides email-based sign-in. API Gateway exposes anonymous reads and JWT-protected contribution routes, with request throttling. Lambda validates submitted data against the Kolkata boundary and enforces contribution rules. DynamoDB stores places and votes: a conditional transaction creates a unique account/place vote and updates its counter together, preventing duplicate count increments and creator votes. CloudWatch retains backend logs for seven days; an AWS Budgets notification helps monitor usage but is not a spending cap.

The backend is described in an AWS SAM template and uses the AWS SDK for JavaScript. The original deployment runs in ap-south-1. Local evaluation uses an explicitly labelled simulation and requires no AWS account. Automated rules and transaction checks pass; live creation and creator rejection were tested, while successful independent live voting remains outstanding. CLI SAM validation has not been run in this environment.

### AWS feedback: starting points to personalize

- **What worked:** DynamoDB conditional transactions express the vote/counter invariant in one write operation. API Gateway's JWT authorizer keeps authentication enforcement on the write routes. SAM records the backend resource relationships and outputs in the repository.
- **What could improve:** In this build, account verification made CloudShell unavailable, so deployment and seeding relied on console workflows. Manual deployment required checking the frontend origin, Cognito identifiers and API configuration across services. A clearer guided path for a small static app with authenticated writes would reduce setup friction.

Use feedback you can explain from your own experience. Do not imply that the CLI deployment path or independent cloud voting was tested if it was not. Blog publication, YouTube upload and form submission have not been completed by this repository update.

## Hosting during judging

Keep the demo available through judging if the owner chooses to retain and monitor it. The published rules emphasise the recorded video and do not state a requirement to keep a demo URL running until results; organisers may add instructions in the submission form. Save the video, public source and verification evidence before shutting down.

Inspect AWS Credits, Bills and Budgets regularly while hosting. The existing $1 notification is not a hard cap, and its credit-exclusion filter remains pending. No automatic shutdown is scheduled. [AWS-DEMO.md](AWS-DEMO.md) records resources, costs and reversible pause/permanent removal steps. If the hosted demo is retired, mark that clearly beside its README link; the local setup remains available without that deployment.
