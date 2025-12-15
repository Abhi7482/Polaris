import cv2
import logging
import time
import pythoncom
import win32com.client

logger = logging.getLogger(__name__)

class CameraService:
    def __init__(self, target_hw_id="USB\\VID_054C&PID_0A92&MI_00\\6&39913BBE&1&0000"):
        self.device_index = 0
        self.target_hw_id = target_hw_id.upper()
        self.cap = None
        self.is_open = False

    def _resolve_device_index(self):
        """
        Queries Windows WMI to find the index of the camera with the specific Hardware ID.
        Assumes OpenCV indices match the order of 'usbvideo' devices in PnP enumeration.
        """
        try:
            # Initialize COM for the thread if needed (FastAPI runs in threads)
            pythoncom.CoInitialize()
            
            wmi = win32com.client.GetObject("winmgmts:")
            # Filter for USB Video Class devices only
            devices = wmi.ExecQuery("SELECT * FROM Win32_PnPEntity WHERE Service='usbvideo'")
            
            for i, dev in enumerate(devices):
                dev_id = dev.DeviceID.upper()
                # Check for exact match or substring match if user provided partial
                if self.target_hw_id in dev_id:
                    logger.info(f"Target Camera Found at Index {i}: {dev.Caption} ({dev_id})")
                    return i
            
            logger.warning(f"Target Camera ID {self.target_hw_id} not found in WMI list. Defaulting to 0.")
            return 0
            
        except Exception as e:
            logger.error(f"Failed to resolve camera index via WMI: {e}")
            return 0
        finally:
            pythoncom.CoUninitialize()

    def start(self):
        # Resolve index dynamically on start
        self.device_index = self._resolve_device_index()
        
        logger.info(f"Attempting to open camera at index {self.device_index}")
        self.cap = cv2.VideoCapture(self.device_index, cv2.CAP_DSHOW) # CAP_DSHOW for faster init on Windows
        
        if not self.cap.isOpened():
            logger.error(f"Could not open camera at index {self.device_index}")
            self.is_open = False
            return False
        
        # Set resolution to 1080p
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1920)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 1080)
        
        # Disable Auto-Sleep/PowerSave if possible? 
        # (OpenCV doesn't control this, but accessing it keeps it awake)
        
        self.is_open = True
        logger.info(f"Camera started successfully at index {self.device_index}")
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
