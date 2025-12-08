import win32print

def list_forms():
    printer_name = win32print.GetDefaultPrinter()
    print(f"Default Printer: {printer_name}")
    
    try:
        hPrinter = win32print.OpenPrinter(printer_name)
        
        # Level 2 gives detailed info including supported forms
        try:
            forms = win32print.EnumForms(hPrinter)
            print(f"\nFound {len(forms)} forms:")
            for form in forms:
                name = form['Name']
                width = form['Size']['cx'] / 1000.0 # mm
                height = form['Size']['cy'] / 1000.0 # mm
                # Convert to inches
                w_in = width / 25.4
                h_in = height / 25.4
                
                if (1.9 < w_in < 2.1 and 5.9 < h_in < 6.1) or (3.9 < w_in < 4.1 and 5.9 < h_in < 6.1):
                    print(f"  -> MATCH: {name} ({w_in:.2f} x {h_in:.2f} inches)")
                else:
                    # Print only if it looks like a photo size to avoid spam
                    if w_in < 10 and h_in < 10:
                        print(f"  {name} ({w_in:.2f} x {h_in:.2f} inches)")
                        
        except Exception as e:
            print(f"Could not enum forms: {e}")
            
        win32print.ClosePrinter(hPrinter)
    except Exception as e:
        print(f"Failed to open printer: {e}")

if __name__ == "__main__":
    list_forms()
