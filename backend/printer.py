import win32print
import win32ui
import win32con
import win32gui
from PIL import Image, ImageWin
import logging

logger = logging.getLogger(__name__)

class PrinterService:
    def __init__(self, printer_name="Epson L3210"):
        self.printer_name = printer_name

    def get_printer(self):
        printers = [p[2] for p in win32print.EnumPrinters(win32print.PRINTER_ENUM_LOCAL | win32print.PRINTER_ENUM_CONNECTIONS)]
        for p in printers:
            if self.printer_name.lower() in p.lower():
                return p
        return None

    def print_image(self, image_path):
        printer_name = self.get_printer()
        if not printer_name:
            # Fallback to default printer if specific one not found
            printer_name = win32print.GetDefaultPrinter()
            logger.warning(f"Target printer not found, using default: {printer_name}")
            
        try:
            hDC = win32ui.CreateDC()
            hDC.CreatePrinterDC(printer_name)
            
            # Get printer DPI
            logpixelsx = hDC.GetDeviceCaps(win32con.LOGPIXELSX)
            logpixelsy = hDC.GetDeviceCaps(win32con.LOGPIXELSY)
            
            # Target size: 2x6 inches
            # Calculate target pixels based on DPI
            target_width = int(2 * logpixelsx)
            target_height = int(6 * logpixelsy)
            
            logger.info(f"Printer DPI: {logpixelsx}x{logpixelsy}")
            logger.info(f"Printing size: {target_width}x{target_height} pixels (2x6 inches)")

            bmp = Image.open(image_path)
            if bmp.mode != "RGB":
                bmp = bmp.convert("RGB")

            hDC.StartDoc(image_path)
            hDC.StartPage()

            dib = ImageWin.Dib(bmp)
            
            # Draw image to specific 2x6 inch area at (0,0)
            # This ensures that if 2x6 paper is loaded, it prints on it.
            # If Letter paper is loaded, it prints in the top-left corner.
            dib.draw(hDC.GetHandleOutput(), (0, 0, target_width, target_height))

            hDC.EndPage()
            hDC.EndDoc()
            hDC.DeleteDC()
            logger.info(f"Sent {image_path} to printer {printer_name}")
            return True
        except Exception as e:
            logger.error(f"Printing failed: {e}")
            return False
