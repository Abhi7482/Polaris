
import cv2
import os

FILE_PATH = "borderless.png" # User said it's in the root (Polaris/borderless.png)
if not os.path.exists(FILE_PATH):
    # Try finding it in the user's uploaded context or root
    FILE_PATH = "c:\\Users\\abhis\\OneDrive\\Documents\\Polaris\\borderless.png"

def analyze():
    print(f"Analyzing {FILE_PATH}...")
    img = cv2.imread(FILE_PATH, cv2.IMREAD_UNCHANGED)
    
    if img is None:
        print("❌ Could not load image.")
        return

    h, w, c = img.shape
    print(f"Dimensions: {w}x{h}, Channels: {c}")
    
    if c < 4:
        print("❌ No alpha channel found.")
        return

    alpha = img[:, :, 3]
    _, thresh = cv2.threshold(alpha, 10, 255, cv2.THRESH_BINARY_INV)
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    detected_slots = []
    
    print(f"\nFound {len(contours)} transparent regions:")
    
    for i, cnt in enumerate(contours):
        x, y, cw, ch = cv2.boundingRect(cnt)
        if cw > 100 and ch > 100:
            print(f"  Region {i}: x={x}, y={y}, w={cw}, h={ch}")
            detected_slots.append((x, y, cw, ch))
            
            # Check fit
            fits_width = (cw >= 1150) # 575 * 2
            fits_height = (ch >= 1730)
            print(f"    Fits double strip (1150x1730)? Width: {'YES' if fits_width else 'NO'}, Height: {'YES' if fits_height else 'NO'}")

    if not detected_slots:
        print("❌ No large transparent regions found.")

if __name__ == "__main__":
    analyze()
