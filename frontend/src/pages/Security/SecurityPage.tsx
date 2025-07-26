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

export const SecurityPage: React.FC = () => {
  const { theme } = useSelector((state: any) => state.ui);
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState('overview');

  const tabs: TabItem[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <Icon name="security-shield" size="md" />,
      content: <SecurityOverview isDark={isDark} />,
    },
    {
      id: 'policies',
      label: 'Policies',
      icon: <Icon name="security-audit" size="md" />,
      content: <PoliciesTab isDark={isDark} />,
    },
    {
      id: 'compliance',
      label: 'Compliance',
      icon: <Icon name="monitor-chart" size="md" />,
      content: <ComplianceTab isDark={isDark} />,
    },
    {
      id: 'vulnerabilities',
      label: 'Vulnerabilities',
      icon: <Icon name="status-warning" size="md" />,
      content: <VulnerabilitiesTab isDark={isDark} />,
    },
    {
      id: 'audit',
      label: 'Audit Logs',
      icon: <Icon name="security-audit" size="md" />,
      content: <AuditTab isDark={isDark} />,
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
          background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 50%, #B91C1C 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          Security & Compliance
        </h1>
        <p style={{ 
          fontSize: '16px', 
          opacity: 0.7,
          margin: 0,
          color: isDark ? '#ffffff' : '#666666',
        }}>
          Monitor security posture, compliance status, and vulnerability management.
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
                border: activeTab === tab.id ? '1px solid #EF4444' : 'none',
                background: activeTab === tab.id 
                  ? (isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)')
                  : 'rgba(0, 0, 0, 0)',
                color: activeTab === tab.id ? '#EF4444' : (isDark ? '#ffffff' : '#666666'),
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
const SecurityOverview: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const stats = [
    { title: 'Security Score', value: '94%', change: '+2%', trend: 'up', icon: <Icon name="security-shield" size="lg" /> },
    { title: 'Active Vulnerabilities', value: '3', change: '-5', trend: 'down', icon: <Icon name="status-warning" size="lg" /> },
    { title: 'Compliance Rate', value: '98%', change: '+1%', trend: 'up', icon: <Icon name="monitor-chart" size="lg" /> },
    { title: 'Policy Violations', value: '1', change: '-2', trend: 'down', icon: <Icon name="security-audit" size="lg" /> },
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
              <div style={{ color: '#EF4444', marginBottom: '12px', fontSize: '24px' }}>
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
          <h2 style={{ color: isDark ? '#ffffff' : '#000000', marginBottom: '20px' }}>Security Alerts</h2>
          <div style={{ color: isDark ? '#ffffff' : '#666666' }}>
            <p>• Unusual login activity detected</p>
            <p>• SSL certificate expires in 15 days</p>
            <p>• Failed authentication attempts: 12</p>
            <p>• Firewall rule update required</p>
          </div>
        </GlassCard>

        <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '20px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` }}>
          <h2 style={{ color: isDark ? '#ffffff' : '#000000', marginBottom: '20px' }}>Compliance Status</h2>
          <div style={{ color: isDark ? '#ffffff' : '#666666' }}>
            <p>SOC 2 Type II: Compliant</p>
            <p>ISO 27001: Compliant</p>
            <p>GDPR: Compliant</p>
            <p>HIPAA: Under Review</p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

const PoliciesTab: React.FC<{ isDark: boolean }> = ({ isDark }) => (
  <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '20px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` }}>
    <h2 style={{ color: isDark ? '#ffffff' : '#000000', marginBottom: '20px' }}>Security Policies</h2>
    <div style={{ color: isDark ? '#ffffff' : '#666666' }}>
      <p>Manage and enforce security policies across your infrastructure</p>
      <p>• Access control policies: 15 active</p>
      <p>• Data encryption policies: 8 active</p>
      <p>• Network security policies: 12 active</p>
      <p>• Compliance policies: 6 active</p>
    </div>
  </GlassCard>
);

const ComplianceTab: React.FC<{ isDark: boolean }> = ({ isDark }) => (
  <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '20px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` }}>
    <h2 style={{ color: isDark ? '#ffffff' : '#000000', marginBottom: '20px' }}>Compliance Monitoring</h2>
    <div style={{ color: isDark ? '#ffffff' : '#666666' }}>
      <p>Monitor compliance across multiple frameworks</p>
      <p>• SOC 2 compliance: 98% (2 minor findings)</p>
      <p>• ISO 27001 compliance: 95% (1 major finding)</p>
      <p>• GDPR compliance: 100% (fully compliant)</p>
      <p>• Custom compliance rules: 92% (3 violations)</p>
    </div>
  </GlassCard>
);

const VulnerabilitiesTab: React.FC<{ isDark: boolean }> = ({ isDark }) => (
  <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '20px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` }}>
    <h2 style={{ color: isDark ? '#ffffff' : '#000000', marginBottom: '20px' }}>Vulnerability Management</h2>
    <div style={{ color: isDark ? '#ffffff' : '#666666' }}>
      <p>Track and remediate security vulnerabilities</p>
      <p>• Critical vulnerabilities: 0</p>
      <p>• High severity: 1 (patch available)</p>
      <p>• Medium severity: 2 (scheduled for fix)</p>
      <p>• Low severity: 8 (monitoring)</p>
    </div>
  </GlassCard>
);

const AuditTab: React.FC<{ isDark: boolean }> = ({ isDark }) => (
  <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '20px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` }}>
    <h2 style={{ color: isDark ? '#ffffff' : '#000000', marginBottom: '20px' }}>Security Audit Logs</h2>
    <div style={{ color: isDark ? '#ffffff' : '#666666' }}>
      <p>View detailed security audit trails and logs</p>
      <p>• Login events: 1,234 today</p>
      <p>• Permission changes: 5 this week</p>
      <p>• Failed access attempts: 23 today</p>
      <p>• System changes: 12 this week</p>
    </div>
  </GlassCard>
);

export default SecurityPage;