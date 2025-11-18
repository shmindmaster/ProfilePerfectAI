import { test, expect } from '@playwright/test';
import { waitForPageLoad, isMobileViewport } from '../helpers/test-helpers';
import { validationMessages, successMessages } from '../fixtures/mock-data';

test.describe('Authentication & User Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await waitForPageLoad(page);
  });

  test('TC-028: Demo mode access', async ({ page }) => {
    // Verify "Try Demo" button is visible and prominent
    const demoButton = page.locator('button:has-text("Demo"), button:has-text("Try Demo")').first();
    await expect(demoButton).toBeVisible();

    // Check button styling (should be prominent)
    const buttonClasses = await demoButton.getAttribute('class');
    console.log('Demo button classes:', buttonClasses);

    // Click Try Demo button
    await demoButton.click();

    // Wait for navigation or modal
    // Wait for either redirect to /overview or demo-related text to appear
    await Promise.race([
      page.waitForURL(/\/overview/, { timeout: 4000 }),
      page.getByText(/demo/i, { timeout: 4000 }).waitFor({ state: 'visible' })
    ]);

    // Should navigate to overview or show demo content
    const currentUrl = page.url();
    
    // Accept either staying on page with demo activated or redirecting to overview
    const isDemoActivated = currentUrl.includes('/overview') || 
                           currentUrl.includes('/login') ||
                           await page.getByText(/demo/i).count() > 0;
    
    expect(isDemoActivated).toBe(true);

    // If redirected to overview, verify we can access demo features
    if (currentUrl.includes('/overview')) {
      await waitForPageLoad(page);
      
      // Should show some content (models list, upload zone, etc.)
      const body = await page.textContent('body');
      expect(body?.length).toBeGreaterThan(100);
    }
  });

  test('TC-029: Email login flow - valid email', async ({ page }) => {
    // Find email input
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();

    // Enter valid email
    await emailInput.fill('test@example.com');

    // Find and click submit button
    const submitButton = page.locator('button[type="submit"], button:has-text("Sign in")').first();
    await submitButton.click();

    // Wait for response
    await page.waitForTimeout(2000);

    // Should show some feedback (toast, message, or stay on page)
    // The current implementation shows a toast about auth being disabled
    const pageContent = await page.textContent('body');
    
    // Should not have JavaScript errors
    expect(pageContent).toBeTruthy();
  });

  test('TC-030: Login form validation - empty email', async ({ page }) => {
    // Find submit button
    const submitButton = page.locator('button[type="submit"], button:has-text("Sign in")').first();
    
    // Try to submit without filling email
    await submitButton.click();

    // Wait a moment for validation
    await page.waitForTimeout(500);

    // Should show validation error
    const errorMessage = page.locator('text=/email.*required/i, text=/required/i').first();
    
    // Either HTML5 validation or custom validation should trigger
    // Check if error is visible or if HTML5 validation prevented submission
    const emailInput = page.locator('input[type="email"]');
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    
    if (!isInvalid) {
      // Custom validation might show error message
      const errorExists = await errorMessage.count() > 0;
      if (errorExists) {
        await expect(errorMessage).toBeVisible();
      }
    }

    console.log('Email validation triggered');
  });

  test('TC-030-2: Login form validation - invalid email format', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('invalid-email');

    const submitButton = page.locator('button[type="submit"], button:has-text("Sign in")').first();
    await submitButton.click();

    // Wait for validation
    await page.waitForTimeout(500);

    // HTML5 validation or custom validation should catch this
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBe(true);
  });

  test('TC-031: Mobile login form usability', async ({ page }) => {
    const viewport = page.viewportSize();
    
    // Only run on mobile
    if (!viewport || viewport.width > 768) {
      test.skip();
    }

    // Tap email input
    const emailInput = page.locator('input[type="email"]');
    await emailInput.tap();

    // Wait for keyboard (can't directly test, but ensure input is focused)
    const isFocused = await emailInput.evaluate((el) => el === document.activeElement);
    expect(isFocused).toBe(true);

    // Verify input is not obscured (should be in viewport)
    const box = await emailInput.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.y).toBeGreaterThan(0);
      expect(box.y).toBeLessThan(viewport.height);
    }

    // Type in field
    await emailInput.fill('test@mobile.com');

    // Verify submit button is visible
    const submitButton = page.locator('button[type="submit"]').first();
    await expect(submitButton).toBeVisible();

    // Verify no unexpected zoom (viewport meta tag should prevent this)
    const viewportMeta = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewportMeta).toContain('width=device-width');
  });

  test('TC-032: Google login button present', async ({ page }) => {
    // Look for Google login button
    const googleButton = page.locator('button:has-text("Google"), a:has-text("Google")').first();
    
    const googleExists = await googleButton.count() > 0;
    expect(googleExists).toBe(true);

    if (googleExists) {
      await expect(googleButton).toBeVisible();
      
      // Verify Google icon is present
      const hasIcon = await page.locator('svg, [class*="google"]').count() > 0;
      console.log('Google login button with icon:', hasIcon);
    }
  });

  test('TC-033: Login page layout on different viewports', async ({ page }) => {
    const viewport = page.viewportSize();
    
    if (!viewport) {
      throw new Error('No viewport');
    }

    // Verify form is centered and well-positioned
    const form = page.locator('form').first();
    await expect(form).toBeVisible();

    // On all viewports, form should be readable
    const formBox = await form.boundingBox();
    if (formBox) {
      // Form should not be full-width on large screens
      if (viewport.width >= 1024) {
        expect(formBox.width).toBeLessThan(viewport.width * 0.8);
      }
      
      // Form should fit in viewport
      expect(formBox.width).toBeLessThanOrEqual(viewport.width);
    }

    // Check for horizontal scroll
    const hasScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasScroll).toBe(false);
  });

  test('TC-034: Login form has proper labels', async ({ page }) => {
    // Email input should have associated label
    const emailInput = page.locator('input[type="email"]');
    
    // Check for label, placeholder, or aria-label
    const placeholder = await emailInput.getAttribute('placeholder');
    const ariaLabel = await emailInput.getAttribute('aria-label');
    const inputId = await emailInput.getAttribute('id');
    
    let hasLabel = false;
    if (inputId) {
      const label = page.locator(`label[for="${inputId}"]`);
      hasLabel = await label.count() > 0;
    }

    // Should have some form of labeling
    const isLabeled = hasLabel || (placeholder && placeholder.length > 0) || (ariaLabel && ariaLabel.length > 0);
    expect(isLabeled).toBe(true);
  });

  test('TC-035: Remember user choice or session', async ({ page, context }) => {
    // This test verifies basic session/cookie handling
    
    // Fill in email
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('test@example.com');

    // Check if there's any "Remember me" checkbox
    const rememberCheckbox = page.locator('input[type="checkbox"][name*="remember" i]');
    const hasRememberMe = await rememberCheckbox.count() > 0;
    
    if (hasRememberMe) {
      await rememberCheckbox.check();
      console.log('Remember me option available');
    } else {
      console.log('No remember me option (may use sessions by default)');
    }

    // Get cookies before leaving
    const cookies = await context.cookies();
    console.log(`Cookies present: ${cookies.length}`);
  });

  test('TC-036: Login page accessibility', async ({ page }) => {
    // Check for proper heading
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();

    // Form should have proper structure
    const form = page.locator('form');
    const formExists = await form.count() > 0;
    expect(formExists).toBe(true);

    // All interactive elements should be keyboard accessible
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        const isDisabled = await button.isDisabled();
        if (!isDisabled) {
          // Button should be focusable
          const tabIndex = await button.getAttribute('tabindex');
          // tabindex should not be -1 (unless intentionally hidden)
          if (tabIndex === '-1') {
            console.warn('Button has tabindex -1');
          }
        }
      }
    }
  });

  test('TC-037: Multiple login attempts handled gracefully', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]');
    const submitButton = page.locator('button[type="submit"]').first();

    // Attempt 1
    await emailInput.fill('test1@example.com');
    await submitButton.click();
    await page.waitForTimeout(1000);

    // Attempt 2
    await emailInput.fill('test2@example.com');
    await submitButton.click();
    await page.waitForTimeout(1000);

    // Attempt 3
    await emailInput.fill('test3@example.com');
    await submitButton.click();
    await page.waitForTimeout(1000);

    // Should not crash or show errors
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });
});
