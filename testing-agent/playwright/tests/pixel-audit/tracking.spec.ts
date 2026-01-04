import { test, expect, Page } from '@playwright/test';

interface NetworkRequest {
  url: string;
  method: string;
}

test.describe('Pixel Audit', () => {
  let networkRequests: NetworkRequest[] = [];

  test.beforeEach(async ({ page }) => {
    networkRequests = [];

    page.on('request', request => {
      networkRequests.push({
        url: request.url(),
        method: request.method()
      });
    });
  });

  test('GA4 is present and firing', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for delayed scripts

    const ga4Requests = networkRequests.filter(r =>
      r.url.includes('google-analytics.com') ||
      r.url.includes('googletagmanager.com/gtag') ||
      r.url.includes('analytics.google.com')
    );

    expect(ga4Requests.length, 'GA4 should be present').toBeGreaterThan(0);

    console.log(`✓ Found ${ga4Requests.length} GA4 requests`);
  });

  test('GTM is present', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const gtmRequests = networkRequests.filter(r =>
      r.url.includes('googletagmanager.com/gtm.js')
    );

    // Also check for GTM in DOM
    const gtmScript = await page.locator('script[src*="googletagmanager.com/gtm"]').count();
    const gtmNoscript = await page.locator('noscript iframe[src*="googletagmanager.com"]').count();

    const hasGTM = gtmRequests.length > 0 || gtmScript > 0 || gtmNoscript > 0;
    expect(hasGTM, 'GTM should be present').toBeTruthy();

    if (hasGTM) {
      // Try to extract GTM container ID
      const containerID = await page.evaluate(() => {
        const match = document.documentElement.innerHTML.match(/GTM-[A-Z0-9]+/);
        return match ? match[0] : null;
      });
      console.log(`✓ GTM found${containerID ? ` - Container: ${containerID}` : ''}`);
    }
  });

  test('Meta Pixel is present', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const metaRequests = networkRequests.filter(r =>
      r.url.includes('facebook.com/tr') ||
      r.url.includes('connect.facebook.net')
    );

    // Also check for fbq in window
    const hasFbq = await page.evaluate(() => {
      return typeof (window as any).fbq !== 'undefined';
    });

    const hasMeta = metaRequests.length > 0 || hasFbq;
    expect(hasMeta, 'Meta Pixel should be present').toBeTruthy();

    if (hasMeta) {
      // Try to extract pixel ID
      const pixelID = await page.evaluate(() => {
        const match = document.documentElement.innerHTML.match(/fbq\('init',\s*'(\d+)'/);
        return match ? match[1] : null;
      });
      console.log(`✓ Meta Pixel found${pixelID ? ` - ID: ${pixelID}` : ''}`);
      console.log(`  Network calls: ${metaRequests.length}`);
    }
  });

  test('no duplicate tracking pixels', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check for duplicate GA4 tags
    const ga4Scripts = await page.locator('script[src*="googletagmanager.com/gtag"]').count();
    expect(ga4Scripts, 'Should not have duplicate GA4 scripts').toBeLessThanOrEqual(1);

    // Check for duplicate GTM containers
    const gtmScripts = await page.locator('script[src*="googletagmanager.com/gtm"]').count();
    expect(gtmScripts, 'Should not have duplicate GTM scripts').toBeLessThanOrEqual(1);

    // Check for duplicate Meta Pixel
    const fbqInitCalls = await page.evaluate(() => {
      const scriptContent = document.documentElement.innerHTML;
      const matches = scriptContent.match(/fbq\('init'/g);
      return matches ? matches.length : 0;
    });
    expect(fbqInitCalls, 'Should not have duplicate Meta Pixel init calls').toBeLessThanOrEqual(1);

    console.log('✓ No duplicate pixels detected');
  });

  test('tracking pixels fire PageView events', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Check for GA4 pageview
    const ga4Pageviews = networkRequests.filter(r =>
      r.url.includes('google-analytics.com') &&
      (r.url.includes('page_view') || r.url.includes('pageview'))
    );

    // Check for Meta Pixel pageview
    const metaPageviews = networkRequests.filter(r =>
      r.url.includes('facebook.com/tr') &&
      r.url.includes('PageView')
    );

    console.log(`✓ GA4 pageviews: ${ga4Pageviews.length}`);
    console.log(`✓ Meta pageviews: ${metaPageviews.length}`);

    // At least one tracking pixel should fire a pageview
    const totalPageviews = ga4Pageviews.length + metaPageviews.length;
    expect(totalPageviews, 'At least one pixel should fire PageView event').toBeGreaterThan(0);
  });

  test('capture all marketing pixels detected', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const detectedPixels = {
      GA4: false,
      GTM: false,
      MetaPixel: false,
      GoogleAds: false,
      TikTok: false,
      LinkedIn: false,
      Pinterest: false,
      Hotjar: false,
      Clarity: false
    };

    // Check network requests
    networkRequests.forEach(r => {
      if (r.url.includes('google-analytics.com') || r.url.includes('googletagmanager.com/gtag')) {
        detectedPixels.GA4 = true;
      }
      if (r.url.includes('googletagmanager.com/gtm')) {
        detectedPixels.GTM = true;
      }
      if (r.url.includes('facebook.com/tr') || r.url.includes('connect.facebook.net')) {
        detectedPixels.MetaPixel = true;
      }
      if (r.url.includes('googleadservices.com') || r.url.includes('google.com/ads')) {
        detectedPixels.GoogleAds = true;
      }
      if (r.url.includes('analytics.tiktok.com')) {
        detectedPixels.TikTok = true;
      }
      if (r.url.includes('linkedin.com/px')) {
        detectedPixels.LinkedIn = true;
      }
      if (r.url.includes('ct.pinterest.com')) {
        detectedPixels.Pinterest = true;
      }
      if (r.url.includes('static.hotjar.com')) {
        detectedPixels.Hotjar = true;
      }
      if (r.url.includes('clarity.ms')) {
        detectedPixels.Clarity = true;
      }
    });

    console.log('Detected Pixels:', detectedPixels);

    const detectedCount = Object.values(detectedPixels).filter(Boolean).length;
    console.log(`✓ Total pixels detected: ${detectedCount}`);

    // Store results for reporting
    test.info().annotations.push({
      type: 'pixel_summary',
      description: JSON.stringify(detectedPixels, null, 2)
    });
  });

});
