$ErrorActionPreference = "Stop"

$projectRoot = "C:\my interior project"
$logDirectory = Join-Path $projectRoot "logs"
$logPath = Join-Path $logDirectory "dev-server.log"
$port = 3000

function Test-PortListening {
    param([int]$Port)

    try {
        $listener = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction Stop
        return $null -ne $listener
    } catch {
        return $false
    }
}

New-Item -ItemType Directory -Path $logDirectory -Force | Out-Null

"[$(Get-Date -Format s)] Login startup script triggered." | Add-Content -Path $logPath

# Give Windows a moment to finish user startup before launching the app.
Start-Sleep -Seconds 15

if (Test-PortListening -Port $port) {
    "[$(Get-Date -Format s)] Port $port already listening. Skipping start." | Add-Content -Path $logPath
    exit 0
}

$launchCommand = "Set-Location -LiteralPath '$projectRoot'; npm.cmd run dev"

Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", $launchCommand -WorkingDirectory $projectRoot -WindowStyle Minimized
"[$(Get-Date -Format s)] Launch command issued." | Add-Content -Path $logPath

Start-Sleep -Seconds 20

if (-not (Test-PortListening -Port $port)) {
    "[$(Get-Date -Format s)] First launch did not open port $port. Retrying once." | Add-Content -Path $logPath
    Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", $launchCommand -WorkingDirectory $projectRoot -WindowStyle Minimized
    Start-Sleep -Seconds 20
}

if (Test-PortListening -Port $port) {
    "[$(Get-Date -Format s)] Dev server is listening on port $port." | Add-Content -Path $logPath
    exit 0
}

"[$(Get-Date -Format s)] Dev server still not listening on port $port." | Add-Content -Path $logPath
exit 1
