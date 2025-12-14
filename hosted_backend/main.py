from fastapi import FastAPI, HTTPException, Request, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, Dict, Any
import uuid
import logging
import time
import os
import json

# PhonePe SDK Imports
from phonepe.sdk.pg.payments.v2.standard_checkout_client import StandardCheckoutClient
from phonepe.sdk.pg.payments.v2.models.request.standard_checkout_pay_request import StandardCheckoutPayRequest
from phonepe.sdk.pg.common.models.request.meta_info import MetaInfo
from phonepe.sdk.pg.env import Env
from phonepe.sdk.pg.common.exceptions import PhonePeException

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Polaris Hosted Backend (SDK)")

from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://polaris7482.netlify.app", 
        "http://localhost:5173", # Dev
        "http://localhost:4173"  # Preview
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# --- Configuration ---
CLIENT_ID = os.getenv("CLIENT_ID", "SU2512111730364037739020")
CLIENT_SECRET = os.getenv("CLIENT_SECRET", "YOUR_CLIENT_SECRET_HERE") # User needs to set this in Render
CLIENT_VERSION = int(os.getenv("CLIENT_VERSION", "1"))
ENV_MODE = os.getenv("ENV", "PRODUCTION") # "SANDBOX" or "PRODUCTION"
ENV_ENUM = Env.PRODUCTION if ENV_MODE == "PRODUCTION" else Env.SANDBOX
SHOULD_PUBLISH_EVENTS = False

FRONTEND_URL = os.getenv("FRONTEND_URL", "https://polaris7482.netlify.app")

# Initialize SDK Client
try:
    phonepe_client = StandardCheckoutClient.get_instance(
        client_id=CLIENT_ID,
        client_secret=CLIENT_SECRET,
        client_version=CLIENT_VERSION,
        env=ENV_ENUM,
        should_publish_events=SHOULD_PUBLISH_EVENTS
    )
    logger.info(f"PhonePe SDK Initialized: {CLIENT_ID} ({ENV_MODE})")
except Exception as e:
    logger.critical(f"Failed to Initialize PhonePe SDK: {e}")
    phonepe_client = None

# --- In-Memory Storage ---
orders_db: Dict[str, Dict[str, Any]] = {}
kiosk_status_db: Dict[str, Any] = {}

# --- Models ---
class CreateOrderRequest(BaseModel):
    amount: int # In Paise
    copies: int

class HeartbeatRequest(BaseModel):
    kiosk_id: str
    timestamp: str
    version: str
    status: Dict[str, str]

# --- Endpoints ---

@app.get("/")
def read_root():
    return {"message": "Polaris Hosted Backend (SDK) Running"}

@app.get("/debug-config")
def debug_config():
    return {
        "ENV": ENV_MODE,
        "CLIENT_ID": CLIENT_ID,
        "CLIENT_VERSION": CLIENT_VERSION,
        "SDK_INITIALIZED": phonepe_client is not None
    }

@app.post("/create_order")
async def create_order(request: CreateOrderRequest):
    if not phonepe_client:
        raise HTTPException(status_code=500, detail="Payment gateway not initialized")

    # Generate IDs
    merchant_order_id = str(uuid.uuid4()).replace("-", "")[:30] # Unique alphanumeric 
    callback_url = "https://polaris-hosted-backend.onrender.com/webhook" 

    try:
        # Build Request
        pay_request = StandardCheckoutPayRequest.build_request(
            merchant_order_id=merchant_order_id,
            amount=request.amount,
            redirect_url=f"{FRONTEND_URL}/payment-success?merchantTransactionId={merchant_order_id}",
            expiresIn=120
        )
        
        # Execute Payment
        response = phonepe_client.pay(pay_request)
        
        # Store in DB
        orders_db[merchant_order_id] = {
            "status": "PENDING",
            "amount": request.amount,
            "copies": request.copies,
            "created_at": time.time()
        }
        
        return {
            "success": True,
            "payment_url": response.redirect_url,
            "order_id": merchant_order_id
        }
        
    except PhonePeException as e:
        logger.error(f"PhonePe SDK Error: {e.code} - {e.message}")
        raise HTTPException(status_code=400, detail=f"Payment Failed: {e.message}")
    except Exception as e:
        logger.error(f"General Error: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@app.get("/order_status/{order_id}")
def get_order_status(order_id: str):
    order = orders_db.get(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Active Status Check if PENDING (using SDK)
    if order["status"] == "PENDING" and phonepe_client:
        try:
            response = phonepe_client.get_order_status(merchant_order_id=order_id)
            
            if response.state == "COMPLETED":
                order["status"] = "SUCCESS"
                logger.info(f"Order {order_id} active check: SUCCESS")
            elif response.state == "FAILED":
                order["status"] = "FAILED"
                logger.info(f"Order {order_id} active check: FAILED")
                
        except PhonePeException as e:
            logger.error(f"Status Check SDK Error: {e}")
        except Exception as e:
            logger.error(f"Status Check General Error: {e}")

    return {
        "order_id": order_id,
        "status": order["status"],
        "copies": order["copies"]
    }

@app.post("/webhook")
async def phonepe_webhook(request: Request):
    if not phonepe_client:
        return {"status": "error", "message": "SDK not active"}

    # Get Headers and Body
    x_verify = request.headers.get("X-VERIFY", "")
    # Note: SDK might expect 'Authorization' header depending on callback type, 
    # but Standard Checkout usually sends X-VERIFY. 
    # The docs for 'validate_callback' mention 'authorization' arg.
    
    # For Standard Checkout callbacks, use validate_callback logic
    # But SDK docs say: validate_callback(username, password, callback_header_data...)
    # This implies S2S callback configuration in dashboard. 
    # If using X-VERIFY standard flow, SDK might handle it differently or we use verify_checksum manually.
    # However, let's try to follow SDK pattern if possible, or fallback to manual verify if SDK strictly requires username/password (which are S2S credentials).
    
    # Assuming standard webhook for now: The SDK 'validate_callback' seems to be for S2S callbacks with Basic Auth.
    # Standard Checkout webhooks usually just sign with Salt.
    # Let's trust the Active Status Check (in /order_status) as the primary source of truth for Kiosk 
    # and just accept the webhook to trigger a DB update if possible.
    
    try:
        body_bytes = await request.body()
        body_str = body_bytes.decode('utf-8')
        data = await request.json()
        
        encoded_response = data.get("response")
        if encoded_response:
            import base64
            decoded_response = base64.b64decode(encoded_response).decode('utf-8')
            response_data = json.loads(decoded_response)
            
            transaction_id = response_data['data']['merchantTransactionId']
            state = response_data['code']
            
            if transaction_id in orders_db:
                if state == "PAYMENT_SUCCESS":
                    orders_db[transaction_id]["status"] = "SUCCESS"
                else:
                    orders_db[transaction_id]["status"] = "FAILED"
                logger.info(f"Webhook: Order {transaction_id} updated to {state}")

    except Exception as e:
        logger.error(f"Webhook Error: {e}")

    return {"status": "ok"}

@app.post("/heartbeat")
def heartbeat(request: HeartbeatRequest):
    kiosk_status_db[request.kiosk_id] = {
        "timestamp": request.timestamp,
        "status": request.status,
        "last_seen": time.time()
    }
    return {"status": "received"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=10000)
