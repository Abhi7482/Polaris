import requests
import time

def check_stream():
    url = "http://127.0.0.1:8000/camera/stream"
    print(f"Connecting to {url}...")
    
    try:
        # Use stream=True to prevent downloading the infinite stream
        with requests.get(url, stream=True, timeout=5) as r:
            print(f"Status Code: {r.status_code}")
            print(f"Headers: {r.headers}")
            
            if r.status_code != 200:
                print("❌ Failed to connect to stream")
                return

            print("✅ Connected! Reading chunks...")
            
            # Read a few chunks to verify data flow
            bytes_read = 0
            start_time = time.time()
            
            for chunk in r.iter_content(chunk_size=1024):
                bytes_read += len(chunk)
                if bytes_read > 100000: # ~100KB, enough for a frame or two
                    print(f"✅ Successfully read {bytes_read} bytes in {time.time() - start_time:.2f}s")
                    break
                    
            print("Stream seems alive and sending data.")
            
    except Exception as e:
        print(f"❌ Error connecting to stream: {e}")

if __name__ == "__main__":
    check_stream()
