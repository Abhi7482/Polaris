
import requests
import json

URL = "http://127.0.0.1:8000/frame-layout"
PARAMS = {
    "filter_type": "bw",
    "frame_id": "Classic Black"
}

try:
    print(f"Querying {URL} with {PARAMS}...")
    response = requests.get(URL, params=PARAMS)
    
    if response.status_code == 200:
        data = response.json()
        print("\n--- API Response ---")
        print(json.dumps(data, indent=2))
        
        slots = data.get("slots", [])
        if not slots:
            print("❌ No slots returned!")
        else:
            first_top = float(slots[0]["top"].strip('%'))
            print(f"\nFirst Slot Top: {first_top}%")
            
            # Default/Legacy is ~1.86%
            # Padded should be significantly smaller (e.g., < 1.0% or close to 0%)
            # Because 50px padding on 5625px height is roughly 0.88%. 
            # 1.86% - 0.88% = ~0.98%
            
            if first_top < 1.5:
                print("✅ Slot appears PADDED (Backend is updated & working)")
            else:
                print("⚠️ Slot appears UNPADDED (Legacy/Default detected). Backend might need restart or file not found.")
                
    else:
        print(f"❌ Error: {response.status_code}")
        print(response.text)

except Exception as e:
    print(f"❌ Connection Failed: {e}")
    print("Is the backend running?")
