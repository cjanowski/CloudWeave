import { AlertingService } from './AlertingService';
import { IMetricsStorageService } from './interfaces';
import { AlertRule, QueryResult } from './types';

describe('AlertingService', () => {
  let alertingService: AlertingService;
  let mockMetricsStorage: jest.Mocked<IMetricsStorageService>;
  let mockNotificationService: any;

  beforeEach(() => {
    mockMetricsStorage = {
      storeMetric: jest.fn(),
      storeMetrics: jest.fn(),
      queryMetrics: jest.fn(),
      getMetricSeries: jest.fn(),
      getAvailableMetrics: jest.fn(),
      getMetricMetadata: jest.fn(),
      deleteMetrics: jest.fn(),
      getStorageStatistics: jest.fn(),
      compactStorage: jest.fn(),
      healthCheck: jest.fn(),
    };

    mockNotificationService = {
      sendNotification: jest.fn(),
    };

    alertingService = new AlertingService(mockMetricsStorage, mockNotificationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('alert rule management', () => {
    it('should create alert rule successfully', async () => {
      const ruleData = {
        name: 'High CPU Usage',
        description: 'Alert when CPU usage exceeds 80%',
        organizationId: 'org-1',
        projectId: 'project-1',
        query: {
          metric: 'cpu_usage_percent',
          timeRange: '5m' as const,
          aggregation: 'avg' as const,
        },
        condition: {
          aggregation: 'avg' as const,
          operator: 'gt' as const,
          threshold: 80,
          timeWindow: '5m',
          evaluationWindow: '1m',
        },
        frequency: '1m',
        severity: 'warning' as const,
        notifications: [],
        labels: { team: 'platform' },
        annotations: { runbook: 'https://wiki.example.com/cpu-alerts' },
        createdBy: 'user-1',
        enabled: true,
      };

      const rule = await alertingService.createAlertRule(ruleData);

      expect(rule.id).toBeDefined();
      expect(rule.name).toBe('High CPU Usage');
      expect(rule.state).toBe('ok');
      expect(rule.enabled).toBe(true);
      expect(rule.createdAt).toBeInstanceOf(Date);
      expect(rule.updatedAt).toBeInstanceOf(Date);
    });

    it('should validate alert rule configuration', async () => {
      const invalidRuleData = {
        name: '', // Invalid - empty name
        organizationId: 'org-1',
        query: {
          metric: 'cpu_usage_percent',
          timeRange: '5m' as const,
        },
        condition: {
          aggregation: 'avg' as const,
          operator: 'invalid' as any, // Invalid operator
          threshold: 'not-a-number' as any, // Invalid threshold
          timeWindow: '5m',
          evaluationWindow: '1m',
        },
        frequency: '1m',
        severity: 'invalid' as any, // Invalid severity
        notifications: [],
        labels: {},
        annotations: {},
        createdBy: 'user-1',
        enabled: true,
      };

      await expect(alertingService.createAlertRule(invalidRuleData)).rejects.toThrow('Alert rule validation failed');
    });

    it('should get alert rule by ID', async () => {
      const ruleData = {
        name: 'Test Alert',
        organizationId: 'org-1',
        query: {
          metric: 'test_metric',
          timeRange: '5m' as const,
        },
        condition: {
          aggregation: 'avg' as const,
          operator: 'gt' as const,
          threshold: 50,
          timeWindow: '5m',
          evaluationWindow: '1m',
        },
        frequency: '1m',
        severity: 'info' as const,
        notifications: [],
        labels: {},
        annotations: {},
        createdBy: 'user-1',
        enabled: true,
      };

      const rule = await alertingService.createAlertRule(ruleData);
      const retrieved = await alertingService.getAlertRule(rule.id);

      expect(retrieved).not.toBeNull();
      expect(retrieved!.id).toBe(rule.id);
      expect(retrieved!.name).toBe('Test Alert');
    });

    it('should return null for non-existent alert rule', async () => {
      const rule = await alertingService.getAlertRule('non-existent-id');
      expect(rule).toBeNull();
    });

    it('should get alert rules with filtering', async () => {
      // Create rules for different organizations
      const rule1Data = {
        name: 'Org 1 Alert',
        organizationId: 'org-1',
        projectId: 'project-1',
        query: { metric: 'test_metric', timeRange: '5m' as const },
        condition: {
          aggregation: 'avg' as const,
          operator: 'gt' as const,
          threshold: 50,
          timeWindow: '5m',
          evaluationWindow: '1m',
        },
        frequency: '1m',
        severity: 'info' as const,
        notifications: [],
        labels: {},
        annotations: {},
        createdBy: 'user-1',
        enabled: true,
      };

      const rule2Data = {
        name: 'Org 2 Alert',
        organizationId: 'org-2',
        query: { metric: 'test_metric', timeRange: '5m' as const },
        condition: {
          aggregation: 'avg' as const,
          operator: 'gt' as const,
          threshold: 50,
          timeWindow: '5m',
          evaluationWindow: '1m',
        },
        frequency: '1m',
        severity: 'info' as const,
        notifications: [],
        labels: {},
        annotations: {},
        createdBy: 'user-1',
        enabled: true,
      };

      await alertingService.createAlertRule(rule1Data);
      await alertingService.createAlertRule(rule2Data);

      const org1Rules = await alertingService.getAlertRules('org-1');
      expect(org1Rules).toHaveLength(1);
      expect(org1Rules[0].name).toBe('Org 1 Alert');

      const org1ProjectRules = await alertingService.getAlertRules('org-1', 'project-1');
      expect(org1ProjectRules).toHaveLength(1);
      expect(org1ProjectRules[0].projectId).toBe('project-1');
    });

    it('should update alert rule', async () => {
      const ruleData = {
        name: 'Original Alert',
        organizationId: 'org-1',
        query: { metric: 'test_metric', timeRange: '5m' as const },
        condition: {
          aggregation: 'avg' as const,
          operator: 'gt' as const,
          threshold: 50,
          timeWindow: '5m',
          evaluationWindow: '1m',
        },
        frequency: '1m',
        severity: 'info' as const,
        notifications: [],
        labels: {},
        annotations: {},
        createdBy: 'user-1',
        enabled: true,
      };

      const rule = await alertingService.createAlertRule(ruleData);

      const updates = {
        name: 'Updated Alert',
        severity: 'warning' as const,
        enabled: false,
      };

      const updatedRule = await alertingService.updateAlertRule(rule.id, updates);

      expect(updatedRule.name).toBe('Updated Alert');
      expect(updatedRule.severity).toBe('warning');
      expect(updatedRule.enabled).toBe(false);
      expect(updatedRule.id).toBe(rule.id);
      expect(updatedRule.createdAt).toEqual(rule.createdAt);
      expect(updatedRule.updatedAt.getTime()).toBeGreaterThanOrEqual(rule.updatedAt.getTime());
    });

    it('should enable and disable alert rule', async () => {
      const ruleData = {
        name: 'Toggle Alert',
        organizationId: 'org-1',
        query: { metric: 'test_metric', timeRange: '5m' as const },
        condition: {
          aggregation: 'avg' as const,
          operator: 'gt' as const,
          threshold: 50,
          timeWindow: '5m',
          evaluationWindow: '1m',
        },
        frequency: '1m',
        severity: 'info' as const,
        notifications: [],
        labels: {},
        annotations: {},
        createdBy: 'user-1',
        enabled: true,
      };

      const rule = await alertingService.createAlertRule(ruleData);

      await alertingService.setAlertRuleEnabled(rule.id, false);
      let updatedRule = await alertingService.getAlertRule(rule.id);
      expect(updatedRule!.enabled).toBe(false);

      await alertingService.setAlertRuleEnabled(rule.id, true);
      updatedRule = await alertingService.getAlertRule(rule.id);
      expect(updatedRule!.enabled).toBe(true);
    });

    it('should delete alert rule', async () => {
      const ruleData = {
        name: 'Delete Me Alert',
        organizationId: 'org-1',
        query: { metric: 'test_metric', timeRange: '5m' as const },
        condition: {
          aggregation: 'avg' as const,
          operator: 'gt' as const,
          threshold: 50,
          timeWindow: '5m',
          evaluationWindow: '1m',
        },
        frequency: '1m',
        severity: 'info' as const,
        notifications: [],
        labels: {},
        annotations: {},
        createdBy: 'user-1',
        enabled: true,
      };

      const rule = await alertingService.createAlertRule(ruleData);

      await alertingService.deleteAlertRule(rule.id);

      const deletedRule = await alertingService.getAlertRule(rule.id);
      expect(deletedRule).toBeNull();
    });
  });

  describe('alert evaluation', () => {
    let testRule: AlertRule;

    beforeEach(async () => {
      const ruleData = {
        name: 'CPU Alert',
        organizationId: 'org-1',
        query: {
          metric: 'cpu_usage_percent',
          timeRange: '5m' as const,
          aggregation: 'avg' as const,
        },
        condition: {
          aggregation: 'avg' as const,
          operator: 'gt' as const,
          threshold: 80,
          timeWindow: '5m',
          evaluationWindow: '1m',
        },
        frequency: '1m',
        severity: 'warning' as const,
        notifications: [],
        labels: { service: 'web' },
        annotations: { description: 'High CPU usage detected' },
        createdBy: 'user-1',
        enabled: true,
      };

      testRule = await alertingService.createAlertRule(ruleData);
    });

    it('should evaluate alert rule and trigger alert when threshold exceeded', async () => {
      // Mock metrics query to return high CPU value
      const mockQueryResult: QueryResult = {
        metric: 'cpu_usage_percent',
        data: [{
          metric: {
            name: 'cpu_usage_percent',
            type: 'gauge',
            unit: 'percent',
            description: 'CPU usage percentage',
            defaultLabels: {},
            retention: '30d',
          },
          dataPoints: [
            {
              timestamp: new Date(),
              value: 85, // Above threshold of 80
              labels: { instance: 'web-1' },
            },
          ],
          timeRange: '5m',
          resolution: '1m',
        }],
        executionTime: 100,
        cached: false,
      };

      mockMetricsStorage.queryMetrics.mockResolvedValue(mockQueryResult);

      await alertingService.evaluateAlertRules();

      // Check that rule state changed to alerting
      const updatedRule = await alertingService.getAlertRule(testRule.id);
      expect(updatedRule!.state).toBe('alerting');
      expect(updatedRule!.lastEvaluation).toBeInstanceOf(Date);

      // Check that alert instance was created
      const activeAlerts = await alertingService.getActiveAlerts();
      expect(activeAlerts).toHaveLength(1);
      expect(activeAlerts[0].ruleId).toBe(testRule.id);
      expect(activeAlerts[0].value).toBe(85);
      expect(activeAlerts[0].state).toBe('alerting');
    });

    it('should not trigger alert when threshold not exceeded', async () => {
      // Mock metrics query to return normal CPU value
      const mockQueryResult: QueryResult = {
        metric: 'cpu_usage_percent',
        data: [{
          metric: {
            name: 'cpu_usage_percent',
            type: 'gauge',
            unit: 'percent',
            description: 'CPU usage percentage',
            defaultLabels: {},
            retention: '30d',
          },
          dataPoints: [
            {
              timestamp: new Date(),
              value: 60, // Below threshold of 80
              labels: { instance: 'web-1' },
            },
          ],
          timeRange: '5m',
          resolution: '1m',
        }],
        executionTime: 100,
        cached: false,
      };

      mockMetricsStorage.queryMetrics.mockResolvedValue(mockQueryResult);

      await alertingService.evaluateAlertRules();

      // Check that rule state remains ok
      const updatedRule = await alertingService.getAlertRule(testRule.id);
      expect(updatedRule!.state).toBe('ok');

      // Check that no alert instances were created
      const activeAlerts = await alertingService.getActiveAlerts();
      expect(activeAlerts).toHaveLength(0);
    });

    it('should handle no data scenario', async () => {
      // Mock metrics query to return no data
      const mockQueryResult: QueryResult = {
        metric: 'cpu_usage_percent',
        data: [{
          metric: {
            name: 'cpu_usage_percent',
            type: 'gauge',
            unit: 'percent',
            description: 'CPU usage percentage',
            defaultLabels: {},
            retention: '30d',
          },
          dataPoints: [], // No data points
          timeRange: '5m',
          resolution: '1m',
        }],
        executionTime: 100,
        cached: false,
      };

      mockMetricsStorage.queryMetrics.mockResolvedValue(mockQueryResult);

      await alertingService.evaluateAlertRules();

      // Check that rule state changed to no_data
      const updatedRule = await alertingService.getAlertRule(testRule.id);
      expect(updatedRule!.state).toBe('no_data');
    });

    it('should test alert rule', async () => {
      // Mock metrics query for test
      const mockQueryResult: QueryResult = {
        metric: 'cpu_usage_percent',
        data: [{
          metric: {
            name: 'cpu_usage_percent',
            type: 'gauge',
            unit: 'percent',
            description: 'CPU usage percentage',
            defaultLabels: {},
            retention: '30d',
          },
          dataPoints: [
            {
              timestamp: new Date(),
              value: 90, // Above threshold
              labels: { instance: 'web-1' },
            },
          ],
          timeRange: '5m',
          resolution: '1m',
        }],
        executionTime: 100,
        cached: false,
      };

      mockMetricsStorage.queryMetrics.mockResolvedValue(mockQueryResult);

      const testResult = await alertingService.testAlertRule(testRule);

      expect(testResult.triggered).toBe(true);
      expect(testResult.value).toBe(90);
      expect(testResult.message).toContain('Alert would trigger');
    });
  });

  describe('alert instance management', () => {
    it('should acknowledge alert', async () => {
      // Create and trigger an alert first
      const ruleData = {
        name: 'Test Alert',
        organizationId: 'org-1',
        query: { metric: 'test_metric', timeRange: '5m' as const },
        condition: {
          aggregation: 'avg' as const,
          operator: 'gt' as const,
          threshold: 50,
          timeWindow: '5m',
          evaluationWindow: '1m',
        },
        frequency: '1m',
        severity: 'info' as const,
        notifications: [],
        labels: {},
        annotations: {},
        createdBy: 'user-1',
        enabled: true,
      };

      await alertingService.createAlertRule(ruleData);

      // Mock high value to trigger alert
      const mockQueryResult: QueryResult = {
        metric: 'test_metric',
        data: [{
          metric: {
            name: 'test_metric',
            type: 'gauge',
            unit: 'count',
            description: 'Test metric',
            defaultLabels: {},
            retention: '30d',
          },
          dataPoints: [{ timestamp: new Date(), value: 75, labels: {} }],
          timeRange: '5m',
          resolution: '1m',
        }],
        executionTime: 100,
        cached: false,
      };

      mockMetricsStorage.queryMetrics.mockResolvedValue(mockQueryResult);
      await alertingService.evaluateAlertRules();

      const activeAlerts = await alertingService.getActiveAlerts();
      expect(activeAlerts).toHaveLength(1);

      const alertInstance = activeAlerts[0];
      await alertingService.acknowledgeAlert(alertInstance.id, 'user-1');

      const acknowledgedAlert = await alertingService.getActiveAlerts();
      expect(acknowledgedAlert[0].annotations.acknowledged).toBe('true');
      expect(acknowledgedAlert[0].annotations.acknowledgedBy).toBe('user-1');
    });

    it('should silence alert', async () => {
      // Create and trigger an alert first
      const ruleData = {
        name: 'Test Alert',
        organizationId: 'org-1',
        query: { metric: 'test_metric', timeRange: '5m' as const },
        condition: {
          aggregation: 'avg' as const,
          operator: 'gt' as const,
          threshold: 50,
          timeWindow: '5m',
          evaluationWindow: '1m',
        },
        frequency: '1m',
        severity: 'info' as const,
        notifications: [],
        labels: {},
        annotations: {},
        createdBy: 'user-1',
        enabled: true,
      };

      await alertingService.createAlertRule(ruleData);

      // Mock high value to trigger alert
      const mockQueryResult: QueryResult = {
        metric: 'test_metric',
        data: [{
          metric: {
            name: 'test_metric',
            type: 'gauge',
            unit: 'count',
            description: 'Test metric',
            defaultLabels: {},
            retention: '30d',
          },
          dataPoints: [{ timestamp: new Date(), value: 75, labels: {} }],
          timeRange: '5m',
          resolution: '1m',
        }],
        executionTime: 100,
        cached: false,
      };

      mockMetricsStorage.queryMetrics.mockResolvedValue(mockQueryResult);
      await alertingService.evaluateAlertRules();

      const activeAlerts = await alertingService.getActiveAlerts();
      expect(activeAlerts).toHaveLength(1);

      const alertInstance = activeAlerts[0];
      await alertingService.silenceAlert(alertInstance.id, '1h', 'user-1');

      const silencedAlert = await alertingService.getActiveAlerts();
      expect(silencedAlert[0].annotations.silenced).toBe('true');
      expect(silencedAlert[0].annotations.silencedBy).toBe('user-1');
      expect(silencedAlert[0].annotations.silenceUntil).toBeDefined();
    });

    it('should get alert history', async () => {
      // Create some alert history by triggering and resolving alerts
      const ruleData = {
        name: 'History Test Alert',
        organizationId: 'org-1',
        query: { metric: 'test_metric', timeRange: '5m' as const },
        condition: {
          aggregation: 'avg' as const,
          operator: 'gt' as const,
          threshold: 50,
          timeWindow: '5m',
          evaluationWindow: '1m',
        },
        frequency: '1m',
        severity: 'info' as const,
        notifications: [],
        labels: {},
        annotations: {},
        createdBy: 'user-1',
        enabled: true,
      };

      const rule = await alertingService.createAlertRule(ruleData);

      // Trigger alert
      const highValueResult: QueryResult = {
        metric: 'test_metric',
        data: [{
          metric: {
            name: 'test_metric',
            type: 'gauge',
            unit: 'count',
            description: 'Test metric',
            defaultLabels: {},
            retention: '30d',
          },
          dataPoints: [{ timestamp: new Date(), value: 75, labels: {} }],
          timeRange: '5m',
          resolution: '1m',
        }],
        executionTime: 100,
        cached: false,
      };

      mockMetricsStorage.queryMetrics.mockResolvedValue(highValueResult);
      await alertingService.evaluateAlertRules();

      // Resolve alert
      const lowValueResult: QueryResult = {
        metric: 'test_metric',
        data: [{
          metric: {
            name: 'test_metric',
            type: 'gauge',
            unit: 'count',
            description: 'Test metric',
            defaultLabels: {},
            retention: '30d',
          },
          dataPoints: [{ timestamp: new Date(), value: 25, labels: {} }],
          timeRange: '5m',
          resolution: '1m',
        }],
        executionTime: 100,
        cached: false,
      };

      mockMetricsStorage.queryMetrics.mockResolvedValue(lowValueResult);
      await alertingService.evaluateAlertRules();

      const history = await alertingService.getAlertHistory();
      expect(history.length).toBeGreaterThan(0);

      const ruleHistory = await alertingService.getAlertHistory(rule.id);
      expect(ruleHistory.length).toBeGreaterThan(0);
      expect(ruleHistory[0].ruleId).toBe(rule.id);
    });
  });

  describe('alert statistics', () => {
    it('should get alert statistics', async () => {
      // Create some test rules
      const ruleData1 = {
        name: 'Critical Alert',
        organizationId: 'org-1',
        query: { metric: 'test_metric', timeRange: '5m' as const },
        condition: {
          aggregation: 'avg' as const,
          operator: 'gt' as const,
          threshold: 90,
          timeWindow: '5m',
          evaluationWindow: '1m',
        },
        frequency: '1m',
        severity: 'critical' as const,
        notifications: [],
        labels: {},
        annotations: {},
        createdBy: 'user-1',
        enabled: true,
      };

      const ruleData2 = {
        name: 'Warning Alert',
        organizationId: 'org-1',
        query: { metric: 'test_metric', timeRange: '5m' as const },
        condition: {
          aggregation: 'avg' as const,
          operator: 'gt' as const,
          threshold: 70,
          timeWindow: '5m',
          evaluationWindow: '1m',
        },
        frequency: '1m',
        severity: 'warning' as const,
        notifications: [],
        labels: {},
        annotations: {},
        createdBy: 'user-1',
        enabled: false, // Disabled
      };

      await alertingService.createAlertRule(ruleData1);
      await alertingService.createAlertRule(ruleData2);

      const stats = await alertingService.getAlertStatistics();

      expect(stats.totalRules).toBe(2);
      expect(stats.enabledRules).toBe(1);
      expect(stats.alertsBySeverity.critical).toBe(0);
      expect(stats.alertsBySeverity.warning).toBe(0);
      expect(stats.alertsByState.ok).toBe(0);
    });
  });

  describe('evaluation lifecycle', () => {
    it('should start and stop evaluation', async () => {
      await alertingService.startEvaluation(1); // 1 second interval for testing

      // Wait a bit for evaluation to run
      await new Promise(resolve => setTimeout(resolve, 100));

      await alertingService.stopEvaluation();

      // Test passes if no errors are thrown
    });
  });
});