import { test, expect } from '@playwright/test';

test.describe('Homepage Smoke Tests', () => {

  test('page loads successfully', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBeLessThan(400);
    await expect(page).toHaveTitle(/./); // Has any title
  });

  test('no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    expect(errors).toHaveLength(0);
  });

  test('all images load', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const images = await page.locator('img').all();
    for (const img of images) {
      const src = await img.getAttribute('src');
      if (src && !src.startsWith('data:')) {
        const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
        expect(naturalWidth, `Image ${src} should load`).toBeGreaterThan(0);
      }
    }
  });

  test('no broken links (first 20)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const links = await page.locator('a[href]').all();
    const brokenLinks: string[] = [];

    for (const link of links.slice(0, 20)) {
      const href = await link.getAttribute('href');
      if (href && href.startsWith('http')) {
        try {
          const response = await page.request.head(href);
          if (response.status() >= 400) {
            brokenLinks.push(`${href} (${response.status()})`);
          }
        } catch (e) {
          brokenLinks.push(`${href} (failed)`);
        }
      }
    }

    expect(brokenLinks, 'Broken links found').toHaveLength(0);
  });

  test('main navigation visible', async ({ page }) => {
    await page.goto('/');

    const nav = page.locator('nav, header, [role="navigation"]').first();
    await expect(nav).toBeVisible();
  });

  test('footer visible', async ({ page }) => {
    await page.goto('/');

    const footer = page.locator('footer').first();
    await expect(footer).toBeVisible();
  });

  test('page responds within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - startTime;

    expect(loadTime, 'Page should load within 5 seconds').toBeLessThan(5000);
  });

});
