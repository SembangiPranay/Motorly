import pytest
from tests.selenium.pages.admin_page import AdminPage
from tests.selenium.core.browser_factory import BrowserFactory

def test_admin_command_center_workflow(driver, hud, base_url, admin_token):
    """
    Live Watcher Test: Admin Command Center Inspection
    Demonstrates:
    - Fast-auth admin session injection bypassing manual login forms
    - Real-time tab transitions across Fleet Inventory, Orders Registry, and CRM
    - HUD tracking and verification of zero console crashes
    """
    admin = AdminPage(driver, hud, base_url=base_url)

    # 1. Open Admin Command Center
    admin.open(admin_token=admin_token)
    hud.record_step("Accessed Admin Command Center with authorized session")

    # 2. Switch to Orders & Dispatch Registry
    admin.switch_to_orders_tab()
    hud.record_step("Viewing Orders & Dispatch Registry")

    # 3. Switch to Customer CRM
    admin.switch_to_crm_tab()
    hud.record_step("Viewing Customer CRM & Verified Drivers")

    # 4. Switch back to Fleet & Asset Inventory
    admin.switch_to_fleet_tab()
    hud.record_step("Returned to Fleet Inventory Table")

    # 5. Assert zero critical console errors
    console_errors = BrowserFactory.extract_console_errors(driver)
    assert len(console_errors) == 0, f"Observed browser console errors: {console_errors}"
