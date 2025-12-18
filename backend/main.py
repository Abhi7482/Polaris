from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import cv2
import os
import logging
import time
from camera import CameraService
from printer import PrinterService
from processor import ImageProcessor
from state import StateManager

# Setup Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("PolarisBackend")

app = FastAPI(title="Polaris.co Backend")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Services
camera = CameraService()
printer = PrinterService()
processor = ImageProcessor()
state_manager = StateManager()

# Ensure output directories exist
os.makedirs("captures", exist_ok=True)
os.makedirs("prints", exist_ok=True)

# Mount Static Files
app.mount("/captures", StaticFiles(directory="captures"), name="captures")
app.mount("/prints", StaticFiles(directory="prints"), name="prints")

@app.on_event("startup")
async def startup_event():
    camera.start()

@app.on_event("shutdown")
async def shutdown_event():
    camera.stop()

@app.get("/")
async def root():
    return {"message": "Polaris.co Backend Online"}

@app.get("/status")
async def status():
    return {
        "status": "ok",
        "camera": camera.is_open,
        "session": state_manager.get_state()
    }

# Camera Stream
def generate_frames():
    while True:
        frame = camera.get_frame()
        if frame is None:
            break
        ret, buffer = cv2.imencode('.jpg', frame)
        frame_bytes = buffer.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

@app.get("/camera/stream")
async def video_feed():
    return StreamingResponse(generate_frames(), media_type="multipart/x-mixed-replace; boundary=frame")

# Session Management
@app.post("/session/start")
async def start_session():
    session = state_manager.start_session()
    return session

@app.post("/session/reset")
async def reset_session():
    state_manager.reset()
    return {"message": "Session reset"}

# Capture
@app.post("/capture")
async def capture_photo():
    session = state_manager.get_state()
    if not session:
        raise HTTPException(status_code=400, detail="No active session")
    
    filename = f"captures/{session.session_id}_{len(session.photos)+1}.jpg"
    success = camera.capture_photo(filename)
    if success:
        state_manager.add_photo(filename)
        return {"status": "captured", "path": filename, "count": len(session.photos)}
    else:
        raise HTTPException(status_code=500, detail="Capture failed")

# Options
class OptionsUpdate(BaseModel):
    filter_type: str = None
    frame_id: str = None

@app.post("/session/options")
async def update_options(options: OptionsUpdate):
    if options.filter_type:
        state_manager.set_filter(options.filter_type)
    if options.frame_id:
        state_manager.set_frame(options.frame_id)
    return state_manager.get_state()

# Layout Info
@app.get("/frame-layout")
async def get_frame_layout(filter_type: str = "color", frame_id: str = "regular"):
    try:
        # Construct path to check asset
        # Use absolute path relative to this file (backend/)
        BASE_DIR = os.path.dirname(os.path.abspath(__file__))
        
        template_filename = f"{frame_id}.png"
        template_path = os.path.join(BASE_DIR, "assets", "frames", filter_type, template_filename)
        
        # Default dims
        strip_width = 1875
        strip_height = 5625
        
        slots = []
        
        # 1. Try Auto-Detection
        if os.path.exists(template_path):
            slots = processor.detect_slots(template_path)
            
            # SCALING FIX: Detect source dims and scale to 1875x5625
            # otherwise small frames produce tiny % values
            try:
                img = cv2.imread(template_path)
                if img is not None:
                    h, w, _ = img.shape
                    scale_x = strip_width / w
                    scale_y = strip_height / h
                    
                    TARGET_PADDING = 50 # Must match processor.py logic!
                    
                    # Apply Scaling + Padding to slots
                    scaled_slots = []
                    for (sx, sy, sw, sh) in slots:
                        # 1. Scale
                        nx = sx * scale_x
                        ny = sy * scale_y
                        nw = sw * scale_x
                        nh = sh * scale_y
                        
                        # 2. Pad (Inflate)
                        # Ensure we don't go negative on x/y (though CSS handles overflow hidden usually)
                        nx = max(0, nx - TARGET_PADDING)
                        ny = max(0, ny - TARGET_PADDING)
                        nw += (TARGET_PADDING * 2)
                        nh += (TARGET_PADDING * 2)
                        
                        scaled_slots.append((nx, ny, nw, nh))
                        
                    slots = scaled_slots
            except Exception as e:
                logger.error(f"Failed to scale layout coords: {e}")

        # 2. Fallback
        if not slots:
            # Revert to legacy logic manually since processor logic is internal
             fallback_key = "vintage" if frame_id in ["vintage", "drunken_monkey"] else "regular"
             slots = processor.legacy_coordinates.get(fallback_key, processor.legacy_coordinates["regular"])
        
        # 3. Convert to Percentages for CSS
        # { top: '1.86%', left: '5.54%', width: '88.9%', height: '20.28%' }
        css_slots = []
        for (x, y, w, h) in slots:
            css_slots.append({
                "top": f"{(y / strip_height) * 100:.2f}%",
                "left": f"{(x / strip_width) * 100:.2f}%",
                "width": f"{(w / strip_width) * 100:.2f}%",
                "height": f"{(h / strip_height) * 100:.2f}%"
            })
            
        return {"slots": css_slots, "source": "auto" if os.path.exists(template_path) else "fallback"}

    except Exception as e:
        logger.error(f"Layout fetch error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
@app.post("/process")
async def process_photos():
    session = state_manager.get_state()
    if not session or len(session.photos) < 4:
        raise HTTPException(status_code=400, detail="Session incomplete")
    
    output_path = f"prints/{session.session_id}_final.jpg"
    result_path = processor.create_strip(
        session.photos, 
        output_path=output_path, 
        filter_type=session.selected_filter,
        frame_id=session.selected_frame
    )
    
    if result_path:
        return {"status": "processed", "path": result_path}
    else:
        raise HTTPException(status_code=500, detail="Processing failed")

class PrintRequest(BaseModel):
    copies: int = 1

@app.post("/print")
async def print_strip(request: PrintRequest, background_tasks: BackgroundTasks):
    session = state_manager.get_state()
    if not session:
        raise HTTPException(status_code=400, detail="No active session")
    
    
    # Create 4x6 layout for printing
    # Source is the usually generated final strip
    print_path = f"prints/{session.session_id}_final.jpg"
    print_path_4x6 = f"prints/{session.session_id}_print_4x6.png"
    
    # Generate the 4x6 composite (Process synchronously here or in bg task? Sync is safer for file existence)
    # Check if source exists first
    if not os.path.exists(print_path):
        logger.error(f"Source strip not found: {print_path}")
        raise HTTPException(status_code=400, detail="Photo strip not generated yet")

    final_output_path = processor.create_4x6_layout(print_path, print_path_4x6)
    
    if not final_output_path or not os.path.exists(final_output_path):
        logger.error("Failed to generate 4x6 print layout")
        raise HTTPException(status_code=500, detail="Print generation failed")
    
    # Determine Color Mode
    is_bw = (session.selected_filter == "bw")
    logger.info(f"--- PRINT ENDPOINT DEBUG ---")
    logger.info(f"Session Filter: '{session.selected_filter}'")
    logger.info(f"Combined is_bw: {is_bw}")
    
    # LOGIC UPDATE: 1 Physical Page = 2 Strips (4x6 Cut)
    # If user wants 2 copies (strips) -> Print 1 Page
    # If user wants 4 copies (strips) -> Print 2 Pages
    physical_copies = max(1, request.copies // 2)
    
    background_tasks.add_task(printer.print_image, final_output_path, physical_copies, is_bw)
    return {"status": "printing_started", "copies": request.copies, "physical_prints": physical_copies}

# --- Kiosk Heartbeat ---
import asyncio
import requests
import platform
import shutil

# HOSTED_BACKEND_URL = "https://polaris-hosted-backend.onrender.com" # Update with actual URL
HOSTED_BACKEND_URL = "https://polaris-hosted-backend.onrender.com" # Live URL

async def heartbeat_loop():
    while True:
        try:
            # Gather Status
            status = {
                "camera": "OK" if camera.is_open else "DISCONNECTED",
                "printer": "OK", # TODO: Implement actual printer check via win32print
                "disk_space": f"{shutil.disk_usage('.').free // (1024**3)}GB",
                "internet": "CONNECTED" # If this request succeeds, it's connected
            }
            
            payload = {
                "kiosk_id": "polaris-001", # Unique ID per kiosk
                "timestamp": str(time.time()),
                "version": "1.0.0",
                "status": status
            }
            
            # Send Heartbeat
            # requests.post(f"{HOSTED_BACKEND_URL}/heartbeat", json=payload, timeout=5)
            # logger.info(f"Heartbeat sent: {status}")
            
        except Exception as e:
            logger.error(f"Heartbeat failed: {e}")
            
        await asyncio.sleep(300) # Every 5 minutes

@app.on_event("startup")
async def start_heartbeat():
    asyncio.create_task(heartbeat_loop())

if __name__ == "__main__":
    import uvicorn
    # Use 127.0.0.1 to ensure it only listens locally
    uvicorn.run(app, host="127.0.0.1", port=8000)

