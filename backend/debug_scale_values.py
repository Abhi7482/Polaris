
import cv2
import os
from PIL import Image

# Config
FRAME_PATH = "backend/assets/frames/color/After Dark Pop.png"
STRIP_WIDTH = 1875
STRIP_HEIGHT = 5625
SLOT_PADDING = 30

def debug_math():
    if not os.path.exists(FRAME_PATH):
        print(f"File not found: {FRAME_PATH}")
        return

    print(f"--- Debugging: {os.path.basename(FRAME_PATH)} ---")
    
    # 1. Source Dimensions
    with Image.open(FRAME_PATH) as img:
        src_w, src_h = img.size
    print(f"Source Dims: {src_w}x{src_h}")
    print(f"Target Dims: {STRIP_WIDTH}x{STRIP_HEIGHT}")
    
    scale_x = STRIP_WIDTH / src_w
    scale_y = STRIP_HEIGHT / src_h
    print(f"Scale Factors: X={scale_x:.4f}, Y={scale_y:.4f}")

    # 2. Raw Detection (Simulated)
    cv_img = cv2.imread(FRAME_PATH, cv2.IMREAD_UNCHANGED)
    alpha = cv_img[:, :, 3]
    _, thresh = cv2.threshold(alpha, 10, 255, cv2.THRESH_BINARY_INV)
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    raw_slots = []
    for cnt in contours:
        x, y, w, h = cv2.boundingRect(cnt)
        if w > 100 and h > 100: # Filter noise
            raw_slots.append((x, y, w, h))
    
    raw_slots.sort(key=lambda s: s[1])
    
    print(f"\nFound {len(raw_slots)} raw slots (Before Padding):")
    for i, (x, y, w, h) in enumerate(raw_slots):
        print(f"  Slot {i}: x={x}, y={y}, w={w}, h={h}")

    # 3. Apply Padding & Scaling
    print("\nApplied Math (Padding -> Scaling):")
    for i, (raw_x, raw_y, raw_w, raw_h) in enumerate(raw_slots):
        # Padding
        pad_x = max(0, raw_x - SLOT_PADDING)
        pad_y = max(0, raw_y - SLOT_PADDING)
        pad_w = raw_w + (SLOT_PADDING * 2)
        pad_h = raw_h + (SLOT_PADDING * 2)
        
        # Scaling
        final_x = int(pad_x * scale_x)
        final_y = int(pad_y * scale_y)
        final_w = int(pad_w * scale_x)
        final_h = int(pad_h * scale_y)
        
        print(f"  Slot {i}:")
        print(f"    Raw:     {raw_x}, {raw_y}, {raw_w}x{raw_h}")
        print(f"    Padded:  {pad_x}, {pad_y}, {pad_w}x{pad_h} (+{SLOT_PADDING}px)")
        print(f"    Scaled:  {final_x}, {final_y}, {final_w}x{final_h}")
        print(f"    Bottom:  {final_y + final_h}")

        # Check Overlap with Next
        if i > 0:
            prev_bottom = last_bottom
            gap = final_y - prev_bottom
            print(f"    Gap from prev: {gap} px")
            if gap < 0:
                print("    ⚠️ OVERLAP DETECTED!")
        
        last_bottom = final_y + final_h

if __name__ == "__main__":
    debug_math()
