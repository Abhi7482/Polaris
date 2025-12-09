from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import cv2
import os
import logging
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

# Process & Print
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
    
    # Assuming the processed file is at the expected location
    print_path = f"prints/{session.session_id}_final.jpg"
    if not os.path.exists(print_path):
        raise HTTPException(status_code=404, detail="Print file not found")
    
    background_tasks.add_task(printer.print_image, print_path, request.copies)
    return {"status": "printing_started", "copies": request.copies}

# Payment Integration
from payment import PhonePeService
payment_service = PhonePeService()

class PaymentRequest(BaseModel):
    amount: int # in paise
    redirect_url: str

@app.post("/pay/initiate")
async def initiate_payment(request: PaymentRequest):
    # Callback URL - In production this should be your public server URL
    # For local dev, we might not get callbacks, so we rely on redirect or polling
    callback_url = "https://polaris7482.netlify.app/payment/callback" 
    
    response = payment_service.initiate_payment(request.amount, callback_url, request.redirect_url)
    if response and response.get("success"):
        return {
            "status": "initiated",
            "url": response["data"]["instrumentResponse"]["redirectInfo"]["url"],
            "transactionId": response["data"]["merchantTransactionId"]
        }
    else:
        raise HTTPException(status_code=500, detail="Payment initiation failed")

@app.get("/pay/status/{transaction_id}")
async def check_payment_status(transaction_id: str):
    response = payment_service.check_status(transaction_id)
    if response:
        return response
    else:
        raise HTTPException(status_code=500, detail="Status check failed")

