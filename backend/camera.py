import cv2
import logging
import time
import subprocess
from pygrabber.dshow_graph import FilterGraph

logger = logging.getLogger(__name__)

class CameraService:
    def __init__(self, target_vid="054C", target_pid="0A92"):
        self.device_index = self.find_camera_index(target_vid, target_pid)
        self.cap = None
        self.is_open = False

    def find_camera_index(self, target_vid, target_pid):
        """
        Finds the OpenCV index for a camera.
        Priority 1: 'CEVCECM' (Specific requested device name)
        Priority 2: WMI Search based on VID/PID
        """
        logger.info(f"Looking for camera (Priority: CEVCECM, Fallback: VID_{target_vid})")
        
        try:
            # 1. Direct Name Match (Fastest & Most Reliable for this setup)
            graph = FilterGraph()
            devices = graph.get_input_devices()
            
            for i, device_name in enumerate(devices):
                if "CEVCECM" in device_name:
                    logger.info(f"Found specific device 'CEVCECM' at index {i}")
                    return i

            # 2. If 'CEVCECM' not found, try WMI lookup
            logger.info("CEVCECM not found directly. Trying WMI lookup...")
            cmd = f"Get-WmiObject Win32_PnPEntity | Where-Object {{ $_.PNPDeviceID -match 'VID_{target_vid}&PID_{target_pid}' }} | Select-Object -ExpandProperty Caption"
            result = subprocess.run(["powershell", "-Command", cmd], capture_output=True, text=True)
            target_name = result.stdout.strip()
            
            if target_name:
                logger.info(f"Found target device name via WMI: '{target_name}'")
                for i, device_name in enumerate(devices):
                    if target_name in device_name or device_name in target_name:
                        logger.info(f"Match found at index {i}!")
                        return i
            
            logger.warning(f"No specific camera found. Defaulting to index 0 (Found: {devices[0] if devices else 'None'}).")
            return 0
            
        except Exception as e:
            logger.error(f"Error finding camera index: {e}")
            return 0

    def start(self):
        logger.info(f"Attempting to open camera at index {self.device_index}")
        # DSHOW is crucial for Windows to respect the specific index mapping
        self.cap = cv2.VideoCapture(self.device_index, cv2.CAP_DSHOW)
        
        if not self.cap.isOpened():
            logger.error("Could not open camera")
            self.is_open = False
            return False
        
        # Force MJPG codec (Fixes black screen on many USB cams)
        self.cap.set(cv2.CAP_PROP_FOURCC, cv2.VideoWriter_fourcc(*'MJPG'))
        
        # Commenting out resolution force to debug black screen
        # self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1920)
        # self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 1080)
        
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
