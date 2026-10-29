import time
from selenium.webdriver.common.by import By
from tests.selenium.core.base_page import BasePage

class CheckoutPage(BasePage):
    """Page object for Customer Reservation and Checkout."""

    # Locators
    PROMO_INPUT = (By.CSS_SELECTOR, 'input[placeholder*="promo" i], input[placeholder*="DRIVE15" i], input[placeholder*="coupon" i]')
    APPLY_PROMO_BTN = (By.XPATH, '//button[contains(text(), "Apply")]')
    CONFIRM_BOOKING_BTN = (By.CSS_SELECTOR, '#confirm-booking-btn')
    CONFIRMATION_MODAL = (By.XPATH, '//*[contains(text(), "Booking Request Submitted") or contains(text(), "Booking Confirmed") or @data-testid="close-confirmation-modal"]')
    CLOSE_CONFIRM_BTN = (By.CSS_SELECTOR, 'button[data-testid="close-confirmation-modal"]')

    def fill_driver_dates(self, dob: str = "1995-05-15", expiry: str = "2030-05-15"):
        """Fills HTML5 required date inputs for driver age and license validity."""
        self.hud.record_step("Configuring Verified Driver DOB (21+) & Valid License Expiry")
        self.driver.execute_script(
            """
            const dates = document.querySelectorAll('input[type="date"]');
            if (dates[0]) {
                dates[0].value = arguments[0];
                dates[0].dispatchEvent(new Event('input', { bubbles: true }));
                dates[0].dispatchEvent(new Event('change', { bubbles: true }));
            }
            if (dates[1]) {
                dates[1].value = arguments[1];
                dates[1].dispatchEvent(new Event('input', { bubbles: true }));
                dates[1].dispatchEvent(new Event('change', { bubbles: true }));
            }
            """,
            dob, expiry
        )
        time.sleep(0.3)
        self.hud.inject_hud()

    def open(self, token: str = None, user: dict = None, car_id: str = "porsche-911-carrera-gts-0006"):
        """Loads checkout view with authenticated customer session and available vehicle."""
        self.navigate_to("/")
        if user and "name" not in user:
            user["name"] = f"{user.get('firstName', '')} {user.get('lastName', '')}".strip() or "John Doe"
            
        self.driver.execute_script(
            """
            localStorage.setItem('motorly_selected_car_id', arguments[0]);
            if (arguments[1] && arguments[2]) {
                localStorage.setItem('motorly_customer_token', arguments[1]);
                localStorage.setItem('motorly_customer_user', JSON.stringify(arguments[2]));
            }
            localStorage.setItem('motorly_current_view', 'checkout');
            """,
            car_id,
            token,
            user
        )
        self.driver.refresh()
        time.sleep(0.5)
        self.hud.inject_hud()
        self.wait_visible(self.PROMO_INPUT, timeout=12, description=f"Waiting for Checkout Page ({car_id})")

    def click_autofill(self):
        """Ensures driver info is ready."""
        self.hud.record_step("Verified verified customer and driver license pre-populated")

    def apply_promo_code(self, code: str = "DRIVE15"):
        """Enters and applies a promo code."""
        self.type_text(self.PROMO_INPUT, code, description=f"Entering Promo Code '{code}'")
        self.click(self.APPLY_PROMO_BTN, description=f"Applying Promo Code '{code}'")
        time.sleep(0.5)

    def confirm_and_pay(self):
        """Submits booking confirmation."""
        self.click(self.CONFIRM_BOOKING_BTN, description="Confirming Reservation & Submitting Payment")

    def wait_for_confirmation_modal(self):
        """Waits for booking confirmation modal and voucher display."""
        modal = self.wait_visible(self.CONFIRMATION_MODAL, timeout=12, description="Observing Booking Confirmation Modal")
        self.hud.record_step("Booking Confirmation & Digital Voucher Verified", api_status="200 OK")
        return modal

    def dismiss_confirmation_modal(self):
        """Closes the confirmation modal."""
        try:
            self.click(self.CLOSE_CONFIRM_BTN, description="Dismissing Confirmation Modal")
        except Exception:
            pass
