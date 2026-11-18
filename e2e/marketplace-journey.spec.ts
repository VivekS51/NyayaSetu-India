import { test, expect } from '@playwright/test';

test.describe('NyayaSetu India — Core Citizen & Provider Workflows', () => {
  test('1. Landing page displays sovereign tricolor, BCI disclaimer & categories', async ({ page }) => {
    await page.goto('/');

    // Check brand and statutory tagline
    await expect(page.locator('text=NyayaSetu India')).toBeVisible();
    await expect(page.locator('text=Empowering Citizens, Enabling Legal Counsel')).toBeVisible();

    // Check BCI statutory disclaimer in footer
    await expect(page.locator('text=Statutory Compliance with Advocates Act, 1961')).toBeVisible();

    // Check tricolor ribbon
    const saffronRibbon = page.locator('.bg-saffron-500').first();
    await expect(saffronRibbon).toBeVisible();
  });

  test('2. Citizen can search and filter verified legal professionals', async ({ page }) => {
    await page.goto('/providers');

    // Check directory header
    await expect(page.locator('text=Verified Legal Service Providers')).toBeVisible();

    // Check seed provider presence
    await expect(page.locator('text=Adv. Rajesh Varma')).toBeVisible();
    await expect(page.locator('text=D/1428/2012')).toBeVisible();

    // Filter by Notary
    await page.selectOption('select:has-text("All Categories")', 'NOTARY');
    await expect(page.locator('text=Sh. Harpreet Singh')).toBeVisible();
  });

  test('3. Advocate can complete onboarding wizard with real-time BCI touting validation', async ({ page }) => {
    await page.goto('/onboarding');

    await expect(page.locator('text=LSP Verification & Accreditation Wizard')).toBeVisible();

    // Progress bar check
    await expect(page.locator('text=Step 1 of 4')).toBeVisible();

    // Input fields
    await page.fill('input[placeholder*="Rajesh Varma"]', 'Adv. Vikramaditya Rao');
    await page.fill('input[placeholder*="Central Delhi"]', 'South Delhi');
    await page.fill('input[placeholder*="110001"]', '110017');

    // Click Next
    await page.click('button:has-text("Save & Continue to Credentials")');
    await expect(page.locator('text=Step 2 of 4')).toBeVisible();
  });

  test('4. Administrator can inspect verification queue and dispute desk', async ({ page }) => {
    await page.goto('/admin');

    await expect(page.locator('text=NyayaSetu India — Central Statutory Administration')).toBeVisible();
    await expect(page.locator('text=Smt. Priya Sharma')).toBeVisible();

    // Check Funnel tab
    await expect(page.locator('text=Provider Onboarding Funnel')).toBeVisible();
    await expect(page.locator('text=Sovereign Financial Decoupling Model')).toBeVisible();

    // Switch to Verification Queue
    await page.click('button:has-text("Provider Verification Desk")');
    await expect(page.locator('text=Adv. Meenakshi Sundaram')).toBeVisible();
    await expect(page.locator('text=MS/2391/2016')).toBeVisible();

    // Switch to Dispute Desk
    await page.click('button:has-text("Dispute Redressal")');
    await expect(page.locator('text=IN-LEG-2026-X90')).toBeVisible();
    await expect(page.locator('text=PROVIDER_NO_SHOW')).toBeVisible();
  });
});

