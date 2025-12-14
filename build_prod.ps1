
# BUILD PRODUCTION RELEASE
# This script builds the Python Backend and the Electron Frontend into a single Installer.

Write-Host "--- Polaris Build System ---" -ForegroundColor Cyan

# 1. Build Backend (Python -> EXE)
Write-Host "1. Building Backend (PyInstaller)..." -ForegroundColor Yellow
cd backend
if ($?) {
    # Check if assets exist
    if (!(Test-Path "assets")) {
        Write-Error "Backend assets folder missing!"
        exit 1
    }

    # Clean previous builds
    Remove-Item -Recurse -Force build, dist, *.spec -ErrorAction SilentlyContinue

    # Run PyInstaller
    # --onefile: Single .exe
    # --noconfirm: overwrites
    # --windowed: No console window (change to --console for debugging)
    # --name: output filename
    # --add-data: Bundle assets folder inside the exe (Format: source;dest)
    pyinstaller --noconfirm --onefile --windowed --name "polaris-backend" --add-data "assets;assets" main.py

    if (-not $?) {
        Write-Error "PyInstaller Failed!"
        exit 1
    }
    
    # Verify EXE exists
    if (Test-Path "dist/polaris-backend.exe") {
        Write-Host "Backend EXE created successfully." -ForegroundColor Green
    } else {
        Write-Error "Backend EXE not found!"
        exit 1
    }
    cd ..
} else {
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
    } else {
        Write-Error "Packaging Failed!"
        exit 1
    }
    
    cd ..
} else {
    Write-Error "Could not find frontend directory."
    exit 1
}

Write-Host "--- Build Finished ---" -ForegroundColor Cyan
