
import os
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from processor import ImageProcessor

# Setup Output Directory
OUTPUT_DIR = "test_outputs"
if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)

# Setup Real Photos
print("Locating real photos in backend/captures...")
captures_dir = "backend/captures"
photo_paths = []

if os.path.exists(captures_dir):
    all_files = [f for f in os.listdir(captures_dir) if f.endswith(".jpg")]
    # Sort to get latest session potentially
    all_files.sort()
    
    if len(all_files) >= 4:
        # Take the last 4 photos (simulating latest session)
        photo_paths = [os.path.join(captures_dir, f) for f in all_files[-4:]]
        print(f"Using 4 real photos: {[os.path.basename(p) for p in photo_paths]}")
    else:
        print("Not enough real photos found (<4). Falling back to dummy.")

# Fallback to dummy if real photos missing
if not photo_paths:
    def create_dummy_photo(text, color):
        img = Image.new('RGB', (1000, 1500), color)
        draw = ImageDraw.Draw(img)
        draw.line((0, 0) + img.size, fill="white", width=20)
        draw.line((0, img.size[1], img.size[0], 0), fill="white", width=20)
        draw.rectangle((0,0,999,1499), outline="black", width=20)
        return img

    print("Generating dummy photos...")
    colors = ["#FF5733", "#33FF57", "#3357FF", "#F0F"]
    for i, col in enumerate(colors):
        p_path = f"dummy_{i}.jpg"
        img = create_dummy_photo(f"Photo {i+1}", col)
        img.save(p_path)
        photo_paths.append(p_path)

processor = ImageProcessor()

# Scan Frames
frame_dirs = {
    "color": "backend/assets/frames/color",
    "bw": "backend/assets/frames/bw"
}

print(f"Starting Batch Test...")

for filter_type, folder in frame_dirs.items():
    if not os.path.exists(folder):
        print(f"Skipping {folder} - does not exist")
        continue
        
    for filename in os.listdir(folder):
        if not filename.endswith(".png"): continue
        
        frame_id = os.path.splitext(filename)[0] # e.g. "After Dark Pop"
        print(f"Testing Frame: [{filter_type}] {frame_id}")
        
        output_filename = f"test_{filter_type}_{frame_id}.jpg"
        output_path = os.path.join(OUTPUT_DIR, output_filename)
        
        try:
            result = processor.create_strip(
                photo_paths=photo_paths,
                output_path=output_path,
                filter_type=filter_type,
                frame_id=frame_id
            )
            
            if result:
                print(f"  ✅ Saved to {output_path}")
            else:
                print(f"  ❌ Failed to process {frame_id}")
                
        except Exception as e:
            print(f"  ❌ Exception for {frame_id}: {e}")

print("Batch Test Complete!")
print(f"Check the '{OUTPUT_DIR}' folder.")
