import hashlib
import base64
import json
import requests
import uuid

# PhonePe Test Credentials
MERCHANT_ID = "PGTESTPAYUAT86"
SALT_KEY = "96434309-7796-489d-8924-ab56988a6076"
SALT_INDEX = 1
ENV = "UAT"  # "PROD" for production

BASE_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox" if ENV == "UAT" else "https://api.phonepe.com/apis/hermes"

class PhonePeService:
    def __init__(self):
        self.merchant_id = MERCHANT_ID
        self.salt_key = SALT_KEY
        self.salt_index = SALT_INDEX
        self.base_url = BASE_URL

    def initiate_payment(self, amount_in_paise: int, callback_url: str, redirect_url: str):
        transaction_id = str(uuid.uuid4())
        
        payload = {
            "merchantId": self.merchant_id,
            "merchantTransactionId": transaction_id,
            "merchantUserId": "MUID" + transaction_id[-6:],
            "amount": amount_in_paise,
            "redirectUrl": redirect_url,
            "redirectMode": "REDIRECT",
            "callbackUrl": callback_url,
            "mobileNumber": "9999999999",
            "paymentInstrument": {
                "type": "PAY_PAGE"
            }
        }

        # Encode payload to base64
        payload_json = json.dumps(payload)
        base64_payload = base64.b64encode(payload_json.encode('utf-8')).decode('utf-8')

        # Create X-VERIFY header
        # SHA256(base64Payload + "/pg/v1/pay" + saltKey) + ### + saltIndex
        data_to_hash = base64_payload + "/pg/v1/pay" + self.salt_key
        checksum = hashlib.sha256(data_to_hash.encode('utf-8')).hexdigest()
        x_verify = f"{checksum}###{self.salt_index}"

        headers = {
            "Content-Type": "application/json",
            "X-VERIFY": x_verify,
            "X-MERCHANT-ID": self.merchant_id
        }

        try:
            response = requests.post(
                f"{self.base_url}/pg/v1/pay",
                json={"request": base64_payload},
                headers=headers
            )
            print(f"PhonePe Status: {response.status_code}")
            print(f"PhonePe Response: {response.text}")
            return response.json()
        except Exception as e:
            print(f"Payment initiation failed: {e}")
            return None

    def check_status(self, transaction_id: str):
        # /pg/v1/status/{merchantId}/{merchantTransactionId}
        # SHA256("/pg/v1/status/{merchantId}/{merchantTransactionId}" + saltKey) + ### + saltIndex
        
        path = f"/pg/v1/status/{self.merchant_id}/{transaction_id}"
        data_to_hash = path + self.salt_key
        checksum = hashlib.sha256(data_to_hash.encode('utf-8')).hexdigest()
        x_verify = f"{checksum}###{self.salt_index}"

        headers = {
            "Content-Type": "application/json",
            "X-VERIFY": x_verify,
            "X-MERCHANT-ID": self.merchant_id
        }

        try:
            response = requests.get(
                f"{self.base_url}{path}",
                headers=headers
            )
            return response.json()
        except Exception as e:
            print(f"Status check failed: {e}")
            return None
