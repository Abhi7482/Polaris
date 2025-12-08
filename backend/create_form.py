import win32print
import ctypes

def create_custom_form():
    printer_name = win32print.GetDefaultPrinter()
    print(f"Adding form to: {printer_name}")
    
    hPrinter = win32print.OpenPrinter(printer_name, {"DesiredAccess": win32print.PRINTER_ALL_ACCESS})
    
    form_name = "Polaris 2x6"
    
    # Check if exists
    try:
        win32print.GetForm(hPrinter, form_name)
        print(f"Form '{form_name}' already exists.")
    except:
        # Create it
        # Size in 1/1000 mm
        # 2 inches = 50.8 mm = 50800
        # 6 inches = 152.4 mm = 152400
        
        form_info = {
            "Flags": win32print.FORM_USER,
            "Name": form_name,
            "Size": {"cx": 50800, "cy": 152400},
            "ImageableArea": {"left": 0, "top": 0, "right": 50800, "bottom": 152400}
        }
        
        try:
            win32print.AddForm(hPrinter, 1, form_info)
            print(f"Successfully created form '{form_name}'")
        except Exception as e:
            print(f"Failed to create form: {e}")
            print("Note: You might need to run this as Administrator.")

    win32print.ClosePrinter(hPrinter)

if __name__ == "__main__":
    create_custom_form()
