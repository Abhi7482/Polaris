import cv2
import time

def test_camera(index=0):
    print(f"Testing camera at index {index}...")
    cap = cv2.VideoCapture(index, cv2.CAP_DSHOW)
    
    if not cap.isOpened():
        print("FAIL: Could not open camera.")
        return
    
    # Try reading a frame
    ret, frame = cap.read()
    if ret:
        print(f"SUCCESS: Frame captured! Resolution: {frame.shape}")
    else:
        print("FAIL: Camera opened but returned no frame (black screen/timeout).")
    
    cap.release()
    print("Camera released.")

if __name__ == "__main__":
    test_camera(0)
