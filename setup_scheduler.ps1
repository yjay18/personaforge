$ErrorActionPreference = "Stop"

$taskName = "PersonaForge"
$scriptPath = Join-Path (Get-Location) "run_app.bat"

Write-Host "Creating scheduled task to launch PersonaForge at user logon..."

schtasks /Create /F /RL LIMITED /SC ONLOGON /TN $taskName /TR $scriptPath | Out-Null

Write-Host "Task created: $taskName"
Write-Host "You can manage it in Task Scheduler or remove with: schtasks /Delete /TN $taskName /F"
