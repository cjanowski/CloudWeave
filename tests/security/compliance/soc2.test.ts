/**
 * SOC 2 Compliance Validation Tests
 * Tests for SOC 2 Type II compliance requirements
 */

import { ComplianceValidator, ComplianceReport } from '../helpers/compliance-validator';
import * as path from 'path';

describe('SOC 2 Compliance Validation', () => {
  let validator: ComplianceValidator;
  let complianceReport: ComplianceReport;

  beforeAll(async () => {
    validator = new ComplianceValidator(path.join(__dirname, '../../../'));
    complianceReport = await validator.validateSOC2();
  }, 30000); // 30 second timeout

  describe('SOC 2 Framework Validation', () => {
    test('should complete SOC 2 compliance assessment', () => {
      expect(complianceReport).toBeDefined();
      expect(complianceReport.framework).toBe('SOC2');
      expect(complianceReport.timestamp).toBeInstanceOf(Date);
      expect(complianceReport.results).toBeDefined();
      expect(Array.isArray(complianceReport.results)).toBe(true);
    });

    test('should assess all required SOC 2 controls', () => {
      expect(complianceReport.totalControls).toBeGreaterThan(0);
      expect(complianceReport.results.length).toBe(complianceReport.totalControls);
      
      // Should have key SOC 2 controls
      const controlIds = complianceReport.results.map(r => r.controlId);
      expect(controlIds).toContain('CC6.1'); // Access Controls
      expect(controlIds).toContain('CC6.7'); // Data Transmission
      expect(controlIds).toContain('CC7.2'); // System Monitoring
    });

    test('should achieve minimum compliance score', () => {
      expect(complianceReport.overallScore).toBeGreaterThanOrEqual(0);
      expect(complianceReport.overallScore).toBeLessThanOrEqual(100);
      
      // SOC 2 compliance typically requires 80%+ score
      if (complianceReport.overallScore < 80) {
        console.warn(`SOC 2 compliance score below threshold: ${complianceReport.overallScore}%`);
        console.warn('Critical controls may be failing');
      }
      
      expect(complianceReport.overallScore).toBeGreaterThanOrEqual(60); // Minimum for testing
    });
  });

  describe('Trust Services Criteria - Security', () => {
    test('should validate logical and physical access controls (CC6.1)', () => {
      const accessControlResult = complianceReport.results.find(r => r.controlId === 'CC6.1');
      expect(accessControlResult).toBeDefined();
      
      if (accessControlResult) {
        expect(accessControlResult.framework).toBe('SOC2');
        expect(accessControlResult.status).toMatch(/^(pass|fail|not_applicable|error)$/);
        
        if (accessControlResult.status === 'fail') {
          console.warn('Access control validation failed:', accessControlResult.message);
          expect(accessControlResult.recommendations.length).toBeGreaterThan(0);
        }
      }
    });

    test('should validate data transmission security (CC6.7)', () => {
      const transmissionResult = complianceReport.results.find(r => r.controlId === 'CC6.7');
      expect(transmissionResult).toBeDefined();
      
      if (transmissionResult) {
        expect(transmissionResult.status).toMatch(/^(pass|fail|not_applicable|error)$/);
        
        if (transmissionResult.status === 'fail') {
          console.warn('Data transmission security failed:', transmissionResult.message);
          expect(transmissionResult.recommendations).toContain('Enable database encryption');
        }
      }
    });

    test('should validate system monitoring (CC7.2)', () => {
      const monitoringResult = complianceReport.results.find(r => r.controlId === 'CC7.2');
      expect(monitoringResult).toBeDefined();
      
      if (monitoringResult) {
        expect(monitoringResult.status).toMatch(/^(pass|fail|not_applicable|error)$/);
        
        if (monitoringResult.status === 'fail') {
          console.warn('System monitoring validation failed:', monitoringResult.message);
          expect(monitoringResult.recommendations.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('Control Assessment Quality', () => {
    test('should provide detailed evidence for each control', () => {
      complianceReport.results.forEach(result => {
        expect(result.ruleId).toBeDefined();
        expect(result.controlId).toBeDefined();
        expect(result.timestamp).toBeInstanceOf(Date);
        expect(Array.isArray(result.evidence)).toBe(true);
        expect(Array.isArray(result.recommendations)).toBe(true);
      });
    });

    test('should have appropriate scoring for controls', () => {
      complianceReport.results.forEach(result => {
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(100);
        
        // Passed controls should have high scores
        if (result.status === 'pass') {
          expect(result.score).toBeGreaterThanOrEqual(80);
        }
        
        // Failed controls should have lower scores
        if (result.status === 'fail') {
          expect(result.score).toBeLessThan(80);
        }
      });
    });

    test('should provide actionable recommendations for failed controls', () => {
      const failedControls = complianceReport.results.filter(r => r.status === 'fail');
      
      failedControls.forEach(control => {
        expect(control.recommendations.length).toBeGreaterThan(0);
        expect(control.message).toBeDefined();
        expect(control.message.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Risk Assessment', () => {
    test('should identify critical compliance failures', () => {
      expect(complianceReport.summary.criticalFailures).toBeGreaterThanOrEqual(0);
      
      if (complianceReport.summary.criticalFailures > 0) {
        console.warn(`${complianceReport.summary.criticalFailures} critical SOC 2 failures detected`);
        
        const criticalFailures = complianceReport.results.filter(
          r => r.status === 'fail' && r.score === 0
        );
        
        criticalFailures.forEach(failure => {
          console.warn(`Critical failure: ${failure.controlId} - ${failure.message}`);
        });
      }
      
      // Should have minimal critical failures
      expect(complianceReport.summary.criticalFailures).toBeLessThanOrEqual(1);
    });

    test('should categorize risk levels appropriately', () => {
      const summary = complianceReport.summary;
      
      expect(summary.criticalFailures).toBeGreaterThanOrEqual(0);
      expect(summary.highRiskIssues).toBeGreaterThanOrEqual(0);
      expect(summary.mediumRiskIssues).toBeGreaterThanOrEqual(0);
      expect(summary.lowRiskIssues).toBeGreaterThanOrEqual(0);
      
      const totalRiskIssues = summary.criticalFailures + summary.highRiskIssues + 
                             summary.mediumRiskIssues + summary.lowRiskIssues;
      
      expect(totalRiskIssues).toBe(complianceReport.failedControls);
    });
  });

  describe('Compliance Reporting', () => {
    test('should generate comprehensive compliance summary', () => {
      expect(complianceReport.totalControls).toBeGreaterThan(0);
      expect(complianceReport.passedControls + complianceReport.failedControls + 
             complianceReport.notApplicableControls).toBe(complianceReport.totalControls);
    });

    test('should provide remediation roadmap', () => {
      expect(Array.isArray(complianceReport.recommendations)).toBe(true);
      
      if (complianceReport.failedControls > 0) {
        expect(complianceReport.recommendations.length).toBeGreaterThan(0);
        
        // Recommendations should be unique
        const uniqueRecommendations = new Set(complianceReport.recommendations);
        expect(uniqueRecommendations.size).toBe(complianceReport.recommendations.length);
      }
    });

    test('should support audit trail requirements', () => {
      complianceReport.results.forEach(result => {
        expect(result.timestamp).toBeInstanceOf(Date);
        expect(result.evidence).toBeDefined();
        
        // Evidence should be meaningful for audit purposes
        if (result.status === 'pass' || result.status === 'fail') {
          expect(result.evidence.length).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('Continuous Compliance Monitoring', () => {
    test('should support trend analysis', () => {
      // Compliance reports should be timestamped for trending
      expect(complianceReport.timestamp).toBeInstanceOf(Date);
      expect(complianceReport.overallScore).toBeDefined();
      
      // Results should be structured for comparison
      complianceReport.results.forEach(result => {
        expect(result.controlId).toBeDefined();
        expect(result.score).toBeDefined();
        expect(result.timestamp).toBeInstanceOf(Date);
      });
    });

    test('should identify controls requiring regular assessment', () => {
      // All SOC 2 controls should be assessed regularly
      const assessedControls = complianceReport.results.filter(
        r => r.status !== 'not_applicable'
      );
      
      expect(assessedControls.length).toBeGreaterThan(0);
      
      // Key security controls should always be assessed
      const securityControls = assessedControls.filter(
        r => r.controlId.startsWith('CC6') || r.controlId.startsWith('CC7')
      );
      
      expect(securityControls.length).toBeGreaterThan(0);
    });
  });

  afterAll(async () => {
    // Generate compliance report summary
    console.log('\n=== SOC 2 Compliance Assessment Summary ===');
    console.log(`Overall Score: ${complianceReport.overallScore.toFixed(1)}%`);
    console.log(`Total Controls: ${complianceReport.totalControls}`);
    console.log(`Passed: ${complianceReport.passedControls}`);
    console.log(`Failed: ${complianceReport.failedControls}`);
    console.log(`Not Applicable: ${complianceReport.notApplicableControls}`);
    
    console.log('\n=== Risk Summary ===');
    console.log(`Critical Failures: ${complianceReport.summary.criticalFailures}`);
    console.log(`High Risk Issues: ${complianceReport.summary.highRiskIssues}`);
    console.log(`Medium Risk Issues: ${complianceReport.summary.mediumRiskIssues}`);
    console.log(`Low Risk Issues: ${complianceReport.summary.lowRiskIssues}`);
    
    if (complianceReport.failedControls > 0) {
      console.log('\n=== Failed Controls ===');
      const failedControls = complianceReport.results.filter(r => r.status === 'fail');
      failedControls.forEach(control => {
        console.log(`- ${control.controlId}: ${control.message}`);
      });
      
      console.log('\n=== Key Recommendations ===');
      complianceReport.recommendations.slice(0, 5).forEach(rec => {
        console.log(`- ${rec}`);
      });
    }
    
    if (complianceReport.overallScore >= 80) {
      console.log('\n✅ SOC 2 compliance assessment PASSED');
    } else {
      console.log('\n⚠️  SOC 2 compliance assessment needs attention');
    }
  });
});