param(
  [string]$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
)

$ErrorActionPreference = "Stop"

$runtimeDir = Join-Path $ProjectRoot ".runtime"
$pidFile = Join-Path $runtimeDir "dev-server.pid"
$outLog = Join-Path $runtimeDir "dev-server.out.log"
$errLog = Join-Path $runtimeDir "dev-server.err.log"

New-Item -ItemType Directory -Force -Path $runtimeDir | Out-Null

if (Test-Path $pidFile) {
  $existingPid = (Get-Content $pidFile -ErrorAction SilentlyContinue | Select-Object -First 1).Trim()
  if ($existingPid) {
    $existingProcess = Get-Process -Id $existingPid -ErrorAction SilentlyContinue
    if ($existingProcess) {
      Write-Output "Dev server already running with PID $existingPid."
      exit 0
    }
    Remove-Item -LiteralPath $pidFile -Force
  }
}

$proc = Start-Process `
  -FilePath "cmd.exe" `
  -ArgumentList @(
    "/d",
    "/s",
    "/c",
    "`"npm.cmd run dev`""
  ) `
  -WorkingDirectory $ProjectRoot `
  -WindowStyle Hidden `
  -PassThru

Set-Content -Path $pidFile -Value $proc.Id
Write-Output "Started dev server with PID $($proc.Id)."
