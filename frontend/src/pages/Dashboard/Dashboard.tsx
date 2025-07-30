import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { DashboardTabs } from './DashboardTabs';
import { useWebSocket } from '../../hooks/useWebSocket';
import { RealTimeNotification as RealTimeNotificationComponent, RealTimeNotification as NotificationType } from '../../components/common/RealTimeNotification';
import DemoIndicator from '../../components/common/DemoIndicator';
import './Dashboard.css';

export const Dashboard: React.FC = () => {
  const { theme } = useSelector((state: any) => state.ui);
  const { user } = useSelector((state: any) => state.auth);
  const { isDemo } = useSelector((state: any) => state.demo);
  const isDark = theme === 'dark';
  
  // WebSocket hook for real-time updates
  const { isConnected, isInSimulationMode, onDeploymentStatus, onInfrastructureUpdate, onMetricsUpdate, onAlert } = useWebSocket();
  
  // Real-time notifications state
  const [notifications, setNotifications] = useState<NotificationType[]>([]);

  // WebSocket event handlers
  useEffect(() => {
    // Handle deployment status updates
    const unsubscribeDeployment = onDeploymentStatus((data) => {
      const notification: NotificationType = {
        id: `deployment-${data.deploymentId}-${Date.now()}`,
        type: 'deployment_status',
        title: `Deployment ${data.status}`,
        message: data.message || `Deployment ${data.deploymentId} is now ${data.status}`,
        severity: data.status === 'completed' ? 'success' : 
                 data.status === 'failed' ? 'error' : 
                 data.status === 'running' ? 'info' : 'warning',
        timestamp: new Date().toISOString(),
        data,
      };
      setNotifications(prev => [notification, ...prev]);
    });

    // Handle infrastructure updates
    const unsubscribeInfrastructure = onInfrastructureUpdate((data) => {
      const notification: NotificationType = {
        id: `infrastructure-${data.infrastructureId}-${Date.now()}`,
        type: 'infrastructure_update',
        title: `Infrastructure ${data.status}`,
        message: data.message || `Infrastructure ${data.infrastructureId} is now ${data.status}`,
        severity: data.status === 'running' ? 'success' : 
                 data.status === 'error' ? 'error' : 
                 data.status === 'stopped' ? 'warning' : 'info',
        timestamp: new Date().toISOString(),
        data,
      };
      setNotifications(prev => [notification, ...prev]);
    });

    // Handle metrics updates
    const unsubscribeMetrics = onMetricsUpdate((data) => {
      const notification: NotificationType = {
        id: `metrics-${Date.now()}`,
        type: 'metrics_update',
        title: 'Metrics Updated',
        message: 'Real-time metrics have been updated',
        severity: 'info',
        timestamp: new Date().toISOString(),
        data,
      };
      setNotifications(prev => [notification, ...prev]);
    });

    // Handle alert notifications
    const unsubscribeAlert = onAlert((data) => {
      const notification: NotificationType = {
        id: `alert-${Date.now()}`,
        type: 'alert_notification',
        title: data.title || 'Alert',
        message: data.message || 'A new alert has been triggered',
        severity: data.severity || 'warning',
        timestamp: new Date().toISOString(),
        data,
      };
      setNotifications(prev => [notification, ...prev]);
    });

    return () => {
      unsubscribeDeployment();
      unsubscribeInfrastructure();
      unsubscribeMetrics();
      unsubscribeAlert();
    };
  }, [onDeploymentStatus, onInfrastructureUpdate, onMetricsUpdate, onAlert]);

  return (
    <div style={{
      background: isDark
        ? 'linear-gradient(135deg, #0F0F23 0%, #1A1B3A 25%, #252659 50%, #2D2F73 75%, #3A3D8F 100%)'
        : 'linear-gradient(135deg, #9eb5e7 0%, #afbfea 8%, #bfc9ec 17%, #cdd3ee 25%, #dbdef1 33%, #dce3f6 42%, #dde8fb 50%, #deedff 58%, #cdefff 67%, #b9f1ff 75%, #a7f4fa 83%, #9df5eb 100%)',
      minHeight: '100vh',
    }}>
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ 
          padding: '24px 24px 0 24px',
          marginBottom: '16px',
        }}
      >
        <h1 style={{ 
          fontSize: '32px', 
          fontWeight: 'bold', 
          margin: '0 0 8px 0',
          color: isDark ? '#ffffff' : '#000000',
          background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 50%, #6D28D9 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          Welcome back, {user?.name || 'User'}!
        </h1>
        <div style={{ 
          fontSize: '16px', 
          opacity: 0.7,
          margin: 0,
          color: isDark ? '#ffffff' : '#666666',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          <span>Here's what's happening with your infrastructure today.</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isConnected && (
              <span style={{ 
                color: '#10B981', 
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                ● {isInSimulationMode ? 'Demo updates active' : 'Real-time updates active'}
              </span>
            )}
            {isDemo && <DemoIndicator size="small" inline />}
          </div>
        </div>
      </motion.div>

      {/* Dashboard Tabs */}
      <DashboardTabs />
      
      {/* Real-time Notifications */}
      <RealTimeNotificationComponent
        notifications={notifications}
        onDismiss={(id) => {
          setNotifications(prev => prev.filter(n => n.id !== id));
        }}
        maxNotifications={5}
        isDark={isDark}
      />
    </div>
  );
};

export default Dashboard;