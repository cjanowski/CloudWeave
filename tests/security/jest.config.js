module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  displayName: 'Security Tests',
  rootDir: '../../',
  testMatch: ['<rootDir>/tests/security/**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/security/jest-setup.ts'],
  testTimeout: 120000,
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts'
  ],
  coverageDirectory: '<rootDir>/coverage/security',
  verbose: true,
  forceExit: true,
  detectOpenHandles: true
};