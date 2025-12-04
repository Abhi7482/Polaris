from PIL import Image, ImageOps, ImageFilter
import logging
import os

logger = logging.getLogger(__name__)

class ImageProcessor:
    def __init__(self):
        self.strip_width = 1200 # Example high res width
        self.strip_height = 1800 # Example 4x6 ratio or similar
        self.photo_size = (500, 375) # 4:3 aspect ratio roughly

    def create_strip(self, photo_paths, template_path=None, output_path="output.jpg", filter_type="color"):
        try:
            # Create base canvas
            canvas = Image.new("RGB", (self.strip_width, self.strip_height), "white")
            
            # Load photos
            images = []
            for path in photo_paths:
                img = Image.open(path)
                if filter_type == "bw":
                    img = ImageOps.grayscale(img)
                img = ImageOps.fit(img, self.photo_size, method=Image.Resampling.LANCZOS)
                images.append(img)

            # Paste photos (Simple vertical layout for now)
            # Adjust coordinates based on actual template
            y_offset = 100
            for img in images:
                x_offset = (self.strip_width - self.photo_size[0]) // 2
                canvas.paste(img, (x_offset, y_offset))
                y_offset += self.photo_size[1] + 20

            # Apply template overlay if exists
            if template_path and os.path.exists(template_path):
                overlay = Image.open(template_path).convert("RGBA")
                overlay = overlay.resize((self.strip_width, self.strip_height))
                canvas.paste(overlay, (0, 0), overlay)

            canvas.save(output_path, quality=95)
            logger.info(f"Photostrip saved to {output_path}")
            return output_path
        except Exception as e:
            logger.error(f"Processing failed: {e}")
            return None
