import { chromium, FullConfig } from '@playwright/test';
import { execSync } from 'child_process';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup for E2E tests...');

  // Set up test database
  try {
    console.log('📊 Setting up test database...');
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/cloudweave_test';
    
    // Run database migrations and seeds for test environment
    execSync('npm run db:reset', { stdio: 'inherit' });
    console.log('✅ Test database setup complete');
  } catch (error) {
    console.error('❌ Failed to setup test database:', error);
    throw error;
  }

  // Create test user and organization
  try {
    console.log('👤 Creating test user and organization...');
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    // Navigate to registration page and create test organization
    await page.goto('/auth/register');
    await page.fill('[data-testid="organization-name"]', 'Test Organization');
    await page.fill('[data-testid="admin-email"]', 'admin@test.com');
    await page.fill('[data-testid="admin-password"]', 'TestPassword123!');
    await page.fill('[data-testid="admin-password-confirm"]', 'TestPassword123!');
    await page.click('[data-testid="register-button"]');

    // Wait for successful registration
    await page.waitForURL('/dashboard');
    
    // Store authentication state
    await context.storageState({ path: 'tests/e2e/auth-state.json' });
    
    await browser.close();
    console.log('✅ Test user and organization created');
  } catch (error) {
    console.error('❌ Failed to create test user:', error);
    // Continue with tests even if user creation fails (user might already exist)
  }

  console.log('✅ Global setup complete');
}

export default globalSetup;