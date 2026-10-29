import os
from typing import Dict, Any, List
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options

class BrowserFactory:
    """Creates and tunes Chrome WebDriver instances with full CDP introspection and visual display."""

    @staticmethod
    def create_chrome_driver(headless: bool = False, window_size: str = "1440,900") -> webdriver.Chrome:
        opts = Options()

        if headless:
            opts.add_argument("--headless=new")
        else:
            opts.add_argument(f"--window-size={window_size}")
            opts.add_argument("--window-position=50,50")

        # Visual & Rendering Performance Optimizations
        opts.add_argument("--disable-infobars")
        opts.add_argument("--disable-notifications")
        opts.add_argument("--disable-popup-blocking")
        opts.add_argument("--disable-background-timer-throttling")
        opts.add_argument("--disable-renderer-backgrounding")
        opts.add_argument("--disable-backgrounding-occluded-windows")
        opts.add_argument("--no-first-run")
        opts.add_argument("--no-default-browser-check")
        opts.add_argument("--remote-allow-origins=*")

        # Enable browser and performance logs for CDP introspection
        opts.set_capability("goog:loggingPrefs", {"browser": "ALL", "performance": "ALL"})

        driver = webdriver.Chrome(options=opts)
        driver.set_page_load_timeout(30)
        driver.implicitly_wait(0)  # We use explicit WebDriverWait exclusively

        return driver

    @staticmethod
    def extract_console_errors(driver: webdriver.Chrome) -> List[Dict[str, Any]]:
        """Extracts any error-level browser console logs via CDP."""
        try:
            logs = driver.get_log("browser")
            return [l for l in logs if l.get("level") in ("SEVERE", "ERROR")]
        except Exception:
            return []
