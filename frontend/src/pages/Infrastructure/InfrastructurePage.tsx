import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { Icon } from '../../components/common/Icon';
import { GlassCard } from '../../components/common/GlassCard';
import { GlassButton } from '../../components/common/GlassButton';
import { infrastructureService } from '../../services/infrastructureService';
import type { InfrastructureStats, ResourceDistribution, RecentChange, Infrastructure } from '../../services/infrastructureService';

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

// Resources Tab Component
const ResourcesTab: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const [resources, setResources] = useState<Infrastructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filters, setFilters] = useState({
    provider: '',
    type: '',
    status: '',
    search: ''
  });

  useEffect(() => {
    const fetchResources = async () => {
      try {
        setLoading(true);
        const response = await infrastructureService.listInfrastructure();
        setResources(response.data);
      } catch (error) {
        console.error('Failed to fetch infrastructure:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, []);

  const filteredResources = resources.filter(resource => {
    if (filters.provider && resource.provider !== filters.provider) return false;
    if (filters.type && resource.type !== filters.type) return false;
    if (filters.status && resource.status !== filters.status) return false;
    if (filters.search && !resource.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      {/* Header with Create Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ color: isDark ? '#ffffff' : '#000000', margin: '0 0 8px 0' }}>Infrastructure Resources</h2>
          <p style={{ color: isDark ? '#ffffff' : '#666666', margin: 0, fontSize: '14px' }}>
            Manage your cloud infrastructure resources
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
          Create Resource
        </GlassButton>
      </div>

      {/* Filters */}
      <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ color: isDark ? '#ffffff' : '#666666', marginBottom: '8px', display: 'block', fontSize: '14px' }}>
              Provider
            </label>
            <select
              value={filters.provider}
              onChange={(e) => setFilters({ ...filters, provider: e.target.value })}
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
              <option value="">All Providers</option>
              <option value="aws">AWS</option>
              <option value="azure">Azure</option>
              <option value="gcp">GCP</option>
            </select>
          </div>

          <div>
            <label style={{ color: isDark ? '#ffffff' : '#666666', marginBottom: '8px', display: 'block', fontSize: '14px' }}>
              Type
            </label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
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
              <option value="">All Types</option>
              <option value="compute">Server</option>
              <option value="database">Database</option>
              <option value="storage">Storage</option>
              <option value="network">Network</option>
              <option value="security">Security</option>
            </select>
          </div>

          <div>
            <label style={{ color: isDark ? '#ffffff' : '#666666', marginBottom: '8px', display: 'block', fontSize: '14px' }}>
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
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
              <option value="">All Status</option>
              <option value="running">Running</option>
              <option value="stopped">Stopped</option>
              <option value="pending">Pending</option>
              <option value="error">Error</option>
            </select>
          </div>

          <div>
            <label style={{ color: isDark ? '#ffffff' : '#666666', marginBottom: '8px', display: 'block', fontSize: '14px' }}>
              Search
            </label>
            <input
              type="text"
              placeholder="Search resources..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                color: isDark ? '#ffffff' : '#000000',
                fontSize: '14px'
              }}
            />
          </div>
        </div>
      </GlassCard>

      {/* Resources Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: isDark ? '#ffffff' : '#666666' }}>
          Loading resources...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {filteredResources.map((resource) => (
            <GlassCard key={resource.id} variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ color: isDark ? '#ffffff' : '#000000', margin: '0 0 4px 0', fontSize: '16px' }}>
                    {resource.name}
                  </h3>
                  <p style={{ color: isDark ? '#ffffff' : '#666666', margin: 0, fontSize: '14px' }}>
                    {resource.type} • {resource.provider}
                  </p>
                </div>
                <div style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  background: getStatusColor(resource.status),
                  color: '#ffffff',
                  fontSize: '12px',
                  textTransform: 'uppercase'
                }}>
                  {resource.status}
                </div>
              </div>

              <div style={{ display: 'grid', gap: '8px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: isDark ? '#ffffff' : '#666666', fontSize: '14px' }}>Region:</span>
                  <span style={{ color: isDark ? '#ffffff' : '#000000', fontSize: '14px' }}>{resource.region}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: isDark ? '#ffffff' : '#666666', fontSize: '14px' }}>Cost:</span>
                  <span style={{ color: isDark ? '#ffffff' : '#000000', fontSize: '14px' }}>
                    ${resource.cost?.daily || 0}/day
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <GlassButton
                  variant="ghost"
                  size="small"
                  isDark={isDark}
                  style={{ borderRadius: '8px', flex: 1 }}
                >
                  <Icon name="action-edit" size="sm" />
                  Edit
                </GlassButton>
                <GlassButton
                  variant="ghost"
                  size="small"
                  isDark={isDark}
                  style={{ borderRadius: '8px', flex: 1 }}
                >
                  <Icon name="monitor-chart" size="sm" />
                  Monitor
                </GlassButton>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Create Resource Form Modal */}
      {showCreateForm && (
        <CreateResourceForm isDark={isDark} onClose={() => setShowCreateForm(false)} onSuccess={(newResource) => {
          setResources([newResource, ...resources]);
          setShowCreateForm(false);
        }} />
      )}
    </div>
  );
};

// Create Resource Form Component
const CreateResourceForm: React.FC<{ 
  isDark: boolean; 
  onClose: () => void; 
  onSuccess: (resource: Infrastructure) => void;
}> = ({ isDark, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'compute' as 'compute' | 'database' | 'storage' | 'network' | 'security',
    provider: 'aws' as 'aws' | 'gcp' | 'azure',
    region: 'us-east-1',
    specifications: {} as any
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const newResource = await infrastructureService.createInfrastructure(formData);
      onSuccess(newResource);
    } catch (error) {
      console.error('Failed to create resource:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <GlassCard variant="card" elevation="high" isDark={isDark} style={{ 
        borderRadius: '20px', 
        maxWidth: '500px', 
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ color: isDark ? '#ffffff' : '#000000', margin: 0 }}>Create New Resource</h2>
          <GlassButton
            variant="ghost"
            size="small"
            isDark={isDark}
            onClick={onClose}
            style={{ borderRadius: '8px' }}
          >
            <Icon name="action-close" size="sm" />
          </GlassButton>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px' }}>
          <div>
            <label style={{ color: isDark ? '#ffffff' : '#666666', marginBottom: '8px', display: 'block', fontSize: '14px' }}>
              Resource Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter resource name"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                color: isDark ? '#ffffff' : '#000000',
                fontSize: '14px'
              }}
            />
          </div>

          <div>
            <label style={{ color: isDark ? '#ffffff' : '#666666', marginBottom: '8px', display: 'block', fontSize: '14px' }}>
              Resource Type *
            </label>
            <select
              required
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                color: isDark ? '#ffffff' : '#000000',
                fontSize: '14px'
              }}
            >
              <option value="compute">Server</option>
              <option value="database">Database</option>
              <option value="storage">Storage</option>
              <option value="network">Network</option>
              <option value="security">Security</option>
            </select>
          </div>

          <div>
            <label style={{ color: isDark ? '#ffffff' : '#666666', marginBottom: '8px', display: 'block', fontSize: '14px' }}>
              Cloud Provider *
            </label>
            <select
              required
              value={formData.provider}
              onChange={(e) => setFormData({ ...formData, provider: e.target.value as any })}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                color: isDark ? '#ffffff' : '#000000',
                fontSize: '14px'
              }}
            >
              <option value="aws">AWS</option>
              <option value="azure">Azure</option>
              <option value="gcp">Google Cloud</option>
            </select>
          </div>

          <div>
            <label style={{ color: isDark ? '#ffffff' : '#666666', marginBottom: '8px', display: 'block', fontSize: '14px' }}>
              Region *
            </label>
            <select
              required
              value={formData.region}
              onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                color: isDark ? '#ffffff' : '#000000',
                fontSize: '14px'
              }}
            >
              <option value="us-east-1">US East (N. Virginia)</option>
              <option value="us-west-2">US West (Oregon)</option>
              <option value="eu-west-1">Europe (Ireland)</option>
              <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <GlassButton
              type="submit"
              variant="primary"
              size="medium"
              isDark={isDark}
              disabled={loading}
              style={{ borderRadius: '12px', flex: 1 }}
            >
              {loading ? 'Creating...' : 'Create Resource'}
            </GlassButton>
            <GlassButton
              type="button"
              variant="ghost"
              size="medium"
              isDark={isDark}
              onClick={onClose}
              style={{ borderRadius: '12px', flex: 1 }}
            >
              Cancel
            </GlassButton>
          </div>
        </form>
      </GlassCard>
    </div>
  );
};

// Helper function for status colors
const getStatusColor = (status: string) => {
  const colors = {
    running: '#10B981',
    stopped: '#F59E0B',
    pending: '#3B82F6',
    error: '#EF4444'
  };
  return colors[status as keyof typeof colors] || '#666666';
};

const TemplatesTab: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const [templates, setTemplates] = useState([
    { id: '1', name: 'Web Application Stack', type: 'terraform', provider: 'aws', status: 'active', lastUsed: '2024-01-15', deployments: 12 },
    { id: '2', name: 'Database Cluster', type: 'cloudformation', provider: 'aws', status: 'active', lastUsed: '2024-01-14', deployments: 8 },
    { id: '3', name: 'Kubernetes Microservices', type: 'kubernetes', provider: 'gcp', status: 'draft', lastUsed: '2024-01-10', deployments: 3 },
    { id: '4', name: 'Load Balancer Setup', type: 'terraform', provider: 'azure', status: 'active', lastUsed: '2024-01-12', deployments: 15 },
    { id: '5', name: 'Monitoring Stack', type: 'helm', provider: 'aws', status: 'deprecated', lastUsed: '2024-01-05', deployments: 2 },
  ]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filter, setFilter] = useState({ type: '', provider: '', status: '' });

  const getTemplateTypeIcon = (type: string) => {
    switch (type) {
      case 'terraform': return 'cloud-cdn';
      case 'cloudformation': return 'cloud-storage';
      case 'kubernetes': return 'cloud-compute';
      case 'helm': return 'cloud-network';
      default: return 'monitor-chart';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'draft': return '#F59E0B';
      case 'deprecated': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const filteredTemplates = templates.filter(template => {
    if (filter.type && template.type !== filter.type) return false;
    if (filter.provider && template.provider !== filter.provider) return false;
    if (filter.status && template.status !== filter.status) return false;
    return true;
  });

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      {/* Header with Create Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ color: isDark ? '#ffffff' : '#000000', margin: '0 0 8px 0' }}>Infrastructure Templates</h2>
          <p style={{ color: isDark ? '#ffffff' : '#666666', margin: 0, fontSize: '14px' }}>
            Create and manage reusable infrastructure templates
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
          Create Template
        </GlassButton>
      </div>

      {/* Template Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {[
          { label: 'Total Templates', value: templates.length, color: '#6B7280' },
          { label: 'Active', value: templates.filter(t => t.status === 'active').length, color: '#10B981' },
          { label: 'Total Deployments', value: templates.reduce((sum, t) => sum + t.deployments, 0), color: '#3B82F6' },
          { label: 'Draft', value: templates.filter(t => t.status === 'draft').length, color: '#F59E0B' },
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
              Template Type
            </label>
            <select
              value={filter.type}
              onChange={(e) => setFilter({ ...filter, type: e.target.value })}
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
              <option value="">All Types</option>
              <option value="terraform">Terraform</option>
              <option value="cloudformation">CloudFormation</option>
              <option value="kubernetes">Kubernetes</option>
              <option value="helm">Helm</option>
            </select>
          </div>

          <div>
            <label style={{ color: isDark ? '#ffffff' : '#666666', marginBottom: '8px', display: 'block', fontSize: '14px' }}>
              Provider
            </label>
            <select
              value={filter.provider}
              onChange={(e) => setFilter({ ...filter, provider: e.target.value })}
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
              <option value="">All Providers</option>
              <option value="aws">AWS</option>
              <option value="azure">Azure</option>
              <option value="gcp">GCP</option>
            </select>
          </div>

          <div>
            <label style={{ color: isDark ? '#ffffff' : '#666666', marginBottom: '8px', display: 'block', fontSize: '14px' }}>
              Status
            </label>
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
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
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="deprecated">Deprecated</option>
            </select>
          </div>
        </div>
      </GlassCard>

      {/* Templates Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '16px' }}>
        {filteredTemplates.map((template) => (
          <GlassCard key={template.id} variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ color: '#10B981', fontSize: '20px' }}>
                  <Icon name={getTemplateTypeIcon(template.type)} size="md" />
                </div>
                <div>
                  <h3 style={{ color: isDark ? '#ffffff' : '#000000', margin: '0 0 4px 0', fontSize: '16px' }}>
                    {template.name}
                  </h3>
                  <p style={{ color: isDark ? '#ffffff' : '#666666', margin: 0, fontSize: '14px' }}>
                    {template.type} • {template.provider}
                  </p>
                </div>
              </div>
              <div style={{
                padding: '4px 8px',
                borderRadius: '6px',
                background: getStatusColor(template.status),
                color: '#ffffff',
                fontSize: '12px',
                textTransform: 'uppercase'
              }}>
                {template.status}
              </div>
            </div>

            <div style={{ display: 'grid', gap: '8px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: isDark ? '#ffffff' : '#666666', fontSize: '14px' }}>Deployments:</span>
                <span style={{ color: isDark ? '#ffffff' : '#000000', fontSize: '14px' }}>{template.deployments}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: isDark ? '#ffffff' : '#666666', fontSize: '14px' }}>Last used:</span>
                <span style={{ color: isDark ? '#ffffff' : '#000000', fontSize: '14px' }}>{template.lastUsed}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <GlassButton
                variant="primary"
                size="small"
                isDark={isDark}
                style={{ borderRadius: '8px', flex: 1 }}
              >
                <Icon name="deploy-rocket" size="sm" />
                Deploy
              </GlassButton>
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
                <Icon name="action-copy" size="sm" />
              </GlassButton>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
};

const PoliciesTab: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const [policies, setPolicies] = useState([
    { id: '1', name: 'Resource Tagging Policy', type: 'tagging', severity: 'high', status: 'active', violations: 3, resources: 45 },
    { id: '2', name: 'Cost Optimization Policy', type: 'cost', severity: 'medium', status: 'active', violations: 1, resources: 23 },
    { id: '3', name: 'Security Group Rules', type: 'security', severity: 'high', status: 'active', violations: 0, resources: 67 },
    { id: '4', name: 'Instance Size Policy', type: 'performance', severity: 'low', status: 'active', violations: 5, resources: 34 },
    { id: '5', name: 'Backup Compliance', type: 'compliance', severity: 'high', status: 'warning', violations: 2, resources: 12 },
  ]);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const getPolicyTypeIcon = (type: string) => {
    switch (type) {
      case 'tagging': return 'action-tag';
      case 'cost': return 'cost-dollar';
      case 'security': return 'security-shield';
      case 'performance': return 'monitor-pulse';
      case 'compliance': return 'security-audit';
      default: return 'monitor-chart';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'warning': return '#F59E0B';
      case 'error': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const totalViolations = policies.reduce((sum, p) => sum + p.violations, 0);
  const totalResources = policies.reduce((sum, p) => sum + p.resources, 0);

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      {/* Header with Create Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ color: isDark ? '#ffffff' : '#000000', margin: '0 0 8px 0' }}>Infrastructure Policies</h2>
          <p style={{ color: isDark ? '#ffffff' : '#666666', margin: 0, fontSize: '14px' }}>
            Define and enforce policies across your infrastructure
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
          { label: 'Violations', value: totalViolations, color: totalViolations > 0 ? '#EF4444' : '#10B981' },
          { label: 'Resources Covered', value: totalResources, color: '#3B82F6' },
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
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                <div style={{ color: '#10B981', fontSize: '20px' }}>
                  <Icon name={getPolicyTypeIcon(policy.type)} size="md" />
                </div>
                
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
                    Type: {policy.type} • {policy.resources} resources covered
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ 
                      color: policy.violations === 0 ? '#10B981' : '#EF4444',
                      fontSize: '18px',
                      fontWeight: 'bold'
                    }}>
                      {policy.violations}
                    </div>
                    <div style={{ 
                      color: isDark ? '#ffffff' : '#666666',
                      fontSize: '12px',
                      opacity: 0.7
                    }}>
                      Violations
                    </div>
                  </div>

                  <div style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '4px 12px',
                    background: `${getSeverityColor(policy.severity)}20`,
                    borderRadius: '20px',
                    border: `1px solid ${getSeverityColor(policy.severity)}40`
                  }}>
                    <div style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: getSeverityColor(policy.severity)
                    }} />
                    <span style={{
                      color: getSeverityColor(policy.severity),
                      fontSize: '12px',
                      fontWeight: 500,
                      textTransform: 'capitalize'
                    }}>
                      {policy.severity}
                    </span>
                  </div>

                  <div style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '4px 12px',
                    background: `${getStatusColor(policy.status)}20`,
                    borderRadius: '20px',
                    border: `1px solid ${getStatusColor(policy.status)}40`
                  }}>
                    <div style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: getStatusColor(policy.status)
                    }} />
                    <span style={{
                      color: getStatusColor(policy.status),
                      fontSize: '12px',
                      fontWeight: 500,
                      textTransform: 'capitalize'
                    }}>
                      {policy.status}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
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
                <GlassButton
                  variant="ghost"
                  size="small"
                  isDark={isDark}
                  style={{ borderRadius: '8px' }}
                >
                  <Icon name="action-view" size="sm" />
                </GlassButton>
              </div>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};

const ComplianceTab: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const [complianceChecks, setComplianceChecks] = useState([
    { id: '1', name: 'SOC 2 Type II', category: 'security', score: 98, status: 'compliant', issues: 2, lastCheck: '2024-01-15' },
    { id: '2', name: 'ISO 27001', category: 'security', score: 95, status: 'minor_issues', issues: 3, lastCheck: '2024-01-14' },
    { id: '3', name: 'GDPR Compliance', category: 'privacy', score: 100, status: 'compliant', issues: 0, lastCheck: '2024-01-16' },
    { id: '4', name: 'HIPAA', category: 'healthcare', score: 92, status: 'action_required', issues: 5, lastCheck: '2024-01-12' },
    { id: '5', name: 'PCI DSS', category: 'payment', score: 89, status: 'action_required', issues: 7, lastCheck: '2024-01-10' },
    { id: '6', name: 'Custom Security Rules', category: 'custom', score: 94, status: 'minor_issues', issues: 4, lastCheck: '2024-01-13' },
  ]);

  const getComplianceStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return '#10B981';
      case 'minor_issues': return '#F59E0B';
      case 'action_required': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'compliant': return 'Compliant';
      case 'minor_issues': return 'Minor Issues';
      case 'action_required': return 'Action Required';
      default: return 'Unknown';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'security': return 'security-shield';
      case 'privacy': return 'security-audit';
      case 'healthcare': return 'monitor-pulse';
      case 'payment': return 'cost-dollar';
      case 'custom': return 'monitor-chart';
      default: return 'monitor-chart';
    }
  };

  const averageScore = Math.round(complianceChecks.reduce((sum, c) => sum + c.score, 0) / complianceChecks.length);
  const totalIssues = complianceChecks.reduce((sum, c) => sum + c.issues, 0);
  const compliantCount = complianceChecks.filter(c => c.status === 'compliant').length;

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      {/* Compliance Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {[
          { label: 'Average Score', value: `${averageScore}%`, color: averageScore >= 95 ? '#10B981' : averageScore >= 85 ? '#F59E0B' : '#EF4444' },
          { label: 'Frameworks', value: complianceChecks.length, color: '#6B7280' },
          { label: 'Compliant', value: compliantCount, color: '#10B981' },
          { label: 'Total Issues', value: totalIssues, color: totalIssues === 0 ? '#10B981' : '#EF4444' },
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

      {/* Compliance Checks */}
      <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '20px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ color: isDark ? '#ffffff' : '#000000', margin: 0 }}>Compliance Monitoring</h3>
          <GlassButton
            variant="primary"
            size="small"
            isDark={isDark}
            style={{ borderRadius: '12px' }}
          >
            <Icon name="action-refresh" size="sm" />
            Run All Checks
          </GlassButton>
        </div>

        <div style={{ display: 'grid', gap: '16px' }}>
          {complianceChecks.map((check) => (
            <motion.div
              key={check.id}
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ color: '#10B981', fontSize: '20px' }}>
                    <Icon name={getCategoryIcon(check.category)} size="md" />
                  </div>
                  <div>
                    <div style={{ 
                      color: isDark ? '#ffffff' : '#000000',
                      fontWeight: 600,
                      fontSize: '16px',
                      marginBottom: '4px'
                    }}>
                      {check.name}
                    </div>
                    <div style={{ 
                      color: isDark ? '#ffffff' : '#666666',
                      fontSize: '14px',
                      opacity: 0.8
                    }}>
                      {check.category} • Last check: {check.lastCheck}
                    </div>
                  </div>
                </div>
                
                <div style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 12px',
                  background: `${getComplianceStatusColor(check.status)}20`,
                  borderRadius: '20px',
                  border: `1px solid ${getComplianceStatusColor(check.status)}40`
                }}>
                  <div style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: getComplianceStatusColor(check.status)
                  }} />
                  <span style={{
                    color: getComplianceStatusColor(check.status),
                    fontSize: '12px',
                    fontWeight: 500,
                  }}>
                    {getStatusLabel(check.status)}
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
                      color: check.score >= 95 ? '#10B981' : check.score >= 85 ? '#F59E0B' : '#EF4444',
                      fontSize: '14px',
                      fontWeight: 600
                    }}>
                      {check.score}%
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
                      width: `${check.score}%`,
                      height: '100%',
                      background: check.score >= 95 ? '#10B981' : check.score >= 85 ? '#F59E0B' : '#EF4444',
                      borderRadius: '4px',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    color: check.issues === 0 ? '#10B981' : '#EF4444',
                    fontSize: '20px',
                    fontWeight: 'bold'
                  }}>
                    {check.issues}
                  </div>
                  <div style={{ 
                    color: isDark ? '#ffffff' : '#666666',
                    fontSize: '12px',
                    opacity: 0.7
                  }}>
                    Issues
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
                    <Icon name="action-refresh" size="sm" />
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