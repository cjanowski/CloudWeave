import { apiService } from './apiService';

export interface VulnerabilitySeverity {
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
}

export interface VulnerabilityStatus {
  open: number;
  in_progress: number;
  resolved: number;
  ignored: number;
}

export interface SecurityScan {
  id: string;
  name: string;
  type: 'infrastructure' | 'application' | 'container' | 'network' | 'compliance';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  targetType: string;
  targetName: string;
  progress: number;
  startedAt?: string;
  completedAt?: string;
  duration?: number;
  errorMessage?: string;
  summary?: {
    totalVulnerabilities: number;
    vulnerabilitiesBySeverity: VulnerabilitySeverity;
    resourcesScanned: number;
    highestSeverity: string;
    complianceScore?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Vulnerability {
  id: string;
  scanId: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  status: 'open' | 'in_progress' | 'resolved' | 'ignored';
  cveId?: string;
  cvssScore?: number;
  resourceType: string;
  resourceId: string;
  resourceName: string;
  recommendation: string;
  references: string[];
  tags: string[];
  firstDetected: string;
  lastSeen: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SecurityMetrics {
  totalVulnerabilities: number;
  openVulnerabilities: number;
  vulnerabilitiesBySeverity: VulnerabilitySeverity;
  vulnerabilitiesByStatus: VulnerabilityStatus;
  recentScans: number;
  complianceScore: number;
  securityTrends: Array<{
    date: string;
    vulnerabilityCount: number;
    criticalCount: number;
    highCount: number;
    complianceScore: number;
  }>;
}

export interface SecurityAlert {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  description: string;
  resourceType: string;
  resourceName: string;
  timestamp: string;
  status: 'active' | 'acknowledged' | 'resolved';
}

export interface VulnerabilityQuery {
  scanId?: string;
  severity?: string;
  status?: string;
  resourceType?: string;
  resourceId?: string;
  cveId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

class SecurityService {
  // Get security metrics for dashboard
  async getSecurityMetrics(): Promise<SecurityMetrics> {
    try {
      const response = await apiService.get<SecurityMetrics>('/security/metrics');
      return response;
    } catch (error) {
      console.error('Failed to fetch security metrics:', error);
      throw error;
    }
  }

  // Get security scans
  async getSecurityScans(limit: number = 10, offset: number = 0): Promise<{ scans: SecurityScan[]; total: number }> {
    try {
      const response = await apiService.get<{ scans: SecurityScan[]; total: number }>(`/security/scans?limit=${limit}&offset=${offset}`);
      return response;
    } catch (error) {
      console.error('Failed to fetch security scans:', error);
      throw error;
    }
  }

  // Get vulnerabilities
  async getVulnerabilities(query: VulnerabilityQuery = {}): Promise<{ vulnerabilities: Vulnerability[]; total: number }> {
    try {
      const params = new URLSearchParams();
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
      
      const response = await apiService.get<{ vulnerabilities: Vulnerability[]; total: number }>(`/security/vulnerabilities?${params.toString()}`);
      return response;
    } catch (error) {
      console.error('Failed to fetch vulnerabilities:', error);
      throw error;
    }
  }

  // Get security alerts
  async getSecurityAlerts(limit: number = 5): Promise<SecurityAlert[]> {
    try {
      // This would be a separate endpoint for alerts, for now we'll derive from vulnerabilities
      const { vulnerabilities } = await this.getVulnerabilities({ 
        status: 'open', 
        limit,
        severity: 'critical'
      });
      
      return (vulnerabilities || []).map(vuln => ({
        id: vuln.id,
        title: vuln.title,
        severity: vuln.severity,
        description: vuln.description,
        resourceType: vuln.resourceType,
        resourceName: vuln.resourceName,
        timestamp: vuln.lastSeen,
        status: 'active' as const
      }));
    } catch (error) {
      console.error('Failed to fetch security alerts:', error);
      return []; // Return empty array instead of throwing
    }
  }

  // Create security scan
  async createSecurityScan(scanData: {
    name: string;
    type: string;
    targetType: string;
    targetId: string;
    targetName: string;
    configuration?: Record<string, any>;
  }): Promise<SecurityScan> {
    try {
      const response = await apiService.post<SecurityScan>('/security/scans', scanData);
      return response;
    } catch (error) {
      console.error('Failed to create security scan:', error);
      throw error;
    }
  }

  // Update vulnerability status
  async updateVulnerability(vulnerabilityId: string, updates: {
    status: string;
    recommendation?: string;
    tags?: string[];
  }): Promise<Vulnerability> {
    try {
      const response = await apiService.put<Vulnerability>(`/security/vulnerabilities/${vulnerabilityId}`, updates);
      return response;
    } catch (error) {
      console.error('Failed to update vulnerability:', error);
      throw error;
    }
  }
}

export const securityService = new SecurityService();