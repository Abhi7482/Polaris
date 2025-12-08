import cv2
import numpy as np

def analyze_transparency(image_path):
    # Read image with alpha channel
    img = cv2.imread(image_path, cv2.IMREAD_UNCHANGED)
    
    if img is None:
        print(f"Could not read {image_path}")
        return

    if img.shape[2] < 4:
        print("Image does not have an alpha channel")
        return

    # Extract alpha channel
    alpha = img[:, :, 3]

    # Find where alpha is 0 (fully transparent) or low
    # We'll treat anything with alpha < 10 as transparent
    ret, mask = cv2.threshold(alpha, 10, 255, cv2.THRESH_BINARY_INV)

    # Find contours of transparent regions
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    print(f"Found {len(contours)} transparent regions:")
    
    # Sort contours by Y position (top to bottom)
    bounding_boxes = [cv2.boundingRect(c) for c in contours]
    bounding_boxes.sort(key=lambda x: x[1])

    for i, box in enumerate(bounding_boxes):
        x, y, w, h = box
        # Filter out tiny noise
        if w > 100 and h > 100:
            print(f"Slot {i+1}: x={x}, y={y}, w={w}, h={h}")

if __name__ == "__main__":
    # Test with one of the frames
    path = "assets/frames/bw/bw_vintage.png"
    print(f"Analyzing {path}...")
    analyze_transparency(path)
