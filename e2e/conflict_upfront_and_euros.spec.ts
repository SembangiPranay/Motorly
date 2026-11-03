import { test, expect } from "@playwright/test";

test.describe("Upfront Booking Conflict and Full Euro Localization", () => {
  test("Verifies upfront conflict notification and 100% Euro currency display", async ({ page }) => {
    // 1. Visit Homepage
    await page.goto("http://localhost:3000/");
    await page.waitForLoadState("networkidle");

    // Verify Euro currency on Homepage hero and vehicle cards
    const euroPrices = page.locator("text=/€\\d+/");
    await expect(euroPrices.first()).toBeVisible();

    // Verify Morris Gaurage (MG) Astor displays upfront conflict / maintenance notification
    const astorCard = page.locator("div.group:has-text('Morris Gaurage(MG) Astor')").first();
    await expect(astorCard).toBeVisible();

    // Verify Astor card has upfront badge (Maintenance / Reserved for Dates)
    const astorBadge = astorCard.locator("span:has-text('Maintenance'), span:has-text('Reserved')").first();
    await expect(astorBadge).toBeVisible();

    // Verify inline conflict notice on card
    const inlineNotice = astorCard.getByText(/Under garage maintenance|Reserved for/);
    await expect(inlineNotice).toBeVisible();

    // Verify Book button is disabled and indicates unavailable status
    const astorBookBtn = astorCard.locator("button:has-text('Maintenance'), button:has-text('Reserved')");
    await expect(astorBookBtn).toBeDisabled();

    // Verify price is in Euros (€)
    await expect(astorCard.locator("text=/€\\d+/")).toBeVisible();

    // Take screenshot of Homepage with upfront conflict
    await page.screenshot({
      path: "screenshots/human_e2e/conflict_upfront_homepage.png",
      fullPage: false,
    });

    // 2. Navigate to Fleet Listing page
    await page.click("button:has-text('View All')");
    await page.waitForLoadState("networkidle");

    // Verify filter displays Euros
    await expect(page.locator("text=/€\\d+\\/day/").first()).toBeVisible();

    // Verify Astor in Fleet Listing
    const fleetAstor = page.locator("div.group:has-text('Morris Gaurage(MG) Astor')").first();
    await expect(fleetAstor).toBeVisible();
    await expect(fleetAstor.locator("span:has-text('Maintenance'), span:has-text('Reserved')").first()).toBeVisible();
    await expect(fleetAstor.locator("button:has-text('Maintenance'), button:has-text('Reserved')").first()).toBeDisabled();

    await page.screenshot({
      path: "screenshots/human_e2e/conflict_upfront_fleet.png",
      fullPage: false,
    });

    // 3. Select an available car (e.g., Honda City) to view CarDetail
    const availableCarCard = page.locator("div.group:has-text('honda city')").first();
    await expect(availableCarCard).toBeVisible();
    await availableCarCard.locator("button:has-text('Details')").click();
    await page.waitForLoadState("networkidle");

    // Verify Detail view prices are in Euros (€)
    await expect(page.locator("text=/€\\d+(\\.\\d{2})?/").first()).toBeVisible();
    // Verify no stray $ signs in pricing breakdown
    const detailPricingBreakdown = page.locator("div:has-text('Estimated Total')").last();
    await expect(detailPricingBreakdown).toContainText("€");
    await expect(detailPricingBreakdown).not.toContainText("$");

    await page.screenshot({
      path: "screenshots/human_e2e/car_detail_euros.png",
      fullPage: false,
    });

    // 4. Click Request / Instant Book to navigate to Checkout
    await page.locator("button:has-text('Request This Car'), button:has-text('Instant Book')").first().click();
    await page.waitForTimeout(600);

    // If customer auth gate is shown, authenticate with registered demo user
    if (await page.locator("text=Welcome Back").isVisible().catch(() => false)) {
      await page.locator("input[type='email']").first().fill("john.doe@email.com");
      await page.locator("input[type='password']").first().fill("pass123");
      await page.locator("button[type='submit']").first().click();
      await page.waitForTimeout(1200);
    }

    // Verify Checkout has Euros
    const checkoutSummary = page.locator("div:has-text('Total Due on Pickup')").first();
    await expect(checkoutSummary).toBeVisible({ timeout: 10000 });
    await expect(checkoutSummary).toContainText("€");
    await expect(checkoutSummary).not.toContainText("$");

    // Verify 18+ driver age acceptance
    const dobInput = page.locator("input[type='date']").first();
    if (await dobInput.isVisible().catch(() => false)) {
      // Set a date corresponding to an 18/19 year old driver
      await dobInput.fill("2007-05-15");
      // Check that age restriction does not show error for 18+
      await expect(page.locator("text=Must be 21+")).not.toBeVisible();
    }

    await page.screenshot({
      path: "screenshots/human_e2e/checkout_euros_and_18plus.png",
      fullPage: false,
    });

    // 5. Navigate to Compare Vehicles
    const compareBtn = page.locator("button:has-text('Compare')").first();
    if (await compareBtn.isVisible().catch(() => false)) {
      await compareBtn.click();
      await page.waitForTimeout(1000);
      await expect(page.locator("text=/€\\d+/").first()).toBeVisible();
      await page.screenshot({
        path: "screenshots/human_e2e/compare_euros.png",
        fullPage: false,
      });
    }
  });
});
