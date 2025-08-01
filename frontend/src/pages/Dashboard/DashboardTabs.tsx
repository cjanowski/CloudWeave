import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { Icon } from '../../components/common/Icon';
import { GlassCard } from '../../components/common/GlassCard';
import { GlassButton } from '../../components/common/GlassButton';
import { LineChart, BarChart, DoughnutChart, MetricCard, type ChartData } from '../../components/common/ChartComponents';

import { dashboardService } from '../../services/dashboardService';
import type { DashboardStats, DashboardActivity, PerformanceMetrics, SecurityMetrics, InfrastructureMetrics, ReportsMetrics } from '../../services/dashboardService';

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
            <Icon name="refresh-cw" size="sm" />
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
const getActivityColor = (type: string) => {
  const colors = {
    deployment: '#10B981',
    infrastructure: '#3B82F6',
    security: '#F59E0B',
    cost: '#EF4444',
    alert: '#8B5CF6'
  };
  return colors[type as keyof typeof colors] || '#666666'; // Default color
};

const getActivityIcon = (type: string) => {
  const icons = {
    deployment: 'action-upload',
    infrastructure: 'cloud-server',
    security: 'security-shield',
    cost: 'cost-dollar',
    alert: 'alert-triangle'
  };
  return icons[type as keyof typeof icons] || 'activity'; // Default icon
};

const getStatusColor = (status: string) => {
  const colors = {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6'
  };
  return colors[status as keyof typeof colors] || '#666666'; // Default color
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