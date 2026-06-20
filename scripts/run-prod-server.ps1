$ErrorActionPreference = "Stop"

param(
  [string]$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path,
  [int]$Port = 3000
)

Set-Location $ProjectRoot
$env:NODE_ENV = "production"

& "C:\Program Files\nodejs\npm.cmd" run start -- --hostname 0.0.0.0 --port $Port
