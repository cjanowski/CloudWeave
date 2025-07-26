import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import {
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
  NotificationsActive as AlertIcon,
  TrendingUp as TrendingIcon,
  Speed as PerformanceIcon,
  BarChart as MetricsIcon,
} from '@mui/icons-material';
import { GlassCard } from '../../components/common/GlassCard';
import { GlassButton } from '../../components/common/GlassButton';

interface TabItem {
  id: string;
  label: string;
  icon: React.ReactElement;
  content: React.ReactNode;
}

export const MonitoringPage: React.FC = () => {
  const { theme } = useSelector((state: any) => state.ui);
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState('overview');

  const tabs: TabItem[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <AssessmentIcon />,
      content: <MonitoringOverview isDark={isDark} />,
    },
    {
      id: 'metrics',
      label: 'Metrics',
      icon: <MetricsIcon />,
      content: <MetricsTab isDark={isDark} />,
    },
    {
      id: 'alerts',
      label: 'Alerts',
      icon: <AlertIcon />,
      content: <AlertsTab isDark={isDark} />,
    },
    {
      id: 'performance',
      label: 'Performance',
      icon: <PerformanceIcon />,
      content: <PerformanceTab isDark={isDark} />,
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ marginBottom: '24px' }}
      >
        <h1 style={{ 
          fontSize: '32px', 
          fontWeight: 'bold', 
          margin: '0 0 8px 0',
          color: isDark ? '#ffffff' : '#000000',
          background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 50%, #B45309 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          Monitoring & Observability
        </h1>
        <p style={{ 
          fontSize: '16px', 
          opacity: 0.7,
          margin: 0,
          color: isDark ? '#ffffff' : '#666666',
        }}>
          Monitor your infrastructure performance, metrics, and alerts.
        </p>
      </motion.div>

      {/* Tab Navigation */}
      <GlassCard
        variant="navigation"
        elevation="low"
        isDark={isDark}
        animate={false}
        style={{
          marginBottom: '24px',
          padding: '8px',
          borderRadius: '20px',
          border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
        }}
      >
        <div style={{
          display: 'flex',
          gap: '4px',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}>
          {tabs.map((tab) => (
            <GlassButton
              key={tab.id}
              variant={activeTab === tab.id ? 'primary' : 'ghost'}
              size="small"
              isDark={isDark}
              icon={tab.icon}
              onClick={() => setActiveTab(tab.id)}
              style={{
                minWidth: 'auto',
                padding: '12px 20px',
                borderRadius: '16px',
                fontSize: '14px',
                fontWeight: activeTab === tab.id ? 600 : 400,
                border: activeTab === tab.id ? '1px solid #F59E0B' : 'none',
                background: activeTab === tab.id 
                  ? (isDark ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.1)')
                  : 'rgba(0, 0, 0, 0)',
                color: activeTab === tab.id ? '#F59E0B' : (isDark ? '#ffffff' : '#666666'),
                transition: 'all 0.2s ease-in-out',
              }}
            >
              {tab.label}
            </GlassButton>
          ))}
        </div>
      </GlassCard>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {tabs.find(tab => tab.id === activeTab)?.content}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// Tab Content Components
const MonitoringOverview: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const stats = [
    { title: 'System Health', value: '98.5%', change: '+0.2%', trend: 'up', icon: <PerformanceIcon /> },
    { title: 'Active Alerts', value: '3', change: '-2', trend: 'down', icon: <AlertIcon /> },
    { title: 'Response Time', value: '245ms', change: '-15ms', trend: 'up', icon: <TimelineIcon /> },
    { title: 'Uptime', value: '99.9%', change: '0%', trend: 'stable', icon: <TrendingIcon /> },
  ];

  return (
    <div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px',
        marginBottom: '32px',
      }}>
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <GlassCard
              variant="card"
              elevation="medium"
              isDark={isDark}
              style={{
                textAlign: 'center',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
                borderRadius: '20px',
              }}
            >
              <div style={{ color: '#F59E0B', marginBottom: '12px', fontSize: '24px' }}>
                {stat.icon}
              </div>
              <h3 style={{ 
                fontSize: '14px', 
                fontWeight: 500, 
                margin: '0 0 12px 0',
                opacity: 0.7,
                color: isDark ? '#ffffff' : '#666666',
              }}>
                {stat.title}
              </h3>
              <div style={{ 
                fontSize: '32px', 
                fontWeight: 'bold', 
                margin: '0 0 8px 0',
                color: isDark ? '#ffffff' : '#000000',
              }}>
                {stat.value}
              </div>
              <div style={{ 
                fontSize: '14px',
                fontWeight: 500,
                color: stat.trend === 'up' ? '#10B981' : stat.trend === 'down' ? '#EF4444' : '#6B7280',
              }}>
                {stat.change}
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px',
      }}>
        <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '20px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` }}>
          <h2 style={{ color: isDark ? '#ffffff' : '#000000', marginBottom: '20px' }}>System Performance</h2>
          <div style={{ color: isDark ? '#ffffff' : '#666666' }}>
            <p>CPU Usage: 45% (Normal)</p>
            <p>Memory Usage: 62% (Normal)</p>
            <p>Disk I/O: 23% (Low)</p>
            <p>Network Traffic: 1.2 GB/s (Normal)</p>
          </div>
        </GlassCard>

        <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '20px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` }}>
          <h2 style={{ color: isDark ? '#ffffff' : '#000000', marginBottom: '20px' }}>Recent Alerts</h2>
          <div style={{ color: isDark ? '#ffffff' : '#666666' }}>
            <p>• High memory usage on web-server-01</p>
            <p>• SSL certificate expires in 30 days</p>
            <p>• Database connection pool at 80%</p>
            <p>• Disk space warning on backup server</p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

const MetricsTab: React.FC<{ isDark: boolean }> = ({ isDark }) => (
  <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '20px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` }}>
    <h2 style={{ color: isDark ? '#ffffff' : '#000000', marginBottom: '20px' }}>System Metrics</h2>
    <div style={{ color: isDark ? '#ffffff' : '#666666' }}>
      <p>View detailed system and application metrics</p>
      <p>• CPU and memory utilization</p>
      <p>• Network and disk I/O</p>
      <p>• Application performance metrics</p>
      <p>• Custom business metrics</p>
    </div>
  </GlassCard>
);

const AlertsTab: React.FC<{ isDark: boolean }> = ({ isDark }) => (
  <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '20px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` }}>
    <h2 style={{ color: isDark ? '#ffffff' : '#000000', marginBottom: '20px' }}>Alert Management</h2>
    <div style={{ color: isDark ? '#ffffff' : '#666666' }}>
      <p>Configure and manage system alerts</p>
      <p>• Critical: 1 active alert</p>
      <p>• Warning: 2 active alerts</p>
      <p>• Info: 5 notifications</p>
      <p>• Resolved: 23 alerts today</p>
    </div>
  </GlassCard>
);

const PerformanceTab: React.FC<{ isDark: boolean }> = ({ isDark }) => (
  <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '20px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` }}>
    <h2 style={{ color: isDark ? '#ffffff' : '#000000', marginBottom: '20px' }}>Performance Analytics</h2>
    <div style={{ color: isDark ? '#ffffff' : '#666666' }}>
      <p>Analyze system and application performance</p>
      <p>• Response time trends</p>
      <p>• Throughput analysis</p>
      <p>• Error rate monitoring</p>
      <p>• Performance bottleneck identification</p>
    </div>
  </GlassCard>
);

export default MonitoringPage;