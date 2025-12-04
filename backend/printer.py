import win32print
import win32ui
import win32con
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
            
            bmp = Image.open(image_path)
            if bmp.mode != "RGB":
                bmp = bmp.convert("RGB")

            hDC.StartDoc(image_path)
            hDC.StartPage()

            dib = ImageWin.Dib(bmp)
            
            # Get printable area
            horzres = hDC.GetDeviceCaps(win32con.HORZRES)
            vertres = hDC.GetDeviceCaps(win32con.VERTRES)
            
            # Scale image to fit page (simple fit)
            # For photostrips, we might want specific scaling
            
            dib.draw(hDC.GetHandleOutput(), (0, 0, horzres, vertres))

            hDC.EndPage()
            hDC.EndDoc()
            hDC.DeleteDC()
            logger.info(f"Sent {image_path} to printer {printer_name}")
            return True
        except Exception as e:
            logger.error(f"Printing failed: {e}")
            return False
