
# SETUP SCRIPT for Polaris Photobooth Printers
# Run this as Administrator on the target machine.

$TargetBWName = "EPSON L3210 BW"

Write-Host "--- Polaris Printer Setup ---" -ForegroundColor Cyan

# 1. Find the Base Printer (The confusing part is drivers might be named differently)
# We look for a printer that looks like an Epson L3210
$basePrinter = Get-Printer | Where-Object { $_.Name -like "*L3210*" -and $_.Name -notlike "*BW*" } | Select-Object -First 1

if (-not $basePrinter) {
    Write-Error "CRITICAL: Could not find an installed EPSON L3210 printer!"
    Write-Host "Please install the Epson drivers and plug in the printer first."
    exit 1
}

Write-Host "Found Base Printer: $($basePrinter.Name)" -ForegroundColor Green
Write-Host "Driver: $($basePrinter.DriverName)"
Write-Host "Port: $($basePrinter.PortName)"

# 2. Check if BW Printer already exists
$existingBW = Get-Printer -Name $TargetBWName -ErrorAction SilentlyContinue

if ($existingBW) {
    Write-Host "Success: '$TargetBWName' already exists." -ForegroundColor Green
} else {
    Write-Host "Creating '$TargetBWName'..." -ForegroundColor Yellow
    try {
        Add-Printer -Name $TargetBWName -DriverName $basePrinter.DriverName -PortName $basePrinter.PortName
        Write-Host "Successfully created '$TargetBWName'!" -ForegroundColor Green
    } catch {
        Write-Error "Failed to create printer. Make sure you are running as Administrator."
        Write-Error $_
        exit 1
    }
}

Write-Host "`n--- FINAL STEP REQUIRED ---" -ForegroundColor Magenta
Write-Host "1. Open Windows Printers & Scanners."
Write-Host "2. Find '$TargetBWName'."
Write-Host "3. Go to 'Printing Preferences'."
Write-Host "4. Set: Grayscale=ON, Borderless=ON, Paper=Glossy."
Write-Host "5. Click OK."
Write-Host "---------------------------"
Write-Host "Setup Complete."
