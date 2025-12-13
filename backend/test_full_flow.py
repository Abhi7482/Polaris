
import requests
import time
import json
import os

BASE_URL = "http://127.0.0.1:8000"

def run_step(name, func):
    print(f"\n🔹 {name}...")
    try:
        return func()
    except Exception as e:
        print(f"❌ Failed: {e}")
        return None

def test_full_flow():
    print("🚀 Starting End-to-End Full Flow Test (Camera -> Print)")
    
    # 1. Start Session
    def step_start():
        res = requests.post(f"{BASE_URL}/session/start")
        res.raise_for_status()
        print(f"   Session Started: {res.json()['session_id']}")
        return res.json()['session_id']
    
    session_id = run_step("Starting Session", step_start)
    if not session_id: return

    # 2. Set Options
    def step_options():
        payload = {"filter_type": "color", "frame_id": "After Dark Pop"}
        res = requests.post(f"{BASE_URL}/session/options", json=payload)
        res.raise_for_status()
        print("   Options Set: Color / After Dark Pop")
    
    run_step("Setting Options", step_options)

    # 3. Capture 4 Photos
    print("\n📸 PREPARE FOR PHOTOS! (4 Shots, 3s interval)")
    for i in range(1, 5):
        print(f"   Taking Photo {i}/4 in 3 seconds...")
        time.sleep(3)
        
        def step_capture():
            res = requests.post(f"{BASE_URL}/capture")
            res.raise_for_status()
            print(f"   ✅ Captured: {res.json()['path']}")
        
        run_step(f"Capture {i}", step_capture)

    # 4. Process Strip
    def step_process():
        res = requests.post(f"{BASE_URL}/process")
        res.raise_for_status()
        path = res.json()['path']
        print(f"   ✅ Strip Generated: {path}")
        return path
        
    strip_path = run_step("Processing Strip", step_process)
    if not strip_path: return

    # 5. Print (Borderless)
    def step_print():
        payload = {"copies": 1}
        print("   🖨️ Sending to Printer...")
        res = requests.post(f"{BASE_URL}/print", json=payload)
        res.raise_for_status()
        print("   ✅ Print Job Queued!")
        print("   (This triggers create_4x6_layout -> borderless overlay -> win32print)")
    
    run_step("Printing", step_print)
    
    print("\n✅ TEST COMPLETE!")
    print("PLEASE CHECK:")
    print("1. backend/prints/ folder for the 4x6 composite.")
    print("2. Your Physical Printer for the final output.")

if __name__ == "__main__":
    test_full_flow()
