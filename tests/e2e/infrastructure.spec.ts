import { test, expect } from './fixtures/auth';
import { InfrastructurePage } from './pages/InfrastructurePage';

test.describe('Infrastructure Management', () => {
  test.use({ storageState: 'tests/e2e/auth-state.json' });

  test('should display infrastructure overview', async ({ page }) => {
    const infrastructurePage = new InfrastructurePage(page);
    
    await infrastructurePage.goto();
    await infrastructurePage.expectInfrastructurePageLoaded();
    await infrastructurePage.switchToOverviewTab();
    
    // Verify overview metrics are displayed
    await expect(page.locator('[data-testid="total-resources"]')).toBeVisible();
    await expect(page.locator('[data-testid="active-resources"]')).toBeVisible();
    await expect(page.locator('[data-testid="cost-summary"]')).toBeVisible();
  });

  test('should list infrastructure resources', async ({ page }) => {
    const infrastructurePage = new InfrastructurePage(page);
    
    await infrastructurePage.goto();
    await infrastructurePage.switchToResourcesTab();
    
    // Verify resource table is displayed
    await expect(infrastructurePage.resourceTable).toBeVisible();
    
    // Verify table headers
    await expect(page.locator('th:has-text("Name")')).toBeVisible();
    await expect(page.locator('th:has-text("Type")')).toBeVisible();
    await expect(page.locator('th:has-text("Provider")')).toBeVisible();
    await expect(page.locator('th:has-text("Status")')).toBeVisible();
    await expect(page.locator('th:has-text("Cost")')).toBeVisible();
  });

  test('should search infrastructure resources', async ({ page }) => {
    const infrastructurePage = new InfrastructurePage(page);
    
    await infrastructurePage.goto();
    await infrastructurePage.switchToResourcesTab();
    
    // Search for specific resource
    await infrastructurePage.searchResources('web-server');
    
    // Verify search results
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
  });

  test('should filter resources by cloud provider', async ({ page }) => {
    const infrastructurePage = new InfrastructurePage(page);
    
    await infrastructurePage.goto();
    await infrastructurePage.switchToResourcesTab();
    
    // Filter by AWS
    await infrastructurePage.filterByProvider('aws');
    
    // Verify filtered results
    await expect(page.locator('[data-testid="filtered-results"]')).toBeVisible();
  });

  test('should refresh resource list', async ({ page }) => {
    const infrastructurePage = new InfrastructurePage(page);
    
    await infrastructurePage.goto();
    await infrastructurePage.switchToResourcesTab();
    
    // Click refresh button
    await infrastructurePage.refreshResources();
    
    // Verify loading state and updated data
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeHidden();
  });

  test('should navigate to resource templates', async ({ page }) => {
    const infrastructurePage = new InfrastructurePage(page);
    
    await infrastructurePage.goto();
    await infrastructurePage.switchToTemplatesTab();
    
    // Verify templates page is loaded
    await expect(page.locator('[data-testid="template-gallery"]')).toBeVisible();
    await expect(page.locator('[data-testid="create-template-button"]')).toBeVisible();
  });

  test('should handle resource creation workflow', async ({ page }) => {
    const infrastructurePage = new InfrastructurePage(page);
    
    await infrastructurePage.goto();
    await infrastructurePage.switchToResourcesTab();
    await infrastructurePage.addNewResource();
    
    // Verify resource creation modal/page
    await expect(page.locator('[data-testid="resource-creation-form"]')).toBeVisible();
    
    // Fill basic resource information
    await page.fill('[data-testid="resource-name"]', 'test-resource');
    await page.selectOption('[data-testid="resource-type"]', 'ec2-instance');
    await page.selectOption('[data-testid="cloud-provider"]', 'aws');
    
    // Verify form validation
    await expect(page.locator('[data-testid="create-resource-button"]')).toBeEnabled();
  });
});