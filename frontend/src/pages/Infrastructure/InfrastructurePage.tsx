import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import {
  Storage as StorageIcon,
  Timeline as TimelineIcon,
  Policy as PolicyIcon,
  Assessment as AssessmentIcon,
  CloudQueue as CloudIcon,
  Computer as ComputeIcon,
  NetworkCheck as NetworkIcon,
} from '@mui/icons-material';
import { GlassCard } from '../../components/common/GlassCard';
import { GlassButton } from '../../components/common/GlassButton';

interface TabItem {
  id: string;
  label: string;
  icon: React.ReactElement;
  content: React.ReactNode;
}

export const InfrastructurePage: React.FC = () => {
  const { theme } = useSelector((state: any) => state.ui);
  const isDark = theme === 'dark';
  const location = useLocation();
  
  // Determine active tab from URL
  const getActiveTabFromPath = () => {
    const path = location.pathname;
    if (path.includes('/resources')) return 'resources';
    if (path.includes('/templates')) return 'templates';
    if (path.includes('/policies')) return 'policies';
    if (path.includes('/compliance')) return 'compliance';
    return 'overview';
  };

  const [activeTab, setActiveTab] = useState(getActiveTabFromPath());

  const tabs: TabItem[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <CloudIcon />,
      content: <InfrastructureOverview isDark={isDark} />,
    },
    {
      id: 'resources',
      label: 'Resources',
      icon: <StorageIcon />,
      content: <ResourcesTab isDark={isDark} />,
    },
    {
      id: 'templates',
      label: 'Templates',
      icon: <TimelineIcon />,
      content: <TemplatesTab isDark={isDark} />,
    },
    {
      id: 'policies',
      label: 'Policies',
      icon: <PolicyIcon />,
      content: <PoliciesTab isDark={isDark} />,
    },
    {
      id: 'compliance',
      label: 'Compliance',
      icon: <AssessmentIcon />,
      content: <ComplianceTab isDark={isDark} />,
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
          background: 'linear-gradient(135deg, #10B981 0%, #059669 50%, #047857 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          Infrastructure Management
        </h1>
        <p style={{ 
          fontSize: '16px', 
          opacity: 0.7,
          margin: 0,
          color: isDark ? '#ffffff' : '#666666',
        }}>
          Manage your cloud infrastructure, resources, and compliance policies.
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
                border: activeTab === tab.id ? '1px solid #10B981' : 'none',
                background: activeTab === tab.id 
                  ? (isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)')
                  : 'rgba(0, 0, 0, 0)',
                color: activeTab === tab.id ? '#10B981' : (isDark ? '#ffffff' : '#666666'),
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
const InfrastructureOverview: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const stats = [
    { title: 'Total Resources', value: '156', change: '+12', trend: 'up', icon: <StorageIcon /> },
    { title: 'Active Instances', value: '24', change: '+3', trend: 'up', icon: <ComputeIcon /> },
    { title: 'Networks', value: '8', change: '0', trend: 'stable', icon: <NetworkIcon /> },
    { title: 'Compliance Score', value: '94%', change: '+2%', trend: 'up', icon: <AssessmentIcon /> },
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
              <div style={{ color: '#10B981', marginBottom: '12px', fontSize: '24px' }}>
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
          <h2 style={{ color: isDark ? '#ffffff' : '#000000', marginBottom: '20px' }}>Resource Distribution</h2>
          <div style={{ color: isDark ? '#ffffff' : '#666666' }}>
            <p>EC2 Instances: 24 (15%)</p>
            <p>S3 Buckets: 45 (29%)</p>
            <p>RDS Databases: 8 (5%)</p>
            <p>Lambda Functions: 79 (51%)</p>
          </div>
        </GlassCard>

        <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '20px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` }}>
          <h2 style={{ color: isDark ? '#ffffff' : '#000000', marginBottom: '20px' }}>Recent Changes</h2>
          <div style={{ color: isDark ? '#ffffff' : '#666666' }}>
            <p>• New EC2 instance launched in us-west-2</p>
            <p>• S3 bucket policy updated</p>
            <p>• RDS backup completed successfully</p>
            <p>• Lambda function deployed</p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

const ResourcesTab: React.FC<{ isDark: boolean }> = ({ isDark }) => (
  <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '20px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` }}>
    <h2 style={{ color: isDark ? '#ffffff' : '#000000', marginBottom: '20px' }}>Resource Management</h2>
    <div style={{ color: isDark ? '#ffffff' : '#666666' }}>
      <p>Manage your cloud resources across all providers</p>
      <p>• View resource inventory</p>
      <p>• Monitor resource utilization</p>
      <p>• Optimize resource allocation</p>
      <p>• Track resource costs</p>
    </div>
  </GlassCard>
);

const TemplatesTab: React.FC<{ isDark: boolean }> = ({ isDark }) => (
  <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '20px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` }}>
    <h2 style={{ color: isDark ? '#ffffff' : '#000000', marginBottom: '20px' }}>Infrastructure Templates</h2>
    <div style={{ color: isDark ? '#ffffff' : '#666666' }}>
      <p>Create and manage infrastructure templates</p>
      <p>• CloudFormation templates</p>
      <p>• Terraform configurations</p>
      <p>• Kubernetes manifests</p>
      <p>• Custom deployment templates</p>
    </div>
  </GlassCard>
);

const PoliciesTab: React.FC<{ isDark: boolean }> = ({ isDark }) => (
  <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '20px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` }}>
    <h2 style={{ color: isDark ? '#ffffff' : '#000000', marginBottom: '20px' }}>Policy Management</h2>
    <div style={{ color: isDark ? '#ffffff' : '#666666' }}>
      <p>Define and enforce infrastructure policies</p>
      <p>• Security policies</p>
      <p>• Cost optimization policies</p>
      <p>• Resource tagging policies</p>
      <p>• Compliance policies</p>
    </div>
  </GlassCard>
);

const ComplianceTab: React.FC<{ isDark: boolean }> = ({ isDark }) => (
  <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '20px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` }}>
    <h2 style={{ color: isDark ? '#ffffff' : '#000000', marginBottom: '20px' }}>Compliance Monitoring</h2>
    <div style={{ color: isDark ? '#ffffff' : '#666666' }}>
      <p>Monitor compliance across your infrastructure</p>
      <p>• SOC 2 compliance: 98%</p>
      <p>• ISO 27001 compliance: 95%</p>
      <p>• GDPR compliance: 100%</p>
      <p>• Custom compliance rules: 92%</p>
    </div>
  </GlassCard>
);

export default InfrastructurePage;