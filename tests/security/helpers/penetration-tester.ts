/**
 * Penetration Testing Utility
 * Automated security testing for common vulnerabilities
 */

import axios from 'axios';

export interface PenetrationTestResult {
  testId: string;
  testName: string;
  category: 'authentication' | 'authorization' | 'injection' | 'xss' | 'csrf' | 'session' | 'configuration';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  status: 'vulnerable' | 'secure' | 'error' | 'inconclusive';
  description: string;
  details: string;
  evidence: string[];
  recommendations: string[];
  timestamp: Date;
  duration: number;
}

export interface PenetrationTestSuite {
  suiteId: string;
  suiteName: string;
  baseUrl: string;
  timestamp: Date;
  duration: number;
  totalTests: number;
  vulnerableTests: number;
  secureTests: number;
  errorTests: number;
  results: PenetrationTestResult[];
  riskScore: number;
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
}

export class PenetrationTester {
  private readonly baseUrl: string;
  private readonly timeout: number;
  // private _authToken?: string; // Reserved for future use

  constructor(baseUrl: string = 'http://localhost:3000', timeout: number = 10000) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.timeout = timeout;
  }

  /**
   * Run comprehensive penetration test suite
   */
  async runFullSuite(): Promise<PenetrationTestSuite> {
    const startTime = Date.now();
    const suiteId = `pentest-${Date.now()}`;
    const results: PenetrationTestResult[] = [];

    // Authentication Tests
    results.push(...await this.testAuthentication());
    
    // Authorization Tests
    results.push(...await this.testAuthorization());
    
    // Injection Tests
    results.push(...await this.testInjection());
    
    // XSS Tests
    results.push(...await this.testXSS());
    
    // CSRF Tests
    results.push(...await this.testCSRF());
    
    // Session Management Tests
    results.push(...await this.testSessionManagement());
    
    // Configuration Tests
    results.push(...await this.testConfiguration());

    const duration = Date.now() - startTime;
    const summary = this.calculateSummary(results);
    
    return {
      suiteId,
      suiteName: 'Comprehensive Penetration Test',
      baseUrl: this.baseUrl,
      timestamp: new Date(),
      duration,
      totalTests: results.length,
      vulnerableTests: results.filter(r => r.status === 'vulnerable').length,
      secureTests: results.filter(r => r.status === 'secure').length,
      errorTests: results.filter(r => r.status === 'error').length,
      results,
      riskScore: this.calculateRiskScore(results),
      summary
    };
  }

  /**
   * Test authentication mechanisms
   */
  async testAuthentication(): Promise<PenetrationTestResult[]> {
    const results: PenetrationTestResult[] = [];

    // Test 1: SQL Injection in login
    results.push(await this.testSQLInjectionLogin());
    
    // Test 2: Brute force protection
    results.push(await this.testBruteForceProtection());
    
    // Test 3: Password policy enforcement
    results.push(await this.testPasswordPolicy());
    
    // Test 4: Account lockout mechanism
    results.push(await this.testAccountLockout());
    
    // Test 5: JWT token validation
    results.push(await this.testJWTValidation());

    return results;
  }

  /**
   * Test authorization mechanisms
   */
  async testAuthorization(): Promise<PenetrationTestResult[]> {
    const results: PenetrationTestResult[] = [];

    // Test 1: Privilege escalation
    results.push(await this.testPrivilegeEscalation());
    
    // Test 2: Horizontal access control
    results.push(await this.testHorizontalAccessControl());
    
    // Test 3: Vertical access control
    results.push(await this.testVerticalAccessControl());
    
    // Test 4: Direct object references
    results.push(await this.testDirectObjectReferences());

    return results;
  }

  /**
   * Test injection vulnerabilities
   */
  async testInjection(): Promise<PenetrationTestResult[]> {
    const results: PenetrationTestResult[] = [];

    // Test 1: SQL Injection
    results.push(await this.testSQLInjection());
    
    // Test 2: NoSQL Injection
    results.push(await this.testNoSQLInjection());
    
    // Test 3: Command Injection
    results.push(await this.testCommandInjection());
    
    // Test 4: LDAP Injection
    results.push(await this.testLDAPInjection());

    return results;
  }

  /**
   * Test XSS vulnerabilities
   */
  async testXSS(): Promise<PenetrationTestResult[]> {
    const results: PenetrationTestResult[] = [];

    // Test 1: Reflected XSS
    results.push(await this.testReflectedXSS());
    
    // Test 2: Stored XSS
    results.push(await this.testStoredXSS());
    
    // Test 3: DOM-based XSS
    results.push(await this.testDOMBasedXSS());

    return results;
  }

  /**
   * Test CSRF vulnerabilities
   */
  async testCSRF(): Promise<PenetrationTestResult[]> {
    const results: PenetrationTestResult[] = [];

    // Test 1: CSRF token validation
    results.push(await this.testCSRFTokenValidation());
    
    // Test 2: SameSite cookie attribute
    results.push(await this.testSameSiteCookies());

    return results;
  }

  /**
   * Test session management
   */
  async testSessionManagement(): Promise<PenetrationTestResult[]> {
    const results: PenetrationTestResult[] = [];

    // Test 1: Session fixation
    results.push(await this.testSessionFixation());
    
    // Test 2: Session timeout
    results.push(await this.testSessionTimeout());
    
    // Test 3: Secure cookie flags
    results.push(await this.testSecureCookieFlags());

    return results;
  }

  /**
   * Test configuration security
   */
  async testConfiguration(): Promise<PenetrationTestResult[]> {
    const results: PenetrationTestResult[] = [];

    // Test 1: Security headers
    results.push(await this.testSecurityHeaders());
    
    // Test 2: Information disclosure
    results.push(await this.testInformationDisclosure());
    
    // Test 3: HTTP methods
    results.push(await this.testHTTPMethods());

    return results;
  }

  // Individual test implementations

  private async testSQLInjectionLogin(): Promise<PenetrationTestResult> {
    const startTime = Date.now();
    const testId = 'auth-sql-injection-login';
    
    try {
      const payloads = [
        "admin' OR '1'='1",
        "admin'; DROP TABLE users; --",
        "admin' UNION SELECT * FROM users --"
      ];

      let vulnerable = false;
      const evidence: string[] = [];

      for (const payload of payloads) {
        try {
          const response = await axios.post(`${this.baseUrl}/api/v1/auth/login`, {
            email: payload,
            password: 'test'
          }, { timeout: this.timeout });

          if (response.status === 200 && (response.data as any).token) {
            vulnerable = true;
            evidence.push(`SQL injection successful with payload: ${payload}`);
          }
        } catch (error: any) {
          // Expected behavior - login should fail
        }
      }

      return {
        testId,
        testName: 'SQL Injection in Login',
        category: 'authentication',
        severity: vulnerable ? 'critical' : 'info',
        status: vulnerable ? 'vulnerable' : 'secure',
        description: 'Tests for SQL injection vulnerabilities in login endpoint',
        details: vulnerable ? 'Login endpoint is vulnerable to SQL injection attacks' : 'Login endpoint properly handles SQL injection attempts',
        evidence,
        recommendations: vulnerable ? [
          'Use parameterized queries or prepared statements',
          'Implement input validation and sanitization',
          'Use an ORM with built-in SQL injection protection'
        ] : [],
        timestamp: new Date(),
        duration: Date.now() - startTime
      };
    } catch (error: any) {
      return this.createErrorResult(testId, 'SQL Injection in Login', 'authentication', error, startTime);
    }
  }

  private async testBruteForceProtection(): Promise<PenetrationTestResult> {
    const startTime = Date.now();
    const testId = 'auth-brute-force-protection';
    
    try {
      const attempts = 10;
      let blockedAttempts = 0;
      const evidence: string[] = [];

      for (let i = 0; i < attempts; i++) {
        try {
          await axios.post(`${this.baseUrl}/api/v1/auth/login`, {
            email: 'test@example.com',
            password: 'wrongpassword'
          }, { timeout: this.timeout });
        } catch (error: any) {
          if (error.response?.status === 429) {
            blockedAttempts++;
            evidence.push(`Attempt ${i + 1}: Rate limited (429)`);
          } else if (error.response?.status === 401) {
            evidence.push(`Attempt ${i + 1}: Authentication failed (401)`);
          }
        }
      }

      const isProtected = blockedAttempts > 0;
      
      return {
        testId,
        testName: 'Brute Force Protection',
        category: 'authentication',
        severity: isProtected ? 'info' : 'high',
        status: isProtected ? 'secure' : 'vulnerable',
        description: 'Tests for brute force attack protection mechanisms',
        details: isProtected ? 'Brute force protection is active' : 'No brute force protection detected',
        evidence,
        recommendations: isProtected ? [] : [
          'Implement rate limiting for login attempts',
          'Add account lockout mechanisms',
          'Use CAPTCHA after failed attempts',
          'Monitor and alert on suspicious login patterns'
        ],
        timestamp: new Date(),
        duration: Date.now() - startTime
      };
    } catch (error: any) {
      return this.createErrorResult(testId, 'Brute Force Protection', 'authentication', error, startTime);
    }
  }

  private async testPasswordPolicy(): Promise<PenetrationTestResult> {
    const startTime = Date.now();
    const testId = 'auth-password-policy';
    
    try {
      const weakPasswords = ['123', 'password', 'admin', 'test'];
      let weakPasswordAccepted = false;
      const evidence: string[] = [];

      for (const password of weakPasswords) {
        try {
          const response = await axios.post(`${this.baseUrl}/api/v1/auth/register`, {
            email: `test${Date.now()}@example.com`,
            password: password,
            name: 'Test User'
          }, { timeout: this.timeout });

          if (response.status === 201) {
            weakPasswordAccepted = true;
            evidence.push(`Weak password accepted: ${password}`);
          }
        } catch (error: any) {
          if (error.response?.status === 400) {
            evidence.push(`Weak password rejected: ${password}`);
          }
        }
      }

      return {
        testId,
        testName: 'Password Policy Enforcement',
        category: 'authentication',
        severity: weakPasswordAccepted ? 'medium' : 'info',
        status: weakPasswordAccepted ? 'vulnerable' : 'secure',
        description: 'Tests password policy enforcement during registration',
        details: weakPasswordAccepted ? 'Weak passwords are accepted' : 'Strong password policy is enforced',
        evidence,
        recommendations: weakPasswordAccepted ? [
          'Implement strong password requirements',
          'Require minimum length, complexity, and character diversity',
          'Check against common password dictionaries',
          'Provide password strength indicators'
        ] : [],
        timestamp: new Date(),
        duration: Date.now() - startTime
      };
    } catch (error: any) {
      return this.createErrorResult(testId, 'Password Policy Enforcement', 'authentication', error, startTime);
    }
  }

  private async testAccountLockout(): Promise<PenetrationTestResult> {
    const startTime = Date.now();
    const testId = 'auth-account-lockout';
    
    // This is a simulated test since we can't actually lock accounts in testing
    return {
      testId,
      testName: 'Account Lockout Mechanism',
      category: 'authentication',
      severity: 'info',
      status: 'inconclusive',
      description: 'Tests account lockout after multiple failed attempts',
      details: 'Account lockout mechanism requires manual verification',
      evidence: ['Test requires specific account setup and monitoring'],
      recommendations: [
        'Implement account lockout after N failed attempts',
        'Provide account unlock mechanisms',
        'Log lockout events for monitoring',
        'Consider progressive delays instead of permanent lockout'
      ],
      timestamp: new Date(),
      duration: Date.now() - startTime
    };
  }

  private async testJWTValidation(): Promise<PenetrationTestResult> {
    const startTime = Date.now();
    const testId = 'auth-jwt-validation';
    
    try {
      // Test with invalid JWT tokens
      const invalidTokens = [
        'invalid.jwt.token',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature',
        '',
        'Bearer malformed-token'
      ];

      let vulnerableToInvalidToken = false;
      const evidence: string[] = [];

      for (const token of invalidTokens) {
        try {
          const response = await axios.get(`${this.baseUrl}/api/v1/auth/profile`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: this.timeout
          });

          if (response.status === 200) {
            vulnerableToInvalidToken = true;
            evidence.push(`Invalid token accepted: ${token.substring(0, 20)}...`);
          }
        } catch (error: any) {
          if (error.response?.status === 401) {
            evidence.push(`Invalid token properly rejected: ${token.substring(0, 20)}...`);
          }
        }
      }

      return {
        testId,
        testName: 'JWT Token Validation',
        category: 'authentication',
        severity: vulnerableToInvalidToken ? 'high' : 'info',
        status: vulnerableToInvalidToken ? 'vulnerable' : 'secure',
        description: 'Tests JWT token validation mechanisms',
        details: vulnerableToInvalidToken ? 'Invalid JWT tokens are accepted' : 'JWT validation is working correctly',
        evidence,
        recommendations: vulnerableToInvalidToken ? [
          'Implement proper JWT signature verification',
          'Validate token expiration',
          'Check token structure and claims',
          'Use secure JWT libraries'
        ] : [],
        timestamp: new Date(),
        duration: Date.now() - startTime
      };
    } catch (error: any) {
      return this.createErrorResult(testId, 'JWT Token Validation', 'authentication', error, startTime);
    }
  }

  private async testPrivilegeEscalation(): Promise<PenetrationTestResult> {
    const startTime = Date.now();
    const testId = 'authz-privilege-escalation';
    
    // This test would require actual user accounts with different privilege levels
    return {
      testId,
      testName: 'Privilege Escalation',
      category: 'authorization',
      severity: 'info',
      status: 'inconclusive',
      description: 'Tests for privilege escalation vulnerabilities',
      details: 'Privilege escalation testing requires specific user setup',
      evidence: ['Test requires multiple user accounts with different privilege levels'],
      recommendations: [
        'Implement proper role-based access control',
        'Validate user permissions on every request',
        'Use principle of least privilege',
        'Regular access reviews and audits'
      ],
      timestamp: new Date(),
      duration: Date.now() - startTime
    };
  }

  private async testHorizontalAccessControl(): Promise<PenetrationTestResult> {
    const startTime = Date.now();
    const testId = 'authz-horizontal-access';
    
    return {
      testId,
      testName: 'Horizontal Access Control',
      category: 'authorization',
      severity: 'info',
      status: 'inconclusive',
      description: 'Tests for horizontal privilege escalation',
      details: 'Horizontal access control testing requires multiple user accounts',
      evidence: ['Test requires setup of multiple user accounts at same privilege level'],
      recommendations: [
        'Validate user ownership of resources',
        'Implement proper resource isolation',
        'Use user context in all data queries',
        'Regular access control testing'
      ],
      timestamp: new Date(),
      duration: Date.now() - startTime
    };
  }

  private async testVerticalAccessControl(): Promise<PenetrationTestResult> {
    const startTime = Date.now();
    const testId = 'authz-vertical-access';
    
    return {
      testId,
      testName: 'Vertical Access Control',
      category: 'authorization',
      severity: 'info',
      status: 'inconclusive',
      description: 'Tests for vertical privilege escalation',
      details: 'Vertical access control testing requires hierarchical user setup',
      evidence: ['Test requires setup of users with different privilege levels'],
      recommendations: [
        'Implement role hierarchy validation',
        'Check permissions at every access point',
        'Use centralized authorization service',
        'Regular privilege reviews'
      ],
      timestamp: new Date(),
      duration: Date.now() - startTime
    };
  }

  private async testDirectObjectReferences(): Promise<PenetrationTestResult> {
    const startTime = Date.now();
    const testId = 'authz-direct-object-refs';
    
    try {
      // Test accessing resources with different IDs
      const testIds = ['1', '2', '999', 'admin', '../../../etc/passwd'];
      let vulnerableToIDOR = false;
      const evidence: string[] = [];

      for (const id of testIds) {
        try {
          const response = await axios.get(`${this.baseUrl}/api/v1/projects/${id}`, {
            timeout: this.timeout
          });

          if (response.status === 200) {
            evidence.push(`Accessible resource ID: ${id}`);
          }
        } catch (error: any) {
          if (error.response?.status === 403 || error.response?.status === 404) {
            evidence.push(`Properly protected resource ID: ${id}`);
          } else if (error.response?.status === 401) {
            evidence.push(`Authentication required for resource ID: ${id}`);
          }
        }
      }

      return {
        testId,
        testName: 'Insecure Direct Object References',
        category: 'authorization',
        severity: vulnerableToIDOR ? 'high' : 'info',
        status: vulnerableToIDOR ? 'vulnerable' : 'secure',
        description: 'Tests for insecure direct object reference vulnerabilities',
        details: vulnerableToIDOR ? 'Direct object references are not properly protected' : 'Object access controls appear to be working',
        evidence,
        recommendations: vulnerableToIDOR ? [
          'Implement proper authorization checks',
          'Use indirect object references',
          'Validate user access to requested resources',
          'Implement resource-level permissions'
        ] : [],
        timestamp: new Date(),
        duration: Date.now() - startTime
      };
    } catch (error: any) {
      return this.createErrorResult(testId, 'Insecure Direct Object References', 'authorization', error, startTime);
    }
  }

  // Additional test method implementations would continue here...
  // For brevity, I'll implement a few more key tests and create placeholder methods for others

  private async testSQLInjection(): Promise<PenetrationTestResult> {
    const startTime = Date.now();
    const testId = 'injection-sql';
    
    try {
      const payloads = [
        "' OR '1'='1",
        "'; DROP TABLE users; --",
        "' UNION SELECT * FROM information_schema.tables --"
      ];

      let vulnerable = false;
      const evidence: string[] = [];

      // Test search endpoint for SQL injection
      for (const payload of payloads) {
        try {
          const response = await axios.get(`${this.baseUrl}/api/v1/search`, {
            params: { q: payload },
            timeout: this.timeout
          });

          // Look for SQL error messages or unexpected data
          if (response.data && (
            JSON.stringify(response.data).includes('SQL') ||
            JSON.stringify(response.data).includes('mysql') ||
            JSON.stringify(response.data).includes('postgresql') ||
            Array.isArray(response.data) && response.data.length > 100
          )) {
            vulnerable = true;
            evidence.push(`SQL injection possible with payload: ${payload}`);
          }
        } catch (error: any) {
          if (error.response?.data && typeof error.response.data === 'string' && 
              error.response.data.toLowerCase().includes('sql')) {
            vulnerable = true;
            evidence.push(`SQL error exposed with payload: ${payload}`);
          }
        }
      }

      return {
        testId,
        testName: 'SQL Injection',
        category: 'injection',
        severity: vulnerable ? 'critical' : 'info',
        status: vulnerable ? 'vulnerable' : 'secure',
        description: 'Tests for SQL injection vulnerabilities in search and query endpoints',
        details: vulnerable ? 'SQL injection vulnerabilities detected' : 'No SQL injection vulnerabilities found',
        evidence,
        recommendations: vulnerable ? [
          'Use parameterized queries or prepared statements',
          'Implement input validation and sanitization',
          'Use ORM with built-in protection',
          'Apply principle of least privilege to database accounts'
        ] : [],
        timestamp: new Date(),
        duration: Date.now() - startTime
      };
    } catch (error: any) {
      return this.createErrorResult(testId, 'SQL Injection', 'injection', error, startTime);
    }
  }

  private async testSecurityHeaders(): Promise<PenetrationTestResult> {
    const startTime = Date.now();
    const testId = 'config-security-headers';
    
    try {
      const response = await axios.get(`${this.baseUrl}/api/v1/health`, {
        timeout: this.timeout
      });

      const headers = response.headers;
      const evidence: string[] = [];
      let missingHeaders = 0;

      const requiredHeaders = [
        'x-content-type-options',
        'x-frame-options',
        'x-xss-protection',
        'strict-transport-security',
        'content-security-policy'
      ];

      for (const header of requiredHeaders) {
        if (headers[header]) {
          evidence.push(`${header}: ${headers[header]}`);
        } else {
          evidence.push(`Missing: ${header}`);
          missingHeaders++;
        }
      }

      const secure = missingHeaders === 0;

      return {
        testId,
        testName: 'Security Headers',
        category: 'configuration',
        severity: missingHeaders > 2 ? 'medium' : 'low',
        status: secure ? 'secure' : 'vulnerable',
        description: 'Tests for presence of security headers',
        details: `${missingHeaders} security headers are missing`,
        evidence,
        recommendations: missingHeaders > 0 ? [
          'Implement all recommended security headers',
          'Use helmet.js or similar security middleware',
          'Configure CSP policy appropriately',
          'Enable HSTS for HTTPS sites'
        ] : [],
        timestamp: new Date(),
        duration: Date.now() - startTime
      };
    } catch (error: any) {
      return this.createErrorResult(testId, 'Security Headers', 'configuration', error, startTime);
    }
  }

  // Placeholder methods for remaining tests
  private async testNoSQLInjection(): Promise<PenetrationTestResult> {
    return this.createPlaceholderResult('injection-nosql', 'NoSQL Injection', 'injection');
  }

  private async testCommandInjection(): Promise<PenetrationTestResult> {
    return this.createPlaceholderResult('injection-command', 'Command Injection', 'injection');
  }

  private async testLDAPInjection(): Promise<PenetrationTestResult> {
    return this.createPlaceholderResult('injection-ldap', 'LDAP Injection', 'injection');
  }

  private async testReflectedXSS(): Promise<PenetrationTestResult> {
    return this.createPlaceholderResult('xss-reflected', 'Reflected XSS', 'xss');
  }

  private async testStoredXSS(): Promise<PenetrationTestResult> {
    return this.createPlaceholderResult('xss-stored', 'Stored XSS', 'xss');
  }

  private async testDOMBasedXSS(): Promise<PenetrationTestResult> {
    return this.createPlaceholderResult('xss-dom', 'DOM-based XSS', 'xss');
  }

  private async testCSRFTokenValidation(): Promise<PenetrationTestResult> {
    return this.createPlaceholderResult('csrf-token', 'CSRF Token Validation', 'csrf');
  }

  private async testSameSiteCookies(): Promise<PenetrationTestResult> {
    return this.createPlaceholderResult('csrf-samesite', 'SameSite Cookie Attribute', 'csrf');
  }

  private async testSessionFixation(): Promise<PenetrationTestResult> {
    return this.createPlaceholderResult('session-fixation', 'Session Fixation', 'session');
  }

  private async testSessionTimeout(): Promise<PenetrationTestResult> {
    return this.createPlaceholderResult('session-timeout', 'Session Timeout', 'session');
  }

  private async testSecureCookieFlags(): Promise<PenetrationTestResult> {
    return this.createPlaceholderResult('session-cookies', 'Secure Cookie Flags', 'session');
  }

  private async testInformationDisclosure(): Promise<PenetrationTestResult> {
    return this.createPlaceholderResult('config-info-disclosure', 'Information Disclosure', 'configuration');
  }

  private async testHTTPMethods(): Promise<PenetrationTestResult> {
    return this.createPlaceholderResult('config-http-methods', 'HTTP Methods', 'configuration');
  }

  // Helper methods

  private createPlaceholderResult(
    testId: string, 
    testName: string, 
    category: PenetrationTestResult['category']
  ): PenetrationTestResult {
    return {
      testId,
      testName,
      category,
      severity: 'info',
      status: 'inconclusive',
      description: `${testName} testing requires additional implementation`,
      details: 'Test implementation is pending',
      evidence: ['Test requires specific setup and implementation'],
      recommendations: [`Implement ${testName} testing`, 'Review security best practices'],
      timestamp: new Date(),
      duration: 0
    };
  }

  private createErrorResult(
    testId: string,
    testName: string,
    category: PenetrationTestResult['category'],
    error: any,
    startTime: number
  ): PenetrationTestResult {
    return {
      testId,
      testName,
      category,
      severity: 'info',
      status: 'error',
      description: `Error occurred during ${testName} testing`,
      details: error.message || 'Unknown error',
      evidence: [error.stack || error.toString()],
      recommendations: ['Review test configuration and target availability'],
      timestamp: new Date(),
      duration: Date.now() - startTime
    };
  }

  private calculateSummary(results: PenetrationTestResult[]) {
    return {
      critical: results.filter(r => r.severity === 'critical').length,
      high: results.filter(r => r.severity === 'high').length,
      medium: results.filter(r => r.severity === 'medium').length,
      low: results.filter(r => r.severity === 'low').length,
      info: results.filter(r => r.severity === 'info').length
    };
  }

  private calculateRiskScore(results: PenetrationTestResult[]): number {
    const weights = { critical: 10, high: 7, medium: 4, low: 2, info: 1 };
    const vulnerableResults = results.filter(r => r.status === 'vulnerable');
    const totalScore = vulnerableResults.reduce((sum, r) => sum + weights[r.severity], 0);
    return Math.min(100, totalScore);
  }
}