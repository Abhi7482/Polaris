$projectRoot = "c:/Users/abhis/OneDrive/Documents/Polaris"

Write-Host "Starting Polaris Backend..."
$backendProcess = Start-Process -FilePath "$projectRoot/backend/venv/Scripts/python.exe" -ArgumentList "-m uvicorn backend.main:app --reload --port 8000" -PassThru -WorkingDirectory $projectRoot -WindowStyle Minimized

Write-Host "Starting Polaris Frontend..."
$frontendProcess = Start-Process -FilePath "npm.cmd" -ArgumentList "run dev" -PassThru -WorkingDirectory "$projectRoot/frontend" -WindowStyle Minimized

Start-Sleep -Seconds 5

Write-Host "Opening Application..."
Start-Process "http://localhost:5173"

Write-Host "Polaris is running."
Write-Host "Backend PID: $($backendProcess.Id)"
Write-Host "Frontend PID: $($frontendProcess.Id)"
Write-Host "Press Enter to stop servers..."
Read-Host

Stop-Process -Id $backendProcess.Id -Force
Stop-Process -Id $frontendProcess.Id -Force
Write-Host "Stopped."
