import { test, expect } from './fixtures/auth';

test.describe('Monitoring and Alerting', () => {
  test.use({ storageState: 'tests/e2e/auth-state.json' });

  test('should display monitoring overview', async ({ page }) => {
    await page.goto('/monitoring');
    
    // Verify monitoring overview is loaded
    await expect(page.locator('[data-testid="monitoring-overview"]')).toBeVisible();
    await expect(page.locator('[data-testid="system-health"]')).toBeVisible();
    await expect(page.locator('[data-testid="active-alerts"]')).toBeVisible();
    await expect(page.locator('[data-testid="metrics-summary"]')).toBeVisible();
  });

  test('should display metrics dashboard', async ({ page }) => {
    await page.goto('/monitoring/metrics');
    
    // Verify metrics page
    await expect(page.locator('[data-testid="metrics-dashboard"]')).toBeVisible();
    
    // Verify key metric charts
    await expect(page.locator('[data-testid="cpu-usage-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="memory-usage-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="network-traffic-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="response-time-chart"]')).toBeVisible();
  });

  test('should filter metrics by time range', async ({ page }) => {
    await page.goto('/monitoring/metrics');
    
    // Change time range
    await page.click('[data-testid="time-range-selector"]');
    await page.click('[data-testid="time-range-24h"]');
    
    // Verify charts update
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeHidden();
    
    // Verify time range is applied
    await expect(page.locator('[data-testid="selected-time-range"]')).toContainText('Last 24 hours');
  });

  test('should display alerts list', async ({ page }) => {
    await page.goto('/monitoring/alerts');
    
    // Verify alerts page
    await expect(page.locator('[data-testid="alerts-list"]')).toBeVisible();
    
    // Verify alert table headers
    await expect(page.locator('th:has-text("Alert Name")')).toBeVisible();
    await expect(page.locator('th:has-text("Severity")')).toBeVisible();
    await expect(page.locator('th:has-text("Status")')).toBeVisible();
    await expect(page.locator('th:has-text("Triggered")')).toBeVisible();
    await expect(page.locator('th:has-text("Actions")')).toBeVisible();
  });

  test('should create new alert rule', async ({ page }) => {
    await page.goto('/monitoring/alerts');
    
    // Click create alert button
    await page.click('[data-testid="create-alert-button"]');
    
    // Verify alert creation form
    await expect(page.locator('[data-testid="alert-form"]')).toBeVisible();
    
    // Fill alert details
    await page.fill('[data-testid="alert-name"]', 'High CPU Usage');
    await page.fill('[data-testid="alert-description"]', 'Alert when CPU usage exceeds 80%');
    
    // Configure alert conditions
    await page.selectOption('[data-testid="metric-select"]', 'cpu_usage');
    await page.selectOption('[data-testid="condition-select"]', 'greater_than');
    await page.fill('[data-testid="threshold-value"]', '80');
    await page.selectOption('[data-testid="severity-select"]', 'warning');
    
    // Configure notification channels
    await page.check('[data-testid="email-notification"]');
    await page.fill('[data-testid="notification-email"]', 'alerts@test.com');
    
    // Save alert rule
    await page.click('[data-testid="save-alert-button"]');
    
    // Verify alert was created
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('text=High CPU Usage')).toBeVisible();
  });

  test('should acknowledge alert', async ({ page }) => {
    await page.goto('/monitoring/alerts');
    
    // Find an active alert and acknowledge it
    await page.click('[data-testid="alert-row"]:first-child [data-testid="acknowledge-button"]');
    
    // Verify acknowledgment modal
    await expect(page.locator('[data-testid="acknowledge-modal"]')).toBeVisible();
    
    // Add acknowledgment note
    await page.fill('[data-testid="acknowledgment-note"]', 'Investigating the issue');
    
    // Confirm acknowledgment
    await page.click('[data-testid="confirm-acknowledge-button"]');
    
    // Verify alert status updated
    await expect(page.locator('[data-testid="alert-acknowledged-message"]')).toBeVisible();
  });

  test('should resolve alert', async ({ page }) => {
    await page.goto('/monitoring/alerts');
    
    // Find an acknowledged alert and resolve it
    await page.click('[data-testid="alert-row"]:first-child [data-testid="resolve-button"]');
    
    // Verify resolution modal
    await expect(page.locator('[data-testid="resolve-modal"]')).toBeVisible();
    
    // Add resolution note
    await page.fill('[data-testid="resolution-note"]', 'Issue resolved by scaling up resources');
    
    // Confirm resolution
    await page.click('[data-testid="confirm-resolve-button"]');
    
    // Verify alert status updated
    await expect(page.locator('[data-testid="alert-resolved-message"]')).toBeVisible();
  });

  test('should filter alerts by severity', async ({ page }) => {
    await page.goto('/monitoring/alerts');
    
    // Apply severity filter
    await page.selectOption('[data-testid="severity-filter"]', 'critical');
    
    // Verify filtered results
    await expect(page.locator('[data-testid="filtered-alerts"]')).toBeVisible();
    
    // Verify only critical alerts are shown
    const alertRows = page.locator('[data-testid="alert-row"]');
    const count = await alertRows.count();
    
    for (let i = 0; i < count; i++) {
      await expect(alertRows.nth(i).locator('[data-testid="severity-badge"]')).toContainText('Critical');
    }
  });

  test('should view alert history', async ({ page }) => {
    await page.goto('/monitoring/alerts');
    
    // Click on an alert to view details
    await page.click('[data-testid="alert-row"]:first-child [data-testid="view-details-button"]');
    
    // Verify alert details page
    await expect(page.locator('[data-testid="alert-details"]')).toBeVisible();
    await expect(page.locator('[data-testid="alert-timeline"]')).toBeVisible();
    await expect(page.locator('[data-testid="alert-history"]')).toBeVisible();
    
    // Verify alert events are displayed
    await expect(page.locator('[data-testid="alert-events"]')).toBeVisible();
  });
});