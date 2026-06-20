@echo off
cd /d "%~dp0"

if not exist ".runtime" mkdir ".runtime"

netstat -ano | findstr /R /C:":3000 .*LISTENING" >nul
if %errorlevel%==0 exit /b 0

start "Interior Design Manager Dev Server" /min cmd /c "npm.cmd run dev -- -p 3000 > .runtime\dev-server.out.log 2> .runtime\dev-server.err.log"
