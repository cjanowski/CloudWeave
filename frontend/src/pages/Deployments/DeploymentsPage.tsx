import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { Icon } from '../../components/common/Icon';
import { GlassCard } from '../../components/common/GlassCard';
import { GlassButton } from '../../components/common/GlassButton';
import { deploymentService } from '../../services/deploymentService';
import type { DeploymentStats, Deployment, Environment, Pipeline, DeploymentFilters } from '../../services/deploymentService';

interface TabItem {
  id: string;
  label: string;
  icon: React.ReactElement;
  content: React.ReactNode;
}

export const DeploymentsPage: React.FC = () => {
  const { theme } = useSelector((state: any) => state.ui);
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState('overview');

  const tabs: TabItem[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <Icon name="deploy-rocket" size="sm" />,
      content: <DeploymentsOverview isDark={isDark} />,
    },
    {
      id: 'pipelines',
      label: 'Pipelines',
      icon: <Icon name="deploy-pipeline" size="sm" />,
      content: <PipelinesTab isDark={isDark} />,
    },
    {
      id: 'history',
      label: 'History',
      icon: <Icon name="deploy-history" size="sm" />,
      content: <HistoryTab isDark={isDark} />,
    },
    {
      id: 'environments',
      label: 'Environments',
      icon: <Icon name="deploy-start" size="sm" />,
      content: <EnvironmentsTab isDark={isDark} />,
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
          background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 50%, #1D4ED8 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          Deployment Management
        </h1>
        <p style={{ 
          fontSize: '16px', 
          opacity: 0.7,
          margin: 0,
          color: isDark ? '#ffffff' : '#666666',
        }}>
          Manage your application deployments, pipelines, and environments.
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
                border: activeTab === tab.id ? '1px solid #3B82F6' : 'none',
                background: activeTab === tab.id 
                  ? (isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)')
                  : 'rgba(0, 0, 0, 0)',
                color: activeTab === tab.id ? '#3B82F6' : (isDark ? '#ffffff' : '#666666'),
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
const DeploymentsOverview: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const [stats, setStats] = useState<DeploymentStats | null>(null);
  const [recentDeployments, setRecentDeployments] = useState<Deployment[]>([]);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOverviewData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [statsData, deploymentsData, environmentsData] = await Promise.all([
          deploymentService.getDeploymentStats(),
          deploymentService.getRecentDeployments(4),
          deploymentService.getEnvironments()
        ]);
        setStats(statsData);
        setRecentDeployments(deploymentsData);
        setEnvironments(environmentsData);
      } catch (err) {
        console.error('Failed to fetch deployment overview:', err);
        setError('Failed to load deployment data');
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
        Loading deployment data...
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

  if (!stats) {
    return null;
  }

  const statsArray = [
    { 
      title: 'Active Deployments', 
      value: stats.activeDeployments.toString(), 
      change: stats.activeDeploymentsChange, 
      trend: stats.activeDeploymentsTrend, 
      icon: <Icon name="deploy-rocket" size="lg" /> 
    },
    { 
      title: 'Success Rate', 
      value: `${stats.successRate}%`, 
      change: stats.successRateChange, 
      trend: stats.successRateTrend, 
      icon: <Icon name="deploy-start" size="lg" /> 
    },
    { 
      title: 'Failed Deployments', 
      value: stats.failedDeployments.toString(), 
      change: stats.failedDeploymentsChange, 
      trend: stats.failedDeploymentsTrend, 
      icon: <Icon name="deploy-stop" size="lg" /> 
    },
    { 
      title: 'Avg Deploy Time', 
      value: `${stats.avgDeployTime}min`, 
      change: stats.avgDeployTimeChange, 
      trend: stats.avgDeployTimeTrend, 
      icon: <Icon name="deploy-pipeline" size="lg" /> 
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
              <div style={{ color: '#3B82F6', marginBottom: '12px', fontSize: '24px' }}>
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
          <h2 style={{ color: isDark ? '#ffffff' : '#000000', marginBottom: '20px' }}>Recent Deployments</h2>
          <div style={{ color: isDark ? '#ffffff' : '#666666' }}>
            {recentDeployments.map((deployment, index) => (
              <div key={deployment.id} style={{ 
                marginBottom: index < recentDeployments.length - 1 ? '12px' : '0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{
                  color: getDeploymentStatusColor(deployment.status),
                  fontSize: '12px',
                  fontWeight: 500,
                  textTransform: 'uppercase'
                }}>
                  {deployment.status}
                </span>
                <span>• {deployment.name} - {deployment.environment}</span>
                <span style={{ 
                  opacity: 0.6,
                  fontSize: '12px',
                  marginLeft: 'auto'
                }}>
                  {formatRelativeTime(deployment.createdAt)}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '20px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` }}>
          <h2 style={{ color: isDark ? '#ffffff' : '#000000', marginBottom: '20px' }}>Environment Status</h2>
          <div style={{ color: isDark ? '#ffffff' : '#666666' }}>
            {environments.map((env, index) => (
              <div key={env.id} style={{ 
                marginBottom: index < environments.length - 1 ? '12px' : '0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: getEnvironmentStatusColor(env.status)
                }} />
                <span style={{ textTransform: 'capitalize' }}>{env.name}:</span>
                <span>{env.servicesCount} services running</span>
                <span style={{ 
                  opacity: 0.6,
                  fontSize: '12px',
                  marginLeft: 'auto'
                }}>
                  {env.uptime.toFixed(1)}% uptime
                </span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

const PipelinesTab: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPipelines = async () => {
      try {
        setLoading(true);
        const data = await deploymentService.getPipelines();
        setPipelines(data);
      } catch (err) {
        console.error('Failed to fetch pipelines:', err);
        setError('Failed to load pipelines');
      } finally {
        setLoading(false);
      }
    };

    fetchPipelines();
  }, []);

  if (loading) {
    return (
      <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '20px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` }}>
        <div style={{ textAlign: 'center', padding: '40px', color: isDark ? '#ffffff' : '#666666' }}>
          Loading pipelines...
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
    <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '20px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: isDark ? '#ffffff' : '#000000', margin: 0 }}>Deployment Pipelines</h2>
        <GlassButton
          variant="primary"
          size="small"
          isDark={isDark}
          icon={<Icon name="deploy-pipeline" size="sm" />}
          style={{ borderRadius: '12px' }}
        >
          Create Pipeline
        </GlassButton>
      </div>

      <div style={{ display: 'grid', gap: '16px' }}>
        {pipelines.map((pipeline) => (
          <motion.div
            key={pipeline.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
              borderRadius: '12px',
              padding: '16px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <div style={{ 
                  color: isDark ? '#ffffff' : '#000000',
                  fontWeight: 600,
                  fontSize: '16px',
                  marginBottom: '4px'
                }}>
                  {pipeline.name}
                </div>
                <div style={{ 
                  color: isDark ? '#ffffff' : '#666666',
                  fontSize: '14px',
                  opacity: 0.8
                }}>
                  {pipeline.repository} • {pipeline.branch}
                </div>
              </div>
              
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 12px',
                background: `${getPipelineStatusColor(pipeline.status)}20`,
                borderRadius: '20px',
                border: `1px solid ${getPipelineStatusColor(pipeline.status)}40`
              }}>
                <div style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: getPipelineStatusColor(pipeline.status)
                }} />
                <span style={{
                  color: getPipelineStatusColor(pipeline.status),
                  fontSize: '12px',
                  fontWeight: 500,
                  textTransform: 'capitalize'
                }}>
                  {pipeline.status}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              {pipeline.stages.map((stage) => (
                <div
                  key={stage.id}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                    borderRadius: '8px',
                    borderLeft: `3px solid ${getStageStatusColor(stage.status)}`,
                    fontSize: '12px'
                  }}
                >
                  <div style={{ 
                    color: isDark ? '#ffffff' : '#000000',
                    fontWeight: 500,
                    marginBottom: '2px'
                  }}>
                    {stage.name}
                  </div>
                  <div style={{ 
                    color: getStageStatusColor(stage.status),
                    textTransform: 'capitalize'
                  }}>
                    {stage.status}
                    {stage.duration && ` (${stage.duration}s)`}
                  </div>
                </div>
              ))}
            </div>

            {pipeline.lastRun && (
              <div style={{ 
                marginTop: '12px',
                fontSize: '12px',
                color: isDark ? '#ffffff' : '#666666',
                opacity: 0.7
              }}>
                Last run: {formatRelativeTime(pipeline.lastRun)}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </GlassCard>
  );
};

const HistoryTab: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<DeploymentFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchDeployments = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await deploymentService.listDeployments(currentPage, 10, filters);
        setDeployments(response.data);
        setTotalPages(Math.ceil(response.total / 10));
      } catch (err) {
        console.error('Failed to fetch deployment history:', err);
        setError('Failed to load deployment history');
      } finally {
        setLoading(false);
      }
    };

    fetchDeployments();
  }, [currentPage, filters]);

  const handleFilterChange = (key: keyof DeploymentFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value || undefined }));
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '20px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` }}>
        <div style={{ textAlign: 'center', padding: '40px', color: isDark ? '#ffffff' : '#666666' }}>
          Loading deployment history...
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
            value={filters.environment || ''} 
            onChange={(e) => handleFilterChange('environment', e.target.value)}
            style={{
              background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
              borderRadius: '8px',
              padding: '8px 12px',
              color: isDark ? '#ffffff' : '#000000',
              fontSize: '14px'
            }}
          >
            <option value="">All Environments</option>
            <option value="development">Development</option>
            <option value="staging">Staging</option>
            <option value="production">Production</option>
            <option value="testing">Testing</option>
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
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="running">Running</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </GlassCard>

      {/* Deployment History */}
      <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '20px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` }}>
        <h2 style={{ color: isDark ? '#ffffff' : '#000000', marginBottom: '20px' }}>Deployment History</h2>

        <div style={{ display: 'grid', gap: '12px' }}>
          {deployments.map((deployment) => (
            <motion.div
              key={deployment.id}
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
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              whileHover={{ 
                background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                transform: 'translateY(-1px)'
              }}
            >
              <div style={{ color: '#3B82F6', fontSize: '20px' }}>
                <Icon name="deploy-rocket" size="md" />
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{ 
                  color: isDark ? '#ffffff' : '#000000',
                  fontWeight: 600,
                  fontSize: '16px',
                  marginBottom: '4px'
                }}>
                  {deployment.name}
                </div>
                <div style={{ 
                  color: isDark ? '#ffffff' : '#666666',
                  fontSize: '14px',
                  opacity: 0.8
                }}>
                  {deployment.application} • {deployment.environment} • by {deployment.deployedBy}
                </div>
              </div>

              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 12px',
                background: `${getDeploymentStatusColor(deployment.status)}20`,
                borderRadius: '20px',
                border: `1px solid ${getDeploymentStatusColor(deployment.status)}40`
              }}>
                <div style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: getDeploymentStatusColor(deployment.status)
                }} />
                <span style={{
                  color: getDeploymentStatusColor(deployment.status),
                  fontSize: '12px',
                  fontWeight: 500,
                  textTransform: 'capitalize'
                }}>
                  {deployment.status}
                </span>
              </div>

              <div style={{ 
                color: isDark ? '#ffffff' : '#666666',
                fontSize: '12px',
                textAlign: 'right',
                minWidth: '80px'
              }}>
                {formatRelativeTime(deployment.createdAt)}
                {deployment.duration && (
                  <div style={{ opacity: 0.7 }}>
                    {Math.floor(deployment.duration / 60)}m {deployment.duration % 60}s
                  </div>
                )}
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

const EnvironmentsTab: React.FC<{ isDark: boolean }> = ({ isDark }) => (
  <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '20px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` }}>
    <h2 style={{ color: isDark ? '#ffffff' : '#000000', marginBottom: '20px' }}>Environment Management</h2>
    <div style={{ color: isDark ? '#ffffff' : '#666666' }}>
      <p>Manage deployment environments and configurations</p>
      <p>• Production environment: Healthy</p>
      <p>• Staging environment: Healthy</p>
      <p>• Development environment: Healthy</p>
      <p>• Testing environment: Maintenance</p>
    </div>
  </GlassCard>
);

// Helper functions
const getDeploymentStatusColor = (status: string) => {
  const colors = {
    pending: '#F59E0B',
    running: '#3B82F6',
    completed: '#10B981',
    failed: '#EF4444',
    cancelled: '#6B7280',
    rollback: '#8B5CF6'
  };
  return colors[status as keyof typeof colors] || '#6B7280';
};

const getEnvironmentStatusColor = (status: string) => {
  const colors = {
    healthy: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    maintenance: '#6B7280'
  };
  return colors[status as keyof typeof colors] || '#6B7280';
};

const getPipelineStatusColor = (status: string) => {
  const colors = {
    idle: '#6B7280',
    running: '#3B82F6',
    success: '#10B981',
    failed: '#EF4444'
  };
  return colors[status as keyof typeof colors] || '#6B7280';
};

const getStageStatusColor = (status: string) => {
  const colors = {
    pending: '#6B7280',
    running: '#3B82F6',
    success: '#10B981',
    failed: '#EF4444',
    skipped: '#9CA3AF'
  };
  return colors[status as keyof typeof colors] || '#6B7280';
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

export default DeploymentsPage;