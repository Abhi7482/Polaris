from PIL import Image, ImageOps, ImageFilter
import logging
import os

logger = logging.getLogger(__name__)

class ImageProcessor:
    def __init__(self):
        self.strip_width = 1875
        self.strip_height = 5625
        # Exact coordinates from analysis
        self.frame_coordinates = {
            "regular": [
                (104, 105, 1667, 1141),
                (104, 1351, 1667, 1142),
                (104, 2599, 1667, 1142),
                (104, 3846, 1667, 1142)
            ],
            "vintage": [
                (89, 89, 1701, 1157),
                (99, 1351, 1701, 1142),
                (99, 2599, 1701, 1142),
                (99, 3846, 1701, 1142)
            ]
        }

    def create_strip(self, photo_paths, output_path="output.jpg", filter_type="color", frame_id="regular"):
        try:
            # Create base canvas
            canvas = Image.new("RGB", (self.strip_width, self.strip_height), "white")
            
            # Select coordinates based on frame_id, default to regular
            current_slots = self.frame_coordinates.get(frame_id, self.frame_coordinates["regular"])
            
            # Load photos
            images = []
            for i, path in enumerate(photo_paths):
                if i >= len(current_slots): break
                
                img = Image.open(path)
                if filter_type == "bw":
                    img = ImageOps.grayscale(img)
                
                # Get slot dimensions
                x, y, w, h = current_slots[i]
                
                # Manual Fit (Resize & Crop) to ensure no stretching
                img_ratio = img.width / img.height
                target_ratio = w / h
                
                logger.info(f"Photo {i}: Input {img.size} (Ratio {img_ratio:.2f}), Target {w}x{h} (Ratio {target_ratio:.2f})")

                if img_ratio > target_ratio:
                    # Image is wider than slot -> Resize by height, crop width
                    new_height = h
                    new_width = int(new_height * img_ratio)
                    img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
                    # Center Crop
                    left = (new_width - w) // 2
                    img = img.crop((left, 0, left + w, h))
                else:
                    # Image is taller/narrower than slot -> Resize by width, crop height
                    new_width = w
                    new_height = int(new_width / img_ratio)
                    img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
                    # Center Crop
                    top = (new_height - h) // 2
                    img = img.crop((0, top, w, top + h))
                
                # Paste at exact coordinates
                canvas.paste(img, (x, y))

            # Apply template overlay if exists
            # Apply template overlay if exists
            print(f"DEBUG: Frame ID: {frame_id}, Filter: {filter_type}")
            if frame_id and frame_id != "default":
                # Construct path based on filter and frame_id
                # Example: assets/frames/color/color_regular.png
                # frame_id will be passed as 'regular' or 'vintage'
                template_filename = f"{filter_type}_{frame_id}.png"
                template_path = os.path.join("assets", "frames", filter_type, template_filename)
                
                print(f"DEBUG: Checking template path: {template_path}")
                if os.path.exists(template_path):
                    overlay = Image.open(template_path).convert("RGBA")
                    overlay = overlay.resize((self.strip_width, self.strip_height))
                    canvas.paste(overlay, (0, 0), overlay)
                    logger.info(f"Applied overlay: {template_path}")
                    print(f"DEBUG: Applied overlay successfully")
                else:
                    logger.warning(f"Template not found: {template_path}")
                    print(f"DEBUG: Template NOT found")
            else:
                print("DEBUG: No frame selected or default frame")

            canvas.save(output_path, quality=95)
            logger.info(f"Photostrip saved to {output_path}")
            return output_path
        except Exception as e:
            logger.error(f"Processing failed: {e}")
            return None
