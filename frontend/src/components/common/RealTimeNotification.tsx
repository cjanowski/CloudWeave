import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from './GlassCard';
import { Icon } from './Icon';

// Real-time notification interface for Dashboard compatibility
export interface RealTimeNotification {
  id: string;
  type: 'deployment_status' | 'infrastructure_update' | 'metrics_update' | 'alert_notification';
  title: string;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
  timestamp: string;
  data?: any;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ToastProviderProps {
  children: React.ReactNode;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  maxToasts?: number;
  isDark?: boolean;
}

interface ToastContextType {
  showToast: (toast: Omit<Toast, 'id'>) => void;
  hideToast: (id: string) => void;
  clearAllToasts: () => void;
}

const ToastContext = React.createContext<ToastContextType | null>(null);

export function ToastProvider({
  children,
  position = 'top-right',
  maxToasts = 5,
  isDark = false,
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = {
      id,
      duration: 5000,
      ...toast,
    };

    setToasts(prev => {
      const updated = [newToast, ...prev];
      return updated.slice(0, maxToasts);
    });

    // Auto-hide toast after duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        hideToast(id);
      }, newToast.duration);
    }
  }, [maxToasts]);

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const getPositionStyles = () => {
    const baseStyles = {
      position: 'fixed' as const,
      zIndex: 10000,
      pointerEvents: 'none' as const,
    };

    switch (position) {
      case 'top-right':
        return { ...baseStyles, top: '20px', right: '20px' };
      case 'top-left':
        return { ...baseStyles, top: '20px', left: '20px' };
      case 'bottom-right':
        return { ...baseStyles, bottom: '20px', right: '20px' };
      case 'bottom-left':
        return { ...baseStyles, bottom: '20px', left: '20px' };
      case 'top-center':
        return { ...baseStyles, top: '20px', left: '50%', transform: 'translateX(-50%)' };
      case 'bottom-center':
        return { ...baseStyles, bottom: '20px', left: '50%', transform: 'translateX(-50%)' };
      default:
        return { ...baseStyles, top: '20px', right: '20px' };
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, hideToast, clearAllToasts }}>
      {children}
      <div style={getPositionStyles()}>
        <AnimatePresence>
          {toasts.map((toast, index) => (
            <ToastComponent
              key={toast.id}
              toast={toast}
              onClose={() => hideToast(toast.id)}
              isDark={isDark}
              index={index}
            />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

interface ToastComponentProps {
  toast: Toast;
  onClose: () => void;
  isDark: boolean;
  index: number;
}

function ToastComponent({ toast, onClose, isDark, index }: ToastComponentProps) {
  const [progress, setProgress] = useState(100);

  const typeConfig = {
    success: {
      icon: 'status-success',
      iconColor: '#10B981',
      borderColor: '#10B981',
    },
    error: {
      icon: 'status-error',
      iconColor: '#EF4444',
      borderColor: '#EF4444',
    },
    warning: {
      icon: 'status-warning',
      iconColor: '#F59E0B',
      borderColor: '#F59E0B',
    },
    info: {
      icon: 'status-info',
      iconColor: '#3B82F6',
      borderColor: '#3B82F6',
    },
  };

  const config = typeConfig[toast.type];

  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev - (100 / (toast.duration! / 100));
          return Math.max(0, newProgress);
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [toast.duration]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.9 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      style={{
        marginBottom: '12px',
        pointerEvents: 'auto',
        maxWidth: '400px',
        minWidth: '300px',
      }}
    >
      <GlassCard
        isDark={isDark}
        style={{
          borderLeft: `4px solid ${config.borderColor}`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '16px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
          }}>
            <Icon
              name={config.icon}
              size="md"
              color={config.iconColor}
              style={{ marginTop: '2px', flexShrink: 0 }}
            />
            
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: isDark ? '#ffffff' : '#333333',
                marginBottom: toast.message ? '4px' : '0',
              }}>
                {toast.title}
              </div>
              
              {toast.message && (
                <div style={{
                  fontSize: '13px',
                  color: isDark ? '#cccccc' : '#666666',
                  lineHeight: '1.4',
                }}>
                  {toast.message}
                </div>
              )}
              
              {toast.action && (
                <button
                  onClick={toast.action.onClick}
                  style={{
                    marginTop: '8px',
                    padding: '4px 8px',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: config.iconColor,
                    backgroundColor: 'transparent',
                    border: `1px solid ${config.iconColor}`,
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  {toast.action.label}
                </button>
              )}
            </div>
            
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                color: isDark ? '#666666' : '#999999',
                flexShrink: 0,
              }}
            >
              <Icon name="status-x" size="sm" />
            </button>
          </div>
        </div>
        
        {toast.duration && toast.duration > 0 && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              height: '2px',
              backgroundColor: config.borderColor,
              width: `${progress}%`,
              transition: 'width 0.1s linear',
            }}
          />
        )}
      </GlassCard>
    </motion.div>
  );
}

// Hook for using toasts
export function useToast() {
  const context = React.useContext(ToastContext);
  
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  const { showToast, hideToast, clearAllToasts } = context;

  const toast = {
    success: (title: string, message?: string, options?: Partial<Toast>) =>
      showToast({ type: 'success', title, message, ...options }),
    
    error: (title: string, message?: string, options?: Partial<Toast>) =>
      showToast({ type: 'error', title, message, ...options }),
    
    warning: (title: string, message?: string, options?: Partial<Toast>) =>
      showToast({ type: 'warning', title, message, ...options }),
    
    info: (title: string, message?: string, options?: Partial<Toast>) =>
      showToast({ type: 'info', title, message, ...options }),
  };

  return {
    toast,
    hideToast,
    clearAllToasts,
  };
}

// Real-time Notification Component for Dashboard
export interface RealTimeNotificationProps {
  notifications: RealTimeNotification[];
  onDismiss: (id: string) => void;
  maxNotifications?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  isDark?: boolean;
}

export function RealTimeNotification({
  notifications,
  onDismiss,
  maxNotifications = 5,
  position = 'top-right',
  isDark = false,
}: RealTimeNotificationProps) {
  const visibleNotifications = notifications.slice(0, maxNotifications);

  const getPositionStyles = () => {
    const baseStyles = {
      position: 'fixed' as const,
      zIndex: 10000,
      pointerEvents: 'none' as const,
    };

    switch (position) {
      case 'top-right':
        return { ...baseStyles, top: '20px', right: '20px' };
      case 'top-left':
        return { ...baseStyles, top: '20px', left: '20px' };
      case 'bottom-right':
        return { ...baseStyles, bottom: '20px', right: '20px' };
      case 'bottom-left':
        return { ...baseStyles, bottom: '20px', left: '20px' };
      default:
        return { ...baseStyles, top: '20px', right: '20px' };
    }
  };

  const getNotificationIcon = (type: string, severity: string) => {
    switch (type) {
      case 'deployment_status':
        return severity === 'success' ? 'status-check-circle' : 
               severity === 'error' ? 'status-warning' : 'deploy-rocket';
      case 'infrastructure_update':
        return 'cloud-server';
      case 'metrics_update':
        return 'monitor-chart';
      case 'alert_notification':
        return 'status-warning';
      default:
        return 'status-info';
    }
  };

  const getNotificationColor = (severity: string) => {
    switch (severity) {
      case 'success':
        return '#10B981';
      case 'error':
        return '#EF4444';
      case 'warning':
        return '#F59E0B';
      case 'info':
      default:
        return '#3B82F6';
    }
  };

  return (
    <div style={getPositionStyles()}>
      <AnimatePresence>
        {visibleNotifications.map((notification, index) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 300, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.9 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            style={{
              marginBottom: '12px',
              pointerEvents: 'auto',
              maxWidth: '400px',
              minWidth: '300px',
            }}
          >
            <GlassCard
              isDark={isDark}
              style={{
                borderLeft: `4px solid ${getNotificationColor(notification.severity)}`,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '16px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                }}>
                  <Icon
                    name={getNotificationIcon(notification.type, notification.severity)}
                    size="md"
                    color={getNotificationColor(notification.severity)}
                    style={{ marginTop: '2px', flexShrink: 0 }}
                  />
                  
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: isDark ? '#ffffff' : '#333333',
                      marginBottom: '4px',
                    }}>
                      {notification.title}
                    </div>
                    
                    <div style={{
                      fontSize: '13px',
                      color: isDark ? '#cccccc' : '#666666',
                      lineHeight: '1.4',
                      marginBottom: '8px',
                    }}>
                      {notification.message}
                    </div>

                    <div style={{
                      fontSize: '11px',
                      color: isDark ? '#666666' : '#999999',
                    }}>
                      {new Date(notification.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => onDismiss(notification.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      color: isDark ? '#666666' : '#999999',
                      flexShrink: 0,
                    }}
                  >
                    <Icon name="status-x" size="sm" />
                  </button>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}