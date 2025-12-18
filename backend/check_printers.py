import win32print

def list_printers():
    print("Listing available printers...")
    try:
        printers = [p[2] for p in win32print.EnumPrinters(win32print.PRINTER_ENUM_LOCAL | win32print.PRINTER_ENUM_CONNECTIONS)]
        for p in printers:
            print(f"- '{p}'")
    except Exception as e:
        print(f"Error listing printers: {e}")

if __name__ == "__main__":
    list_printers()
