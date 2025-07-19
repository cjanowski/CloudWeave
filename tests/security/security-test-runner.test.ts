/**
 * Security Test Runner
 * Orchestrates comprehensive security testing suite
 */

import { SecurityScanner } from './helpers/security-scanner';
import { ComplianceValidator } from './helpers/compliance-validator';
import { PenetrationTester } from './helpers/penetration-tester';
import { AuditVerifier } from './helpers/audit-verifier';
import * as path from 'path';
import * as fs from 'fs/promises';

describe('Comprehensive Security Testing Suite', () => {
  const projectRoot = path.join(__dirname, '../../');
  const outputDir = path.join(projectRoot, 'test-results', 'security');
  
  let securityResults: any = {};

  beforeAll(async () => {
    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });
  }, 10000);

  describe('Security Test Suite Execution', () => {
    test('should execute vulnerability scanning', async () => {
      const scanner = new SecurityScanner(projectRoot);
      
      console.log('🔍 Running vulnerability scans...');
      
      // Run all vulnerability scans
      const dependencyResults = await scanner.scanDependencies();
      const codeResults = await scanner.scanCode();
      const containerResults = await scanner.scanContainer();
      const infrastructureResults = await scanner.scanInfrastructure();
      
      securityResults.vulnerability = {
        dependency: dependencyResults,
        code: codeResults,
        container: containerResults,
        infrastructure: infrastructureResults
      };
      
      // Validate results
      expect(dependencyResults.scanType).toBe('dependency');
      expect(codeResults.scanType).toBe('code');
      expect(containerResults.scanType).toBe('container');
      expect(infrastructureResults.scanType).toBe('infrastructure');
      
      // Generate vulnerability report
      const allResults = [dependencyResults, codeResults, containerResults, infrastructureResults];
      const reportPath = await scanner.generateReport(allResults);
      
      console.log(`✅ Vulnerability scanning completed. Report: ${reportPath}`);
      
      // Check overall vulnerability status
      const totalCritical = allResults.reduce((sum, r) => sum + r.summary.critical, 0);
      const totalHigh = allResults.reduce((sum, r) => sum + r.summary.high, 0);
      
      expect(totalCritical).toBeLessThanOrEqual(2); // Allow some for testing
      expect(totalHigh).toBeLessThanOrEqual(10);
      
    }, 120000); // 2 minute timeout

    test('should execute compliance validation', async () => {
      const validator = new ComplianceValidator(projectRoot);
      
      console.log('📋 Running compliance validation...');
      
      // Run compliance tests for major frameworks
      const soc2Results = await validator.validateSOC2();
      const gdprResults = await validator.validateGDPR();
      const hipaaResults = await validator.validateHIPAA();
      const pciResults = await validator.validatePCIDSS();
      const isoResults = await validator.validateISO27001();
      
      securityResults.compliance = {
        soc2: soc2Results,
        gdpr: gdprResults,
        hipaa: hipaaResults,
        pci: pciResults,
        iso27001: isoResults
      };
      
      // Validate results
      expect(soc2Results.framework).toBe('SOC2');
      expect(gdprResults.framework).toBe('GDPR');
      expect(hipaaResults.framework).toBe('HIPAA');
      expect(pciResults.framework).toBe('PCI_DSS');
      expect(isoResults.framework).toBe('ISO27001');
      
      // Generate comprehensive compliance report
      const reportPath = await validator.generateComprehensiveReport();
      
      console.log(`✅ Compliance validation completed. Report: ${reportPath}`);
      
      // Check overall compliance status
      const avgScore = [soc2Results, gdprResults, hipaaResults, pciResults, isoResults]
        .reduce((sum, r) => sum + r.overallScore, 0) / 5;
      
      expect(avgScore).toBeGreaterThanOrEqual(60); // Minimum acceptable compliance
      
    }, 180000); // 3 minute timeout

    test('should execute penetration testing', async () => {
      const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
      const tester = new PenetrationTester(baseUrl);
      
      console.log('🎯 Running penetration tests...');
      
      // Run comprehensive penetration test suite
      const pentestResults = await tester.runFullSuite();
      
      securityResults.penetration = pentestResults;
      
      // Validate results
      expect(pentestResults.suiteName).toBe('Comprehensive Penetration Test');
      expect(pentestResults.totalTests).toBeGreaterThan(0);
      expect(pentestResults.results.length).toBe(pentestResults.totalTests);
      
      console.log(`✅ Penetration testing completed. Risk Score: ${pentestResults.riskScore}`);
      
      // Check security posture
      expect(pentestResults.summary.critical).toBe(0); // No critical vulnerabilities
      expect(pentestResults.summary.high).toBeLessThanOrEqual(2); // Minimal high-risk issues
      expect(pentestResults.riskScore).toBeLessThanOrEqual(50); // Acceptable risk level
      
    }, 120000); // 2 minute timeout

    test('should execute audit trail verification', async () => {
      const verifier = new AuditVerifier(projectRoot);
      
      console.log('📝 Running audit trail verification...');
      
      // Run comprehensive audit verification
      const auditResults = await verifier.runAuditVerification();
      
      securityResults.audit = auditResults;
      
      // Validate results
      expect(auditResults.totalTests).toBeGreaterThan(0);
      expect(auditResults.results.length).toBe(auditResults.totalTests);
      
      // Generate audit report
      const reportPath = await verifier.generateReport(auditResults);
      
      console.log(`✅ Audit verification completed. Report: ${reportPath}`);
      
      // Check audit compliance
      expect(auditResults.overallScore).toBeGreaterThanOrEqual(50); // Minimum audit score
      expect(auditResults.failedTests).toBeLessThanOrEqual(auditResults.totalTests * 0.3); // Max 30% failures
      
    }, 90000); // 1.5 minute timeout
  });

  describe('Security Posture Assessment', () => {
    test('should generate comprehensive security report', async () => {
      expect(securityResults.vulnerability).toBeDefined();
      expect(securityResults.compliance).toBeDefined();
      expect(securityResults.penetration).toBeDefined();
      expect(securityResults.audit).toBeDefined();
      
      // Generate comprehensive security report
      const comprehensiveReport = {
        timestamp: new Date().toISOString(),
        summary: {
          vulnerability: {
            totalScans: 4,
            criticalVulns: Object.values(securityResults.vulnerability).reduce((sum: number, r: any) => sum + r.summary.critical, 0),
            highVulns: Object.values(securityResults.vulnerability).reduce((sum: number, r: any) => sum + r.summary.high, 0),
            overallRisk: Object.values(securityResults.vulnerability).reduce((sum: number, r: any) => sum + r.riskScore, 0) / 4
          },
          compliance: {
            frameworks: 5,
            avgScore: Object.values(securityResults.compliance).reduce((sum: number, r: any) => sum + r.overallScore, 0) / 5,
            failedControls: Object.values(securityResults.compliance).reduce((sum: number, r: any) => sum + r.failedControls, 0)
          },
          penetration: {
            totalTests: securityResults.penetration.totalTests,
            vulnerableTests: securityResults.penetration.vulnerableTests,
            riskScore: securityResults.penetration.riskScore,
            criticalIssues: securityResults.penetration.summary.critical
          },
          audit: {
            totalTests: securityResults.audit.totalTests,
            passedTests: securityResults.audit.passedTests,
            overallScore: securityResults.audit.overallScore,
            complianceGaps: securityResults.audit.failedTests
          }
        },
        results: securityResults,
        recommendations: [
          ...getVulnerabilityRecommendations(),
          ...getComplianceRecommendations(),
          ...getPenetrationRecommendations(),
          ...getAuditRecommendations()
        ]
      };
      
      // Save comprehensive report
      const reportPath = path.join(outputDir, `comprehensive-security-report-${Date.now()}.json`);
      await fs.writeFile(reportPath, JSON.stringify(comprehensiveReport, null, 2));
      
      console.log(`📊 Comprehensive security report generated: ${reportPath}`);
      
      // Validate overall security posture
      expect(comprehensiveReport.summary.vulnerability.criticalVulns).toBeLessThanOrEqual(3);
      expect(comprehensiveReport.summary.compliance.avgScore).toBeGreaterThanOrEqual(60);
      expect(comprehensiveReport.summary.penetration.criticalIssues).toBe(0);
      expect(comprehensiveReport.summary.audit.overallScore).toBeGreaterThanOrEqual(50);
    });

    test('should meet security compliance requirements', () => {
      // Overall security requirements for production readiness
      const vulnSummary = securityResults.vulnerability;
      const complianceSummary = securityResults.compliance;
      const pentestSummary = securityResults.penetration;
      const auditSummary = securityResults.audit;
      
      // Critical security requirements
      expect(pentestSummary.summary.critical).toBe(0); // No critical penetration test failures
      expect(complianceSummary.soc2.summary.criticalFailures).toBeLessThanOrEqual(1); // SOC 2 compliance
      expect(complianceSummary.gdpr.summary.criticalFailures).toBeLessThanOrEqual(1); // GDPR compliance
      
      // Risk thresholds
      expect(pentestSummary.riskScore).toBeLessThanOrEqual(50); // Acceptable penetration test risk
      expect(auditSummary.overallScore).toBeGreaterThanOrEqual(50); // Minimum audit compliance
      
      // Vulnerability thresholds
      const totalCriticalVulns = Object.values(vulnSummary).reduce((sum: number, r: any) => sum + r.summary.critical, 0);
      expect(totalCriticalVulns).toBeLessThanOrEqual(3); // Maximum critical vulnerabilities
    });
  });

  // Helper functions for generating recommendations
  function getVulnerabilityRecommendations(): string[] {
    const recommendations: string[] = [];
    
    Object.entries(securityResults.vulnerability).forEach(([scanType, results]: [string, any]) => {
      if (results.summary.critical > 0) {
        recommendations.push(`Address ${results.summary.critical} critical vulnerabilities in ${scanType} scan`);
      }
      if (results.summary.high > 3) {
        recommendations.push(`Reduce high-severity vulnerabilities in ${scanType} scan`);
      }
    });
    
    return recommendations;
  }

  function getComplianceRecommendations(): string[] {
    const recommendations: string[] = [];
    
    Object.entries(securityResults.compliance).forEach(([framework, results]: [string, any]) => {
      if (results.overallScore < 80) {
        recommendations.push(`Improve ${framework.toUpperCase()} compliance score (currently ${results.overallScore.toFixed(1)}%)`);
      }
      if (results.summary.criticalFailures > 0) {
        recommendations.push(`Address ${results.summary.criticalFailures} critical ${framework.toUpperCase()} compliance failures`);
      }
    });
    
    return recommendations;
  }

  function getPenetrationRecommendations(): string[] {
    const recommendations: string[] = [];
    const results = securityResults.penetration;
    
    if (results.summary.critical > 0) {
      recommendations.push(`URGENT: Address ${results.summary.critical} critical security vulnerabilities`);
    }
    if (results.summary.high > 2) {
      recommendations.push(`Address ${results.summary.high} high-severity security issues`);
    }
    if (results.riskScore > 40) {
      recommendations.push(`Reduce overall security risk score (currently ${results.riskScore})`);
    }
    
    return recommendations;
  }

  function getAuditRecommendations(): string[] {
    const recommendations: string[] = [];
    const results = securityResults.audit;
    
    if (results.overallScore < 70) {
      recommendations.push(`Improve audit trail compliance (currently ${results.overallScore.toFixed(1)}%)`);
    }
    if (results.failedTests > results.totalTests * 0.3) {
      recommendations.push(`Address ${results.failedTests} failed audit tests`);
    }
    
    return recommendations;
  }

  afterAll(async () => {
    // Generate final security assessment summary
    console.log('\n' + '='.repeat(60));
    console.log('🛡️  COMPREHENSIVE SECURITY ASSESSMENT SUMMARY');
    console.log('='.repeat(60));
    
    if (securityResults.vulnerability) {
      console.log('\n📊 VULNERABILITY ASSESSMENT:');
      Object.entries(securityResults.vulnerability).forEach(([type, results]: [string, any]) => {
        console.log(`  ${type.toUpperCase()}: ${results.summary.total} total, ${results.summary.critical} critical, ${results.summary.high} high`);
      });
    }
    
    if (securityResults.compliance) {
      console.log('\n📋 COMPLIANCE ASSESSMENT:');
      Object.entries(securityResults.compliance).forEach(([framework, results]: [string, any]) => {
        console.log(`  ${framework.toUpperCase()}: ${results.overallScore.toFixed(1)}% (${results.passedControls}/${results.totalControls} controls passed)`);
      });
    }
    
    if (securityResults.penetration) {
      console.log('\n🎯 PENETRATION TESTING:');
      console.log(`  Risk Score: ${securityResults.penetration.riskScore}`);
      console.log(`  Vulnerabilities: ${securityResults.penetration.vulnerableTests}/${securityResults.penetration.totalTests} tests`);
      console.log(`  Critical Issues: ${securityResults.penetration.summary.critical}`);
    }
    
    if (securityResults.audit) {
      console.log('\n📝 AUDIT VERIFICATION:');
      console.log(`  Overall Score: ${securityResults.audit.overallScore.toFixed(1)}%`);
      console.log(`  Passed Tests: ${securityResults.audit.passedTests}/${securityResults.audit.totalTests}`);
    }
    
    // Overall security status
    const overallSecure = 
      (securityResults.penetration?.summary.critical || 0) === 0 &&
      (securityResults.compliance?.soc2?.overallScore || 0) >= 70 &&
      (securityResults.audit?.overallScore || 0) >= 60;
    
    console.log('\n' + '='.repeat(60));
    if (overallSecure) {
      console.log('✅ OVERALL SECURITY STATUS: ACCEPTABLE');
    } else {
      console.log('⚠️  OVERALL SECURITY STATUS: NEEDS ATTENTION');
    }
    console.log('='.repeat(60));
  });
});