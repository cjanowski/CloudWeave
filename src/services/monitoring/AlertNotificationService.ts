import { NotificationChannel } from './types';
import { logger } from '../../utils/logger';

/**
 * Service for sending alert notifications through various channels
 * Handles email, Slack, webhook, and other notification types
 */
export class AlertNotificationService {
  private channels: Map<string, NotificationChannelHandler> = new Map();

  constructor() {
    this.initializeChannelHandlers();
  }

  /**
   * Send notification through specified channel
   */
  async sendNotification(
    channel: NotificationChannel,
    alertData: AlertNotificationData
  ): Promise<void> {
    try {
      if (!channel.enabled) {
        logger.debug(`Notification channel ${channel.id} is disabled`);
        return;
      }

      const handler = this.channels.get(channel.type);
      if (!handler) {
        throw new Error(`No handler found for notification type: ${channel.type}`);
      }

      await handler.send(channel, alertData);

      logger.info(`Notification sent via ${channel.type}`, {
        channelId: channel.id,
        alertId: alertData.alertId,
        severity: alertData.severity,
      });
    } catch (error) {
      logger.error(`Failed to send notification via ${channel.type}:`, error);
      throw error;
    }
  }

  /**
   * Send notification to multiple channels
   */
  async sendToMultipleChannels(
    channels: NotificationChannel[],
    alertData: AlertNotificationData
  ): Promise<void> {
    const results = await Promise.allSettled(
      channels.map(channel => this.sendNotification(channel, alertData))
    );

    const failures = results.filter(result => result.status === 'rejected');
    if (failures.length > 0) {
      logger.warn(`${failures.length} notification(s) failed to send`, {
        alertId: alertData.alertId,
        totalChannels: channels.length,
        failures: failures.length,
      });
    }
  }

  /**
   * Test notification channel
   */
  async testChannel(channel: NotificationChannel): Promise<boolean> {
    try {
      const testData: AlertNotificationData = {
        alertId: 'test-alert',
        ruleName: 'Test Alert Rule',
        severity: 'info',
        value: 42,
        threshold: 50,
        labels: { test: 'true' },
        annotations: { description: 'This is a test alert notification' },
        startsAt: new Date(),
        generatorURL: 'http://localhost:3000/alerts/test',
      };

      await this.sendNotification(channel, testData);
      return true;
    } catch (error) {
      logger.error(`Notification channel test failed for ${channel.id}:`, error);
      return false;
    }
  }

  /**
   * Get supported notification types
   */
  getSupportedTypes(): string[] {
    return Array.from(this.channels.keys());
  }

  // Private helper methods
  private initializeChannelHandlers(): void {
    this.channels.set('email', new EmailNotificationHandler());
    this.channels.set('slack', new SlackNotificationHandler());
    this.channels.set('webhook', new WebhookNotificationHandler());
    this.channels.set('pagerduty', new PagerDutyNotificationHandler());
    this.channels.set('opsgenie', new OpsGenieNotificationHandler());

    logger.info(`Initialized ${this.channels.size} notification channel handlers`);
  }
}

/**
 * Alert notification data structure
 */
export interface AlertNotificationData {
  alertId: string;
  ruleName: string;
  severity: 'critical' | 'warning' | 'info';
  value: number;
  threshold: number;
  labels: Record<string, string>;
  annotations: Record<string, string>;
  startsAt: Date;
  endsAt?: Date;
  generatorURL?: string;
}

/**
 * Base interface for notification channel handlers
 */
interface NotificationChannelHandler {
  send(channel: NotificationChannel, alertData: AlertNotificationData): Promise<void>;
}

/**
 * Email notification handler
 */
class EmailNotificationHandler implements NotificationChannelHandler {
  async send(channel: NotificationChannel, alertData: AlertNotificationData): Promise<void> {
    const subject = this.generateEmailSubject(alertData);
    const body = this.generateEmailBody(alertData);

    // Simulate email sending
    await this.simulateEmailSend(channel.configuration, subject, body);

    logger.debug('Email notification sent', {
      channelId: channel.id,
      subject,
      recipients: channel.configuration.recipients || ['default@example.com'],
    });
  }

  private generateEmailSubject(alertData: AlertNotificationData): string {
    const severityEmoji = {
      critical: '🚨',
      warning: '⚠️',
      info: 'ℹ️',
    };

    return `${severityEmoji[alertData.severity]} Alert: ${alertData.ruleName}`;
  }

  private generateEmailBody(alertData: AlertNotificationData): string {
    const lines = [
      `Alert: ${alertData.ruleName}`,
      `Severity: ${alertData.severity.toUpperCase()}`,
      `Current Value: ${alertData.value}`,
      `Threshold: ${alertData.threshold}`,
      `Started At: ${alertData.startsAt.toISOString()}`,
      '',
      'Labels:',
      ...Object.entries(alertData.labels).map(([key, value]) => `  ${key}: ${value}`),
      '',
      'Annotations:',
      ...Object.entries(alertData.annotations).map(([key, value]) => `  ${key}: ${value}`),
    ];

    if (alertData.generatorURL) {
      lines.push('', `View Alert: ${alertData.generatorURL}`);
    }

    return lines.join('\n');
  }

  private async simulateEmailSend(_config: any, subject: string, body: string): Promise<void> {
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // In a real implementation, this would use nodemailer or similar
    logger.debug('Email sent (simulated)', { subject, bodyLength: body.length });
  }
}

/**
 * Slack notification handler
 */
class SlackNotificationHandler implements NotificationChannelHandler {
  async send(channel: NotificationChannel, alertData: AlertNotificationData): Promise<void> {
    const payload = this.generateSlackPayload(alertData);

    // Simulate Slack webhook call
    await this.simulateSlackSend(channel.configuration.webhook, payload);

    logger.debug('Slack notification sent', {
      channelId: channel.id,
      webhook: channel.configuration.webhook,
    });
  }

  private generateSlackPayload(alertData: AlertNotificationData): any {
    const color = {
      critical: 'danger',
      warning: 'warning',
      info: 'good',
    };

    const fields = [
      {
        title: 'Current Value',
        value: alertData.value.toString(),
        short: true,
      },
      {
        title: 'Threshold',
        value: alertData.threshold.toString(),
        short: true,
      },
      {
        title: 'Started At',
        value: alertData.startsAt.toISOString(),
        short: false,
      },
    ];

    // Add labels as fields
    Object.entries(alertData.labels).forEach(([key, value]) => {
      fields.push({
        title: key,
        value: value,
        short: true,
      });
    });

    return {
      text: `Alert: ${alertData.ruleName}`,
      attachments: [
        {
          color: color[alertData.severity],
          title: alertData.ruleName,
          title_link: alertData.generatorURL,
          fields,
          footer: 'CloudWeave Monitoring',
          ts: Math.floor(alertData.startsAt.getTime() / 1000),
        },
      ],
    };
  }

  private async simulateSlackSend(webhook: string, payload: any): Promise<void> {
    // Simulate Slack webhook call delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // In a real implementation, this would make an HTTP POST to the webhook
    logger.debug('Slack webhook called (simulated)', { 
      webhook: webhook.substring(0, 50) + '...', 
      payloadSize: JSON.stringify(payload).length 
    });
  }
}

/**
 * Webhook notification handler
 */
class WebhookNotificationHandler implements NotificationChannelHandler {
  async send(channel: NotificationChannel, alertData: AlertNotificationData): Promise<void> {
    const payload = this.generateWebhookPayload(alertData);

    // Simulate webhook call
    await this.simulateWebhookSend(channel.configuration.url, payload, channel.configuration.headers);

    logger.debug('Webhook notification sent', {
      channelId: channel.id,
      url: channel.configuration.url,
    });
  }

  private generateWebhookPayload(alertData: AlertNotificationData): any {
    return {
      alert: {
        id: alertData.alertId,
        rule: alertData.ruleName,
        severity: alertData.severity,
        status: alertData.endsAt ? 'resolved' : 'firing',
        value: alertData.value,
        threshold: alertData.threshold,
        startsAt: alertData.startsAt.toISOString(),
        endsAt: alertData.endsAt?.toISOString(),
        generatorURL: alertData.generatorURL,
        labels: alertData.labels,
        annotations: alertData.annotations,
      },
      timestamp: new Date().toISOString(),
      version: '1.0',
    };
  }

  private async simulateWebhookSend(url: string, payload: any, headers?: Record<string, string>): Promise<void> {
    // Simulate webhook call delay
    await new Promise(resolve => setTimeout(resolve, 400));
    
    // In a real implementation, this would make an HTTP POST to the URL
    logger.debug('Webhook called (simulated)', { 
      url: url.substring(0, 50) + '...', 
      payloadSize: JSON.stringify(payload).length,
      headers: Object.keys(headers || {}).length,
    });
  }
}

/**
 * PagerDuty notification handler
 */
class PagerDutyNotificationHandler implements NotificationChannelHandler {
  async send(channel: NotificationChannel, alertData: AlertNotificationData): Promise<void> {
    const payload = this.generatePagerDutyPayload(alertData, channel.configuration);

    // Simulate PagerDuty API call
    await this.simulatePagerDutySend(payload);

    logger.debug('PagerDuty notification sent', {
      channelId: channel.id,
      severity: alertData.severity,
    });
  }

  private generatePagerDutyPayload(alertData: AlertNotificationData, config: any): any {
    const eventAction = alertData.endsAt ? 'resolve' : 'trigger';
    
    return {
      routing_key: config.integrationKey,
      event_action: eventAction,
      dedup_key: alertData.alertId,
      payload: {
        summary: `${alertData.ruleName}: ${alertData.value} ${alertData.threshold}`,
        severity: alertData.severity === 'critical' ? 'critical' : 'warning',
        source: 'CloudWeave Monitoring',
        timestamp: alertData.startsAt.toISOString(),
        custom_details: {
          rule_name: alertData.ruleName,
          current_value: alertData.value,
          threshold: alertData.threshold,
          labels: alertData.labels,
          annotations: alertData.annotations,
        },
      },
      links: alertData.generatorURL ? [
        {
          href: alertData.generatorURL,
          text: 'View in CloudWeave',
        },
      ] : [],
    };
  }

  private async simulatePagerDutySend(payload: any): Promise<void> {
    // Simulate PagerDuty API call delay
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // In a real implementation, this would call PagerDuty Events API
    logger.debug('PagerDuty event sent (simulated)', { 
      eventAction: payload.event_action,
      dedupKey: payload.dedup_key,
    });
  }
}

/**
 * OpsGenie notification handler
 */
class OpsGenieNotificationHandler implements NotificationChannelHandler {
  async send(channel: NotificationChannel, alertData: AlertNotificationData): Promise<void> {
    const payload = this.generateOpsGeniePayload(alertData, channel.configuration);

    // Simulate OpsGenie API call
    await this.simulateOpsGenieSend(payload);

    logger.debug('OpsGenie notification sent', {
      channelId: channel.id,
      severity: alertData.severity,
    });
  }

  private generateOpsGeniePayload(alertData: AlertNotificationData, _config: any): any {
    const priority = {
      critical: 'P1',
      warning: 'P3',
      info: 'P5',
    };

    return {
      message: alertData.ruleName,
      alias: alertData.alertId,
      description: `Alert: ${alertData.ruleName}\nCurrent Value: ${alertData.value}\nThreshold: ${alertData.threshold}`,
      priority: priority[alertData.severity],
      source: 'CloudWeave Monitoring',
      tags: Object.entries(alertData.labels).map(([key, value]) => `${key}:${value}`),
      details: {
        rule_name: alertData.ruleName,
        current_value: alertData.value,
        threshold: alertData.threshold,
        started_at: alertData.startsAt.toISOString(),
        generator_url: alertData.generatorURL,
        ...alertData.annotations,
      },
      actions: alertData.generatorURL ? ['View Alert'] : [],
    };
  }

  private async simulateOpsGenieSend(payload: any): Promise<void> {
    // Simulate OpsGenie API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // In a real implementation, this would call OpsGenie Alert API
    logger.debug('OpsGenie alert sent (simulated)', { 
      message: payload.message,
      priority: payload.priority,
      alias: payload.alias,
    });
  }
}