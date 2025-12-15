import os
from PIL import Image, ImageDraw, ImageFont

def visualize_layout():
    # Setup Paths
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    OUTPUT_DIR = os.path.join(BASE_DIR, "debug_layout")
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Use actual assets
    # Source Strip (Picking one from the list)
    STRIP_PATH = os.path.join(BASE_DIR, "prints", "9720e3d7-fa08-4d41-a7c9-fa37e2f742c2_final.jpg")
    OVERLAY_PATH = os.path.join(BASE_DIR, "assets", "overlays", "borderless.png")
    
    # 4x6 Standard Dims
    CANVAS_W = 1200
    CANVAS_H = 1800
    STRIP_W = 575
    STRIP_H = 1730
    OFFSET_X = 31
    OFFSET_Y = 35
    
    print(f"Generating steps to {OUTPUT_DIR}...")
    
    # --- STEP 1: Blank Canvas ---
    canvas = Image.new("RGB", (CANVAS_W, CANVAS_H), "white")
    canvas.save(os.path.join(OUTPUT_DIR, "step_1_canvas.png"))
    print("Step 1: Canvas created")
    
    # --- STEP 2: Left Strip ---
    if not os.path.exists(STRIP_PATH):
        print("Source strip not found! Creating dummy.")
        dummy = Image.new("RGB", (1875, 5625), "cyan")
        STRIP_PATH = "dummy_strip.jpg"
        dummy.save(STRIP_PATH)
        
    strip = Image.open(STRIP_PATH)
    strip_resized = strip.resize((STRIP_W, STRIP_H), Image.Resampling.LANCZOS)
    
    canvas.paste(strip_resized, (OFFSET_X, OFFSET_Y))
    canvas.save(os.path.join(OUTPUT_DIR, "step_2_left.png"))
    print("Step 2: Left strip pasted")
    
    # --- STEP 3: Right Strip ---
    canvas.paste(strip_resized, (OFFSET_X + STRIP_W, OFFSET_Y))
    canvas.save(os.path.join(OUTPUT_DIR, "step_3_right.png"))
    print("Step 3: Right strip pasted (Both)")
    
    # --- STEP 4: Overlay ---
    if os.path.exists(OVERLAY_PATH):
        overlay = Image.open(OVERLAY_PATH).convert("RGBA")
        canvas.paste(overlay, (0, 0), overlay)
        canvas.save(os.path.join(OUTPUT_DIR, "step_4_overlay.png"))
        print("Step 4: Overlay applied")
    else:
        print("Overlay not found! Skipping Step 4 visual.")
        
    print("Done.")

if __name__ == "__main__":
    visualize_layout()
