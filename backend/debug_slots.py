
import cv2
import numpy as np
import os

# Adjust this to point to a real frame
FRAME_PATH = "backend/assets/frames/color/After Dark Pop.png" 

def debug_slots(template_path):
    print(f"Analyzing: {template_path}")
    if not os.path.exists(template_path):
        print("File not found!")
        return

    # Load image
    img = cv2.imread(template_path, cv2.IMREAD_UNCHANGED)
    if img is None:
        print("Failed to load image via cv2")
        return
        
    if img.shape[2] < 4:
        print("No alpha channel")
        return

    alpha = img[:, :, 3]
    h_img, w_img = alpha.shape

    # Current Logic (simulate processor.py)
    # Threshold < 10 is considered "Hole"
    _, thresh = cv2.threshold(alpha, 10, 255, cv2.THRESH_BINARY_INV)
    
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    # Draw results on a debug image (RGB)
    debug_img = cv2.cvtColor(img, cv2.COLOR_BGRA2BGR)
    
    detected_slots = []
    
    for i, cnt in enumerate(contours):
        x, y, w, h = cv2.boundingRect(cnt)
        if w > 100 and h > 100:
            detected_slots.append((x, y, w, h))
            print(f"Slot {i}: x={x}, y={y}, w={w}, h={h}")
            
            # BLUE Rectangle = The detected hole
            cv2.rectangle(debug_img, (x, y), (x+w, y+h), (255, 0, 0), 5)
            
            # GREEN Rectangle = Inflated by 20px (Proposal)
            pad = 20
            cv2.rectangle(debug_img, (x-pad, y-pad), (x+w+pad, y+h+pad), (0, 255, 0), 3)

    # Sort top-to-bottom
    detected_slots.sort(key=lambda s: s[1])
    print(f"Total valid slots: {len(detected_slots)}")

    output_file = "debug_slots_output.jpg"
    cv2.imwrite(output_file, debug_img)
    print(f"Saved debug view to {output_file}")

if __name__ == "__main__":
    debug_slots(FRAME_PATH)
