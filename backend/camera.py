import cv2
import logging
import time

logger = logging.getLogger(__name__)

class CameraService:
    def __init__(self, device_index=0):
        self.device_index = device_index
        self.cap = None
        self.is_open = False

    def start(self):
        logger.info(f"Attempting to open camera at index {self.device_index}")
        self.cap = cv2.VideoCapture(self.device_index, cv2.CAP_DSHOW) # CAP_DSHOW for faster init on Windows
        if not self.cap.isOpened():
            logger.error("Could not open camera")
            self.is_open = False
            return False
        
        # Force MJPEG compression (Vital for 1080p @ 30fps on USB 2.0)
        self.cap.set(cv2.CAP_PROP_FOURCC, cv2.VideoWriter_fourcc(*'MJPG'))
        
        # Set resolution to 1080p (Full HD)
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1920)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 1080)
        self.cap.set(cv2.CAP_PROP_FPS, 30)
        
        # Auto exposure/WB are usually on by default, but can be forced here
        # self.cap.set(cv2.CAP_PROP_AUTO_EXPOSURE, 3) # 3 is auto
        
        self.is_open = True
        logger.info("Camera started successfully")
        return True

    def get_frame(self):
        if not self.is_open:
            return None
        ret, frame = self.cap.read()
        if not ret:
            logger.warning("Failed to read frame")
            return None
        return frame

    def capture_photo(self, filepath):
        frame = self.get_frame()
        if frame is not None:
            cv2.imwrite(filepath, frame)
            logger.info(f"Photo saved to {filepath}")
            return True
        logger.error("Failed to capture photo")
        return False

    def stop(self):
        if self.cap:
            self.cap.release()
        self.is_open = False
        logger.info("Camera stopped")
