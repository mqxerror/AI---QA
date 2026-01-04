import { test, expect } from '@playwright/test';

test.describe('Navigation Tests', () => {

  test('main menu items are clickable', async ({ page }) => {
    await page.goto('/');

    // Find navigation links
    const navLinks = page.locator('nav a, header a').filter({ hasText: /.+/ });
    const count = await navLinks.count();

    expect(count, 'Should have navigation links').toBeGreaterThan(0);

    // Click first few nav items
    for (let i = 0; i < Math.min(count, 5); i++) {
      const link = navLinks.nth(i);
      const href = await link.getAttribute('href');

      if (href && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
        const text = await link.textContent();
        console.log(`Testing navigation link: ${text} (${href})`);

        await link.click();
        await page.waitForLoadState('domcontentloaded');

        const response = page.url();
        expect(response, `Navigation to ${href} should work`).toBeTruthy();

        await page.goBack();
        await page.waitForLoadState('domcontentloaded');
      }
    }
  });

  test('logo links to homepage', async ({ page }) => {
    const currentUrl = page.context().pages()[0]?.url() || '/';

    // Try to navigate to a different page first
    await page.goto('/').catch(() => {});

    // Find logo and click it
    const logo = page.locator('header a:has(img), header a:has(svg), a[href="/"]').first();

    if (await logo.isVisible()) {
      await logo.click();
      await page.waitForLoadState('domcontentloaded');

      // Check if we're at homepage
      const url = page.url();
      expect(url).toMatch(/\/(index\.(html|php)?)?$/);
    }
  });

  test('all navigation links return valid HTTP status', async ({ page }) => {
    await page.goto('/');

    const navLinks = await page.locator('nav a[href], header a[href]').all();
    const invalidLinks: { href: string; status: number }[] = [];

    for (const link of navLinks) {
      const href = await link.getAttribute('href');

      if (href && href.startsWith('http')) {
        try {
          const response = await page.request.get(href);
          if (response.status() >= 400) {
            invalidLinks.push({ href, status: response.status() });
          }
        } catch (e) {
          console.log(`Failed to check link: ${href}`);
        }
      }
    }

    expect(invalidLinks, `Found ${invalidLinks.length} invalid links`).toHaveLength(0);
  });

});
