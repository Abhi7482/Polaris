import win32print
import win32ui
import win32con
import win32gui
from PIL import Image, ImageWin
import logging
import win32com.client

logger = logging.getLogger(__name__)

class PrinterService:
    def __init__(self, printer_name="EPSON L3210 Series"):
        # Default name, but we will try to resolve by ID if needed
        self.printer_name = printer_name
        self.vid = "04B8" # Epson
        self.pid = "1188" # L3210 Series

    def _find_printer_by_hardware_id(self):
        """
        Attempts to find printer name using WMI and Hardware IDs (VID/PID).
        Useful if the printer name changes but the hardware is the same.
        """
        try:
            wmi = win32com.client.GetObject("winmgmts:")
            # Escape backslashes for WMI query if needed, but LIKE '%...' is easier
            query = f"SELECT * FROM Win32_PnPEntity WHERE DeviceID LIKE '%VID_{self.vid}&PID_{self.pid}%'"
            devices = wmi.ExecQuery(query)
            
            for device in devices:
                # The Caption usually matches the Printer Name in Control Panel for printers
                caption = device.Caption
                if caption:
                    logger.info(f"Found Printer via Hardware ID (VID_{self.vid}): {caption}")
                    return caption
        except Exception as e:
            logger.error(f"Failed to query WMI for printer ID: {e}")
        return None

    def get_printer(self):
        # 1. Try to resolves name by Hardware ID first (User Request)
        hw_name = self._find_printer_by_hardware_id()
        if hw_name:
             self.printer_name = hw_name

        # 2. Verify this name exists in system printers
        printers = [p[2] for p in win32print.EnumPrinters(win32print.PRINTER_ENUM_LOCAL | win32print.PRINTER_ENUM_CONNECTIONS)]
        
        # Exact match check
        for p in printers:
            if self.printer_name.lower() == p.lower():
                return p
        
        # Fuzzy match check
        for p in printers:
            if self.printer_name.lower() in p.lower():
                logger.info(f"Fuzzy matching '{self.printer_name}' to '{p}'")
                return p
                
        return None

    def print_image(self, image_path, copies=1, is_bw=False):
        # DUAL PRINTER STRATEGY
        # We switch the logical printer based on color mode.
        # This allows the User to specifically configure "EPSON L3210 BW" with 
        # Grayscale presets in Windows, completely separate from the Color one.
        
        target_name = "EPSON L3210 Series" # Default / Color
        
        logger.info(f"--- PRINT REQUEST DEBUG ---")
        logger.info(f"is_bw flag: {is_bw}")

        if is_bw:
            # Check if BW printer exists
            # We assume it was named "EPSON L3210 BW"
            bw_name = "EPSON L3210 BW"
            target_name = bw_name
            logger.info(f"Mode is Black & White -> Selected Printer: {target_name}")
        else:
            logger.info(f"Mode is Color -> Selected Printer: {target_name}")

        # Basic verification it exists (optional but good)
        # We can just rely on CreateDC failing if it doesn't
        printer_name = target_name
            
        try:
            # SIMPLIFIED STRATEGY:
            # We rely 100% on the User's Saved Default Settings (The Preset).
            # We do NOT touch DEVMODE, because doing so often resets private driver settings
            # (like Borderless, Glossy, Print Preview status, etc).
            
            logger.info(f"Printing to {printer_name} using System Default Settings (Preset)")

            for i in range(copies):
                # Standard DC Creation uses the User's Default Preferences automatically
                hDC = win32ui.CreateDC()
                hDC.CreatePrinterDC(printer_name)

                # Get Dimensions
                target_width = hDC.GetDeviceCaps(win32con.HORZRES)
                target_height = hDC.GetDeviceCaps(win32con.VERTRES)

                bmp = Image.open(image_path)
                
                # Dynamic Color Handling:
                # We NOW trust the Driver Preset completely.
                # If we selected "EPSON L3210 BW", the driver is set to Grayscale.
                # If we selected "EPSON L3210 Series", the driver is set to Color.
                # So we simply convert to RGB (standard GDI input) and send it.
                
                logger.info(f"Sending image to {printer_name} (Driver controls Color/BW)")
                if bmp.mode != "RGB":
                    bmp = bmp.convert("RGB")

                hDC.StartDoc(f"{image_path} - Copy {i+1}")
                hDC.StartPage()

                dib = ImageWin.Dib(bmp)
                dib.draw(hDC.GetHandleOutput(), (0, 0, target_width, target_height))

                hDC.EndPage()
                hDC.EndDoc()
                hDC.DeleteDC()
                
            logger.info(f"Sent {copies} copies to {printer_name}")
            return True
            
        except Exception as e:
            logger.error(f"Printing failed: {e}")
            return False
