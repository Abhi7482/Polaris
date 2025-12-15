import win32com.client

def list_cameras():
    try:
        wmi = win32com.client.GetObject("winmgmts:")
        # Query for Imaging Devices (ClassGuid for Image is usually {6bdd1fc6-810f-11d0-bec7-08002be2092f})
        # Or just look for known "USB Video Device" service or Caption containing "Camera"
        
        # Strategy 1: PnPEntity with 'Camera' or 'Video' in Caption
        print("--- Searching Win32_PnPEntity ---")
        devices = wmi.ExecQuery("SELECT * FROM Win32_PnPEntity WHERE Caption LIKE '%Camera%' OR Caption LIKE '%Video%' OR Service='usbvideo'")
        
        found_any = False
        for i, dev in enumerate(devices):
            found_any = True
            print(f"Device [{i}]:")
            print(f"  Caption: {dev.Caption}")
            print(f"  DeviceID: {dev.DeviceID}")
            print(f"  Service: {dev.Service}")
            print(f"  Status: {dev.Status}")
            print("-" * 30)
            
        if not found_any:
            print("No obvious camera devices found in PnPEntity.")

    except Exception as e:
        print(f"Error querying WMI: {e}")

if __name__ == "__main__":
    list_cameras()
