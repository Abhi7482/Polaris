import requests
import cv2
import numpy as np
import time

def check_stream_content():
    url = "http://127.0.0.1:8000/camera/stream"
    print(f"Connecting to {url}...")
    
    try:
        with requests.get(url, stream=True, timeout=5) as r:
            if r.status_code != 200:
                print("❌ Failed to connect to stream")
                return

            byte_buffer = b""
            start_time = time.time()
            
            # Read until we find a JPEG end marker (0xFF, 0xD9)
            # This is a bit naive for MJPEG but works for single frame analysis
            for chunk in r.iter_content(chunk_size=1024):
                byte_buffer += chunk
                
                # Check for JPEG Start (FF D8) and End (FF D9)
                a = byte_buffer.find(b'\xff\xd8')
                b = byte_buffer.find(b'\xff\xd9')
                
                if a != -1 and b != -1:
                    jpg = byte_buffer[a:b+2]
                    
                    # Decode
                    nparr = np.frombuffer(jpg, np.uint8)
                    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                    
                    if img is None:
                        print("❌ Failed to decode image")
                        return

                    # Analyze
                    height, width, _ = img.shape
                    avg_color = np.mean(img)
                    
                    print(f"✅ Frame Decoded: {width}x{height}")
                    print(f"📊 Average Brightness: {avg_color:.2f} (0=Black, 255=White)")
                    
                    if avg_color < 1.0:
                         print("⚠️ WARNING: Image is extremely dark/black!")
                    else:
                         print("✅ Image seems visible.")
                         
                    return

                if time.time() - start_time > 5:
                    print("❌ Timeout waiting for frame boundary")
                    return
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    check_stream_content()
