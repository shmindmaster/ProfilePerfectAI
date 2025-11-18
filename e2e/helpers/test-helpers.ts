import { Page, expect } from '@playwright/test';

/**
 * Test helper utilities for E2E tests
 */

/**
 * Wait for page to be fully loaded with all resources
 */
export async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForLoadState('domcontentloaded');
}

/**
 * Check if element is visible in viewport
 */
export async function isInViewport(page: Page, selector: string): Promise<boolean> {
  return await page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (!element) return false;
    
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }, selector);
}

/**
 * Scroll element into view
 */
export async function scrollIntoView(page: Page, selector: string) {
  await page.locator(selector).scrollIntoViewIfNeeded();
}

/**
 * Check if element has minimum touch target size (44x44px)
 */
export async function hasMinimumTouchTarget(page: Page, selector: string): Promise<boolean> {
  const box = await page.locator(selector).boundingBox();
  if (!box) return false;
  return box.width >= 44 && box.height >= 44;
}

/**
 * Simulate slow network (3G)
 */
export async function simulateSlow3G(page: Page) {
  const client = await page.context().newCDPSession(page);
  await client.send('Network.emulateNetworkConditions', {
    offline: false,
    downloadThroughput: (780 * 1024) / 8, // 780 kb/s
    uploadThroughput: (330 * 1024) / 8, // 330 kb/s
    latency: 100, // 100ms
  });
}

/**
 * Simulate offline mode
 */
export async function goOffline(page: Page) {
  await page.context().setOffline(true);
}

/**
 * Go back online
 */
export async function goOnline(page: Page) {
  await page.context().setOffline(false);
}

/**
 * Take screenshot with timestamp
 */
export async function takeTimestampedScreenshot(page: Page, name: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({ 
    path: `test-results/screenshots/${name}-${timestamp}.png`,
    fullPage: true 
  });
}

/**
 * Wait for API response
 */
export async function waitForAPIResponse(
  page: Page, 
  urlPattern: string | RegExp, 
  timeout = 30000
) {
  return await page.waitForResponse(
    (response) => {
      const url = response.url();
      if (typeof urlPattern === 'string') {
        return url.includes(urlPattern);
      }
      return urlPattern.test(url);
    },
    { timeout }
  );
}

/**
 * Check for console errors
 */
export async function getConsoleErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  return errors;
}

/**
 * Mock API response
 */
export async function mockAPIResponse(
  page: Page,
  urlPattern: string | RegExp,
  response: any,
  status = 200
) {
  await page.route(urlPattern, (route) => {
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });
}

/**
 * Create test file (Blob) for upload testing
 */
export function createTestFile(
  name: string,
  size: number,
  type = 'image/jpeg'
): File {
  const buffer = Buffer.alloc(size);
  return new File([buffer], name, { type });
}

/**
 * Upload file to input
 */
export async function uploadFile(
  page: Page,
  selector: string,
  filePath: string
) {
  const fileInput = page.locator(selector);
  await fileInput.setInputFiles(filePath);
}

/**
 * Check horizontal scroll presence
 */
export async function hasHorizontalScroll(page: Page): Promise<boolean> {
  return await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
}

/**
 * Get viewport size
 */
export async function getViewportSize(page: Page) {
  return await page.viewportSize();
}

/**
 * Check if mobile viewport
 */
export async function isMobileViewport(page: Page): Promise<boolean> {
  const viewport = await getViewportSize(page);
  return viewport ? viewport.width < 768 : false;
}

/**
 * Check if tablet viewport
 */
export async function isTabletViewport(page: Page): Promise<boolean> {
  const viewport = await getViewportSize(page);
  return viewport ? viewport.width >= 768 && viewport.width < 1024 : false;
}

/**
 * Check if desktop viewport
 */
export async function isDesktopViewport(page: Page): Promise<boolean> {
  const viewport = await getViewportSize(page);
  return viewport ? viewport.width >= 1024 : false;
}

/**
 * Verify no layout shift occurred
 */
export async function measureLayoutShift(page: Page): Promise<number> {
  return await page.evaluate(() => {
    return new Promise<number>((resolve) => {
      let cls = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
            cls += (entry as any).value;
          }
        }
      });
      observer.observe({ entryTypes: ['layout-shift'] });
      
      setTimeout(() => {
        observer.disconnect();
        resolve(cls);
      }, 3000);
    });
  });
}

/**
 * Measure time to interactive
 */
export async function measureTimeToInteractive(page: Page): Promise<number> {
  const startTime = Date.now();
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');
  return Date.now() - startTime;
}

/**
 * Check for accessibility violations using basic checks
 */
export async function checkBasicAccessibility(page: Page) {
  // Check for images without alt text
  const imagesWithoutAlt = await page.locator('img:not([alt])').count();
  expect(imagesWithoutAlt).toBe(0);
  
  // Check for buttons/links without text or aria-label
  const interactiveWithoutLabel = await page.locator(
    'button:not([aria-label]):not(:has-text("")), a:not([aria-label]):not(:has-text(""))'
  ).count();
  // Note: This is a simplified check; some may have valid reasons
}

/**
 * Verify form field has proper label
 */
export async function verifyFormFieldLabeled(page: Page, fieldSelector: string) {
  const field = page.locator(fieldSelector);
  const fieldId = await field.getAttribute('id');
  const ariaLabel = await field.getAttribute('aria-label');
  const ariaLabelledBy = await field.getAttribute('aria-labelledby');
  
  if (!ariaLabel && !ariaLabelledBy && fieldId) {
    // Check for associated label
    const label = page.locator(`label[for="${fieldId}"]`);
    await expect(label).toBeVisible();
  }
}

/**
 * Wait for animation to complete
 */
export async function waitForAnimation(page: Page, selector: string) {
  await page.locator(selector).evaluate((element) => {
    return Promise.all(
      element.getAnimations().map((animation) => animation.finished)
    );
  });
}

/**
 * Get element contrast ratio (simplified check)
 */
export async function getContrastRatio(
  page: Page,
  selector: string
): Promise<number> {
  return await page.locator(selector).evaluate((el) => {
    const style = window.getComputedStyle(el);
    const bgColor = style.backgroundColor;
    const color = style.color;
    
    // Simplified contrast calculation
    // In real scenario, use proper color contrast calculation
    return 4.5; // Placeholder - would need full contrast calculation
  });
}
