import { IAlertingService, IMetricsStorageService } from './interfaces';
import {
  AlertRule,
  AlertInstance,
  AlertState,
  AlertCondition,
  NotificationChannel
} from './types';
import { logger } from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Service for managing alerts and alert rules
 * Handles alert evaluation, state management, and notification triggering
 */
export class AlertingService implements IAlertingService {
  private alertRules: Map<string, AlertRule> = new Map();
  private alertInstances: Map<string, AlertInstance> = new Map();
  private evaluationInterval: NodeJS.Timeout | null = null;
  private notificationChannels: Map<string, NotificationChannel> = new Map();
  private alertHistory: AlertInstance[] = [];

  constructor(
    private metricsStorage: IMetricsStorageService,
    private notificationService?: any
  ) {
    this.initializeDefaultNotificationChannels();
  }

  /**
   * Create alert rule
   */
  async createAlertRule(ruleData: Omit<AlertRule, 'id' | 'createdAt' | 'updatedAt' | 'state' | 'lastEvaluation' | 'lastStateChange'>): Promise<AlertRule> {
    try {
      const ruleId = uuidv4();
      const now = new Date();

      const rule: AlertRule = {
        ...ruleData,
        id: ruleId,
        state: 'ok',
        createdAt: now,
        updatedAt: now,
      };

      // Validate alert rule
      const validationErrors = await this.validateAlertRule(rule);
      if (validationErrors.length > 0) {
        throw new Error(`Alert rule validation failed: ${validationErrors.join(', ')}`);
      }

      this.alertRules.set(ruleId, rule);

      logger.info(`Created alert rule ${ruleId}`, {
        ruleId,
        name: rule.name,
        severity: rule.severity,
        enabled: rule.enabled,
      });

      return rule;
    } catch (error) {
      logger.error('Failed to create alert rule:', error);
      throw error;
    }
  }

  /**
   * Get alert rule by ID
   */
  async getAlertRule(ruleId: string): Promise<AlertRule | null> {
    return this.alertRules.get(ruleId) || null;
  }

  /**
   * Get alert rules with filtering
   */
  async getAlertRules(organizationId: string, projectId?: string): Promise<AlertRule[]> {
    const rules = Array.from(this.alertRules.values());
    
    return rules.filter(rule => {
      if (rule.organizationId !== organizationId) return false;
      if (projectId && rule.projectId !== projectId) return false;
      return true;
    });
  }

  /**
   * Update alert rule
   */
  async updateAlertRule(ruleId: string, updates: Partial<AlertRule>): Promise<AlertRule> {
    try {
      const existingRule = this.alertRules.get(ruleId);
      if (!existingRule) {
        throw new Error(`Alert rule ${ruleId} not found`);
      }

      const updatedRule: AlertRule = {
        ...existingRule,
        ...updates,
        id: ruleId, // Ensure ID cannot be changed
        createdAt: existingRule.createdAt, // Preserve creation date
        updatedAt: new Date(),
      };

      // Validate updated rule
      const validationErrors = await this.validateAlertRule(updatedRule);
      if (validationErrors.length > 0) {
        throw new Error(`Alert rule validation failed: ${validationErrors.join(', ')}`);
      }

      this.alertRules.set(ruleId, updatedRule);

      logger.info(`Updated alert rule ${ruleId}`, {
        ruleId,
        updatedFields: Object.keys(updates),
      });

      return updatedRule;
    } catch (error) {
      logger.error(`Failed to update alert rule ${ruleId}:`, error);
      throw error;
    }
  }

  /**
   * Delete alert rule
   */
  async deleteAlertRule(ruleId: string): Promise<void> {
    try {
      const rule = this.alertRules.get(ruleId);
      if (!rule) {
        throw new Error(`Alert rule ${ruleId} not found`);
      }

      // Remove any active alert instances for this rule
      const activeInstances = Array.from(this.alertInstances.values())
        .filter(instance => instance.ruleId === ruleId);

      for (const instance of activeInstances) {
        await this.resolveAlert(instance.id);
      }

      this.alertRules.delete(ruleId);

      logger.info(`Deleted alert rule ${ruleId}`, {
        ruleId,
        name: rule.name,
      });
    } catch (error) {
      logger.error(`Failed to delete alert rule ${ruleId}:`, error);
      throw error;
    }
  }

  /**
   * Enable or disable alert rule
   */
  async setAlertRuleEnabled(ruleId: string, enabled: boolean): Promise<void> {
    try {
      const rule = this.alertRules.get(ruleId);
      if (!rule) {
        throw new Error(`Alert rule ${ruleId} not found`);
      }

      rule.enabled = enabled;
      rule.updatedAt = new Date();

      // If disabling, resolve any active alerts
      if (!enabled) {
        const activeInstances = Array.from(this.alertInstances.values())
          .filter(instance => instance.ruleId === ruleId && instance.state === 'alerting');

        for (const instance of activeInstances) {
          await this.resolveAlert(instance.id);
        }
      }

      logger.info(`${enabled ? 'Enabled' : 'Disabled'} alert rule ${ruleId}`);
    } catch (error) {
      logger.error(`Failed to set alert rule ${ruleId} enabled status:`, error);
      throw error;
    }
  }

  /**
   * Evaluate alert rules
   */
  async evaluateAlertRules(): Promise<void> {
    try {
      const enabledRules = Array.from(this.alertRules.values()).filter(rule => rule.enabled);
      
      logger.debug(`Evaluating ${enabledRules.length} alert rules`);

      for (const rule of enabledRules) {
        try {
          await this.evaluateAlertRule(rule);
        } catch (error) {
          logger.error(`Failed to evaluate alert rule ${rule.id}:`, error);
          rule.state = 'error';
        }
      }

      logger.debug('Alert rule evaluation completed');
    } catch (error) {
      logger.error('Failed to evaluate alert rules:', error);
      throw error;
    }
  }

  /**
   * Get active alert instances
   */
  async getActiveAlerts(organizationId?: string): Promise<AlertInstance[]> {
    let activeAlerts = Array.from(this.alertInstances.values())
      .filter(instance => instance.state === 'alerting');

    if (organizationId) {
      activeAlerts = activeAlerts.filter(instance => {
        const rule = this.alertRules.get(instance.ruleId);
        return rule && rule.organizationId === organizationId;
      });
    }

    return activeAlerts;
  }

  /**
   * Get alert history
   */
  async getAlertHistory(ruleId?: string, limit: number = 100): Promise<AlertInstance[]> {
    let history = [...this.alertHistory];

    if (ruleId) {
      history = history.filter(instance => instance.ruleId === ruleId);
    }

    // Sort by start time (most recent first)
    history.sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime());

    return history.slice(0, limit);
  }

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(instanceId: string, acknowledgedBy: string): Promise<void> {
    try {
      const instance = this.alertInstances.get(instanceId);
      if (!instance) {
        throw new Error(`Alert instance ${instanceId} not found`);
      }

      instance.annotations = {
        ...instance.annotations,
        acknowledged: 'true',
        acknowledgedBy,
        acknowledgedAt: new Date().toISOString(),
      };

      logger.info(`Alert ${instanceId} acknowledged by ${acknowledgedBy}`);
    } catch (error) {
      logger.error(`Failed to acknowledge alert ${instanceId}:`, error);
      throw error;
    }
  }

  /**
   * Silence alert
   */
  async silenceAlert(instanceId: string, duration: string, silencedBy: string): Promise<void> {
    try {
      const instance = this.alertInstances.get(instanceId);
      if (!instance) {
        throw new Error(`Alert instance ${instanceId} not found`);
      }

      const silenceUntil = new Date(Date.now() + this.parseDuration(duration));

      instance.annotations = {
        ...instance.annotations,
        silenced: 'true',
        silencedBy,
        silencedAt: new Date().toISOString(),
        silenceUntil: silenceUntil.toISOString(),
      };

      logger.info(`Alert ${instanceId} silenced by ${silencedBy} until ${silenceUntil}`);
    } catch (error) {
      logger.error(`Failed to silence alert ${instanceId}:`, error);
      throw error;
    }
  }

  /**
   * Test alert rule
   */
  async testAlertRule(rule: AlertRule): Promise<{ triggered: boolean; value: number; message?: string }> {
    try {
      logger.info(`Testing alert rule ${rule.name}`);

      // Execute the metric query
      const queryResult = await this.metricsStorage.queryMetrics(rule.query);
      
      if (queryResult.data.length === 0 || queryResult.data[0].dataPoints.length === 0) {
        return {
          triggered: false,
          value: 0,
          message: 'No data available for the specified query',
        };
      }

      // Get the latest value
      const latestDataPoint = queryResult.data[0].dataPoints[queryResult.data[0].dataPoints.length - 1];
      const value = latestDataPoint.value;

      // Evaluate condition
      const triggered = this.evaluateCondition(value, rule.condition);

      return {
        triggered,
        value,
        message: triggered 
          ? `Alert would trigger: ${value} ${rule.condition.operator} ${rule.condition.threshold}`
          : `Alert would not trigger: ${value} ${rule.condition.operator} ${rule.condition.threshold}`,
      };
    } catch (error) {
      logger.error(`Failed to test alert rule ${rule.name}:`, error);
      return {
        triggered: false,
        value: 0,
        message: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Start alert evaluation loop
   */
  async startEvaluation(intervalSeconds: number = 30): Promise<void> {
    if (this.evaluationInterval) {
      logger.warn('Alert evaluation is already running');
      return;
    }

    this.evaluationInterval = setInterval(async () => {
      try {
        await this.evaluateAlertRules();
      } catch (error) {
        logger.error('Alert evaluation failed:', error);
      }
    }, intervalSeconds * 1000);

    logger.info(`Started alert evaluation with ${intervalSeconds}s interval`);
  }

  /**
   * Stop alert evaluation loop
   */
  async stopEvaluation(): Promise<void> {
    if (this.evaluationInterval) {
      clearInterval(this.evaluationInterval);
      this.evaluationInterval = null;
      logger.info('Stopped alert evaluation');
    }
  }

  /**
   * Add notification channel
   */
  async addNotificationChannel(channel: NotificationChannel): Promise<void> {
    this.notificationChannels.set(channel.id, channel);
    logger.info(`Added notification channel ${channel.id} (${channel.type})`);
  }

  /**
   * Get alert statistics
   */
  async getAlertStatistics(): Promise<{
    totalRules: number;
    enabledRules: number;
    activeAlerts: number;
    alertsByState: Record<AlertState, number>;
    alertsBySeverity: Record<string, number>;
    lastEvaluation: Date | null;
  }> {
    const rules = Array.from(this.alertRules.values());
    const instances = Array.from(this.alertInstances.values());

    const alertsByState: Record<AlertState, number> = {
      ok: 0,
      pending: 0,
      alerting: 0,
      no_data: 0,
      error: 0,
    };

    const alertsBySeverity: Record<string, number> = {
      critical: 0,
      warning: 0,
      info: 0,
    };

    instances.forEach(instance => {
      alertsByState[instance.state]++;
      const rule = this.alertRules.get(instance.ruleId);
      if (rule) {
        alertsBySeverity[rule.severity]++;
      }
    });

    const lastEvaluation = rules.reduce((latest, rule) => {
      if (rule.lastEvaluation && (!latest || rule.lastEvaluation > latest)) {
        return rule.lastEvaluation;
      }
      return latest;
    }, null as Date | null);

    return {
      totalRules: rules.length,
      enabledRules: rules.filter(r => r.enabled).length,
      activeAlerts: instances.filter(i => i.state === 'alerting').length,
      alertsByState,
      alertsBySeverity,
      lastEvaluation,
    };
  }

  // Private helper methods
  private async evaluateAlertRule(rule: AlertRule): Promise<void> {
    try {
      rule.lastEvaluation = new Date();

      // Execute the metric query
      const queryResult = await this.metricsStorage.queryMetrics(rule.query);
      
      if (queryResult.data.length === 0 || queryResult.data[0].dataPoints.length === 0) {
        await this.updateRuleState(rule, 'no_data');
        return;
      }

      // Get the latest value
      const latestDataPoint = queryResult.data[0].dataPoints[queryResult.data[0].dataPoints.length - 1];
      const value = latestDataPoint.value;

      // Evaluate condition
      const shouldAlert = this.evaluateCondition(value, rule.condition);

      if (shouldAlert) {
        await this.triggerAlert(rule, value, latestDataPoint.labels || {});
      } else {
        await this.resolveAlertsForRule(rule.id);
        await this.updateRuleState(rule, 'ok');
      }
    } catch (error) {
      logger.error(`Failed to evaluate alert rule ${rule.id}:`, error);
      await this.updateRuleState(rule, 'error');
    }
  }

  private evaluateCondition(value: number, condition: AlertCondition): boolean {
    switch (condition.operator) {
      case 'gt':
        return value > condition.threshold;
      case 'gte':
        return value >= condition.threshold;
      case 'lt':
        return value < condition.threshold;
      case 'lte':
        return value <= condition.threshold;
      case 'eq':
        return value === condition.threshold;
      case 'ne':
        return value !== condition.threshold;
      default:
        return false;
    }
  }

  private async triggerAlert(rule: AlertRule, value: number, labels: Record<string, string>): Promise<void> {
    const fingerprint = this.generateFingerprint(rule, labels);
    const existingInstance = Array.from(this.alertInstances.values())
      .find(instance => instance.fingerprint === fingerprint);

    if (existingInstance) {
      // Update existing alert
      existingInstance.value = value;
      existingInstance.labels = { ...existingInstance.labels, ...labels };
      
      if (existingInstance.state !== 'alerting') {
        existingInstance.state = 'alerting';
        await this.sendNotifications(rule, existingInstance);
      }
    } else {
      // Create new alert instance
      const instance: AlertInstance = {
        id: uuidv4(),
        ruleId: rule.id,
        state: 'alerting',
        value,
        labels: { ...rule.labels, ...labels },
        annotations: { ...rule.annotations },
        startsAt: new Date(),
        fingerprint,
        generatorURL: `${process.env.BASE_URL || 'http://localhost:3000'}/alerts/${rule.id}`,
      };

      this.alertInstances.set(instance.id, instance);
      this.alertHistory.push({ ...instance });

      await this.updateRuleState(rule, 'alerting');
      await this.sendNotifications(rule, instance);

      logger.warn(`Alert triggered: ${rule.name}`, {
        ruleId: rule.id,
        instanceId: instance.id,
        value,
        threshold: rule.condition.threshold,
      });
    }
  }

  private async resolveAlertsForRule(ruleId: string): Promise<void> {
    const activeInstances = Array.from(this.alertInstances.values())
      .filter(instance => instance.ruleId === ruleId && instance.state === 'alerting');

    for (const instance of activeInstances) {
      await this.resolveAlert(instance.id);
    }
  }

  private async resolveAlert(instanceId: string): Promise<void> {
    const instance = this.alertInstances.get(instanceId);
    if (!instance) return;

    instance.state = 'ok';
    instance.endsAt = new Date();

    // Move to history and remove from active instances
    this.alertHistory.push({ ...instance });
    this.alertInstances.delete(instanceId);

    logger.info(`Alert resolved: ${instanceId}`);
  }

  private async updateRuleState(rule: AlertRule, state: AlertState): Promise<void> {
    if (rule.state !== state) {
      rule.state = state;
      rule.lastStateChange = new Date();
    }
  }

  private async sendNotifications(rule: AlertRule, instance: AlertInstance): Promise<void> {
    try {
      if (!this.notificationService) {
        logger.debug('No notification service configured');
        return;
      }

      for (const channelRef of rule.notifications) {
        const channel = this.notificationChannels.get(channelRef.id);
        if (!channel || !channel.enabled) {
          continue;
        }

        const notificationData = {
          alertId: instance.id,
          ruleName: rule.name,
          severity: rule.severity,
          value: instance.value,
          threshold: rule.condition.threshold,
          labels: instance.labels,
          annotations: instance.annotations,
          startsAt: instance.startsAt,
          generatorURL: instance.generatorURL,
        };

        await this.notificationService.sendNotification(
          `alert-${instance.id}`,
          'alert-triggered',
          notificationData
        );
      }
    } catch (error) {
      logger.error(`Failed to send notifications for alert ${instance.id}:`, error);
    }
  }

  private generateFingerprint(rule: AlertRule, labels: Record<string, string>): string {
    const fingerprint = {
      ruleId: rule.id,
      labels: Object.keys(labels).sort().reduce((sorted, key) => {
        sorted[key] = labels[key];
        return sorted;
      }, {} as Record<string, string>),
    };

    return Buffer.from(JSON.stringify(fingerprint)).toString('base64');
  }

  private parseDuration(duration: string): number {
    const durationMap: Record<string, number> = {
      '1m': 60 * 1000,
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '30m': 30 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '2h': 2 * 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '12h': 12 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
    };

    return durationMap[duration] || durationMap['1h'];
  }

  private async validateAlertRule(rule: AlertRule): Promise<string[]> {
    const errors: string[] = [];

    if (!rule.name) {
      errors.push('Alert rule name is required');
    }

    if (!rule.organizationId) {
      errors.push('Organization ID is required');
    }

    if (!rule.query) {
      errors.push('Metric query is required');
    }

    if (!rule.condition) {
      errors.push('Alert condition is required');
    } else {
      if (typeof rule.condition.threshold !== 'number') {
        errors.push('Alert threshold must be a number');
      }

      if (!['gt', 'gte', 'lt', 'lte', 'eq', 'ne'].includes(rule.condition.operator)) {
        errors.push('Invalid alert condition operator');
      }
    }

    if (!rule.frequency) {
      errors.push('Alert frequency is required');
    }

    if (!['critical', 'warning', 'info'].includes(rule.severity)) {
      errors.push('Invalid alert severity');
    }

    return errors;
  }

  private initializeDefaultNotificationChannels(): void {
    const defaultChannels: NotificationChannel[] = [
      {
        id: 'default-email',
        name: 'Default Email',
        type: 'email',
        configuration: {
          smtp: {
            host: 'localhost',
            port: 587,
            secure: false,
          },
        },
        enabled: true,
      },
      {
        id: 'default-slack',
        name: 'Default Slack',
        type: 'slack',
        configuration: {
          webhook: process.env.SLACK_WEBHOOK_URL || '',
        },
        enabled: !!process.env.SLACK_WEBHOOK_URL,
      },
    ];

    defaultChannels.forEach(channel => {
      this.notificationChannels.set(channel.id, channel);
    });

    logger.info(`Initialized ${defaultChannels.length} default notification channels`);
  }
}