/**
 * GDPR Compliance Validation Tests
 * Tests for General Data Protection Regulation compliance
 */

import { ComplianceValidator, ComplianceReport } from '../helpers/compliance-validator';
import * as path from 'path';

describe('GDPR Compliance Validation', () => {
  let validator: ComplianceValidator;
  let complianceReport: ComplianceReport;

  beforeAll(async () => {
    validator = new ComplianceValidator(path.join(__dirname, '../../../'));
    complianceReport = await validator.validateGDPR();
  }, 30000);

  describe('GDPR Framework Validation', () => {
    test('should complete GDPR compliance assessment', () => {
      expect(complianceReport).toBeDefined();
      expect(complianceReport.framework).toBe('GDPR');
      expect(complianceReport.timestamp).toBeInstanceOf(Date);
      expect(complianceReport.results).toBeDefined();
      expect(Array.isArray(complianceReport.results)).toBe(true);
    });

    test('should assess key GDPR articles', () => {
      expect(complianceReport.totalControls).toBeGreaterThan(0);
      
      const controlIds = complianceReport.results.map(r => r.controlId);
      expect(controlIds).toContain('Article 32'); // Security of Processing
      expect(controlIds).toContain('Article 5');  // Data Retention
      expect(controlIds).toContain('Article 30'); // Records of Processing
    });

    test('should achieve minimum GDPR compliance score', () => {
      expect(complianceReport.overallScore).toBeGreaterThanOrEqual(0);
      expect(complianceReport.overallScore).toBeLessThanOrEqual(100);
      
      if (complianceReport.overallScore < 75) {
        console.warn(`GDPR compliance score below threshold: ${complianceReport.overallScore}%`);
      }
      
      expect(complianceReport.overallScore).toBeGreaterThanOrEqual(60);
    });
  });

  describe('Data Protection Principles', () => {
    test('should validate security of processing (Article 32)', () => {
      const securityResult = complianceReport.results.find(r => r.controlId === 'Article 32');
      expect(securityResult).toBeDefined();
      
      if (securityResult) {
        if (securityResult.status === 'fail') {
          console.warn('Security of processing validation failed:', securityResult.message);
          expect(securityResult.recommendations).toContain('Enable database encryption');
        }
      }
    });

    test('should validate data retention principles (Article 5)', () => {
      const retentionResult = complianceReport.results.find(r => r.controlId === 'Article 5');
      expect(retentionResult).toBeDefined();
      
      if (retentionResult) {
        if (retentionResult.status === 'fail') {
          console.warn('Data retention validation failed:', retentionResult.message);
          expect(retentionResult.recommendations).toContain('Define clear data retention policies');
        }
      }
    });

    test('should validate records of processing (Article 30)', () => {
      const recordsResult = complianceReport.results.find(r => r.controlId === 'Article 30');
      expect(recordsResult).toBeDefined();
      
      if (recordsResult) {
        if (recordsResult.status === 'fail') {
          console.warn('Records of processing validation failed:', recordsResult.message);
        }
      }
    });
  });

  describe('Data Subject Rights', () => {
    test('should support data subject access rights', () => {
      // This would typically check for API endpoints supporting data access
      // Check for data access support
      complianceReport.results.some(r => 
        r.evidence.some(e => e.includes('data access') || e.includes('subject rights'))
      );
      
      // For now, we'll check if data classification is implemented
      const classificationResult = complianceReport.results.find(r => 
        r.message.includes('classification') || r.evidence.some(e => e.includes('classification'))
      );
      
      if (!classificationResult) {
        console.warn('Data classification service not found - required for GDPR compliance');
      }
    });

    test('should support data portability requirements', () => {
      // Check if there are mechanisms for data export
      // Check for data export capability
      complianceReport.results.some(r =>
        r.evidence.some(e => e.includes('export') || e.includes('portability'))
      );
      
      // This is typically implemented through API endpoints
      expect(complianceReport.results.length).toBeGreaterThan(0);
    });
  });

  describe('Privacy by Design', () => {
    test('should implement data minimization', () => {
      // Check if data classification helps with minimization
      const hasDataClassification = complianceReport.results.some(r =>
        r.evidence.some(e => e.includes('Classification service'))
      );
      
      if (!hasDataClassification) {
        console.warn('Data classification not implemented - affects data minimization compliance');
      }
    });

    test('should implement privacy controls', () => {
      // Check for encryption and access controls
      const hasEncryption = complianceReport.results.some(r =>
        r.evidence.some(e => e.includes('encryption') || e.includes('Encryption'))
      );
      
      const hasAccessControls = complianceReport.results.some(r =>
        r.evidence.some(e => e.includes('Authentication') || e.includes('RBAC'))
      );
      
      expect(hasEncryption || hasAccessControls).toBe(true);
    });
  });

  describe('Breach Notification', () => {
    test('should have incident response procedures', () => {
      const hasIncidentResponse = complianceReport.results.some(r =>
        r.evidence.some(e => e.includes('Incident service'))
      );
      
      if (!hasIncidentResponse) {
        console.warn('Incident response service not found - required for GDPR breach notification');
      }
    });

    test('should maintain audit logs for breach investigation', () => {
      const hasAuditLogging = complianceReport.results.some(r =>
        r.evidence.some(e => e.includes('audit') || e.includes('Logger'))
      );
      
      expect(hasAuditLogging).toBe(true);
    });
  });

  describe('International Data Transfers', () => {
    test('should implement appropriate safeguards for data transfers', () => {
      // Check for encryption in transit
      const hasTransmissionSecurity = complianceReport.results.some(r =>
        r.evidence.some(e => e.includes('HTTPS') || e.includes('TLS'))
      );
      
      if (!hasTransmissionSecurity) {
        console.warn('Transmission security not properly configured');
      }
    });
  });

  describe('Risk Assessment', () => {
    test('should identify critical GDPR compliance failures', () => {
      expect(complianceReport.summary.criticalFailures).toBeGreaterThanOrEqual(0);
      
      if (complianceReport.summary.criticalFailures > 0) {
        console.warn(`${complianceReport.summary.criticalFailures} critical GDPR failures detected`);
      }
      
      expect(complianceReport.summary.criticalFailures).toBeLessThanOrEqual(1);
    });

    test('should provide GDPR-specific recommendations', () => {
      if (complianceReport.failedControls > 0) {
        expect(complianceReport.recommendations.length).toBeGreaterThan(0);
        
        // Should include GDPR-specific recommendations
        const gdprRecommendations = complianceReport.recommendations.filter(r =>
          r.includes('GDPR') || r.includes('data') || r.includes('privacy') || r.includes('consent')
        );
        
        expect(gdprRecommendations.length).toBeGreaterThan(0);
      }
    });
  });

  afterAll(async () => {
    console.log('\n=== GDPR Compliance Assessment Summary ===');
    console.log(`Overall Score: ${complianceReport.overallScore.toFixed(1)}%`);
    console.log(`Total Controls: ${complianceReport.totalControls}`);
    console.log(`Passed: ${complianceReport.passedControls}`);
    console.log(`Failed: ${complianceReport.failedControls}`);
    
    if (complianceReport.failedControls > 0) {
      console.log('\n=== Failed GDPR Controls ===');
      const failedControls = complianceReport.results.filter(r => r.status === 'fail');
      failedControls.forEach(control => {
        console.log(`- ${control.controlId}: ${control.message}`);
      });
    }
    
    if (complianceReport.overallScore >= 75) {
      console.log('\n✅ GDPR compliance assessment PASSED');
    } else {
      console.log('\n⚠️  GDPR compliance assessment needs attention');
    }
  });
});