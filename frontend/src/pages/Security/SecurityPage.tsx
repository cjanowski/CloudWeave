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

const PoliciesTab: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const [policies, setPolicies] = useState([
    { id: '1', name: 'Password Policy', type: 'access', status: 'active', violations: 0, lastUpdated: '2024-01-15' },
    { id: '2', name: 'Data Encryption at Rest', type: 'encryption', status: 'active', violations: 2, lastUpdated: '2024-01-10' },
    { id: '3', name: 'Network Firewall Rules', type: 'network', status: 'active', violations: 1, lastUpdated: '2024-01-12' },
    { id: '4', name: 'Multi-Factor Authentication', type: 'access', status: 'active', violations: 0, lastUpdated: '2024-01-14' },
    { id: '5', name: 'Data Backup Policy', type: 'compliance', status: 'warning', violations: 3, lastUpdated: '2024-01-08' },
  ]);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const getPolicyStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'warning': return '#F59E0B';
      case 'error': return '#EF4444';
      default: return '#6B7280';
    }
  };

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      {/* Header with Create Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ color: isDark ? '#ffffff' : '#000000', margin: '0 0 8px 0' }}>Security Policies</h2>
          <p style={{ color: isDark ? '#ffffff' : '#666666', margin: 0, fontSize: '14px' }}>
            Manage and enforce security policies across your infrastructure
          </p>
        </div>
        <GlassButton
          variant="primary"
          size="medium"
          isDark={isDark}
          onClick={() => setShowCreateForm(true)}
          style={{ borderRadius: '12px' }}
        >
          <Icon name="action-plus" size="sm" />
          Create Policy
        </GlassButton>
      </div>

      {/* Policy Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {[
          { label: 'Total Policies', value: policies.length, color: '#6B7280' },
          { label: 'Active', value: policies.filter(p => p.status === 'active').length, color: '#10B981' },
          { label: 'Warnings', value: policies.filter(p => p.status === 'warning').length, color: '#F59E0B' },
          { label: 'Violations', value: policies.reduce((sum, p) => sum + p.violations, 0), color: '#EF4444' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <GlassCard
              variant="card"
              elevation="low"
              isDark={isDark}
              style={{
                textAlign: 'center',
                padding: '16px',
                borderRadius: '16px',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
              }}
            >
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: stat.color, marginBottom: '4px' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '14px', color: isDark ? '#ffffff' : '#666666', opacity: 0.7 }}>
                {stat.label}
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Policies List */}
      <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '20px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` }}>
        <h3 style={{ color: isDark ? '#ffffff' : '#000000', marginBottom: '20px' }}>Policy Management</h3>
        <div style={{ display: 'grid', gap: '12px' }}>
          {policies.map((policy) => (
            <motion.div
              key={policy.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ 
                  color: isDark ? '#ffffff' : '#000000',
                  fontWeight: 600,
                  fontSize: '16px',
                  marginBottom: '4px'
                }}>
                  {policy.name}
                </div>
                <div style={{ 
                  color: isDark ? '#ffffff' : '#666666',
                  fontSize: '14px',
                  opacity: 0.8
                }}>
                  Type: {policy.type} • Last updated: {policy.lastUpdated}
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {policy.violations > 0 && (
                  <div style={{ 
                    color: '#EF4444',
                    fontSize: '14px',
                    fontWeight: 500
                  }}>
                    {policy.violations} violations
                  </div>
                )}
                
                <div style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '4px 12px',
                  background: `${getPolicyStatusColor(policy.status)}20`,
                  borderRadius: '20px',
                  border: `1px solid ${getPolicyStatusColor(policy.status)}40`
                }}>
                  <div style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: getPolicyStatusColor(policy.status)
                  }} />
                  <span style={{
                    color: getPolicyStatusColor(policy.status),
                    fontSize: '12px',
                    fontWeight: 500,
                    textTransform: 'capitalize'
                  }}>
                    {policy.status}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <GlassButton
                    variant="ghost"
                    size="small"
                    isDark={isDark}
                    style={{ borderRadius: '8px' }}
                  >
                    <Icon name="action-edit" size="sm" />
                  </GlassButton>
                  <GlassButton
                    variant="ghost"
                    size="small"
                    isDark={isDark}
                    style={{ borderRadius: '8px' }}
                  >
                    <Icon name="security-audit" size="sm" />
                  </GlassButton>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};

const ComplianceTab: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const [complianceFrameworks, setComplianceFrameworks] = useState([
    { id: '1', name: 'SOC 2 Type II', score: 98, status: 'compliant', findings: 2, lastAudit: '2024-01-10' },
    { id: '2', name: 'ISO 27001', score: 95, status: 'minor_issues', findings: 1, lastAudit: '2024-01-08' },
    { id: '3', name: 'GDPR', score: 100, status: 'compliant', findings: 0, lastAudit: '2024-01-12' },
    { id: '4', name: 'HIPAA', score: 92, status: 'under_review', findings: 3, lastAudit: '2024-01-05' },
    { id: '5', name: 'PCI DSS', score: 89, status: 'action_required', findings: 5, lastAudit: '2024-01-07' },
  ]);

  const getComplianceStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return '#10B981';
      case 'minor_issues': return '#F59E0B';
      case 'under_review': return '#3B82F6';
      case 'action_required': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'compliant': return 'Compliant';
      case 'minor_issues': return 'Minor Issues';
      case 'under_review': return 'Under Review';
      case 'action_required': return 'Action Required';
      default: return 'Unknown';
    }
  };

  const averageScore = Math.round(complianceFrameworks.reduce((sum, f) => sum + f.score, 0) / complianceFrameworks.length);
  const totalFindings = complianceFrameworks.reduce((sum, f) => sum + f.findings, 0);

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      {/* Compliance Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {[
          { label: 'Average Score', value: `${averageScore}%`, color: averageScore >= 95 ? '#10B981' : averageScore >= 85 ? '#F59E0B' : '#EF4444' },
          { label: 'Frameworks', value: complianceFrameworks.length, color: '#6B7280' },
          { label: 'Compliant', value: complianceFrameworks.filter(f => f.status === 'compliant').length, color: '#10B981' },
          { label: 'Total Findings', value: totalFindings, color: totalFindings === 0 ? '#10B981' : '#EF4444' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <GlassCard
              variant="card"
              elevation="low"
              isDark={isDark}
              style={{
                textAlign: 'center',
                padding: '16px',
                borderRadius: '16px',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
              }}
            >
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: stat.color, marginBottom: '4px' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '14px', color: isDark ? '#ffffff' : '#666666', opacity: 0.7 }}>
                {stat.label}
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Compliance Frameworks */}
      <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '20px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ color: isDark ? '#ffffff' : '#000000', margin: 0 }}>Compliance Frameworks</h3>
          <GlassButton
            variant="primary"
            size="small"
            isDark={isDark}
            style={{ borderRadius: '12px' }}
          >
            <Icon name="action-plus" size="sm" />
            Add Framework
          </GlassButton>
        </div>

        <div style={{ display: 'grid', gap: '16px' }}>
          {complianceFrameworks.map((framework) => (
            <motion.div
              key={framework.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
                borderRadius: '12px',
                padding: '20px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <div style={{ 
                    color: isDark ? '#ffffff' : '#000000',
                    fontWeight: 600,
                    fontSize: '18px',
                    marginBottom: '4px'
                  }}>
                    {framework.name}
                  </div>
                  <div style={{ 
                    color: isDark ? '#ffffff' : '#666666',
                    fontSize: '14px',
                    opacity: 0.8
                  }}>
                    Last audit: {framework.lastAudit}
                  </div>
                </div>
                
                <div style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 12px',
                  background: `${getComplianceStatusColor(framework.status)}20`,
                  borderRadius: '20px',
                  border: `1px solid ${getComplianceStatusColor(framework.status)}40`
                }}>
                  <div style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: getComplianceStatusColor(framework.status)
                  }} />
                  <span style={{
                    color: getComplianceStatusColor(framework.status),
                    fontSize: '12px',
                    fontWeight: 500,
                  }}>
                    {getStatusLabel(framework.status)}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: isDark ? '#ffffff' : '#666666', fontSize: '14px' }}>
                      Compliance Score
                    </span>
                    <span style={{ 
                      color: framework.score >= 95 ? '#10B981' : framework.score >= 85 ? '#F59E0B' : '#EF4444',
                      fontSize: '14px',
                      fontWeight: 600
                    }}>
                      {framework.score}%
                    </span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${framework.score}%`,
                      height: '100%',
                      background: framework.score >= 95 ? '#10B981' : framework.score >= 85 ? '#F59E0B' : '#EF4444',
                      borderRadius: '4px',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    color: framework.findings === 0 ? '#10B981' : '#EF4444',
                    fontSize: '20px',
                    fontWeight: 'bold'
                  }}>
                    {framework.findings}
                  </div>
                  <div style={{ 
                    color: isDark ? '#ffffff' : '#666666',
                    fontSize: '12px',
                    opacity: 0.7
                  }}>
                    Findings
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <GlassButton
                    variant="ghost"
                    size="small"
                    isDark={isDark}
                    style={{ borderRadius: '8px' }}
                  >
                    <Icon name="action-view" size="sm" />
                  </GlassButton>
                  <GlassButton
                    variant="ghost"
                    size="small"
                    isDark={isDark}
                    style={{ borderRadius: '8px' }}
                  >
                    <Icon name="security-audit" size="sm" />
                  </GlassButton>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};

const VulnerabilitiesTab: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const [vulnerabilities, setVulnerabilities] = useState([
    { id: '1', title: 'OpenSSL Vulnerability', severity: 'high', cvss: 8.1, status: 'open', resource: 'web-server-01', discovered: '2024-01-15', cve: 'CVE-2024-0001' },
    { id: '2', title: 'Outdated Node.js Version', severity: 'medium', cvss: 6.5, status: 'in_progress', resource: 'api-server-02', discovered: '2024-01-14', cve: 'CVE-2024-0002' },
    { id: '3', title: 'Weak SSH Configuration', severity: 'medium', cvss: 5.8, status: 'open', resource: 'database-01', discovered: '2024-01-13', cve: 'CVE-2024-0003' },
    { id: '4', title: 'Unpatched OS Kernel', severity: 'low', cvss: 3.2, status: 'resolved', resource: 'worker-node-01', discovered: '2024-01-12', cve: 'CVE-2024-0004' },
    { id: '5', title: 'Insecure Docker Image', severity: 'low', cvss: 4.1, status: 'open', resource: 'container-app-01', discovered: '2024-01-11', cve: 'CVE-2024-0005' },
  ]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#DC2626';
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return '#EF4444';
      case 'in_progress': return '#F59E0B';
      case 'resolved': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'Open';
      case 'in_progress': return 'In Progress';
      case 'resolved': return 'Resolved';
      default: return 'Unknown';
    }
  };

  const severityCounts = {
    critical: vulnerabilities.filter(v => v.severity === 'critical').length,
    high: vulnerabilities.filter(v => v.severity === 'high').length,
    medium: vulnerabilities.filter(v => v.severity === 'medium').length,
    low: vulnerabilities.filter(v => v.severity === 'low').length,
  };

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      {/* Vulnerability Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {[
          { label: 'Critical', value: severityCounts.critical, color: '#DC2626' },
          { label: 'High', value: severityCounts.high, color: '#EF4444' },
          { label: 'Medium', value: severityCounts.medium, color: '#F59E0B' },
          { label: 'Low', value: severityCounts.low, color: '#10B981' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <GlassCard
              variant="card"
              elevation="low"
              isDark={isDark}
              style={{
                textAlign: 'center',
                padding: '16px',
                borderRadius: '16px',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
              }}
            >
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: stat.color, marginBottom: '4px' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '14px', color: isDark ? '#ffffff' : '#666666', opacity: 0.7 }}>
                {stat.label}
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Vulnerabilities List */}
      <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '20px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ color: isDark ? '#ffffff' : '#000000', margin: 0 }}>Vulnerability Management</h3>
          <GlassButton
            variant="primary"
            size="small"
            isDark={isDark}
            style={{ borderRadius: '12px' }}
          >
            <Icon name="action-refresh" size="sm" />
            Scan Now
          </GlassButton>
        </div>

        <div style={{ display: 'grid', gap: '12px' }}>
          {vulnerabilities.map((vuln) => (
            <motion.div
              key={vuln.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
                border: `1px solid ${getSeverityColor(vuln.severity)}20`,
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <div style={{ color: getSeverityColor(vuln.severity) }}>
                    <Icon name="status-warning" size="md" />
                  </div>
                  <div>
                    <div style={{ 
                      fontSize: '16px', 
                      fontWeight: 600, 
                      color: isDark ? '#ffffff' : '#000000',
                      marginBottom: '2px'
                    }}>
                      {vuln.title}
                    </div>
                    <div style={{ 
                      fontSize: '12px', 
                      color: isDark ? '#ffffff' : '#666666',
                      opacity: 0.7
                    }}>
                      {vuln.cve} • {vuln.resource} • Discovered: {vuln.discovered}
                    </div>
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    color: getSeverityColor(vuln.severity),
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}>
                    {vuln.cvss}
                  </div>
                  <div style={{ 
                    color: isDark ? '#ffffff' : '#666666',
                    fontSize: '12px',
                    opacity: 0.7
                  }}>
                    CVSS
                  </div>
                </div>

                <div style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '4px 12px',
                  background: `${getSeverityColor(vuln.severity)}20`,
                  borderRadius: '20px',
                  border: `1px solid ${getSeverityColor(vuln.severity)}40`
                }}>
                  <div style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: getSeverityColor(vuln.severity)
                  }} />
                  <span style={{
                    color: getSeverityColor(vuln.severity),
                    fontSize: '12px',
                    fontWeight: 500,
                    textTransform: 'capitalize'
                  }}>
                    {vuln.severity}
                  </span>
                </div>

                <div style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '4px 12px',
                  background: `${getStatusColor(vuln.status)}20`,
                  borderRadius: '20px',
                  border: `1px solid ${getStatusColor(vuln.status)}40`
                }}>
                  <div style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: getStatusColor(vuln.status)
                  }} />
                  <span style={{
                    color: getStatusColor(vuln.status),
                    fontSize: '12px',
                    fontWeight: 500,
                  }}>
                    {getStatusLabel(vuln.status)}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <GlassButton
                    variant="ghost"
                    size="small"
                    isDark={isDark}
                    style={{ borderRadius: '8px' }}
                  >
                    <Icon name="action-view" size="sm" />
                  </GlassButton>
                  <GlassButton
                    variant="ghost"
                    size="small"
                    isDark={isDark}
                    style={{ borderRadius: '8px' }}
                  >
                    <Icon name="action-edit" size="sm" />
                  </GlassButton>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};

const AuditTab: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const [auditLogs, setAuditLogs] = useState([
    { id: '1', event: 'User Login', user: 'john.doe@company.com', action: 'successful_login', timestamp: '2024-01-16T10:30:00Z', ip: '192.168.1.100', severity: 'info' },
    { id: '2', event: 'Permission Change', user: 'admin@company.com', action: 'role_updated', timestamp: '2024-01-16T09:15:00Z', ip: '192.168.1.50', severity: 'medium' },
    { id: '3', event: 'Failed Login Attempt', user: 'unknown@external.com', action: 'failed_login', timestamp: '2024-01-16T08:45:00Z', ip: '203.0.113.1', severity: 'high' },
    { id: '4', event: 'Resource Access', user: 'jane.smith@company.com', action: 'resource_accessed', timestamp: '2024-01-16T08:30:00Z', ip: '192.168.1.75', severity: 'info' },
    { id: '5', event: 'Security Policy Update', user: 'admin@company.com', action: 'policy_modified', timestamp: '2024-01-16T07:20:00Z', ip: '192.168.1.50', severity: 'medium' },
    { id: '6', event: 'Data Export', user: 'analyst@company.com', action: 'data_exported', timestamp: '2024-01-16T06:10:00Z', ip: '192.168.1.120', severity: 'medium' },
  ]);
  const [filter, setFilter] = useState({ severity: '', action: '', timeRange: '24h' });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'info': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'successful_login': return 'action-login';
      case 'failed_login': return 'status-warning';
      case 'role_updated': return 'security-audit';
      case 'resource_accessed': return 'action-view';
      case 'policy_modified': return 'action-edit';
      case 'data_exported': return 'action-download';
      default: return 'monitor-chart';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const filteredLogs = auditLogs.filter(log => {
    if (filter.severity && log.severity !== filter.severity) return false;
    if (filter.action && log.action !== filter.action) return false;
    return true;
  });

  const eventCounts = {
    total: auditLogs.length,
    high: auditLogs.filter(l => l.severity === 'high').length,
    medium: auditLogs.filter(l => l.severity === 'medium').length,
    info: auditLogs.filter(l => l.severity === 'info').length,
  };

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      {/* Audit Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {[
          { label: 'Total Events', value: eventCounts.total, color: '#6B7280' },
          { label: 'High Severity', value: eventCounts.high, color: '#EF4444' },
          { label: 'Medium Severity', value: eventCounts.medium, color: '#F59E0B' },
          { label: 'Info Events', value: eventCounts.info, color: '#10B981' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <GlassCard
              variant="card"
              elevation="low"
              isDark={isDark}
              style={{
                textAlign: 'center',
                padding: '16px',
                borderRadius: '16px',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
              }}
            >
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: stat.color, marginBottom: '4px' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '14px', color: isDark ? '#ffffff' : '#666666', opacity: 0.7 }}>
                {stat.label}
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <GlassCard variant="card" elevation="low" isDark={isDark} style={{ borderRadius: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ color: isDark ? '#ffffff' : '#666666', marginBottom: '8px', display: 'block', fontSize: '14px' }}>
              Severity
            </label>
            <select
              value={filter.severity}
              onChange={(e) => setFilter({ ...filter, severity: e.target.value })}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                color: isDark ? '#ffffff' : '#000000',
                fontSize: '14px'
              }}
            >
              <option value="">All Severities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="info">Info</option>
            </select>
          </div>

          <div>
            <label style={{ color: isDark ? '#ffffff' : '#666666', marginBottom: '8px', display: 'block', fontSize: '14px' }}>
              Action Type
            </label>
            <select
              value={filter.action}
              onChange={(e) => setFilter({ ...filter, action: e.target.value })}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                color: isDark ? '#ffffff' : '#000000',
                fontSize: '14px'
              }}
            >
              <option value="">All Actions</option>
              <option value="successful_login">Login</option>
              <option value="failed_login">Failed Login</option>
              <option value="role_updated">Role Update</option>
              <option value="resource_accessed">Resource Access</option>
              <option value="policy_modified">Policy Change</option>
              <option value="data_exported">Data Export</option>
            </select>
          </div>

          <div>
            <label style={{ color: isDark ? '#ffffff' : '#666666', marginBottom: '8px', display: 'block', fontSize: '14px' }}>
              Time Range
            </label>
            <select
              value={filter.timeRange}
              onChange={(e) => setFilter({ ...filter, timeRange: e.target.value })}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                color: isDark ? '#ffffff' : '#000000',
                fontSize: '14px'
              }}
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>
        </div>
      </GlassCard>

      {/* Audit Logs */}
      <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '20px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ color: isDark ? '#ffffff' : '#000000', margin: 0 }}>Security Audit Logs</h3>
          <GlassButton
            variant="primary"
            size="small"
            isDark={isDark}
            style={{ borderRadius: '12px' }}
          >
            <Icon name="action-download" size="sm" />
            Export Logs
          </GlassButton>
        </div>

        <div style={{ display: 'grid', gap: '8px', maxHeight: '500px', overflowY: 'auto' }}>
          {filteredLogs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              style={{
                background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
                border: `1px solid ${getSeverityColor(log.severity)}20`,
                borderRadius: '8px',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div style={{ color: getSeverityColor(log.severity), fontSize: '16px' }}>
                <Icon name={getActionIcon(log.action)} size="sm" />
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{ 
                  color: isDark ? '#ffffff' : '#000000',
                  fontWeight: 500,
                  fontSize: '14px',
                  marginBottom: '2px'
                }}>
                  {log.event}
                </div>
                <div style={{ 
                  color: isDark ? '#ffffff' : '#666666',
                  fontSize: '12px',
                  opacity: 0.8
                }}>
                  {log.user} • {log.ip} • {formatTimestamp(log.timestamp)}
                </div>
              </div>

              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 8px',
                background: `${getSeverityColor(log.severity)}20`,
                borderRadius: '12px',
                border: `1px solid ${getSeverityColor(log.severity)}40`
              }}>
                <div style={{
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  background: getSeverityColor(log.severity)
                }} />
                <span style={{
                  color: getSeverityColor(log.severity),
                  fontSize: '11px',
                  fontWeight: 500,
                  textTransform: 'capitalize'
                }}>
                  {log.severity}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};

export default SecurityPage;