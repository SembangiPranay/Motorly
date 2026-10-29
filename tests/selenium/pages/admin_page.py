import time
from selenium.webdriver.common.by import By
from tests.selenium.core.base_page import BasePage

class AdminPage(BasePage):
    """Page object for Admin Command Center."""

    # Locators
    ADMIN_HEADER = (By.XPATH, '//*[contains(text(), "Studio Director Console") or contains(text(), "FLEET & ASSET INVENTORY") or contains(text(), "Fleet & Inventory")]')
    ORDERS_TAB = (By.XPATH, '//button[contains(., "Orders & Dispatch")]')
    FLEET_TAB = (By.XPATH, '//button[contains(., "Fleet & Inventory")]')
    CRM_TAB = (By.XPATH, '//button[contains(., "Customers & Drivers")]')
    PROMOS_TAB = (By.XPATH, '//button[contains(., "Privileges & Coupons")]')

    def open(self, admin_token: str = "demo_admin_jwt", admin_user: dict = None):
        """Injects admin token and opens Admin Command Center."""
        self.navigate_to("/")
        user = admin_user or {
            "userId": "usr_admin",
            "email": "admin@motorly.com",
            "name": "Fleet Operations Admin",
            "role": "admin",
            "vipTier": "VIP"
        }
        self.driver.execute_script(
            """
            localStorage.setItem('motorly_admin_token', arguments[0]);
            localStorage.setItem('motorly_admin_user', JSON.stringify(arguments[1]));
            localStorage.setItem('motorly_current_view', 'admin');
            """,
            admin_token,
            user
        )
        self.driver.refresh()
        time.sleep(0.5)
        self.hud.inject_hud()
        self.wait_visible(self.ADMIN_HEADER, timeout=12, description="Waiting for Admin Command Center")

    def switch_to_fleet_tab(self):
        """Switches to Fleet & Asset Inventory tab."""
        self.click(self.FLEET_TAB, description="Switching to Fleet & Asset Inventory tab")

    def switch_to_orders_tab(self):
        """Switches to Orders & Dispatch Registry tab."""
        self.click(self.ORDERS_TAB, description="Switching to Orders & Dispatch Registry tab")

    def switch_to_crm_tab(self):
        """Switches to Customer CRM tab."""
        self.click(self.CRM_TAB, description="Switching to Customer CRM tab")
