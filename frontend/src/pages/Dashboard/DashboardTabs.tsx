import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { Icon } from '../../components/common/Icon';
import { GlassCard } from '../../components/common/GlassCard';
import { GlassButton } from '../../components/common/GlassButton';

interface TabItem {
  id: string;
  label: string;
  icon: React.ReactElement;
  content: React.ReactNode;
}

export const DashboardTabs: React.FC = () => {
  const { theme } = useSelector((state: any) => state.ui);
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState('overview');

  const tabs: TabItem[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <Icon name="nav-dashboard" size="sm" />,
      content: <OverviewTab isDark={isDark} />,
    },
    {
      id: 'performance',
      label: 'Performance',
      icon: <Icon name="monitor-pulse" size="sm" />,
      content: <PerformanceTab isDark={isDark} />,
    },
    {
      id: 'costs',
      label: 'Costs',
      icon: <Icon name="monitor-line-chart" size="sm" />,
      content: <CostsTab isDark={isDark} />,
    },
    {
      id: 'security',
      label: 'Security',
      icon: <Icon name="security-shield" size="sm" />,
      content: <SecurityTab isDark={isDark} />,
    },
    {
      id: 'infrastructure',
      label: 'Infrastructure',
      icon: <Icon name="cloud-server" size="sm" />,
      content: <InfrastructureTab isDark={isDark} />,
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: <Icon name="cost-report" size="sm" />,
      content: <ReportsTab isDark={isDark} />,
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
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
                borderWidth: activeTab === tab.id ? '1px' : '0px',
                borderStyle: activeTab === tab.id ? 'solid' : 'none',
                borderColor: activeTab === tab.id ? '#7C3AED' : 'transparent',
                background: activeTab === tab.id 
                  ? (isDark ? 'rgba(124, 58, 237, 0.2)' : 'rgba(124, 58, 237, 0.1)')
                  : 'rgba(0, 0, 0, 0)',
                color: activeTab === tab.id ? '#7C3AED' : (isDark ? '#ffffff' : '#666666'),
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
const OverviewTab: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const stats = [
    { title: 'Active Resources', value: '24', change: '+12%', trend: 'up' },
    { title: 'Deployments', value: '8', change: '+5%', trend: 'up' },
    { title: 'Cost This Month', value: '$1,234', change: '-8%', trend: 'down' },
    { title: 'Uptime', value: '99.9%', change: '+0.1%', trend: 'up' },
  ];

  return (
    <div>
      {/* Stats Grid */}
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
                color: stat.trend === 'up' ? '#10B981' : '#EF4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
              }}>
                <span>{stat.change}</span>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '24px',
      }}>
        {/* Recent Activity */}
        <GlassCard
          variant="card"
          elevation="medium"
          isDark={isDark}
          style={{
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
            borderRadius: '20px',
          }}
        >
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: 600, 
            margin: '0 0 20px 0',
            color: isDark ? '#ffffff' : '#000000',
          }}>
            Recent Activity
          </h2>
          <div>
            {[
              'Deployment "web-app-v2" completed successfully',
              'New EC2 instance launched in us-east-1',
              'Cost alert: Monthly budget 80% reached',
              'Security scan completed - no issues found',
              'Auto-scaling triggered for production cluster',
            ].map((activity, index) => (
              <div
                key={index}
                style={{
                  padding: '16px 0',
                  borderBottom: index < 4 ? `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` : 'none',
                  color: isDark ? '#ffffff' : '#000000',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#7C3AED',
                  flexShrink: 0,
                }} />
                {activity}
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Quick Actions */}
        <GlassCard
          variant="card"
          elevation="medium"
          isDark={isDark}
          style={{
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
            borderRadius: '20px',
          }}
        >
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: 600, 
            margin: '0 0 20px 0',
            color: isDark ? '#ffffff' : '#000000',
          }}>
            Quick Actions
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              'Deploy New Application',
              'Launch EC2 Instance',
              'Create S3 Bucket',
              'View Cost Report',
              'Security Scan',
            ].map((action, index) => (
              <GlassButton
                key={index}
                variant="ghost"
                size="small"
                isDark={isDark}
                style={{
                  justifyContent: 'flex-start',
                  padding: '16px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
                }}
              >
                {action}
              </GlassButton>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

const PerformanceTab: React.FC<{ isDark: boolean }> = ({ isDark }) => (
  <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '20px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` }}>
    <h2 style={{ color: isDark ? '#ffffff' : '#000000', marginBottom: '20px' }}>Performance Metrics</h2>
    <div style={{ color: isDark ? '#ffffff' : '#666666' }}>
      <p>CPU Usage: 45%</p>
      <p>Memory Usage: 62%</p>
      <p>Network I/O: 1.2 GB/s</p>
      <p>Response Time: 120ms</p>
    </div>
  </GlassCard>
);

const CostsTab: React.FC<{ isDark: boolean }> = ({ isDark }) => (
  <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '20px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` }}>
    <h2 style={{ color: isDark ? '#ffffff' : '#000000', marginBottom: '20px' }}>Cost Analysis</h2>
    <div style={{ color: isDark ? '#ffffff' : '#666666' }}>
      <p>This Month: $1,234</p>
      <p>Last Month: $1,342</p>
      <p>Projected: $1,180</p>
      <p>Savings: $162 (12%)</p>
    </div>
  </GlassCard>
);

const SecurityTab: React.FC<{ isDark: boolean }> = ({ isDark }) => (
  <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '20px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` }}>
    <h2 style={{ color: isDark ? '#ffffff' : '#000000', marginBottom: '20px' }}>Security Overview</h2>
    <div style={{ color: isDark ? '#ffffff' : '#666666' }}>
      <p>Security Score: 98/100</p>
      <p>Vulnerabilities: 0 Critical, 2 Medium</p>
      <p>Last Scan: 2 hours ago</p>
      <p>Compliance: SOC2, ISO27001</p>
    </div>
  </GlassCard>
);

const InfrastructureTab: React.FC<{ isDark: boolean }> = ({ isDark }) => (
  <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '20px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` }}>
    <h2 style={{ color: isDark ? '#ffffff' : '#000000', marginBottom: '20px' }}>Infrastructure Status</h2>
    <div style={{ color: isDark ? '#ffffff' : '#666666' }}>
      <p>EC2 Instances: 12 running</p>
      <p>Load Balancers: 3 active</p>
      <p>Databases: 2 RDS, 1 DynamoDB</p>
      <p>Storage: 2.4 TB used</p>
    </div>
  </GlassCard>
);

const ReportsTab: React.FC<{ isDark: boolean }> = ({ isDark }) => (
  <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '20px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` }}>
    <h2 style={{ color: isDark ? '#ffffff' : '#000000', marginBottom: '20px' }}>Reports & Analytics</h2>
    <div style={{ color: isDark ? '#ffffff' : '#666666' }}>
      <p>Monthly Report: Available</p>
      <p>Cost Optimization: 15 recommendations</p>
      <p>Performance Trends: Improving</p>
      <p>Security Audit: Scheduled for next week</p>
    </div>
  </GlassCard>
);

export default DashboardTabs;