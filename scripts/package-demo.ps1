$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
function Write-PortableZip([string]$Root, [string]$Destination) {
  $resolved = (Resolve-Path -LiteralPath $Root).Path.TrimEnd('\')
  $stream = [IO.File]::Open($Destination, [IO.FileMode]::Create)
  $zip = New-Object IO.Compression.ZipArchive($stream, [IO.Compression.ZipArchiveMode]::Create)
  try {
    foreach ($file in Get-ChildItem -LiteralPath $resolved -Recurse -File) {
      $entry = $file.FullName.Substring($resolved.Length + 1).Replace('\', '/')
      [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $file.FullName, $entry, [IO.Compression.CompressionLevel]::Optimal) | Out-Null
    }
  } finally { $zip.Dispose(); $stream.Dispose() }
}
$project = Split-Path -Parent $PSScriptRoot
Push-Location $project
try {
  node scripts/sync-data.mjs
  if ($LASTEXITCODE -ne 0) { throw 'Data sync failed.' }
  $artifactDir = Join-Path $project '.demo-artifacts'
  New-Item -ItemType Directory -Path $artifactDir -Force | Out-Null
  # Explicit allowlist: no credentials, local state, caches, node_modules or Git metadata.
  $sourceFiles = @('template.yaml', 'samconfig.toml', 'package.json', 'package-lock.json', 'backend/package.json', 'backend/area.json', 'backend/seed_places.json', 'backend/src', 'data', 'scripts/seed-dynamo.mjs', 'scripts/sync-data.mjs')
  $stage = Join-Path $artifactDir ('source-' + [guid]::NewGuid().ToString('N'))
  New-Item -ItemType Directory -Path $stage | Out-Null
  foreach ($relative in $sourceFiles) {
    $target = Join-Path $stage $relative
    New-Item -ItemType Directory -Path (Split-Path -Parent $target) -Force | Out-Null
    Copy-Item -LiteralPath (Join-Path $project $relative) -Destination $target -Recurse
  }
  # npm's root workspaces need the frontend manifest for seed dependencies to install.
  New-Item -ItemType Directory -Path (Join-Path $stage 'frontend') -Force | Out-Null
  Copy-Item -LiteralPath 'frontend/package.json' -Destination (Join-Path $stage 'frontend/package.json')
  $archive = Join-Path $artifactDir 'kahaan-backend-source.zip'
  Write-PortableZip $stage $archive
  $lambdaStage = Join-Path $artifactDir ('lambda-' + [guid]::NewGuid().ToString('N'))
  New-Item -ItemType Directory -Path $lambdaStage | Out-Null
  foreach ($relative in @('src', 'area.json', 'seed_places.json', 'package.json')) {
    Copy-Item -LiteralPath (Join-Path 'backend' $relative) -Destination (Join-Path $lambdaStage $relative) -Recurse
  }
  Write-PortableZip $lambdaStage (Join-Path $artifactDir 'kahaan-lambda.zip')
  Write-Host "Prepared $archive. Frontend source is not included; build and package frontend/dist separately after AWS outputs are available."
  # Keep the small staging directory for inspection; no recursive deletion is needed.
} finally { Pop-Location }
