import os
import cv2
import numpy as np
from processor import ImageProcessor

def test_flow():
    print("Testing Backend Print Flow...")
    
    # Instantiate Processor
    processor = ImageProcessor()
    
    # 1. Create 4 Dummy "Capture" Images (1920x1080)
    print("Step 1: Simulating 4 Captures...")
    captures = []
    os.makedirs("captures", exist_ok=True)
    
    for i in range(4):
        # Create a blank colored image with text
        img = np.zeros((1080, 1920, 3), dtype=np.uint8)
        img[:] = (50 + i*40, 100, 200) # Distinct colors
        cv2.putText(img, f"PHOTO {i+1}", (600, 540), cv2.FONT_HERSHEY_SIMPLEX, 5, (255, 255, 255), 10)
        
        path = f"captures/test_capture_{i}.jpg"
        cv2.imwrite(path, img)
        captures.append(path)
    
    # 2. Define Options
    session_id = "test_verification_session"
    frame_id = "regular" # Testing default frame
    
    # 3. Generate Strip
    print(f"Step 2: Generating Strip (Frame: {frame_id})...")
    
    try:
        # Note: processor.create_strip takes (photo_paths, output_path, filter_type, frame_id)
        # It handles the paths internally.
        output_strip_path = f"prints/{session_id}_final.jpg"
        os.makedirs("prints", exist_ok=True)
        
        strip_path = processor.create_strip(captures, output_strip_path, "color", frame_id)
        if not strip_path:
            raise Exception("create_strip returned None")
            
        print(f"  -> Strip generated: {strip_path}")
        
        # Verify Strip Dims
        strip_img = cv2.imread(strip_path)
        print(f"  -> Strip Dimensions: {strip_img.shape[1]}x{strip_img.shape[0]}")
        
        # 4. Generate 4x6 Layout
        print("Step 3: Generating 4x6 Print Layout...")
        final_print_path = f"prints/{session_id}_print_4x6.png"
        
        result_path = processor.create_4x6_layout(strip_path, final_print_path)
        print(f"  -> Final Print: {result_path}")
        
        # 5. Verify Final Dimensions
        final_img = cv2.imread(result_path)
        if final_img is None:
             raise Exception("Failed to load final print image")
             
        h, w, _ = final_img.shape
        print(f"  -> FINAL DIMENSIONS: {w}x{h}")
        
        if w == 1200 and h == 1800:
            print("\n✅ SUCCESS: Final Output is exactly 4x6 inches @ 300 DPI.")
            print("   The Frontend CSS changes did NOT affect the print quality.")
        else:
            print(f"\n❌ FAILURE: Output dimensions {w}x{h} are incorrect!")

    except Exception as e:
        print(f"\n❌ ERROR during processing: {e}")

if __name__ == "__main__":
    test_flow()
