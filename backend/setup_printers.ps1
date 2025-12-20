# PowerShell Script to Create the 'EPSON L3210 BW' Printer
# Usage: Right-clnick -> Run with PowerShell

$basePrinterName = "EPSON L3210 Series"
$newPrinterName = "EPSON L3210 BW"

Write-Host "🖨️ Configuration Started..." -ForegroundColor Cyan

# 1. Check if Base Printer Exists
$basePrinter = Get-Printer -Name $basePrinterName -ErrorAction SilentlyContinue

if (-not $basePrinter) {
    Write-Host "❌ Error: Base printer '$basePrinterName' not found!" -ForegroundColor Red
    Write-Host "Please install the official Epson drivers first and ensuring the printer is ON."
    exit 1
}

Write-Host "✅ Found Base Printer: $($basePrinter.Name) Using Driver: $($basePrinter.DriverName)" -ForegroundColor Green

# 2. Check if BW Printer Already Exists
$bwPrinter = Get-Printer -Name $newPrinterName -ErrorAction SilentlyContinue

if ($bwPrinter) {
    Write-Host "⚠️  Printer '$newPrinterName' already exists." -ForegroundColor Yellow
} else {
    Write-Host "➕ Creating '$newPrinterName'..." -ForegroundColor Yellow
    try {
        # Create new printer using the SAME driver and port as the base printer
        Add-Printer -Name $newPrinterName -DriverName $basePrinter.DriverName -PortName $basePrinter.PortName
        Write-Host "✅ Successfully created '$newPrinterName'" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to create printer: $_" -ForegroundColor Red
        exit 1
    }
}

Write-Host "`n✅ SETUP COMPLETE" -ForegroundColor Green
Write-Host "Now go to Control Panel -> Devices & Printers"
Write-Host "Right-click '$newPrinterName' -> Printing Preferences -> Select 'Grayscale' & 'Borderless'" -ForegroundColor Cyan
Pause
