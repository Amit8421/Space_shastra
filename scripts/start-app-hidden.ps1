$ErrorActionPreference = "Stop"

param(
  [string]$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path,
  [int]$Port = 3000
)

$runtimeDir = Join-Path $ProjectRoot ".runtime"
$pidFile = Join-Path $runtimeDir "app-server.pid"
$outLog = Join-Path $runtimeDir "app-server.out.log"
$errLog = Join-Path $runtimeDir "app-server.err.log"
$runner = Join-Path $ProjectRoot "scripts\\run-prod-server.ps1"

New-Item -ItemType Directory -Force -Path $runtimeDir | Out-Null

if (Test-Path $pidFile) {
  $existingPid = (Get-Content $pidFile -ErrorAction SilentlyContinue | Select-Object -First 1).Trim()
  if ($existingPid) {
    $existingProcess = Get-Process -Id $existingPid -ErrorAction SilentlyContinue
    if ($existingProcess) {
      Write-Output "Server already running with PID $existingPid."
      exit 0
    }
  }
}

$portOwner = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty OwningProcess
if ($portOwner) {
  Write-Error "Port $Port is already in use by PID $portOwner."
  exit 1
}

$proc = Start-Process `
  -FilePath "C:\WINDOWS\System32\WindowsPowerShell\v1.0\powershell.exe" `
  -ArgumentList @(
    "-NoProfile",
    "-ExecutionPolicy", "Bypass",
    "-File", $runner,
    "-ProjectRoot", $ProjectRoot,
    "-Port", $Port
  ) `
  -WorkingDirectory $ProjectRoot `
  -WindowStyle Hidden `
  -RedirectStandardOutput $outLog `
  -RedirectStandardError $errLog `
  -PassThru

Set-Content -Path $pidFile -Value $proc.Id
Write-Output "Started server with PID $($proc.Id) on port $Port."
