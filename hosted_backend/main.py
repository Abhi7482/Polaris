# ── Python 3.13 compatibility patch ──────────────────────────────────────────
import sys as _sys
import types as _types
import importlib.metadata as _meta

def _iter_entry_points(group, name=None):
    try:
        eps = _meta.entry_points(group=group)
    except TypeError:
        all_eps = _meta.entry_points()
        eps = all_eps.get(group, []) if hasattr(all_eps, 'get') else []
    for ep in eps:
        if name is None or ep.name == name:
            yield ep

_pkg = _types.ModuleType("pkg_resources")
_pkg.DistributionNotFound = _meta.PackageNotFoundError
_pkg.get_distribution = _meta.distribution
_pkg.iter_entry_points = _iter_entry_points
_pkg.require = lambda *a, **kw: None
_pkg.working_set = _types.SimpleNamespace(require=lambda *a, **kw: None)
_sys.modules["pkg_resources"] = _pkg
# ─────────────────────────────────────────────────────────────────────────────

from fastapi import FastAPI, HTTPException, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import uuid
import logging
import time
import os
import json
import asyncio
import httpx

# PhonePe SDK Imports
from phonepe.sdk.pg.payments.v2.standard_checkout_client import StandardCheckoutClient
from phonepe.sdk.pg.payments.v2.models.request.standard_checkout_pay_request import StandardCheckoutPayRequest
from phonepe.sdk.pg.env import Env
from phonepe.sdk.pg.common.exceptions import PhonePeException

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Polaris Hosted Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://polaris7482.netlify.app",
        "http://localhost:5173",
        "http://localhost:4173"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# ── Config ────────────────────────────────────────────────────────────────────
CLIENT_ID      = os.getenv("CLIENT_ID", "SU2512111730364037739020")
CLIENT_SECRET  = os.getenv("CLIENT_SECRET", "YOUR_CLIENT_SECRET_HERE")
CLIENT_VERSION = int(os.getenv("CLIENT_VERSION", "1"))
ENV_MODE       = os.getenv("ENV", "PRODUCTION")
ENV_ENUM       = Env.PRODUCTION if ENV_MODE == "PRODUCTION" else Env.SANDBOX
FRONTEND_URL   = os.getenv("FRONTEND_URL", "https://polaris7482.netlify.app")
DASHBOARD_SECRET      = os.getenv("DASHBOARD_SECRET", "polaris-dashboard-2026")
TELEGRAM_BOT_TOKEN    = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID      = os.getenv("TELEGRAM_CHAT_ID", "")

# ── PhonePe SDK ───────────────────────────────────────────────────────────────
try:
    phonepe_client = StandardCheckoutClient.get_instance(
        client_id=CLIENT_ID,
        client_secret=CLIENT_SECRET,
        client_version=CLIENT_VERSION,
        env=ENV_ENUM,
        should_publish_events=False
    )
    logger.info(f"PhonePe SDK Initialized: {CLIENT_ID} ({ENV_MODE})")
except Exception as e:
    logger.critical(f"Failed to Initialize PhonePe SDK: {e}")
    phonepe_client = None

# ── In-Memory Storage ─────────────────────────────────────────────────────────
orders_db:      Dict[str, Dict[str, Any]] = {}
kiosk_registry: Dict[str, Dict[str, Any]] = {}
prints_store:   List[Dict[str, Any]]      = []   # last 50 print thumbnails
alert_state:    Dict[str, Dict[str, Any]] = {}   # tracks last alerted state per kiosk
command_queue:  Dict[str, List[Dict[str, Any]]] = {}  # pending remote commands per kiosk

# ── Models ────────────────────────────────────────────────────────────────────
class CreateOrderRequest(BaseModel):
    amount: int
    copies: int

class HeartbeatRequest(BaseModel):
    kiosk_id: str
    timestamp: float
    version: str
    status: Dict[str, Any]

class PrintUploadRequest(BaseModel):
    kiosk_id: str
    thumbnail_b64: str   # base64-encoded JPEG thumbnail
    timestamp: float
    session_id: str

class KioskCommandRequest(BaseModel):
    kiosk_id: str = "polaris-001"
    command: str  # e.g. "restart_app"

# ── Telegram Helpers ──────────────────────────────────────────────────────────
async def send_telegram(message: str):
    """Send a Telegram notification to the operator."""
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        return
    try:
        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
        async with httpx.AsyncClient(timeout=8) as client:
            await client.post(url, json={
                "chat_id": TELEGRAM_CHAT_ID,
                "text": message,
                "parse_mode": "HTML"
            })
        logger.info(f"Telegram alert sent: {message[:60]}")
    except Exception as e:
        logger.error(f"Telegram send failed: {e}")

# ── Background Alert Monitor ──────────────────────────────────────────────────
async def alert_monitor():
    """
    Runs every 60 seconds. Checks kiosk heartbeat staleness and hardware
    status changes. Sends Telegram alerts for critical issues.
    """
    await asyncio.sleep(30)  # Initial delay
    while True:
        try:
            now = time.time()
            for kiosk_id, kiosk in kiosk_registry.items():
                seconds_ago = now - kiosk["last_seen"]
                st = kiosk.get("status", {})

                if kiosk_id not in alert_state:
                    alert_state[kiosk_id] = {
                        "offline_alerted": False,
                        "camera_alerted": False,
                        "printer_color_alerted": False,
                        "printer_bw_alerted": False,
                    }

                alerts = alert_state[kiosk_id]

                # ── Kiosk offline ──────────────────────────────────────────
                if seconds_ago > 300:  # 5 minutes
                    if not alerts["offline_alerted"]:
                        await send_telegram(
                            f"🔴 <b>POLARIS ALERT — Kiosk Offline</b>\n\n"
                            f"Kiosk: <code>{kiosk_id}</code>\n"
                            f"No heartbeat for {int(seconds_ago // 60)} min {int(seconds_ago % 60)}s\n"
                            f"Time: {time.strftime('%H:%M:%S', time.localtime())}"
                        )
                        alerts["offline_alerted"] = True
                else:
                    if alerts["offline_alerted"]:
                        # Kiosk came back online
                        await send_telegram(
                            f"✅ <b>POLARIS — Kiosk Back Online</b>\n\n"
                            f"Kiosk: <code>{kiosk_id}</code> is responding again."
                        )
                    alerts["offline_alerted"] = False

                # ── Camera offline ─────────────────────────────────────────
                cam_ok = st.get("camera") in ("OK", "FALLBACK")
                if not cam_ok and not alerts["camera_alerted"]:
                    await send_telegram(
                        f"📷 <b>POLARIS ALERT — Camera Offline</b>\n\n"
                        f"Kiosk: <code>{kiosk_id}</code>\n"
                        f"Camera: {st.get('camera_name', 'Unknown')}\n"
                        f"Status: {st.get('camera', 'UNKNOWN')}"
                    )
                    alerts["camera_alerted"] = True
                elif cam_ok:
                    alerts["camera_alerted"] = False

                # ── Color printer offline ──────────────────────────────────
                p_color_ok = st.get("printer_color") == "OK"
                if not p_color_ok and not alerts["printer_color_alerted"]:
                    await send_telegram(
                        f"🖨️ <b>POLARIS ALERT — Color Printer Offline</b>\n\n"
                        f"Kiosk: <code>{kiosk_id}</code>\n"
                        f"Cannot find color printer queue. Check USB connection."
                    )
                    alerts["printer_color_alerted"] = True
                elif p_color_ok:
                    alerts["printer_color_alerted"] = False

        except Exception as e:
            logger.error(f"Alert monitor error: {e}")

        await asyncio.sleep(60)

@app.on_event("startup")
async def start_alert_monitor():
    asyncio.create_task(alert_monitor())

# ── Root ──────────────────────────────────────────────────────────────────────
@app.get("/")
def read_root():
    return {"message": "Polaris Hosted Backend Running"}

@app.get("/health")
def health():
    return {
        "status": "ok",
        "env": ENV_MODE,
        "phonepe_sdk_initialized": phonepe_client is not None,
        "client_id": CLIENT_ID,
    }

@app.get("/debug-config")
def debug_config():
    return {
        "ENV": ENV_MODE,
        "CLIENT_ID": CLIENT_ID,
        "CLIENT_VERSION": CLIENT_VERSION,
        "SDK_INITIALIZED": phonepe_client is not None
    }

# ── PAYMENT ENDPOINTS (UNCHANGED) ─────────────────────────────────────────────
@app.post("/create_order")
async def create_order(request: CreateOrderRequest):
    if not phonepe_client:
        raise HTTPException(status_code=500, detail="Payment gateway not initialized")

    merchant_order_id = str(uuid.uuid4()).replace("-", "")[:30]
    try:
        pay_request = StandardCheckoutPayRequest.build_request(
            merchant_order_id=merchant_order_id,
            amount=request.amount,
            redirect_url=f"{FRONTEND_URL}/payment-success?merchantTransactionId={merchant_order_id}"
        )
        response = phonepe_client.pay(pay_request)
        orders_db[merchant_order_id] = {
            "status": "PENDING",
            "amount": request.amount,
            "copies": request.copies,
            "created_at": time.time()
        }
        return {"success": True, "payment_url": response.redirect_url, "order_id": merchant_order_id}

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

    if order["status"] == "PENDING" and phonepe_client:
        try:
            response = phonepe_client.get_order_status(merchant_order_id=order_id)
            if response.state == "COMPLETED":
                order["status"] = "SUCCESS"
            elif response.state == "FAILED":
                order["status"] = "FAILED"
        except PhonePeException as e:
            logger.error(f"Status Check SDK Error: {e}")
        except Exception as e:
            logger.error(f"Status Check General Error: {e}")

    return {"order_id": order_id, "status": order["status"], "copies": order["copies"]}

@app.post("/webhook")
async def phonepe_webhook(request: Request):
    if not phonepe_client:
        return {"status": "error", "message": "SDK not active"}
    try:
        data = await request.json()
        encoded_response = data.get("response")
        if encoded_response:
            import base64
            decoded = base64.b64decode(encoded_response).decode('utf-8')
            resp_data = json.loads(decoded)
            txn_id = resp_data['data']['merchantTransactionId']
            state = resp_data['code']
            if txn_id in orders_db:
                orders_db[txn_id]["status"] = "SUCCESS" if state == "PAYMENT_SUCCESS" else "FAILED"
                logger.info(f"Webhook: Order {txn_id} → {state}")
    except Exception as e:
        logger.error(f"Webhook Error: {e}")
    return {"status": "ok"}

# ── HEARTBEAT ─────────────────────────────────────────────────────────────────
@app.post("/heartbeat")
def heartbeat(request: HeartbeatRequest):
    kiosk_registry[request.kiosk_id] = {
        "kiosk_id": request.kiosk_id,
        "timestamp": request.timestamp,
        "version": request.version,
        "status": request.status,
        "last_seen": time.time(),
    }
    pending = command_queue.pop(request.kiosk_id, [])
    logger.info(f"Heartbeat ← {request.kiosk_id} | cam={request.status.get('camera')} | session={request.status.get('session_step')}")
    return {"status": "received", "commands": pending}

# ── PRINT UPLOAD ──────────────────────────────────────────────────────────────
@app.post("/upload_print")
async def upload_print(request: PrintUploadRequest):
    """
    Called by the kiosk after every successful print.
    Stores a base64 thumbnail for the dashboard gallery.
    Keeps only the last 50 prints in memory.
    """
    global prints_store
    prints_store.insert(0, {
        "kiosk_id": request.kiosk_id,
        "session_id": request.session_id,
        "thumbnail": request.thumbnail_b64,
        "timestamp": request.timestamp,
    })
    prints_store = prints_store[:50]  # Keep only last 50
    logger.info(f"Print uploaded from {request.kiosk_id} · total stored: {len(prints_store)}")
    return {"status": "stored", "total": len(prints_store)}

# ── DASHBOARD (authenticated by ?key=) ───────────────────────────────────────
def _auth(key: Optional[str]):
    if not key or key != DASHBOARD_SECRET:
        raise HTTPException(status_code=403, detail="Invalid or missing dashboard key")

@app.get("/dashboard/status")
def dashboard_status(key: Optional[str] = None):
    _auth(key)
    now = time.time()
    result = {}
    for kiosk_id, data in kiosk_registry.items():
        seconds_ago = round(now - data["last_seen"])
        result[kiosk_id] = {
            **data,
            "seconds_ago": seconds_ago,
            "online_status": (
                "online" if seconds_ago < 60
                else "slow" if seconds_ago < 120
                else "offline"
            ),
        }

    today_start = now - (now % 86400)
    today_orders = [o for o in orders_db.values() if o.get("created_at", 0) > today_start]
    successful = [o for o in today_orders if o["status"] == "SUCCESS"]

    return {
        "kiosks": result,
        "summary": {
            "orders_today": len(today_orders),
            "successful_payments_today": len(successful),
            "revenue_today_inr": sum(o["amount"] for o in successful) / 100,
        }
    }

@app.get("/dashboard/prints")
def dashboard_prints(key: Optional[str] = None):
    _auth(key)
    return {"prints": prints_store, "total": len(prints_store)}

@app.post("/dashboard/command")
def dashboard_command(req: KioskCommandRequest, key: Optional[str] = None):
    _auth(key)
    if req.command not in ("restart_app",):
        raise HTTPException(status_code=400, detail="Unsupported command")
    command_queue.setdefault(req.kiosk_id, []).append({
        "command": req.command,
        "queued_at": time.time(),
    })
    logger.info(f"Queued remote command '{req.command}' for {req.kiosk_id}")
    return {"status": "queued", "kiosk_id": req.kiosk_id, "command": req.command}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=10000)
