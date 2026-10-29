from typing import List
from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webelement import WebElement
from tests.selenium.core.base_page import BasePage

class FleetPage(BasePage):
    """Page object for the DriveRent Fleet Catalog view."""

    # Locators
    SEARCH_INPUT = (By.CSS_SELECTOR, 'input[placeholder*="Search"]')
    CATEGORY_SUVS = (By.XPATH, '//button[contains(text(), "SUVs")]')
    CATEGORY_ALL = (By.XPATH, '//button[contains(text(), "All Vehicles")]')
    PRICE_SLIDER = (By.CSS_SELECTOR, 'input[type="range"]')
    LIST_VIEW_BTN = (By.CSS_SELECTOR, 'button[title="List View"]')
    GRID_VIEW_BTN = (By.CSS_SELECTOR, 'button[title="Grid View"]')
    CAR_CARDS = (By.XPATH, '//div[contains(@class, "rounded-3xl") and .//h3]')
    FIRST_BOOK_BTN = (By.XPATH, '(//button[contains(text(), "Details")])[1]')

    def open(self):
        """Opens the fleet catalog view via localStorage and navigation."""
        self.set_app_view("listing")
        self.wait_visible(self.SEARCH_INPUT, timeout=10, description="Waiting for Fleet Catalog to load")

    def search_vehicle(self, query: str):
        """Searches for a vehicle by typing into search input."""
        self.type_text(self.SEARCH_INPUT, query, description=f"Searching for '{query}'")

    def filter_by_category_suv(self):
        """Clicks the SUVs category pill filter."""
        self.click(self.CATEGORY_SUVS, description="Filtering by Category: SUVs")

    def reset_category_filter(self):
        """Resets the category filter back to All Vehicles."""
        self.click(self.CATEGORY_ALL, description="Resetting to All Vehicles")

    def adjust_price_slider(self, value: int):
        """Adjusts the price slider."""
        slider = self.wait_visible(self.PRICE_SLIDER, description="Locating Price Slider")
        self.hud.highlight_element(slider, action_type="type", description=f"Adjusting Price Slider to ${value}")
        self.driver.execute_script(
            """
            arguments[0].value = arguments[1];
            arguments[0].dispatchEvent(new Event('input', { bubbles: true }));
            arguments[0].dispatchEvent(new Event('change', { bubbles: true }));
            """,
            slider, str(value)
        )

    def toggle_list_view(self):
        """Toggles list view mode."""
        self.click(self.LIST_VIEW_BTN, description="Switching to List View mode")

    def toggle_grid_view(self):
        """Toggles grid view mode."""
        self.click(self.GRID_VIEW_BTN, description="Switching to Grid View mode")

    def get_car_cards(self) -> List[WebElement]:
        """Returns all rendered vehicle cards."""
        return self.find_all(self.CAR_CARDS, timeout=8)

    def select_first_vehicle(self):
        """Clicks the details or book button on the first vehicle."""
        self.click(self.FIRST_BOOK_BTN, description="Selecting first vehicle card")
