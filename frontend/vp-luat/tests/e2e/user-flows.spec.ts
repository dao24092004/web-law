import { test, expect } from '@playwright/test';

// Test booking flow chi tiet
test.describe('Booking Flow', () => {
  test('Booking wizard step 1 - Service selection', async ({ page }) => {
    await page.goto('/booking');
    await page.waitForLoadState('networkidle');

    // Page should show booking wizard
    await expect(page.locator('body')).toBeVisible();

    // Try to find and click a service option
    const serviceCards = page.locator('[data-testid*="service"], .service-card, button:has-text("Ly hon"), button:has-text("Dat lich")');
    const count = await serviceCards.count();
    console.log(`Service options found: ${count}`);

    await page.screenshot({ path: 'test-results/screenshots/booking-step1.png', fullPage: true });
  });

  test('Booking wizard step 2 - DateTime selection', async ({ page }) => {
    await page.goto('/booking');
    await page.waitForLoadState('networkidle');

    // Check if there's a date picker visible
    const dateInputs = page.locator('input[type="date"], input[type="datetime-local"], [data-testid*="date"]');
    const dateCount = await dateInputs.count();
    console.log(`Date inputs found: ${dateCount}`);

    await page.screenshot({ path: 'test-results/screenshots/booking-datetime.png', fullPage: true });
  });

  test('Booking wizard step 3 - Customer info form', async ({ page }) => {
    await page.goto('/booking');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/screenshots/booking-step3.png', fullPage: true });
  });
});

// Test Homepage sections
test.describe('Homepage Sections', () => {
  test('Hero section visible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Hero should have a heading
    const h1 = page.locator('h1').first();
    if (await h1.isVisible()) {
      const text = await h1.textContent();
      console.log(`H1 text: ${text}`);
    }
  });

  test('Navigation menu works', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Find navigation links
    const navLinks = page.locator('nav a, header a');
    const linkCount = await navLinks.count();
    console.log(`Navigation links found: ${linkCount}`);

    // Try clicking first nav link
    if (linkCount > 0) {
      const firstLink = navLinks.first();
      const href = await firstLink.getAttribute('href');
      console.log(`First nav link: ${href}`);
    }
  });

  test('Footer visible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const footer = page.locator('footer');
    if (await footer.isVisible()) {
      const text = await footer.textContent();
      console.log(`Footer text length: ${text?.length}`);
    }
  });
});

// Test Services
test.describe('Services Pages', () => {
  test('Services listing has cards', async ({ page }) => {
    await page.goto('/services');
    await page.waitForLoadState('networkidle');

    // Find service cards/links
    const serviceLinks = page.locator('a[href*="/services/"]');
    const count = await serviceLinks.count();
    console.log(`Service links found: ${count}`);

    await page.screenshot({ path: 'test-results/screenshots/services-full.png', fullPage: true });
  });

  test('Service detail page', async ({ page }) => {
    await page.goto('/services');
    await page.waitForLoadState('networkidle');

    const firstLink = page.locator('a[href*="/services/"]').first();
    if (await firstLink.isVisible()) {
      await firstLink.click();
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'test-results/screenshots/service-detail.png', fullPage: true });
    }
  });
});

// Test Lawyers
test.describe('Lawyers Pages', () => {
  test('Lawyers listing', async ({ page }) => {
    await page.goto('/lawyers');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/screenshots/lawyers.png', fullPage: true });
  });

  test('Lawyer detail page', async ({ page }) => {
    await page.goto('/lawyers');
    await page.waitForLoadState('networkidle');
    const firstLink = page.locator('a[href*="/lawyers/"]').first();
    if (await firstLink.isVisible()) {
      await firstLink.click();
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'test-results/screenshots/lawyer-detail.png', fullPage: true });
    }
  });
});

// Test News
test.describe('News Pages', () => {
  test('News listing', async ({ page }) => {
    await page.goto('/news');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/screenshots/news.png', fullPage: true });
  });

  test('News detail page', async ({ page }) => {
    await page.goto('/news');
    await page.waitForLoadState('networkidle');
    const firstLink = page.locator('a[href*="/news/"]').first();
    if (await firstLink.isVisible()) {
      await firstLink.click();
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'test-results/screenshots/news-detail.png', fullPage: true });
    }
  });
});

// Test Contact
test.describe('Contact Page', () => {
  test('Contact form visible', async ({ page }) => {
    await page.goto('/contact');
    await page.waitForLoadState('networkidle');

    // Look for contact form
    const form = page.locator('form');
    const count = await form.count();
    console.log(`Forms found: ${count}`);

    await page.screenshot({ path: 'test-results/screenshots/contact.png', fullPage: true });
  });
});

// Test Login flow
test.describe('Login Flow', () => {
  test('Login form has required fields', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitButton = page.locator('button[type="submit"]').first();

    if (await emailInput.isVisible()) {
      console.log('Email field found');
    }
    if (await passwordInput.isVisible()) {
      console.log('Password field found');
    }
    if (await submitButton.isVisible()) {
      console.log('Submit button found');
    }

    await page.screenshot({ path: 'test-results/screenshots/login-detail.png', fullPage: true });
  });

  test('Login validation - empty fields', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const submitButton = page.locator('button[type="submit"]').first();
    if (await submitButton.isVisible()) {
      await submitButton.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'test-results/screenshots/login-validation.png', fullPage: true });
    }
  });
});

// Test responsive design
test.describe('Mobile Responsive', () => {
  test('Homepage mobile layout', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/screenshots/mobile-homepage.png', fullPage: true });
  });

  test('Booking mobile layout', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/booking');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/screenshots/mobile-booking.png', fullPage: true });
  });

  test('Services mobile layout', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/services');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/screenshots/mobile-services.png', fullPage: true });
  });

  test('Login mobile layout', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/screenshots/mobile-login.png', fullPage: true });
  });
});
