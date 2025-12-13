
import os
from processor import ImageProcessor

OUTPUT_DIR = "test_outputs"
TEST_STRIP = os.path.join(OUTPUT_DIR, "test_color_After Dark Pop.jpg")
RESULT_PATH = os.path.join(OUTPUT_DIR, "borderless_layout_test.png")

def test():
    if not os.path.exists(TEST_STRIP):
        print(f"❌ Source strip not found: {TEST_STRIP}. Run test_all_frames.py first.")
        return

    print("Initializing Processor...")
    processor = ImageProcessor()
    
    print(f"Creating 4x6 Borderless Layout from {os.path.basename(TEST_STRIP)}...")
    result = processor.create_4x6_layout(TEST_STRIP, RESULT_PATH)
    
    if result and os.path.exists(result):
        print(f"✅ Success! Saved to {result}")
        print("Expected Specs: 1200x1800 px, with border overlay.")
    else:
        print("❌ Failed to create layout.")

if __name__ == "__main__":
    test()
