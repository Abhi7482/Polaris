# Polaris Build "Today" (Special Event)
# This script builds the Python Backend and the Electron Frontend into an Installer.
# It forces the inclusion of specific frames via Environment Variable.

Write-Host "--- Polaris Build System (Special Event: Today) ---" -ForegroundColor Cyan

# --- CONFIGURATION ---
$SpecialFrames = "Pink Royale Inso,Classic Insomania,Vintage Insomania"
$env:VITE_SPECIAL_EVENT_FRAMES = $SpecialFrames

Write-Host "Configuration: Specialized Frames = $SpecialFrames" -ForegroundColor Magenta

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
    
    # --- WRITE TEMP SPECIAL CONFIG JSON ---
    # We bypass .env files entirely and write a JSON file that vite.config.js checks for.
    # This guarantees the variables are injected into the build.
    Write-Host "Creating temporary special_config.json for build..." -ForegroundColor Magenta
    
    $JsonContent = @{
        VITE_SPECIAL_EVENT_FRAMES = $SpecialFrames
        VITE_ALLOW_PAYMENT_BYPASS = "true"
    } | ConvertTo-Json

    Set-Content -Path "special_config.json" -Value $JsonContent
    
    # Verify content
    Write-Host "--- special_config.json Content ---" -ForegroundColor DarkGray
    Get-Content "special_config.json"
    Write-Host "---------------------------------" -ForegroundColor DarkGray

    # Run Package
    # This calls 'vite build' then 'electron-builder'
    try {
        npm run package
        if ($?) {
            Write-Host "Packaging Complete!" -ForegroundColor Green
            Write-Host "Installer is located in: frontend/dist-electron/" -ForegroundColor Cyan
        }
        else {
            throw "Packaging Failed"
        }
    }
    finally {
        # Cleanup special_config.json always
        if (Test-Path "special_config.json") {
            Remove-Item "special_config.json" -Force
            Write-Host "Cleaned up special_config.json file." -ForegroundColor Gray
        }
    }
    
    cd ..
}
else {
    Write-Error "Could not find frontend directory."
    exit 1
}

Write-Host "--- Special Event Build Finished ---" -ForegroundColor Cyan
