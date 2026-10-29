import json
import time
from typing import Tuple, List, Optional
from selenium.webdriver.remote.webdriver import WebDriver
from selenium.webdriver.remote.webelement import WebElement
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from tests.selenium.core.hud_manager import GlassCockpitHUD

class BasePage:
    """Base class for all Page Objects with automatic HUD telemetry, visual highlights, and explicit waits."""

    def __init__(self, driver: WebDriver, hud: GlassCockpitHUD, base_url: str = "http://localhost:3000"):
        self.driver = driver
        self.hud = hud
        self.base_url = base_url.rstrip("/")

    def navigate_to(self, path: str = ""):
        """Navigates to an application path and reinjects the HUD."""
        full_url = f"{self.base_url}/{path.lstrip('/')}"
        self.hud.record_step(f"Navigating to {path or '/'}")
        self.driver.get(full_url)
        time.sleep(0.3)
        self.hud.inject_hud()

    def set_app_view(self, view_name: str):
        """Navigates to the app, sets the target view in localStorage, and refreshes cleanly."""
        self.navigate_to("/")
        self.driver.execute_script("localStorage.setItem('motorly_current_view', arguments[0]);", view_name)
        self.driver.refresh()
        time.sleep(0.4)
        self.hud.inject_hud()

    def wait_visible(self, locator: Tuple[By, str], timeout: int = 10, description: str = "") -> WebElement:
        """Waits for an element to be visible in the DOM."""
        if description:
            self.hud.record_step(description)
        wait = WebDriverWait(self.driver, timeout, poll_frequency=0.1)
        element = wait.until(EC.visibility_of_element_located(locator))
        self.hud.inject_hud()
        return element

    def wait_clickable(self, locator: Tuple[By, str], timeout: int = 10, description: str = "") -> WebElement:
        """Waits for an element to become clickable."""
        if description:
            self.hud.record_step(description)
        wait = WebDriverWait(self.driver, timeout, poll_frequency=0.1)
        element = wait.until(EC.element_to_be_clickable(locator))
        self.hud.inject_hud()
        return element

    def click(self, locator: Tuple[By, str], description: str = "", timeout: int = 10):
        """Visually highlights an element and performs a click."""
        action_desc = description or f"Clicking {locator[1]}"
        element = self.wait_clickable(locator, timeout=timeout)
        self.hud.highlight_element(element, action_type="click", description=action_desc)
        element.click()
        time.sleep(0.15)
        self.hud.inject_hud()

    def type_text(self, locator: Tuple[By, str], text: str, clear_first: bool = True, description: str = "", timeout: int = 10):
        """Visually highlights an input and types text."""
        action_desc = description or f"Typing into {locator[1]}"
        element = self.wait_visible(locator, timeout=timeout)
        self.hud.highlight_element(element, action_type="type", description=action_desc)
        if clear_first:
            element.clear()
        
        # Human-like smooth typing cadence if slowmo is enabled
        if self.hud.slowmo_ms > 0:
            for char in text:
                element.send_keys(char)
                time.sleep(0.02)
        else:
            element.send_keys(text)

        time.sleep(0.1)
        self.hud.inject_hud()

    def get_text(self, locator: Tuple[By, str], timeout: int = 10, description: str = "") -> str:
        """Retrieves inner text from an element after explicit wait."""
        element = self.wait_visible(locator, timeout=timeout, description=description)
        return element.text.strip()

    def find_all(self, locator: Tuple[By, str], timeout: int = 10) -> List[WebElement]:
        """Waits for at least one element to be present and returns list."""
        wait = WebDriverWait(self.driver, timeout, poll_frequency=0.1)
        return wait.until(EC.presence_of_all_elements_located(locator))

    def inject_auth_session(self, token: str, user_data: dict, redirect_path: str = ""):
        """Instantly injects authenticated user state into localStorage and navigates to route."""
        self.hud.record_step(f"Injecting Fast-Auth session for {user_data.get('email', 'user')}")
        self.driver.execute_script(
            """
            localStorage.setItem('auth_token', arguments[0]);
            localStorage.setItem('user', JSON.stringify(arguments[1]));
            """,
            token,
            user_data
        )
        self.navigate_to(redirect_path)
