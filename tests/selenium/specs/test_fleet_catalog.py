import pytest
from tests.selenium.pages.fleet_page import FleetPage
from tests.selenium.core.browser_factory import BrowserFactory

def test_fleet_catalog_live_watch(driver, hud, base_url):
    """
    Live Watcher Test: Fleet Catalog Exploration & Filtering
    Demonstrates:
    - On-screen HUD tracking each step
    - Visual glowing pulse on category pills, sliders, and inputs
    - Real-time catalog filtering and list/grid mode toggles
    - Verification of zero client-side JavaScript console errors
    """
    fleet = FleetPage(driver, hud, base_url=base_url)

    # 1. Open Fleet Catalog
    fleet.open()
    cards = fleet.get_car_cards()
    assert len(cards) > 0, "Expected at least 1 vehicle card to be rendered"
    hud.record_step(f"Verified {len(cards)} vehicle cards loaded", api_status="200 OK")

    # 2. Filter by Category: SUVs
    fleet.filter_by_category_suv()
    hud.record_step("SUV Filter Active - Observing Cards Update")

    # 3. Reset Category back to All
    fleet.reset_category_filter()
    hud.record_step("Reset Category to All Vehicles")

    # 4. Search for vehicle
    fleet.search_vehicle("Tesla")
    hud.record_step("Executed search for 'Tesla'")

    # 5. Clear search
    fleet.search_vehicle("")
    hud.record_step("Search query cleared")

    # 6. Switch to List Mode
    fleet.toggle_list_view()
    hud.record_step("Switched display to List View")

    # 7. Switch back to Grid Mode
    fleet.toggle_grid_view()
    hud.record_step("Restored display to Grid View")

    # 8. Assert zero critical console errors
    console_errors = BrowserFactory.extract_console_errors(driver)
    assert len(console_errors) == 0, f"Observed browser console errors: {console_errors}"
