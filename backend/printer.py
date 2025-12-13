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
        printer_name = self.get_printer()
        if not printer_name:
            # Fallback
            printer_name = win32print.GetDefaultPrinter()
            logger.warning(f"Target printer not found, using default: {printer_name}")
            
        try:
            # 1. Get User's Effective DEVMODE using DocumentProperties
            # GetPrinter only returns the system defaults (Printing Defaults).
            # DocumentProperties returns the current user's preferences (Printing Preferences).
            hPrinter = win32print.OpenPrinter(printer_name)
            try:
                # DM_OUT_BUFFER = 2, DM_IN_BUFFER = 8 (not needed here as we aren't passing one in)
                # mode=2 (DM_OUT_BUFFER) returns the DevMode
                devmode = win32print.DocumentProperties(0, hPrinter, printer_name, None, None, 2)
            finally:
                win32print.ClosePrinter(hPrinter)
            
            # 2. Modify DEVMODE for B&W if needed
            if is_bw:
                logger.info("Configuring driver for MONOCHROME processing")
                devmode.Color = win32con.DMCOLOR_MONOCHROME
            else:
                devmode.Color = win32con.DMCOLOR_COLOR

            for i in range(copies):
                # 3. Create DC with modified DEVMODE
                # Use win32gui to create DC using specific devmode, then wrap with win32ui
                hDC_handle = win32gui.CreateDC("WINSPOOL", printer_name, devmode)
                hDC = win32ui.CreateDCFromHandle(hDC_handle)
                
                # Use full printable resolution (HORZRES/VERTRES)
                # This ensures we fill the entire paper, especially for borderless.
                target_width = hDC.GetDeviceCaps(win32con.HORZRES)
                target_height = hDC.GetDeviceCaps(win32con.VERTRES)
                
                if i == 0:
                    log_x = hDC.GetDeviceCaps(win32con.LOGPIXELSX)
                    log_y = hDC.GetDeviceCaps(win32con.LOGPIXELSY)
                    logger.info(f"Printer Logical DPI: {log_x}x{log_y}")
                    logger.info(f"Filling Paper: {target_width}x{target_height} device pixels")

                bmp = Image.open(image_path)
                if bmp.mode != "RGB":
                    bmp = bmp.convert("RGB")

                hDC.StartDoc(f"{image_path} - Copy {i+1}")
                hDC.StartPage()

                dib = ImageWin.Dib(bmp)
                
                # Draw image to specific 4x6 inch area at (0,0)
                dib.draw(hDC.GetHandleOutput(), (0, 0, target_width, target_height))

                hDC.EndPage()
                hDC.EndDoc()
                hDC.DeleteDC()
                
            logger.info(f"Sent {copies} copies to {printer_name} (B&W: {is_bw})")
            return True
        except Exception as e:
            logger.error(f"Printing failed: {e}")
            return False
