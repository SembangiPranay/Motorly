import time
from selenium.webdriver.common.by import By
from tests.selenium.core.base_page import BasePage

class DetailPage(BasePage):
    """Page object for the Vehicle Details view and modal."""

    # Locators
    RENTAL_RATES_TAB = (By.XPATH, '//button[contains(text(), "Rental Rates")]')
    GARAGE_MAP_TAB = (By.XPATH, '//button[contains(text(), "Garage") or contains(text(), "Map Location")]')
    PROCEED_CHECKOUT_BTN = (By.XPATH, '//button[contains(., "Request This Car") or contains(., "Instant Book") or contains(., "Proceed to Instant Checkout")]')

    def open(self, car_id: str = "porsche-911-carrera-gts-0006"):
        """Directly loads the detail view for an available car."""
        self.navigate_to("/")
        self.driver.execute_script(
            """
            localStorage.setItem('motorly_selected_car_id', arguments[0]);
            localStorage.setItem('motorly_current_view', 'detail');
            """,
            car_id
        )
        self.driver.refresh()
        time.sleep(0.4)
        self.hud.inject_hud()
        self.wait_visible(self.RENTAL_RATES_TAB, timeout=10, description=f"Waiting for Detail View ({car_id})")

    def view_garage_map(self):
        """Switches to Garage & Map Location tab."""
        self.click(self.GARAGE_MAP_TAB, description="Viewing Garage Hub & Bay Location")

    def view_rental_rates(self):
        """Switches to Rental Rates tab."""
        self.click(self.RENTAL_RATES_TAB, description="Viewing Rental Rates & Tiers")

    def proceed_to_checkout(self):
        """Clicks Proceed to Instant Checkout."""
        self.click(self.PROCEED_CHECKOUT_BTN, description="Proceeding to Instant Checkout")
