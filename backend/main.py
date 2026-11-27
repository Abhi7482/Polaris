from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import cv2
import os
import logging
import time
import shutil
import platform
import asyncio
import requests
import win32print
import base64
import io
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

# --- CONFIGURATION: STORAGE ---
# User requested saving to Desktop for persistence
# We use ABSOLUTE paths for file operations, but RELATIVE paths ("captures/x.jpg") for URLs/State.

USER_DESKTOP = os.path.join(os.path.expanduser("~"), "Desktop")
BASE_OUTPUT_DIR = os.path.join(USER_DESKTOP, "Polaris Output")

CAPTURES_DIR = os.path.join(BASE_OUTPUT_DIR, "captures")
PRINTS_DIR = os.path.join(BASE_OUTPUT_DIR, "prints")

# Ensure dirs exist
os.makedirs(CAPTURES_DIR, exist_ok=True)
os.makedirs(PRINTS_DIR, exist_ok=True)

# Mount as standard URLs (backend maps URL path -> Desktop folder)
app.mount("/captures", StaticFiles(directory=CAPTURES_DIR), name="captures")
app.mount("/prints", StaticFiles(directory=PRINTS_DIR), name="prints")

@app.on_event("startup")
async def startup_event():
    # 1. Start Hardware
    camera.start()
    
    # 2. Cleanup Old Files (Retention: 24 Hours)
    try:
        retention_seconds = 86400 # 24 Hours
        now = time.time()
        
        cleanup_dirs = [CAPTURES_DIR, PRINTS_DIR] # Scan the Desktop folders
        count = 0
        
        for d in cleanup_dirs:
            if os.path.exists(d):
                for f in os.listdir(d):
                    fp = os.path.join(d, f)
                    if os.path.isfile(fp) and os.stat(fp).st_mtime < (now - retention_seconds):
                        os.remove(fp)
                        count += 1
                        
        logger.info(f"Startup Cleanup: Removed {count} old files from Desktop storage.")
    except Exception as e:
        logger.error(f"Cleanup failed: {e}")

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
        "camera_name": camera.active_camera_name,
        "session": state_manager.get_state()
    }

# ─────────────────────────────────────────────────────────────────────────────
# HEALTH CHECK ENDPOINT — full system diagnostic for boot screen & heartbeat
# ─────────────────────────────────────────────────────────────────────────────
_startup_time = time.time()

def _check_printer(name_key: str) -> dict:
    """Check if a printer matching name_key exists in Windows printer queue."""
    try:
        installed = [p[2] for p in win32print.EnumPrinters(
            win32print.PRINTER_ENUM_LOCAL | win32print.PRINTER_ENUM_CONNECTIONS
        )]
        is_bw = "bw" in name_key.lower()
        for p in installed:
            if name_key.lower() in p.lower():
                if is_bw and "bw" not in p.lower():
                    continue
                if not is_bw and "bw" in p.lower():
                    continue
                return {"found": True, "name": p}
        return {"found": False, "name": None}
    except Exception as e:
        logger.error(f"Printer check error: {e}")
        return {"found": False, "name": None, "error": str(e)}

@app.get("/health")
async def health_check():
    """
    Full system health check used by the kiosk boot screen and heartbeat.
    Returns camera, printers, disk, session state, uptime.
    """
    uptime = time.time() - _startup_time

    # Camera
    cam_mode = "stock_photo_fallback" if camera.use_mock else "live"
    cam_info = {
        "connected": camera.is_open,
        "name": camera.active_camera_name,
        "mode": cam_mode,
    }

    # Printers
    printer_color = _check_printer("EPSON L3210 Series")
    printer_bw = _check_printer("EPSON L3210 BW")

    # Disk
    disk = shutil.disk_usage('.')
    disk_free_gb = round(disk.free / (1024 ** 3), 1)

    # Session
    session = state_manager.get_state()
    session_step = "idle"
    if session:
        if len(session.photos) == 0:
            session_step = "options"
        elif len(session.photos) < 4:
            session_step = f"capture_{len(session.photos)}_of_4"
        elif session.is_printing:
            session_step = "printing"
        else:
            session_step = "review"

    return {
        "status": "ok",
        "version": "1.0.0",
        "platform": platform.system(),
        "uptime_seconds": uptime,
        "camera": cam_info,
        "printers": {
            "color": printer_color,
            "bw": printer_bw,
        },
        "disk_free_gb": disk_free_gb,
        "session_active": session is not None,
        "session_step": session_step,
    }

@app.get("/health/print-pipeline")
async def health_print_pipeline():
    """
    Checks that frame assets exist and disk space is sufficient.
    Used by the boot screen to verify the print pipeline end-to-end.
    """
    try:
        base_dir = processor.base_dir
        frames_dir_color = os.path.join(base_dir, "assets", "frames", "color")
        frames_dir_bw = os.path.join(base_dir, "assets", "frames", "bw")
        overlays_dir = os.path.join(base_dir, "assets", "overlays")

        asset_count = 0
        missing = []

        for d in [frames_dir_color, frames_dir_bw]:
            if os.path.exists(d):
                asset_count += len([f for f in os.listdir(d) if f.endswith('.png')])
            else:
                missing.append(d)

        borderless_path = os.path.join(overlays_dir, "borderless.png")
        if not os.path.exists(borderless_path):
            missing.append("borderless.png")

        disk = shutil.disk_usage('.')
        disk_free_gb = round(disk.free / (1024 ** 3), 1)
        low_disk = disk_free_gb < 2.0

        ready = len(missing) == 0 and not low_disk

        return {
            "ready": ready,
            "asset_count": asset_count,
            "disk_free_gb": disk_free_gb,
            "missing": missing,
            "detail": (
                f"Low disk space: {disk_free_gb}GB" if low_disk
                else f"Missing assets: {missing}" if missing
                else f"{asset_count} frame assets ready"
            )
        }
    except Exception as e:
        logger.error(f"Print pipeline check error: {e}")
        return {"ready": False, "detail": str(e), "asset_count": 0, "disk_free_gb": 0}

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
    
    # RELATIVE Name for Web/State
    rel_filename = f"captures/{session.session_id}_{len(session.photos)+1}.jpg"
    # ABSOLUTE Path for Saving
    abs_filepath = os.path.join(CAPTURES_DIR, f"{session.session_id}_{len(session.photos)+1}.jpg")
    
    success = camera.capture_photo(abs_filepath)
    if success:
        state_manager.add_photo(rel_filename) # Store RELATIVE for frontend
        return {"status": "captured", "path": rel_filename, "count": len(session.photos)}
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
        BASE_DIR = processor.base_dir
        
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
                        # Ensure we don't go negative on x/y
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
    
    # 1. Resolve Input Paths (Web Relative -> Desktop Absolute)
    # session.photos has ["captures/x.jpg", ...]
    # We strip "captures/" and join with CAPTURES_DIR (Desktop)
    # OR we just basename it safely.
    input_paths_abs = []
    for rel_p in session.photos:
        # rel_p is "captures/uuid_1.jpg"
        basename = os.path.basename(rel_p)
        abs_p = os.path.join(CAPTURES_DIR, basename)
        input_paths_abs.append(abs_p)

    # 2. Prepare Output Path (Desktop)
    filename_final = f"{session.session_id}_final.jpg"
    output_path_abs = os.path.join(PRINTS_DIR, filename_final)
    
    # 3. Process
    result_path = processor.create_strip(
        input_paths_abs, 
        output_path=output_path_abs, 
        filter_type=session.selected_filter,
        frame_id=session.selected_frame
    )
    
    # 4. Return Relative Path for Frontend
    if result_path:
        output_path_rel = f"prints/{filename_final}"
        return {"status": "processed", "path": output_path_rel}
    else:
        raise HTTPException(status_code=500, detail="Processing failed")

class PrintRequest(BaseModel):
    copies: int = 1

# ─────────────────────────────────────────────────────────────────────────────
# THUMBNAIL UPLOAD — fires in background after each successful print
# Sends a small 300px-wide JPEG to the hosted backend so the remote dashboard
# can show a live print gallery (viewable from your phone anywhere).
# ─────────────────────────────────────────────────────────────────────────────
def _upload_print_thumbnail(image_path: str, session_id: str):
    """Resize the 4x6 print to a 300px thumbnail and upload to hosted backend."""
    try:
        from PIL import Image as PILImage
        img = PILImage.open(image_path)
        # Maintain aspect ratio, max width 300px
        w, h = img.size
        thumb_w = 300
        thumb_h = int(h * thumb_w / w)
        img = img.resize((thumb_w, thumb_h), PILImage.LANCZOS)
        # Encode to JPEG in memory
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=75)
        b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
        # Upload
        requests.post(
            f"{HOSTED_BACKEND_URL}/upload_print",
            json={
                "kiosk_id": KIOSK_ID,
                "thumbnail_b64": b64,
                "timestamp": time.time(),
                "session_id": session_id,
            },
            timeout=10
        )
        logger.info(f"Print thumbnail uploaded for session {session_id}")
    except Exception as e:
        logger.warning(f"Thumbnail upload failed (non-critical): {e}")

@app.post("/print")
async def print_strip(request: PrintRequest, background_tasks: BackgroundTasks):
    session = state_manager.get_state()
    if not session:
        raise HTTPException(status_code=400, detail="No active session")
    
    # Locate Source on Desktop
    filename_final = f"{session.session_id}_final.jpg"
    print_path_abs = os.path.join(PRINTS_DIR, filename_final)
    
    # Prepare 4x6 Output on Desktop
    filename_4x6 = f"{session.session_id}_print_4x6.png"
    print_path_4x6_abs = os.path.join(PRINTS_DIR, filename_4x6)
    
    # Check if source exists; if not, auto-generate it from session photos
    if not os.path.exists(print_path_abs):
        logger.warning(f"Source strip not found at {print_path_abs}, auto-generating before print...")
        if len(session.photos) >= 4:
            input_paths_abs = [os.path.join(CAPTURES_DIR, os.path.basename(p)) for p in session.photos]
            gen_res = processor.create_strip(
                input_paths_abs,
                output_path=print_path_abs,
                filter_type=session.selected_filter,
                frame_id=session.selected_frame
            )
            if not gen_res or not os.path.exists(print_path_abs):
                logger.error(f"Failed to auto-generate strip at {print_path_abs}")
                raise HTTPException(status_code=400, detail="Photo strip generation failed")
        else:
            logger.error(f"Source strip not found and session has only {len(session.photos)} photos")
            raise HTTPException(status_code=400, detail="Photo strip not generated yet")

    # Sync Generation
    final_output_path = processor.create_4x6_layout(print_path_abs, print_path_4x6_abs)
    
    if not final_output_path or not os.path.exists(final_output_path):
        logger.error("Failed to generate 4x6 print layout")
        raise HTTPException(status_code=500, detail="Print generation failed")
    
    # Determine Color Mode
    is_bw = (session.selected_filter == "bw")
    
    # LOGIC UPDATE: 1 Physical Page = 2 Strips (4x6 Cut)
    # If user wants 2 copies (strips) -> Print 1 Page
    # If user wants 4 copies (strips) -> Print 2 Pages
    physical_copies = max(1, request.copies // 2)

    logger.info(f"--- PRINT REQUEST ---")
    logger.info(f"Session ID: {session.session_id} | Filter: {session.selected_filter} | BW: {is_bw}")
    logger.info(f"Copies: {request.copies} -> Physical Sheets: {physical_copies}")
    
    background_tasks.add_task(printer.print_image, final_output_path, physical_copies, is_bw)
    return {"status": "printing_started", "copies": request.copies, "physical_prints": physical_copies}

# ─────────────────────────────────────────────────────────────────────────────
# HEARTBEAT — sends full kiosk health to hosted cloud every 30 seconds
# ─────────────────────────────────────────────────────────────────────────────
HOSTED_BACKEND_URL = "https://polaris-hosted-backend.onrender.com"
KIOSK_ID = os.getenv("KIOSK_ID", "polaris-001")

async def heartbeat_loop():
    """
    Runs every 30 seconds in the background.
    Sends camera, printer, disk, session state to the hosted backend.
    This is what powers the remote dashboard (view from your phone anywhere).
    """
    await asyncio.sleep(10)  # Short initial delay so local services are fully ready
    while True:
        try:
            # --- Gather full health snapshot ---
            session = state_manager.get_state()
            session_step = "idle"
            if session:
                if len(session.photos) == 0:
                    session_step = "options"
                elif len(session.photos) < 4:
                    session_step = f"capture_{len(session.photos)}_of_4"
                elif session.is_printing:
                    session_step = "printing"
                else:
                    session_step = "review"

            # Printer checks
            p_color = _check_printer("EPSON L3210 Series")
            p_bw = _check_printer("EPSON L3210 BW")

            # Disk
            disk_free_gb = round(shutil.disk_usage('.').free / (1024 ** 3), 1)

            # Count prints today
            prints_today = 0
            if os.path.exists(PRINTS_DIR):
                from datetime import datetime, date
                today = date.today()
                for f in os.listdir(PRINTS_DIR):
                    fp = os.path.join(PRINTS_DIR, f)
                    if os.path.isfile(fp):
                        mtime = datetime.fromtimestamp(os.stat(fp).st_mtime).date()
                        if mtime == today:
                            prints_today += 1

            # Last print file
            last_print = None
            if os.path.exists(PRINTS_DIR):
                print_files = sorted(
                    [f for f in os.listdir(PRINTS_DIR) if f.endswith('_4x6.png')],
                    key=lambda f: os.stat(os.path.join(PRINTS_DIR, f)).st_mtime,
                    reverse=True
                )
                if print_files:
                    last_print = f"prints/{print_files[0]}"

            payload = {
                "kiosk_id": KIOSK_ID,
                "timestamp": time.time(),
                "version": "1.0.0",
                "status": {
                    "camera": "OK" if (camera.is_open and not camera.use_mock) else ("FALLBACK" if camera.use_mock else "DISCONNECTED"),
                    "camera_name": camera.active_camera_name,
                    "camera_mode": "stock_photo_fallback" if camera.use_mock else "live",
                    "printer_color": "OK" if p_color["found"] else "OFFLINE",
                    "printer_color_name": p_color.get("name") or "Not Found",
                    "printer_bw": "OK" if p_bw["found"] else "OFFLINE",
                    "printer_bw_name": p_bw.get("name") or "Not Found",
                    "disk_free_gb": disk_free_gb,
                    "internet": "CONNECTED",
                    "session_active": session is not None,
                    "session_step": session_step,
                    "prints_today": prints_today,
                    "last_print": last_print,
                }
            }

            # Send to hosted backend
            requests.post(
                f"{HOSTED_BACKEND_URL}/heartbeat",
                json=payload,
                timeout=8
            )
            logger.info(f"Heartbeat sent: cam={payload['status']['camera']} | printer_color={payload['status']['printer_color']} | session={session_step} | prints_today={prints_today}")

        except requests.exceptions.RequestException as e:
            logger.warning(f"Heartbeat network error (kiosk still running): {e}")
        except Exception as e:
            logger.error(f"Heartbeat error: {e}")

        await asyncio.sleep(30)  # Every 30 seconds

@app.on_event("startup")
async def start_heartbeat():
    asyncio.create_task(heartbeat_loop())

if __name__ == "__main__":
    import uvicorn
    # Use 127.0.0.1 to ensure it only listens locally
    uvicorn.run(app, host="127.0.0.1", port=8000)

