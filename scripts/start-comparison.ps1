param([switch]$Stop, [switch]$SkipBuild)
$ErrorActionPreference = 'Stop'
$repo = Split-Path $PSScriptRoot -Parent
$comparisonRoot = Split-Path $repo -Parent
$baseline = Join-Path $comparisonRoot 'comparison-main'
$runtime = Join-Path $comparisonRoot '.comparison'
$baseRevision = 'e6732389cdf42430d79f5efc56c3ae64991edae7'
New-Item -ItemType Directory -Path $runtime -Force | Out-Null
$stateFile = Join-Path $runtime 'processes.json'
$state = @()
if (Test-Path $stateFile) { $state = @(Get-Content $stateFile -Raw | ConvertFrom-Json) }

function Stop-ComparisonProcesses {
  foreach ($entry in $state) {
    $process = Get-Process -Id $entry.Id -ErrorAction SilentlyContinue
    # PowerShell 7 parses ISO JSON dates into DateTime; Windows PowerShell
    # leaves strings. Compare instants, not their display representations.
    if ($process -and $process.StartTime.ToUniversalTime().Ticks -eq ([datetime]$entry.StartTime).ToUniversalTime().Ticks) {
      Stop-Process -Id $process.Id
      $null = $process.WaitForExit(5000)
    }
  }
  '[]' | Set-Content $stateFile
}

if ($Stop) {
  Stop-ComparisonProcesses
  & docker stop trainloop-main-compare-db trainloop-feedback-compare-db
  Write-Output 'Comparison stopped. Databases and uploaded photos are preserved.'
  exit
}

if (!(Test-Path (Join-Path $baseline '.git'))) {
  & git clone --local --no-hardlinks --no-checkout $repo $baseline
  if ($LASTEXITCODE -ne 0) { throw 'Could not create the main comparison copy.' }
  & git -C $baseline checkout --detach $baseRevision
  if ($LASTEXITCODE -ne 0) { throw 'Could not check out the pinned GitHub main revision.' }
  & git -C $baseline remote set-url origin https://github.com/applifting-vsecourse/team-5.git
}
$actualRevision = & git -C $baseline rev-parse HEAD
if ($actualRevision -ne $baseRevision) { throw 'comparison-main is not at the expected revision; refusing to change it.' }
& git -C $baseline diff --quiet HEAD --
if ($LASTEXITCODE -ne 0) { throw 'comparison-main contains tracked changes; preserve or move them before comparing.' }

& docker info --format '{{.ServerVersion}}' | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Start Docker Desktop and run this script again.' }
Stop-ComparisonProcesses
$script:state = @()
$node = (Get-Command node.exe).Source
$builds = @(
  @{ Name='main'; Path=$baseline; Hostname='localhost'; Front=3050; Back=4050; DatabasePort=5435 },
  @{ Name='feedback'; Path=$repo; Hostname='127.0.0.1'; Front=3051; Back=4051; DatabasePort=5436 }
)

function Run-Checked([string]$Directory, [string]$LogName, [string[]]$Arguments) {
  Push-Location $Directory
  try {
    & pnpm.cmd @Arguments *> (Join-Path $runtime "$LogName.log")
    if ($LASTEXITCODE -ne 0) { throw "$LogName failed. See $runtime/$LogName.log" }
  } finally { Pop-Location }
}

function Start-Server([string]$Directory, [string]$Name, [string[]]$Arguments) {
  $process = Start-Process -FilePath $node -ArgumentList $Arguments -WorkingDirectory $Directory -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $runtime "$Name.log") -RedirectStandardError (Join-Path $runtime "$Name-error.log")
  $script:state += @{ Id=$process.Id; StartTime=$process.StartTime.ToUniversalTime().ToString('o'); Name=$Name }
  ConvertTo-Json -InputObject @($script:state) | Set-Content $stateFile
}

foreach ($build in $builds) {
  foreach ($port in @($build.Front, $build.Back)) {
    $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $port)
    try { $listener.Start() } catch { throw "Port $port is already occupied. No existing app will be stopped." } finally { $listener.Stop() }
  }
  $name = $build.Name
  $container = "trainloop-$name-compare-db"
  $existing = & docker ps -a --filter "name=^/$container`$" --format '{{.Names}}'
  if ($existing -eq $container) {
    & docker start $container | Out-Null
  } else {
    & docker run -d --name $container -p "127.0.0.1:$($build.DatabasePort):5432" -e POSTGRES_USER=trainloop -e POSTGRES_PASSWORD=local_comparison_only -e POSTGRES_DB=trainloop -v "${container}:/var/lib/postgresql/data" postgres:17-alpine | Out-Null
  }
  if ($LASTEXITCODE -ne 0) { throw "Could not start $container" }
  $ready = $false
  for ($attempt=0; $attempt -lt 30; $attempt++) {
    & docker exec $container pg_isready -U trainloop -d trainloop *> $null
    if ($LASTEXITCODE -eq 0) { $ready = $true; break }
    Start-Sleep -Seconds 1
  }
  if (!$ready) { throw "$container did not become ready." }
  $backend = Join-Path $build.Path 'apps/backend'
  $frontend = Join-Path $build.Path 'apps/frontend'
  $backendUrl = "http://$($build.Hostname):$($build.Back)"
  $frontendUrl = "http://$($build.Hostname):$($build.Front)"
  $uploads = (Join-Path $runtime "$name-uploads").Replace('\','/')
  @"
BETTER_AUTH_SECRET=local_comparison_${name}_secret_do_not_deploy
SUPERADMIN_EMAIL=admin@example.com
SUPERADMIN_PASSWORD=adminpassword
NODE_ENV=development
BACKEND_URL=$backendUrl
FRONTEND_URL=$frontendUrl
FRONTEND_RESET_PASSWORD_ROUTE=reset-password
DATABASE_URL=postgresql://trainloop:local_comparison_only@127.0.0.1:$($build.DatabasePort)/trainloop
PORT=$($build.Back)
UPLOADS_DIR=$uploads
SMTP_HOST=console
"@ | Set-Content (Join-Path $backend '.env') -Encoding utf8
  "VITE_API_URL=$backendUrl/api`nVITE_BETTER_AUTH_URL=$backendUrl" | Set-Content (Join-Path $frontend '.env') -Encoding utf8

  if (!(Test-Path (Join-Path $build.Path 'node_modules/.modules.yaml'))) {
    Write-Output "Installing $name dependencies..."
    Run-Checked $build.Path "$name-install" @('install','--frozen-lockfile')
  }
  if (!$SkipBuild -or !(Test-Path (Join-Path $backend 'dist/main.js')) -or !(Test-Path (Join-Path $frontend 'build/index.html'))) {
    Write-Output "Building $name..."
    Run-Checked $build.Path "$name-backend-build" @('backend','build')
    Run-Checked $build.Path "$name-frontend-build" @('frontend','build')
  }
  Run-Checked $build.Path "$name-migrate" @('backend','migrate')
  Push-Location $backend
  try {
    & $node --env-file=.env dist/scripts/seed/seed.script.js *> (Join-Path $runtime "$name-seed.log")
    if ($LASTEXITCODE -ne 0) { throw "Seeding $name failed; see $runtime/$name-seed.log" }
  } finally { Pop-Location }
  Start-Server $backend "$name-backend" @('--env-file=.env','dist/main.js')
  Start-Server $frontend "$name-frontend" @('node_modules/vite/bin/vite.js','preview','--host',$build.Hostname,'--port',"$($build.Front)",'--strictPort')
  $ready = $false
  for ($attempt=0; $attempt -lt 30; $attempt++) {
    try {
      $null = Invoke-WebRequest "$backendUrl/api/auth/get-session" -TimeoutSec 2
      $null = Invoke-WebRequest $frontendUrl -TimeoutSec 2
      $ready = $true
      break
    } catch { Start-Sleep -Seconds 1 }
  }
  if (!$ready) { throw "$name did not start; see $runtime logs." }
  Write-Output "$name ready: $frontendUrl"
}
Write-Output 'Trainer: trener@trainloop.cz / password1; handler: jan.novak@seznam.cz / password1'
Write-Output 'Keep localhost for main and 127.0.0.1 for feedback: their login cookies stay separate.'
