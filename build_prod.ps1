# Polaris Build
Write-Host "Starting Build..."
cd backend
if (Test-Path "venv/Scripts/activate.ps1") { . ./venv/Scripts/activate.ps1 }
if (Test-Path "dist") { Remove-Item -Recurse -Force "dist" }
if (Test-Path "build") { Remove-Item -Recurse -Force "build" }
pyinstaller polaris.spec --noconfirm
cd ..
cd frontend
npm run package
Write-Host "Build Complete."
