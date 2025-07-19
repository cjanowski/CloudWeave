import { test, expect } from './fixtures/auth';

test.describe('Deployment Management', () => {
  test.use({ storageState: 'tests/e2e/auth-state.json' });

  test('should display deployment overview', async ({ page }) => {
    await page.goto('/deployments');
    
    // Verify deployment overview is loaded
    await expect(page.locator('[data-testid="deployment-overview"]')).toBeVisible();
    await expect(page.locator('[data-testid="active-deployments"]')).toBeVisible();
    await expect(page.locator('[data-testid="deployment-history"]')).toBeVisible();
  });

  test('should list deployment pipelines', async ({ page }) => {
    await page.goto('/deployments/pipelines');
    
    // Verify pipelines page
    await expect(page.locator('[data-testid="pipeline-list"]')).toBeVisible();
    await expect(page.locator('[data-testid="create-pipeline-button"]')).toBeVisible();
    
    // Verify pipeline table headers
    await expect(page.locator('th:has-text("Pipeline Name")')).toBeVisible();
    await expect(page.locator('th:has-text("Status")')).toBeVisible();
    await expect(page.locator('th:has-text("Last Run")')).toBeVisible();
    await expect(page.locator('th:has-text("Success Rate")')).toBeVisible();
  });

  test('should create new deployment pipeline', async ({ page }) => {
    await page.goto('/deployments/pipelines');
    
    // Click create pipeline button
    await page.click('[data-testid="create-pipeline-button"]');
    
    // Verify pipeline creation form
    await expect(page.locator('[data-testid="pipeline-form"]')).toBeVisible();
    
    // Fill pipeline details
    await page.fill('[data-testid="pipeline-name"]', 'test-pipeline');
    await page.fill('[data-testid="pipeline-description"]', 'Test deployment pipeline');
    await page.selectOption('[data-testid="source-repository"]', 'github');
    await page.fill('[data-testid="repository-url"]', 'https://github.com/test/repo');
    
    // Configure deployment strategy
    await page.selectOption('[data-testid="deployment-strategy"]', 'blue-green');
    await page.selectOption('[data-testid="target-environment"]', 'staging');
    
    // Save pipeline
    await page.click('[data-testid="save-pipeline-button"]');
    
    // Verify pipeline was created
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('text=test-pipeline')).toBeVisible();
  });

  test('should trigger deployment', async ({ page }) => {
    await page.goto('/deployments/pipelines');
    
    // Find and trigger a pipeline
    await page.click('[data-testid="pipeline-row"]:first-child [data-testid="trigger-button"]');
    
    // Verify deployment trigger modal
    await expect(page.locator('[data-testid="trigger-deployment-modal"]')).toBeVisible();
    
    // Select deployment options
    await page.selectOption('[data-testid="branch-select"]', 'main');
    await page.fill('[data-testid="deployment-notes"]', 'Test deployment');
    
    // Confirm deployment
    await page.click('[data-testid="confirm-deployment-button"]');
    
    // Verify deployment started
    await expect(page.locator('[data-testid="deployment-started-message"]')).toBeVisible();
  });

  test('should view deployment history', async ({ page }) => {
    await page.goto('/deployments/history');
    
    // Verify history page
    await expect(page.locator('[data-testid="deployment-history-table"]')).toBeVisible();
    
    // Verify history table headers
    await expect(page.locator('th:has-text("Deployment ID")')).toBeVisible();
    await expect(page.locator('th:has-text("Application")')).toBeVisible();
    await expect(page.locator('th:has-text("Environment")')).toBeVisible();
    await expect(page.locator('th:has-text("Status")')).toBeVisible();
    await expect(page.locator('th:has-text("Started")')).toBeVisible();
    await expect(page.locator('th:has-text("Duration")')).toBeVisible();
  });

  test('should view deployment details and logs', async ({ page }) => {
    await page.goto('/deployments/history');
    
    // Click on a deployment to view details
    await page.click('[data-testid="deployment-row"]:first-child');
    
    // Verify deployment details page
    await expect(page.locator('[data-testid="deployment-details"]')).toBeVisible();
    await expect(page.locator('[data-testid="deployment-status"]')).toBeVisible();
    await expect(page.locator('[data-testid="deployment-timeline"]')).toBeVisible();
    await expect(page.locator('[data-testid="deployment-logs"]')).toBeVisible();
    
    // Verify logs are displayed
    await expect(page.locator('[data-testid="log-entries"]')).toBeVisible();
  });

  test('should handle deployment rollback', async ({ page }) => {
    await page.goto('/deployments/history');
    
    // Find a successful deployment and initiate rollback
    await page.click('[data-testid="deployment-row"]:first-child [data-testid="rollback-button"]');
    
    // Verify rollback confirmation modal
    await expect(page.locator('[data-testid="rollback-confirmation-modal"]')).toBeVisible();
    
    // Confirm rollback
    await page.click('[data-testid="confirm-rollback-button"]');
    
    // Verify rollback initiated
    await expect(page.locator('[data-testid="rollback-initiated-message"]')).toBeVisible();
  });

  test('should filter deployment history', async ({ page }) => {
    await page.goto('/deployments/history');
    
    // Apply filters
    await page.selectOption('[data-testid="environment-filter"]', 'production');
    await page.selectOption('[data-testid="status-filter"]', 'success');
    
    // Apply date range filter
    await page.fill('[data-testid="date-from"]', '2024-01-01');
    await page.fill('[data-testid="date-to"]', '2024-12-31');
    
    // Apply filters
    await page.click('[data-testid="apply-filters-button"]');
    
    // Verify filtered results
    await expect(page.locator('[data-testid="filtered-results"]')).toBeVisible();
  });
});