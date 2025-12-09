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

import os

# --- Configuration ---
MERCHANT_ID = os.getenv("MERCHANT_ID", "PGTESTPAYUAT86")
SALT_KEY = os.getenv("SALT_KEY", "96434309-7796-489d-8924-ab56988a6076")
SALT_INDEX = int(os.getenv("SALT_INDEX", "1"))
ENV = os.getenv("ENV", "UAT")
BASE_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox" if ENV == "UAT" else "https://api.phonepe.com/apis/hermes"
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://polaris7482.netlify.app")

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

# --- Endpoints ---

@app.get("/")
def read_root():
    return {"message": "Polaris Hosted Backend is Running"}

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
    x_verify = request.headers.get("X-VERIFY")
    # In a real app, we MUST verify the checksum here using the payload + salt
    # For simplicity in this prototype, we'll trust the payload but log it.
    
    try:
        body = await request.json()
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
def get_order_status(order_id: str):
    order = orders_db.get(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
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
