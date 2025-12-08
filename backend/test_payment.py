import hashlib
import base64
import json
import requests
import uuid

# PhonePe Test Credentials
MERCHANT_ID = "PGTESTPAYUAT86"
SALT_KEY = "96434309-7796-489d-8924-ab56988a6076"
SALT_INDEX = 1
BASE_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox"

def test_payment():
    transaction_id = str(uuid.uuid4())
    payload = {
        "merchantId": MERCHANT_ID,
        "merchantTransactionId": transaction_id,
        "merchantUserId": "MUID123",
        "amount": 100,
        "redirectUrl": "https://google.com",
        "redirectMode": "REDIRECT",
        "callbackUrl": "https://google.com",
        "mobileNumber": "9999999999",
        "paymentInstrument": {
            "type": "PAY_PAGE"
        }
    }

    payload_json = json.dumps(payload)
    base64_payload = base64.b64encode(payload_json.encode('utf-8')).decode('utf-8')

    data_to_hash = base64_payload + "/pg/v1/pay" + SALT_KEY
    checksum = hashlib.sha256(data_to_hash.encode('utf-8')).hexdigest()
    x_verify = f"{checksum}###{SALT_INDEX}"

    headers = {
        "Content-Type": "application/json",
        "X-VERIFY": x_verify,
        "X-MERCHANT-ID": MERCHANT_ID
    }

    print("Sending request to PhonePe...")
    try:
        response = requests.post(
            f"{BASE_URL}/pg/v1/pay",
            json={"request": base64_payload},
            headers=headers
        )
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_payment()
