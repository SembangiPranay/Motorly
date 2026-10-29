import os
import pytest
from datetime import datetime
from tests.selenium.core.browser_factory import BrowserFactory
from tests.selenium.core.hud_manager import GlassCockpitHUD
from tests.selenium.core.auth_helper import AuthHelper

def pytest_addoption(parser):
    parser.addoption(
        "--slowmo",
        action="store",
        default=350,
        type=int,
        help="Milliseconds delay per visual action (e.g., 350 for watching, 0 for turbo)"
    )
    parser.addoption(
        "--headless",
        action="store_true",
        default=False,
        help="Run Chrome in headless mode (default: False, visible browser window)"
    )
    parser.addoption(
        "--base-url",
        action="store",
        default="http://localhost:3000",
        help="Target base URL of DriveRent application"
    )

@pytest.fixture(scope="session")
def base_url(request):
    return request.config.getoption("--base-url")

@pytest.fixture(scope="session")
def slowmo_ms(request):
    return request.config.getoption("--slowmo")

@pytest.fixture(scope="session")
def is_headless(request):
    return request.config.getoption("--headless")

@pytest.fixture(scope="session")
def customer_auth():
    """Provides genuine customer token and user profile."""
    return AuthHelper.get_customer_auth()

@pytest.fixture(scope="session")
def admin_token():
    """Provides genuine admin JWT token."""
    return AuthHelper.get_admin_auth()

@pytest.fixture(scope="function")
def available_car_id():
    """Provides an unreserved available vehicle ID."""
    return AuthHelper.get_available_car_id()

@pytest.fixture(scope="function")
def driver(request, is_headless):
    """Initializes a visible Chrome browser with CDP capabilities."""
    driver_instance = BrowserFactory.create_chrome_driver(headless=is_headless)
    yield driver_instance
    
    # Teardown
    try:
        driver_instance.quit()
    except Exception:
        pass

@pytest.fixture(scope="function")
def hud(driver, slowmo_ms, request):
    """Injects and manages the on-screen Glass Cockpit HUD."""
    hud_instance = GlassCockpitHUD(driver, slowmo_ms=slowmo_ms)
    hud_instance.set_test_name(request.node.name)
    yield hud_instance

@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_makereport(item, call):
    outcome = yield
    rep = outcome.get_result()

    if rep.when == "call" and rep.failed:
        # Capture screenshot on failure
        driver = item.funcargs.get("driver")
        hud = item.funcargs.get("hud")
        if hud:
            hud.record_step(f"FAILED: {rep.longreprtext[:80]}", failed=True)
        if driver:
            os.makedirs("screenshots", exist_ok=True)
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"screenshots/selenium_fail_{item.name}_{timestamp}.png"
            try:
                driver.save_screenshot(filename)
                print(f"\n[Selenium Watcher] Captured failure screenshot: {filename}")
            except Exception:
                pass
    elif rep.when == "call" and rep.passed:
        hud = item.funcargs.get("hud")
        if hud:
            hud.mark_pass(item.name)
