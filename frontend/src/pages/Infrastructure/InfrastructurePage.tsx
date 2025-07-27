import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { Icon } from '../../components/common/Icon';
import { GlassCard } from '../../components/common/GlassCard';
import { GlassButton } from '../../components/common/GlassButton';
import { infrastructureService } from '../../services/infrastructureService';
import type { InfrastructureStats, ResourceDistribution, RecentChange, Infrastructure, InfrastructureFilters } from '../../services/infrastructureService';

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
      icon: <Icon name="cloud-cdn" size="md" />,
      content: <InfrastructureOverview isDark={isDark} />,
    },
    {
      id: 'resources',
      label: 'Resources',
      icon: <Icon name="cloud-storage" size="md" />,
      content: <ResourcesTab isDark={isDark} />,
    },
    {
      id: 'templates',
      label: 'Templates',
      icon: <Icon name="monitor-clock" size="md" />,
      content: <TemplatesTab isDark={isDark} />,
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
  const [stats, setStats] = useState<InfrastructureStats | null>(null);
  const [distribution, setDistribution] = useState<ResourceDistribution | null>(null);
  const [recentChanges, setRecentChanges] = useState<RecentChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOverviewData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [statsData, distributionData, changesData] = await Promise.all([
          infrastructureService.getInfrastructureStats(),
          infrastructureService.getResourceDistribution(),
          infrastructureService.getRecentChanges()
        ]);
        setStats(statsData);
        setDistribution(distributionData);
        setRecentChanges(changesData);
      } catch (err) {
        console.error('Failed to fetch infrastructure overview:', err);
        setError('Failed to load infrastructure data');
      } finally {
        setLoading(false);
      }
    };

    fetchOverviewData();
  }, []);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '200px',
        color: isDark ? '#ffffff' : '#666666'
      }}>
        Loading infrastructure data...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '200px',
        color: '#EF4444'
      }}>
        {error}
      </div>
    );
  }

  if (!stats || !distribution) {
    return null;
  }

  const statsArray = [
    { 
      title: 'Total Resources', 
      value: stats.totalResources.toString(), 
      change: stats.totalResourcesChange, 
      trend: stats.totalResourcesTrend, 
      icon: <Icon name="cloud-storage" size="lg" /> 
    },
    { 
      title: 'Active Instances', 
      value: stats.activeInstances.toString(), 
      change: stats.activeInstancesChange, 
      trend: stats.activeInstancesTrend, 
      icon: <Icon name="cloud-compute" size="lg" /> 
    },
    { 
      title: 'Networks', 
      value: stats.networks.toString(), 
      change: stats.networksChange, 
      trend: stats.networksTrend, 
      icon: <Icon name="cloud-network" size="lg" /> 
    },
    { 
      title: 'Compliance Score', 
      value: `${stats.complianceScore}%`, 
      change: stats.complianceScoreChange, 
      trend: stats.complianceScoreTrend, 
      icon: <Icon name="monitor-chart" size="lg" /> 
    },
  ];

  return (
    <div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px',
        marginBottom: '32px',
      }}>
        {statsArray.map((stat, index) => (
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
            <p>EC2 Instances: {distribution.ec2Instances} ({Math.round((distribution.ec2Instances / distribution.totalCount) * 100)}%)</p>
            <p>S3 Buckets: {distribution.s3Buckets} ({Math.round((distribution.s3Buckets / distribution.totalCount) * 100)}%)</p>
            <p>RDS Databases: {distribution.rdsDatabases} ({Math.round((distribution.rdsDatabases / distribution.totalCount) * 100)}%)</p>
            <p>Lambda Functions: {distribution.lambdaFunctions} ({Math.round((distribution.lambdaFunctions / distribution.totalCount) * 100)}%)</p>
          </div>
        </GlassCard>

        <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '20px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` }}>
          <h2 style={{ color: isDark ? '#ffffff' : '#000000', marginBottom: '20px' }}>Recent Changes</h2>
          <div style={{ color: isDark ? '#ffffff' : '#666666' }}>
            {recentChanges.map((change, index) => (
              <div key={change.id} style={{ 
                marginBottom: index < recentChanges.length - 1 ? '12px' : '0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{
                  color: getChangeTypeColor(change.type),
                  fontSize: '12px',
                  fontWeight: 500,
                  textTransform: 'uppercase'
                }}>
                  {change.type}
                </span>
                <span>• {change.message}</span>
                <span style={{ 
                  opacity: 0.6,
                  fontSize: '12px',
                  marginLeft: 'auto'
                }}>
                  {formatRelativeTime(change.timestamp)}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

const ResourcesTab: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const [resources, setResources] = useState<Infrastructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<InfrastructureFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [, setHasMore] = useState(false);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await infrastructureService.listInfrastructure(currentPage, 10, filters);
        setResources(response.data);
        setTotalPages(Math.ceil(response.total / 10));
        setHasMore(response.hasMore);
      } catch (err) {
        console.error('Failed to fetch infrastructure resources:', err);
        setError('Failed to load resources');
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, [currentPage, filters]);

  const handleFilterChange = (key: keyof InfrastructureFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value || undefined }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const getStatusColor = (status: string) => {
    const colors = {
      running: '#10B981',
      stopped: '#6B7280',
      pending: '#F59E0B',
      error: '#EF4444',
      terminated: '#EF4444'
    };
    return colors[status as keyof typeof colors] || '#6B7280';
  };

  const getProviderIcon = (provider: string) => {
    const icons = {
      aws: 'cloud-compute',
      azure: 'cloud-storage',
      gcp: 'cloud-network'
    };
    return icons[provider as keyof typeof icons] || 'cloud-compute';
  };

  if (loading) {
    return (
      <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '20px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` }}>
        <div style={{ textAlign: 'center', padding: '40px', color: isDark ? '#ffffff' : '#666666' }}>
          Loading resources...
        </div>
      </GlassCard>
    );
  }

  if (error) {
    return (
      <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '20px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` }}>
        <div style={{ textAlign: 'center', padding: '40px', color: '#EF4444' }}>
          {error}
        </div>
      </GlassCard>
    );
  }

  return (
    <div>
      {/* Filters */}
      <GlassCard variant="card" elevation="low" isDark={isDark} style={{ marginBottom: '20px', borderRadius: '16px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ color: isDark ? '#ffffff' : '#000000', fontWeight: 500 }}>Filters:</div>
          
          <select 
            value={filters.provider || ''} 
            onChange={(e) => handleFilterChange('provider', e.target.value)}
            style={{
              background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
              borderRadius: '8px',
              padding: '8px 12px',
              color: isDark ? '#ffffff' : '#000000',
              fontSize: '14px'
            }}
          >
            <option value="">All Providers</option>
            <option value="aws">AWS</option>
            <option value="azure">Azure</option>
            <option value="gcp">Google Cloud</option>
          </select>

          <select 
            value={filters.type || ''} 
            onChange={(e) => handleFilterChange('type', e.target.value)}
            style={{
              background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
              borderRadius: '8px',
              padding: '8px 12px',
              color: isDark ? '#ffffff' : '#000000',
              fontSize: '14px'
            }}
          >
            <option value="">All Types</option>
            <option value="compute">Compute</option>
            <option value="storage">Storage</option>
            <option value="database">Database</option>
            <option value="network">Network</option>
            <option value="security">Security</option>
          </select>

          <select 
            value={filters.status || ''} 
            onChange={(e) => handleFilterChange('status', e.target.value)}
            style={{
              background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
              borderRadius: '8px',
              padding: '8px 12px',
              color: isDark ? '#ffffff' : '#000000',
              fontSize: '14px'
            }}
          >
            <option value="">All Statuses</option>
            <option value="running">Running</option>
            <option value="stopped">Stopped</option>
            <option value="pending">Pending</option>
            <option value="error">Error</option>
          </select>
        </div>
      </GlassCard>

      {/* Resources List */}
      <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '20px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ color: isDark ? '#ffffff' : '#000000', margin: 0 }}>Infrastructure Resources</h2>
          <GlassButton
            variant="primary"
            size="small"
            isDark={isDark}
            icon={<Icon name="cloud-compute" size="sm" />}
            style={{ borderRadius: '12px' }}
          >
            Add Resource
          </GlassButton>
        </div>

        <div style={{ display: 'grid', gap: '16px' }}>
          {resources.map((resource) => (
            <motion.div
              key={resource.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}
              whileHover={{ 
                background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                transform: 'translateY(-1px)'
              }}
            >
              <div style={{ color: '#10B981', fontSize: '20px' }}>
                <Icon name={getProviderIcon(resource.provider)} size="md" />
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{ 
                  color: isDark ? '#ffffff' : '#000000',
                  fontWeight: 600,
                  fontSize: '16px',
                  marginBottom: '4px'
                }}>
                  {resource.name}
                </div>
                <div style={{ 
                  color: isDark ? '#ffffff' : '#666666',
                  fontSize: '14px',
                  opacity: 0.8
                }}>
                  {resource.provider.toUpperCase()} • {resource.type} • {resource.region}
                </div>
              </div>

              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 12px',
                background: `${getStatusColor(resource.status)}20`,
                borderRadius: '20px',
                border: `1px solid ${getStatusColor(resource.status)}40`
              }}>
                <div style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: getStatusColor(resource.status)
                }} />
                <span style={{
                  color: getStatusColor(resource.status),
                  fontSize: '12px',
                  fontWeight: 500,
                  textTransform: 'capitalize'
                }}>
                  {resource.status}
                </span>
              </div>

              <div style={{ 
                color: isDark ? '#ffffff' : '#000000',
                fontWeight: 600,
                fontSize: '14px',
                textAlign: 'right'
              }}>
                ${resource.cost.monthly.toFixed(2)}/mo
              </div>
            </motion.div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '8px', 
            marginTop: '24px',
            paddingTop: '20px',
            borderTop: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`
          }}>
            <GlassButton
              variant="ghost"
              size="small"
              isDark={isDark}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              style={{ borderRadius: '8px' }}
            >
              Previous
            </GlassButton>
            
            <span style={{ 
              color: isDark ? '#ffffff' : '#666666',
              padding: '8px 16px',
              display: 'flex',
              alignItems: 'center',
              fontSize: '14px'
            }}>
              Page {currentPage} of {totalPages}
            </span>
            
            <GlassButton
              variant="ghost"
              size="small"
              isDark={isDark}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              style={{ borderRadius: '8px' }}
            >
              Next
            </GlassButton>
          </div>
        )}
      </GlassCard>
    </div>
  );
};

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

// Helper functions
const getChangeTypeColor = (type: string) => {
  const colors = {
    created: '#10B981',
    updated: '#3B82F6',
    deleted: '#EF4444',
    deployed: '#8B5CF6'
  };
  return colors[type as keyof typeof colors] || '#6B7280';
};

const formatRelativeTime = (timestamp: string) => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now.getTime() - time.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) {
    return 'just now';
  } else if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else {
    return `${diffDays}d ago`;
  }
};

export default InfrastructurePage;