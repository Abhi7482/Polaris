
import os
import logging
from processor import ImageProcessor

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_frames():
    processor = ImageProcessor()
    
    # Define inputs (using REAL CAPTURES)
    base_captures = os.path.join(os.path.dirname(__file__), "captures")
    dummy_photos = [
        os.path.join(base_captures, "2f4fc58d-0536-4235-9ff8-c932cd89d7ce_1.jpg"),
        os.path.join(base_captures, "2f4fc58d-0536-4235-9ff8-c932cd89d7ce_2.jpg"),
        os.path.join(base_captures, "2f4fc58d-0536-4235-9ff8-c932cd89d7ce_3.jpg"),
        os.path.join(base_captures, "2f4fc58d-0536-4235-9ff8-c932cd89d7ce_4.jpg")
    ]
    
    # Frames to test
    frames_to_test = [
        "Techno",
        "Pink Royale Inso", 
        "Classic Insomania", 
        "Vintage Insomania"
    ]
    
    print("--- Starting Frame Test ---")
    
    for frame_id in frames_to_test:
        print(f"Testing Frame: {frame_id}")
        output_filename = f"test_output_{frame_id.replace(' ', '_')}.jpg"
        output_path = os.path.join(os.path.dirname(__file__), output_filename)
        
        # Decide filter type (bw vs color) mainly to test both paths, though frame is agnostic if not enforced
        # Let's verify both.
        
        # Test Color
        res_color = processor.create_strip(
            dummy_photos, 
            output_path=output_path, 
            filter_type="color", 
            frame_id=frame_id
        )
        
        if res_color:
            print(f"  [SUCCESS] Created {output_filename}")
        else:
            print(f"  [FAILED] Could not create {output_filename}")

    print("--- Test Complete ---")

if __name__ == "__main__":
    test_frames()
