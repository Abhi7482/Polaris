@echo off
:: Navigate to the unpacked application directory
cd /d "%~dp0frontend\dist-electron\win-unpacked"

:: Launch the application
start "" "Polaris.exe"

exit
