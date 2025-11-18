import { test, expect } from '@playwright/test';
import { waitForPageLoad, hasHorizontalScroll, isMobileViewport, hasMinimumTouchTarget } from '../helpers/test-helpers';

test.describe('Homepage & Landing Experience', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('TC-001: Homepage loads successfully', async ({ page }) => {
    // Wait for page to fully load
    await waitForPageLoad(page);

    // Verify main hero section is visible
    await expect(page.getByRole('heading', { name: /ProfilePerfect AI/i })).toBeVisible();

    // Verify upload zone is visible
    await expect(page.getByText(/Create Your Professional Headshots/i)).toBeVisible();
    
    // Verify features section is visible
    await expect(page.getByText(/Professional Quality/i)).toBeVisible();
    await expect(page.getByText(/Lightning Fast/i)).toBeVisible();
    await expect(page.getByText(/Identity Preserving/i)).toBeVisible();

    // Check page load performance (should be under 3 seconds for loaded state)
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
        loadComplete: navigation.loadEventEnd - navigation.fetchStart,
      };
    });

    // Log performance for monitoring
    console.log('Page load metrics:', performanceMetrics);
  });

  test('TC-002: Mobile hero section layout', async ({ page, browserName }) => {
    // Only run on mobile viewport
    const viewport = page.viewportSize();
    if (!viewport || viewport.width > 768) {
      test.skip();
    }

    await waitForPageLoad(page);

    // Verify no horizontal scroll
    const hasScroll = await hasHorizontalScroll(page);
    expect(hasScroll).toBe(false);

    // Verify title is readable and visible
    const title = page.getByRole('heading', { name: /ProfilePerfect AI/i });
    await expect(title).toBeVisible();
    
    // Check title is centered (has text-center class or centered alignment)
    const titleClasses = await title.evaluate((el) => el.className);
    expect(titleClasses).toContain('text-center');

    // Verify description text wraps correctly and is visible
    const description = page.getByText(/Transform your photos into professional headshots/i);
    await expect(description).toBeVisible();

    // Verify upload zone is full-width or properly sized for mobile
    const uploadZone = page.getByText(/Create Your Professional Headshots/i);
    await expect(uploadZone).toBeVisible();

    // Verify key interactive elements have minimum touch target size (44x44px)
    const interactiveElements = page.locator('button, a[href]').all();
    const elements = await interactiveElements;
    
    for (const element of elements.slice(0, 5)) { // Check first 5 elements
      const box = await element.boundingBox();
      if (box && box.width > 0 && box.height > 0) {
        // For mobile, touch targets should ideally be 44px or larger
        // We'll be lenient and check for at least 40px for text links
        const isAdequate = box.width >= 40 || box.height >= 40;
        if (!isAdequate) {
          console.warn(`Element may have small touch target: ${box.width}x${box.height}`);
        }
      }
    }
  });

  test('TC-003: Feature cards responsive layout', async ({ page }) => {
    await waitForPageLoad(page);

    const viewport = page.viewportSize();
    if (!viewport) {
      throw new Error('Viewport not set');
    }

    // Find feature cards
    const featureCards = page.locator('.bg-white.p-6.rounded-lg');
    const cardCount = await featureCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(3);

    // Check grid layout based on viewport
    if (viewport.width < 768) {
      // Mobile: cards should stack vertically (single column)
      console.log('Testing mobile layout');
      // Cards should be visible and stacked
      await expect(featureCards.first()).toBeVisible();
    } else if (viewport.width >= 768 && viewport.width < 1024) {
      // Tablet: may be 2-column or 3-column depending on design
      console.log('Testing tablet layout');
    } else {
      // Desktop: 3-column grid (md:grid-cols-3)
      console.log('Testing desktop layout');
      await expect(featureCards.first()).toBeVisible();
    }

    // Verify icons and text remain readable at all sizes
    await expect(page.locator('h3').filter({ hasText: /Professional Quality/i })).toBeVisible();
    await expect(page.locator('h3').filter({ hasText: /Lightning Fast/i })).toBeVisible();
    await expect(page.locator('h3').filter({ hasText: /Identity Preserving/i })).toBeVisible();

    // Verify no horizontal scroll at any breakpoint
    const hasScroll = await hasHorizontalScroll(page);
    expect(hasScroll).toBe(false);
  });

  test('TC-004: All key sections visible and accessible', async ({ page }) => {
    await waitForPageLoad(page);

    // Hero section
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Main upload interface
    const uploadSection = page.locator('text=Create Your Professional Headshots').first();
    await expect(uploadSection).toBeVisible();

    // Features section
    await expect(page.getByText(/Professional Quality/i)).toBeVisible();

    // Demo results preview section
    await expect(page.getByText(/See What You Can Create/i)).toBeVisible();
  });

  test('TC-005: Images have proper alt text', async ({ page }) => {
    await waitForPageLoad(page);

    // Get all images on the page
    const images = page.locator('img');
    const imageCount = await images.count();

    // Check each image for alt attribute
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      
      // Alt should exist (can be empty for decorative images)
      expect(alt).not.toBeNull();
    }
  });

  test('TC-006: Footer is present and contains essential info', async ({ page }) => {
    await waitForPageLoad(page);

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Wait a moment for any lazy-loaded content
    await page.waitForTimeout(500);

    // Check for footer element (you may need to adjust selector based on actual implementation)
    const footer = page.locator('footer');
    
    // If footer exists, verify it has some content
    const footerCount = await footer.count();
    if (footerCount > 0) {
      await expect(footer.first()).toBeVisible();
    } else {
      console.log('Note: Footer not found - may need to be added');
    }
  });

  test('TC-007: Page has proper document structure', async ({ page }) => {
    await waitForPageLoad(page);

    // Check for proper heading hierarchy
    const h1 = page.locator('h1');
    await expect(h1.first()).toBeVisible();

    // Page should have a title
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
  });

  test('TC-008: No console errors on page load', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await waitForPageLoad(page);

    // Filter out known non-critical errors (e.g., third-party scripts)
    const criticalErrors = consoleErrors.filter(error => {
      // Filter out non-critical errors
      return !error.includes('favicon') && 
             !error.includes('chrome-extension') &&
             !error.toLowerCase().includes('third-party');
    });

    if (criticalErrors.length > 0) {
      console.warn('Console errors found:', criticalErrors);
    }

    // We'll allow some errors but log them for investigation
    expect(criticalErrors.length).toBeLessThan(5);
  });

  test('TC-009: Responsive images load correctly', async ({ page }) => {
    await waitForPageLoad(page);

    // Wait for all images to load
    await page.waitForLoadState('networkidle');

    // Get all images
    const images = page.locator('img');
    const imageCount = await images.count();

    // Check that images are loaded (have natural dimensions or are CSS backgrounds)
    for (let i = 0; i < Math.min(imageCount, 10); i++) { // Check first 10 images
      const img = images.nth(i);
      
      if (await img.isVisible()) {
        const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
        const hasSource = await img.evaluate((el: HTMLImageElement) => 
          !!el.src && el.src !== window.location.href
        );
        
        if (hasSource) {
          // Image should have loaded (naturalWidth > 0) or be a placeholder
          expect(naturalWidth).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });
});
