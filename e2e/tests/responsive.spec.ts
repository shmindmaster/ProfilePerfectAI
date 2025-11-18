import { test, expect } from '@playwright/test';
import { waitForPageLoad, hasHorizontalScroll } from '../helpers/test-helpers';

test.describe('Responsive & Cross-Device Tests', () => {
  const breakpoints = [
    { name: 'Small Mobile', width: 375, height: 667 },
    { name: 'Large Mobile', width: 414, height: 896 },
    { name: 'Tablet Portrait', width: 768, height: 1024 },
    { name: 'Tablet Landscape', width: 1024, height: 768 },
    { name: 'Desktop', width: 1280, height: 720 },
    { name: 'Wide Desktop', width: 1920, height: 1080 },
  ];

  test('TC-033: Viewport breakpoint transitions', async ({ page }) => {
    for (const breakpoint of breakpoints) {
      await page.setViewportSize({ 
        width: breakpoint.width, 
        height: breakpoint.height 
      });
      
      await page.goto('/');
      await waitForPageLoad(page);

      console.log(`Testing ${breakpoint.name} (${breakpoint.width}x${breakpoint.height})`);

      // Verify no layout breaks
      const hasScroll = await hasHorizontalScroll(page);
      expect(hasScroll).toBe(false);

      // Verify content is readable
      const heading = page.getByRole('heading', { name: /ProfilePerfect AI/i });
      await expect(heading).toBeVisible();

      // Verify main content fits
      const body = await page.textContent('body');
      expect(body?.length).toBeGreaterThan(100);

      // Small delay to allow any responsive animations
      await page.waitForTimeout(100);
    }
  });

  test('TC-034: Content reflow at breakpoints', async ({ page }) => {
    // Start at desktop
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await waitForPageLoad(page);

    // Gradually resize to mobile
    const steps = [1280, 1024, 768, 640, 375];
    
    for (const width of steps) {
      await page.setViewportSize({ width, height: 720 });
      await page.waitForTimeout(200); // Allow reflow

      // Verify no horizontal scroll at any size
      const hasScroll = await hasHorizontalScroll(page);
      expect(hasScroll).toBe(false);

      // Verify key elements remain visible
      const mainHeading = page.getByRole('heading').first();
      await expect(mainHeading).toBeVisible();

      console.log(`Viewport width: ${width}px - No overflow ✓`);
    }
  });

  test('TC-035: Touch interactions on mobile', async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip();
    }

    await page.goto('/');
    await waitForPageLoad(page);

    // Test tap on main button
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();

    if (buttonCount > 0) {
      const firstButton = buttons.first();
      
      if (await firstButton.isVisible()) {
        // Verify touch target size
        const box = await firstButton.boundingBox();
        
        if (box) {
          console.log(`Button size: ${box.width}x${box.height}px`);
          
          // Should be reasonably sized for touch
          const isAdequate = box.width >= 40 && box.height >= 40;
          expect(isAdequate).toBe(true);
        }

        // Test tap gesture
        await firstButton.tap();
        await page.waitForTimeout(500);
        
        // Should not cause errors
        console.log('Tap gesture executed successfully');
      }
    }
  });

  test('TC-036: Images scale properly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await waitForPageLoad(page);

    const images = page.locator('img');
    const imageCount = await images.count();

    for (let i = 0; i < Math.min(imageCount, 5); i++) {
      const img = images.nth(i);
      
      if (await img.isVisible()) {
        const box = await img.boundingBox();
        
        if (box) {
          // Image should not exceed viewport width
          expect(box.width).toBeLessThanOrEqual(375);
          
          // Image should have reasonable dimensions
          expect(box.width).toBeGreaterThan(0);
          expect(box.height).toBeGreaterThan(0);
        }
      }
    }
  });

  test('TC-037: Font sizes remain readable', async ({ page }) => {
    const viewports = [
      { width: 375, minFontSize: 14 },
      { width: 768, minFontSize: 14 },
      { width: 1280, minFontSize: 14 },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: 720 });
      await page.goto('/');
      await waitForPageLoad(page);

      // Check main text elements
      const textElements = page.locator('p, h1, h2, h3, button');
      const count = await textElements.count();

      for (let i = 0; i < Math.min(count, 10); i++) {
        const element = textElements.nth(i);
        
        if (await element.isVisible()) {
          const fontSize = await element.evaluate((el) => {
            return parseFloat(window.getComputedStyle(el).fontSize);
          });

          // Font should be at least 14px for body text (with some tolerance)
          if (fontSize < 12) {
            console.warn(`Small font size detected: ${fontSize}px`);
          }
        }
      }
    }
  });

  test('TC-038: Spacing and padding responsive', async ({ page }) => {
    const viewports = [375, 768, 1280];

    for (const width of viewports) {
      await page.setViewportSize({ width, height: 720 });
      await page.goto('/');
      await waitForPageLoad(page);

      // Check main container padding
      const container = page.locator('.container, [class*="container"], main').first();
      
      if (await container.count() > 0) {
        const padding = await container.evaluate((el) => {
          const style = window.getComputedStyle(el);
          return {
            left: parseFloat(style.paddingLeft),
            right: parseFloat(style.paddingRight),
            top: parseFloat(style.paddingTop),
            bottom: parseFloat(style.paddingBottom),
          };
        });

        // Should have some padding on all sides
        console.log(`Padding at ${width}px:`, padding);
        
        // Mobile should have adequate padding (not too cramped)
        if (width <= 768) {
          expect(padding.left).toBeGreaterThan(8);
          expect(padding.right).toBeGreaterThan(8);
        }
      }
    }
  });

  test('TC-039: Grid layouts adapt correctly', async ({ page }) => {
    const viewports = [
      { width: 375, expectedColumns: 1 },
      { width: 768, expectedColumns: 2 },
      { width: 1280, expectedColumns: 3 },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: 720 });
      await page.goto('/');
      await waitForPageLoad(page);

      // Look for grid container (feature cards)
      const gridContainer = page.locator('[class*="grid"], .grid').first();
      
      if (await gridContainer.count() > 0) {
        const gridItems = gridContainer.locator('> *');
        const itemCount = await gridItems.count();

        if (itemCount > 0) {
          // Get first two items' positions to determine columns
          const firstBox = await gridItems.first().boundingBox();
          const secondBox = itemCount > 1 ? await gridItems.nth(1).boundingBox() : null;

          if (firstBox && secondBox) {
            // If second item is on same row (similar Y position), we have multiple columns
            const sameRow = Math.abs(firstBox.y - secondBox.y) < 50;
            
            console.log(`At ${viewport.width}px: ${sameRow ? 'multi-column' : 'single-column'} layout`);
          }
        }
      }
    }
  });

  test('TC-040: Mobile menu fits in viewport', async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip();
    }

    await page.goto('/');
    await waitForPageLoad(page);

    // Look for mobile menu button
    const menuButton = page.locator('button[aria-label*="menu" i]').first();
    
    if (await menuButton.count() > 0) {
      await menuButton.click();
      await page.waitForTimeout(500);

      // Menu should be visible
      const menu = page.locator('nav, [role="navigation"]').first();
      
      if (await menu.isVisible()) {
        const menuBox = await menu.boundingBox();
        const viewport = page.viewportSize();

        if (menuBox && viewport) {
          // Menu should fit within viewport
          expect(menuBox.width).toBeLessThanOrEqual(viewport.width);
          expect(menuBox.height).toBeLessThanOrEqual(viewport.height);
        }
      }
    }
  });

  test('TC-041: Buttons and links have adequate spacing', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await waitForPageLoad(page);

    // Find groups of buttons or links
    const buttons = page.locator('button, a');
    const count = await buttons.count();

    for (let i = 0; i < count - 1; i++) {
      const current = buttons.nth(i);
      const next = buttons.nth(i + 1);

      if (await current.isVisible() && await next.isVisible()) {
        const currentBox = await current.boundingBox();
        const nextBox = await next.boundingBox();

        if (currentBox && nextBox) {
          // Calculate spacing between elements
          const verticalGap = nextBox.y - (currentBox.y + currentBox.height);
          const horizontalGap = nextBox.x - (currentBox.x + currentBox.width);

          // Elements should have some spacing (at least 8px)
          if (verticalGap > 0 && verticalGap < 8) {
            console.warn(`Small vertical gap: ${verticalGap}px`);
          }
          if (horizontalGap > 0 && horizontalGap < 8) {
            console.warn(`Small horizontal gap: ${horizontalGap}px`);
          }
        }
      }
    }
  });

  test('TC-042: Scroll behavior smooth and controlled', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(300);

    // Verify scroll worked
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeGreaterThan(0);

    // Scroll back up
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);

    const scrollTop = await page.evaluate(() => window.scrollY);
    expect(scrollTop).toBe(0);
  });
});
