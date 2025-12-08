import base64

secret = "YThiYjM4OGQtMjhhYS00NzgxLTg4YmEtNzk3MTg2ODIyMTU5"

try:
    decoded = base64.b64decode(secret).decode('utf-8')
    print(f"Original: {secret}")
    print(f"Decoded:  {decoded}")
except Exception as e:
    print(f"Not base64 or error: {e}")
