param(
  [int]$Port = 3001
)

$ErrorActionPreference = "Stop"
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

$listener = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($listener) {
  Write-Output "Dev environment is already running at http://localhost:$Port."
  exit 0
}

$command = "Set-Location -LiteralPath '$projectRoot'; npm.cmd run dev -- --hostname 0.0.0.0 --port $Port"
Start-Process -FilePath "cmd.exe" -ArgumentList "/d", "/k", $command -WorkingDirectory $projectRoot -WindowStyle Minimized

Write-Output "Dev environment launch requested at http://localhost:$Port."
