import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { Icon } from '../../components/common/Icon';
import { GlassCard } from '../../components/common/GlassCard';
import { GlassButton } from '../../components/common/GlassButton';
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

const PerformanceTab: React.FC<{ isDark: boolean }> = ({ isDark }) => (
  <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '20px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` }}>
    <h2 style={{ color: isDark ? '#ffffff' : '#000000', marginBottom: '20px' }}>Performance Analytics</h2>
    <div style={{ color: isDark ? '#ffffff' : '#666666' }}>
      <p>Analyze system and application performance</p>
      <p>• Response time trends</p>
      <p>• Throughput analysis</p>
      <p>• Error rate monitoring</p>
      <p>• Performance bottleneck identification</p>
    </div>
  </GlassCard>
);

export default MonitoringPage;