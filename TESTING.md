# ProfilePerfect AI - E2E Test Plan

## Overview

This document describes the comprehensive End-to-End (E2E) test suite for ProfilePerfect AI. The test suite follows a **mobile-first** approach, ensuring all core user flows work seamlessly on mobile devices before validating desktop experiences.

## Test Framework & Tools

- **Framework**: Playwright
- **Language**: TypeScript
- **Browsers**: Chromium (Chrome, Edge), WebKit (Safari)
- **Devices**: Mobile (Pixel 5, iPhone 13), Tablet (iPad Pro), Desktop (various resolutions)
- **Accessibility**: @axe-core/playwright for a11y testing

## Test Execution

### Prerequisites

1. Node.js 18+ installed
2. Dependencies installed: `npm install`
3. Environment variables configured (`.env.local`)

### Running Tests

```bash
# Run all tests on all devices
npm run test:e2e

# Run tests on specific project
npm run test:e2e -- --project="Mobile Chrome"

# Run specific test file
npm run test:e2e -- e2e/homepage.spec.ts

# Run tests in headed mode (see browser)
npm run test:e2e -- --headed

# Run tests in UI mode (interactive)
npm run test:e2e:ui

# Generate and view test report
npm run test:e2e:report
```

### Test Structure

```
e2e/
├── tests/
│   ├── homepage.spec.ts           # Landing page tests
│   ├── navigation.spec.ts         # Navigation and routing
│   ├── upload.spec.ts             # Image upload flow
│   ├── generation.spec.ts         # AI generation process
│   ├── authentication.spec.ts     # Login/auth flows
│   ├── responsive.spec.ts         # Responsive layout tests
│   └── accessibility.spec.ts      # A11y tests
├── fixtures/
│   ├── test-images/               # Sample images for testing
│   └── mock-data.ts               # Mock API responses
└── helpers/
    ├── test-helpers.ts            # Shared test utilities
    └── viewport-helpers.ts        # Viewport/device helpers
```

## Test Cases

### Mobile-First Philosophy

All tests are designed and executed with mobile-first principles:
- Core user flows MUST work on mobile (320px+)
- Touch interactions are validated
- Viewport-specific UI is tested
- Mobile performance is measured
- Network conditions are simulated (slow 3G, 4G)

### Test Case Template

Each test case includes:
- **Test Case ID**: Unique identifier
- **Title**: Descriptive name
- **Preconditions**: Setup requirements
- **Test Steps**: Step-by-step actions
- **Test Data**: Required data/files
- **Expected Result**: Success criteria
- **Pass/Fail Criteria**: Clear acceptance
- **Type**: Functional, Visual/UI, Usability, Performance, Edge Case
- **Devices**: Mobile, Tablet, Desktop, or specific device
- **Priority**: Critical, High, Medium, Low

---

## Test Suite Details

### 1. Homepage & Landing Experience

#### TC-001: Homepage Loads Successfully
- **Preconditions**: None
- **Test Steps**:
  1. Navigate to homepage (/)
  2. Wait for page to fully load
  3. Verify main hero section is visible
  4. Verify upload zone is visible
  5. Verify features section is visible
- **Test Data**: None
- **Expected Result**: Homepage loads within 3 seconds, all sections visible
- **Pass/Fail Criteria**: All sections render correctly without errors
- **Type**: Functional, Performance
- **Devices**: All (Mobile, Tablet, Desktop)
- **Priority**: Critical

#### TC-002: Mobile Hero Section Layout
- **Preconditions**: Mobile viewport (≤768px)
- **Test Steps**:
  1. Navigate to homepage on mobile
  2. Verify title is readable and centered
  3. Verify description text wraps correctly
  4. Verify upload zone is full-width
  5. Verify touch targets are ≥44px
- **Test Data**: None
- **Expected Result**: Layout is optimized for mobile, no horizontal scroll
- **Pass/Fail Criteria**: All elements visible, proper spacing, no overflow
- **Type**: Visual/UI, Usability
- **Devices**: Mobile
- **Priority**: Critical

#### TC-003: Feature Cards Responsive Layout
- **Preconditions**: None
- **Test Steps**:
  1. Navigate to homepage
  2. On mobile: verify cards stack vertically
  3. On tablet: verify 2-column grid
  4. On desktop: verify 3-column grid
  5. Verify icons and text remain readable at all sizes
- **Test Data**: None
- **Expected Result**: Grid adapts correctly to viewport
- **Pass/Fail Criteria**: Proper layout at each breakpoint
- **Type**: Visual/UI, Responsive
- **Devices**: All
- **Priority**: High

### 2. Navigation & Routing

#### TC-004: Mobile Navigation Menu
- **Preconditions**: Mobile viewport
- **Test Steps**:
  1. Navigate to homepage
  2. Verify hamburger menu icon is visible
  3. Tap hamburger menu
  4. Verify menu opens with animation
  5. Verify all nav links are visible
  6. Tap a link and verify navigation
  7. Verify menu closes after navigation
- **Test Data**: None
- **Expected Result**: Mobile menu works smoothly with proper animations
- **Pass/Fail Criteria**: Menu opens, links work, closes properly
- **Type**: Functional, Usability
- **Devices**: Mobile
- **Priority**: Critical

#### TC-005: Desktop Navigation Bar
- **Preconditions**: Desktop viewport (≥1024px)
- **Test Steps**:
  1. Navigate to homepage
  2. Verify navigation bar is horizontal
  3. Verify all links are visible inline
  4. Hover over links and verify hover states
  5. Click each link and verify navigation
- **Test Data**: None
- **Expected Result**: Desktop nav displays all links inline
- **Pass/Fail Criteria**: All links visible and functional
- **Type**: Functional, Visual/UI
- **Devices**: Desktop
- **Priority**: High

#### TC-006: Sticky Navigation Behavior
- **Preconditions**: Page with scrollable content
- **Test Steps**:
  1. Navigate to a long page
  2. Scroll down 500px
  3. Verify navigation bar remains visible (sticky)
  4. Verify no content overlap
  5. Scroll back up
  6. Verify navigation transitions smoothly
- **Test Data**: None
- **Expected Result**: Nav stays accessible while scrolling
- **Pass/Fail Criteria**: Nav is sticky and doesn't overlap content
- **Type**: Functional, Usability
- **Devices**: All
- **Priority**: Medium

### 3. Image Upload Flow

#### TC-007: File Dropzone Visibility
- **Preconditions**: None
- **Test Steps**:
  1. Navigate to homepage or upload page
  2. Verify dropzone is clearly visible
  3. Verify instructions are readable
  4. Verify "Browse" button is accessible
  5. On mobile: verify touch target is adequate
- **Test Data**: None
- **Expected Result**: Dropzone is prominent and inviting
- **Pass/Fail Criteria**: Users can easily identify upload area
- **Type**: Usability, Visual/UI
- **Devices**: All
- **Priority**: Critical

#### TC-008: Upload Single Valid Image
- **Preconditions**: Valid image file available (JPEG, PNG)
- **Test Steps**:
  1. Navigate to upload page
  2. Click/tap "Browse" or dropzone
  3. Select one valid image file
  4. Verify image preview appears
  5. Verify file name is displayed
  6. Verify file size is displayed
- **Test Data**: test-sample.jpg (from public/)
- **Expected Result**: Image uploads and displays preview
- **Pass/Fail Criteria**: Preview shows correct image
- **Type**: Functional
- **Devices**: All
- **Priority**: Critical

#### TC-009: Upload Multiple Images (Batch)
- **Preconditions**: 5-10 valid image files
- **Test Steps**:
  1. Navigate to upload page
  2. Select 5 images at once
  3. Verify all 5 previews appear
  4. Verify progress indicators (if applicable)
  5. Verify total file count updates
  6. Verify upload completes successfully
- **Test Data**: 5 sample images
- **Expected Result**: All images upload and display
- **Pass/Fail Criteria**: All 5 images previewed correctly
- **Type**: Functional
- **Devices**: All
- **Priority**: Critical

#### TC-010: Upload File Size Limit Validation
- **Preconditions**: Images that exceed 4.5MB combined
- **Test Steps**:
  1. Navigate to upload page
  2. Attempt to upload images > 4.5MB total
  3. Verify error message appears
  4. Verify message explains size limit
  5. Verify user can remove images and retry
- **Test Data**: Large image files
- **Expected Result**: Clear error message prevents upload
- **Pass/Fail Criteria**: Error shown, upload blocked
- **Type**: Functional, Validation, Edge Case
- **Devices**: All
- **Priority**: High

#### TC-011: Upload Maximum File Count Limit
- **Preconditions**: More than 10 images
- **Test Steps**:
  1. Navigate to upload page
  2. Attempt to upload 11 or more images
  3. Verify error message appears
  4. Verify message explains count limit (max 10)
  5. Verify existing images are preserved
- **Test Data**: 11 sample images
- **Expected Result**: Error message prevents exceeding limit
- **Pass/Fail Criteria**: Error shown, limit enforced
- **Type**: Functional, Validation, Edge Case
- **Devices**: All
- **Priority**: High

#### TC-012: Upload Invalid File Type
- **Preconditions**: Non-image file (PDF, DOCX, etc.)
- **Test Steps**:
  1. Navigate to upload page
  2. Attempt to upload non-image file
  3. Verify error message appears
  4. Verify accepted formats are listed
  5. Verify no upload occurs
- **Test Data**: test.pdf, test.txt
- **Expected Result**: Error prevents non-image upload
- **Pass/Fail Criteria**: Clear error, no upload
- **Type**: Functional, Validation, Edge Case
- **Devices**: All
- **Priority**: High

#### TC-013: Drag and Drop Upload (Desktop)
- **Preconditions**: Desktop with mouse
- **Test Steps**:
  1. Navigate to upload page on desktop
  2. Drag image file from file system
  3. Hover over dropzone
  4. Verify dropzone highlights on hover
  5. Drop file on dropzone
  6. Verify image uploads and previews
- **Test Data**: Sample image file
- **Expected Result**: Drag-drop works smoothly
- **Pass/Fail Criteria**: Upload completes on drop
- **Type**: Functional, Usability
- **Devices**: Desktop only
- **Priority**: Medium

#### TC-014: Mobile Image Selection from Camera
- **Preconditions**: Mobile device with camera
- **Test Steps**:
  1. Navigate to upload page on mobile
  2. Tap "Browse" or upload button
  3. Verify option to take photo appears
  4. Select "Take Photo" option
  5. Verify camera access prompt (manual check)
- **Test Data**: None (camera access)
- **Expected Result**: Camera option is available
- **Pass/Fail Criteria**: Camera option appears in file picker
- **Type**: Functional, Mobile-specific
- **Devices**: Mobile only
- **Priority**: High

#### TC-015: Remove Uploaded Image
- **Preconditions**: Image already uploaded
- **Test Steps**:
  1. Upload an image
  2. Verify image preview with remove button
  3. Click/tap remove button
  4. Verify confirmation dialog (if any)
  5. Confirm removal
  6. Verify image disappears from preview
  7. Verify file count updates
- **Test Data**: Sample image
- **Expected Result**: Image can be removed easily
- **Pass/Fail Criteria**: Image removed, count updated
- **Type**: Functional, Usability
- **Devices**: All
- **Priority**: High

### 4. AI Generation Flow

#### TC-016: Start Generation with Valid Input
- **Preconditions**: 5-10 images uploaded, form filled
- **Test Steps**:
  1. Upload 5 valid images
  2. Fill in name field
  3. Select gender/type
  4. Click "Generate" button
  5. Verify loading state appears
  6. Verify user redirected or sees progress
- **Test Data**: 5 sample images, "Test User"
- **Expected Result**: Generation starts successfully
- **Pass/Fail Criteria**: Loading state shown, no errors
- **Type**: Functional
- **Devices**: All
- **Priority**: Critical

#### TC-017: Generation Progress Indicator
- **Preconditions**: Generation in progress
- **Test Steps**:
  1. Start a generation job
  2. Verify progress indicator appears
  3. Verify estimated time is displayed
  4. Verify status updates periodically
  5. Wait for completion or manually check updates
- **Test Data**: Active generation job
- **Expected Result**: User can track progress
- **Pass/Fail Criteria**: Progress shown, updates visible
- **Type**: Functional, Usability
- **Devices**: All
- **Priority**: High

#### TC-018: Style Preset Selection
- **Preconditions**: On generation form
- **Test Steps**:
  1. Navigate to generation form
  2. Locate style preset dropdown
  3. Verify multiple presets available (Corporate, Creative, etc.)
  4. Select a preset
  5. Verify selection is highlighted
  6. Verify any preview/description appears
- **Test Data**: None
- **Expected Result**: User can select from style presets
- **Pass/Fail Criteria**: Presets selectable, selection persists
- **Type**: Functional, Usability
- **Devices**: All
- **Priority**: High

#### TC-019: Background Preset Selection
- **Preconditions**: On generation form
- **Test Steps**:
  1. Navigate to generation form
  2. Locate background preset dropdown
  3. Verify multiple backgrounds available
  4. Select a background
  5. Verify selection is highlighted
- **Test Data**: None
- **Expected Result**: User can select background preset
- **Pass/Fail Criteria**: Backgrounds selectable, selection persists
- **Type**: Functional, Usability
- **Devices**: All
- **Priority**: High

#### TC-020: Generation Form Validation
- **Preconditions**: On generation form
- **Test Steps**:
  1. Navigate to form without uploading images
  2. Attempt to submit
  3. Verify error: "Please upload images"
  4. Upload images but leave name blank
  5. Attempt to submit
  6. Verify error: "Name is required"
- **Test Data**: None
- **Expected Result**: Form validation prevents invalid submission
- **Pass/Fail Criteria**: Clear error messages, submission blocked
- **Type**: Functional, Validation
- **Devices**: All
- **Priority**: High

#### TC-021: Generation Error Handling
- **Preconditions**: Simulated API error or network issue
- **Test Steps**:
  1. Start generation
  2. Simulate network failure (manual or mock)
  3. Verify error message appears
  4. Verify error is user-friendly
  5. Verify option to retry
- **Test Data**: Mock error response
- **Expected Result**: Error handled gracefully
- **Pass/Fail Criteria**: Error message clear, retry option available
- **Type**: Functional, Error Handling, Edge Case
- **Devices**: All
- **Priority**: High

### 5. Results & Image Gallery

#### TC-022: View Generated Images
- **Preconditions**: Generation completed successfully
- **Test Steps**:
  1. Navigate to results page
  2. Verify images load and display
  3. Verify image thumbnails are visible
  4. Click/tap an image to enlarge
  5. Verify full-size view opens
  6. Close full-size view
- **Test Data**: Completed generation job
- **Expected Result**: All generated images displayed
- **Pass/Fail Criteria**: Images load, enlarge works
- **Type**: Functional, Visual/UI
- **Devices**: All
- **Priority**: Critical

#### TC-023: Mobile Gallery Grid Layout
- **Preconditions**: Mobile viewport, generated images
- **Test Steps**:
  1. View results on mobile
  2. Verify images in 2-column grid
  3. Verify images scale appropriately
  4. Verify touch targets for each image ≥44px
  5. Scroll through gallery
  6. Verify smooth scrolling
- **Test Data**: 16+ generated images
- **Expected Result**: Gallery optimized for mobile
- **Pass/Fail Criteria**: Grid layout correct, scrolling smooth
- **Type**: Visual/UI, Usability, Mobile
- **Devices**: Mobile
- **Priority**: High

#### TC-024: Desktop Gallery Grid Layout
- **Preconditions**: Desktop viewport, generated images
- **Test Steps**:
  1. View results on desktop
  2. Verify images in 4-column grid
  3. Verify hover effects on images
  4. Verify metadata displayed on hover
- **Test Data**: 16+ generated images
- **Expected Result**: Gallery optimized for desktop
- **Pass/Fail Criteria**: 4-column grid, hover effects work
- **Type**: Visual/UI, Usability
- **Devices**: Desktop
- **Priority**: Medium

#### TC-025: Favorite/Like Image
- **Preconditions**: Generated images available
- **Test Steps**:
  1. View results
  2. Locate favorite/heart icon on image
  3. Click/tap to favorite
  4. Verify icon changes to filled/active state
  5. Click/tap again to unfavorite
  6. Verify icon returns to unfilled state
- **Test Data**: Generated images
- **Expected Result**: Favorite toggle works
- **Pass/Fail Criteria**: State persists, icon updates
- **Type**: Functional, Usability
- **Devices**: All
- **Priority**: Medium

#### TC-026: Download Generated Image
- **Preconditions**: Generated images available
- **Test Steps**:
  1. View results
  2. Click/tap download button on image
  3. Verify download starts
  4. Verify file downloads to device
  5. Verify file name is meaningful
  6. Verify file format is correct (JPEG/PNG)
- **Test Data**: Generated image
- **Expected Result**: Image downloads successfully
- **Pass/Fail Criteria**: Download completes, file is valid
- **Type**: Functional
- **Devices**: All
- **Priority**: High

#### TC-027: Filter Images by Style
- **Preconditions**: Images with different styles
- **Test Steps**:
  1. View results with multiple styles
  2. Locate filter/sort controls
  3. Select "Corporate" style filter
  4. Verify only corporate style images shown
  5. Clear filter
  6. Verify all images return
- **Test Data**: Mixed style images
- **Expected Result**: Filter works correctly
- **Pass/Fail Criteria**: Correct images filtered
- **Type**: Functional
- **Devices**: All
- **Priority**: Medium

### 6. Authentication & User Management

#### TC-028: Demo Mode Access
- **Preconditions**: Not logged in
- **Test Steps**:
  1. Navigate to login page
  2. Verify "Try Demo" button is prominent
  3. Click/tap "Try Demo"
  4. Verify redirected to overview/dashboard
  5. Verify demo features are accessible
  6. Verify some limitations may apply
- **Test Data**: None
- **Expected Result**: Demo access works without signup
- **Pass/Fail Criteria**: Demo mode accessible, features work
- **Type**: Functional, Usability
- **Devices**: All
- **Priority**: Critical

#### TC-029: Email Login Flow
- **Preconditions**: Valid email address
- **Test Steps**:
  1. Navigate to login page
  2. Enter valid email
  3. Click "Sign in with Email"
  4. Verify confirmation message
  5. (Note: actual email verification is manual)
- **Test Data**: test@example.com
- **Expected Result**: Email sent confirmation appears
- **Pass/Fail Criteria**: Confirmation message shown
- **Type**: Functional
- **Devices**: All
- **Priority**: High

#### TC-030: Login Form Validation
- **Preconditions**: On login page
- **Test Steps**:
  1. Leave email field blank
  2. Attempt to submit
  3. Verify error: "Email is required"
  4. Enter invalid email format
  5. Attempt to submit
  6. Verify error: "Invalid email address"
- **Test Data**: Various invalid inputs
- **Expected Result**: Form validation works
- **Pass/Fail Criteria**: Clear error messages
- **Type**: Functional, Validation
- **Devices**: All
- **Priority**: High

#### TC-031: Mobile Login Form Usability
- **Preconditions**: Mobile viewport
- **Test Steps**:
  1. Navigate to login on mobile
  2. Tap email input field
  3. Verify keyboard appears
  4. Verify input field not obscured
  5. Verify submit button remains visible
  6. Verify form doesn't zoom unexpectedly
- **Test Data**: None
- **Expected Result**: Login form mobile-friendly
- **Pass/Fail Criteria**: All elements accessible, no zoom
- **Type**: Usability, Mobile
- **Devices**: Mobile
- **Priority**: High

#### TC-032: Logout Functionality
- **Preconditions**: User logged in or demo mode
- **Test Steps**:
  1. Navigate to any page while logged in
  2. Locate logout button
  3. Click/tap logout
  4. Verify logged out successfully
  5. Verify redirected to homepage or login
  6. Verify session cleared
- **Test Data**: None
- **Expected Result**: User can log out
- **Pass/Fail Criteria**: Logout works, session cleared
- **Type**: Functional
- **Devices**: All
- **Priority**: High

### 7. Responsive & Cross-Device Tests

#### TC-033: Viewport Breakpoint Transitions
- **Preconditions**: Multiple viewport sizes
- **Test Steps**:
  1. Load page at 320px (small mobile)
  2. Gradually resize to 1920px (wide desktop)
  3. At each breakpoint (768px, 1024px, 1280px):
     - Verify no layout breaks
     - Verify no horizontal scroll
     - Verify content remains readable
- **Test Data**: None
- **Expected Result**: Smooth transitions at breakpoints
- **Pass/Fail Criteria**: No breaks, no overflow
- **Type**: Visual/UI, Responsive
- **Devices**: All (simulated)
- **Priority**: High

#### TC-034: Portrait to Landscape Rotation (Mobile)
- **Preconditions**: Mobile device
- **Test Steps**:
  1. Load page in portrait mode
  2. Rotate device to landscape
  3. Verify layout adapts
  4. Verify no content cut off
  5. Verify navigation still accessible
- **Test Data**: None
- **Expected Result**: Layout adapts to orientation
- **Pass/Fail Criteria**: Content accessible in both orientations
- **Type**: Visual/UI, Mobile
- **Devices**: Mobile
- **Priority**: Medium

#### TC-035: Touch Interactions (Mobile)
- **Preconditions**: Mobile device or emulation
- **Test Steps**:
  1. Navigate to interactive page
  2. Verify all buttons ≥44px touch targets
  3. Test tap gestures on buttons
  4. Test swipe gestures (if applicable)
  5. Test pinch-to-zoom (if enabled)
- **Test Data**: None
- **Expected Result**: Touch interactions work smoothly
- **Pass/Fail Criteria**: All gestures work, no accidental taps
- **Type**: Usability, Mobile
- **Devices**: Mobile, Tablet
- **Priority**: High

#### TC-036: Keyboard Navigation (Desktop)
- **Preconditions**: Desktop with keyboard
- **Test Steps**:
  1. Navigate to form page
  2. Use Tab to navigate through fields
  3. Verify focus indicators visible
  4. Use Enter to submit form
  5. Use Esc to close modals
  6. Verify all interactive elements reachable
- **Test Data**: None
- **Expected Result**: Full keyboard accessibility
- **Pass/Fail Criteria**: All elements keyboard accessible
- **Type**: Accessibility, Usability
- **Devices**: Desktop
- **Priority**: High

#### TC-037: High Contrast Mode (Accessibility)
- **Preconditions**: OS high contrast enabled
- **Test Steps**:
  1. Enable high contrast mode
  2. Navigate through app
  3. Verify text remains readable
  4. Verify buttons/links distinguishable
  5. Verify icons visible
- **Test Data**: None
- **Expected Result**: App usable in high contrast
- **Pass/Fail Criteria**: All content readable, UI usable
- **Type**: Accessibility
- **Devices**: All
- **Priority**: Medium

### 8. Performance & Network Conditions

#### TC-038: Page Load Performance (Mobile)
- **Preconditions**: Mobile device or throttling
- **Test Steps**:
  1. Clear cache
  2. Navigate to homepage on mobile
  3. Measure time to interactive
  4. Verify loads within 3 seconds on 4G
- **Test Data**: None
- **Expected Result**: Fast load times
- **Pass/Fail Criteria**: <3s on 4G, <5s on 3G
- **Type**: Performance, Mobile
- **Devices**: Mobile
- **Priority**: High

#### TC-039: Slow Network (3G) Behavior
- **Preconditions**: Network throttling to Slow 3G
- **Test Steps**:
  1. Enable Slow 3G throttling
  2. Navigate to homepage
  3. Verify loading indicators appear
  4. Verify page eventually loads
  5. Verify no broken images/assets
  6. Test upload with slow network
  7. Verify appropriate feedback given
- **Test Data**: Sample image
- **Expected Result**: Graceful degradation on slow network
- **Pass/Fail Criteria**: Loading states, eventual success
- **Type**: Performance, Edge Case
- **Devices**: All
- **Priority**: High

#### TC-040: Offline Behavior
- **Preconditions**: Network disconnected
- **Test Steps**:
  1. Load a page while online
  2. Disconnect network
  3. Attempt to navigate
  4. Verify offline message appears
  5. Verify message is helpful (not generic)
  6. Reconnect network
  7. Verify app recovers
- **Test Data**: None
- **Expected Result**: Clear offline messaging
- **Pass/Fail Criteria**: Offline state detected, helpful message
- **Type**: Error Handling, Edge Case
- **Devices**: All
- **Priority**: Medium

#### TC-041: Large Image Upload Performance
- **Preconditions**: Large valid images
- **Test Steps**:
  1. Upload 10 images close to size limit
  2. Monitor upload progress
  3. Verify progress indicators update
  4. Verify no timeout errors
  5. Measure total upload time
- **Test Data**: 10 large images (~4.5MB total)
- **Expected Result**: Large uploads complete successfully
- **Pass/Fail Criteria**: Upload completes within reasonable time
- **Type**: Performance, Edge Case
- **Devices**: All
- **Priority**: Medium

### 9. Error Handling & Edge Cases

#### TC-042: API Timeout Handling
- **Preconditions**: Simulated slow/timeout API
- **Test Steps**:
  1. Trigger API call (e.g., start generation)
  2. Simulate timeout (mock or proxy)
  3. Verify timeout error appears
  4. Verify error message is clear
  5. Verify retry option available
  6. Retry and verify success
- **Test Data**: Mock timeout
- **Expected Result**: Timeout handled gracefully
- **Pass/Fail Criteria**: Error shown, retry works
- **Type**: Error Handling, Edge Case
- **Devices**: All
- **Priority**: High

#### TC-043: Server Error (500) Handling
- **Preconditions**: Simulated server error
- **Test Steps**:
  1. Trigger API call
  2. Return 500 error
  3. Verify error message appears
  4. Verify error is user-friendly (not technical)
  5. Verify option to report issue or retry
- **Test Data**: Mock 500 response
- **Expected Result**: Server error handled gracefully
- **Pass/Fail Criteria**: User-friendly error, action available
- **Type**: Error Handling, Edge Case
- **Devices**: All
- **Priority**: High

#### TC-044: Concurrent Upload Requests
- **Preconditions**: Multiple upload attempts
- **Test Steps**:
  1. Start upload of first batch
  2. Immediately start second upload
  3. Verify only one upload proceeds or
  4. Verify queue/parallel handling works
  5. Verify both complete successfully
- **Test Data**: 2 sets of images
- **Expected Result**: Concurrent uploads handled
- **Pass/Fail Criteria**: No crashes, uploads complete
- **Type**: Edge Case
- **Devices**: All
- **Priority**: Medium

#### TC-045: Browser Back Button Behavior
- **Preconditions**: Navigation history exists
- **Test Steps**:
  1. Navigate: Home → Upload → Results
  2. Click browser back button
  3. Verify returns to Upload page
  4. Verify state preserved (if applicable)
  5. Click back again
  6. Verify returns to Home
- **Test Data**: Navigation flow
- **Expected Result**: Back button works as expected
- **Pass/Fail Criteria**: Correct page, state preserved
- **Type**: Functional, Usability
- **Devices**: All
- **Priority**: Medium

#### TC-046: XSS Prevention in User Input
- **Preconditions**: Form with text input
- **Test Steps**:
  1. Navigate to form
  2. Enter malicious script: `<script>alert('XSS')</script>`
  3. Submit form
  4. Verify script is sanitized
  5. Verify no alert/execution occurs
  6. Verify input displayed safely
- **Test Data**: XSS payload strings
- **Expected Result**: XSS attempts prevented
- **Pass/Fail Criteria**: No script execution
- **Type**: Security, Edge Case
- **Devices**: All
- **Priority**: Critical

### 10. Accessibility (A11y) Tests

#### TC-047: Screen Reader Compatibility
- **Preconditions**: Screen reader available (manual)
- **Test Steps**:
  1. Enable screen reader
  2. Navigate through homepage
  3. Verify all images have alt text
  4. Verify headings in logical order
  5. Verify forms properly labeled
  6. Verify interactive elements announced
- **Test Data**: None
- **Expected Result**: App usable with screen reader
- **Pass/Fail Criteria**: All content accessible
- **Type**: Accessibility (Manual)
- **Devices**: All
- **Priority**: High

#### TC-048: Color Contrast Ratios
- **Preconditions**: Automated a11y tool
- **Test Steps**:
  1. Run axe-core on all pages
  2. Check contrast violations
  3. Verify text meets WCAG AA (4.5:1)
  4. Verify large text meets 3:1
  5. Verify UI elements meet 3:1
- **Test Data**: None
- **Expected Result**: All contrast ratios meet WCAG AA
- **Pass/Fail Criteria**: No contrast violations
- **Type**: Accessibility (Automated)
- **Devices**: All
- **Priority**: High

#### TC-049: Focus Management
- **Preconditions**: Keyboard navigation
- **Test Steps**:
  1. Tab through all interactive elements
  2. Verify focus visible at all times
  3. Open modal/dialog
  4. Verify focus trapped in modal
  5. Close modal
  6. Verify focus returns to trigger
- **Test Data**: None
- **Expected Result**: Focus properly managed
- **Pass/Fail Criteria**: Focus visible, trapped in modals
- **Type**: Accessibility
- **Devices**: All
- **Priority**: High

#### TC-050: ARIA Labels and Roles
- **Preconditions**: Automated a11y tool
- **Test Steps**:
  1. Run axe-core on all pages
  2. Verify ARIA roles present
  3. Verify ARIA labels on icons/buttons
  4. Verify no ARIA violations
- **Test Data**: None
- **Expected Result**: Proper ARIA usage
- **Pass/Fail Criteria**: No ARIA violations
- **Type**: Accessibility (Automated)
- **Devices**: All
- **Priority**: High

---

## Desktop-Only Features

Some features are intentionally optimized for desktop due to complexity:

### Complex Admin Interfaces (Future)
- **Advanced Settings/Configuration**: Dense forms with many fields
- **Bulk Operations Dashboard**: Complex data tables with multi-select
- **Analytics & Reporting**: Charts and graphs requiring precision

**Mobile Handling**:
- Show read-only view with message: "For full access, please use a desktop browser"
- Provide essential actions only (view, simple edits)
- Ensure no broken UI on mobile

---

## Test Coverage Summary

| Category | Test Cases | Automated | Manual | Priority |
|----------|------------|-----------|--------|----------|
| Homepage & Landing | 3 | 3 | 0 | Critical |
| Navigation | 3 | 3 | 0 | High |
| Image Upload | 9 | 8 | 1 (camera) | Critical |
| AI Generation | 6 | 6 | 0 | Critical |
| Results Gallery | 6 | 6 | 0 | High |
| Authentication | 5 | 5 | 0 | High |
| Responsive | 5 | 4 | 1 (rotation) | High |
| Performance | 4 | 4 | 0 | High |
| Error Handling | 5 | 5 | 0 | High |
| Accessibility | 4 | 2 | 2 | High |
| **Total** | **50** | **46** | **4** | - |

---

## Test Environments

### Local Development
- URL: `http://localhost:3000`
- Database: Local PostgreSQL or mock
- API: Mock or local services

### Staging/CI
- URL: Staging deployment URL
- Database: Staging database
- API: Staging services

### Production (Smoke Tests)
- URL: Production URL
- Limited critical path tests only
- No destructive operations

---

## Continuous Integration

Tests run automatically on:
- Every pull request
- Merge to main branch
- Nightly regression runs

CI Configuration: `.github/workflows/e2e-tests.yml`

---

## Known Limitations & Deferred Tests

1. **Email Verification Flow**: Manual test required (email delivery)
2. **Camera Access**: Manual test on actual mobile devices
3. **Device Rotation**: Manual test on actual devices
4. **Screen Reader Full Test**: Manual accessibility audit
5. **Payment Flow**: Deferred until Stripe integration active

---

## Maintenance & Updates

- Review test cases monthly
- Update after major feature releases
- Add regression tests for bug fixes
- Keep test data up to date
- Monitor flaky tests and fix promptly

---

## Contact

For questions about testing:
- **QA Lead**: [Contact info]
- **Documentation**: This file (TESTING.md)
- **Issues**: GitHub Issues with `testing` label
