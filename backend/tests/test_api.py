from fastapi.testclient import TestClient
from backend.main import app
import os

client = TestClient(app)

def test_read_main():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Polaris.co Backend Online"}

def test_status():
    response = client.get("/status")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "camera" in data
    assert "session" in data

def test_session_flow():
    # Start session
    response = client.post("/session/start")
    assert response.status_code == 200
    session_id = response.json()["session_id"]
    assert session_id is not None

    # Check status again
    response = client.get("/status")
    data = response.json()
    assert data["session"]["session_id"] == session_id

    # Reset
    response = client.post("/session/reset")
    assert response.status_code == 200
    
    response = client.get("/status")
    assert response.json()["session"] is None
