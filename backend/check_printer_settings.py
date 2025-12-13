import win32print
import win32con

def check_printer_settings(printer_name="EPSON L3210 Series"):
    try:
        # Open Printer
        hPrinter = win32print.OpenPrinter(printer_name)
        
        # Level 2 includes DEVMODE
        printer_info = win32print.GetPrinter(hPrinter, 2)
        devmode = printer_info['pDevMode']
        
        print(f"--- Settings for: {printer_name} ---")
        
        # Paper Size
        # 1 = Letter, 9 = A4, etc. 256+ = Custom
        print(f"Paper Size ID: {devmode.PaperSize}")
        print(f"Paper Width: {devmode.PaperWidth / 10} mm (Expected ~101mm for 4in)")
        print(f"Paper Length: {devmode.PaperLength / 10} mm (Expected ~152mm for 6in)")
        
        # Orientation
        # 1 = Portrait, 2 = Landscape
        orient = "Portrait" if devmode.Orientation == 1 else "Landscape"
        print(f"Orientation: {orient} (Expected: Portrait)")
        
        # Quality
        # Positive = DPI, Negative = Constants (DMRES_HIGH=-4, MEDIUM=-3, LOW=-2, DRAFT=-1)
        print(f"Print Quality: {devmode.PrintQuality}")
        
        # Color
        # 1 = Monochrome, 2 = Color
        color = "Color" if devmode.Color == 2 else "Monochrome"
        print(f"Color: {color}")

        win32print.ClosePrinter(hPrinter)

        # 2. Check DC Capabilities (The Real Truth)
        import win32gui
        import win32ui
        
        print("\n--- DC Capabilities (What the driver enforces) ---")
        hDC_handle = win32gui.CreateDC("WINSPOOL", printer_name, devmode)
        hDC = win32ui.CreateDCFromHandle(hDC_handle)
        
        phys_w = hDC.GetDeviceCaps(win32con.PHYSICALWIDTH)
        phys_h = hDC.GetDeviceCaps(win32con.PHYSICALHEIGHT)
        off_x = hDC.GetDeviceCaps(win32con.PHYSICALOFFSETX)
        off_y = hDC.GetDeviceCaps(win32con.PHYSICALOFFSETY)
        res_x = hDC.GetDeviceCaps(win32con.HORZRES)
        res_y = hDC.GetDeviceCaps(win32con.VERTRES)
        
        print(f"Physical Size: {phys_w}x{phys_h}")
        print(f"Printable Size: {res_x}x{res_y}")
        print(f"Margins (Offset): X={off_x}, Y={off_y}")
        
        if off_x == 0 and off_y == 0:
            print("✅ BORDERLESS ACTIVE (Margins are 0)")
        else:
            print(f"❌ MARGINS DETECTED! (Lost {off_x}px left, {off_y}px top)")
            
        hDC.DeleteDC()
        
    except Exception as e:
        print(f"Error reading settings: {e}")
        # Try finding via Enum if name is wrong
        print("Note: If printer name is wrong, update script or printer.py")

if __name__ == "__main__":
    check_printer_settings()
