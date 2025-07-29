import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { Icon } from '../../components/common/Icon';
import { GlassCard } from '../../components/common/GlassCard';
import { GlassButton } from '../../components/common/GlassButton';
import { GlassInput } from '../../components/common/GlassInput';
import { metricsService, type DashboardMetrics } from '../../services/metricsService';
import { alertsService, type Alert, type AlertSummary } from '../../services/alertsService';

interface TabItem {
  id: string;
  label: string;
  icon: React.ReactElement;
  content: React.ReactNode;
}

export const MonitoringPage: React.FC = () => {
  const { theme } = useSelector((state: any) => state.ui);
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState('overview');

  const tabs: TabItem[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <Icon name="monitor-chart" size="md" />,
      content: <MonitoringOverview isDark={isDark} />,
    },
    {
      id: 'metrics',
      label: 'Metrics',
      icon: <Icon name="monitor-chart" size="md" />,
      content: <MetricsTab isDark={isDark} />,
    },
    {
      id: 'alerts',
      label: 'Alerts',
      icon: <Icon name="monitor-bell" size="md" />,
      content: <AlertsTab isDark={isDark} />,
    },
    {
      id: 'performance',
      label: 'Performance',
      icon: <Icon name="monitor-pulse" size="md" />,
      content: <PerformanceTab isDark={isDark} />,
    },
    {
      id: 'custom-dashboard',
      label: 'Custom Dashboard',
      icon: <Icon name="monitor-layout" size="md" />,
      content: <CustomDashboardTab isDark={isDark} />,
    },
    {
      id: 'correlation',
      label: 'Correlation',
      icon: <Icon name="monitor-trending" size="md" />,
      content: <CorrelationTab isDark={isDark} />,
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: <Icon name="monitor-settings" size="md" />,
      content: <NotificationsTab isDark={isDark} />,
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
          background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 50%, #B45309 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          Monitoring & Observability
        </h1>
        <p style={{ 
          fontSize: '16px', 
          opacity: 0.7,
          margin: 0,
          color: isDark ? '#ffffff' : '#666666',
        }}>
          Monitor your infrastructure performance, metrics, and alerts.
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
                border: activeTab === tab.id ? '1px solid #F59E0B' : 'none',
                background: activeTab === tab.id 
                  ? (isDark ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.1)')
                  : 'rgba(0, 0, 0, 0)',
                color: activeTab === tab.id ? '#F59E0B' : (isDark ? '#ffffff' : '#666666'),
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
const MonitoringOverview: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics | null>(null);
  const [alertSummary, setAlertSummary] = useState<AlertSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [metricsData, alertsData] = await Promise.all([
          metricsService.getDashboardMetrics(),
          alertsService.getAlertSummary()
        ]);
        setDashboardMetrics(metricsData);
        setAlertSummary(alertsData);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch monitoring data:', err);
        setError('Failed to load monitoring data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: isDark ? '#ffffff' : '#666666' }}>
        <Icon name="spinner" size="lg" />
        <p style={{ marginTop: '16px' }}>Loading monitoring data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#EF4444' }}>
        <Icon name="alert-triangle" size="lg" />
        <p style={{ marginTop: '16px' }}>{error}</p>
      </div>
    );
  }

  const totalResources = dashboardMetrics?.totalResources || 0;
  const runningResources = dashboardMetrics?.runningResources || 0;
  const systemHealth = totalResources > 0 ? Math.round((runningResources / totalResources) * 100) : 0;

  const stats = [
    { 
      title: 'System Health', 
      value: `${systemHealth}%`, 
      change: '+0.2%', 
      trend: 'up' as const, 
      icon: <Icon name="monitor-pulse" size="lg" /> 
    },
    { 
      title: 'Active Alerts', 
      value: String(alertSummary?.activeAlerts || 0), 
      change: '-2', 
      trend: 'down' as const, 
      icon: <Icon name="monitor-bell" size="lg" /> 
    },
    { 
      title: 'CPU Usage', 
      value: `${Math.round(dashboardMetrics?.averageCpuUsage || 0)}%`, 
      change: '-5%', 
      trend: 'up' as const, 
      icon: <Icon name="monitor-clock" size="lg" /> 
    },
    { 
      title: 'Total Resources', 
      value: String(totalResources), 
      change: '+2', 
      trend: 'stable' as const, 
      icon: <Icon name="monitor-line-chart" size="lg" /> 
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
              <div style={{ color: '#F59E0B', marginBottom: '12px', fontSize: '24px' }}>
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
          <h2 style={{ color: isDark ? '#ffffff' : '#000000', marginBottom: '20px' }}>System Performance</h2>
          <div style={{ color: isDark ? '#ffffff' : '#666666' }}>
            <p>CPU Usage: {Math.round(dashboardMetrics?.averageCpuUsage || 0)}% ({dashboardMetrics?.averageCpuUsage && dashboardMetrics.averageCpuUsage > 80 ? 'High' : 'Normal'})</p>
            <p>Memory Usage: {Math.round(dashboardMetrics?.averageMemoryUsage || 0)}% ({dashboardMetrics?.averageMemoryUsage && dashboardMetrics.averageMemoryUsage > 80 ? 'High' : 'Normal'})</p>
            <p>Running Resources: {dashboardMetrics?.runningResources || 0}</p>
            <p>Stopped Resources: {dashboardMetrics?.stoppedResources || 0}</p>
            <p>Error Resources: {dashboardMetrics?.errorResources || 0}</p>
            <p>Total Cost: ${dashboardMetrics?.totalCost?.toFixed(2) || '0.00'}/month</p>
          </div>
        </GlassCard>

        <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '20px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` }}>
          <h2 style={{ color: isDark ? '#ffffff' : '#000000', marginBottom: '20px' }}>Alert Summary</h2>
          <div style={{ color: isDark ? '#ffffff' : '#666666' }}>
            {alertSummary ? (
              <>
                <p>• Critical: {alertSummary.criticalAlerts} alerts</p>
                <p>• Warning: {alertSummary.warningAlerts} alerts</p>
                <p>• Info: {alertSummary.infoAlerts} alerts</p>
                <p>• Active: {alertSummary.activeAlerts} total</p>
                <p>• Acknowledged: {alertSummary.acknowledgedAlerts} alerts</p>
              </>
            ) : (
              <p>No alert data available</p>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

const MetricsTab: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const [aggregatedMetrics, setAggregatedMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDuration, setSelectedDuration] = useState('24h');

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const metricsData = await metricsService.getAggregatedMetrics();
        setAggregatedMetrics(metricsData);
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: isDark ? '#ffffff' : '#666666' }}>
        <Icon name="spinner" size="lg" />
        <p style={{ marginTop: '16px' }}>Loading metrics...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Duration Filter */}
      <GlassCard
        variant="card"
        elevation="low"
        isDark={isDark}
        style={{
          marginBottom: '24px',
          padding: '16px',
          borderRadius: '16px',
          border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
        }}
      >
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ color: isDark ? '#ffffff' : '#666666', marginRight: '8px' }}>Time Range:</span>
          {['1h', '6h', '24h', '7d', '30d'].map(duration => (
            <GlassButton
              key={duration}
              variant={selectedDuration === duration ? 'primary' : 'ghost'}
              size="small"
              isDark={isDark}
              onClick={() => setSelectedDuration(duration)}
              style={{
                borderRadius: '12px',
                border: selectedDuration === duration ? '1px solid #F59E0B' : 'none',
              }}
            >
              {duration}
            </GlassButton>
          ))}
        </div>
      </GlassCard>

      {/* Metrics Overview */}
      <GlassCard
        variant="card"
        elevation="medium"
        isDark={isDark}
        style={{
          borderRadius: '20px',
          border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
          marginBottom: '24px',
        }}
      >
        <h2 style={{ color: isDark ? '#ffffff' : '#000000', marginBottom: '20px' }}>
          System Metrics Overview
        </h2>
        {aggregatedMetrics.length === 0 ? (
          <div style={{ color: isDark ? '#ffffff' : '#666666' }}>
            <p>No metrics data available yet. Metrics will appear as infrastructure resources are monitored.</p>
            <div style={{ marginTop: '16px' }}>
              <p>• CPU and memory utilization</p>
              <p>• Network and disk I/O</p>
              <p>• Application performance metrics</p>
              <p>• Custom business metrics</p>
            </div>
            <GlassButton
              variant="primary"
              size="medium"
              isDark={isDark}
              onClick={() => metricsService.collectMetrics()}
              style={{
                marginTop: '20px',
                borderRadius: '12px',
              }}
            >
              Collect Metrics Now
            </GlassButton>
          </div>
        ) : (
          <div>
            {aggregatedMetrics.map((resource, index) => (
              <motion.div
                key={resource.resourceId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                style={{
                  padding: '16px',
                  marginBottom: '16px',
                  borderRadius: '12px',
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                  background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ color: isDark ? '#ffffff' : '#000000', margin: 0, fontSize: '16px', fontWeight: 600 }}>
                      {resource.resourceName}
                    </h3>
                    <p style={{ color: isDark ? '#ffffff' : '#666666', margin: 0, fontSize: '14px', opacity: 0.7 }}>
                      {resource.resourceType} • {resource.provider}
                    </p>
                  </div>
                  <div style={{
                    fontSize: '12px',
                    padding: '4px 8px',
                    borderRadius: '8px',
                    color: resource.status === 'running' ? '#10B981' : '#EF4444',
                    background: resource.status === 'running' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    border: `1px solid ${resource.status === 'running' ? '#10B981' : '#EF4444'}20`,
                    textTransform: 'capitalize',
                  }}>
                    {resource.status}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                  {Object.entries(resource.metrics || {}).map(([metricName, stats]: [string, any]) => (
                    <div key={metricName} style={{
                      padding: '12px',
                      borderRadius: '8px',
                      background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                    }}>
                      <div style={{ fontSize: '12px', color: isDark ? '#ffffff' : '#666666', opacity: 0.7, marginBottom: '4px' }}>
                        {metricName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: 600, color: isDark ? '#ffffff' : '#000000', marginBottom: '4px' }}>
                        {stats.current?.toFixed(1) || '0'}
                      </div>
                      <div style={{ fontSize: '10px', color: stats.trend === 'up' ? '#10B981' : stats.trend === 'down' ? '#EF4444' : '#6B7280' }}>
                        {stats.trend === 'up' ? '↗ Trending up' : stats.trend === 'down' ? '↘ Trending down' : '→ Stable'}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
};

const AlertsTab: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertSummary, setAlertSummary] = useState<AlertSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'acknowledged'>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        const [alertsData, summaryData] = await Promise.all([
          alertsService.getAlerts({ limit: 50 }),
          alertsService.getAlertSummary()
        ]);
        setAlerts(alertsData);
        setAlertSummary(summaryData);
      } catch (error) {
        console.error('Failed to fetch alerts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, []);

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await alertsService.acknowledgeAlert(alertId);
      setAlerts(alerts.map(alert => 
        alert.id === alertId 
          ? { ...alert, acknowledged: true, acknowledgedAt: new Date().toISOString() }
          : alert
      ));
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'active' && alert.acknowledged) return false;
    if (filter === 'acknowledged' && !alert.acknowledged) return false;
    if (severityFilter !== 'all' && alert.severity !== severityFilter) return false;
    return true;
  });

  const sortedAlerts = alertsService.sortAlerts(filteredAlerts);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: isDark ? '#ffffff' : '#666666' }}>
        <Icon name="spinner" size="lg" />
        <p style={{ marginTop: '16px' }}>Loading alerts...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Alert Summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px',
      }}>
        {alertSummary && [
          { label: 'Total', value: alertSummary.totalAlerts, color: '#6B7280' },
          { label: 'Active', value: alertSummary.activeAlerts, color: '#EF4444' },
          { label: 'Critical', value: alertSummary.criticalAlerts, color: '#DC2626' },
          { label: 'Warning', value: alertSummary.warningAlerts, color: '#F59E0B' },
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
      <GlassCard
        variant="card"
        elevation="low"
        isDark={isDark}
        style={{
          marginBottom: '24px',
          padding: '16px',
          borderRadius: '16px',
          border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
        }}
      >
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['all', 'active', 'acknowledged'].map(filterOption => (
              <GlassButton
                key={filterOption}
                variant={filter === filterOption ? 'primary' : 'ghost'}
                size="small"
                isDark={isDark}
                onClick={() => setFilter(filterOption as any)}
                style={{
                  borderRadius: '12px',
                  textTransform: 'capitalize',
                  border: filter === filterOption ? '1px solid #F59E0B' : 'none',
                }}
              >
                {filterOption}
              </GlassButton>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['all', 'critical', 'high', 'medium', 'low', 'info'].map(severity => (
              <GlassButton
                key={severity}
                variant={severityFilter === severity ? 'primary' : 'ghost'}
                size="small"
                isDark={isDark}
                onClick={() => setSeverityFilter(severity)}
                style={{
                  borderRadius: '12px',
                  textTransform: 'capitalize',
                  border: severityFilter === severity ? '1px solid #F59E0B' : 'none',
                }}
              >
                {severity}
              </GlassButton>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Alerts List */}
      <GlassCard
        variant="card"
        elevation="medium"
        isDark={isDark}
        style={{
          borderRadius: '20px',
          border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
        }}
      >
        <h2 style={{ color: isDark ? '#ffffff' : '#000000', marginBottom: '20px' }}>
          Alerts ({sortedAlerts.length})
        </h2>
        {sortedAlerts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: isDark ? '#ffffff' : '#666666', opacity: 0.7 }}>
            <Icon name="check-circle" size="lg" />
            <p style={{ marginTop: '16px' }}>No alerts found</p>
          </div>
        ) : (
          <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
            {sortedAlerts.map((alert, index) => {
              const formattedAlert = alertsService.formatAlertForDisplay(alert);
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  style={{
                    padding: '16px',
                    marginBottom: '12px',
                    borderRadius: '12px',
                    border: `1px solid ${formattedAlert.severityColor}20`,
                    background: `${formattedAlert.severityColor}05`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <div style={{ color: formattedAlert.severityColor }}>
                        <Icon name={formattedAlert.severityIcon} size="md" />
                      </div>
                      <div>
                        <div style={{ 
                          fontSize: '16px', 
                          fontWeight: 600, 
                          color: isDark ? '#ffffff' : '#000000' 
                        }}>
                          {formattedAlert.typeDisplayName}
                        </div>
                        <div style={{ 
                          fontSize: '12px', 
                          color: formattedAlert.severityColor,
                          textTransform: 'uppercase',
                          fontWeight: 500,
                        }}>
                          {alert.severity}
                        </div>
                      </div>
                    </div>
                    <div style={{ 
                      fontSize: '14px', 
                      color: isDark ? '#ffffff' : '#666666',
                      marginBottom: '8px',
                    }}>
                      {alert.message}
                    </div>
                    <div style={{ 
                      fontSize: '12px', 
                      color: isDark ? '#ffffff' : '#666666',
                      opacity: 0.7,
                    }}>
                      {formattedAlert.timeAgo} • {alert.resourceName || 'Unknown Resource'}
                    </div>
                  </div>
                  {!alert.acknowledged && (
                    <GlassButton
                      variant="ghost"
                      size="small"
                      isDark={isDark}
                      onClick={() => handleAcknowledgeAlert(alert.id)}
                      style={{
                        borderRadius: '8px',
                        color: '#10B981',
                        border: '1px solid #10B981',
                      }}
                    >
                      Acknowledge
                    </GlassButton>
                  )}
                  {alert.acknowledged && (
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#10B981',
                      fontWeight: 500,
                    }}>
                      ✓ Acknowledged
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </GlassCard>
    </div>
  );
};

const PerformanceTab: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const [performanceData, setPerformanceData] = useState([
    { id: '1', service: 'API Gateway', responseTime: 245, throughput: 1250, errorRate: 0.8, status: 'healthy' },
    { id: '2', service: 'Database', responseTime: 89, throughput: 890, errorRate: 0.2, status: 'healthy' },
    { id: '3', service: 'Cache Layer', responseTime: 12, throughput: 3400, errorRate: 0.1, status: 'healthy' },
    { id: '4', service: 'Auth Service', responseTime: 156, throughput: 567, errorRate: 2.1, status: 'warning' },
    { id: '5', service: 'File Storage', responseTime: 423, throughput: 234, errorRate: 5.2, status: 'critical' },
  ]);
  const [timeRange, setTimeRange] = useState('1h');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return '#10B981';
      case 'warning': return '#F59E0B';
      case 'critical': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getPerformanceIcon = (service: string) => {
    switch (service.toLowerCase()) {
      case 'api gateway': return 'cloud-network';
      case 'database': return 'cloud-storage';
      case 'cache layer': return 'monitor-clock';
      case 'auth service': return 'security-shield';
      case 'file storage': return 'cloud-storage';
      default: return 'monitor-pulse';
    }
  };

  const avgResponseTime = Math.round(performanceData.reduce((sum, p) => sum + p.responseTime, 0) / performanceData.length);
  const totalThroughput = performanceData.reduce((sum, p) => sum + p.throughput, 0);
  const avgErrorRate = (performanceData.reduce((sum, p) => sum + p.errorRate, 0) / performanceData.length).toFixed(1);

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      {/* Performance Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {[
          { label: 'Avg Response Time', value: `${avgResponseTime}ms`, color: avgResponseTime < 200 ? '#10B981' : avgResponseTime < 500 ? '#F59E0B' : '#EF4444' },
          { label: 'Total Throughput', value: `${totalThroughput.toLocaleString()}/min`, color: '#3B82F6' },
          { label: 'Avg Error Rate', value: `${avgErrorRate}%`, color: parseFloat(avgErrorRate) < 1 ? '#10B981' : parseFloat(avgErrorRate) < 3 ? '#F59E0B' : '#EF4444' },
          { label: 'Services', value: performanceData.length, color: '#6B7280' },
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

      {/* Time Range Selector */}
      <GlassCard variant="card" elevation="low" isDark={isDark} style={{ borderRadius: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ color: isDark ? '#ffffff' : '#666666', fontSize: '14px' }}>Time Range:</span>
          {['15m', '1h', '6h', '24h', '7d'].map(range => (
            <GlassButton
              key={range}
              variant={timeRange === range ? 'primary' : 'ghost'}
              size="small"
              isDark={isDark}
              onClick={() => setTimeRange(range)}
              style={{
                borderRadius: '12px',
                border: timeRange === range ? '1px solid #F59E0B' : 'none',
              }}
            >
              {range}
            </GlassButton>
          ))}
        </div>
      </GlassCard>

      {/* Performance Metrics */}
      <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '20px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` }}>
        <h3 style={{ color: isDark ? '#ffffff' : '#000000', marginBottom: '20px' }}>Service Performance</h3>
        <div style={{ display: 'grid', gap: '16px' }}>
          {performanceData.map((service) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
                borderRadius: '12px',
                padding: '20px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ color: '#F59E0B', fontSize: '20px' }}>
                    <Icon name={getPerformanceIcon(service.service)} size="md" />
                  </div>
                  <div>
                    <div style={{ 
                      color: isDark ? '#ffffff' : '#000000',
                      fontWeight: 600,
                      fontSize: '16px',
                      marginBottom: '2px'
                    }}>
                      {service.service}
                    </div>
                  </div>
                </div>
                
                <div style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 12px',
                  background: `${getStatusColor(service.status)}20`,
                  borderRadius: '20px',
                  border: `1px solid ${getStatusColor(service.status)}40`
                }}>
                  <div style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: getStatusColor(service.status)
                  }} />
                  <span style={{
                    color: getStatusColor(service.status),
                    fontSize: '12px',
                    fontWeight: 500,
                    textTransform: 'capitalize'
                  }}>
                    {service.status}
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
                <div style={{
                  padding: '12px',
                  borderRadius: '8px',
                  background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                }}>
                  <div style={{ fontSize: '12px', color: isDark ? '#ffffff' : '#666666', opacity: 0.7, marginBottom: '4px' }}>
                    Response Time
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: isDark ? '#ffffff' : '#000000', marginBottom: '4px' }}>
                    {service.responseTime}ms
                  </div>
                  <div style={{ fontSize: '10px', color: service.responseTime < 200 ? '#10B981' : service.responseTime < 500 ? '#F59E0B' : '#EF4444' }}>
                    {service.responseTime < 200 ? '↗ Excellent' : service.responseTime < 500 ? '→ Good' : '↘ Needs attention'}
                  </div>
                </div>

                <div style={{
                  padding: '12px',
                  borderRadius: '8px',
                  background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                }}>
                  <div style={{ fontSize: '12px', color: isDark ? '#ffffff' : '#666666', opacity: 0.7, marginBottom: '4px' }}>
                    Throughput
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: isDark ? '#ffffff' : '#000000', marginBottom: '4px' }}>
                    {service.throughput.toLocaleString()}/min
                  </div>
                  <div style={{ fontSize: '10px', color: '#3B82F6' }}>
                    → Requests per minute
                  </div>
                </div>

                <div style={{
                  padding: '12px',
                  borderRadius: '8px',
                  background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                }}>
                  <div style={{ fontSize: '12px', color: isDark ? '#ffffff' : '#666666', opacity: 0.7, marginBottom: '4px' }}>
                    Error Rate
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: isDark ? '#ffffff' : '#000000', marginBottom: '4px' }}>
                    {service.errorRate}%
                  </div>
                  <div style={{ fontSize: '10px', color: service.errorRate < 1 ? '#10B981' : service.errorRate < 3 ? '#F59E0B' : '#EF4444' }}>
                    {service.errorRate < 1 ? '↗ Low' : service.errorRate < 3 ? '→ Moderate' : '↘ High'}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};

// Custom Dashboard Tab
const CustomDashboardTab: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const [dashboards, setDashboards] = useState<any[]>([]);
  const [selectedDashboard, setSelectedDashboard] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newDashboard, setNewDashboard] = useState({
    name: '',
    description: '',
    layout: 'grid',
    widgets: [] as any[]
  });

  const availableWidgets = [
    { id: 'cpu-usage', name: 'CPU Usage', type: 'chart', icon: 'monitor-clock' },
    { id: 'memory-usage', name: 'Memory Usage', type: 'chart', icon: 'monitor-memory' },
    { id: 'network-traffic', name: 'Network Traffic', type: 'chart', icon: 'monitor-network' },
    { id: 'disk-usage', name: 'Disk Usage', type: 'chart', icon: 'monitor-storage' },
    { id: 'alerts-summary', name: 'Alerts Summary', type: 'summary', icon: 'monitor-bell' },
    { id: 'cost-overview', name: 'Cost Overview', type: 'summary', icon: 'monitor-dollar' },
    { id: 'uptime', name: 'Uptime', type: 'metric', icon: 'monitor-check' },
    { id: 'response-time', name: 'Response Time', type: 'metric', icon: 'monitor-speed' },
  ];

  const handleCreateDashboard = () => {
    if (newDashboard.name.trim()) {
      const dashboard = {
        id: Date.now().toString(),
        ...newDashboard,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setDashboards([...dashboards, dashboard]);
      setNewDashboard({ name: '', description: '', layout: 'grid', widgets: [] });
      setIsCreating(false);
    }
  };

  const addWidgetToDashboard = (dashboardId: string, widgetId: string) => {
    setDashboards(dashboards.map(dashboard => {
      if (dashboard.id === dashboardId) {
        const widget = availableWidgets.find(w => w.id === widgetId);
        if (widget && !dashboard.widgets.find((w: any) => w.id === widgetId)) {
          return {
            ...dashboard,
            widgets: [...dashboard.widgets, { ...widget, config: {} }],
            updatedAt: new Date().toISOString()
          };
        }
      }
      return dashboard;
    }));
  };

  const removeWidgetFromDashboard = (dashboardId: string, widgetId: string) => {
    setDashboards(dashboards.map(dashboard => {
      if (dashboard.id === dashboardId) {
        return {
          ...dashboard,
          widgets: dashboard.widgets.filter((w: any) => w.id !== widgetId),
          updatedAt: new Date().toISOString()
        };
      }
      return dashboard;
    }));
  };

  return (
    <div>
      {/* Dashboard List */}
      <GlassCard
        variant="card"
        elevation="medium"
        isDark={isDark}
        style={{
          marginBottom: '24px',
          borderRadius: '20px',
          border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ color: isDark ? '#ffffff' : '#000000', margin: 0 }}>Custom Dashboards</h2>
          <GlassButton
            variant="primary"
            size="medium"
            isDark={isDark}
            onClick={() => setIsCreating(true)}
            style={{ borderRadius: '12px' }}
          >
            <Icon name="plus" size="sm" />
            Create Dashboard
          </GlassButton>
        </div>

        {isCreating && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              padding: '20px',
              marginBottom: '20px',
              borderRadius: '12px',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
              background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
            }}
          >
            <h3 style={{ color: isDark ? '#ffffff' : '#000000', marginBottom: '16px' }}>Create New Dashboard</h3>
            <div style={{ display: 'grid', gap: '16px', marginBottom: '20px' }}>
              <GlassInput
                label="Dashboard Name"
                value={newDashboard.name}
                onChange={(e) => setNewDashboard({ ...newDashboard, name: e.target.value })}
                placeholder="Enter dashboard name"
                isDark={isDark}
              />
              <GlassInput
                label="Description"
                value={newDashboard.description}
                onChange={(e) => setNewDashboard({ ...newDashboard, description: e.target.value })}
                placeholder="Enter dashboard description"
                isDark={isDark}
              />
              <div>
                <label style={{ color: isDark ? '#ffffff' : '#666666', marginBottom: '8px', display: 'block' }}>
                  Layout
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['grid', 'list', 'compact'].map(layout => (
                    <GlassButton
                      key={layout}
                      variant={newDashboard.layout === layout ? 'primary' : 'ghost'}
                      size="small"
                      isDark={isDark}
                      onClick={() => setNewDashboard({ ...newDashboard, layout })}
                      style={{ borderRadius: '8px', textTransform: 'capitalize' }}
                    >
                      {layout}
                    </GlassButton>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <GlassButton
                variant="primary"
                size="medium"
                isDark={isDark}
                onClick={handleCreateDashboard}
                style={{ borderRadius: '12px' }}
              >
                Create Dashboard
              </GlassButton>
              <GlassButton
                variant="ghost"
                size="medium"
                isDark={isDark}
                onClick={() => setIsCreating(false)}
                style={{ borderRadius: '12px' }}
              >
                Cancel
              </GlassButton>
            </div>
          </motion.div>
        )}

        {dashboards.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: isDark ? '#ffffff' : '#666666', opacity: 0.7 }}>
            <Icon name="monitor-layout" size="lg" />
            <p style={{ marginTop: '16px' }}>No custom dashboards yet</p>
            <p style={{ fontSize: '14px', marginTop: '8px' }}>Create your first dashboard to get started</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {dashboards.map((dashboard, index) => (
              <motion.div
                key={dashboard.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                  background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
                  cursor: 'pointer',
                }}
                onClick={() => setSelectedDashboard(selectedDashboard === dashboard.id ? null : dashboard.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ color: isDark ? '#ffffff' : '#000000', margin: 0, fontSize: '16px', fontWeight: 600 }}>
                      {dashboard.name}
                    </h3>
                    <p style={{ color: isDark ? '#ffffff' : '#666666', margin: '4px 0 0 0', fontSize: '14px', opacity: 0.7 }}>
                      {dashboard.description}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: isDark ? '#ffffff' : '#666666', opacity: 0.7 }}>
                      {dashboard.widgets.length} widgets
                    </span>
                    <Icon name={selectedDashboard === dashboard.id ? 'chevron-up' : 'chevron-down'} size="sm" />
                  </div>
                </div>

                {selectedDashboard === dashboard.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    style={{ marginTop: '16px' }}
                  >
                    <div style={{ marginBottom: '16px' }}>
                      <h4 style={{ color: isDark ? '#ffffff' : '#000000', marginBottom: '12px', fontSize: '14px' }}>
                        Add Widgets
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
                        {availableWidgets.map(widget => (
                          <GlassButton
                            key={widget.id}
                            variant="ghost"
                            size="small"
                            isDark={isDark}
                            onClick={() => addWidgetToDashboard(dashboard.id, widget.id)}
                            disabled={dashboard.widgets.find((w: any) => w.id === widget.id)}
                            style={{
                              borderRadius: '8px',
                              justifyContent: 'flex-start',
                              gap: '8px',
                              opacity: dashboard.widgets.find((w: any) => w.id === widget.id) ? 0.5 : 1,
                            }}
                          >
                            <Icon name={widget.icon} size="sm" />
                            {widget.name}
                          </GlassButton>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 style={{ color: isDark ? '#ffffff' : '#000000', marginBottom: '12px', fontSize: '14px' }}>
                        Current Widgets
                      </h4>
                      {dashboard.widgets.length === 0 ? (
                        <p style={{ color: isDark ? '#ffffff' : '#666666', opacity: 0.7, fontSize: '14px' }}>
                          No widgets added yet. Add widgets from above to customize your dashboard.
                        </p>
                      ) : (
                        <div style={{ display: 'grid', gap: '8px' }}>
                          {dashboard.widgets.map((widget: any) => (
                            <div
                              key={widget.id}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Icon name={widget.icon} size="sm" />
                                <span style={{ color: isDark ? '#ffffff' : '#000000', fontSize: '14px' }}>
                                  {widget.name}
                                </span>
                              </div>
                              <GlassButton
                                variant="ghost"
                                size="small"
                                isDark={isDark}
                                onClick={() => removeWidgetFromDashboard(dashboard.id, widget.id)}
                                style={{ borderRadius: '6px', color: '#EF4444' }}
                              >
                                <Icon name="trash" size="sm" />
                              </GlassButton>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
};

// Correlation Tab
const CorrelationTab: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const [correlations, setCorrelations] = useState<any[]>([]);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [correlationStrength, setCorrelationStrength] = useState<'strong' | 'medium' | 'weak'>('strong');

  const availableMetrics = [
    { id: 'cpu-usage', name: 'CPU Usage', category: 'performance' },
    { id: 'memory-usage', name: 'Memory Usage', category: 'performance' },
    { id: 'network-traffic', name: 'Network Traffic', category: 'network' },
    { id: 'disk-io', name: 'Disk I/O', category: 'storage' },
    { id: 'response-time', name: 'Response Time', category: 'application' },
    { id: 'error-rate', name: 'Error Rate', category: 'application' },
    { id: 'cost', name: 'Cost', category: 'financial' },
    { id: 'user-sessions', name: 'User Sessions', category: 'business' },
  ];

  const mockCorrelations = [
    {
      id: '1',
      metric1: 'cpu-usage',
      metric2: 'response-time',
      strength: 0.85,
      confidence: 0.92,
      trend: 'positive',
      description: 'High CPU usage correlates with increased response times'
    },
    {
      id: '2',
      metric1: 'memory-usage',
      metric2: 'error-rate',
      strength: 0.72,
      confidence: 0.88,
      trend: 'positive',
      description: 'Memory pressure leads to higher error rates'
    },
    {
      id: '3',
      metric1: 'network-traffic',
      metric2: 'cost',
      strength: 0.68,
      confidence: 0.85,
      trend: 'positive',
      description: 'Network usage correlates with cost increases'
    }
  ];

  useEffect(() => {
    setCorrelations(mockCorrelations);
  }, []);

  const getCorrelationColor = (strength: number) => {
    if (strength >= 0.8) return '#EF4444'; // Red for strong
    if (strength >= 0.6) return '#F59E0B'; // Amber for medium
    return '#10B981'; // Green for weak
  };

  const getCorrelationLabel = (strength: number) => {
    if (strength >= 0.8) return 'Strong';
    if (strength >= 0.6) return 'Medium';
    return 'Weak';
  };

  return (
    <div>
      {/* Correlation Analysis */}
      <GlassCard
        variant="card"
        elevation="medium"
        isDark={isDark}
        style={{
          marginBottom: '24px',
          borderRadius: '20px',
          border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
        }}
      >
        <h2 style={{ color: isDark ? '#ffffff' : '#000000', marginBottom: '20px' }}>
          Metric Correlation Analysis
        </h2>
        <p style={{ color: isDark ? '#ffffff' : '#666666', marginBottom: '24px' }}>
          Discover relationships between different metrics to identify patterns and optimize performance.
        </p>

        {/* Metric Selection */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ color: isDark ? '#ffffff' : '#000000', marginBottom: '16px', fontSize: '16px' }}>
            Select Metrics to Analyze
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
            {availableMetrics.map(metric => (
              <GlassButton
                key={metric.id}
                variant={selectedMetrics.includes(metric.id) ? 'primary' : 'ghost'}
                size="small"
                isDark={isDark}
                onClick={() => {
                  if (selectedMetrics.includes(metric.id)) {
                    setSelectedMetrics(selectedMetrics.filter(id => id !== metric.id));
                  } else {
                    setSelectedMetrics([...selectedMetrics, metric.id]);
                  }
                }}
                style={{
                  borderRadius: '12px',
                  justifyContent: 'flex-start',
                  gap: '8px',
                  border: selectedMetrics.includes(metric.id) ? '1px solid #F59E0B' : 'none',
                }}
              >
                <Icon name="monitor-chart" size="sm" />
                {metric.name}
              </GlassButton>
            ))}
          </div>
        </div>

        {/* Correlation Strength Filter */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ color: isDark ? '#ffffff' : '#000000', marginBottom: '16px', fontSize: '16px' }}>
            Correlation Strength
          </h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['strong', 'medium', 'weak'].map(strength => (
              <GlassButton
                key={strength}
                variant={correlationStrength === strength ? 'primary' : 'ghost'}
                size="small"
                isDark={isDark}
                onClick={() => setCorrelationStrength(strength as any)}
                style={{
                  borderRadius: '12px',
                  textTransform: 'capitalize',
                  border: correlationStrength === strength ? '1px solid #F59E0B' : 'none',
                }}
              >
                {strength}
              </GlassButton>
            ))}
          </div>
        </div>

        {/* Correlation Results */}
        <div>
          <h3 style={{ color: isDark ? '#ffffff' : '#000000', marginBottom: '16px', fontSize: '16px' }}>
            Discovered Correlations
          </h3>
          {correlations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: isDark ? '#ffffff' : '#666666', opacity: 0.7 }}>
              <Icon name="monitor-trending" size="lg" />
              <p style={{ marginTop: '16px' }}>No correlations found</p>
              <p style={{ fontSize: '14px', marginTop: '8px' }}>Select metrics and analyze to discover patterns</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {correlations.map((correlation, index) => (
                <motion.div
                  key={correlation.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    border: `1px solid ${getCorrelationColor(correlation.strength)}20`,
                    background: `${getCorrelationColor(correlation.strength)}05`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <h4 style={{ color: isDark ? '#ffffff' : '#000000', margin: '0 0 8px 0', fontSize: '16px', fontWeight: 600 }}>
                        {availableMetrics.find(m => m.id === correlation.metric1)?.name} ↔ {availableMetrics.find(m => m.id === correlation.metric2)?.name}
                      </h4>
                      <p style={{ color: isDark ? '#ffffff' : '#666666', margin: 0, fontSize: '14px' }}>
                        {correlation.description}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        fontSize: '18px',
                        fontWeight: 'bold',
                        color: getCorrelationColor(correlation.strength),
                        marginBottom: '4px',
                      }}>
                        {(correlation.strength * 100).toFixed(0)}%
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: getCorrelationColor(correlation.strength),
                        fontWeight: 500,
                      }}>
                        {getCorrelationLabel(correlation.strength)}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: isDark ? '#ffffff' : '#666666', opacity: 0.7 }}>
                    <span>Confidence: {(correlation.confidence * 100).toFixed(0)}%</span>
                    <span>Trend: {correlation.trend}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
};

// Notifications Tab
const NotificationsTab: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const [notificationSettings, setNotificationSettings] = useState({
    email: {
      enabled: true,
      alerts: true,
      reports: true,
      deployments: true,
      security: true,
      cost: true,
    },
    push: {
      enabled: true,
      alerts: true,
      deployments: true,
      security: true,
    },
    slack: {
      enabled: false,
      webhook: '',
      channel: '#monitoring',
      alerts: true,
      deployments: true,
    },
    preferences: {
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00',
        timezone: 'UTC',
      },
      frequency: 'immediate', // immediate, hourly, daily
      severity: ['critical', 'high'], // critical, high, medium, low, info
    }
  });

  const handleSettingChange = (category: string, setting: string, value: any) => {
    setNotificationSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [setting]: value
      }
    }));
  };

  const handlePreferenceChange = (category: string, setting: string, value: any) => {
    setNotificationSettings(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [category]: {
          ...prev.preferences[category as keyof typeof prev.preferences],
          [setting]: value
        }
      }
    }));
  };

  const handleSeverityChange = (severity: string) => {
    const currentSeverities = notificationSettings.preferences.severity;
    const newSeverities = currentSeverities.includes(severity)
      ? currentSeverities.filter(s => s !== severity)
      : [...currentSeverities, severity];
    
    handlePreferenceChange('severity', 'severity', newSeverities);
  };

  return (
    <div>
      {/* Email Notifications */}
      <GlassCard
        variant="card"
        elevation="medium"
        isDark={isDark}
        style={{
          marginBottom: '24px',
          borderRadius: '20px',
          border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <Icon name="mail" size="lg" style={{ color: '#F59E0B' }} />
          <h2 style={{ color: isDark ? '#ffffff' : '#000000', margin: 0 }}>Email Notifications</h2>
        </div>

        <div style={{ display: 'grid', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ color: isDark ? '#ffffff' : '#000000', margin: '0 0 4px 0', fontSize: '16px' }}>
                Enable Email Notifications
              </h3>
              <p style={{ color: isDark ? '#ffffff' : '#666666', margin: 0, fontSize: '14px' }}>
                Receive notifications via email
              </p>
            </div>
            <GlassButton
              variant={notificationSettings.email.enabled ? 'primary' : 'ghost'}
              size="small"
              isDark={isDark}
              onClick={() => handleSettingChange('email', 'enabled', !notificationSettings.email.enabled)}
              style={{ borderRadius: '12px' }}
            >
              {notificationSettings.email.enabled ? 'Enabled' : 'Disabled'}
            </GlassButton>
          </div>

          {notificationSettings.email.enabled && (
            <div style={{ display: 'grid', gap: '12px', marginTop: '16px' }}>
              {[
                { key: 'alerts', label: 'Alerts', description: 'System and application alerts' },
                { key: 'reports', label: 'Reports', description: 'Daily and weekly reports' },
                { key: 'deployments', label: 'Deployments', description: 'Deployment status updates' },
                { key: 'security', label: 'Security', description: 'Security events and vulnerabilities' },
                { key: 'cost', label: 'Cost', description: 'Cost threshold alerts and reports' },
              ].map(item => (
                <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ color: isDark ? '#ffffff' : '#000000', margin: '0 0 4px 0', fontSize: '14px' }}>
                      {item.label}
                    </h4>
                    <p style={{ color: isDark ? '#ffffff' : '#666666', margin: 0, fontSize: '12px' }}>
                      {item.description}
                    </p>
                  </div>
                  <GlassButton
                    variant={notificationSettings.email[item.key as keyof typeof notificationSettings.email] ? 'primary' : 'ghost'}
                    size="small"
                    isDark={isDark}
                    onClick={() => handleSettingChange('email', item.key, !notificationSettings.email[item.key as keyof typeof notificationSettings.email])}
                    style={{ borderRadius: '8px' }}
                  >
                    {notificationSettings.email[item.key as keyof typeof notificationSettings.email] ? 'On' : 'Off'}
                  </GlassButton>
                </div>
              ))}
            </div>
          )}
        </div>
      </GlassCard>

      {/* Push Notifications */}
      <GlassCard
        variant="card"
        elevation="medium"
        isDark={isDark}
        style={{
          marginBottom: '24px',
          borderRadius: '20px',
          border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <Icon name="bell" size="lg" style={{ color: '#F59E0B' }} />
          <h2 style={{ color: isDark ? '#ffffff' : '#000000', margin: 0 }}>Push Notifications</h2>
        </div>

        <div style={{ display: 'grid', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ color: isDark ? '#ffffff' : '#000000', margin: '0 0 4px 0', fontSize: '16px' }}>
                Enable Push Notifications
              </h3>
              <p style={{ color: isDark ? '#ffffff' : '#666666', margin: 0, fontSize: '14px' }}>
                Receive real-time notifications in your browser
              </p>
            </div>
            <GlassButton
              variant={notificationSettings.push.enabled ? 'primary' : 'ghost'}
              size="small"
              isDark={isDark}
              onClick={() => handleSettingChange('push', 'enabled', !notificationSettings.push.enabled)}
              style={{ borderRadius: '12px' }}
            >
              {notificationSettings.push.enabled ? 'Enabled' : 'Disabled'}
            </GlassButton>
          </div>

          {notificationSettings.push.enabled && (
            <div style={{ display: 'grid', gap: '12px', marginTop: '16px' }}>
              {[
                { key: 'alerts', label: 'Alerts', description: 'Critical system alerts' },
                { key: 'deployments', label: 'Deployments', description: 'Deployment status changes' },
                { key: 'security', label: 'Security', description: 'Security events' },
              ].map(item => (
                <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ color: isDark ? '#ffffff' : '#000000', margin: '0 0 4px 0', fontSize: '14px' }}>
                      {item.label}
                    </h4>
                    <p style={{ color: isDark ? '#ffffff' : '#666666', margin: 0, fontSize: '12px' }}>
                      {item.description}
                    </p>
                  </div>
                  <GlassButton
                    variant={notificationSettings.push[item.key as keyof typeof notificationSettings.push] ? 'primary' : 'ghost'}
                    size="small"
                    isDark={isDark}
                    onClick={() => handleSettingChange('push', item.key, !notificationSettings.push[item.key as keyof typeof notificationSettings.push])}
                    style={{ borderRadius: '8px' }}
                  >
                    {notificationSettings.push[item.key as keyof typeof notificationSettings.push] ? 'On' : 'Off'}
                  </GlassButton>
                </div>
              ))}
            </div>
          )}
        </div>
      </GlassCard>

      {/* Slack Integration */}
      <GlassCard
        variant="card"
        elevation="medium"
        isDark={isDark}
        style={{
          marginBottom: '24px',
          borderRadius: '20px',
          border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <Icon name="slack" size="lg" style={{ color: '#F59E0B' }} />
          <h2 style={{ color: isDark ? '#ffffff' : '#000000', margin: 0 }}>Slack Integration</h2>
        </div>

        <div style={{ display: 'grid', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ color: isDark ? '#ffffff' : '#000000', margin: '0 0 4px 0', fontSize: '16px' }}>
                Enable Slack Notifications
              </h3>
              <p style={{ color: isDark ? '#ffffff' : '#666666', margin: 0, fontSize: '14px' }}>
                Send notifications to Slack channels
              </p>
            </div>
            <GlassButton
              variant={notificationSettings.slack.enabled ? 'primary' : 'ghost'}
              size="small"
              isDark={isDark}
              onClick={() => handleSettingChange('slack', 'enabled', !notificationSettings.slack.enabled)}
              style={{ borderRadius: '12px' }}
            >
              {notificationSettings.slack.enabled ? 'Enabled' : 'Disabled'}
            </GlassButton>
          </div>

          {notificationSettings.slack.enabled && (
            <div style={{ display: 'grid', gap: '16px', marginTop: '16px' }}>
              <GlassInput
                label="Webhook URL"
                value={notificationSettings.slack.webhook}
                onChange={(e) => handleSettingChange('slack', 'webhook', e.target.value)}
                placeholder="https://hooks.slack.com/services/..."
                isDark={isDark}
              />
              <GlassInput
                label="Channel"
                value={notificationSettings.slack.channel}
                onChange={(e) => handleSettingChange('slack', 'channel', e.target.value)}
                placeholder="#monitoring"
                isDark={isDark}
              />
              <div style={{ display: 'grid', gap: '12px' }}>
                {[
                  { key: 'alerts', label: 'Alerts', description: 'System alerts' },
                  { key: 'deployments', label: 'Deployments', description: 'Deployment updates' },
                ].map(item => (
                  <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ color: isDark ? '#ffffff' : '#000000', margin: '0 0 4px 0', fontSize: '14px' }}>
                        {item.label}
                      </h4>
                      <p style={{ color: isDark ? '#ffffff' : '#666666', margin: 0, fontSize: '12px' }}>
                        {item.description}
                      </p>
                    </div>
                    <GlassButton
                      variant={notificationSettings.slack[item.key as keyof typeof notificationSettings.slack] ? 'primary' : 'ghost'}
                      size="small"
                      isDark={isDark}
                      onClick={() => handleSettingChange('slack', item.key, !notificationSettings.slack[item.key as keyof typeof notificationSettings.slack])}
                      style={{ borderRadius: '8px' }}
                    >
                      {notificationSettings.slack[item.key as keyof typeof notificationSettings.slack] ? 'On' : 'Off'}
                    </GlassButton>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Notification Preferences */}
      <GlassCard
        variant="card"
        elevation="medium"
        isDark={isDark}
        style={{
          borderRadius: '20px',
          border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <Icon name="settings" size="lg" style={{ color: '#F59E0B' }} />
          <h2 style={{ color: isDark ? '#ffffff' : '#000000', margin: 0 }}>Notification Preferences</h2>
        </div>

        <div style={{ display: 'grid', gap: '24px' }}>
          {/* Severity Levels */}
          <div>
            <h3 style={{ color: isDark ? '#ffffff' : '#000000', margin: '0 0 16px 0', fontSize: '16px' }}>
              Alert Severity Levels
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px' }}>
              {['critical', 'high', 'medium', 'low', 'info'].map(severity => (
                <GlassButton
                  key={severity}
                  variant={notificationSettings.preferences.severity.includes(severity) ? 'primary' : 'ghost'}
                  size="small"
                  isDark={isDark}
                  onClick={() => handleSeverityChange(severity)}
                  style={{
                    borderRadius: '12px',
                    textTransform: 'capitalize',
                    border: notificationSettings.preferences.severity.includes(severity) ? '1px solid #F59E0B' : 'none',
                  }}
                >
                  {severity}
                </GlassButton>
              ))}
            </div>
          </div>

          {/* Frequency */}
          <div>
            <h3 style={{ color: isDark ? '#ffffff' : '#000000', margin: '0 0 16px 0', fontSize: '16px' }}>
              Notification Frequency
            </h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['immediate', 'hourly', 'daily'].map(frequency => (
                <GlassButton
                  key={frequency}
                  variant={notificationSettings.preferences.frequency === frequency ? 'primary' : 'ghost'}
                  size="small"
                  isDark={isDark}
                  onClick={() => handlePreferenceChange('frequency', 'frequency', frequency)}
                  style={{
                    borderRadius: '12px',
                    textTransform: 'capitalize',
                    border: notificationSettings.preferences.frequency === frequency ? '1px solid #F59E0B' : 'none',
                  }}
                >
                  {frequency}
                </GlassButton>
              ))}
            </div>
          </div>

          {/* Quiet Hours */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ color: isDark ? '#ffffff' : '#000000', margin: 0, fontSize: '16px' }}>
                Quiet Hours
              </h3>
              <GlassButton
                variant={notificationSettings.preferences.quietHours.enabled ? 'primary' : 'ghost'}
                size="small"
                isDark={isDark}
                onClick={() => handlePreferenceChange('quietHours', 'enabled', !notificationSettings.preferences.quietHours.enabled)}
                style={{ borderRadius: '12px' }}
              >
                {notificationSettings.preferences.quietHours.enabled ? 'Enabled' : 'Disabled'}
              </GlassButton>
            </div>
            {notificationSettings.preferences.quietHours.enabled && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <GlassInput
                  label="Start Time"
                  type="time"
                  value={notificationSettings.preferences.quietHours.start}
                  onChange={(e) => handlePreferenceChange('quietHours', 'start', e.target.value)}
                  isDark={isDark}
                />
                <GlassInput
                  label="End Time"
                  type="time"
                  value={notificationSettings.preferences.quietHours.end}
                  onChange={(e) => handlePreferenceChange('quietHours', 'end', e.target.value)}
                  isDark={isDark}
                />
              </div>
            )}
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default MonitoringPage;