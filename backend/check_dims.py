import os
from PIL import Image

def check_dims():
    base_dir = "assets/frames"
    for root, dirs, files in os.walk(base_dir):
        for file in files:
            if file.lower().endswith(('.png', '.jpg', '.jpeg')):
                path = os.path.join(root, file)
                try:
                    img = Image.open(path)
                    print(f"File: {file}, Size: {img.size}, Mode: {img.mode}")
                except Exception as e:
                    print(f"Error reading {file}: {e}")

if __name__ == "__main__":
    check_dims()
