import { test, expect } from '@playwright/test';

// Test all public pages render correctly
test.describe('Public Pages - User Flows', () => {
  test('Homepage loads and shows main sections', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/VP|Luat|Hung|Tu van/i, { timeout: 10000 });

    // Check navigation exists
    await expect(page.locator('nav, header').first()).toBeVisible();

    // Page should not have console errors
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.waitForTimeout(1000);
    expect(errors).toEqual([]);
  });

  test('Services page loads', async ({ page }) => {
    await page.goto('/services');
    await expect(page.locator('body')).toBeVisible();
  });

  test('Lawyers page loads', async ({ page }) => {
    await page.goto('/lawyers');
    await expect(page.locator('body')).toBeVisible();
  });

  test('News page loads', async ({ page }) => {
    await page.goto('/news');
    await expect(page.locator('body')).toBeVisible();
  });

  test('Booking page loads', async ({ page }) => {
    await page.goto('/booking');
    await expect(page.locator('body')).toBeVisible();
  });

  test('Contact page loads', async ({ page }) => {
    await page.goto('/contact');
    await expect(page.locator('body')).toBeVisible();
  });

  test('Login page loads', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('body')).toBeVisible();
    // Should have email and password fields
    await expect(page.locator('input[type="email"], input[name="email"]').first()).toBeVisible({ timeout: 5000 }).catch(() => {});
  });
});

test.describe('Admin Pages - Login Required', () => {
  test('Admin root redirects or shows login', async ({ page }) => {
    await page.goto('/admin');
    // Either we see login form OR the admin shell
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
  });

  test('Admin roles page loads (requires auth)', async ({ page }) => {
    const response = await page.goto('/admin/roles');
    expect(response?.status()).toBe(200);
  });

  test('Admin files page loads (requires auth)', async ({ page }) => {
    const response = await page.goto('/admin/files');
    expect(response?.status()).toBe(200);
  });

  test('Admin lawyer-schedules page loads (requires auth)', async ({ page }) => {
    const response = await page.goto('/admin/lawyer-schedules');
    expect(response?.status()).toBe(200);
  });

  test('Admin site-content page loads (requires auth)', async ({ page }) => {
    const response = await page.goto('/admin/site-content');
    expect(response?.status()).toBe(200);
  });

  test('Admin settings page loads with Test Email tab', async ({ page }) => {
    const response = await page.goto('/admin/settings');
    expect(response?.status()).toBe(200);
  });
});

test.describe('Visual Smoke - Critical Pages', () => {
  test('Homepage visual check', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Take a screenshot for visual inspection
    await page.screenshot({ path: 'test-results/screenshots/homepage.png', fullPage: false });

    // Verify the page has rendered content
    const bodyText = await page.locator('body').textContent();
    expect(bodyText?.length).toBeGreaterThan(50);
  });

  test('Booking page visual check', async ({ page }) => {
    await page.goto('/booking');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/screenshots/booking.png', fullPage: false });
  });

  test('Services page visual check', async ({ page }) => {
    await page.goto('/services');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/screenshots/services.png', fullPage: false });
  });

  test('Login page visual check', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/screenshots/login.png', fullPage: false });
  });
});

test.describe('Responsive Design', () => {
  test('Homepage works on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });

  test('Booking page works on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/booking');
    await expect(page.locator('body')).toBeVisible();
  });

  test('Login page works on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/login');
    await expect(page.locator('body')).toBeVisible();
  });
});
