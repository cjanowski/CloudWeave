import { test as base, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';

type AuthFixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  authenticatedContext: any;
};

export const test = base.extend<AuthFixtures>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  dashboardPage: async ({ page }, use) => {
    const dashboardPage = new DashboardPage(page);
    await use(dashboardPage);
  },

  authenticatedContext: async ({ browser }, use) => {
    // Create a new context with stored authentication state
    const context = await browser.newContext({
      storageState: 'tests/e2e/auth-state.json'
    });
    await use(context);
    await context.close();
  },
});

export { expect } from '@playwright/test';