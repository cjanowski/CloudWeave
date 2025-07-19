import { test, expect } from './fixtures/auth';

test.describe('Authentication Flow', () => {
  test('should login with valid credentials', async ({ page, loginPage, dashboardPage }) => {
    await loginPage.goto();
    await loginPage.login('admin@test.com', 'TestPassword123!');
    await loginPage.expectLoginSuccess();
    await dashboardPage.expectDashboardLoaded();
  });

  test('should show error with invalid credentials', async ({ page, loginPage }) => {
    await loginPage.goto();
    await loginPage.login('invalid@test.com', 'wrongpassword');
    await loginPage.expectLoginError('Invalid credentials');
  });

  test('should show error with empty fields', async ({ page, loginPage }) => {
    await loginPage.goto();
    await loginPage.login('', '');
    await loginPage.expectLoginError('Email and password are required');
  });

  test('should logout successfully', async ({ page, dashboardPage, authenticatedContext }) => {
    const authPage = await authenticatedContext.newPage();
    const authDashboard = new DashboardPage(authPage);
    
    await authDashboard.goto();
    await authDashboard.expectDashboardLoaded();
    await authDashboard.logout();
  });

  test('should redirect to login when accessing protected route without auth', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/auth/login');
  });

  test('should maintain session after page refresh', async ({ page, dashboardPage, authenticatedContext }) => {
    const authPage = await authenticatedContext.newPage();
    const authDashboard = new DashboardPage(authPage);
    
    await authDashboard.goto();
    await authDashboard.expectDashboardLoaded();
    
    await authPage.reload();
    await authDashboard.expectDashboardLoaded();
  });
});