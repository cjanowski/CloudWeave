/**
 * Security Incident Service Tests
 * Enterprise-grade incident response testing
 */

import { SecurityIncidentService, SecurityIncident, IncidentType, IncidentStatus } from './SecurityIncidentService';
import { SecurityViolation, SecuritySeverity } from './types';

describe('SecurityIncidentService', () => {
  let incidentService: SecurityIncidentService;

  beforeEach(() => {
    incidentService = new SecurityIncidentService();
  });

  describe('Incident Creation', () => {
    it('should create incident from security violation', async () => {
      const violation: SecurityViolation = {
        id: 'violation-1',
        policyId: 'policy-1',
        ruleId: 'rule-1',
        severity: 'high',
        title: 'Unauthorized Access Attempt',
        description: 'Multiple failed login attempts detected',
        category: 'Access Control',
        resourceId: 'server-1',
        resourceType: 'server',
        organizationId: 'org-1',
        projectId: 'project-1',
        environmentId: 'prod',
        status: 'open',
        detectedAt: new Date(),
        detectedBy: 'system',
        detectionMethod: 'automated',
        evidence: [],
        remediationActions: [],
        riskScore: 75,
        businessImpact: 'high',
        complianceImpact: [{
          framework: 'SOC2',
          controlId: 'CC6.1',
          impactLevel: 'high',
          description: 'Access control violation',
          requiresReporting: true
        }],
        auditTrail: []
      };

      const incident = await incidentService.createIncidentFromViolation(violation);

      expect(incident.id).toBeDefined();
      expect(incident.title).toContain('Unauthorized Access Attempt');
      expect(incident.type).toBe('unauthorized_access');
      expect(incident.severity).toBe('high');
      expect(incident.status).toBe('open');
      expect(incident.sourceType).toBe('policy_engine');
      expect(incident.sourceId).toBe('policy-1');
      expect(incident.relatedViolations).toContain('violation-1');
      expect(incident.organizationId).toBe('org-1');
      expect(incident.impactLevel).toBe('high');
      expect(incident.escalationLevel).toBe('high');
      expect(incident.reportingRequired).toBe(true);
      expect(incident.auditTrail).toHaveLength(1);
      expect(incident.auditTrail[0].action).toBe('created');
    });

    it('should create manual incident', async () => {
      const incidentData = {
        title: 'Suspicious Network Activity',
        description: 'Unusual network traffic patterns detected',
        type: 'suspicious_activity' as IncidentType,
        severity: 'medium' as SecuritySeverity,
        status: 'open' as IncidentStatus,
        sourceType: 'manual' as const,
        relatedViolations: [],
        relatedEvents: [],
        organizationId: 'org-1',
        projectId: 'project-1',
        detectedAt: new Date(),
        reportedAt: new Date(),
        impactLevel: 'medium' as const,
        affectedSystems: ['network-1'],
        affectedUsers: 0,
        dataExposure: false,
        remediationActions: [],
        escalationLevel: 'medium' as const,
        notifications: [],
        complianceImpact: [],
        reportingRequired: false,
        createdBy: 'security-analyst',
        updatedBy: 'security-analyst',
        evidence: []
      };

      const incident = await incidentService.createIncident(incidentData);

      expect(incident.id).toBeDefined();
      expect(incident.title).toBe('Suspicious Network Activity');
      expect(incident.type).toBe('suspicious_activity');
      expect(incident.severity).toBe('medium');
      expect(incident.sourceType).toBe('manual');
      expect(incident.createdBy).toBe('security-analyst');
      expect(incident.auditTrail).toHaveLength(1);
    });
  });

  describe('Incident Management', () => {
    let testIncident: SecurityIncident;

    beforeEach(async () => {
      const incidentData = {
        title: 'Test Security Incident',
        description: 'Test incident for management operations',
        type: 'policy_violation' as IncidentType,
        severity: 'medium' as SecuritySeverity,
        status: 'open' as IncidentStatus,
        sourceType: 'manual' as const,
        relatedViolations: [],
        relatedEvents: [],
        organizationId: 'org-1',
        detectedAt: new Date(),
        reportedAt: new Date(),
        impactLevel: 'medium' as const,
        affectedSystems: [],
        affectedUsers: 0,
        dataExposure: false,
        remediationActions: [],
        escalationLevel: 'medium' as const,
        notifications: [],
        complianceImpact: [],
        reportingRequired: false,
        createdBy: 'test-user',
        updatedBy: 'test-user',
        evidence: []
      };

      testIncident = await incidentService.createIncident(incidentData);
    });

    it('should get incident by ID', async () => {
      const retrieved = await incidentService.getIncident(testIncident.id);

      expect(retrieved).not.toBeNull();
      expect(retrieved!.id).toBe(testIncident.id);
      expect(retrieved!.title).toBe('Test Security Incident');
    });

    it('should return null for non-existent incident', async () => {
      const incident = await incidentService.getIncident('non-existent-id');
      expect(incident).toBeNull();
    });

    it('should get incidents with filtering', async () => {
      // Create additional incidents
      await incidentService.createIncident({
        title: 'Critical Incident',
        description: 'Critical security incident',
        type: 'data_breach' as IncidentType,
        severity: 'critical' as SecuritySeverity,
        status: 'investigating' as IncidentStatus,
        sourceType: 'manual' as const,
        relatedViolations: [],
        relatedEvents: [],
        organizationId: 'org-1',
        detectedAt: new Date(),
        reportedAt: new Date(),
        impactLevel: 'critical' as const,
        affectedSystems: [],
        affectedUsers: 100,
        dataExposure: true,
        remediationActions: [],
        escalationLevel: 'critical' as const,
        notifications: [],
        complianceImpact: [],
        reportingRequired: true,
        createdBy: 'test-user',
        updatedBy: 'test-user',
        evidence: []
      });

      // Test filtering by severity
      const criticalIncidents = await incidentService.getIncidents('org-1', { severity: 'critical' });
      expect(criticalIncidents).toHaveLength(1);
      expect(criticalIncidents[0].severity).toBe('critical');

      // Test filtering by status
      const openIncidents = await incidentService.getIncidents('org-1', { status: 'open' });
      expect(openIncidents).toHaveLength(1);
      expect(openIncidents[0].status).toBe('open');

      // Test filtering by type
      const dataBreaches = await incidentService.getIncidents('org-1', { type: 'data_breach' });
      expect(dataBreaches).toHaveLength(1);
      expect(dataBreaches[0].type).toBe('data_breach');
    });

    it('should update incident', async () => {
      const updates = {
        status: 'investigating' as IncidentStatus,
        description: 'Updated description'
      };

      const updatedIncident = await incidentService.updateIncident(testIncident.id, updates, 'analyst');

      expect(updatedIncident.status).toBe('investigating');
      expect(updatedIncident.description).toBe('Updated description');
      expect(updatedIncident.updatedBy).toBe('analyst');
      expect(updatedIncident.auditTrail).toHaveLength(2);
      expect(updatedIncident.auditTrail[1].action).toBe('updated');
      expect(updatedIncident.acknowledgedAt).toBeInstanceOf(Date);
    });

    it('should assign incident', async () => {
      await incidentService.assignIncident(testIncident.id, 'security-analyst', 'manager');

      const updated = await incidentService.getIncident(testIncident.id);
      expect(updated!.assignedTo).toBe('security-analyst');
      expect(updated!.assignedAt).toBeInstanceOf(Date);
      expect(updated!.auditTrail).toHaveLength(2);
      expect(updated!.auditTrail[1].action).toBe('assigned');
      expect(updated!.notifications.length).toBeGreaterThan(0);
    });

    it('should escalate incident', async () => {
      await incidentService.escalateIncident(testIncident.id, 'critical', 'manager', 'Potential data breach');

      const updated = await incidentService.getIncident(testIncident.id);
      expect(updated!.escalationLevel).toBe('critical');
      expect(updated!.escalatedTo).toBeDefined();
      expect(updated!.escalatedTo!.length).toBeGreaterThan(0);
      expect(updated!.auditTrail).toHaveLength(2);
      expect(updated!.auditTrail[1].action).toBe('escalated');
      expect(updated!.notifications.length).toBeGreaterThan(0);
    });

    it('should add evidence to incident', async () => {
      const evidence = {
        type: 'log' as const,
        name: 'Security Log Extract',
        description: 'Relevant log entries showing the security event',
        collectedBy: 'analyst',
        metadata: { source: 'security-server', lines: 150 }
      };

      const addedEvidence = await incidentService.addEvidence(testIncident.id, evidence);

      expect(addedEvidence.id).toBeDefined();
      expect(addedEvidence.type).toBe('log');
      expect(addedEvidence.name).toBe('Security Log Extract');
      expect(addedEvidence.collectedAt).toBeInstanceOf(Date);

      const updated = await incidentService.getIncident(testIncident.id);
      expect(updated!.evidence).toHaveLength(1);
      expect(updated!.evidence[0].id).toBe(addedEvidence.id);
    });
  });

  describe('Automated Remediation', () => {
    let testIncident: SecurityIncident;

    beforeEach(async () => {
      const violation: SecurityViolation = {
        id: 'violation-auto',
        policyId: 'policy-auto',
        ruleId: 'rule-auto',
        severity: 'high',
        title: 'Malware Detection',
        description: 'Malware detected on server',
        category: 'Security',
        resourceId: 'server-compromised',
        resourceType: 'server',
        organizationId: 'org-1',
        status: 'open',
        detectedAt: new Date(),
        detectedBy: 'system',
        detectionMethod: 'automated',
        evidence: [],
        remediationActions: [],
        riskScore: 90,
        businessImpact: 'high',
        complianceImpact: [],
        auditTrail: []
      };

      testIncident = await incidentService.createIncidentFromViolation(violation);
    });

    it('should execute automated remediation', async () => {
      // The incident should have triggered automated remediation during creation
      // Check if remediation actions were added
      const incident = await incidentService.getIncident(testIncident.id);
      
      expect(incident).not.toBeNull();
      // The default remediation rules should have been triggered
      expect(incident!.remediationActions.length).toBeGreaterThan(0);
      
      // Check if automated remediation was executed
      const automatedActions = incident!.remediationActions.filter(a => a.type === 'automated');
      expect(automatedActions.length).toBeGreaterThan(0);
    });

    it('should handle remediation execution results', async () => {
      const incident = await incidentService.getIncident(testIncident.id);
      const automatedActions = incident!.remediationActions.filter(a => a.type === 'automated');
      
      if (automatedActions.length > 0) {
        const action = automatedActions[0];
        expect(action.status).toMatch(/completed|failed/);
        expect(action.executedBy).toBe('system');
        expect(action.startedAt).toBeInstanceOf(Date);
        expect(action.completedAt).toBeInstanceOf(Date);
      }
    });
  });

  describe('Incident Statistics', () => {
    beforeEach(async () => {
      // Create test incidents with different characteristics
      const incidents = [
        {
          title: 'Critical Data Breach',
          type: 'data_breach' as IncidentType,
          severity: 'critical' as SecuritySeverity,
          status: 'resolved' as IncidentStatus,
          detectedAt: new Date(Date.now() - 86400000), // 1 day ago
          resolvedAt: new Date(Date.now() - 43200000)  // 12 hours ago
        },
        {
          title: 'High Severity Access Violation',
          type: 'unauthorized_access' as IncidentType,
          severity: 'high' as SecuritySeverity,
          status: 'investigating' as IncidentStatus,
          detectedAt: new Date(Date.now() - 3600000) // 1 hour ago
        },
        {
          title: 'Medium Policy Violation',
          type: 'policy_violation' as IncidentType,
          severity: 'medium' as SecuritySeverity,
          status: 'open' as IncidentStatus,
          detectedAt: new Date(Date.now() - 1800000) // 30 minutes ago
        }
      ];

      for (const incidentData of incidents) {
        await incidentService.createIncident({
          ...incidentData,
          description: `Test incident: ${incidentData.title}`,
          sourceType: 'manual' as const,
          relatedViolations: [],
          relatedEvents: [],
          organizationId: 'org-1',
          reportedAt: incidentData.detectedAt,
          impactLevel: incidentData.severity === 'critical' ? 'critical' : 'medium',
          affectedSystems: [],
          affectedUsers: 0,
          dataExposure: incidentData.type === 'data_breach',
          remediationActions: [],
          escalationLevel: incidentData.severity === 'critical' ? 'critical' : 'medium',
          notifications: [],
          complianceImpact: [],
          reportingRequired: false,
          createdBy: 'test-user',
          updatedBy: 'test-user',
          evidence: []
        });
      }
    });

    it('should calculate incident statistics', () => {
      const stats = incidentService.getIncidentStatistics('org-1');

      expect(stats.totalIncidents).toBe(3);
      expect(stats.openIncidents).toBe(2); // open + investigating
      expect(stats.incidentsBySeverity.critical).toBe(1);
      expect(stats.incidentsBySeverity.high).toBe(1);
      expect(stats.incidentsBySeverity.medium).toBe(1);
      expect(stats.incidentsByType.data_breach).toBe(1);
      expect(stats.incidentsByType.unauthorized_access).toBe(1);
      expect(stats.incidentsByType.policy_violation).toBe(1);
      expect(stats.incidentsByStatus.resolved).toBe(1);
      expect(stats.incidentsByStatus.investigating).toBe(1);
      expect(stats.incidentsByStatus.open).toBe(1);
      expect(stats.averageResolutionTime).toBeGreaterThan(0);
      expect(stats.escalatedIncidents).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle incident not found errors', async () => {
      await expect(incidentService.updateIncident('non-existent', {}, 'user')).rejects.toThrow('not found');
      await expect(incidentService.assignIncident('non-existent', 'user', 'manager')).rejects.toThrow('not found');
      await expect(incidentService.escalateIncident('non-existent', 'high', 'user', 'reason')).rejects.toThrow('not found');
      await expect(incidentService.addEvidence('non-existent', {
        type: 'log',
        name: 'test',
        description: 'test',
        collectedBy: 'user',
        metadata: {}
      })).rejects.toThrow('not found');
    });

    it('should handle automated remediation errors gracefully', async () => {
      // Create incident that might trigger remediation
      const violation: SecurityViolation = {
        id: 'violation-error',
        policyId: 'policy-error',
        ruleId: 'rule-error',
        severity: 'low', // Low severity to avoid triggering default rules
        title: 'Test Violation',
        description: 'Test violation for error handling',
        category: 'Test',
        organizationId: 'org-1',
        status: 'open',
        detectedAt: new Date(),
        detectedBy: 'system',
        detectionMethod: 'automated',
        evidence: [],
        remediationActions: [],
        riskScore: 30,
        businessImpact: 'low',
        complianceImpact: [],
        auditTrail: []
      };

      // Should not throw error even if remediation fails
      const incident = await incidentService.createIncidentFromViolation(violation);
      expect(incident).toBeDefined();
      expect(incident.id).toBeDefined();
    });
  });
});