/**
 * Enterprise Compliance Manager
 * SOC 2 and GDPR Compliance Management
 */

import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/logger';
import {
  IComplianceManager,
  FrameworkControl,
  ComplianceAssessment,
  ControlAssessment,
  Evidence,
  EvidenceUpload,
  ReportScheduleConfig
} from './interfaces';
import {
  ComplianceFramework,
  ComplianceScore
} from './types';

/**
 * Enterprise Compliance Manager
 * Manages compliance frameworks, assessments, and evidence collection
 */
export class ComplianceManager implements IComplianceManager {
  private frameworkControls: Map<ComplianceFramework, FrameworkControl[]> = new Map();
  private assessments: Map<string, ComplianceAssessment> = new Map();
  private evidence: Map<string, Evidence[]> = new Map();
  private scheduledReports: Map<string, ReportScheduleConfig> = new Map();

  constructor() {
    this.initializeFrameworkControls();
  }

  /**
   * Get supported compliance frameworks
   */
  getSupportedFrameworks(): ComplianceFramework[] {
    return ['SOC2', 'GDPR', 'HIPAA', 'PCI_DSS', 'ISO27001', 'NIST', 'CIS'];
  }

  /**
   * Get framework controls
   */
  async getFrameworkControls(framework: ComplianceFramework): Promise<FrameworkControl[]> {
    const controls = this.frameworkControls.get(framework) || [];
    
    logger.info(`Retrieved ${controls.length} controls for framework ${framework}`);
    
    return controls;
  }

  /**
   * Assess compliance for organization and framework
   */
  async assessCompliance(organizationId: string, framework: ComplianceFramework): Promise<ComplianceAssessment> {
    try {
      const assessmentId = uuidv4();
      const now = new Date();
      
      const controls = await this.getFrameworkControls(framework);
      const controlAssessments: ControlAssessment[] = [];
      
      let totalScore = 0;
      let assessedControls = 0;

      // Assess each control
      for (const control of controls) {
        const assessment = await this.assessControl(control, organizationId);
        controlAssessments.push(assessment);
        
        if (assessment.status !== 'not_applicable') {
          totalScore += assessment.score;
          assessedControls++;
        }
      }

      const overallScore = assessedControls > 0 ? totalScore / assessedControls : 0;
      
      const assessment: ComplianceAssessment = {
        framework,
        organizationId,
        assessmentDate: now,
        assessedBy: 'system',
        overallScore,
        controlAssessments,
        recommendations: this.generateRecommendations(controlAssessments, framework),
        nextAssessmentDue: new Date(now.getTime() + (90 * 24 * 60 * 60 * 1000)) // 90 days
      };

      this.assessments.set(assessmentId, assessment);

      logger.info(`Completed compliance assessment for ${framework}`, {
        organizationId,
        framework,
        overallScore,
        controlsAssessed: assessedControls,
        totalControls: controls.length
      });

      return assessment;
    } catch (error) {
      logger.error(`Failed to assess compliance for ${framework}:`, error);
      throw error;
    }
  }

  /**
   * Get compliance score for organization
   */
  async getComplianceScore(organizationId: string, framework?: ComplianceFramework): Promise<ComplianceScore[]> {
    try {
      const frameworks = framework ? [framework] : this.getSupportedFrameworks();
      const scores: ComplianceScore[] = [];

      for (const fw of frameworks) {
        const assessment = await this.assessCompliance(organizationId, fw);
        const controls = await this.getFrameworkControls(fw);
        
        const implementedControls = assessment.controlAssessments.filter(c => c.status === 'compliant').length;
        const partialControls = assessment.controlAssessments.filter(c => c.status === 'partial').length;
        const notImplementedControls = assessment.controlAssessments.filter(c => c.status === 'non_compliant').length;

        scores.push({
          framework: fw,
          totalControls: controls.length,
          implementedControls,
          partialControls,
          notImplementedControls,
          score: assessment.overallScore,
          lastAssessed: assessment.assessmentDate
        });
      }

      logger.info(`Retrieved compliance scores for organization ${organizationId}`, {
        organizationId,
        frameworks: frameworks.length,
        averageScore: scores.reduce((sum, s) => sum + s.score, 0) / scores.length
      });

      return scores;
    } catch (error) {
      logger.error(`Failed to get compliance scores for organization ${organizationId}:`, error);
      throw error;
    }
  }

  /**
   * Upload evidence for control
   */
  async uploadEvidence(controlId: string, evidenceData: EvidenceUpload): Promise<Evidence> {
    try {
      const evidenceId = uuidv4();
      const now = new Date();

      const evidence: Evidence = {
        id: evidenceId,
        controlId,
        type: evidenceData.type,
        name: evidenceData.name,
        description: evidenceData.description,
        uploadedBy: 'system', // Would be actual user in real implementation
        uploadedAt: now,
        fileUrl: evidenceData.file ? `evidence/${evidenceId}` : undefined,
        metadata: evidenceData.metadata || {}
      };

      // Store evidence
      if (!this.evidence.has(controlId)) {
        this.evidence.set(controlId, []);
      }
      this.evidence.get(controlId)!.push(evidence);

      // In real implementation, would store file to secure storage
      if (evidenceData.file) {
        // Store file securely with encryption
        logger.debug(`Stored evidence file for control ${controlId}`, {
          evidenceId,
          fileSize: evidenceData.file.length
        });
      }

      logger.info(`Uploaded evidence for control ${controlId}`, {
        controlId,
        evidenceId,
        type: evidence.type,
        name: evidence.name
      });

      return evidence;
    } catch (error) {
      logger.error(`Failed to upload evidence for control ${controlId}:`, error);
      throw error;
    }
  }

  /**
   * Get evidence for control
   */
  async getEvidence(controlId: string): Promise<Evidence[]> {
    const evidence = this.evidence.get(controlId) || [];
    
    logger.debug(`Retrieved ${evidence.length} evidence items for control ${controlId}`);
    
    return evidence;
  }

  /**
   * Delete evidence
   */
  async deleteEvidence(evidenceId: string): Promise<void> {
    try {
      let found = false;
      
      for (const [controlId, evidenceList] of this.evidence.entries()) {
        const index = evidenceList.findIndex(e => e.id === evidenceId);
        if (index !== -1) {
          evidenceList.splice(index, 1);
          found = true;
          
          logger.info(`Deleted evidence ${evidenceId} for control ${controlId}`);
          break;
        }
      }

      if (!found) {
        throw new Error(`Evidence ${evidenceId} not found`);
      }
    } catch (error) {
      logger.error(`Failed to delete evidence ${evidenceId}:`, error);
      throw error;
    }
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(organizationId: string, framework: ComplianceFramework, format: 'pdf' | 'html' | 'json'): Promise<string> {
    try {
      const assessment = await this.assessCompliance(organizationId, framework);
      const controls = await this.getFrameworkControls(framework);

      const reportData = {
        organizationId,
        framework,
        generatedAt: new Date(),
        assessment,
        controls,
        summary: {
          totalControls: controls.length,
          compliantControls: assessment.controlAssessments.filter(c => c.status === 'compliant').length,
          nonCompliantControls: assessment.controlAssessments.filter(c => c.status === 'non_compliant').length,
          partialControls: assessment.controlAssessments.filter(c => c.status === 'partial').length,
          overallScore: assessment.overallScore
        }
      };

      switch (format) {
        case 'json':
          return JSON.stringify(reportData, null, 2);
        case 'html':
          return this.generateHTMLReport(reportData);
        case 'pdf':
          // In real implementation, would generate PDF
          return this.generateHTMLReport(reportData); // Placeholder
        default:
          throw new Error(`Unsupported report format: ${format}`);
      }
    } catch (error) {
      logger.error(`Failed to generate compliance report:`, error);
      throw error;
    }
  }

  /**
   * Schedule compliance report
   */
  async scheduleComplianceReport(config: ReportScheduleConfig): Promise<void> {
    try {
      const scheduleId = uuidv4();
      this.scheduledReports.set(scheduleId, config);

      // In real implementation, would set up cron job or similar
      logger.info(`Scheduled compliance report for ${config.framework}`, {
        organizationId: config.organizationId,
        framework: config.framework,
        frequency: config.frequency,
        recipients: config.recipients.length
      });
    } catch (error) {
      logger.error('Failed to schedule compliance report:', error);
      throw error;
    }
  }

  // Private helper methods

  private async assessControl(control: FrameworkControl, organizationId: string): Promise<ControlAssessment> {
    // In real implementation, this would check actual system state
    // For now, we'll simulate assessment based on control characteristics
    
    const evidence = await this.getEvidence(control.id);
    const hasEvidence = evidence.length > 0;
    
    let status: 'compliant' | 'non_compliant' | 'partial' | 'not_applicable';
    let score: number;
    let gaps: string[] = [];
    let recommendations: string[] = [];

    if (control.mandatory) {
      if (hasEvidence) {
        status = 'compliant';
        score = 100;
      } else {
        status = 'non_compliant';
        score = 0;
        gaps.push('No evidence provided for mandatory control');
        recommendations.push(`Provide evidence for ${control.name}`);
      }
    } else {
      // For non-mandatory controls, assume partial compliance
      status = 'partial';
      score = 60;
      recommendations.push(`Consider full implementation of ${control.name}`);
    }

    return {
      controlId: control.id,
      status,
      score,
      evidence: evidence.map(e => e.id),
      gaps,
      recommendations
    };
  }

  private generateRecommendations(controlAssessments: ControlAssessment[], framework: ComplianceFramework): string[] {
    const recommendations: string[] = [];
    
    const nonCompliantControls = controlAssessments.filter(c => c.status === 'non_compliant');
    const partialControls = controlAssessments.filter(c => c.status === 'partial');

    if (nonCompliantControls.length > 0) {
      recommendations.push(`Address ${nonCompliantControls.length} non-compliant controls immediately`);
    }

    if (partialControls.length > 0) {
      recommendations.push(`Improve implementation of ${partialControls.length} partially compliant controls`);
    }

    // Framework-specific recommendations
    if (framework === 'SOC2') {
      recommendations.push('Ensure all access controls are properly documented and tested');
      recommendations.push('Implement continuous monitoring for security controls');
    } else if (framework === 'GDPR') {
      recommendations.push('Conduct regular data protection impact assessments');
      recommendations.push('Ensure data subject rights procedures are well-documented');
    }

    return recommendations;
  }

  private generateHTMLReport(reportData: any): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Compliance Report - ${reportData.framework}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background-color: #f5f5f5; padding: 20px; border-radius: 5px; }
        .summary { margin: 20px 0; }
        .control { margin: 10px 0; padding: 10px; border-left: 3px solid #ccc; }
        .compliant { border-left-color: #28a745; }
        .non-compliant { border-left-color: #dc3545; }
        .partial { border-left-color: #ffc107; }
        .score { font-weight: bold; font-size: 1.2em; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Compliance Report: ${reportData.framework}</h1>
        <p>Organization: ${reportData.organizationId}</p>
        <p>Generated: ${reportData.generatedAt}</p>
        <div class="score">Overall Score: ${reportData.summary.overallScore.toFixed(1)}%</div>
    </div>
    
    <div class="summary">
        <h2>Summary</h2>
        <ul>
            <li>Total Controls: ${reportData.summary.totalControls}</li>
            <li>Compliant: ${reportData.summary.compliantControls}</li>
            <li>Non-Compliant: ${reportData.summary.nonCompliantControls}</li>
            <li>Partial: ${reportData.summary.partialControls}</li>
        </ul>
    </div>
    
    <div class="controls">
        <h2>Control Assessments</h2>
        ${reportData.assessment.controlAssessments.map((control: any) => `
            <div class="control ${control.status.replace('_', '-')}">
                <h3>${control.controlId}</h3>
                <p>Status: ${control.status}</p>
                <p>Score: ${control.score}%</p>
                ${control.gaps.length > 0 ? `<p>Gaps: ${control.gaps.join(', ')}</p>` : ''}
                ${control.recommendations.length > 0 ? `<p>Recommendations: ${control.recommendations.join(', ')}</p>` : ''}
            </div>
        `).join('')}
    </div>
    
    <div class="recommendations">
        <h2>Overall Recommendations</h2>
        <ul>
            ${reportData.assessment.recommendations.map((rec: string) => `<li>${rec}</li>`).join('')}
        </ul>
    </div>
</body>
</html>`;
  }

  private initializeFrameworkControls(): void {
    // Initialize SOC 2 Controls
    this.frameworkControls.set('SOC2', [
      {
        id: 'CC6.1',
        name: 'Logical and Physical Access Controls',
        description: 'The entity implements logical access security software, infrastructure, and architectures over protected information assets to protect them from security events to meet the entity\'s objectives.',
        category: 'Common Criteria',
        mandatory: true,
        implementationGuidance: 'Implement multi-factor authentication, role-based access controls, and regular access reviews.'
      },
      {
        id: 'CC6.2',
        name: 'Authentication and Authorization',
        description: 'Prior to issuing system credentials and granting system access, the entity registers and authorizes new internal and external users whose access is administered by the entity.',
        category: 'Common Criteria',
        mandatory: true,
        implementationGuidance: 'Establish user provisioning and deprovisioning procedures with proper authorization workflows.'
      },
      {
        id: 'CC6.3',
        name: 'System Access Removal',
        description: 'The entity removes system access when access is no longer required or appropriate.',
        category: 'Common Criteria',
        mandatory: true,
        implementationGuidance: 'Implement automated access removal processes and regular access reviews.'
      },
      {
        id: 'CC7.1',
        name: 'System Boundaries and Data Classification',
        description: 'To meet its objectives, the entity uses detection and monitoring procedures to identify (1) changes to configurations that result in the introduction of new vulnerabilities, and (2) susceptibilities to newly discovered vulnerabilities.',
        category: 'Common Criteria',
        mandatory: true,
        implementationGuidance: 'Implement vulnerability scanning and configuration management processes.'
      }
    ]);

    // Initialize GDPR Controls
    this.frameworkControls.set('GDPR', [
      {
        id: 'Art5',
        name: 'Principles of Processing Personal Data',
        description: 'Personal data shall be processed lawfully, fairly and in a transparent manner in relation to the data subject.',
        category: 'Principles',
        mandatory: true,
        implementationGuidance: 'Establish clear data processing purposes and legal bases for all personal data processing activities.'
      },
      {
        id: 'Art6',
        name: 'Lawfulness of Processing',
        description: 'Processing shall be lawful only if and to the extent that at least one of the legal bases applies.',
        category: 'Lawful Basis',
        mandatory: true,
        implementationGuidance: 'Document legal basis for each processing activity and ensure ongoing validity.'
      },
      {
        id: 'Art25',
        name: 'Data Protection by Design and by Default',
        description: 'The controller shall implement appropriate technical and organisational measures to ensure that, by default, only personal data which are necessary for each specific purpose of the processing are processed.',
        category: 'Technical Measures',
        mandatory: true,
        implementationGuidance: 'Implement privacy-enhancing technologies and data minimization principles in system design.'
      },
      {
        id: 'Art32',
        name: 'Security of Processing',
        description: 'The controller and the processor shall implement appropriate technical and organisational measures to ensure a level of security appropriate to the risk.',
        category: 'Security',
        mandatory: true,
        implementationGuidance: 'Implement encryption, access controls, and security monitoring appropriate to the risk level.'
      },
      {
        id: 'Art33',
        name: 'Notification of Personal Data Breach',
        description: 'In the case of a personal data breach, the controller shall without undue delay and, where feasible, not later than 72 hours after having become aware of it, notify the personal data breach to the supervisory authority.',
        category: 'Breach Management',
        mandatory: true,
        implementationGuidance: 'Establish incident response procedures with clear timelines for breach notification.'
      }
    ]);

    // Initialize other frameworks with basic controls
    this.initializeOtherFrameworks();

    logger.info('Initialized compliance framework controls', {
      frameworks: Array.from(this.frameworkControls.keys()),
      totalControls: Array.from(this.frameworkControls.values()).reduce((sum, controls) => sum + controls.length, 0)
    });
  }

  private initializeOtherFrameworks(): void {
    // HIPAA
    this.frameworkControls.set('HIPAA', [
      {
        id: '164.308',
        name: 'Administrative Safeguards',
        description: 'A covered entity must implement administrative safeguards.',
        category: 'Administrative',
        mandatory: true,
        implementationGuidance: 'Implement security officer designation and workforce training programs.'
      }
    ]);

    // PCI DSS
    this.frameworkControls.set('PCI_DSS', [
      {
        id: 'REQ1',
        name: 'Install and maintain a firewall configuration',
        description: 'Firewalls are devices that control computer traffic allowed between an entity\'s networks.',
        category: 'Network Security',
        mandatory: true,
        implementationGuidance: 'Implement and maintain firewall rules with regular reviews.'
      }
    ]);

    // ISO 27001
    this.frameworkControls.set('ISO27001', [
      {
        id: 'A.9.1.1',
        name: 'Access control policy',
        description: 'An access control policy should be established, documented and reviewed based on business and information security requirements.',
        category: 'Access Control',
        mandatory: true,
        implementationGuidance: 'Develop comprehensive access control policies aligned with business requirements.'
      }
    ]);

    // NIST
    this.frameworkControls.set('NIST', [
      {
        id: 'AC-1',
        name: 'Access Control Policy and Procedures',
        description: 'The organization develops, documents, and disseminates access control policy and procedures.',
        category: 'Access Control',
        mandatory: true,
        implementationGuidance: 'Establish formal access control policies and procedures with regular updates.'
      }
    ]);

    // CIS
    this.frameworkControls.set('CIS', [
      {
        id: 'CIS1',
        name: 'Inventory and Control of Hardware Assets',
        description: 'Actively manage all hardware devices on the network so that only authorized devices are given access.',
        category: 'Asset Management',
        mandatory: true,
        implementationGuidance: 'Maintain accurate inventory of all hardware assets with automated discovery tools.'
      }
    ]);
  }
}