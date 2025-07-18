import { INotificationService } from './interfaces';
import { NotificationConfiguration, NotificationEvent } from './types';
import { IDeploymentExecutionService, IDeploymentPipelineService } from './interfaces';
import { logger } from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Service for managing deployment notifications
 * Handles various notification channels and event-driven messaging
 */
export class NotificationService implements INotificationService {
  private notificationQueue: NotificationMessage[] = [];
  private notificationChannels: Map<string, NotificationChannel> = new Map();

  constructor(
    private executionService: IDeploymentExecutionService,
    private pipelineService: IDeploymentPipelineService
  ) {
    this.initializeNotificationChannels();
  }

  /**
   * Send deployment notification
   */
  async sendNotification(executionId: string, event: string, data?: Record<string, any>): Promise<void> {
    try {
      logger.info(`Sending notification for deployment ${executionId}`, {
        event,
        data,
      });

      // Get execution and pipeline details
      const execution = await this.executionService.getExecution(executionId);
      if (!execution) {
        logger.warn(`Cannot send notification - execution ${executionId} not found`);
        return;
      }

      const pipeline = await this.pipelineService.getPipeline(execution.pipelineId);
      if (!pipeline) {
        logger.warn(`Cannot send notification - pipeline ${execution.pipelineId} not found`);
        return;
      }

      // Filter notifications for this event
      const relevantNotifications = pipeline.notifications.filter(notification =>
        notification.events.includes(event as NotificationEvent)
      );

      if (relevantNotifications.length === 0) {
        logger.debug(`No notifications configured for event ${event} in pipeline ${pipeline.id}`);
        return;
      }

      // Create notification message
      const message = this.createNotificationMessage(execution, pipeline, event, data);

      // Send to each configured channel
      for (const notification of relevantNotifications) {
        await this.sendToChannel(notification, message);
      }

      logger.info(`Sent ${relevantNotifications.length} notifications for event ${event}`);
    } catch (error) {
      logger.error(`Failed to send notification for deployment ${executionId}:`, error);
      // Don't throw - notifications should not break deployment flow
    }
  }

  /**
   * Configure notification channels
   */
  async configureNotifications(pipelineId: string, configurations: NotificationConfiguration[]): Promise<void> {
    try {
      logger.info(`Configuring notifications for pipeline ${pipelineId}`, {
        configurationCount: configurations.length,
      });

      // Validate configurations
      for (const config of configurations) {
        const validationErrors = await this.validateNotificationConfiguration(config);
        if (validationErrors.length > 0) {
          throw new Error(`Invalid notification configuration: ${validationErrors.join(', ')}`);
        }
      }

      // Update pipeline with new notification configurations
      const pipeline = await this.pipelineService.getPipeline(pipelineId);
      if (!pipeline) {
        throw new Error(`Pipeline ${pipelineId} not found`);
      }

      await this.pipelineService.updatePipeline(pipelineId, {
        notifications: configurations,
      });

      logger.info(`Successfully configured notifications for pipeline ${pipelineId}`);
    } catch (error) {
      logger.error(`Failed to configure notifications for pipeline ${pipelineId}:`, error);
      throw error;
    }
  }

  /**
   * Test notification configuration
   */
  async testNotification(configuration: NotificationConfiguration): Promise<boolean> {
    try {
      logger.info(`Testing notification configuration`, {
        type: configuration.type,
        recipients: configuration.recipients.length,
      });

      // Validate configuration
      const validationErrors = await this.validateNotificationConfiguration(configuration);
      if (validationErrors.length > 0) {
        logger.warn(`Notification configuration validation failed:`, validationErrors);
        return false;
      }

      // Create test message
      const testMessage: NotificationMessage = {
        id: uuidv4(),
        title: 'Test Notification',
        content: 'This is a test notification from CloudWeave deployment system.',
        severity: 'info',
        timestamp: new Date(),
        metadata: {
          test: true,
          pipeline: 'test-pipeline',
          execution: 'test-execution',
        },
      };

      // Send test notification
      await this.sendToChannel(configuration, testMessage);

      logger.info(`Test notification sent successfully`);
      return true;
    } catch (error) {
      logger.error(`Test notification failed:`, error);
      return false;
    }
  }

  /**
   * Get notification history for deployment
   */
  async getNotificationHistory(executionId: string): Promise<NotificationMessage[]> {
    try {
      // In a real implementation, this would query a database
      // For now, return filtered messages from queue
      const history = this.notificationQueue.filter(msg =>
        msg.metadata.execution === executionId
      );

      logger.info(`Retrieved notification history for deployment ${executionId}`, {
        messageCount: history.length,
      });

      return history;
    } catch (error) {
      logger.error(`Failed to get notification history for deployment ${executionId}:`, error);
      throw error;
    }
  }

  /**
   * Get notification statistics
   */
  async getNotificationStatistics(): Promise<NotificationStatistics> {
    try {
      const stats: NotificationStatistics = {
        totalSent: this.notificationQueue.length,
        sentByType: {},
        sentByEvent: {},
        failureRate: 0,
        averageDeliveryTime: 0,
        lastUpdated: new Date(),
      };

      // Calculate statistics from queue
      this.notificationQueue.forEach(msg => {
        // Count by type (extracted from metadata)
        const type = msg.metadata.type || 'unknown';
        stats.sentByType[type] = (stats.sentByType[type] || 0) + 1;

        // Count by event
        const event = msg.metadata.event || 'unknown';
        stats.sentByEvent[event] = (stats.sentByEvent[event] || 0) + 1;
      });

      return stats;
    } catch (error) {
      logger.error('Failed to get notification statistics:', error);
      throw error;
    }
  }

  // Private helper methods
  private initializeNotificationChannels(): void {
    // Initialize notification channels
    this.notificationChannels.set('email', new EmailNotificationChannel());
    this.notificationChannels.set('slack', new SlackNotificationChannel());
    this.notificationChannels.set('webhook', new WebhookNotificationChannel());
    this.notificationChannels.set('sms', new SMSNotificationChannel());

    logger.info(`Initialized ${this.notificationChannels.size} notification channels`);
  }

  private createNotificationMessage(
    execution: any,
    pipeline: any,
    event: string,
    data?: Record<string, any>
  ): NotificationMessage {
    const message: NotificationMessage = {
      id: uuidv4(),
      title: this.generateNotificationTitle(event, pipeline.name, execution.version),
      content: this.generateNotificationContent(event, execution, pipeline, data),
      severity: this.getEventSeverity(event),
      timestamp: new Date(),
      metadata: {
        event,
        pipeline: pipeline.id,
        pipelineName: pipeline.name,
        execution: execution.id,
        version: execution.version,
        triggeredBy: execution.triggeredBy,
        strategy: execution.strategy,
        ...data,
      },
    };

    return message;
  }

  private generateNotificationTitle(event: string, pipelineName: string, version: string): string {
    const eventTitles: Record<string, string> = {
      'deployment-started': `🚀 Deployment Started`,
      'deployment-completed': `✅ Deployment Completed`,
      'deployment-failed': `❌ Deployment Failed`,
      'deployment-cancelled': `⏹️ Deployment Cancelled`,
      'approval-required': `⏳ Approval Required`,
      'rollback-initiated': `🔄 Rollback Initiated`,
    };

    const title = eventTitles[event] || `📢 Deployment Event`;
    return `${title}: ${pipelineName} (${version})`;
  }

  private generateNotificationContent(
    event: string,
    execution: any,
    pipeline: any,
    data?: Record<string, any>
  ): string {
    const baseInfo = [
      `Pipeline: ${pipeline.name}`,
      `Version: ${execution.version}`,
      `Strategy: ${execution.strategy}`,
      `Triggered by: ${execution.triggeredBy}`,
      `Started: ${execution.triggeredAt.toISOString()}`,
    ];

    let eventSpecificInfo: string[] = [];

    switch (event) {
      case 'deployment-started':
        eventSpecificInfo = [
          `Estimated duration: ${data?.estimatedDuration ? Math.round(data.estimatedDuration / 60000) : 'Unknown'} minutes`,
          `Stages: ${pipeline.stages.length}`,
        ];
        break;

      case 'deployment-completed':
        eventSpecificInfo = [
          `Duration: ${data?.duration ? Math.round(data.duration / 60000) : 'Unknown'} minutes`,
          `Status: Success ✅`,
        ];
        break;

      case 'deployment-failed':
        eventSpecificInfo = [
          `Duration: ${data?.duration ? Math.round(data.duration / 60000) : 'Unknown'} minutes`,
          `Error: ${data?.error || 'Unknown error'}`,
          `Status: Failed ❌`,
        ];
        break;

      case 'deployment-cancelled':
        eventSpecificInfo = [
          `Reason: ${data?.reason || 'No reason provided'}`,
          `Status: Cancelled ⏹️`,
        ];
        break;

      case 'approval-required':
        eventSpecificInfo = [
          `Stage: ${data?.stage || 'Unknown'}`,
          `Approvers: ${data?.approvers?.join(', ') || 'Unknown'}`,
          `Required approvals: ${data?.requiredApprovals || 1}`,
        ];
        break;

      case 'rollback-initiated':
        eventSpecificInfo = [
          `Reason: ${data?.reason || 'Unknown'}`,
          `Target version: ${data?.targetVersion || 'Previous'}`,
          `Initiated by: ${data?.initiatedBy || 'System'}`,
        ];
        break;
    }

    return [...baseInfo, '', ...eventSpecificInfo].join('\n');
  }

  private getEventSeverity(event: string): 'info' | 'warning' | 'error' | 'critical' {
    const severityMap: Record<string, 'info' | 'warning' | 'error' | 'critical'> = {
      'deployment-started': 'info',
      'deployment-completed': 'info',
      'deployment-failed': 'error',
      'deployment-cancelled': 'warning',
      'approval-required': 'warning',
      'rollback-initiated': 'critical',
    };

    return severityMap[event] || 'info';
  }

  private async sendToChannel(configuration: NotificationConfiguration, message: NotificationMessage): Promise<void> {
    try {
      const channel = this.notificationChannels.get(configuration.type);
      if (!channel) {
        throw new Error(`Notification channel ${configuration.type} not found`);
      }

      // Add channel-specific metadata
      message.metadata.type = configuration.type;
      message.metadata.recipients = configuration.recipients;

      await channel.send(message, configuration);

      // Add to queue for history
      this.notificationQueue.push(message);

      // Limit queue size
      if (this.notificationQueue.length > 1000) {
        this.notificationQueue = this.notificationQueue.slice(-500);
      }

      logger.debug(`Sent notification via ${configuration.type}`, {
        messageId: message.id,
        recipients: configuration.recipients.length,
      });
    } catch (error) {
      logger.error(`Failed to send notification via ${configuration.type}:`, error);
      throw error;
    }
  }

  private async validateNotificationConfiguration(configuration: NotificationConfiguration): Promise<string[]> {
    const errors: string[] = [];

    if (!configuration.type) {
      errors.push('Notification type is required');
    }

    if (!configuration.recipients || configuration.recipients.length === 0) {
      errors.push('At least one recipient is required');
    }

    if (!configuration.events || configuration.events.length === 0) {
      errors.push('At least one event must be configured');
    }

    // Type-specific validation
    switch (configuration.type) {
      case 'email':
        errors.push(...this.validateEmailConfiguration(configuration));
        break;
      case 'slack':
        errors.push(...this.validateSlackConfiguration(configuration));
        break;
      case 'webhook':
        errors.push(...this.validateWebhookConfiguration(configuration));
        break;
      case 'sms':
        errors.push(...this.validateSMSConfiguration(configuration));
        break;
    }

    return errors;
  }

  private validateEmailConfiguration(configuration: NotificationConfiguration): string[] {
    const errors: string[] = [];

    configuration.recipients.forEach(recipient => {
      if (!recipient.includes('@')) {
        errors.push(`Invalid email address: ${recipient}`);
      }
    });

    return errors;
  }

  private validateSlackConfiguration(configuration: NotificationConfiguration): string[] {
    const errors: string[] = [];

    if (!configuration.configuration?.webhook) {
      errors.push('Slack webhook URL is required');
    }

    return errors;
  }

  private validateWebhookConfiguration(configuration: NotificationConfiguration): string[] {
    const errors: string[] = [];

    if (!configuration.configuration?.url) {
      errors.push('Webhook URL is required');
    }

    return errors;
  }

  private validateSMSConfiguration(configuration: NotificationConfiguration): string[] {
    const errors: string[] = [];

    configuration.recipients.forEach(recipient => {
      if (!/^\+?[\d\s-()]+$/.test(recipient)) {
        errors.push(`Invalid phone number: ${recipient}`);
      }
    });

    return errors;
  }
}

// Notification channel interfaces and implementations
interface NotificationChannel {
  send(message: NotificationMessage, configuration: NotificationConfiguration): Promise<void>;
}

interface NotificationMessage {
  id: string;
  title: string;
  content: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  timestamp: Date;
  metadata: Record<string, any>;
}

interface NotificationStatistics {
  totalSent: number;
  sentByType: Record<string, number>;
  sentByEvent: Record<string, number>;
  failureRate: number;
  averageDeliveryTime: number;
  lastUpdated: Date;
}

// Mock notification channel implementations
class EmailNotificationChannel implements NotificationChannel {
  async send(message: NotificationMessage, configuration: NotificationConfiguration): Promise<void> {
    // Simulate email sending
    await new Promise(resolve => setTimeout(resolve, 500));
    logger.info(`Email notification sent`, {
      messageId: message.id,
      recipients: configuration.recipients,
      title: message.title,
    });
  }
}

class SlackNotificationChannel implements NotificationChannel {
  async send(message: NotificationMessage, configuration: NotificationConfiguration): Promise<void> {
    // Simulate Slack webhook call
    await new Promise(resolve => setTimeout(resolve, 300));
    logger.info(`Slack notification sent`, {
      messageId: message.id,
      channels: configuration.recipients,
      title: message.title,
    });
  }
}

class WebhookNotificationChannel implements NotificationChannel {
  async send(message: NotificationMessage, configuration: NotificationConfiguration): Promise<void> {
    // Simulate webhook call
    await new Promise(resolve => setTimeout(resolve, 400));
    logger.info(`Webhook notification sent`, {
      messageId: message.id,
      url: configuration.configuration?.url,
      title: message.title,
    });
  }
}

class SMSNotificationChannel implements NotificationChannel {
  async send(message: NotificationMessage, configuration: NotificationConfiguration): Promise<void> {
    // Simulate SMS sending
    await new Promise(resolve => setTimeout(resolve, 600));
    logger.info(`SMS notification sent`, {
      messageId: message.id,
      recipients: configuration.recipients,
      title: message.title,
    });
  }
}