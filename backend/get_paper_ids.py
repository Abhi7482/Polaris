
import win32print
import ctypes
from ctypes import byref, create_string_buffer, c_wchar_p, c_int, c_short, c_char_p

PRINTER_NAME = "EPSON L3210 Series"

# Constants for DeviceCapabilities
DC_PAPERS = 2
DC_PAPERNAMES = 16

def list_papers():
    try:
        print(f"Querying Papers for: {PRINTER_NAME}")
        
        # Load Winspool.drv
        winspool = ctypes.WinDLL("winspool.drv")
        
        # 1. Get Number of Papers
        # DeviceCapabilities(device_name, port, capability, output_buffer, devmode)
        num_papers = winspool.DeviceCapabilitiesW(c_wchar_p(PRINTER_NAME), None, DC_PAPERS, None, None)
        print(f"Number of Paper Sizes: {num_papers}")
        
        if num_papers <= 0:
            return

        # 2. Get Paper IDs
        paper_ids = (c_short * num_papers)()
        winspool.DeviceCapabilitiesW(c_wchar_p(PRINTER_NAME), None, DC_PAPERS, byref(paper_ids), None)
        
        # 3. Get Paper Names
        # Each name is 64 chars max
        buffer_size = num_papers * 64
        paper_names_buffer = create_string_buffer(buffer_size)
        # Use 'A' (ANSI) version for char buffer or 'W' for wide
        # Let's use W and c_wchar buffer usually? 
        # Actually easier to use A and 64 bytes if driver supports it, or W and 64 WCHARS (128 bytes).
        # Let's try W
        class PaperName(ctypes.Structure):
            _fields_ = [("params", ctypes.c_wchar * 64)]
            
        PaperNamesArray = PaperName * num_papers
        names_arr = PaperNamesArray()
        
        winspool.DeviceCapabilitiesW(c_wchar_p(PRINTER_NAME), None, DC_PAPERNAMES, byref(names_arr), None)
        
        print("\n--- Supported Papers ---")
        found_4x6 = False
        
        for i in range(num_papers):
            p_id = paper_ids[i]
            p_name = names_arr[i].params
            print(f"ID: {p_id} \t Name: {p_name}")
            
            if "4 x 6" in p_name or "10 x 15" in p_name:
                print(f"*** FOUND TARGET: ID {p_id} ***")
                found_4x6 = True
                
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    list_papers()
