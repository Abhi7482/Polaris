import win32com.client
import win32print

def get_wmi_printer_info():
    try:
        wmi = win32com.client.GetObject("winmgmts:")
        
        print("\n--- Win32_Printer ---")
        printers = wmi.InstancesOf("Win32_Printer")
        for p in printers:
            print(f"Name: {p.Name}")
            print(f"PortName: {p.PortName}")
            # PnPDeviceID isn't always filled for printers, but let's check
            print(f"PNPDeviceID: {getattr(p, 'PNPDeviceID', 'N/A')}") 
            print("-" * 20)

        print("\n--- Win32_PnPEntity (Matching VID_04B8) ---")
        # Query specifically for the Epson VID
        devices = wmi.ExecQuery("SELECT * FROM Win32_PnPEntity WHERE DeviceID LIKE '%VID_04B8%'")
        for d in devices:
            print(f"Name: {d.Name}")
            print(f"DeviceID: {d.DeviceID}")
            print(f"Caption: {d.Caption}")
            print(f"Service: {d.Service}")
            print("-" * 20)
            
    except Exception as e:
        print(f"WMI Error: {e}")

if __name__ == "__main__":
    get_wmi_printer_info()
