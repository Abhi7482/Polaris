
import os
import logging
from printer import PrinterService

# Setup Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_dual():
    printer = PrinterService()
    
    # Use an existing sample image (ensure one exists)
    # searching for one...
    base_dir = os.path.dirname(os.path.abspath(__file__))
    sample_dir = os.path.join(base_dir, "assets", "frames") 
    # Actually let's use a generated print if available?
    # Or just use a dummy red image for color and grey for bw?
    
    # Let's generate dummy images to be sure
    from PIL import Image, ImageDraw
    
    # 1. Color Test Image (Ink Saver)
    img_color_path = "test_color_minimal.png"
    # White background
    img_c = Image.new("RGB", (1200, 1800), "white")
    d_c = ImageDraw.Draw(img_c)
    # Minimal Red Text
    d_c.text((100, 800), "COLOR PRINTER TEST", fill="red", size=100)
    d_c.text((100, 1000), "Should match Color Settings", fill="black", size=50)
    # Thin border to check edges
    d_c.rectangle([0,0,1199,1799], outline="red", width=5)
    img_c.save(img_color_path)
    
    # 2. BW Test Image (Ink Saver)
    img_bw_path = "test_bw_minimal.png"
    img_b = Image.new("RGB", (1200, 1800), "white")
    d_b = ImageDraw.Draw(img_b)
    d_b.text((100, 800), "BW PRINTER TEST", fill="black", size=100)
    d_b.text((100, 1000), "Should match BW Settings", fill="black", size=50)
    d_b.rectangle([0,0,1199,1799], outline="black", width=5)
    img_b.save(img_bw_path)
    
    print("--- Starting Dual Print Test (Ink Saver Mode) ---")
    
    print("1. Sending COLOR Job (Minimal Red Text) -> Should go to 'EPSON L3210 Series'")
    printer.print_image(os.path.abspath(img_color_path), is_bw=False)
    
    print("\n2. Sending BW Job (Minimal Black Text) -> Should go to 'EPSON L3210 BW'")
    printer.print_image(os.path.abspath(img_bw_path), is_bw=True)
    
    print("\nDone! Check your printer for 2 new sheets.")

if __name__ == "__main__":
    test_dual()
