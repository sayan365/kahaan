[CmdletBinding(SupportsShouldProcess = $true, ConfirmImpact = 'High')]
param(
  [ValidateSet('PauseBackend', 'RemoveDemo')]
  [string]$Mode = 'PauseBackend',
  [ValidatePattern('^[a-z0-9]+$')]
  [string]$AmplifyAppId
)
$ErrorActionPreference = 'Stop'
$region = 'ap-south-1'
$stack = 'kahaan'
function Invoke-AwsRead([string[]]$Arguments) {
  $result = & aws @Arguments --region $region --output json
  if ($LASTEXITCODE -ne 0) { throw 'AWS read failed. No further changes will be attempted.' }
  return ($result | ConvertFrom-Json)
}
function Invoke-AwsWrite([string[]]$Arguments) {
  & aws @Arguments --region $region
  if ($LASTEXITCODE -ne 0) { throw 'AWS operation failed. Check the console before retrying.' }
}
if (-not (Get-Command aws -ErrorAction SilentlyContinue)) { throw 'Install AWS CLI and sign in first. Never put keys in this script.' }
$identity = Invoke-AwsRead @('sts', 'get-caller-identity')
Write-Host "Account: $($identity.Account); region: $region; stack: $stack"
$details = Invoke-AwsRead @('cloudformation', 'describe-stacks', '--stack-name', $stack)
$deployment = $details.Stacks[0]
if ($deployment.Description -ne 'Kahaan single-area civic discovery and contributions') {
  throw 'The stack does not match this project. Stopping without changes.'
}
$functionName = ($deployment.Outputs | Where-Object OutputKey -eq 'ApiFunctionName').OutputValue
if (-not $functionName) { throw 'Missing ApiFunctionName output. Do not guess a Lambda name.' }
if ($Mode -eq 'PauseBackend') {
  if ($PSCmdlet.ShouldProcess("$($identity.Account)/$functionName", 'Set Lambda reserved concurrency to zero (blocks all backend requests)')) {
    Invoke-AwsWrite @('lambda', 'put-function-concurrency', '--function-name', $functionName, '--reserved-concurrent-executions', '0')
    $after = Invoke-AwsRead @('lambda', 'get-function-concurrency', '--function-name', $functionName)
    if ($after.ReservedConcurrentExecutions -ne 0) { throw 'Backend pause was not verified.' }
    Write-Host 'Backend paused. Hosting/storage/Cognito still exist. See AWS-DEMO.md for full removal and resume.'
  }
  return
}
if (-not $AmplifyAppId) { throw 'RemoveDemo requires the exact -AmplifyAppId from the deployment record.' }
$hosting = Invoke-AwsRead @('amplify', 'get-app', '--app-id', $AmplifyAppId)
if ($hosting.app.name -ne 'kahaan-demo') { throw 'Hosting app is not named kahaan-demo. Stopping without changes.' }
if ($PSCmdlet.ShouldProcess("$($identity.Account)/$stack + $AmplifyAppId", 'Permanently remove demo hosting, API, users, places, votes and logs. Export anything needed first')) {
  Invoke-AwsWrite @('amplify', 'delete-app', '--app-id', $AmplifyAppId)
  Invoke-AwsWrite @('cloudformation', 'delete-stack', '--stack-name', $stack)
  Invoke-AwsWrite @('cloudformation', 'wait', 'stack-delete-complete', '--stack-name', $stack)
  Write-Host 'Stack deletion completed. Check Amplify deletion and deployment artifacts in S3 as described in AWS-DEMO.md. Budget remains for monitoring.'
}
