import { Page, Locator, expect } from '@playwright/test';

export class InfrastructurePage {
  readonly page: Page;
  readonly resourcesTab: Locator;
  readonly templatesTab: Locator;
  readonly overviewTab: Locator;
  readonly addResourceButton: Locator;
  readonly resourceTable: Locator;
  readonly searchInput: Locator;
  readonly filterDropdown: Locator;
  readonly refreshButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.resourcesTab = page.locator('[data-testid="resources-tab"]');
    this.templatesTab = page.locator('[data-testid="templates-tab"]');
    this.overviewTab = page.locator('[data-testid="overview-tab"]');
    this.addResourceButton = page.locator('[data-testid="add-resource-button"]');
    this.resourceTable = page.locator('[data-testid="resource-table"]');
    this.searchInput = page.locator('[data-testid="search-input"]');
    this.filterDropdown = page.locator('[data-testid="filter-dropdown"]');
    this.refreshButton = page.locator('[data-testid="refresh-button"]');
  }

  async goto() {
    await this.page.goto('/infrastructure');
  }

  async expectInfrastructurePageLoaded() {
    await expect(this.resourcesTab).toBeVisible();
    await expect(this.templatesTab).toBeVisible();
    await expect(this.overviewTab).toBeVisible();
  }

  async switchToResourcesTab() {
    await this.resourcesTab.click();
    await expect(this.resourceTable).toBeVisible();
  }

  async switchToTemplatesTab() {
    await this.templatesTab.click();
  }

  async switchToOverviewTab() {
    await this.overviewTab.click();
  }

  async searchResources(query: string) {
    await this.searchInput.fill(query);
    await this.page.keyboard.press('Enter');
  }

  async filterByProvider(provider: string) {
    await this.filterDropdown.click();
    await this.page.locator(`[data-testid="filter-${provider}"]`).click();
  }

  async refreshResources() {
    await this.refreshButton.click();
  }

  async addNewResource() {
    await this.addResourceButton.click();
  }

  async expectResourceInTable(resourceName: string) {
    await expect(this.resourceTable.locator(`text=${resourceName}`)).toBeVisible();
  }
}