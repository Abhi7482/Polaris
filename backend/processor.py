from PIL import Image, ImageOps, ImageFilter
import logging
import os
import cv2
import numpy as np

logger = logging.getLogger(__name__)

class ImageProcessor:
    def __init__(self):
        self.strip_width = 1875
        self.strip_height = 5625
        # Define base directory relative to this file (backend/)
        self.base_dir = os.path.dirname(os.path.abspath(__file__))
        
        # Fallback coordinates for known types
        self.legacy_coordinates = {
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
        # In-memory cache for detected slots to avoid re-processing every time
        self._slot_cache = {}

    def detect_slots(self, template_path):
        """
        Dynamically detects transparent regions in the frame image.
        Returns a list of (x, y, w, h) tuples sorted top-to-bottom.
        """
        if template_path in self._slot_cache:
            return self._slot_cache[template_path]

        try:
            logger.info(f"Auto-detecting slots for: {template_path}")
            # Load image using OpenCV (reading with Alpha channel)
            img = cv2.imread(template_path, cv2.IMREAD_UNCHANGED)
            if img is None:
                logger.error(f"Could not load image for detection: {template_path}")
                return None
            
            # Extract Alpha channel (index 3)
            if img.shape[2] < 4:
                logger.warning("Image has no alpha channel, cannot detect holes.")
                return None
            
            alpha = img[:, :, 3]

            # Threshold: Find pixels that are fully transparent (or close to it)
            # Binary inverse: Transparent (0) becomes White (255), Opaque becomes Black (0)
            _, thresh = cv2.threshold(alpha, 10, 255, cv2.THRESH_BINARY_INV)

            # Find contours of the transparent holes
            contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

            detected_slots = []
            detected_slots = []
            
            for cnt in contours:
                x, y, w, h = cv2.boundingRect(cnt)
                # Filter out noise - slots must be reasonably large
                if w > 100 and h > 100:
                    detected_slots.append((x, y, w, h))

            # Sort by Y coordinate (Top -> Bottom)
            detected_slots.sort(key=lambda s: s[1])

            # Logic Check: We expect 3 or 4 slots usually
            if len(detected_slots) < 3:
                logger.warning(f"Detected only {len(detected_slots)} slots. Might be noise.")
            
            self._slot_cache[template_path] = detected_slots
            return detected_slots

        except Exception as e:
            logger.error(f"Slot detection failed: {e}")
            return None

    def create_strip(self, photo_paths, output_path="output.jpg", filter_type="color", frame_id="regular"):
        try:
            # Create base canvas
            canvas = Image.new("RGB", (self.strip_width, self.strip_height), "white")
            
            detected_slots = None
            template_path = None

            # 1. Resolve Template Path
            if frame_id and frame_id != "default":
                template_filename = f"{frame_id}.png"
                # Use absolute path to ensure we find it regardless of CWD
                template_path = os.path.join(self.base_dir, "assets", "frames", filter_type, template_filename)
            
            # 2. Try Auto-Detection if template exists
            if template_path and os.path.exists(template_path):
                detected_slots = self.detect_slots(template_path)
                if detected_slots:
                    logger.info(f"Using auto-detected slots for {frame_id}")
            
            # 3. Fallback to Legacy/Hardcoded if auto-detection failed or not applicable
            if not detected_slots:
                logger.info(f"Fallback to legacy coordinates for {frame_id}")
                # Use vintage coords as default fallback for unknown IDs, or regular for standard
                fallback_key = "vintage" if frame_id in ["vintage", "drunken_monkey"] else "regular"
                detected_slots = self.legacy_coordinates.get(fallback_key, self.legacy_coordinates["regular"])

            # 4. Process Photos
            current_slots = detected_slots 
            
            # Determine scaling factors (Source Template -> Target Canvas)
            scale_x = 1.0
            scale_y = 1.0
            
            if template_path and os.path.exists(template_path):
                try:
                    with Image.open(template_path) as tmp_img:
                        src_w, src_h = tmp_img.size
                        scale_x = self.strip_width / src_w
                        scale_y = self.strip_height / src_h
                        # logger.info(f"Scaling slots by X:{scale_x:.3f}, Y:{scale_y:.3f} (Source: {src_w}x{src_h})")
                except Exception as e:
                    logger.warning(f"Could not determine scale factors: {e}")

            images = []
            TARGET_PADDING = 50 # Consistent 50px bleed on target canvas
            
            for i, path in enumerate(photo_paths):
                if i >= len(current_slots): break
                
                img = Image.open(path)
                if filter_type == "bw":
                    img = ImageOps.grayscale(img)
                
                # Get slot dimensions and Apply Scaling
                raw_x, raw_y, raw_w, raw_h = current_slots[i]
                
                # Scale FIRST
                x = int(raw_x * scale_x)
                y = int(raw_y * scale_y)
                w = int(raw_w * scale_x)
                h = int(raw_h * scale_y)
                
                # Apply Safe Padding derived from Target dimensions
                x = max(0, x - TARGET_PADDING)
                y = max(0, y - TARGET_PADDING)
                w += (TARGET_PADDING * 2)
                h += (TARGET_PADDING * 2)

                # Manual Fit (Resize & Crop) to ensure no stretching
                img_ratio = img.width / img.height
                target_ratio = w / h
                
                # logger.info(f"Photo {i}: Input {img.size} (Ratio {img_ratio:.2f}), Target {w}x{h} (Ratio {target_ratio:.2f})")

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

            # 5. Apply template overlay
            if template_path and os.path.exists(template_path):
                overlay = Image.open(template_path).convert("RGBA")
                overlay = overlay.resize((self.strip_width, self.strip_height), Image.Resampling.NEAREST)
                canvas.paste(overlay, (0, 0), overlay)
            
            # 6. Global B&W Enforcement
            if filter_type == "bw":
                # Convert to grayscale and back to RGB to ensure output format remains consistent/compatible
                canvas = ImageOps.grayscale(canvas).convert("RGB")
            
            canvas.save(output_path, quality=95)
            logger.info(f"Photostrip saved to {output_path}")
            return output_path
        except Exception as e:
            logger.error(f"Processing failed: {e}")
            return None

    def create_4x6_layout(self, strip_path, output_path):
        """
        Creates a 4x6 inch composition (1200x1800 px) with two 2x6 strips side-by-side.
        """
        try:
            # Target Canvas: 1200x1800 px (4x6 @ 300 DPI)
            CANVAS_W = 1200
            CANVAS_H = 1800
            
            # Sub-image target: 600x1800 (2x6 @ 300 DPI)
            STRIP_W = 600
            STRIP_H = 1800

            canvas = Image.new("RGB", (CANVAS_W, CANVAS_H), "white")
            
            # Load original strip
            strip = Image.open(strip_path)
            
            # Resize logic (fitting high-res strip to 600x1800)
            # Use LANCZOS for best downscaling quality
            strip_resized = strip.resize((STRIP_W, STRIP_H), Image.Resampling.LANCZOS)
            
            # Paste Left
            canvas.paste(strip_resized, (0, 0))
            
            # Paste Right (starting at x=600)
            canvas.paste(strip_resized, (STRIP_W, 0))
            
            # Save as PNG as requested
            canvas.save(output_path, format="PNG")
            logger.info(f"4x6 Layout saved to {output_path}")
            return output_path
            
        except Exception as e:
            logger.error(f"Failed to create 4x6 layout: {e}")
            return None
