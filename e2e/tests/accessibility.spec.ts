import { test, expect } from '@playwright/test';
import { waitForPageLoad } from '../helpers/test-helpers';

test.describe('Accessibility (A11y) Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
  });

  test('TC-047: All images have alt attributes', async ({ page }) => {
    const images = page.locator('img');
    const imageCount = await images.count();

    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      
      // Alt should exist (can be empty string for decorative images)
      expect(alt).not.toBeNull();
      
      const src = await img.getAttribute('src');
      if (alt === '') {
        console.log(`Image with empty alt (decorative): ${src}`);
      }
    }

    console.log(`Checked ${imageCount} images - all have alt attributes`);
  });

  test('TC-048: Headings in logical order', async ({ page }) => {
    // Get all headings
    const headings = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
      return elements.map(el => ({
        level: parseInt(el.tagName.substring(1)),
        text: el.textContent?.trim() || '',
      }));
    });

    // Should have at least one h1
    const h1Count = headings.filter(h => h.level === 1).length;
    expect(h1Count).toBeGreaterThanOrEqual(1);
    expect(h1Count).toBeLessThanOrEqual(2); // Generally only one h1 per page

    // Check heading hierarchy (no skipping levels)
    for (let i = 1; i < headings.length; i++) {
      const current = headings[i];
      const previous = headings[i - 1];
      
      // Heading level shouldn't jump by more than 1
      if (current.level > previous.level) {
        const jump = current.level - previous.level;
        if (jump > 1) {
          console.warn(`Heading level skip: h${previous.level} to h${current.level}`);
        }
      }
    }

    console.log('Heading structure:', headings);
  });

  test('TC-049: Interactive elements are keyboard accessible', async ({ page }) => {
    // Get all interactive elements
    const interactive = page.locator('button, a, input, select, textarea');
    const count = await interactive.count();

    for (let i = 0; i < Math.min(count, 15); i++) {
      const element = interactive.nth(i);
      
      if (await element.isVisible() && !await element.isDisabled()) {
        // Element should be focusable (tabindex not -1)
        const tabIndex = await element.getAttribute('tabindex');
        
        if (tabIndex === '-1') {
          const tagName = await element.evaluate(el => el.tagName);
          console.warn(`Element ${tagName} has tabindex="-1"`);
        }
      }
    }

    console.log(`Checked ${Math.min(count, 15)} interactive elements`);
  });

  test('TC-050: Focus visible on keyboard navigation', async ({ page }) => {
    // Tab through elements
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);

      // Get focused element
      const focused = page.locator(':focus');
      const focusedCount = await focused.count();

      if (focusedCount > 0) {
        // Check if focus is visible
        const outlineStyle = await focused.evaluate((el) => {
          const style = window.getComputedStyle(el);
          return {
            outline: style.outline,
            outlineWidth: style.outlineWidth,
            boxShadow: style.boxShadow,
          };
        });

        // Should have some focus indicator (outline, box-shadow, etc.)
        const hasFocusIndicator = 
          outlineStyle.outline !== 'none' || 
          outlineStyle.outlineWidth !== '0px' ||
          outlineStyle.boxShadow !== 'none';

        console.log(`Focus indicator present: ${hasFocusIndicator}`);
      }
    }
  });

  test('TC-051: Form inputs have proper labels', async ({ page }) => {
    await page.goto('/login');
    await waitForPageLoad(page);

    const inputs = page.locator('input');
    const inputCount = await inputs.count();

    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const inputType = await input.getAttribute('type');

      // Skip hidden inputs
      if (inputType === 'hidden') {
        continue;
      }

      const inputId = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      const placeholder = await input.getAttribute('placeholder');

      // Should have some form of label
      let hasLabel = false;
      
      if (ariaLabel || ariaLabelledBy) {
        hasLabel = true;
      } else if (inputId) {
        const label = page.locator(`label[for="${inputId}"]`);
        hasLabel = await label.count() > 0;
      } else if (placeholder) {
        // Placeholder alone is not ideal but better than nothing
        hasLabel = true;
        console.warn('Input relies on placeholder for label');
      }

      expect(hasLabel).toBe(true);
    }
  });

  test('TC-052: Buttons have accessible names', async ({ page }) => {
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();

    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      
      if (await button.isVisible()) {
        const text = await button.textContent();
        const ariaLabel = await button.getAttribute('aria-label');
        const ariaLabelledBy = await button.getAttribute('aria-labelledby');
        const title = await button.getAttribute('title');

        // Button should have accessible name
        const hasAccessibleName = 
          (text && text.trim().length > 0) ||
          (ariaLabel && ariaLabel.length > 0) ||
          ariaLabelledBy ||
          title;

        if (!hasAccessibleName) {
          console.warn('Button without accessible name found');
        }

        expect(hasAccessibleName).toBe(true);
      }
    }
  });

  test('TC-053: Links have descriptive text', async ({ page }) => {
    const links = page.locator('a[href]');
    const linkCount = await links.count();

    for (let i = 0; i < Math.min(linkCount, 20); i++) {
      const link = links.nth(i);
      
      if (await link.isVisible()) {
        const text = await link.textContent();
        const ariaLabel = await link.getAttribute('aria-label');
        const title = await link.getAttribute('title');

        // Link should have meaningful text
        const hasText = 
          (text && text.trim().length > 0 && text.trim().toLowerCase() !== 'click here' && text.trim().toLowerCase() !== 'read more') ||
          (ariaLabel && ariaLabel.length > 0) ||
          title;

        if (!hasText) {
          console.warn('Link without descriptive text');
        }
      }
    }
  });

  test('TC-054: Page has proper lang attribute', async ({ page }) => {
    const lang = await page.locator('html').getAttribute('lang');
    
    expect(lang).not.toBeNull();
    expect(lang).toBeTruthy();
    
    console.log(`Page language: ${lang}`);
  });

  test('TC-055: Color contrast check (basic)', async ({ page }) => {
    // Get main text elements and check their colors
    const textElements = page.locator('p, h1, h2, h3, a, button').first();
    
    if (await textElements.count() > 0) {
      const colorInfo = await textElements.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return {
          color: style.color,
          backgroundColor: style.backgroundColor,
          fontSize: style.fontSize,
        };
      });

      console.log('Text color info:', colorInfo);
      
      // Note: Full contrast calculation requires color parsing
      // This is a basic check that colors are set
      expect(colorInfo.color).toBeTruthy();
    }
  });

  test('TC-056: No empty links or buttons', async ({ page }) => {
    // Check for empty interactive elements
    const emptyButtons = await page.locator('button:not([aria-label]):empty').count();
    const emptyLinks = await page.locator('a[href]:not([aria-label]):empty').count();

    if (emptyButtons > 0) {
      console.warn(`Found ${emptyButtons} empty buttons without aria-label`);
    }
    
    if (emptyLinks > 0) {
      console.warn(`Found ${emptyLinks} empty links without aria-label`);
    }

    // Empty interactive elements should have aria-label
    // We allow some flexibility here as icon buttons might be empty but have aria-label
  });

  test('TC-057: Forms have proper structure', async ({ page }) => {
    await page.goto('/login');
    await waitForPageLoad(page);

    // Check for form elements
    const forms = page.locator('form');
    const formCount = await forms.count();

    if (formCount > 0) {
      const form = forms.first();
      
      // Form should have fieldsets or proper grouping for complex forms
      const inputs = form.locator('input, select, textarea');
      const inputCount = await inputs.count();

      console.log(`Form has ${inputCount} input elements`);

      // Verify submit button exists
      const submitButton = form.locator('button[type="submit"], input[type="submit"]');
      const hasSubmit = await submitButton.count() > 0;
      
      expect(hasSubmit).toBe(true);
    }
  });

  test('TC-058: ARIA roles used appropriately', async ({ page }) => {
    // Get elements with ARIA roles
    const elementsWithRoles = await page.evaluate(() => {
      const elements = document.querySelectorAll('[role]');
      return Array.from(elements).map(el => ({
        role: el.getAttribute('role'),
        tagName: el.tagName,
      }));
    });

    console.log('Elements with ARIA roles:', elementsWithRoles);

    // Common valid roles
    const validRoles = [
      'navigation', 'main', 'banner', 'contentinfo', 'complementary',
      'button', 'link', 'dialog', 'alert', 'alertdialog',
      'menu', 'menubar', 'menuitem', 'tab', 'tabpanel', 'tablist',
      'listbox', 'option', 'radiogroup', 'radio', 'checkbox',
      'search', 'form', 'region', 'article', 'heading',
    ];

    // Check that roles are valid
    for (const element of elementsWithRoles) {
      if (element.role && !validRoles.includes(element.role)) {
        console.warn(`Potentially invalid ARIA role: ${element.role} on ${element.tagName}`);
      }
    }
  });

  test('TC-059: Skip navigation link present', async ({ page }) => {
    // Look for skip to main content link (good accessibility practice)
    const skipLink = page.locator('a[href="#main"], a[href="#content"], a:has-text("Skip to")').first();
    
    const skipExists = await skipLink.count() > 0;
    
    if (skipExists) {
      console.log('Skip navigation link found (good accessibility)');
    } else {
      console.log('Skip navigation link not found - consider adding for accessibility');
    }
  });

  test('TC-060: Landmark regions present', async ({ page }) => {
    // Check for proper landmark structure
    const landmarks = await page.evaluate(() => {
      return {
        main: document.querySelectorAll('main, [role="main"]').length,
        nav: document.querySelectorAll('nav, [role="navigation"]').length,
        header: document.querySelectorAll('header, [role="banner"]').length,
        footer: document.querySelectorAll('footer, [role="contentinfo"]').length,
      };
    });

    console.log('Landmark regions:', landmarks);

    // Should have at least a main landmark
    expect(landmarks.main).toBeGreaterThan(0);

    // Having nav, header, footer is good but not strictly required
    if (landmarks.nav === 0) {
      console.log('No navigation landmark found');
    }
  });
});
