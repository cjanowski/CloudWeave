import { apiService } from './apiService';

// Compliance data models and interfaces
export interface ComplianceFramework {
  id: string;
  name: string;
  framework: 'soc2' | 'iso27001' | 'gdpr' | 'hipaa' | 'pci_dss' | 'nist' | 'custom';
  type: string;
  description: string;
  version: string;
  enabled: boolean;
  configuration: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface ComplianceControl {
  id: string;
  frameworkId: string;
  controlId: string;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  status: 'compliant' | 'non_compliant' | 'pending' | 'passed' | 'failed' | 'warning' | 'skipped' | 'manual';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  automatedCheck: boolean;
  checkQuery?: string;
  evidence: string[];
  remediation: string;
  owner?: string;
  dueDate?: string;
  lastChecked?: string;
  nextCheck?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ComplianceStatistics {
  totalControls: number;
  compliantControls: number;
  nonCompliantControls: number;
  pendingControls: number;
  compliancePercentage: number;
  statusBreakdown: Record<string, number>;
  severityBreakdown: Record<string, number>;
}

export interface ComplianceAssessment {
  id: string;
  organizationId: string;
  frameworkId: string;
  userId: string;
  name: string;
  description: string;
  status: 'compliant' | 'non_compliant' | 'partial' | 'under_review' | 'not_applicable' | 'running';
  score: number;
  maxScore: number;
  startedAt?: string;
  completedAt?: string;
  dueDate?: string;
  summary?: AssessmentSummary;
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentSummary {
  totalControls: number;
  passedControls: number;
  failedControls: number;
  warningControls: number;
  manualControls: number;
  controlsBySeverity: Record<string, number>;
  controlsByCategory: Record<string, number>;
  controlsByStatus: Record<string, number>;
  complianceGaps: ComplianceGap[];
  recommendations: string[];
}

export interface ComplianceGap {
  id: string;
  assessmentId: string;
  controlId: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  status: string;
  impact: string;
  remediation: string;
  owner?: string;
  dueDate?: string;
  resolvedAt?: string;
  evidence: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ComplianceMetrics {
  overallScore: number;
  frameworkScores: Record<string, number>;
  totalControls: number;
  passedControls: number;
  failedControls: number;
  controlsBySeverity: Record<string, number>;
  controlsByStatus: Record<string, number>;
  frameworkCompliance: Record<string, string>;
  recentAssessments: number;
  pendingRemediation: number;
  overdueControls: number;
  complianceTrends: ComplianceTrendPoint[];
}

export interface ComplianceTrendPoint {
  date: string;
  overallScore: number;
  frameworkScores: Record<string, number>;
  controlsPassed: number;
  controlsFailed: number;
}

export interface ComplianceViolation {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  framework: string;
  controlId: string;
  status: 'open' | 'in_progress' | 'resolved';
  dueDate?: string;
  owner?: string;
  remediation: string;
  createdAt: string;
}

class ComplianceService {
  private static instance: ComplianceService;

  public static getInstance(): ComplianceService {
    if (!ComplianceService.instance) {
      ComplianceService.instance = new ComplianceService();
    }
    return ComplianceService.instance;
  }

  // Framework Management
  async getFrameworks(): Promise<ComplianceFramework[]> {
    try {
      const response = await apiService.get('/api/compliance/frameworks');
      return response.data.frameworks || [];
    } catch (error) {
      console.error('Failed to fetch compliance frameworks:', error);
      throw new Error('Failed to load compliance frameworks');
    }
  }

  async getFramework(frameworkId: string): Promise<ComplianceFramework> {
    try {
      const response = await apiService.get(`/api/compliance/frameworks/${frameworkId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch compliance framework:', error);
      throw new Error('Failed to load compliance framework');
    }
  }

  async createFramework(framework: Partial<ComplianceFramework>): Promise<ComplianceFramework> {
    try {
      const response = await apiService.post('/api/compliance/frameworks', framework);
      return response.data;
    } catch (error) {
      console.error('Failed to create compliance framework:', error);
      throw new Error('Failed to create compliance framework');
    }
  }

  // Control Management
  async getControlsByFramework(frameworkId: string): Promise<ComplianceControl[]> {
    try {
      const response = await apiService.get(`/api/compliance/frameworks/${frameworkId}/controls`);
      return response.data.controls || [];
    } catch (error) {
      console.error('Failed to fetch compliance controls:', error);
      throw new Error('Failed to load compliance controls');
    }
  }

  async getControlStatistics(frameworkId: string): Promise<ComplianceStatistics> {
    try {
      const response = await apiService.get(`/api/compliance/frameworks/${frameworkId}/statistics`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch control statistics:', error);
      throw new Error('Failed to load control statistics');
    }
  }

  async updateControl(controlId: string, updates: Partial<ComplianceControl>): Promise<ComplianceControl> {
    try {
      const response = await apiService.put(`/api/compliance/controls/${controlId}`, updates);
      return response.data;
    } catch (error) {
      console.error('Failed to update compliance control:', error);
      throw new Error('Failed to update compliance control');
    }
  }

  // Assessment Management
  async getAssessments(): Promise<ComplianceAssessment[]> {
    try {
      const response = await apiService.get('/api/compliance/assessments');
      return response.data.assessments || [];
    } catch (error) {
      console.error('Failed to fetch compliance assessments:', error);
      throw new Error('Failed to load compliance assessments');
    }
  }

  async getAssessment(assessmentId: string): Promise<ComplianceAssessment> {
    try {
      const response = await apiService.get(`/api/compliance/assessments/${assessmentId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch compliance assessment:', error);
      throw new Error('Failed to load compliance assessment');
    }
  }

  async createAssessment(assessment: Partial<ComplianceAssessment>): Promise<ComplianceAssessment> {
    try {
      const response = await apiService.post('/api/compliance/assessments', assessment);
      return response.data;
    } catch (error) {
      console.error('Failed to create compliance assessment:', error);
      throw new Error('Failed to create compliance assessment');
    }
  }

  async runAssessment(assessmentId: string): Promise<void> {
    try {
      await apiService.post(`/api/compliance/assessments/${assessmentId}/run`);
    } catch (error) {
      console.error('Failed to run compliance assessment:', error);
      throw new Error('Failed to run compliance assessment');
    }
  }

  // Dashboard Metrics
  async getComplianceMetrics(): Promise<ComplianceMetrics> {
    try {
      const response = await apiService.get('/api/compliance/metrics');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch compliance metrics:', error);
      throw new Error('Failed to load compliance metrics');
    }
  }

  async getComplianceViolations(): Promise<ComplianceViolation[]> {
    try {
      const response = await apiService.get('/api/compliance/violations');
      return response.data.violations || [];
    } catch (error) {
      console.error('Failed to fetch compliance violations:', error);
      throw new Error('Failed to load compliance violations');
    }
  }

  // Utility Methods
  getFrameworkDisplayName(framework: string): string {
    const frameworkNames: Record<string, string> = {
      'soc2': 'SOC 2',
      'iso27001': 'ISO 27001',
      'gdpr': 'GDPR',
      'hipaa': 'HIPAA',
      'pci_dss': 'PCI DSS',
      'nist': 'NIST',
      'custom': 'Custom'
    };
    return frameworkNames[framework] || framework.toUpperCase();
  }

  getSeverityColor(severity: string): string {
    const severityColors: Record<string, string> = {
      'critical': '#EF4444',
      'high': '#F97316',
      'medium': '#F59E0B',
      'low': '#10B981',
      'info': '#3B82F6'
    };
    return severityColors[severity] || '#6B7280';
  }

  getStatusColor(status: string): string {
    const statusColors: Record<string, string> = {
      'compliant': '#10B981',
      'passed': '#10B981',
      'non_compliant': '#EF4444',
      'failed': '#EF4444',
      'pending': '#F59E0B',
      'warning': '#F59E0B',
      'manual': '#8B5CF6',
      'skipped': '#6B7280'
    };
    return statusColors[status] || '#6B7280';
  }
}

export const complianceService = ComplianceService.getInstance();