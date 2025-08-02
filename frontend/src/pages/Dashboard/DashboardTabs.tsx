import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { Icon } from '../../components/common/Icon';
import { GlassCard } from '../../components/common/GlassCard';
import { GlassButton } from '../../components/common/GlassButton';
import { LineChart, BarChart, DoughnutChart, RadarChart, MetricCard, type ChartData } from '../../components/common/ChartComponents';
import { formatRelativeTime, getActivityColor, getActivityIcon } from './DashboardTabsHelpers';

import { dashboardService } from '../../services/dashboardService';
import type { DashboardStats, DashboardActivity, PerformanceMetrics, InfrastructureMetrics, ReportsMetrics } from '../../services/dashboardService';

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
        setActivity(activityData || []);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Failed to load dashboard data');
        // Ensure activity is never null
        setActivity([]);
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
      setActivity(prev => [newActivity, ...(prev || []).slice(0, 4)]); // Keep only latest 5 activities
      setLastUpdated(new Date());
    });

    // Cleanup subscriptions
    return () => {
      unsubscribeStats();
      unsubscribeActivity();
    };
  }, []);

  const handleExport = () => {
    const data = {
      stats,
      activity,
      lastUpdated: lastUpdated.toISOString(),
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-overview-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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
        color: '#ef4444'
      }}>
        {error}
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      {/* Header with Export Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ color: isDark ? '#ffffff' : '#000000', margin: '0 0 8px 0' }}>Dashboard Overview</h2>
          <p style={{ color: isDark ? '#ffffff' : '#666666', margin: 0, fontSize: '14px' }}>
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <GlassButton
          variant="ghost"
          size="small"
          isDark={isDark}
          onClick={handleExport}
          style={{ borderRadius: '8px' }}
        >
          <Icon name="action-download" size="sm" />
          Export Data
        </GlassButton>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                padding: '8px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: '#ffffff'
              }}>
                <Icon name="cloud-server" size="sm" />
              </div>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: isDark ? '#ffffff' : '#666666' }}>
                  Active Resources
                </p>
                <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: isDark ? '#ffffff' : '#000000' }}>
                  {stats.activeResources}
                </p>
                <p style={{
                  margin: '4px 0 0 0',
                  fontSize: '12px',
                  color: stats.activeResourcesTrend === 'up' ? '#10B981' : '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <Icon name={stats.activeResourcesTrend === 'up' ? 'monitor-trending-up' : 'monitor-trending-down'} size="xs" />
                  {stats.activeResourcesChange}
                </p>
              </div>
            </div>
          </GlassCard>

          <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                padding: '8px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                color: '#ffffff'
              }}>
                <Icon name="action-upload" size="sm" />
              </div>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: isDark ? '#ffffff' : '#666666' }}>
                  Deployments
                </p>
                <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: isDark ? '#ffffff' : '#000000' }}>
                  {stats.deployments}
                </p>
                <p style={{
                  margin: '4px 0 0 0',
                  fontSize: '12px',
                  color: stats.deploymentsTrend === 'up' ? '#10B981' : '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <Icon name={stats.deploymentsTrend === 'up' ? 'monitor-trending-up' : 'monitor-trending-down'} size="xs" />
                  {stats.deploymentsChange}
                </p>
              </div>
            </div>
          </GlassCard>

          <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                padding: '8px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                color: '#ffffff'
              }}>
                <Icon name="cost-dollar" size="sm" />
              </div>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: isDark ? '#ffffff' : '#666666' }}>
                  Monthly Cost
                </p>
                <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: isDark ? '#ffffff' : '#000000' }}>
                  ${stats.costThisMonth}
                </p>
                <p style={{
                  margin: '4px 0 0 0',
                  fontSize: '12px',
                  color: stats.costThisMonthTrend === 'down' ? '#10B981' : '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <Icon name={stats.costThisMonthTrend === 'down' ? 'monitor-trending-down' : 'monitor-trending-up'} size="xs" />
                  {stats.costThisMonthChange}
                </p>
              </div>
            </div>
          </GlassCard>

          <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                padding: '8px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                color: '#ffffff'
              }}>
                <Icon name="monitor-check" size="sm" />
              </div>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: isDark ? '#ffffff' : '#666666' }}>
                  Uptime
                </p>
                <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: isDark ? '#ffffff' : '#000000' }}>
                  {stats.uptime.toFixed(4)}%
                </p>
                <p style={{
                  margin: '4px 0 0 0',
                  fontSize: '12px',
                  color: stats.uptimeTrend === 'up' ? '#10B981' : '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <Icon name={stats.uptimeTrend === 'up' ? 'monitor-trending-up' : 'monitor-trending-down'} size="xs" />
                  {stats.uptimeChange}
                </p>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Recent Activity */}
      {activity && activity.length > 0 && (
        <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '16px' }}>
          <h3 style={{ color: isDark ? '#ffffff' : '#000000', margin: '0 0 16px 0' }}>Recent Activity</h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            {activity.map((item, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: '8px',
                  background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
                }}
              >
                <div style={{
                  padding: '6px',
                  borderRadius: '6px',
                  background: getActivityColor(item.type),
                  color: '#ffffff',
                  fontSize: '12px'
                }}>
                  <Icon name={getActivityIcon(item.type)} size="xs" />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: isDark ? '#ffffff' : '#000000' }}>
                    {item.message}
                  </p>
                  <p style={{ margin: 0, fontSize: '12px', color: isDark ? '#ffffff' : '#666666' }}>
                    {new Date(item.timestamp).toLocaleString()}
                  </p>
                </div>
                <div style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  background: getActivityColor(item.type),
                  color: '#ffffff',
                  fontSize: '10px',
                  textTransform: 'uppercase'
                }}>
                  {item.type}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
};

const PerformanceTab: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');

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
  }, [timeRange]);

  // Sample chart data for demonstration
  const cpuChartData: ChartData = {
    labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
    datasets: [
      {
        label: 'CPU Usage',
        data: [45, 52, 38, 67, 89, 76, 58],
        fill: true,
      },
    ],
  };

  const memoryChartData: ChartData = {
    labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
    datasets: [
      {
        label: 'Memory Usage',
        data: [62, 58, 71, 85, 78, 82, 69],
        fill: true,
      },
    ],
  };

  const networkChartData: ChartData = {
    labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
    datasets: [
      {
        label: 'Network In',
        data: [120, 95, 180, 250, 320, 280, 150],
        fill: false,
      },
      {
        label: 'Network Out',
        data: [80, 65, 140, 200, 280, 220, 100],
        fill: false,
      },
    ],
  };

  const responseTimeChartData: ChartData = {
    labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
    datasets: [
      {
        label: 'Response Time (ms)',
        data: [45, 52, 38, 67, 89, 76, 58],
        fill: false,
      },
    ],
  };

  const resourceDistributionData: ChartData = {
    labels: ['CPU', 'Memory', 'Storage', 'Network'],
    datasets: [
      {
        label: 'Resource Usage',
        data: [65, 78, 45, 32],
      },
    ],
  };

  const handleExport = () => {
    const data = {
      metrics,
      timeRange,
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-metrics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: isDark ? '#ffffff' : '#666666' }}>
        Loading performance metrics...
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      {/* Header with Time Range and Export */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ color: isDark ? '#ffffff' : '#000000', margin: '0 0 8px 0' }}>Performance Metrics</h2>
          <p style={{ color: isDark ? '#ffffff' : '#666666', margin: 0, fontSize: '14px' }}>
            Real-time performance monitoring and analytics
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            style={{
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
          <GlassButton
            variant="ghost"
            size="small"
            isDark={isDark}
            onClick={handleExport}
            style={{ borderRadius: '8px' }}
          >
            <Icon name="action-download" size="sm" />
            Export
          </GlassButton>
        </div>
      </div>

      {/* Key Metrics Cards */}
      {metrics && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <MetricCard
            title="CPU Usage"
            value={`${metrics.cpuUsage}%`}
            icon="monitor-clock"
            isDark={isDark}
          />
          <MetricCard
            title="Memory Usage"
            value={`${metrics.memoryUsage}%`}
            icon="monitor-memory"
            isDark={isDark}
          />
          <MetricCard
            title="Network I/O"
            value={`${metrics.networkIO} MB/s`}
            icon="monitor-network"
            isDark={isDark}
          />
          <MetricCard
            title="Response Time"
            value={`${metrics.responseTime}ms`}
            icon="monitor-speed"
            isDark={isDark}
          />
        </div>
      )}

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        <LineChart
          data={cpuChartData}
          title="CPU Usage Over Time"
          height={300}
          isDark={isDark}
        />

        <LineChart
          data={memoryChartData}
          title="Memory Usage Over Time"
          height={300}
          isDark={isDark}
        />

        <LineChart
          data={networkChartData}
          title="Network Traffic"
          height={300}
          isDark={isDark}
        />

        <LineChart
          data={responseTimeChartData}
          title="Response Time"
          height={300}
          isDark={isDark}
        />

        <DoughnutChart
          data={resourceDistributionData}
          title="Resource Distribution"
          height={300}
          isDark={isDark}
        />

        <BarChart
          data={cpuChartData}
          title="CPU Usage Comparison"
          height={300}
          isDark={isDark}
        />
      </div>

      {/* Performance Insights */}
      <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '16px' }}>
        <h3 style={{ color: isDark ? '#ffffff' : '#000000', margin: '0 0 16px 0' }}>Performance Insights</h3>
        <div style={{ display: 'grid', gap: '12px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px',
            borderRadius: '8px',
            background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
          }}>
            <div style={{
              padding: '6px',
              borderRadius: '6px',
              background: '#10B981',
              color: '#ffffff',
              fontSize: '12px'
            }}>
              <Icon name="monitor-check" size="xs" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: isDark ? '#ffffff' : '#000000' }}>
                System performance is optimal
              </p>
              <p style={{ margin: 0, fontSize: '12px', color: isDark ? '#ffffff' : '#666666' }}>
                All metrics are within normal ranges
              </p>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px',
            borderRadius: '8px',
            background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
          }}>
            <div style={{
              padding: '6px',
              borderRadius: '6px',
              background: '#F59E0B',
              color: '#ffffff',
              fontSize: '12px'
            }}>
              <Icon name="monitor-alert" size="xs" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: isDark ? '#ffffff' : '#000000' }}>
                Memory usage trending upward
              </p>
              <p style={{ margin: 0, fontSize: '12px', color: isDark ? '#ffffff' : '#666666' }}>
                Consider scaling memory resources
              </p>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

const CostsTab: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const { isDemo } = useSelector((state: any) => state.demo);
  const [costData, setCostData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [timeRange, setTimeRange] = useState('30d');

  const fetchCostData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (isDemo) {
        // Use demo data service for demo mode
        const { demoDataService } = await import('../../services/demoDataService');
        const demoCostData = demoDataService.generateLocalDemoData('cost', 'startup');
        setCostData(demoCostData);
      } else {
        // Use real cost service for live data
        const { costService } = await import('../../services/costService');
        const [overview, realTimeData, recommendations] = await Promise.all([
          costService.getCostOverview(timeRange === '30d' ? 'month' : 'week'),
          costService.getRealTimeCostMonitoring(),
          costService.getCostOptimizationRecommendations()
        ]);

        setCostData({
          ...overview,
          realTime: realTimeData,
          recommendations
        });
      }

      setLastUpdated(new Date());
    } catch (err: any) {
      console.error('Failed to fetch cost data:', err);
      setError(err.message || 'Failed to load cost data');

      // Fallback to demo data on error
      try {
        const { demoDataService } = await import('../../services/demoDataService');
        const fallbackData = demoDataService.generateLocalDemoData('cost', 'startup');
        setCostData(fallbackData);
        setError('Using demo data due to connection issues');
      } catch (fallbackErr) {
        console.error('Failed to load fallback data:', fallbackErr);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCostData();
  }, [isDemo, timeRange]);

  const handleRetry = () => {
    fetchCostData();
  };

  const handleExport = () => {
    if (!costData) return;

    const exportData = {
      costData,
      timeRange,
      isDemo,
      lastUpdated: lastUpdated.toISOString(),
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cost-analysis-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div style={{ display: 'grid', gap: '24px' }}>
        {/* Header Skeleton */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{
              width: '200px',
              height: '32px',
              background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              borderRadius: '8px',
              marginBottom: '8px'
            }} />
            <div style={{
              width: '300px',
              height: '16px',
              background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
              borderRadius: '4px'
            }} />
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{
              width: '120px',
              height: '36px',
              background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
              borderRadius: '8px'
            }} />
            <div style={{
              width: '100px',
              height: '36px',
              background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
              borderRadius: '8px'
            }} />
          </div>
        </div>

        {/* Metrics Cards Skeleton */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {Array.from({ length: 4 }).map((_, index) => (
            <GlassCard key={index} variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '16px', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                  borderRadius: '8px'
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{
                    width: '80px',
                    height: '12px',
                    background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    borderRadius: '4px',
                    marginBottom: '8px'
                  }} />
                  <div style={{
                    width: '60px',
                    height: '24px',
                    background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    borderRadius: '4px',
                    marginBottom: '4px'
                  }} />
                  <div style={{
                    width: '40px',
                    height: '12px',
                    background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                    borderRadius: '4px'
                  }} />
                </div>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Charts Skeleton */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
          {Array.from({ length: 3 }).map((_, index) => (
            <GlassCard key={index} variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '16px', padding: '20px' }}>
              <div style={{
                width: '150px',
                height: '20px',
                background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                borderRadius: '4px',
                marginBottom: '20px'
              }} />
              <div style={{
                width: '100%',
                height: '250px',
                background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                borderRadius: '8px'
              }} />
            </GlassCard>
          ))}
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px',
          color: isDark ? '#ffffff' : '#666666',
          fontSize: '14px'
        }}>
          <div style={{ marginRight: '12px' }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{
                width: '16px',
                height: '16px',
                border: `2px solid ${isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'}`,
                borderTop: `2px solid ${isDark ? '#ffffff' : '#666666'}`,
                borderRadius: '50%',
              }}
            />
          </div>
          Loading cost data{isDemo ? ' (demo mode)' : ''}...
        </div>
      </div>
    );
  }

  if (error && !costData) {
    return (
      <div style={{ display: 'grid', gap: '24px' }}>
        <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '16px', padding: '40px', textAlign: 'center' }}>
          <div style={{ color: '#EF4444', marginBottom: '16px' }}>
            <Icon name="alert-triangle" size="lg" />
          </div>
          <div style={{ color: '#EF4444', fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
            Failed to load cost data
          </div>
          <div style={{ color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)', fontSize: '14px', marginBottom: '20px' }}>
            {error}
          </div>
          <GlassButton
            variant="primary"
            size="medium"
            isDark={isDark}
            onClick={handleRetry}
            style={{ borderRadius: '8px' }}
          >
            <Icon name="action-refresh" size="sm" />
            Retry
          </GlassButton>
        </GlassCard>
      </div>
    );
  }

  // Prepare chart data
  const costTrendData: ChartData = {
    labels: costData?.trends?.map((t: any) => new Date(t.date).toLocaleDateString()) ||
      costData?.trend?.map((t: any) => new Date(t.date).toLocaleDateString()) || [],
    datasets: [
      {
        label: 'Daily Cost',
        data: costData?.trends?.map((t: any) => t.cost) ||
          costData?.trend?.map((t: any) => t.amount) || [],
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const costBreakdownData: ChartData = {
    labels: Object.keys(costData?.breakdown || costData?.byService || {}),
    datasets: [
      {
        label: 'Cost by Service',
        data: Object.values(costData?.breakdown || costData?.byService || {}).map((item: any) =>
          typeof item === 'object' ? item.monthlyCost : item
        ),
        backgroundColor: [
          '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316', '#EC4899'
        ],
      },
    ],
  };

  const budgetData: ChartData = {
    labels: ['Used', 'Remaining'],
    datasets: [
      {
        label: 'Budget Usage',
        data: [
          costData?.realTime?.budgetUsed || costData?.totalCost || 0,
          costData?.realTime?.budgetRemaining || (20000 - (costData?.totalCost || 0))
        ],
        backgroundColor: ['#EF4444', '#10B981'],
      },
    ],
  };

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      {/* Header with Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ color: isDark ? '#ffffff' : '#000000', margin: '0 0 8px 0' }}>
            Cost Analysis {isDemo && <span style={{ fontSize: '14px', opacity: 0.7 }}>(Demo Mode)</span>}
          </h2>
          <p style={{ color: isDark ? '#ffffff' : '#666666', margin: 0, fontSize: '14px' }}>
            Last updated: {lastUpdated.toLocaleTimeString()}
            {error && <span style={{ color: '#F59E0B', marginLeft: '8px' }}>• {error}</span>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
              background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
              color: isDark ? '#ffffff' : '#000000',
              fontSize: '14px'
            }}
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <GlassButton
            variant="ghost"
            size="small"
            isDark={isDark}
            onClick={handleExport}
            style={{ borderRadius: '8px' }}
          >
            <Icon name="action-download" size="sm" />
            Export
          </GlassButton>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <MetricCard
          title="Total Cost"
          value={`$${(costData?.totalCost || 0).toLocaleString()}`}
          icon="cost-dollar"
          isDark={isDark}
        />
        <MetricCard
          title="This Month"
          value={`$${(costData?.realTime?.dailySpend * 30 || costData?.totalCost || 0).toLocaleString()}`}
          change={{
            value: 8,
            isPositive: false
          }}
          icon="monitor-line-chart"
          isDark={isDark}
        />
        <MetricCard
          title="Budget Used"
          value={`${Math.round(((costData?.realTime?.budgetUsed || costData?.totalCost || 0) / (costData?.realTime?.monthlyBudget || 20000)) * 100)}%`}
          icon="monitor-check"
          isDark={isDark}
        />
        <MetricCard
          title="Potential Savings"
          value={`$${(costData?.recommendations?.reduce((sum: number, rec: any) => sum + rec.savings, 0) || 0).toLocaleString()}`}
          change={{
            value: 12,
            isPositive: true
          }}
          icon="cost-savings"
          isDark={isDark}
        />
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        <LineChart
          data={costTrendData}
          title="Cost Trend"
          height={300}
          isDark={isDark}
        />

        <DoughnutChart
          data={costBreakdownData}
          title="Cost by Service"
          height={300}
          isDark={isDark}
        />

        <DoughnutChart
          data={budgetData}
          title="Budget Usage"
          height={300}
          isDark={isDark}
        />
      </div>

      {/* Cost Recommendations */}
      {costData?.recommendations && costData.recommendations.length > 0 && (
        <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '16px' }}>
          <h3 style={{ color: isDark ? '#ffffff' : '#000000', margin: '0 0 16px 0' }}>Cost Optimization Recommendations</h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            {costData.recommendations.map((rec: any, index: number) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px',
                  borderRadius: '8px',
                  background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
                }}
              >
                <div style={{
                  padding: '8px',
                  borderRadius: '8px',
                  background: rec.priority === 'high' ? '#EF4444' : rec.priority === 'medium' ? '#F59E0B' : '#10B981',
                  color: '#ffffff',
                  fontSize: '12px'
                }}>
                  <Icon name="cost-savings" size="sm" />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 600, color: isDark ? '#ffffff' : '#000000' }}>
                    {rec.title || rec.description}
                  </p>
                  <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)' }}>
                    {rec.description || rec.action}
                  </p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#10B981', fontWeight: 600 }}>
                    Potential savings: ${(rec.potentialSavings || rec.savings || 0).toLocaleString()}
                  </p>
                </div>
                <div style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  background: rec.priority === 'high' ? '#EF4444' : rec.priority === 'medium' ? '#F59E0B' : '#10B981',
                  color: '#ffffff',
                  fontSize: '10px',
                  textTransform: 'uppercase',
                  fontWeight: 600
                }}>
                  {rec.priority}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Real-time Budget Alerts */}
      {costData?.realTime?.alerts && costData.realTime.alerts.length > 0 && (
        <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '16px' }}>
          <h3 style={{ color: isDark ? '#ffffff' : '#000000', margin: '0 0 16px 0' }}>Budget Alerts</h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            {costData.realTime.alerts.map((alert: any, index: number) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px',
                  borderRadius: '8px',
                  background: alert.severity === 'critical' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                  border: `1px solid ${alert.severity === 'critical' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`,
                }}
              >
                <div style={{
                  padding: '8px',
                  borderRadius: '8px',
                  background: alert.severity === 'critical' ? '#EF4444' : '#F59E0B',
                  color: '#ffffff'
                }}>
                  <Icon name="alert-triangle" size="sm" />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 600, color: isDark ? '#ffffff' : '#000000' }}>
                    {alert.message}
                  </p>
                  <p style={{ margin: 0, fontSize: '12px', color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)' }}>
                    Current: ${alert.currentCost?.toLocaleString()} / Budget: ${alert.budget?.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
};

const SecurityTab: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const { isDemo } = useSelector((state: any) => state.demo);
  const [metrics, setMetrics] = useState<any>(null);
  const [scans, setScans] = useState<any[]>([]);
  const [vulnerabilities, setVulnerabilities] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchSecurityData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (isDemo) {
        // Use demo data service for demo mode
        const { demoDataService } = await import('../../services/demoDataService');
        const [demoMetrics, demoScans, demoVulns, demoAlerts] = await Promise.all([
          Promise.resolve(demoDataService.generateLocalDemoData('dashboard-security', 'startup')),
          Promise.resolve(demoDataService.generateLocalDemoData('security-scans', 'startup')),
          Promise.resolve(demoDataService.generateLocalDemoData('security-vulnerabilities', 'startup')),
          Promise.resolve(demoDataService.generateLocalDemoData('security-alerts', 'startup'))
        ]);

        setMetrics(demoMetrics);
        setScans(demoScans.scans || []);
        setVulnerabilities(demoVulns.vulnerabilities || []);
        setAlerts(demoAlerts || []);
      } else {
        // Use real security service for live data
        const { securityService } = await import('../../services/securityService');
        const [metricsData, scansData, vulnsData, alertsData] = await Promise.all([
          securityService.getSecurityMetrics(),
          securityService.getSecurityScans(3, 0),
          securityService.getVulnerabilities({ limit: 5, status: 'open' }),
          securityService.getSecurityAlerts(3)
        ]);

        setMetrics(metricsData);
        setScans(scansData.scans || []);
        setVulnerabilities(vulnsData.vulnerabilities || []);
        setAlerts(alertsData || []);
      }

      setLastUpdated(new Date());
    } catch (err: any) {
      console.error('Failed to fetch security data:', err);
      setError(err.message || 'Failed to load security data');

      // Fallback to demo data on error
      try {
        const { demoDataService } = await import('../../services/demoDataService');
        const fallbackMetrics = demoDataService.generateLocalDemoData('dashboard-security', 'startup');
        const fallbackScans = demoDataService.generateLocalDemoData('security-scans', 'startup');
        const fallbackVulns = demoDataService.generateLocalDemoData('security-vulnerabilities', 'startup');
        const fallbackAlerts = demoDataService.generateLocalDemoData('security-alerts', 'startup');

        setMetrics(fallbackMetrics);
        setScans(fallbackScans.scans || []);
        setVulnerabilities(fallbackVulns.vulnerabilities || []);
        setAlerts(fallbackAlerts || []);
        setError('Using demo data due to connection issues');
      } catch (fallbackErr) {
        console.error('Failed to load fallback data:', fallbackErr);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
  }, [isDemo]);

  const handleRetry = () => {
    fetchSecurityData();
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return '#DC2626';
      case 'high':
        return '#EA580C';
      case 'medium':
        return '#D97706';
      case 'low':
        return '#65A30D';
      default:
        return '#6B7280';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'alert-triangle';
      case 'high':
        return 'monitor-alert';
      case 'medium':
        return 'info-circle';
      case 'low':
        return 'status-check';
      default:
        return 'security-shield';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return '#10B981';
      case 'running':
        return '#3B82F6';
      case 'failed':
        return '#EF4444';
      case 'pending':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  const navigateToSecurity = () => {
    // Navigate to detailed security page
    window.location.href = '/security';
  };

  if (loading) {
    return (
      <div style={{ display: 'grid', gap: '24px' }}>
        {/* Header Skeleton */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{
              width: '200px',
              height: '32px',
              background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              borderRadius: '8px',
              marginBottom: '8px'
            }} />
            <div style={{
              width: '300px',
              height: '16px',
              background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
              borderRadius: '4px'
            }} />
          </div>
        </div>

        {/* Metrics Cards Skeleton */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {Array.from({ length: 4 }).map((_, index) => (
            <GlassCard key={index} variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '16px', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                  borderRadius: '8px'
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{
                    width: '80px',
                    height: '12px',
                    background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    borderRadius: '4px',
                    marginBottom: '8px'
                  }} />
                  <div style={{
                    width: '60px',
                    height: '24px',
                    background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    borderRadius: '4px'
                  }} />
                </div>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Content Skeleton */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '16px', padding: '20px' }}>
            <div style={{
              width: '150px',
              height: '20px',
              background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              borderRadius: '4px',
              marginBottom: '16px'
            }} />
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} style={{
                width: '100%',
                height: '60px',
                background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                borderRadius: '8px',
                marginBottom: '12px'
              }} />
            ))}
          </GlassCard>
          <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '16px', padding: '20px' }}>
            <div style={{
              width: '150px',
              height: '20px',
              background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              borderRadius: '4px',
              marginBottom: '16px'
            }} />
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} style={{
                width: '100%',
                height: '60px',
                background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                borderRadius: '8px',
                marginBottom: '12px'
              }} />
            ))}
          </GlassCard>
        </div>
      </div>
    );
  }

  if (error && !metrics) {
    return (
      <div style={{ display: 'grid', gap: '24px' }}>
        <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '16px', padding: '40px', textAlign: 'center' }}>
          <div style={{
            padding: '20px',
            borderRadius: '12px',
            background: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
            border: `1px solid ${isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)'}`,
            marginBottom: '20px'
          }}>
            <Icon name="alert-triangle" size="lg" style={{ color: '#EF4444', marginBottom: '12px' }} />
            <h3 style={{ color: isDark ? '#ffffff' : '#000000', margin: '0 0 8px 0' }}>
              Failed to Load Security Data
            </h3>
            <p style={{ color: isDark ? '#ffffff' : '#666666', margin: '0 0 16px 0' }}>
              {error}
            </p>
            <GlassButton
              variant="primary"
              size="small"
              isDark={isDark}
              onClick={handleRetry}
              style={{ borderRadius: '8px' }}
            >
              <Icon name="action-refresh" size="sm" />
              Retry
            </GlassButton>
          </div>
        </GlassCard>
      </div>
    );
  }

  // Empty state when no security scans are configured
  if (metrics && metrics.totalVulnerabilities === 0 && scans.length === 0) {
    return (
      <div style={{ display: 'grid', gap: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ color: isDark ? '#ffffff' : '#000000', margin: '0 0 8px 0' }}>Security Overview</h2>
            <p style={{ color: isDark ? '#ffffff' : '#666666', margin: 0, fontSize: '14px' }}>
              Monitor your infrastructure security posture
            </p>
          </div>
          <GlassButton
            variant="primary"
            size="small"
            isDark={isDark}
            onClick={navigateToSecurity}
            style={{ borderRadius: '8px' }}
          >
            <Icon name="security-shield" size="sm" />
            Configure Security
          </GlassButton>
        </div>

        <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '16px', padding: '40px', textAlign: 'center' }}>
          <div style={{
            padding: '20px',
            borderRadius: '12px',
            background: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
            border: `1px solid ${isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)'}`
          }}>
            <Icon name="security-shield" size="xl" style={{ color: '#3B82F6', marginBottom: '16px' }} />
            <h3 style={{ color: isDark ? '#ffffff' : '#000000', margin: '0 0 8px 0' }}>
              No Security Scans Configured
            </h3>
            <p style={{ color: isDark ? '#ffffff' : '#666666', margin: '0 0 20px 0', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>
              Set up security scanning to monitor your infrastructure for vulnerabilities, compliance issues, and security best practices.
            </p>
            <GlassButton
              variant="primary"
              size="medium"
              isDark={isDark}
              onClick={navigateToSecurity}
              style={{ borderRadius: '8px' }}
            >
              <Icon name="plus" size="sm" />
              Start Security Scan
            </GlassButton>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ color: isDark ? '#ffffff' : '#000000', margin: '0 0 8px 0' }}>Security Overview</h2>
          <p style={{ color: isDark ? '#ffffff' : '#666666', margin: 0, fontSize: '14px' }}>
            Last updated: {lastUpdated.toLocaleTimeString()}
            {isDemo && (
              <span style={{
                marginLeft: '8px',
                padding: '2px 6px',
                background: 'rgba(59, 130, 246, 0.2)',
                color: '#3B82F6',
                borderRadius: '4px',
                fontSize: '10px',
                textTransform: 'uppercase'
              }}>
                Demo
              </span>
            )}
            {error && (
              <span style={{
                marginLeft: '8px',
                color: '#F59E0B'
              }}>
                (Using fallback data)
              </span>
            )}
          </p>
        </div>
        <GlassButton
          variant="ghost"
          size="small"
          isDark={isDark}
          onClick={navigateToSecurity}
          style={{ borderRadius: '8px' }}
        >
          <Icon name="nav-external" size="sm" />
          View Details
        </GlassButton>
      </div>

      {/* Security Metrics Cards */}
      {metrics && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                padding: '8px',
                borderRadius: '8px',
                background: metrics.complianceScore >= 95 ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' :
                  metrics.complianceScore >= 80 ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' :
                    'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                color: '#ffffff'
              }}>
                <Icon name="security-shield" size="sm" />
              </div>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: isDark ? '#ffffff' : '#666666' }}>
                  Security Score
                </p>
                <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: isDark ? '#ffffff' : '#000000' }}>
                  {metrics.complianceScore?.toFixed(1) || 0}%
                </p>
                <p style={{
                  margin: '4px 0 0 0',
                  fontSize: '12px',
                  color: metrics.complianceScore >= 95 ? '#10B981' : metrics.complianceScore >= 80 ? '#F59E0B' : '#EF4444',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <Icon name={metrics.complianceScore >= 95 ? 'monitor-check' : 'monitor-alert'} size="xs" />
                  {metrics.complianceScore >= 95 ? 'Excellent' : metrics.complianceScore >= 80 ? 'Good' : 'Needs Attention'}
                </p>
              </div>
            </div>
          </GlassCard>

          <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                padding: '8px',
                borderRadius: '8px',
                background: metrics.openVulnerabilities === 0 ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' :
                  metrics.vulnerabilitiesBySeverity?.critical > 0 ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)' :
                    'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                color: '#ffffff'
              }}>
                <Icon name="alert-triangle" size="sm" />
              </div>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: isDark ? '#ffffff' : '#666666' }}>
                  Open Vulnerabilities
                </p>
                <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: isDark ? '#ffffff' : '#000000' }}>
                  {metrics.openVulnerabilities || 0}
                </p>
                <p style={{
                  margin: '4px 0 0 0',
                  fontSize: '12px',
                  color: isDark ? '#ffffff' : '#666666',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  {metrics.vulnerabilitiesBySeverity?.critical || 0} Critical, {metrics.vulnerabilitiesBySeverity?.high || 0} High
                </p>
              </div>
            </div>
          </GlassCard>

          <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                padding: '8px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                color: '#ffffff'
              }}>
                <Icon name="security-scan" size="sm" />
              </div>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: isDark ? '#ffffff' : '#666666' }}>
                  Recent Scans
                </p>
                <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: isDark ? '#ffffff' : '#000000' }}>
                  {metrics.recentScans || 0}
                </p>
                <p style={{
                  margin: '4px 0 0 0',
                  fontSize: '12px',
                  color: isDark ? '#ffffff' : '#666666'
                }}>
                  Last 7 days
                </p>
              </div>
            </div>
          </GlassCard>

          <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                padding: '8px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                color: '#ffffff'
              }}>
                <Icon name="monitor-check" size="sm" />
              </div>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: isDark ? '#ffffff' : '#666666' }}>
                  Total Resources
                </p>
                <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: isDark ? '#ffffff' : '#000000' }}>
                  {metrics.totalVulnerabilities + 50 || 50}
                </p>
                <p style={{
                  margin: '4px 0 0 0',
                  fontSize: '12px',
                  color: isDark ? '#ffffff' : '#666666'
                }}>
                  Monitored
                </p>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Recent Security Scans */}
        <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ color: isDark ? '#ffffff' : '#000000', margin: 0 }}>Recent Scans</h3>
            <GlassButton
              variant="ghost"
              size="small"
              isDark={isDark}
              onClick={navigateToSecurity}
              style={{ borderRadius: '6px', fontSize: '12px' }}
            >
              View All
            </GlassButton>
          </div>
          <div style={{ display: 'grid', gap: '12px' }}>
            {scans.length > 0 ? scans.slice(0, 3).map((scan, index) => (
              <div
                key={scan.id || index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: '8px',
                  background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease'
                }}
                onClick={navigateToSecurity}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)';
                }}
              >
                <div style={{
                  padding: '6px',
                  borderRadius: '6px',
                  background: getStatusColor(scan.status),
                  color: '#ffffff',
                  fontSize: '12px'
                }}>
                  <Icon name="security-scan" size="xs" />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: isDark ? '#ffffff' : '#000000' }}>
                    {scan.name}
                  </p>
                  <p style={{ margin: 0, fontSize: '12px', color: isDark ? '#ffffff' : '#666666' }}>
                    {scan.targetName} • {scan.status === 'running' ? `${scan.progress}% complete` : scan.status}
                  </p>
                </div>
                <div style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  background: getStatusColor(scan.status),
                  color: '#ffffff',
                  fontSize: '10px',
                  textTransform: 'uppercase'
                }}>
                  {scan.type}
                </div>
              </div>
            )) : (
              <div style={{
                textAlign: 'center',
                padding: '20px',
                color: isDark ? '#ffffff' : '#666666'
              }}>
                <Icon name="security-scan" size="lg" style={{ marginBottom: '8px', opacity: 0.5 }} />
                <p style={{ margin: 0, fontSize: '14px' }}>No recent scans</p>
              </div>
            )}
          </div>
        </GlassCard>

        {/* Critical Vulnerabilities */}
        <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ color: isDark ? '#ffffff' : '#000000', margin: 0 }}>Critical Issues</h3>
            <GlassButton
              variant="ghost"
              size="small"
              isDark={isDark}
              onClick={navigateToSecurity}
              style={{ borderRadius: '6px', fontSize: '12px' }}
            >
              View All
            </GlassButton>
          </div>
          <div style={{ display: 'grid', gap: '12px' }}>
            {vulnerabilities.length > 0 ? vulnerabilities.filter(v => ['critical', 'high'].includes(v.severity)).slice(0, 3).map((vuln, index) => (
              <div
                key={vuln.id || index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: '8px',
                  background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease'
                }}
                onClick={navigateToSecurity}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)';
                }}
              >
                <div style={{
                  padding: '6px',
                  borderRadius: '6px',
                  background: getSeverityColor(vuln.severity),
                  color: '#ffffff',
                  fontSize: '12px'
                }}>
                  <Icon name={getSeverityIcon(vuln.severity)} size="xs" />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: isDark ? '#ffffff' : '#000000' }}>
                    {vuln.title}
                  </p>
                  <p style={{ margin: 0, fontSize: '12px', color: isDark ? '#ffffff' : '#666666' }}>
                    {vuln.resourceName} • {vuln.resourceType}
                  </p>
                </div>
                <div style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  background: getSeverityColor(vuln.severity),
                  color: '#ffffff',
                  fontSize: '10px',
                  textTransform: 'uppercase'
                }}>
                  {vuln.severity}
                </div>
              </div>
            )) : (
              <div style={{
                textAlign: 'center',
                padding: '20px',
                color: isDark ? '#ffffff' : '#666666'
              }}>
                <Icon name="status-check" size="lg" style={{ marginBottom: '8px', opacity: 0.5, color: '#10B981' }} />
                <p style={{ margin: 0, fontSize: '14px' }}>No critical issues found</p>
              </div>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Security Alerts */}
      {alerts.length > 0 && (
        <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '16px' }}>
          <h3 style={{ color: isDark ? '#ffffff' : '#000000', margin: '0 0 16px 0' }}>Security Alerts</h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            {alerts.map((alert, index) => (
              <div
                key={alert.id || index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: '8px',
                  background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
                  border: `1px solid ${getSeverityColor(alert.severity)}20`,
                  cursor: 'pointer'
                }}
                onClick={navigateToSecurity}
              >
                <div style={{
                  padding: '6px',
                  borderRadius: '6px',
                  background: getSeverityColor(alert.severity),
                  color: '#ffffff',
                  fontSize: '12px'
                }}>
                  <Icon name={getSeverityIcon(alert.severity)} size="xs" />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: isDark ? '#ffffff' : '#000000' }}>
                    {alert.title}
                  </p>
                  <p style={{ margin: 0, fontSize: '12px', color: isDark ? '#ffffff' : '#666666' }}>
                    {alert.description} • {formatRelativeTime(alert.timestamp)}
                  </p>
                </div>
                <div style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  background: getSeverityColor(alert.severity),
                  color: '#ffffff',
                  fontSize: '10px',
                  textTransform: 'uppercase'
                }}>
                  {alert.severity}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
};

const InfrastructureTab: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const { isDemo } = useSelector((state: any) => state.demo);
  const [metrics, setMetrics] = useState<InfrastructureMetrics | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [resources, setResources] = useState<any[]>([]);
  const [recentChanges, setRecentChanges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [timeRange, setTimeRange] = useState('24h');
  const [selectedProvider, setSelectedProvider] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const fetchInfrastructureData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (isDemo) {
        // Use demo data service for demo mode
        const { demoDataService } = await import('../../services/demoDataService');
        const demoMetrics = demoDataService.generateLocalDemoData('dashboard-infrastructure', 'startup');
        const demoStats = demoDataService.generateLocalDemoData('infrastructure-stats', 'startup');
        const demoResources = demoDataService.generateLocalDemoData('infrastructure-resources', 'startup');
        const demoChanges = demoDataService.generateLocalDemoData('infrastructure-changes', 'startup');

        setMetrics(demoMetrics);
        setStats(demoStats);
        setResources(demoResources.resources || []);
        setRecentChanges(demoChanges || []);
      } else {
        // Use real infrastructure service for live data
        const { infrastructureService } = await import('../../services/infrastructureService');
        const [metricsData, statsData, resourcesData, changesData] = await Promise.all([
          dashboardService.getInfrastructureMetrics(),
          infrastructureService.getInfrastructureStats(),
          infrastructureService.listInfrastructure(1, 10),
          infrastructureService.getRecentChanges()
        ]);

        setMetrics(metricsData);
        setStats(statsData);
        setResources(resourcesData.data || []);
        setRecentChanges(changesData || []);
      }

      setLastUpdated(new Date());
    } catch (err: any) {
      console.error('Failed to fetch infrastructure data:', err);
      setError(err.message || 'Failed to load infrastructure data');

      // Fallback to demo data on error
      try {
        const { demoDataService } = await import('../../services/demoDataService');
        const fallbackMetrics = demoDataService.generateLocalDemoData('dashboard-infrastructure', 'startup');
        const fallbackStats = demoDataService.generateLocalDemoData('infrastructure-stats', 'startup');
        const fallbackResources = demoDataService.generateLocalDemoData('infrastructure-resources', 'startup');
        const fallbackChanges = demoDataService.generateLocalDemoData('infrastructure-changes', 'startup');

        setMetrics(fallbackMetrics);
        setStats(fallbackStats);
        setResources(fallbackResources.resources || []);
        setRecentChanges(fallbackChanges || []);
        setError('Using demo data due to connection issues');
      } catch (fallbackErr) {
        console.error('Failed to load fallback data:', fallbackErr);
      }
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchInfrastructureData();
  }, [isDemo, timeRange]);

  const handleRetry = () => {
    fetchInfrastructureData();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'running':
        return '#10B981';
      case 'stopped':
        return '#6B7280';
      case 'pending':
        return '#F59E0B';
      case 'error':
        return '#EF4444';
      case 'terminated':
        return '#DC2626';
      default:
        return '#6B7280';
    }
  };

  const getResourceTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'compute':
        return 'monitor-cpu';
      case 'storage':
        return 'storage-drive';
      case 'database':
        return 'database';
      case 'network':
        return 'monitor-network';
      case 'security':
        return 'security-shield';
      default:
        return 'cloud-server';
    }
  };

  const handleExport = () => {
    if (!metrics || !stats) return;

    const exportData = {
      metrics,
      stats,
      resources,
      recentChanges,
      timeRange,
      isDemo,
      lastUpdated: lastUpdated.toISOString(),
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `infrastructure-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const navigateToInfrastructure = () => {
    window.location.href = '/infrastructure';
  };

  // Generate mock data for demo purposes when needed
  const generateMockResources = () => {
    return [
      {
        id: '1',
        name: 'web-server-prod-1',
        provider: 'aws',
        type: 'compute',
        status: 'running',
        region: 'us-east-1',
        instanceType: 't3.large',
        cost: { daily: 25.50, monthly: 765.00 }
      },
      {
        id: '2',
        name: 'database-primary',
        provider: 'aws',
        type: 'database',
        status: 'running',
        region: 'us-east-1',
        instanceType: 'db.r5.large',
        cost: { daily: 48.20, monthly: 1446.00 }
      },
      {
        id: '3',
        name: 'storage-bucket-assets',
        provider: 'aws',
        type: 'storage',
        status: 'running',
        region: 'us-east-1',
        instanceType: 'S3',
        cost: { daily: 5.30, monthly: 159.00 }
      },
      {
        id: '4',
        name: 'load-balancer-main',
        provider: 'aws',
        type: 'network',
        status: 'running',
        region: 'us-east-1',
        instanceType: 'ALB',
        cost: { daily: 16.20, monthly: 486.00 }
      },
      {
        id: '5',
        name: 'cache-cluster',
        provider: 'azure',
        type: 'database',
        status: 'stopped',
        region: 'eastus',
        instanceType: 'Standard_D2s_v3',
        cost: { daily: 0.00, monthly: 0.00 }
      }
    ];
  };

  const generateMockChanges = () => {
    return [
      {
        id: '1',
        message: 'Created new web server instance',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        type: 'created'
      },
      {
        id: '2',
        message: 'Updated database configuration',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        type: 'updated'
      },
      {
        id: '3',
        message: 'Stopped cache cluster for maintenance',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        type: 'updated'
      },
      {
        id: '4',
        message: 'Deployed new application version',
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        type: 'deployed'
      }
    ];
  };

  // Use mock data if no real data is available
  const displayResources = resources.length > 0 ? resources : generateMockResources();
  const displayChanges = recentChanges.length > 0 ? recentChanges : generateMockChanges();
  const displayStats = stats || {
    totalResources: displayResources.length,
    totalResourcesChange: '+2',
    totalResourcesTrend: 'up',
    activeInstances: displayResources.filter(r => r.status === 'running').length,
    activeInstancesChange: '+1',
    activeInstancesTrend: 'up',
    networks: displayResources.filter(r => r.type === 'network').length,
    networksChange: '0',
    networksTrend: 'stable',
    complianceScore: 94,
    complianceScoreChange: '+2',
    complianceScoreTrend: 'up'
  };

  // Filter resources based on selected filters
  const filteredResources = displayResources.filter(resource => {
    if (selectedProvider !== 'all' && resource.provider !== selectedProvider) return false;
    if (selectedStatus !== 'all' && resource.status !== selectedStatus) return false;
    return true;
  });

  if (loading) {
    return (
      <div style={{ display: 'grid', gap: '24px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '40px',
          color: isDark ? '#ffffff' : '#666666'
        }}>
          Loading infrastructure data{isDemo ? ' (demo mode)' : ''}...
        </div>
      </div>
    );
  }

  if (error && !metrics) {
    return (
      <div style={{ display: 'grid', gap: '24px' }}>
        <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '16px', padding: '40px', textAlign: 'center' }}>
          <div style={{ color: '#EF4444', marginBottom: '16px' }}>
            <Icon name="alert-triangle" size="lg" />
          </div>
          <div style={{ color: '#EF4444', fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
            Failed to load infrastructure data
          </div>
          <div style={{ color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)', fontSize: '14px', marginBottom: '20px' }}>
            {error}
          </div>
          <GlassButton
            variant="primary"
            size="medium"
            isDark={isDark}
            onClick={handleRetry}
            style={{ borderRadius: '8px' }}
          >
            <Icon name="action-refresh" size="sm" />
            Retry
          </GlassButton>
      </GlassCard>
      </div>
    );
  }

  // Prepare chart data
  const resourceStatusData: ChartData = {
    labels: ['Running', 'Stopped', 'Pending', 'Error'],
    datasets: [
      {
        label: 'Resources by Status',
        data: [
          displayResources.filter(r => r.status === 'running').length,
          displayResources.filter(r => r.status === 'stopped').length,
          displayResources.filter(r => r.status === 'pending').length,
          displayResources.filter(r => r.status === 'error').length,
        ],
        backgroundColor: ['#10B981', '#6B7280', '#F59E0B', '#EF4444'],
      },
    ],
  };

  const providerDistributionData: ChartData = {
    labels: ['AWS', 'Azure', 'GCP'],
    datasets: [
      {
        label: 'Resources by Provider',
        data: [
          displayResources.filter(r => r.provider === 'aws').length,
          displayResources.filter(r => r.provider === 'azure').length,
          displayResources.filter(r => r.provider === 'gcp').length,
        ],
        backgroundColor: ['#FF9500', '#0078D4', '#4285F4'],
      },
    ],
  };

  const resourceTypeData: ChartData = {
    labels: ['Compute', 'Storage', 'Database', 'Network', 'Security'],
    datasets: [
      {
        label: 'Resources by Type',
        data: [
          displayResources.filter(r => r.type === 'compute').length,
          displayResources.filter(r => r.type === 'storage').length,
          displayResources.filter(r => r.type === 'database').length,
          displayResources.filter(r => r.type === 'network').length,
          displayResources.filter(r => r.type === 'security').length,
        ],
        backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'],
      },
    ],
  };

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      {/* Header with Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ color: isDark ? '#ffffff' : '#000000', margin: '0 0 8px 0' }}>
            Infrastructure Overview {isDemo && <span style={{ fontSize: '14px', opacity: 0.7 }}>(Demo Mode)</span>}
          </h2>
          <p style={{ color: isDark ? '#ffffff' : '#666666', margin: 0, fontSize: '14px' }}>
            Last updated: {lastUpdated.toLocaleTimeString()}
            {error && <span style={{ color: '#F59E0B', marginLeft: '8px' }}>• {error}</span>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            style={{
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
          <GlassButton
            variant="primary"
            size="small"
            isDark={isDark}
            onClick={navigateToInfrastructure}
            style={{ borderRadius: '8px' }}
          >
            <Icon name="plus" size="sm" />
            Manage
          </GlassButton>
          <GlassButton
            variant="ghost"
            size="small"
            isDark={isDark}
            onClick={handleExport}
            style={{ borderRadius: '8px' }}
          >
            <Icon name="action-download" size="sm" />
            Export
          </GlassButton>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <MetricCard
          title="Total Resources"
          value={displayStats.totalResources?.toString() || displayResources.length.toString()}
          change={{
            value: parseInt(displayStats.totalResourcesChange?.replace('+', '') || '0'),
            isPositive: displayStats.totalResourcesTrend === 'up'
          }}
          icon="cloud-server"
          isDark={isDark}
        />
        <MetricCard
          title="Active Instances"
          value={displayStats.activeInstances?.toString() || displayResources.filter(r => r.status === 'running').length.toString()}
          change={{
            value: parseInt(displayStats.activeInstancesChange?.replace('+', '') || '0'),
            isPositive: displayStats.activeInstancesTrend === 'up'
          }}
          icon="monitor-check"
          isDark={isDark}
        />
        <MetricCard
          title="Networks"
          value={displayStats.networks?.toString() || displayResources.filter(r => r.type === 'network').length.toString()}
          change={{
            value: parseInt(displayStats.networksChange?.replace('+', '') || '0'),
            isPositive: displayStats.networksTrend === 'up'
          }}
          icon="monitor-network"
          isDark={isDark}
        />
        <MetricCard
          title="Compliance Score"
          value={`${displayStats.complianceScore?.toString() || '95'}%`}
          change={{
            value: parseInt(displayStats.complianceScoreChange?.replace('+', '') || '0'),
            isPositive: displayStats.complianceScoreTrend === 'up'
          }}
          icon="security-shield"
          isDark={isDark}
        />
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        <DoughnutChart
          data={resourceStatusData}
          title="Resources by Status"
          height={300}
          isDark={isDark}
        />

        <DoughnutChart
          data={providerDistributionData}
          title="Resources by Provider"
          height={300}
          isDark={isDark}
        />

        <BarChart
          data={resourceTypeData}
          title="Resources by Type"
          height={300}
          isDark={isDark}
        />
      </div>

      {/* Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Infrastructure Resources */}
        <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ color: isDark ? '#ffffff' : '#000000', margin: 0 }}>Infrastructure Resources</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                  background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                  color: isDark ? '#ffffff' : '#000000',
                  fontSize: '12px'
                }}
              >
                <option value="all">All Providers</option>
                <option value="aws">AWS</option>
                <option value="azure">Azure</option>
                <option value="gcp">GCP</option>
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                  background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                  color: isDark ? '#ffffff' : '#000000',
                  fontSize: '12px'
                }}
              >
                <option value="all">All Status</option>
                <option value="running">Running</option>
                <option value="stopped">Stopped</option>
                <option value="pending">Pending</option>
                <option value="error">Error</option>
              </select>
              <GlassButton
                variant="ghost"
                size="small"
                isDark={isDark}
                onClick={navigateToInfrastructure}
                style={{ borderRadius: '6px', fontSize: '12px' }}
              >
                View All
              </GlassButton>
            </div>
          </div>
          <div style={{ display: 'grid', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}>
            {filteredResources.length > 0 ? filteredResources.slice(0, 8).map((resource, index) => (
              <div
                key={resource.id || index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: '8px',
                  background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease'
                }}
                onClick={navigateToInfrastructure}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)';
                }}
              >
                <div style={{
                  padding: '6px',
                  borderRadius: '6px',
                  background: getStatusColor(resource.status || 'stopped'),
                  color: '#ffffff',
                  fontSize: '12px'
                }}>
                  <Icon name={getResourceTypeIcon(resource.type || 'compute')} size="xs" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: isDark ? '#ffffff' : '#000000', fontWeight: 500 }}>
                    {resource.name}
                  </p>
                  <p style={{ margin: 0, fontSize: '12px', color: isDark ? '#ffffff' : '#666666' }}>
                    {resource.provider?.toUpperCase()} • {resource.region} • {resource.instanceType || resource.type}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    background: getStatusColor(resource.status || 'stopped'),
                    color: '#ffffff',
                    fontSize: '10px',
                    textTransform: 'uppercase',
                    fontWeight: 600
                  }}>
                    {resource.status || 'stopped'}
                  </div>
                  {resource.cost && (
                    <div style={{ color: isDark ? '#ffffff' : '#666666', fontSize: '12px', fontWeight: 500 }}>
                      ${resource.cost.daily}/day
                    </div>
                  )}
                </div>
              </div>
            )) : (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                color: isDark ? '#ffffff' : '#666666'
              }}>
                <Icon name="cloud-server" size="lg" style={{ marginBottom: '8px', opacity: 0.5 }} />
                <p style={{ margin: 0, fontSize: '14px' }}>No infrastructure resources found</p>
                <GlassButton
                  variant="primary"
                  size="small"
                  isDark={isDark}
                  onClick={navigateToInfrastructure}
                  style={{ borderRadius: '8px', marginTop: '12px' }}
                >
                  <Icon name="plus" size="sm" />
                  Create Resource
                </GlassButton>
              </div>
            )}
      </div>
    </GlassCard>

        {/* Recent Changes */}
        <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ color: isDark ? '#ffffff' : '#000000', margin: 0 }}>Recent Changes</h3>
          </div>
          <div style={{ display: 'grid', gap: '12px', maxHeight: '400px', overflowY: 'auto' }}>
            {displayChanges.length > 0 ? displayChanges.slice(0, 6).map((change, index) => (
              <div
                key={change.id || index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px',
                  borderRadius: '8px',
                  background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
                }}
              >
                <div style={{
                  padding: '4px',
                  borderRadius: '4px',
                  background: getActivityColor(change.type || 'infrastructure'),
                  color: '#ffffff',
                  fontSize: '10px'
                }}>
                  <Icon name={getActivityIcon(change.type || 'infrastructure')} size="xs" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: '0 0 2px 0', fontSize: '13px', color: isDark ? '#ffffff' : '#000000' }}>
                    {change.message}
                  </p>
                  <p style={{ margin: 0, fontSize: '11px', color: isDark ? '#ffffff' : '#666666' }}>
                    {formatRelativeTime(change.timestamp)}
                  </p>
                </div>
              </div>
            )) : (
              <div style={{
                textAlign: 'center',
                padding: '20px',
                color: isDark ? '#ffffff' : '#666666'
              }}>
                <Icon name="activity" size="lg" style={{ marginBottom: '8px', opacity: 0.5 }} />
                <p style={{ margin: 0, fontSize: '14px' }}>No recent changes</p>
              </div>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Infrastructure Health Status */}
      {metrics && (
        <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '16px' }}>
          <h3 style={{ color: isDark ? '#ffffff' : '#000000', margin: '0 0 16px 0' }}>Infrastructure Health</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
            <div style={{
              padding: '16px',
              borderRadius: '8px',
              background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Icon name="monitor-cpu" size="sm" color="#3B82F6" />
                <span style={{ color: isDark ? '#ffffff' : '#000000', fontSize: '14px', fontWeight: 500 }}>
                  Compute
                </span>
              </div>
              <div style={{ color: isDark ? '#ffffff' : '#666666', fontSize: '12px' }}>
                {metrics?.ec2Instances || 0} instances running
              </div>
            </div>

            <div style={{
              padding: '16px',
              borderRadius: '8px',
              background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Icon name="monitor-network" size="sm" color="#10B981" />
                <span style={{ color: isDark ? '#ffffff' : '#000000', fontSize: '14px', fontWeight: 500 }}>
                  Network
                </span>
              </div>
              <div style={{ color: isDark ? '#ffffff' : '#666666', fontSize: '12px' }}>
                {metrics?.loadBalancers || 0} load balancers active
              </div>
            </div>

            <div style={{
              padding: '16px',
              borderRadius: '8px',
              background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Icon name="database" size="sm" color="#F59E0B" />
                <span style={{ color: isDark ? '#ffffff' : '#000000', fontSize: '14px', fontWeight: 500 }}>
                  Database
                </span>
              </div>
              <div style={{ color: isDark ? '#ffffff' : '#666666', fontSize: '12px' }}>
                {metrics?.databases?.rds || 0} RDS, {metrics?.databases?.dynamodb || 0} DynamoDB
              </div>
            </div>

            <div style={{
              padding: '16px',
              borderRadius: '8px',
              background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Icon name="storage-drive" size="sm" color="#8B5CF6" />
                <span style={{ color: isDark ? '#ffffff' : '#000000', fontSize: '14px', fontWeight: 500 }}>
                  Storage
                </span>
              </div>
              <div style={{ color: isDark ? '#ffffff' : '#666666', fontSize: '12px' }}>
                {metrics?.storageUsed || 0} TB used
              </div>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
};

const ReportsTab: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const [metrics, setMetrics] = useState<ReportsMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('overview');
  const [dateRange, setDateRange] = useState('30d');
  const [reportData, setReportData] = useState<any>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await dashboardService.getReportsMetrics();
        setMetrics(data);

        // Generate sample report data based on selected filters
        const sampleReportData = generateReportData(reportType, dateRange);
        setReportData(sampleReportData);
      } catch (error) {
        console.error('Failed to fetch reports metrics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, [reportType, dateRange]);

  const generateReportData = (type: string, range: string) => {
    const now = new Date();
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;

    // Generate sample data for different report types
    const costTrendData = {
      labels: Array.from({ length: days }, (_, i) => {
        const date = new Date(now);
        date.setDate(date.getDate() - (days - 1 - i));
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }),
      datasets: [{
        label: 'Daily Cost',
        data: Array.from({ length: days }, () => Math.floor(Math.random() * 500) + 200),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      }]
    };

    const performanceData = {
      labels: ['CPU Usage', 'Memory', 'Network', 'Storage', 'Response Time'],
      datasets: [{
        label: 'Current Period',
        data: [75, 68, 82, 45, 88],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)',
        ],
        borderColor: [
          '#3B82F6',
          '#10B981',
          '#F59E0B',
          '#EF4444',
          '#8B5CF6',
        ],
        borderWidth: 2,
      }]
    };

    const resourceDistribution = {
      labels: ['EC2 Instances', 'S3 Storage', 'RDS Databases', 'Lambda Functions', 'Load Balancers'],
      datasets: [{
        data: [35, 25, 20, 15, 5],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)',
        ],
        borderColor: [
          '#3B82F6',
          '#10B981',
          '#F59E0B',
          '#EF4444',
          '#8B5CF6',
        ],
        borderWidth: 2,
      }]
    };

    return {
      costTrend: costTrendData,
      performance: performanceData,
      resourceDistribution: resourceDistribution,
      summary: {
        totalCost: Math.floor(Math.random() * 10000) + 5000,
        totalResources: Math.floor(Math.random() * 100) + 50,
        avgPerformance: Math.floor(Math.random() * 20) + 80,
        securityScore: Math.floor(Math.random() * 10) + 90,
      }
    };
  };

  const handleExportReport = (format: string) => {
    if (!reportData) return;

    const exportData = {
      reportType,
      dateRange,
      generatedAt: new Date().toISOString(),
      metrics,
      data: reportData,
    };

    let blob: Blob;
    let filename: string;

    switch (format) {
      case 'json':
        blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        filename = `report-${reportType}-${dateRange}-${new Date().toISOString().split('T')[0]}.json`;
        break;
      case 'csv':
        const csvData = convertToCSV(exportData);
        blob = new Blob([csvData], { type: 'text/csv' });
        filename = `report-${reportType}-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      default:
        return;
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const convertToCSV = (data: any) => {
    const headers = ['Metric', 'Value', 'Date'];
    const rows = [headers.join(',')];

    // Add summary data
    Object.entries(data.data.summary).forEach(([key, value]) => {
      rows.push(`${key},${value},${data.generatedAt}`);
    });

    return rows.join('\n');
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        color: isDark ? '#ffffff' : '#666666'
      }}>
        Loading reports data...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Report Controls */}
      <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '20px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ color: isDark ? '#ffffff' : '#000000', margin: 0 }}>Reports & Analytics</h2>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <GlassButton
              variant="outline"
              size="small"
              isDark={isDark}
              onClick={() => handleExportReport('json')}
              icon={<Icon name="action-download" size="sm" />}
            >
              Export JSON
            </GlassButton>
            <GlassButton
              variant="outline"
              size="small"
              isDark={isDark}
              onClick={() => handleExportReport('csv')}
              icon={<Icon name="action-download" size="sm" />}
            >
              Export CSV
            </GlassButton>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ color: isDark ? '#ffffff' : '#333333', fontSize: '14px', fontWeight: 500 }}>
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.8)',
                color: isDark ? '#ffffff' : '#333333',
                fontSize: '14px',
                minWidth: '150px',
              }}
            >
              <option value="overview">Overview</option>
              <option value="cost">Cost Analysis</option>
              <option value="performance">Performance</option>
              <option value="security">Security</option>
              <option value="infrastructure">Infrastructure</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ color: isDark ? '#ffffff' : '#333333', fontSize: '14px', fontWeight: 500 }}>
              Date Range
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.8)',
                color: isDark ? '#ffffff' : '#333333',
                fontSize: '14px',
                minWidth: '120px',
              }}
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
        </div>

        {/* Report Summary */}
        {reportData && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div style={{
              background: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
              border: `1px solid ${isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)'}`,
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'center',
            }}>
              <div style={{ color: '#3B82F6', fontSize: '24px', fontWeight: 'bold' }}>
                ${reportData.summary.totalCost.toLocaleString()}
              </div>
              <div style={{ color: isDark ? '#ffffff' : '#666666', fontSize: '14px', marginTop: '4px' }}>
                Total Cost
              </div>
            </div>

            <div style={{
              background: isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)',
              border: `1px solid ${isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)'}`,
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'center',
            }}>
              <div style={{ color: '#10B981', fontSize: '24px', fontWeight: 'bold' }}>
                {reportData.summary.totalResources}
              </div>
              <div style={{ color: isDark ? '#ffffff' : '#666666', fontSize: '14px', marginTop: '4px' }}>
                Total Resources
              </div>
            </div>

            <div style={{
              background: isDark ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.05)',
              border: `1px solid ${isDark ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.1)'}`,
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'center',
            }}>
              <div style={{ color: '#F59E0B', fontSize: '24px', fontWeight: 'bold' }}>
                {reportData.summary.avgPerformance}%
              </div>
              <div style={{ color: isDark ? '#ffffff' : '#666666', fontSize: '14px', marginTop: '4px' }}>
                Avg Performance
              </div>
            </div>

            <div style={{
              background: isDark ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.05)',
              border: `1px solid ${isDark ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)'}`,
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'center',
            }}>
              <div style={{ color: '#8B5CF6', fontSize: '24px', fontWeight: 'bold' }}>
                {reportData.summary.securityScore}%
              </div>
              <div style={{ color: isDark ? '#ffffff' : '#666666', fontSize: '14px', marginTop: '4px' }}>
                Security Score
              </div>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Report Charts */}
      {reportData && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
          <LineChart
            data={reportData.costTrend}
            title="Cost Trend Analysis"
            height={300}
            isDark={isDark}
          />

          <RadarChart
            data={reportData.performance}
            title="Performance Metrics"
            height={300}
            isDark={isDark}
          />

          <DoughnutChart
            data={reportData.resourceDistribution}
            title="Resource Distribution"
            height={300}
            isDark={isDark}
          />
        </div>
      )}

      {/* Report Status and Actions */}
      <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '20px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` }}>
        <h3 style={{ color: isDark ? '#ffffff' : '#000000', marginBottom: '20px' }}>Report Status</h3>

        <div style={{ display: 'grid', gap: '16px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px',
            background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
            borderRadius: '12px',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
          }}>
            <div>
              <div style={{ color: isDark ? '#ffffff' : '#000000', fontWeight: 600, marginBottom: '4px' }}>
                Monthly Report
              </div>
              <div style={{ color: isDark ? '#ffffff' : '#666666', fontSize: '14px' }}>
                Status: {metrics?.monthlyReportAvailable ? 'Available' : 'Not Available'}
              </div>
            </div>
            <div style={{
              padding: '6px 12px',
              borderRadius: '20px',
              background: metrics?.monthlyReportAvailable
                ? (isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)')
                : (isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)'),
              color: metrics?.monthlyReportAvailable ? '#10B981' : '#EF4444',
              fontSize: '12px',
              fontWeight: 600,
            }}>
              {metrics?.monthlyReportAvailable ? 'Ready' : 'Pending'}
            </div>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px',
            background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
            borderRadius: '12px',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
          }}>
            <div>
              <div style={{ color: isDark ? '#ffffff' : '#000000', fontWeight: 600, marginBottom: '4px' }}>
                Cost Optimization Report
              </div>
              <div style={{ color: isDark ? '#ffffff' : '#666666', fontSize: '14px' }}>
                {metrics?.costOptimizationRecommendations || 0} recommendations available
              </div>
            </div>
            <div style={{
              padding: '6px 12px',
              borderRadius: '20px',
              background: isDark ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.1)',
              color: '#F59E0B',
              fontSize: '12px',
              fontWeight: 600,
            }}>
              {metrics?.costOptimizationRecommendations || 0} Items
            </div>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px',
            background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
            borderRadius: '12px',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
          }}>
            <div>
              <div style={{ color: isDark ? '#ffffff' : '#000000', fontWeight: 600, marginBottom: '4px' }}>
                Performance Trend
              </div>
              <div style={{ color: isDark ? '#ffffff' : '#666666', fontSize: '14px' }}>
                Current trend: {metrics?.performanceTrend || 'Unknown'}
              </div>
            </div>
            <div style={{
              padding: '6px 12px',
              borderRadius: '20px',
              background: metrics?.performanceTrend === 'improving'
                ? (isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)')
                : metrics?.performanceTrend === 'degrading'
                ? (isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)')
                : (isDark ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.1)'),
              color: metrics?.performanceTrend === 'improving'
                ? '#10B981'
                : metrics?.performanceTrend === 'degrading'
                ? '#EF4444'
                : '#F59E0B',
              fontSize: '12px',
              fontWeight: 600,
              textTransform: 'capitalize',
            }}>
              {metrics?.performanceTrend || 'Unknown'}
            </div>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px',
            background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
            borderRadius: '12px',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
          }}>
            <div>
              <div style={{ color: isDark ? '#ffffff' : '#000000', fontWeight: 600, marginBottom: '4px' }}>
                Security Audit
              </div>
              <div style={{ color: isDark ? '#ffffff' : '#666666', fontSize: '14px' }}>
                {metrics?.nextSecurityAudit
                  ? `Scheduled for ${new Date(metrics.nextSecurityAudit).toLocaleDateString()}`
                  : 'Not scheduled'
                }
              </div>
            </div>
            <div style={{
              padding: '6px 12px',
              borderRadius: '20px',
              background: isDark ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)',
              color: '#8B5CF6',
              fontSize: '12px',
              fontWeight: 600,
            }}>
              {metrics?.nextSecurityAudit ? 'Scheduled' : 'Pending'}
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default DashboardTabs;