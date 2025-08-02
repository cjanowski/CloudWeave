import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import { Icon } from '../../components/common/Icon';
import { GlassCard } from '../../components/common/GlassCard';
import { GlassButton } from '../../components/common/GlassButton';
import DemoBanner from '../../components/common/DemoBanner';
import DemoIndicator from '../../components/common/DemoIndicator';
import { deploymentService } from '../../services/deploymentService';
import { loadDemoDeployments } from '../../store/slices/demoSlice';
import type { DeploymentStats, Deployment, Environment, Pipeline, DeploymentFilters } from '../../services/deploymentService';
import type { RootState, AppDispatch } from '../../store';

interface TabItem {
  id: string;
  label: string;
  icon: React.ReactElement;
  content: React.ReactNode;
}

export const DeploymentsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { theme } = useSelector((state: RootState) => state.ui);
  const { isDemo } = useSelector((state: RootState) => state.demo);
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
      {/* Demo Banner */}
      <DemoBanner />
      
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ marginBottom: '24px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: 'bold', 
            margin: 0,
            color: isDark ? '#ffffff' : '#000000',
            background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 50%, #1D4ED8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Deployment Management
          </h1>
          {isDemo && <DemoIndicator size="small" inline />}
        </div>
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
        console.log('Environments data received:', environmentsData, 'Type:', typeof environmentsData, 'Is array:', Array.isArray(environmentsData));
        setStats(statsData);
        setRecentDeployments(deploymentsData);
        // Ensure environments is always an array
        setEnvironments(Array.isArray(environmentsData) ? environmentsData : []);
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
            {(recentDeployments || []).map((deployment, index) => (
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
            {(() => {
              const envArray = Array.isArray(environments) ? environments : [];
              return envArray.map((env, index) => (
                <div key={env.id} style={{ 
                  marginBottom: index < envArray.length - 1 ? '12px' : '0',
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
              ));
            })()}
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
        {(pipelines || []).map((pipeline) => (
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
              {(pipeline.stages || []).map((stage) => (
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
          {(deployments || []).map((deployment) => (
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

const EnvironmentsTab: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const [environments, setEnvironments] = useState([
    { id: '1', name: 'Production', status: 'healthy', services: 12, uptime: 99.9, lastDeployment: '2024-01-15T14:30:00Z', url: 'https://app.company.com' },
    { id: '2', name: 'Staging', status: 'healthy', services: 8, uptime: 98.5, lastDeployment: '2024-01-16T09:15:00Z', url: 'https://staging.company.com' },
    { id: '3', name: 'Development', status: 'warning', services: 6, uptime: 95.2, lastDeployment: '2024-01-16T11:45:00Z', url: 'https://dev.company.com' },
    { id: '4', name: 'Testing', status: 'maintenance', services: 4, uptime: 87.3, lastDeployment: '2024-01-14T16:20:00Z', url: 'https://test.company.com' },
  ]);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const getEnvironmentIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'production': return 'deploy-start';
      case 'staging': return 'deploy-pipeline';
      case 'development': return 'action-code';
      case 'testing': return 'monitor-chart';
      default: return 'cloud-compute';
    }
  };

  const formatLastDeployment = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return `${diffDays}d ago`;
    }
  };

  const totalServices = environments.reduce((sum, env) => sum + env.services, 0);
  const avgUptime = (environments.reduce((sum, env) => sum + env.uptime, 0) / environments.length).toFixed(1);
  const healthyCount = environments.filter(env => env.status === 'healthy').length;

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      {/* Header with Create Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ color: isDark ? '#ffffff' : '#000000', margin: '0 0 8px 0' }}>Environment Management</h2>
          <p style={{ color: isDark ? '#ffffff' : '#666666', margin: 0, fontSize: '14px' }}>
            Manage deployment environments and configurations
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
          Create Environment
        </GlassButton>
      </div>

      {/* Environment Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {[
          { label: 'Total Environments', value: environments.length, color: '#6B7280' },
          { label: 'Healthy', value: healthyCount, color: '#10B981' },
          { label: 'Total Services', value: totalServices, color: '#3B82F6' },
          { label: 'Avg Uptime', value: `${avgUptime}%`, color: parseFloat(avgUptime) > 99 ? '#10B981' : parseFloat(avgUptime) > 95 ? '#F59E0B' : '#EF4444' },
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

      {/* Environments List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '20px' }}>
        {(environments || []).map((env) => (
          <GlassCard key={env.id} variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ color: '#3B82F6', fontSize: '24px' }}>
                  <Icon name={getEnvironmentIcon(env.name)} size="lg" />
                </div>
                <div>
                  <h3 style={{ color: isDark ? '#ffffff' : '#000000', margin: '0 0 4px 0', fontSize: '18px' }}>
                    {env.name}
                  </h3>
                  <p style={{ color: isDark ? '#ffffff' : '#666666', margin: 0, fontSize: '14px' }}>
                    {env.services} services running
                  </p>
                </div>
              </div>
              <div style={{
                padding: '6px 12px',
                borderRadius: '20px',
                background: `${getEnvironmentStatusColor(env.status)}20`,
                border: `1px solid ${getEnvironmentStatusColor(env.status)}40`,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <div style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: getEnvironmentStatusColor(env.status)
                }} />
                <span style={{
                  color: getEnvironmentStatusColor(env.status),
                  fontSize: '12px',
                  fontWeight: 500,
                  textTransform: 'capitalize'
                }}>
                  {env.status}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: isDark ? '#ffffff' : '#666666', fontSize: '14px' }}>Uptime:</span>
                <span style={{ 
                  color: env.uptime > 99 ? '#10B981' : env.uptime > 95 ? '#F59E0B' : '#EF4444', 
                  fontSize: '14px',
                  fontWeight: 600
                }}>
                  {env.uptime}%
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: isDark ? '#ffffff' : '#666666', fontSize: '14px' }}>Last deployment:</span>
                <span style={{ color: isDark ? '#ffffff' : '#000000', fontSize: '14px' }}>
                  {formatLastDeployment(env.lastDeployment)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: isDark ? '#ffffff' : '#666666', fontSize: '14px' }}>URL:</span>
                <a 
                  href={env.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ 
                    color: '#3B82F6', 
                    fontSize: '14px',
                    textDecoration: 'none'
                  }}
                >
                  {env.url.replace('https://', '')}
                </a>
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
                <Icon name="monitor-chart" size="sm" />
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
          </GlassCard>
        ))}
      </div>
    </div>
  );
};

// Deployments Tab Component
const DeploymentsTab: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [filters, setFilters] = useState({
    environment: '',
    status: '',
    application: '',
    search: ''
  });

  useEffect(() => {
    const fetchDeployments = async () => {
      try {
        setLoading(true);
        const data = await deploymentService.getDeployments();
        setDeployments(data);
      } catch (error) {
        console.error('Failed to fetch deployments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDeployments();
  }, []);

  const filteredDeployments = deployments.filter(deployment => {
    if (filters.environment && deployment.environment !== filters.environment) return false;
    if (filters.status && deployment.status !== filters.status) return false;
    if (filters.application && deployment.application !== filters.application) return false;
    if (filters.search && !deployment.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      {/* Header with Create Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ color: isDark ? '#ffffff' : '#000000', margin: '0 0 8px 0' }}>Deployments</h2>
          <p style={{ color: isDark ? '#ffffff' : '#666666', margin: 0, fontSize: '14px' }}>
            Manage your application deployments
          </p>
        </div>
        <GlassButton
          variant="primary"
          size="medium"
          isDark={isDark}
          onClick={() => setShowCreateWizard(true)}
          style={{ borderRadius: '12px' }}
        >
          <Icon name="action-plus" size="sm" />
          New Deployment
        </GlassButton>
      </div>

      {/* Filters */}
      <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ color: isDark ? '#ffffff' : '#666666', marginBottom: '8px', display: 'block', fontSize: '14px' }}>
              Environment
            </label>
            <select
              value={filters.environment}
              onChange={(e) => setFilters({ ...filters, environment: e.target.value })}
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
              <option value="">All Environments</option>
              <option value="development">Development</option>
              <option value="staging">Staging</option>
              <option value="production">Production</option>
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
              <option value="pending">Pending</option>
              <option value="running">Running</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label style={{ color: isDark ? '#ffffff' : '#666666', marginBottom: '8px', display: 'block', fontSize: '14px' }}>
              Application
            </label>
            <input
              type="text"
              placeholder="Search applications..."
              value={filters.application}
              onChange={(e) => setFilters({ ...filters, application: e.target.value })}
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

          <div>
            <label style={{ color: isDark ? '#ffffff' : '#666666', marginBottom: '8px', display: 'block', fontSize: '14px' }}>
              Search
            </label>
            <input
              type="text"
              placeholder="Search deployments..."
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

      {/* Deployments List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: isDark ? '#ffffff' : '#666666' }}>
          Loading deployments...
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {(filteredDeployments || []).map((deployment) => (
            <GlassCard key={deployment.id} variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ color: isDark ? '#ffffff' : '#000000', margin: '0 0 4px 0', fontSize: '16px' }}>
                    {deployment.name}
                  </h3>
                  <p style={{ color: isDark ? '#ffffff' : '#666666', margin: 0, fontSize: '14px' }}>
                    {deployment.application} • v{deployment.version} • {deployment.environment}
                  </p>
                </div>
                <div style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  background: getDeploymentStatusColor(deployment.status),
                  color: '#ffffff',
                  fontSize: '12px',
                  textTransform: 'uppercase'
                }}>
                  {deployment.status}
                </div>
              </div>

              {/* Progress Bar */}
              {deployment.status === 'running' && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: isDark ? '#ffffff' : '#666666', fontSize: '14px' }}>Progress</span>
                    <span style={{ color: isDark ? '#ffffff' : '#000000', fontSize: '14px' }}>{deployment.progress}%</span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${deployment.progress}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #10B981 0%, #059669 100%)',
                      borderRadius: '4px',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gap: '8px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: isDark ? '#ffffff' : '#666666', fontSize: '14px' }}>Started:</span>
                  <span style={{ color: isDark ? '#ffffff' : '#000000', fontSize: '14px' }}>
                    {deployment.startedAt ? new Date(deployment.startedAt).toLocaleString() : 'Not started'}
                  </span>
                </div>
                {deployment.completedAt && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: isDark ? '#ffffff' : '#666666', fontSize: '14px' }}>Completed:</span>
                    <span style={{ color: isDark ? '#ffffff' : '#000000', fontSize: '14px' }}>
                      {new Date(deployment.completedAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <GlassButton
                  variant="ghost"
                  size="small"
                  isDark={isDark}
                  style={{ borderRadius: '8px', flex: 1 }}
                >
                  <Icon name="monitor-chart" size="sm" />
                  View Logs
                </GlassButton>
                <GlassButton
                  variant="ghost"
                  size="small"
                  isDark={isDark}
                  style={{ borderRadius: '8px', flex: 1 }}
                >
                  <Icon name="action-edit" size="sm" />
                  Details
                </GlassButton>
                {deployment.status === 'running' && (
                  <GlassButton
                    variant="ghost"
                    size="small"
                    isDark={isDark}
                    style={{ borderRadius: '8px', flex: 1 }}
                  >
                    <Icon name="action-stop" size="sm" />
                    Cancel
                  </GlassButton>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Deployment Creation Wizard Modal */}
      {showCreateWizard && (
        <DeploymentWizard isDark={isDark} onClose={() => setShowCreateWizard(false)} onSuccess={(newDeployment) => {
          setDeployments([newDeployment, ...deployments]);
          setShowCreateWizard(false);
        }} />
      )}
    </div>
  );
};

// Deployment Creation Wizard Component
const DeploymentWizard: React.FC<{ 
  isDark: boolean; 
  onClose: () => void; 
  onSuccess: (deployment: Deployment) => void;
}> = ({ isDark, onClose, onSuccess }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    application: '',
    version: '',
    environment: 'development',
    configuration: {} as any
  });
  const [loading, setLoading] = useState(false);

  const steps = [
    { id: 1, title: 'Basic Info', description: 'Deployment name and application' },
    { id: 2, title: 'Configuration', description: 'Environment and settings' },
    { id: 3, title: 'Review', description: 'Review and deploy' }
  ];

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      const newDeployment = await deploymentService.createDeployment(formData);
      onSuccess(newDeployment);
    } catch (error) {
      console.error('Failed to create deployment:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div style={{ display: 'grid', gap: '20px' }}>
            <div>
              <label style={{ color: isDark ? '#ffffff' : '#666666', marginBottom: '8px', display: 'block', fontSize: '14px' }}>
                Deployment Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter deployment name"
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
                Application *
              </label>
              <input
                type="text"
                required
                value={formData.application}
                onChange={(e) => setFormData({ ...formData, application: e.target.value })}
                placeholder="Enter application name"
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
                Version *
              </label>
              <input
                type="text"
                required
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                placeholder="e.g., 1.0.0"
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
          </div>
        );

      case 2:
        return (
          <div style={{ display: 'grid', gap: '20px' }}>
            <div>
              <label style={{ color: isDark ? '#ffffff' : '#666666', marginBottom: '8px', display: 'block', fontSize: '14px' }}>
                Environment *
              </label>
              <select
                required
                value={formData.environment}
                onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
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
                <option value="development">Development</option>
                <option value="staging">Staging</option>
                <option value="production">Production</option>
              </select>
            </div>

            <div>
              <label style={{ color: isDark ? '#ffffff' : '#666666', marginBottom: '8px', display: 'block', fontSize: '14px' }}>
                Configuration (JSON)
              </label>
              <textarea
                value={JSON.stringify(formData.configuration, null, 2)}
                onChange={(e) => {
                  try {
                    const config = JSON.parse(e.target.value);
                    setFormData({ ...formData, configuration: config });
                  } catch (error) {
                    // Invalid JSON, keep the text but don't update config
                  }
                }}
                placeholder="Enter configuration as JSON"
                rows={6}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                  background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                  color: isDark ? '#ffffff' : '#000000',
                  fontSize: '14px',
                  fontFamily: 'monospace',
                  resize: 'vertical'
                }}
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div style={{ display: 'grid', gap: '16px' }}>
            <h3 style={{ color: isDark ? '#ffffff' : '#000000', margin: '0 0 16px 0' }}>Review Deployment</h3>
            
            <div style={{ display: 'grid', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: isDark ? '#ffffff' : '#666666', fontSize: '14px' }}>Name:</span>
                <span style={{ color: isDark ? '#ffffff' : '#000000', fontSize: '14px' }}>{formData.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: isDark ? '#ffffff' : '#666666', fontSize: '14px' }}>Application:</span>
                <span style={{ color: isDark ? '#ffffff' : '#000000', fontSize: '14px' }}>{formData.application}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: isDark ? '#ffffff' : '#666666', fontSize: '14px' }}>Version:</span>
                <span style={{ color: isDark ? '#ffffff' : '#000000', fontSize: '14px' }}>{formData.version}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: isDark ? '#ffffff' : '#666666', fontSize: '14px' }}>Environment:</span>
                <span style={{ color: isDark ? '#ffffff' : '#000000', fontSize: '14px' }}>{formData.environment}</span>
              </div>
            </div>

            <div style={{ 
              padding: '12px', 
              borderRadius: '8px', 
              background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
            }}>
              <h4 style={{ color: isDark ? '#ffffff' : '#000000', margin: '0 0 8px 0', fontSize: '14px' }}>Configuration:</h4>
              <pre style={{ 
                color: isDark ? '#ffffff' : '#000000', 
                fontSize: '12px', 
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {JSON.stringify(formData.configuration, null, 2)}
              </pre>
            </div>
          </div>
        );

      default:
        return null;
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
        maxWidth: '600px', 
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ color: isDark ? '#ffffff' : '#000000', margin: 0 }}>Create Deployment</h2>
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

        {/* Step Indicator */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {steps.map((step) => (
            <div
              key={step.id}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '8px',
                background: currentStep >= step.id 
                  ? 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)'
                  : isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                border: `1px solid ${currentStep >= step.id 
                  ? 'rgba(139, 92, 246, 0.3)' 
                  : isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                textAlign: 'center',
                cursor: 'pointer'
              }}
              onClick={() => setCurrentStep(step.id)}
            >
              <div style={{ 
                color: currentStep >= step.id ? '#ffffff' : isDark ? '#ffffff' : '#000000',
                fontSize: '12px',
                fontWeight: 'bold',
                marginBottom: '4px'
              }}>
                {step.title}
              </div>
              <div style={{ 
                color: currentStep >= step.id ? 'rgba(255, 255, 255, 0.8)' : isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                fontSize: '10px'
              }}>
                {step.description}
              </div>
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div style={{ marginBottom: '24px' }}>
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          {currentStep > 1 && (
            <GlassButton
              type="button"
              variant="ghost"
              size="medium"
              isDark={isDark}
              onClick={() => setCurrentStep(currentStep - 1)}
              style={{ borderRadius: '12px', flex: 1 }}
            >
              Previous
            </GlassButton>
          )}
          
          {currentStep < steps.length ? (
            <GlassButton
              type="button"
              variant="primary"
              size="medium"
              isDark={isDark}
              onClick={() => setCurrentStep(currentStep + 1)}
              style={{ borderRadius: '12px', flex: 1 }}
            >
              Next
            </GlassButton>
          ) : (
            <GlassButton
              type="button"
              variant="primary"
              size="medium"
              isDark={isDark}
              onClick={handleSubmit}
              disabled={loading}
              style={{ borderRadius: '12px', flex: 1 }}
            >
              {loading ? 'Creating...' : 'Create Deployment'}
            </GlassButton>
          )}
        </div>
      </GlassCard>
    </div>
  );
};

// Helper function for deployment status colors
const getDeploymentStatusColor = (status: string) => {
  const colors = {
    pending: '#F59E0B',
    running: '#3B82F6',
    completed: '#10B981',
    failed: '#EF4444',
    cancelled: '#6B7280'
  };
  return colors[status as keyof typeof colors] || '#666666';
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