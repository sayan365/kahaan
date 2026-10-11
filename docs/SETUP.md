# Run your own Kahaan

## Local development: no AWS account required

Install Git and Node.js 24 or newer with npm. Node 24.14.0 was used for verification. Run from the repository root:

```sh
git clone https://github.com/sayan365/kahaan.git
cd kahaan
npm ci
npm test
npm run typecheck
npm run build
npm run dev
```

Open **http://127.0.0.1:5173**. The command starts both Vite and the local API on port 3001. Keep the terminal open; Ctrl+C stops both processes. No environment file, AWS key, Cognito account or live demo URL is needed for this path. Leave `VITE_API_URL` unset for local simulation.

The app shows a local demo banner. Add/Confirm/Report opens a chooser for Asha, Rahul and Mira, explicitly simulated contributors. Add a clearly labelled test place as Asha, sign out, confirm as Rahul, then sign out and confirm as Mira. The second independent confirmation produces Community confirmed. The creator and duplicate votes are rejected. This demonstrates application behaviour, not real AWS authentication.

Local places and votes persist in ignored `.local-data/state.json`; sessions expire when the API restarts. Startup merges missing source records and refreshes source metadata while preserving contributions, votes and counters. A fresh install includes all four place types. To deliberately reset only local demo data, stop the app, back up that file if needed, remove that file and restart. This does not change AWS data. Invalid/corrupt state fails visibly and is never silently discarded.

Internet is required for OpenStreetMap tiles and Google Maps directions. The item catalogue and initial location records are committed, so running locally does not fetch facilities from the retired hosted demo. This is not an offline product.

## Deploy to your own AWS account

The local demo server is for loopback development only. A public deployment uses the SAM backend and Cognito, not simulated identities.

1. Install the [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) and [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html) using official documentation. Sign in locally using your own AWS profile. Never put credentials into `VITE_*` variables or the repository. Check `aws sts get-caller-identity` privately to ensure you are using the intended account. Create a usage budget and inspect your account's credits and expiry before provisioning.
2. Fork this repository. Create an Amplify static hosting app connected to your fork, with app root `frontend` and the tracked root `amplify.yml`. The initial build can establish the HTTPS origin before backend configuration; contributions will not work until configuration is added. Do not enable SSR or paid add-ons for this demo. Record the exact branch origin, without a trailing slash.
3. From the repository root, deploy the backend. Replace the example origin with your own Amplify branch URL:

```sh
node scripts/sync-data.mjs
sam validate --lint
sam build
sam deploy --guided --region ap-south-1 --parameter-overrides FrontendOrigin=https://YOUR-BRANCH.YOUR-APP.amplifyapp.com
```

Review the changeset and IAM permissions before accepting deployment. `samconfig.toml` defaults to stack `kahaan`, Mumbai region, and the `kahaan-demo/` artifact prefix; use a different stack name if that name already belongs to another project. Keep each deployment's resource inventory.

4. Read your stack outputs in CloudFormation: `ApiUrl`, `PlacesTable`, `VotesTable`, `ApiFunctionName`, `UserPoolId` and `UserPoolClientId`. Configure these build-time environment variables in Amplify, then rebuild/redeploy:

```text
VITE_API_URL=<your ApiUrl>
VITE_AWS_REGION=ap-south-1
VITE_USER_POOL_ID=<your UserPoolId>
VITE_USER_POOL_CLIENT_ID=<your UserPoolClientId>
```

These are public configuration identifiers, not credentials. Never reuse the owner's deployment as the backend for your own app. If the hosting origin changes, update the SAM `FrontendOrigin` parameter as well.

5. Seed your own table using the same authenticated AWS profile. In PowerShell:

```powershell
$env:AWS_REGION = 'ap-south-1'
$env:PLACES_TABLE = '<your PlacesTable output>'
npm run seed
```

Or in Bash:

```sh
AWS_REGION=ap-south-1 PLACES_TABLE='<your PlacesTable output>' npm run seed
```

If using a named profile, set `AWS_PROFILE` for the Node seed script too. Seeding preserves existing records and votes; new source records begin with zero votes.

6. Verify public GET, signed-out write rejection, email registration/verification, authenticated creation, independent voting, creator/duplicate rejection, reports and mobile HTTPS behaviour. See [VERIFICATION.md](VERIFICATION.md) for which checks were actually performed on the original deployment. The documented CLI/Git-connected deployment route has not been executed in the original environment; its live deployment used the console/manual-upload route documented in [AWS-DEMO.md](AWS-DEMO.md).
7. Record your own resource names and cost controls. Adapt the shutdown script only after checking its project-name guards. Export needed data before deletion; deleting the stack removes accounts, places and votes. Follow [AWS-DEMO.md](AWS-DEMO.md) for pause versus full removal and artifact cleanup.

For local frontend development against your AWS backend, copy `frontend/.env.example` to `frontend/.env`, fill your four public identifiers, and restart `npm run dev`. Writes will use real Cognito accounts; the local API process is no longer the frontend's backend. Environment values are embedded during production build: changing them requires rebuilding, not merely refreshing the page.

## Troubleshooting

| Symptom | Check |
|---|---|
| Setup error in a production build | Fill all four build variables, rebuild and redeploy. Production deliberately does not fall back to simulated authentication. |
| API load error | In local simulation, start both services with `npm run dev`; on AWS, check the API output, region and exact CORS origin. |
| Port already in use | Stop the earlier Kahaan process using its terminal. Use port 5173: the development proxy and CORS expect it. |
| Blank map but the list works | Check internet access and tile loading. Tiles are external and their availability is separate from the app API. |
| No suitable recycling destination | The recycling listing is a call-first service office, not an evidenced walk-in drop-off. The mapped litter bin accepts only selected small dry litter; the other waste point is browse-only. Empty recommendations are intentional when acceptance is unknown. |
| Location unavailable | Browse using labelled distances from the area centre; adding still supports a map pin. AWS geolocation requires HTTPS and user permission. |
| Account or vote rejected | Check email verification, session, creator ownership and one-vote-per-account rule. Community confirmation needs two other accounts. |
| A category seems empty | Choosing a category clears the item query and shows that category's full catalogue. Item search only shows acceptance-matching results. Restart `npm run dev` after pulling new source data; the local catalogue upgrades automatically without resetting votes. |
| Source data edits do not appear | Restart `npm run dev` for local seed merging; run `node scripts/sync-data.mjs` before packaging AWS. Tests/build/dev also sync generated backend files. Existing cloud seed records are not overwritten. |

## Data and reuse

Keep OpenStreetMap attribution and source URLs. OSM data is under ODbL; contributed/operator-sourced information has its own provenance. Application code and project-authored documentation use the [MIT licence](../LICENSE). Operator/municipal records retain their original rights; MIT does not relicense source data. Manrope retains its SIL Open Font License.
