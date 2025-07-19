import { FullConfig } from '@playwright/test';
import { execSync } from 'child_process';
import fs from 'fs';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global teardown for E2E tests...');

  // Clean up test database
  try {
    console.log('🗑️ Cleaning up test database...');
    if (process.env.NODE_ENV === 'test') {
      execSync('npm run db:rollback', { stdio: 'inherit' });
    }
    console.log('✅ Test database cleanup complete');
  } catch (error) {
    console.error('❌ Failed to cleanup test database:', error);
  }

  // Remove authentication state file
  try {
    if (fs.existsSync('tests/e2e/auth-state.json')) {
      fs.unlinkSync('tests/e2e/auth-state.json');
      console.log('✅ Authentication state cleaned up');
    }
  } catch (error) {
    console.error('❌ Failed to cleanup auth state:', error);
  }

  console.log('✅ Global teardown complete');
}

export default globalTeardown;