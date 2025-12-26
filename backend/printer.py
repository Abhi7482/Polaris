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

    def _resolve_printer_name(self, target_name):
        """
        Finds the actual installed printer name that matches or contains the target_name.
        This handles cases where the printer might be named "EPSON L3210 BW (Copy 1)"
        """
        try:
            printers = [p[2] for p in win32print.EnumPrinters(win32print.PRINTER_ENUM_LOCAL | win32print.PRINTER_ENUM_CONNECTIONS)]
            
            # 1. Exact Match
            for p in printers:
                if target_name.lower() == p.lower():
                    return p
            
            # 2. Fuzzy Match (Contains)
            # We explicitly look for "BW" if target is BW
            is_target_bw = "bw" in target_name.lower()
            
            for p in printers:
                if target_name.lower() in p.lower():
                    # Sanity check: If looking for normal, exclude BW
                    # If looking for BW, ensure it has BW
                    if is_target_bw and "bw" not in p.lower():
                        continue
                    if not is_target_bw and "bw" in p.lower():
                        continue
                        
                    return p
            
            logger.warning(f"Printer '{target_name}' not found in installed printers: {printers}")
            return None
            
        except Exception as e:
            logger.error(f"Failed to enumerate printers: {e}")
            return None

    def get_printer(self):
        # 1. Try to resolves name by Hardware ID first (User Request)
        hw_name = self._find_printer_by_hardware_id()
        if hw_name:
             self.printer_name = hw_name

        # 2. Verify this name exists in system printers
        return self._resolve_printer_name(self.printer_name)

    def print_image(self, image_path, copies=1, is_bw=False):
        # DUAL PRINTER STRATEGY
        # We switch the logical printer based on color mode.
        # This allows the User to specifically configure "EPSON L3210 BW" with 
        # Grayscale presets in Windows, completely separate from the Color one.
        
        target_name_key = "EPSON L3210 Series" # Default / Color
        
        logger.info(f"--- PRINT REQUEST DEBUG ---")
        logger.info(f"is_bw flag: {is_bw}")

        if is_bw:
            # Check if BW printer exists
            # We assume it is named roughly "EPSON L3210 BW"
            target_name_key = "EPSON L3210 BW"
            logger.info(f"Mode is Black & White -> Looking for Printer matching: {target_name_key}")
        else:
            logger.info(f"Mode is Color -> Looking for Printer matching: {target_name_key}")

        # Resolve actual system name
        printer_name = self._resolve_printer_name(target_name_key)
        
        if not printer_name:
            logger.error(f"CRITICAL: Could not find a printer matching '{target_name_key}'. Printing aborted.")
            # Fallback to default if BW not found?
            # Maybe safe to fallback to Color printer for BW content than fail?
            if is_bw:
                logger.info("Attempting fallback to Color printer...")
                printer_name = self._resolve_printer_name("EPSON L3210 Series")
                if not printer_name:
                     return False
            else:
                return False

        try:
            # SIMPLIFIED STRATEGY:
            # We rely 100% on the User's Saved Default Settings (The Preset).
            # We do NOT touch DEVMODE, because doing so often resets private driver settings
            # (like Borderless, Glossy, Print Preview status, etc).
            
            logger.info(f"Printing {copies} copies to '{printer_name}' using System Default Settings")

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
                
                logger.info(f"Finished Copy {i+1}/{copies}")
                import time
                time.sleep(2) # Safety delay for printer queue

                
            logger.info(f"Successfully sent {copies} copies to {printer_name}")
            return True
            
        except Exception as e:
            logger.error(f"Printing failed: {e}")
            return False
