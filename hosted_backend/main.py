from fastapi import FastAPI, HTTPException, Request, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, Dict, Any
import hashlib
import base64
import json
import requests
import uuid
import logging
import time

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Polaris Hosted Backend")

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

import os

# --- Configuration ---
MERCHANT_ID = os.getenv("MERCHANT_ID", "PGTESTPAYUAT86")
SALT_KEY = os.getenv("SALT_KEY", "96434309-7796-489d-8924-ab56988a6076")
SALT_INDEX = int(os.getenv("SALT_INDEX", "1"))
ENV = os.getenv("ENV", "UAT")
BASE_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox" if ENV == "UAT" else "https://api.phonepe.com/apis/hermes"
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://polaris7482.netlify.app")

logger.info(f"--- STARTUP CONFIGURATION ---")
logger.info(f"ENV: {ENV}")
logger.info(f"BASE_URL: {BASE_URL}")
logger.info(f"MERCHANT_ID: {MERCHANT_ID}") # It's safe to log ID, but not Key
logger.info(f"-----------------------------")

# --- In-Memory Storage (Replace with DB in production) ---
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

# --- PhonePe Service Logic ---
def generate_checksum(payload: str, endpoint: str, salt_key: str, salt_index: int) -> str:
    data_to_hash = payload + endpoint + salt_key
    checksum = hashlib.sha256(data_to_hash.encode('utf-8')).hexdigest()
    return f"{checksum}###{salt_index}"

def verify_checksum(response_body: str, x_verify: str, salt_key: str, salt_index: int) -> bool:
    """
    Verifies the checksum of the webhook callback.
    """
    try:
        expected_checksum = hashlib.sha256((response_body + salt_key).encode('utf-8')).hexdigest()
        expected_x_verify = f"{expected_checksum}###{salt_index}"
        return x_verify == expected_x_verify
    except Exception as e:
        logger.error(f"Checksum verification failed: {e}")
        return False

# --- Endpoints ---

@app.get("/")
def read_root():
    return {"message": "Polaris Hosted Backend is Running"}

@app.get("/debug-config")
def debug_config():
    return {
        "ENV": ENV,
        "BASE_URL": BASE_URL,
        "MERCHANT_ID_LENGTH": len(MERCHANT_ID) if MERCHANT_ID else 0,
        "MERCHANT_ID_PREFIX": MERCHANT_ID[:4] if MERCHANT_ID else "None",
        "SALT_KEY_CONFIGURED": bool(SALT_KEY)
    }

@app.post("/create_order")
async def create_order(request: CreateOrderRequest):
    transaction_id = str(uuid.uuid4())
    
    # Callback URL for Server-to-Server communication (Webhook)
    # In production, this must be the public URL of this hosted backend
    # For now, we'll assume this backend is deployed at api.polarisdomain.com
    # We will need to update this once deployed.
    callback_url = "https://polaris-hosted-backend.onrender.com/webhook" 

    payload = {
        "merchantId": MERCHANT_ID,
        "merchantTransactionId": transaction_id,
        "merchantUserId": "MUID" + transaction_id[-6:],
        "amount": request.amount,
        "redirectUrl": f"{FRONTEND_URL}/options", # Redirect user back to frontend
        "redirectMode": "REDIRECT",
        "callbackUrl": callback_url,
        "mobileNumber": "9999999999", # Dummy for kiosk
        "paymentInstrument": {
            "type": "PAY_PAGE"
        }
    }

    payload_json = json.dumps(payload)
    base64_payload = base64.b64encode(payload_json.encode('utf-8')).decode('utf-8')
    x_verify = generate_checksum(base64_payload, "/pg/v1/pay", SALT_KEY, SALT_INDEX)

    headers = {
        "Content-Type": "application/json",
        "X-VERIFY": x_verify,
        "X-MERCHANT-ID": MERCHANT_ID
    }

    try:
        response = requests.post(
            f"{BASE_URL}/pg/v1/pay",
            json={"request": base64_payload},
            headers=headers
        )
        data = response.json()
        
        if data.get("success"):
            # Store order in DB
            orders_db[transaction_id] = {
                "status": "PENDING",
                "amount": request.amount,
                "copies": request.copies,
                "created_at": time.time()
            }
            
            return {
                "success": True,
                "payment_url": data["data"]["instrumentResponse"]["redirectInfo"]["url"],
                "order_id": transaction_id
            }
        else:
            logger.error(f"PhonePe Error: {data}")
            raise HTTPException(status_code=400, detail="Payment initiation failed")

    except Exception as e:
        logger.error(f"Payment Exception: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/webhook")
async def phonepe_webhook(request: Request):
    # Verify X-VERIFY header
    # Verify X-VERIFY header
    x_verify = request.headers.get("X-VERIFY")
    if not x_verify:
        logger.error("Missing X-VERIFY header")
        return {"status": "error", "message": "Missing Signature"}

    # Get raw body for verification
    body_bytes = await request.body()
    body_str = body_bytes.decode('utf-8')

    # Verify Signature
    try:
        response_json = await request.json() # Parse to dict for later use, but use raw str for hash
        # PhonePe documentation implies hashing the 'response' field (base64) + salt_key
        # However, for Webhooks, usually the entire body is signed or specific logic applies.
        # Standard PhonePe Webhook verification: SHA256(response_body + salt_key) ### salt_index
        # Note: request.body() gives the raw payload string.
        
        is_valid = verify_checksum(body_str, x_verify, SALT_KEY, SALT_INDEX)
        
        if not is_valid:
             logger.error("Invalid Signature")
             # In production, specific PhonePe environments might behave differently, 
             # preventing us from rejecting it outright if we are debugging. 
             # BUT to be compliant, we SHOULD reject it.
             return {"status": "error", "message": "Invalid Signature"}

    except Exception as e:
         logger.error(f"Body Read Error: {e}")
         return {"status": "error"}

    try:
        # We already parsed json above, but let's safely get it again or use the variable
        body = response_json
        encoded_response = body.get("response")
        if encoded_response:
            decoded_response = base64.b64decode(encoded_response).decode('utf-8')
            response_data = json.loads(decoded_response)
            
            transaction_id = response_data['data']['merchantTransactionId']
            state = response_data['code']
            
            if transaction_id in orders_db:
                if state == "PAYMENT_SUCCESS":
                    orders_db[transaction_id]["status"] = "SUCCESS"
                else:
                    orders_db[transaction_id]["status"] = "FAILED"
                
                logger.info(f"Order {transaction_id} updated to {state}")
            
    except Exception as e:
        logger.error(f"Webhook Error: {e}")
    
    return {"status": "ok"}

@app.get("/order_status/{order_id}")
async def get_order_status(order_id: str):
    order = orders_db.get(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Active Status Check if PENDING
    if order["status"] == "PENDING":
        try:
            # Construct Status Check URL
            status_path = f"/pg/v1/status/{MERCHANT_ID}/{order_id}"
            
            # Generate Checksum
            data_to_hash = status_path + SALT_KEY
            checksum = hashlib.sha256(data_to_hash.encode('utf-8')).hexdigest()
            x_verify = f"{checksum}###{SALT_INDEX}"
            
            headers = {
                "Content-Type": "application/json",
                "X-VERIFY": x_verify,
                "X-MERCHANT-ID": MERCHANT_ID
            }
            
            # Call PhonePe API
            response = requests.get(
                f"{BASE_URL}{status_path}",
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("code") == "PAYMENT_SUCCESS":
                    order["status"] = "SUCCESS"
                    logger.info(f"Order {order_id} active check: SUCCESS")
                elif data.get("code") == "PAYMENT_ERROR" or data.get("code") == "PAYMENT_DECLINED":
                    order["status"] = "FAILED"
                    logger.info(f"Order {order_id} active check: FAILED")
                # else: keep PENDING (e.g. PAYMENT_PENDING)
            else:
                logger.warning(f"Status Check API failed: {response.status_code}")
                
        except Exception as e:
            logger.error(f"Active Status Check Error: {e}")
            # Do not fail request, just return cached PENDING logic

    return {
        "order_id": order_id,
        "status": order["status"],
        "copies": order["copies"]
    }

@app.post("/heartbeat")
def heartbeat(request: HeartbeatRequest):
    kiosk_status_db[request.kiosk_id] = {
        "timestamp": request.timestamp,
        "status": request.status,
        "last_seen": time.time()
    }
    logger.info(f"Heartbeat from {request.kiosk_id}: {request.status}")
    return {"status": "received"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=10000)
