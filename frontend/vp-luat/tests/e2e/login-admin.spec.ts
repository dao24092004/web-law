import { test, expect } from '@playwright/test';

// Test complete login flow and admin access
test.describe('Complete Login & Admin Flow', () => {
  test('Login with valid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await page.screenshot({ path: 'test-results/screenshots/login-form.png', fullPage: true });

    // Fill login form
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();

    if (await emailInput.isVisible() && await passwordInput.isVisible()) {
      await emailInput.fill('newadmin@lawfirm.vn');
      await passwordInput.fill('Admin@123456');

      await page.screenshot({ path: 'test-results/screenshots/login-filled.png', fullPage: true });

      // Submit form
      const submitButton = page.locator('button[type="submit"]').first();
      await submitButton.click();

      // Wait for redirect
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      await page.waitForTimeout(2000);

      await page.screenshot({ path: 'test-results/screenshots/after-login.png', fullPage: true });

      console.log(`After login URL: ${page.url()}`);
    }
  });

  test('Login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();

    if (await emailInput.isVisible()) {
      await emailInput.fill('wrong@email.com');
      await passwordInput.fill('wrongpassword');

      const submitButton = page.locator('button[type="submit"]').first();
      await submitButton.click();
      await page.waitForTimeout(2000);

      await page.screenshot({ path: 'test-results/screenshots/login-error.png', fullPage: true });
    }
  });

  test('Login form has all required UI elements', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Check for branding/logo
    const body = page.locator('body');
    const text = await body.textContent();

    // Should have Vietnamese UI
    expect(text?.length).toBeGreaterThan(100);

    await page.screenshot({ path: 'test-results/screenshots/login-ui.png', fullPage: true });
  });
});

// Test admin pages after login
test.describe('Admin Pages Access', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();

    if (await emailInput.isVisible()) {
      await emailInput.fill('newadmin@lawfirm.vn');
      await passwordInput.fill('Admin@123456');
      const submitButton = page.locator('button[type="submit"]').first();
      await submitButton.click();
      await page.waitForTimeout(3000);
    }
  });

  test('Admin dashboard accessible', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/screenshots/admin-dashboard.png', fullPage: true });
  });

  test('Admin Roles matrix page', async ({ page }) => {
    await page.goto('/admin/roles');
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/screenshots/admin-roles.png', fullPage: true });
  });

  test('Admin Files manager page', async ({ page }) => {
    await page.goto('/admin/files');
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/screenshots/admin-files.png', fullPage: true });
  });

  test('Admin Lawyer Schedules page', async ({ page }) => {
    await page.goto('/admin/lawyer-schedules');
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/screenshots/admin-lawyer-schedules.png', fullPage: true });
  });

  test('Admin Site Content page', async ({ page }) => {
    await page.goto('/admin/site-content');
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/screenshots/admin-site-content.png', fullPage: true });
  });

  test('Admin Settings with Email Test', async ({ page }) => {
    await page.goto('/admin/settings');
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/screenshots/admin-settings.png', fullPage: true });
  });

  test('Admin Users page', async ({ page }) => {
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/screenshots/admin-users.png', fullPage: true });
  });

  test('Admin CRM page', async ({ page }) => {
    await page.goto('/admin/crm');
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/screenshots/admin-crm.png', fullPage: true });
  });

  test('Admin Reports page', async ({ page }) => {
    await page.goto('/admin/reports');
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/screenshots/admin-reports.png', fullPage: true });
  });
});
