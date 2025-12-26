# Polaris Build System
# This script builds the Python Backend and the Electron Frontend into a single Installer.

Write-Host "--- Polaris Build System ---" -ForegroundColor Cyan

# 1. Build Backend (Python -> EXE)
Write-Host "1. Building Backend (PyInstaller)..." -ForegroundColor Yellow
cd backend

# Activate Venv if exists
if (Test-Path "venv/Scripts/activate.ps1") { 
    Write-Host "Activating Virtual Environment..."
    . ./venv/Scripts/activate.ps1 
}

if ($?) {
    # Check if assets exist
    if (!(Test-Path "assets")) {
        Write-Error "Backend assets folder missing!"
        exit 1
    }

    # Clean previous builds
    if (Test-Path "dist") { Remove-Item -Recurse -Force "dist" }
    if (Test-Path "build") { Remove-Item -Recurse -Force "build" }

    # Run PyInstaller using the spec file
    # The spec file handles assets, hidden imports, and windowed mode
    pyinstaller polaris.spec --noconfirm

    if (-not $?) {
        Write-Error "PyInstaller Failed!"
        exit 1
    }
    
    # Verify EXE exists
    if (Test-Path "dist/polaris-backend.exe") {
        Write-Host "Backend EXE created successfully." -ForegroundColor Green
    }
    else {
        Write-Error "Backend EXE not found!"
        exit 1
    }
    cd ..
}
else {
    Write-Error "Could not find backend directory."
    exit 1
}

# 2. Build Frontend (Electron -> Installer)
Write-Host "2. Building Frontend (Electron-Builder)..." -ForegroundColor Yellow
cd frontend
if ($?) {
    # Ensure dependencies installed
    if (!(Test-Path "node_modules")) {
        Write-Host "Installing Node Modules..."
        npm install
    }
    
    # Run Package
    # This calls 'vite build' then 'electron-builder'
    # It copies 'backend/dist/polaris-backend.exe' because package.json is configured to do so.
    npm run package

    if ($?) {
        Write-Host "Packaging Complete!" -ForegroundColor Green
        Write-Host "Installer is located in: frontend/dist-electron/" -ForegroundColor Cyan
    }
    else {
        Write-Error "Packaging Failed!"
        exit 1
    }
    
    cd ..
}
else {
    Write-Error "Could not find frontend directory."
    exit 1
}

Write-Host "--- Build Finished ---" -ForegroundColor Cyan
