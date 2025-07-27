import { apiService } from './apiService';

export interface Alert {
  id: string;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  message: string;
  resourceId?: string;
  resourceName?: string;
  resourceType?: string;
  provider?: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

export interface AlertSummary {
  totalAlerts: number;
  activeAlerts: number;
  acknowledgedAlerts: number;
  resolvedAlerts: number;
  criticalAlerts: number;
  warningAlerts: number;
  infoAlerts: number;
  alertsByType: Record<string, number>;
  alertsBySeverity: Record<string, number>;
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  condition: string;
  severity: string;
  message: string;
  resourceType: string;
  provider: string;
  enabled: boolean;
  parameters: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface AlertFilters {
  status?: string;
  severity?: string;
  type?: string;
  resourceId?: string;
  startTime?: string;
  endTime?: string;
  limit?: number;
  offset?: number;
}

export interface CreateAlertRuleRequest {
  name: string;
  description?: string;
  condition: string;
  severity: string;
  message: string;
  resourceType?: string;
  provider?: string;
  enabled?: boolean;
  parameters?: Record<string, any>;
}

class AlertsService {
  // Get alerts with filtering options
  async getAlerts(filters: AlertFilters = {}): Promise<Alert[]> {
    const response = await apiService.get('/alerts', { params: filters });
    return response.alerts || [];
  }

  // Get active alerts only
  async getActiveAlerts(): Promise<Alert[]> {
    const response = await apiService.get('/alerts/active');
    return response.alerts || [];
  }

  // Get alert summary statistics
  async getAlertSummary(): Promise<AlertSummary> {
    return await apiService.get('/alerts/summary');
  }

  // Acknowledge an alert
  async acknowledgeAlert(alertId: string): Promise<void> {
    await apiService.post(`/alerts/${alertId}/acknowledge`);
  }

  // Update alert status
  async updateAlertStatus(alertId: string, status: string): Promise<void> {
    await apiService.put(`/alerts/${alertId}/status`, { status });
  }

  // Create alert rule
  async createAlertRule(rule: CreateAlertRuleRequest): Promise<AlertRule> {
    const response = await apiService.post('/alerts/rules', rule);
    return response.rule;
  }

  // Get severity color for UI
  getSeverityColor(severity: string): string {
    const colors = {
      critical: '#EF4444',   // Red
      high: '#F97316',       // Orange
      medium: '#F59E0B',     // Amber
      low: '#10B981',        // Green
      info: '#3B82F6',       // Blue
    };
    return colors[severity as keyof typeof colors] || '#6B7280'; // Gray as default
  }

  // Get severity icon for UI
  getSeverityIcon(severity: string): string {
    const icons = {
      critical: 'alert-triangle',
      high: 'alert-circle',
      medium: 'alert-triangle',
      low: 'info',
      info: 'info-circle',
    };
    return icons[severity as keyof typeof icons] || 'info';
  }

  // Get alert type display name
  getAlertTypeDisplayName(type: string): string {
    const typeNames = {
      high_cpu_usage: 'High CPU Usage',
      high_memory_usage: 'High Memory Usage',
      high_disk_usage: 'High Disk Usage',
      resource_error: 'Resource Error',
      deployment_failed: 'Deployment Failed',
      cost_threshold: 'Cost Threshold Exceeded',
      security_alert: 'Security Alert',
      backup_failed: 'Backup Failed',
      ssl_expiring: 'SSL Certificate Expiring',
      database_connection: 'Database Connection Issue',
    };
    return typeNames[type as keyof typeof typeNames] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  // Format alert for display
  formatAlertForDisplay(alert: Alert) {
    return {
      ...alert,
      severityColor: this.getSeverityColor(alert.severity),
      severityIcon: this.getSeverityIcon(alert.severity),
      typeDisplayName: this.getAlertTypeDisplayName(alert.type),
      formattedCreatedAt: new Date(alert.createdAt).toLocaleString(),
      formattedUpdatedAt: new Date(alert.updatedAt).toLocaleString(),
      isActive: !alert.acknowledged,
      timeAgo: this.getTimeAgo(new Date(alert.createdAt)),
    };
  }

  // Get time ago string
  private getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  }

  // Group alerts by severity
  groupAlertsBySeverity(alerts: Alert[]): Record<string, Alert[]> {
    return alerts.reduce((acc, alert) => {
      if (!acc[alert.severity]) {
        acc[alert.severity] = [];
      }
      acc[alert.severity].push(alert);
      return acc;
    }, {} as Record<string, Alert[]>);
  }

  // Group alerts by type
  groupAlertsByType(alerts: Alert[]): Record<string, Alert[]> {
    return alerts.reduce((acc, alert) => {
      if (!acc[alert.type]) {
        acc[alert.type] = [];
      }
      acc[alert.type].push(alert);
      return acc;
    }, {} as Record<string, Alert[]>);
  }

  // Filter alerts by date range
  filterAlertsByDateRange(alerts: Alert[], startDate: Date, endDate: Date): Alert[] {
    return alerts.filter(alert => {
      const alertDate = new Date(alert.createdAt);
      return alertDate >= startDate && alertDate <= endDate;
    });
  }

  // Sort alerts by severity and date
  sortAlerts(alerts: Alert[]): Alert[] {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
    
    return [...alerts].sort((a, b) => {
      // First sort by acknowledged status (unacknowledged first)
      if (a.acknowledged !== b.acknowledged) {
        return a.acknowledged ? 1 : -1;
      }
      
      // Then by severity
      const severityA = severityOrder[a.severity as keyof typeof severityOrder] ?? 5;
      const severityB = severityOrder[b.severity as keyof typeof severityOrder] ?? 5;
      if (severityA !== severityB) {
        return severityA - severityB;
      }
      
      // Finally by date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }
}

export const alertsService = new AlertsService();
export default alertsService;