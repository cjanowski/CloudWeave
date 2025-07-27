import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { Icon } from '../../components/common/Icon';
import { GlassCard } from '../../components/common/GlassCard';
import { GlassButton } from '../../components/common/GlassButton';
import { dashboardService } from '../../services/dashboardService';
import type { DashboardStats, DashboardActivity, PerformanceMetrics, CostMetrics, SecurityMetrics, InfrastructureMetrics, ReportsMetrics } from '../../services/dashboardService';

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
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<DashboardActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [statsData, activityData] = await Promise.all([
          dashboardService.getDashboardStats(),
          dashboardService.getRecentActivity()
        ]);
        setStats(statsData);
        setActivity(activityData);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();

    // Start real-time updates
    dashboardService.startRealTimeUpdates();

    // Subscribe to real-time updates
    const unsubscribeStats = dashboardService.subscribe('stats-updated', (newStats: DashboardStats) => {
      setStats(newStats);
      setLastUpdated(new Date());
    });

    const unsubscribeActivity = dashboardService.subscribe('activity-added', (newActivity: DashboardActivity) => {
      setActivity(prev => [newActivity, ...prev.slice(0, 4)]); // Keep only latest 5 activities
      setLastUpdated(new Date());
    });

    // Cleanup subscriptions
    return () => {
      unsubscribeStats();
      unsubscribeActivity();
    };
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
        Loading dashboard data...
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
      title: 'Active Resources', 
      value: stats.activeResources.toString(), 
      change: stats.activeResourcesChange, 
      trend: stats.activeResourcesTrend 
    },
    { 
      title: 'Deployments', 
      value: stats.deployments.toString(), 
      change: stats.deploymentsChange, 
      trend: stats.deploymentsTrend 
    },
    { 
      title: 'Cost This Month', 
      value: `$${stats.costThisMonth.toLocaleString()}`, 
      change: stats.costThisMonthChange, 
      trend: stats.costThisMonthTrend 
    },
    { 
      title: 'Uptime', 
      value: `${stats.uptime}%`, 
      change: stats.uptimeChange, 
      trend: stats.uptimeTrend 
    },
  ];

  return (
    <div>
      {/* Real-time indicator */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
        fontSize: '14px',
        color: isDark ? '#ffffff' : '#666666',
        opacity: 0.8
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#10B981',
            animation: 'pulse 2s infinite'
          }} />
          <span>Live data</span>
        </div>
        <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
      </div>

      {/* Stats Grid */}
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
            {activity.map((activityItem, index) => (
              <div
                key={activityItem.id}
                style={{
                  padding: '16px 0',
                  borderBottom: index < activity.length - 1 ? `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` : 'none',
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
                <span style={{ 
                  color: getActivityColor(activityItem.type, isDark),
                  fontWeight: 500
                }}>
                  {activityItem.type.toUpperCase()}
                </span>
                {' '}
                {activityItem.message}
                <span style={{ 
                  opacity: 0.6,
                  fontSize: '12px',
                  marginLeft: '8px'
                }}>
                  {formatRelativeTime(activityItem.timestamp)}
                </span>
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

const PerformanceTab: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await dashboardService.getPerformanceMetrics();
        setMetrics(data);
      } catch (error) {
        console.error('Failed to fetch performance metrics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();

    // Subscribe to real-time performance updates
    const unsubscribe = dashboardService.subscribe('performance-updated', (newMetrics: PerformanceMetrics) => {
      setMetrics(newMetrics);
      setLastUpdated(new Date());
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '20px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` }}>
        <div style={{ color: isDark ? '#ffffff' : '#666666', textAlign: 'center', padding: '40px' }}>Loading...</div>
      </GlassCard>
    );
  }

  return (
    <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '20px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px'
      }}>
        <h2 style={{ color: isDark ? '#ffffff' : '#000000', margin: 0 }}>Performance Metrics</h2>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '12px',
          color: isDark ? '#ffffff' : '#666666',
          opacity: 0.7
        }}>
          <div style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: '#10B981',
            animation: 'pulse 2s infinite'
          }} />
          <span>Updated: {lastUpdated.toLocaleTimeString()}</span>
        </div>
      </div>
      <div style={{ color: isDark ? '#ffffff' : '#666666' }}>
        <p>CPU Usage: {metrics?.cpuUsage || 0}%</p>
        <p>Memory Usage: {metrics?.memoryUsage || 0}%</p>
        <p>Network I/O: {metrics?.networkIO || 0} GB/s</p>
        <p>Response Time: {metrics?.responseTime || 0}ms</p>
        {metrics?.timestamp && (
          <p style={{ marginTop: '16px', fontSize: '12px', opacity: 0.7 }}>
            Last updated: {new Date(metrics.timestamp).toLocaleString()}
          </p>
        )}
      </div>
    </GlassCard>
  );
};

const CostsTab: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const [metrics, setMetrics] = useState<CostMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await dashboardService.getCostMetrics();
        setMetrics(data);
      } catch (error) {
        console.error('Failed to fetch cost metrics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '20px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` }}>
        <div style={{ color: isDark ? '#ffffff' : '#666666', textAlign: 'center', padding: '40px' }}>Loading...</div>
      </GlassCard>
    );
  }

  return (
    <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '20px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` }}>
      <h2 style={{ color: isDark ? '#ffffff' : '#000000', marginBottom: '20px' }}>Cost Analysis</h2>
      <div style={{ color: isDark ? '#ffffff' : '#666666' }}>
        <p>This Month: ${metrics?.thisMonth?.toLocaleString() || 0}</p>
        <p>Last Month: ${metrics?.lastMonth?.toLocaleString() || 0}</p>
        <p>Projected: ${metrics?.projected?.toLocaleString() || 0}</p>
        <p style={{ color: '#10B981' }}>Savings: ${metrics?.savings?.toLocaleString() || 0} ({metrics?.savingsPercentage || 0}%)</p>
      </div>
    </GlassCard>
  );
};

const SecurityTab: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await dashboardService.getSecurityMetrics();
        setMetrics(data);
      } catch (error) {
        console.error('Failed to fetch security metrics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '20px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` }}>
        <div style={{ color: isDark ? '#ffffff' : '#666666', textAlign: 'center', padding: '40px' }}>Loading...</div>
      </GlassCard>
    );
  }

  return (
    <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '20px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` }}>
      <h2 style={{ color: isDark ? '#ffffff' : '#000000', marginBottom: '20px' }}>Security Overview</h2>
      <div style={{ color: isDark ? '#ffffff' : '#666666' }}>
        <p>Security Score: {metrics?.securityScore || 0}/100</p>
        <p>Vulnerabilities: {metrics?.vulnerabilities.critical || 0} Critical, {metrics?.vulnerabilities.medium || 0} Medium, {metrics?.vulnerabilities.low || 0} Low</p>
        <p>Last Scan: {metrics?.lastScan ? formatRelativeTime(metrics.lastScan) : 'Unknown'}</p>
        <p>Compliance: {metrics?.compliance?.join(', ') || 'None'}</p>
      </div>
    </GlassCard>
  );
};

const InfrastructureTab: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const [metrics, setMetrics] = useState<InfrastructureMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await dashboardService.getInfrastructureMetrics();
        setMetrics(data);
      } catch (error) {
        console.error('Failed to fetch infrastructure metrics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '20px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` }}>
        <div style={{ color: isDark ? '#ffffff' : '#666666', textAlign: 'center', padding: '40px' }}>Loading...</div>
      </GlassCard>
    );
  }

  return (
    <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '20px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` }}>
      <h2 style={{ color: isDark ? '#ffffff' : '#000000', marginBottom: '20px' }}>Infrastructure Status</h2>
      <div style={{ color: isDark ? '#ffffff' : '#666666' }}>
        <p>EC2 Instances: {metrics?.ec2Instances || 0} running</p>
        <p>Load Balancers: {metrics?.loadBalancers || 0} active</p>
        <p>Databases: {metrics?.databases.rds || 0} RDS, {metrics?.databases.dynamodb || 0} DynamoDB</p>
        <p>Storage: {metrics?.storageUsed || 0} TB used</p>
      </div>
    </GlassCard>
  );
};

const ReportsTab: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const [metrics, setMetrics] = useState<ReportsMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await dashboardService.getReportsMetrics();
        setMetrics(data);
      } catch (error) {
        console.error('Failed to fetch reports metrics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '20px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` }}>
        <div style={{ color: isDark ? '#ffffff' : '#666666', textAlign: 'center', padding: '40px' }}>Loading...</div>
      </GlassCard>
    );
  }

  return (
    <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '20px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` }}>
      <h2 style={{ color: isDark ? '#ffffff' : '#000000', marginBottom: '20px' }}>Reports & Analytics</h2>
      <div style={{ color: isDark ? '#ffffff' : '#666666' }}>
        <p>Monthly Report: {metrics?.monthlyReportAvailable ? 'Available' : 'Not Available'}</p>
        <p>Cost Optimization: {metrics?.costOptimizationRecommendations || 0} recommendations</p>
        <p>Performance Trends: {metrics?.performanceTrend || 'Unknown'}</p>
        <p>Security Audit: {metrics?.nextSecurityAudit ? `Scheduled for ${new Date(metrics.nextSecurityAudit).toLocaleDateString()}` : 'Not scheduled'}</p>
      </div>
    </GlassCard>
  );
};

// Helper functions
const getActivityColor = (type: string, isDark: boolean) => {
  const colors = {
    deployment: '#10B981',
    infrastructure: '#3B82F6',
    security: '#F59E0B',
    cost: '#EF4444',
    alert: '#8B5CF6'
  };
  return colors[type as keyof typeof colors] || (isDark ? '#ffffff' : '#666666');
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

export default DashboardTabs;