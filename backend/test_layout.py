from processor import ImageProcessor
from PIL import Image
import os

def test_layout():
    p = ImageProcessor()
    
    # Create dummy strip (1875x5625)
    dummy_strip = Image.new("RGB", (1875, 5625), "blue")
    dummy_path = "test_strip_source.jpg"
    dummy_strip.save(dummy_path)
    
    output_path = "test_4x6_result.png"
    
    print("Generating 4x6 layout...")
    result = p.create_4x6_layout(dummy_path, output_path)
    
    if result and os.path.exists(result):
        img = Image.open(result)
        print(f"SUCCESS: Generated {result}")
        print(f"Dimensions: {img.size}") # Should be 1200x1800
    else:
        print("FAILED: No output generated.")

if __name__ == "__main__":
    test_layout()
