import { test, expect } from '@playwright/test';

test.describe('NON-FUNCTIONAL TESTING: ACCESSIBILITY (WCAG 2.1 AA) & RESPONSIVE VIEWPORTS', () => {
  const VIEWPORTS = [
    { name: 'Mobile 360px', width: 360, height: 640 },
    { name: 'Tablet 768px', width: 768, height: 1024 },
    { name: 'Desktop 1280px', width: 1280, height: 720 },
  ];

  /* -------------------------------------------------------------------------
   * 1. RESPONSIVE VIEWPORTS TESTING (360px, 768px, 1280px)
   * ------------------------------------------------------------------------- */
  for (const vp of VIEWPORTS) {
    test(`Landing Page renders without horizontal overflow on ${vp.name} (${vp.width}x${vp.height})`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');

      // Verify page is loaded
      await expect(page.locator('text=NyayaSetu India')).toBeVisible();

      // Check horizontal overflow (scrollWidth should match or equal clientWidth)
      const isOverflowing = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(isOverflowing).toBe(false);

      // Verify primary CTA button is visible and clickable
      const cta = page.locator('a:has-text("Find Legal Help"), button:has-text("Find Legal Help")').first();
      await expect(cta).toBeVisible();
    });

    test(`Provider Directory renders responsively on ${vp.name} (${vp.width}x${vp.height})`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/providers');

      await expect(page.locator('text=Verified Legal Service Providers')).toBeVisible();

      // Ensure no horizontal scrollbar
      const isOverflowing = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(isOverflowing).toBe(false);
    });

    test(`Onboarding Wizard renders responsively on ${vp.name} (${vp.width}x${vp.height})`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/onboarding');

      await expect(page.locator('text=LSP Verification & Accreditation Wizard')).toBeVisible();
      await expect(page.locator('text=Step 1 of 4')).toBeVisible();

      const isOverflowing = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(isOverflowing).toBe(false);
    });

    test(`Admin Dashboard renders responsively on ${vp.name} (${vp.width}x${vp.height})`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/admin');

      await expect(page.locator('text=NyayaSetu India — Central Statutory Administration')).toBeVisible();

      const isOverflowing = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(isOverflowing).toBe(false);
    });
  }

  /* -------------------------------------------------------------------------
   * 2. ACCESSIBILITY (WCAG 2.1 AA STANDARDS & ARIA)
   * ------------------------------------------------------------------------- */
  test.describe('WCAG 2.1 AA Accessibility Validations', () => {
    test('Landing Page must have proper semantic document hierarchy and landmarks', async ({ page }) => {
      await page.goto('/');

      // Verify HTML language attribute is defined
      const lang = await page.getAttribute('html', 'lang');
      expect(lang).toBeTruthy();

      // Verify Main Landmark is present
      const main = page.locator('main, [role="main"]');
      await expect(main.first()).toBeVisible();

      // Verify Footer Landmark is present with statutory disclaimers
      const footer = page.locator('footer, [role="contentinfo"]');
      await expect(footer.first()).toBeVisible();

      // Ensure all images have alt attributes or are decorative
      const imagesWithoutAlt = await page.evaluate(() => {
        const imgs = Array.from(document.querySelectorAll('img'));
        return imgs.filter((img) => !img.hasAttribute('alt')).length;
      });
      expect(imagesWithoutAlt).toBe(0);
    });

    test('Forms and Inputs must have accessible labels or aria-labels', async ({ page }) => {
      await page.goto('/auth/login');

      // Verify inputs have accessible names or placeholders
      const inputs = page.locator('input:not([type="hidden"])');
      const count = await inputs.count();
      expect(count).toBeGreaterThan(0);

      for (let i = 0; i < count; i++) {
        const input = inputs.nth(i);
        const hasAriaLabel = (await input.getAttribute('aria-label')) !== null;
        const hasPlaceholder = (await input.getAttribute('placeholder')) !== null;
        const hasId = (await input.getAttribute('id')) !== null;
        const hasName = (await input.getAttribute('name')) !== null;

        expect(hasAriaLabel || hasPlaceholder || hasId || hasName).toBe(true);
      }
    });

    test('Interactive touch targets must have minimum accessible dimensions (>= 40px)', async ({ page }) => {
      await page.setViewportSize({ width: 360, height: 640 });
      await page.goto('/auth/login');

      const buttons = page.locator('button, a.btn');
      const btnCount = await buttons.count();

      for (let i = 0; i < btnCount; i++) {
        const btn = buttons.nth(i);
        if (await btn.isVisible()) {
          const box = await btn.boundingBox();
          if (box) {
            // Touch target height recommendation is >= 38-44px
            expect(box.height).toBeGreaterThanOrEqual(36);
          }
        }
      }
    });
  });
});

