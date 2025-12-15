import cv2

def list_cameras(max_check=5):
    print("Scanning for connected cameras...")
    available_cameras = []
    
    for i in range(max_check):
        cap = cv2.VideoCapture(i, cv2.CAP_DSHOW) # CAP_DSHOW is faster on Windows
        if cap.isOpened():
            # Try to get backend name or just confirm it works
            ret, frame = cap.read()
            if ret:
                w = cap.get(cv2.CAP_PROP_FRAME_WIDTH)
                h = cap.get(cv2.CAP_PROP_FRAME_HEIGHT)
                print(f"[SUCCESS] Camera found at Index {i}: Resolution {int(w)}x{int(h)}")
                available_cameras.append(i)
            else:
                print(f"[WARNING] Camera at Index {i} opened but failed to read frame.")
            cap.release()
        else:
            pass
            # print(f"[INFO] No camera at Index {i}")

    if not available_cameras:
        print("No cameras found.")
    else:
        print(f"\nFound {len(available_cameras)} camera(s) at indices: {available_cameras}")

if __name__ == "__main__":
    list_cameras()
