import { Page, Locator, expect } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly sidebar: Locator;
  readonly header: Locator;
  readonly userMenu: Locator;
  readonly logoutButton: Locator;
  readonly infrastructureCard: Locator;
  readonly deploymentsCard: Locator;
  readonly monitoringCard: Locator;
  readonly securityCard: Locator;
  readonly costCard: Locator;
  readonly settingsCard: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sidebar = page.locator('[data-testid="sidebar"]');
    this.header = page.locator('[data-testid="header"]');
    this.userMenu = page.locator('[data-testid="user-menu"]');
    this.logoutButton = page.locator('[data-testid="logout-button"]');
    this.infrastructureCard = page.locator('[data-testid="infrastructure-card"]');
    this.deploymentsCard = page.locator('[data-testid="deployments-card"]');
    this.monitoringCard = page.locator('[data-testid="monitoring-card"]');
    this.securityCard = page.locator('[data-testid="security-card"]');
    this.costCard = page.locator('[data-testid="cost-card"]');
    this.settingsCard = page.locator('[data-testid="settings-card"]');
  }

  async goto() {
    await this.page.goto('/dashboard');
  }

  async expectDashboardLoaded() {
    await expect(this.sidebar).toBeVisible();
    await expect(this.header).toBeVisible();
    await expect(this.infrastructureCard).toBeVisible();
  }

  async navigateToInfrastructure() {
    await this.infrastructureCard.click();
    await expect(this.page).toHaveURL('/infrastructure');
  }

  async navigateToDeployments() {
    await this.deploymentsCard.click();
    await expect(this.page).toHaveURL('/deployments');
  }

  async navigateToMonitoring() {
    await this.monitoringCard.click();
    await expect(this.page).toHaveURL('/monitoring');
  }

  async navigateToSecurity() {
    await this.securityCard.click();
    await expect(this.page).toHaveURL('/security');
  }

  async navigateToCost() {
    await this.costCard.click();
    await expect(this.page).toHaveURL('/cost');
  }

  async navigateToSettings() {
    await this.settingsCard.click();
    await expect(this.page).toHaveURL('/settings');
  }

  async logout() {
    await this.userMenu.click();
    await this.logoutButton.click();
    await expect(this.page).toHaveURL('/auth/login');
  }
}