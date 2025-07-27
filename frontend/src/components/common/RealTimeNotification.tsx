import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface RealTimeNotification {
  id: string;
  type: 'deployment_status' | 'infrastructure_update' | 'metrics_update' | 'alert_notification' | 'system_message';
  title: string;
  message: string;
  severity?: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  data?: any;
}

interface RealTimeNotificationProps {
  notifications: RealTimeNotification[];
  onDismiss: (id: string) => void;
  maxNotifications?: number;
}

export const RealTimeNotification: React.FC<RealTimeNotificationProps> = ({
  notifications,
  onDismiss,
  maxNotifications = 5,
}) => {
  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'success':
        return '#10B981';
      case 'warning':
        return '#F59E0B';
      case 'error':
        return '#EF4444';
      case 'info':
      default:
        return '#3B82F6';
    }
  };

  const getSeverityIcon = (severity?: string) => {
    switch (severity) {
      case 'success':
        return '✓';
      case 'warning':
        return '⚠';
      case 'error':
        return '✕';
      case 'info':
      default:
        return 'ℹ';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'deployment_status':
        return '🚀';
      case 'infrastructure_update':
        return '🏗️';
      case 'metrics_update':
        return '📊';
      case 'alert_notification':
        return '🚨';
      case 'system_message':
        return '💬';
      default:
        return '📢';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) { // Less than 1 minute
      return 'Just now';
    } else if (diff < 3600000) { // Less than 1 hour
      const minutes = Math.floor(diff / 60000);
      return `${minutes}m ago`;
    } else if (diff < 86400000) { // Less than 1 day
      const hours = Math.floor(diff / 3600000);
      return `${hours}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 1000,
      maxWidth: '400px',
    }}>
      <AnimatePresence>
        {notifications.slice(0, maxNotifications).map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              border: `2px solid ${getSeverityColor(notification.severity)}`,
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '12px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              borderLeft: `4px solid ${getSeverityColor(notification.severity)}`,
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
            }}>
              <div style={{
                fontSize: '20px',
                marginTop: '2px',
              }}>
                {getTypeIcon(notification.type)}
              </div>
              
              <div style={{
                flex: 1,
                minWidth: 0,
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '4px',
                }}>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#1F2937',
                  }}>
                    {notification.title}
                  </span>
                  <span style={{
                    fontSize: '16px',
                    color: getSeverityColor(notification.severity),
                  }}>
                    {getSeverityIcon(notification.severity)}
                  </span>
                </div>
                
                <p style={{
                  fontSize: '13px',
                  color: '#6B7280',
                  margin: '0 0 8px 0',
                  lineHeight: '1.4',
                }}>
                  {notification.message}
                </p>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span style={{
                    fontSize: '11px',
                    color: '#9CA3AF',
                  }}>
                    {formatTime(notification.timestamp)}
                  </span>
                  
                  <button
                    onClick={() => onDismiss(notification.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '16px',
                      color: '#9CA3AF',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '4px',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#EF4444';
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#9CA3AF';
                      e.currentTarget.style.background = 'none';
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}; 