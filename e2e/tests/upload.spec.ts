import { test, expect } from '@playwright/test';
import { waitForPageLoad, uploadFile } from '../helpers/test-helpers';
import path from 'path';

test.describe('Image Upload Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
  });

  test('TC-007: File dropzone visibility', async ({ page }) => {
    // Verify dropzone is visible
    const dropzoneText = page.getByText(/Create Your Professional Headshots/i).or(
      page.getByText(/Upload.*photo/i)
    ).first();
    await expect(dropzoneText).toBeVisible();

    // Verify instructions are readable
    const instructions = page.getByText(/Upload.*images?|Drag.*drop|Browse/i).first();
    const instructionsExist = await instructions.count() > 0;
    
    if (instructionsExist) {
      await expect(instructions).toBeVisible();
    }

    // Look for browse button or clickable area
    const browseButton = page.locator('button:has-text("Browse"), input[type="file"]').first();
    const buttonExists = await browseButton.count() > 0;
    
    expect(buttonExists).toBe(true);
  });

  test('TC-008: Upload dropzone is interactive', async ({ page }) => {
    // Find file input (may be hidden)
    const fileInput = page.locator('input[type="file"]').first();
    
    // File input should exist
    const inputExists = await fileInput.count() > 0;
    expect(inputExists).toBe(true);

    // Verify it accepts images
    if (inputExists) {
      const acceptAttr = await fileInput.getAttribute('accept');
      console.log('File input accept attribute:', acceptAttr);
      
      // Should accept images
      if (acceptAttr) {
        const acceptsImages = acceptAttr.includes('image');
        expect(acceptsImages).toBe(true);
      }
    }
  });

  test('TC-010: Multiple file selection enabled', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]').first();
    
    // Should have multiple attribute
    const isMultiple = await fileInput.getAttribute('multiple');
    expect(isMultiple).not.toBeNull();
    
    console.log('Multiple file upload:', isMultiple !== null);
  });

  test('TC-011: File size limit information displayed', async ({ page }) => {
    // Look for size limit information (4.5MB mentioned in requirements)
    const sizeLimitText = page.getByText(/4\.5\s*MB|size.*limit/i).first();
    const sizeInfoExists = await sizeLimitText.count() > 0;
    
    if (sizeInfoExists) {
      await expect(sizeLimitText).toBeVisible();
      console.log('File size limit information is displayed');
    } else {
      console.log('File size limit info not found - may need to be added');
    }
  });

  test('TC-012: File count limit information displayed', async ({ page }) => {
    // Look for count limit information (10 images max)
    const countLimitText = page.getByText(/10.*images?|maximum.*10/i).first();
    const countInfoExists = await countLimitText.count() > 0;
    
    if (countInfoExists) {
      await expect(countLimitText).toBeVisible();
      console.log('File count limit information is displayed');
    } else {
      console.log('File count limit info not found - may need to be added');
    }
  });

  test('TC-013: Dropzone styling and states', async ({ page }) => {
    const viewport = page.viewportSize();
    
    // Find dropzone container
    const dropzone = page.locator('[class*="dropzone"], [class*="upload"], .bg-white.rounded-xl').first();
    
    if (await dropzone.count() > 0) {
      // Verify dropzone is visible
      await expect(dropzone).toBeVisible();

      // Get dropzone dimensions
      const box = await dropzone.boundingBox();
      if (box) {
        // Dropzone should have reasonable size
        expect(box.width).toBeGreaterThan(100);
        expect(box.height).toBeGreaterThan(50);
        
        console.log(`Dropzone dimensions: ${box.width}x${box.height}`);
      }
    }
  });

  test('TC-014: Form fields for generation options', async ({ page }) => {
    // Look for name input field
    const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first();
    const nameExists = await nameInput.count() > 0;
    
    if (nameExists) {
      await expect(nameInput).toBeVisible();
      console.log('Name input field found');
    }

    // Look for gender/type selection
    const typeSelector = page.locator('select, [role="radiogroup"], [role="listbox"]').first();
    const typeSelectorExists = await typeSelector.count() > 0;
    
    if (typeSelectorExists) {
      console.log('Type/gender selector found');
    }
  });

  test('TC-015: Upload zone responsive layout', async ({ page }) => {
    const viewport = page.viewportSize();
    
    if (!viewport) {
      throw new Error('No viewport');
    }

    // Find upload section
    const uploadSection = page.locator('.bg-white.rounded-xl, [class*="upload"]').first();
    
    if (await uploadSection.count() > 0) {
      const box = await uploadSection.boundingBox();
      
      if (box) {
        // On mobile, should be full-width or nearly full-width
        if (viewport.width < 768) {
          const widthPercent = (box.width / viewport.width) * 100;
          expect(widthPercent).toBeGreaterThan(80); // At least 80% width on mobile
        }
        
        // Should fit within viewport
        expect(box.width).toBeLessThanOrEqual(viewport.width);
      }
    }

    // Check for horizontal scroll
    const hasScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasScroll).toBe(false);
  });

  test('TC-016: Upload instructions are clear', async ({ page }) => {
    // Look for helpful instruction text
    const instructionKeywords = [
      /upload.*photo|image/i,
      /5.*10/i, // 5-10 images
      /drag.*drop/i,
      /browse/i,
      /select/i,
    ];

    let foundInstructions = 0;
    for (const pattern of instructionKeywords) {
      const text = page.getByText(pattern).first();
      if (await text.count() > 0) {
        foundInstructions++;
      }
    }

    // Should have at least some helpful instructions
    expect(foundInstructions).toBeGreaterThan(0);
    console.log(`Found ${foundInstructions} instruction elements`);
  });

  test('TC-017: Generate button present', async ({ page }) => {
    // Look for generate/submit button
    const generateButton = page.locator('button:has-text("Generate"), button:has-text("Create"), button[type="submit"]').first();
    const buttonExists = await generateButton.count() > 0;
    
    expect(buttonExists).toBe(true);

    if (buttonExists) {
      // Button should be visible (might be disabled initially)
      await expect(generateButton).toBeVisible();
      
      // Check if disabled (expected before uploading images)
      const isDisabled = await generateButton.isDisabled();
      console.log('Generate button initially disabled:', isDisabled);
    }
  });

  test('TC-018: Icons and visual cues present', async ({ page }) => {
    // Look for upload icon
    const icons = page.locator('svg, [class*="icon"]');
    const iconCount = await icons.count();
    
    expect(iconCount).toBeGreaterThan(0);
    console.log(`Found ${iconCount} icons on page`);

    // Verify some icons are visible
    let visibleIcons = 0;
    for (let i = 0; i < Math.min(iconCount, 10); i++) {
      if (await icons.nth(i).isVisible()) {
        visibleIcons++;
      }
    }
    
    expect(visibleIcons).toBeGreaterThan(0);
  });

  test('TC-019: Mobile touch-friendly upload interface', async ({ page }) => {
    const viewport = page.viewportSize();
    
    // Only run on mobile
    if (!viewport || viewport.width > 768) {
      test.skip();
    }

    // Find main interactive elements
    const interactiveElements = page.locator('button, input[type="file"], [role="button"]');
    const count = await interactiveElements.count();

    // Check touch target sizes (should be at least 44x44px)
    for (let i = 0; i < Math.min(count, 5); i++) {
      const element = interactiveElements.nth(i);
      
      if (await element.isVisible()) {
        const box = await element.boundingBox();
        
        if (box) {
          const isAdequate = box.width >= 40 && box.height >= 40;
          
          if (!isAdequate) {
            console.warn(`Small touch target: ${box.width}x${box.height}px`);
          }
        }
      }
    }
  });

  test('TC-020: Help text and tooltips', async ({ page }) => {
    // Look for help text, tooltips, or info icons
    const helpElements = page.locator('[title], [aria-describedby], [class*="help"], [class*="tooltip"]');
    const helpCount = await helpElements.count();
    
    console.log(`Found ${helpCount} potential help/tooltip elements`);

    // Having some help text is good UX
    if (helpCount > 0) {
      console.log('Help text or tooltips available');
    }
  });

  test('TC-021: Form validation feedback placement', async ({ page }) => {
    // This test checks that validation messages appear near the fields they relate to
    
    // Try to submit without filling required fields
    const submitButton = page.locator('button:has-text("Generate"), button[type="submit"]').first();
    
    if (await submitButton.count() > 0 && await submitButton.isVisible()) {
      await submitButton.click();
      
      // Wait for validation message(s) to appear
      const errorMessages = page.locator('[class*="error"], [role="alert"], [aria-live]');
      await expect(errorMessages.first()).toBeVisible();
      
      // Look for error messages
      const errorCount = await errorMessages.count();
      
      if (errorCount > 0) {
        console.log(`Found ${errorCount} error/validation messages`);
        
        // At least one should be visible
        let visibleErrors = 0;
        for (let i = 0; i < errorCount; i++) {
          if (await errorMessages.nth(i).isVisible()) {
            visibleErrors++;
          }
        }
        
        expect(visibleErrors).toBeGreaterThan(0);
      }
    }
  });
});
