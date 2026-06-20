Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "powershell.exe -NoProfile -ExecutionPolicy Bypass -File ""C:\myinte~1\scripts\start-dev-hidden.ps1""", 0, False
