import pytest
from tests.selenium.pages.detail_page import DetailPage
from tests.selenium.pages.checkout_page import CheckoutPage
from tests.selenium.core.browser_factory import BrowserFactory

def test_vehicle_details_and_instant_checkout(driver, hud, base_url, customer_auth, available_car_id):
    """
    Live Watcher Test: Vehicle Inspection and Instant Reservation Flow
    Demonstrates:
    - Tab switching in vehicle detail view (Garage Location & Rates)
    - Transition to Checkout view
    - Autofill driver details with glowing form highlight
    - Promo code DRIVE15 validation
    - Submitting reservation and observing confirmation modal
    """
    token, user = customer_auth
    detail = DetailPage(driver, hud, base_url=base_url)
    checkout = CheckoutPage(driver, hud, base_url=base_url)

    # 1. Open Vehicle Detail View for available vehicle
    detail.open(car_id=available_car_id)
    hud.record_step(f"Loaded Vehicle Details View for {available_car_id}")

    # 2. View Garage & Map Location
    detail.view_garage_map()
    hud.record_step("Inspecting Garage Hub & Bay Location")

    # 3. View Rental Rates & Pricing Tiers
    detail.view_rental_rates()
    hud.record_step("Inspecting Tier Pricing Breakdown")

    # 4. Proceed to Checkout with verified customer session
    checkout.open(token=token, user=user, car_id=available_car_id)
    hud.record_step("Transferred to Instant Checkout View with Authenticated Customer")

    # 5. Apply Promo Code
    checkout.apply_promo_code("DRIVE15")
    hud.record_step("Applied Promo Code 'DRIVE15'", api_status="200 OK")

    # 6. Fill Driver Eligibility Dates (21+ DOB and unexpired license)
    checkout.fill_driver_dates(dob="1995-05-15", expiry="2030-05-15")

    # 7. Confirm Reservation & Pay
    checkout.confirm_and_pay()
    hud.record_step("Submitted Reservation to Backend API", api_status="201 Created")

    # 8. Verify Confirmation Modal
    checkout.wait_for_confirmation_modal()
    hud.record_step("Verified Booking Confirmation & Digital Voucher Modal")

    # 9. Dismiss Modal Cleanly
    checkout.dismiss_confirmation_modal()

    # 10. Assert zero console errors
    console_errors = BrowserFactory.extract_console_errors(driver)
    assert len(console_errors) == 0, f"Observed browser console errors: {console_errors}"
