# AWS demo: costs, monitoring and shutdown

## Current state (10 October 2026)

Browser access is available and the AWS console is signed in. Account-specific credit balances and identifiers belong in ignored `.demo-artifacts/deployment-status.txt`, never in the public repository. Check the account's current plan, credit balance and expiry in Billing before deploying. A free plan and a paid plan have different charging behaviour.

The backend stack was deployed through the AWS console after the owner approved its IAM role. The internal seed loader inserted all 19 sourced locations, and the normal API handler was restored. Public GET returns 19 records with zero votes and no creator identity; unauthenticated POST returns 401. Amplify's connected frontend is deployed on the `demo` branch. Failed uploads left pending jobs on `main`; that branch's older build has no backend configuration. Use the demo URL below. CloudShell remains blocked by account verification. Live account creation and authenticated contributions still need acceptance testing.

Created **Kahaan demo - cost alert**, monthly $1, all services, actual cost over 100%, one email recipient supplied by the owner. AWS shows the recipient as **Verified**. Billing data is initially unavailable and may take 24 hours to populate. The console could not load charge-type options, so **credits have not been explicitly excluded from this budget yet**; it is not a reliable credit-consumption alarm until updated. Once data is ready: edit budget > filter specific cost dimensions > Charge type > Excludes > Credit and Refund > apply > save. Check the saved filter.

Budgets notify after billing processing; they do not enforce a $1 cap or automatically shut services down. Check **Billing > Credits/Free Tier**, **Bills**, and **Budgets** before and after the demo. The all-services alert covers other account projects too.

## Keep the demo small

The SAM template uses on-demand DynamoDB, one 256 MB Lambda, an HTTP API limited to 5 requests/second with burst 10, and a stack-managed CloudWatch log group with seven-day retention. Throttling is best-effort and does not cap spending. No provisioned concurrency, paid custom domain, NAT gateway, EC2/RDS, WAF or AI inference is required. The app makes no model calls and consumes no AI tokens at runtime.

Use a manually uploaded static Amplify ZIP for a short demo if Git deployment is unnecessary. Build locally after receiving AWS outputs; upload **the contents of frontend/dist at ZIP root**. This avoids running a hosted build pipeline for every edit. Name the Amplify app `kahaan-demo` and the SAM stack `kahaan`, both in `ap-south-1`. Do not enable SSR, a firewall or paid add-ons for this static demo.

Outside applicable free allowances, Amplify lists $0.15/GB served and $0.023/GB-month stored; storage recurs until the app is deleted. Standard hosted builds list $0.01/minute. For illustration, 1 GB of traffic is $0.15 in hosting transfer before allowances/credits; backend usage and storage are additional. This is not an account-specific bill estimate. Prices and eligibility must be checked before deployment.

## Deployment record (fill from actual outputs)

| Resource | Value/status |
|---|---|
| Region | ap-south-1 |
| CloudFormation stack | kahaan; UPDATE_COMPLETE after demo-origin-only update |
| Amplify app | kahaan-demo; connected demo branch deployed; main has an older unconfigured build and pending upload jobs |
| Amplify app ID/public URL | dato5zt1h00lk / https://demo.dato5zt1h00lk.amplifyapp.com |
| API | https://chzjyom2t3.execute-api.ap-south-1.amazonaws.com |
| Function/table/pool IDs | exact CloudFormation outputs recorded in ignored .demo-artifacts/deployment-status.txt |
| Artifact bucket and prefix | dedicated private bucket recorded locally; two console deployment files at root; SAM-managed deploys use prefix kahaan-demo/ |
| Budget | Kahaan demo - cost alert (created; email verified; credit exclusion pending) |

Prepare a credential-free backend archive with `powershell -File scripts/package-demo.ps1`. The output is `.demo-artifacts/kahaan-backend-source.zip`. Inspect its allowlisted contents before upload. In CloudShell once available, unpack into a new project directory, run `npm ci --ignore-scripts`, `sam validate --lint`, `sam build`, and the deployment commands in README. Never upload `.env`, `.aws`, local votes, Git metadata or node_modules.

For the direct console fallback, `.demo-artifacts/kahaan-lambda.zip` contains the portable Lambda runtime files (ZIP paths use `/`). Upload it to the private bucket and use the generated console SAM template, replacing local `CodeUri` with its S3 URI. Obtain the Amplify HTTPS origin before creating the backend stack. After stack completion, temporarily set the Lambda handler to `src/handlers/seed.handler`, invoke `{}` once from the authenticated Lambda console, then restore **`src/handlers/api.handler`** before testing or sharing the app. The seed handler is never an HTTP route and uses conditional writes to preserve existing data. Verify the restored handler and the public GET count of 19. IAM role creation requires review before the final CloudFormation submission.

## Pause immediately (reversible)

After deployment and AWS CLI login, from the project root:

```powershell
.\scripts\shutdown-demo.ps1 -Mode PauseBackend -WhatIf
.\scripts\shutdown-demo.ps1 -Mode PauseBackend
```

This verifies the project stack and sets its Lambda concurrency to zero. It blocks backend processing but public API requests can still reach API Gateway, the static frontend still serves traffic, and stored data/logs/artifacts still exist. It is a pause, not complete cost cessation.

To resume, use the exact ApiFunctionName output:

```powershell
aws lambda delete-function-concurrency --region ap-south-1 --function-name <ApiFunctionName>
```

## Remove after recording/judging (permanent)

Wait until judges have accessed the required URL, unless the submission accepts video-only evidence. Export any contributed places/votes and anything else needed first. Removing the stack permanently deletes demo users, places, votes and logs; rebuilding creates new IDs and needs a new frontend build.

```powershell
.\scripts\shutdown-demo.ps1 -Mode RemoveDemo -AmplifyAppId <actual-id> -WhatIf
.\scripts\shutdown-demo.ps1 -Mode RemoveDemo -AmplifyAppId <actual-id>
```

For this deployment, replace `<actual-id>` with `dato5zt1h00lk`. Deleting the Amplify app removes both `main` and `demo` branches.

Without AWS CLI, use the signed-in console in Mumbai: Lambda > `kahaan-ApiFunction-KqEWQsIhX5oN` > Throttle for a reversible backend pause. For full removal after recording/judging, Amplify > `kahaan-demo` > App settings > General settings > Delete app, then CloudFormation > `kahaan` > Delete stack. Export needed data first and verify deletion completes. Finally inspect the dedicated artifact bucket recorded locally, delete its two project files, and delete the empty bucket. A backend pause alone leaves hosting and storage costs possible.

The script verifies the exact stack description and Amplify app name, prints the account, asks for confirmation, deletes the hosting app and backend stack, and waits for stack deletion. It stops on errors. No shutdown was executed during preparation. These scripts have not yet been tested against deployed AWS resources.

Then check the console: Amplify app gone; CloudFormation `DELETE_COMPLETE`; no project Lambda/API/tables/pool/log group left. Inspect deployment artifacts in S3. SAM's managed artifact bucket may be shared with other projects: remove only this project's `kahaan-demo/` objects after checking their ownership, and never delete a shared bucket. A dedicated console artifact bucket should be emptied and deleted only after its project-only contents are confirmed. Check for failed deletions and costs again when billing data catches up. Keep the free notification-only budget to detect remaining spend.

Sources: [Amplify pricing](https://aws.amazon.com/amplify/pricing/), [AWS Budgets timing and limits](https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-managing-costs.html), [budget notifications pricing](https://aws.amazon.com/aws-cost-management/aws-budgets/pricing/), [manual Amplify deployments](https://docs.aws.amazon.com/amplify/latest/userguide/manual-deploys.html), [CloudWatch log retention](https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-resource-logs-loggroup.html).
