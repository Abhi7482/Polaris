from printer import PrinterService
from PIL import Image, ImageDraw, ImageFont
import os
import time

def create_test_image(filename, text_color="black", bg_color="white", label="TEST"):
    # 4x6 inch @ 300 DPI = 1200x1800 px
    W, H = 1200, 1800
    
    img = Image.new("RGB", (W, H), bg_color)
    draw = ImageDraw.Draw(img)
    
    # Draw Border Rect (to check cut-off)
    # If borderless is working, this should be very close to edge
    draw.rectangle([0, 0, W-1, H-1], outline="black", width=10)
    
    # Draw Center Line
    draw.line([W//2, 0, W//2, H], fill="red", width=5)
    
    try:
        font = ImageFont.truetype("arial.ttf", 80)
    except:
        font = ImageFont.load_default()
        
    draw.text((100, 200), f"STRIP 1\n{label}", fill=text_color, font=font)
    draw.text((W//2 + 100, 200), f"STRIP 2\n{label}", fill=text_color, font=font)
    
    # Color Test Circles
    draw.ellipse([200, 600, 400, 800], fill="red", outline="black")
    draw.ellipse([W//2 + 200, 600, W//2 + 400, 800], fill="blue", outline="black")
    
    img.save(filename)
    return filename

def test_printing():
    print("--- Starting Comprehensive Print Test ---")
    service = PrinterService()
    print(f"Printer: {service.get_printer()}")
    
    # 1. Color Test
    print("\n1. sending COLOR job...")
    img_color = create_test_image("test_color.png", label="COLOR MODE\n(Should be Borderless)")
    service.print_image(os.path.abspath(img_color), copies=1, is_bw=False)
    
    # 2. B&W Test
    print("\n2. sending B&W job (Driver Switch)...")
    img_bw = create_test_image("test_bw.png", label="B&W MODE\n(Red/Blue should be Grey)")
    service.print_image(os.path.abspath(img_bw), copies=1, is_bw=True)
    
    print("\nDone! Check printer for 2 sheets.")

if __name__ == "__main__":
    test_printing()
