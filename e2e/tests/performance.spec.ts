import { test, expect } from '@playwright/test';
import { waitForPageLoad, simulateSlow3G, goOffline, goOnline } from '../helpers/test-helpers';

test.describe('Performance & Error Handling', () => {
  test('TC-038: Page loads within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await waitForPageLoad(page);
    const loadTime = Date.now() - startTime;
    
    console.log(`Page load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(5000); // 5 seconds max
  });

  test('TC-039: Slow network handling', async ({ page }) => {
    await simulateSlow3G(page);
    await page.goto('/');
    
    // Should eventually load
    await expect(page.getByRole('heading', { name: /ProfilePerfect AI/i })).toBeVisible({ timeout: 15000 });
  });

  test('TC-040: Offline behavior', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
    
    await goOffline(page);
    
    // Try to navigate
    await page.goto('/login').catch(() => {});
    
    // Should handle offline state gracefully
    await goOnline(page);
    await page.goto('/');
    await expect(page.getByRole('heading')).toBeVisible();
  });
});
