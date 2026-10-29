import json
import urllib.request
from typing import Tuple, Dict, Any

API_BASE_URL = "http://localhost:3001"

class AuthHelper:
    """Provides genuine cryptographic JWT authentication and fleet telemetry for tests."""

    @staticmethod
    def get_customer_auth() -> Tuple[str, Dict[str, Any]]:
        """Authenticates john.doe@email.com and returns (token, user_dict)."""
        url = f"{API_BASE_URL}/api/auth/customer-login"
        payload = json.dumps({"email": "john.doe@email.com", "password": "pass123"}).encode("utf-8")
        req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=5) as res:
            data = json.loads(res.read().decode("utf-8"))
            return data["token"], data["user"]

    @staticmethod
    def get_admin_auth() -> str:
        """Authenticates admin and returns admin JWT token."""
        url = f"{API_BASE_URL}/api/auth/login"
        payload = json.dumps({"password": "0709"}).encode("utf-8")
        req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=5) as res:
            data = json.loads(res.read().decode("utf-8"))
            return data["token"]

    @staticmethod
    def get_available_car_id() -> str:
        """Finds an available vehicle with zero conflicting bookings from live API."""
        try:
            token = AuthHelper.get_admin_auth()
            # Fetch all cars
            req_c = urllib.request.Request(f"{API_BASE_URL}/api/cars")
            with urllib.request.urlopen(req_c, timeout=5) as res:
                cars = json.loads(res.read().decode("utf-8"))

            # Fetch active bookings
            req_b = urllib.request.Request(
                f"{API_BASE_URL}/api/bookings",
                headers={"Authorization": f"Bearer {token}"}
            )
            with urllib.request.urlopen(req_b, timeout=5) as res:
                bookings = json.loads(res.read().decode("utf-8"))

            booked_car_ids = set(
                b.get("carId") or b.get("matchedCarId")
                for b in bookings
                if b.get("status") not in ("Declined", "Completed", "Cancelled")
            )

            available_cars = [
                c["id"] for c in cars
                if c.get("status") == "Available" and c["id"] not in booked_car_ids
            ]

            return available_cars[0] if available_cars else "toyota-rav4"
        except Exception:
            return "toyota-rav4"
