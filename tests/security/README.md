# Security and Compliance Testing Suite

This directory contains comprehensive security and compliance testing for the CloudWeave platform, covering automated vulnerability scanning, compliance validation, penetration testing scenarios, and audit trail testing.

## 📋 Test Structure

```
tests/security/
├── vulnerability/          # Automated security vulnerability scanning
│   ├── dependency-scan.test.ts
│   ├── code-scan.test.ts
│   ├── container-scan.test.ts
│   └── infrastructure-scan.test.ts
├── compliance/            # Regulatory compliance validation tests
│   ├── soc2.test.ts
│   ├── gdpr.test.ts
│   ├── hipaa.test.ts
│   ├── pci-dss.test.ts
│   └── iso27001.test.ts
├── penetration/           # Penetration testing scenarios
│   ├── authentication.test.ts
│   ├── authorization.test.ts
│   ├── injection.test.ts
│   ├── xss.test.ts
│   └── csrf.test.ts
├── audit/                 # Audit trail and logging tests
│   ├── audit-trail.test.ts
│   ├── log-integrity.test.ts
│   ├── retention.test.ts
│   └── compliance-logging.test.ts
├── fixtures/              # Test data and configurations
│   ├── security-policies.json
│   ├── compliance-rules.json
│   └── test-vulnerabilities.json
├── helpers/               # Security testing utilities
│   ├── security-scanner.ts
│   ├── compliance-validator.ts
│   ├── penetration-tester.ts
│   └── audit-verifier.ts
└── README.md             # This file
```

## 🔒 Security Testing Categories

### 1. Vulnerability Scanning
- **Dependency Scanning**: Check for known vulnerabilities in dependencies
- **Code Scanning**: Static analysis for security issues
- **Container Scanning**: Docker image vulnerability assessment
- **Infrastructure Scanning**: Cloud resource security validation

### 2. Compliance Testing
- **SOC 2**: System and Organization Controls compliance
- **GDPR**: General Data Protection Regulation compliance
- **HIPAA**: Health Insurance Portability and Accountability Act
- **PCI DSS**: Payment Card Industry Data Security Standard
- **ISO 27001**: Information Security Management System

### 3. Penetration Testing
- **Authentication Bypass**: Test authentication mechanisms
- **Authorization Flaws**: Test access control vulnerabilities
- **Injection Attacks**: SQL, NoSQL, Command injection testing
- **Cross-Site Scripting**: XSS vulnerability testing
- **Cross-Site Request Forgery**: CSRF protection testing

### 4. Audit Trail Testing
- **Event Logging**: Verify all security events are logged
- **Log Integrity**: Ensure logs cannot be tampered with
- **Retention Policies**: Test log retention and disposal
- **Compliance Logging**: Verify regulatory logging requirements

## 🚀 Running Security Tests

```bash
# Run all security tests
npm run test:security

# Run specific test categories
npm run test:security:vulnerability
npm run test:security:compliance
npm run test:security:penetration
npm run test:security:audit

# Run with detailed reporting
npm run test:security:report
```

## 📊 Security Test Reports

Security tests generate detailed reports including:
- Vulnerability assessment results
- Compliance validation status
- Penetration test findings
- Audit trail verification
- Risk assessment and recommendations

Reports are generated in multiple formats:
- HTML dashboard
- JSON for CI/CD integration
- PDF for compliance documentation
- CSV for data analysis