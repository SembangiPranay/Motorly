from selenium.webdriver.common.by import By
from tests.selenium.core.base_page import BasePage

class MyBookingsPage(BasePage):
    """Page object for Customer Dashboard & Bookings."""

    DASHBOARD_CONTAINER = (By.XPATH, '//*[contains(text(), "Active Trips") or contains(text(), "Reservations") or contains(text(), "John Doe")]')
    NEW_RESERVATION_BTN = (By.XPATH, '//button[contains(text(), "Book a Car") or contains(text(), "Explore Fleet")]')

    def open(self, customer_token: str, customer_user: dict):
        """Injects customer auth and navigates to My Trips."""
        self.driver.execute_script(
            """
            localStorage.setItem('motorly_customer_token', arguments[0]);
            localStorage.setItem('motorly_customer_user', JSON.stringify(arguments[1]));
            localStorage.setItem('motorly_current_view', 'my-bookings');
            """,
            customer_token,
            customer_user
        )
        self.navigate_to("/")
        self.wait_visible(self.DASHBOARD_CONTAINER, timeout=10, description="Waiting for Customer Dashboard")
