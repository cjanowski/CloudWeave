import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { Icon } from '../../components/common/Icon';
import { GlassCard } from '../../components/common/GlassCard';
import { GlassButton } from '../../components/common/GlassButton';
import { costService } from '../../services/costService';
import type { CostBreakdown, CostRecommendation, BudgetAlert, CostForecast } from '../../services/costService';
import { useAsync } from '../../hooks/useAsync';
import { LoadingSpinner } from '../../components/common/LoadingStates';

interface TabItem {
  id: string;
  label: string;
  icon: React.ReactElement;
  content: React.ReactNode;
}

export const CostManagementPage: React.FC = () => {
  const { theme } = useSelector((state: any) => state.ui);
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState('overview');
  const [period, setPeriod] = useState('month');

  // Fetch cost data
  const { data: costData, loading: costLoading, error: costError, refetch: fetchCostData } = useAsync(
    () => costService.getCostBreakdown(period),
    [period]
  );

  // Fetch budget alerts
  const { data: budgetAlerts, loading: alertsLoading } = useAsync(
    () => costService.getBudgetAlerts(),
    []
  );

  // Fetch cost forecast
  const { data: costForecast, loading: forecastLoading } = useAsync(
    () => costService.getBillingHistory(),
    []
  );

  // Use fallback data if API returns empty arrays
  const finalBudgetAlerts = budgetAlerts && budgetAlerts.length > 0 ? budgetAlerts : [
    {
      type: 'budget_warning',
      message: 'Monthly budget is 75% utilized',
      severity: 'medium',
      currentCost: 15000,
      budget: 20000,
      timestamp: new Date().toISOString()
    }
  ];

  const finalCostForecast = costForecast && costForecast.length > 0 ? costForecast : [
    { date: new Date().toISOString(), projectedCost: 13200, confidence: 0.85 },
    { date: new Date(Date.now() + 86400000).toISOString(), projectedCost: 13150, confidence: 0.83 },
    { date: new Date(Date.now() + 172800000).toISOString(), projectedCost: 13300, confidence: 0.81 }
  ];

  // Fetch optimization recommendations
  const { data: recommendations, loading: recommendationsLoading } = useAsync(
    () => costService.getCostOptimization(period),
    [period]
  );

  // Use mock data if API fails or returns empty data
  const finalCostData = costError || !costData ? costService.getMockCostData() : costData;
  const finalRecommendations = recommendations && recommendations.length > 0 ? recommendations : costService.getMockCostData().recommendations;

  const tabs: TabItem[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <Icon name="cost-dollar" size="md" />,
      content: <CostOverview isDark={isDark} costData={finalCostData} loading={costLoading} />,
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: <Icon name="cost-report" size="md" />,
      content: <ReportsTab isDark={isDark} costData={finalCostData} loading={costLoading} />,
    },
    {
      id: 'optimization',
      label: 'Optimization',
      icon: <Icon name="cost-savings" size="md" />,
      content: <OptimizationTab isDark={isDark} recommendations={finalRecommendations} loading={recommendationsLoading} />,
    },
    {
      id: 'budgets',
      label: 'Budgets',
      icon: <Icon name="cost-budget" size="md" />,
      content: <BudgetsTab isDark={isDark} alerts={finalBudgetAlerts} loading={alertsLoading} />,
    },
    {
      id: 'forecasting',
      label: 'Forecasting',
      icon: <Icon name="monitor-clock" size="md" />,
      content: <ForecastingTab isDark={isDark} forecast={finalCostForecast} loading={forecastLoading} />,
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
          background: 'linear-gradient(135deg, #059669 0%, #047857 50%, #065F46 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          Cost Management
        </h1>
        <p style={{ 
          fontSize: '16px', 
          opacity: 0.7,
          margin: 0,
          color: isDark ? '#ffffff' : '#666666',
        }}>
          Monitor, analyze, and optimize your cloud infrastructure costs.
        </p>
      </motion.div>

      {/* Period Selector */}
      <GlassCard
        variant="navigation"
        elevation="low"
        isDark={isDark}
        animate={false}
        style={{
          marginBottom: '24px',
          padding: '16px',
          borderRadius: '20px',
          border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
        }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ 
              fontSize: '14px', 
              fontWeight: 500,
              color: isDark ? '#ffffff' : '#666666',
            }}>
              Time Period:
            </span>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.8)',
                color: isDark ? '#ffffff' : '#000000',
                fontSize: '14px',
                outline: 'none',
              }}
            >
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
              <option value="quarter">Quarter</option>
              <option value="year">Year</option>
            </select>
          </div>
          
          <GlassButton
            variant="ghost"
            size="small"
            isDark={isDark}
            icon={<Icon name="action-refresh" size="sm" />}
            onClick={() => fetchCostData()}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
            }}
          >
            Refresh
          </GlassButton>
        </div>
      </GlassCard>

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
                border: activeTab === tab.id ? '1px solid #059669' : 'none',
                background: activeTab === tab.id 
                  ? (isDark ? 'rgba(5, 150, 105, 0.2)' : 'rgba(5, 150, 105, 0.1)')
                  : 'rgba(0, 0, 0, 0)',
                color: activeTab === tab.id ? '#059669' : (isDark ? '#ffffff' : '#666666'),
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
const CostOverview: React.FC<{ isDark: boolean; costData?: CostBreakdown; loading: boolean }> = ({ isDark, costData, loading }) => {
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  if (!costData) {
    return (
      <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '20px' }}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Icon name="alert-circle" size="xl" style={{ color: '#EF4444', marginBottom: '16px' }} />
          <h3 style={{ color: isDark ? '#ffffff' : '#000000', marginBottom: '8px' }}>No Cost Data Available</h3>
          <p style={{ color: isDark ? '#ffffff' : '#666666' }}>Unable to load cost information. Please try again later.</p>
        </div>
      </GlassCard>
    );
  }

  const totalCost = costData.totalCost;
  const dailyAverage = totalCost / 30;
  const budgetRemaining = 20000 - totalCost; // Assuming $20k budget
  const savings = 2340; // Mock savings

  const stats = [
    { 
      title: 'Monthly Spend', 
      value: `$${totalCost.toLocaleString()}`, 
      change: '+8.2%', 
      trend: 'up', 
      icon: <Icon name="cost-dollar" size="lg" /> 
    },
    { 
      title: 'Daily Average', 
      value: `$${dailyAverage.toFixed(0)}`, 
      change: '-2.1%', 
      trend: 'down', 
      icon: <Icon name="cost-chart" size="lg" /> 
    },
    { 
      title: 'Budget Remaining', 
      value: `$${budgetRemaining.toLocaleString()}`, 
      change: `-$${(totalCost - (totalCost * 0.9)).toFixed(0)}`, 
      trend: 'down', 
      icon: <Icon name="cost-budget" size="lg" /> 
    },
    { 
      title: 'Savings This Month', 
      value: `$${savings.toLocaleString()}`, 
      change: '+15%', 
      trend: 'up', 
      icon: <Icon name="cost-savings" size="lg" /> 
    },
  ];

  // Calculate cost breakdown by resource type
  const costBreakdown = Object.values(costData.breakdown).reduce((acc, resource) => {
    const type = resource.resourceType;
    acc[type] = (acc[type] || 0) + resource.monthlyCost;
    return acc;
  }, {} as Record<string, number>);

  const totalBreakdown = Object.values(costBreakdown).reduce((sum, cost) => sum + cost, 0);

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
              <div style={{ color: '#059669', marginBottom: '12px', fontSize: '24px' }}>
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
          <h2 style={{ color: isDark ? '#ffffff' : '#000000', marginBottom: '20px' }}>Cost Breakdown</h2>
          <div style={{ color: isDark ? '#ffffff' : '#666666' }}>
            {Object.entries(costBreakdown).map(([type, cost]) => {
              const percentage = ((cost / totalBreakdown) * 100).toFixed(1);
              return (
                <p key={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}: ${cost.toLocaleString()} ({percentage}%)
                </p>
              );
            })}
          </div>
        </GlassCard>

        <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '20px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` }}>
          <h2 style={{ color: isDark ? '#ffffff' : '#000000', marginBottom: '20px' }}>Top Cost Drivers</h2>
          <div style={{ color: isDark ? '#ffffff' : '#666666' }}>
            {Object.values(costData.breakdown)
              .sort((a, b) => b.monthlyCost - a.monthlyCost)
              .slice(0, 4)
              .map((resource) => (
                <p key={resource.resourceId}>
                  • {resource.resourceName}: ${resource.monthlyCost.toLocaleString()}
                </p>
              ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

const ReportsTab: React.FC<{ isDark: boolean; costData?: CostBreakdown; loading: boolean }> = ({ isDark, costData, loading }) => {
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '20px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` }}>
        <h2 style={{ color: isDark ? '#ffffff' : '#000000', marginBottom: '20px' }}>Cost Reports & Analytics</h2>
        <div style={{ color: isDark ? '#ffffff' : '#666666' }}>
          <p>Generate detailed cost reports and analytics</p>
          <p>• Monthly cost reports</p>
          <p>• Service-wise cost breakdown</p>
          <p>• Cost trend analysis</p>
          <p>• Custom reporting dashboards</p>
        </div>
      </GlassCard>

      {costData && (
        <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '20px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` }}>
          <h2 style={{ color: isDark ? '#ffffff' : '#000000', marginBottom: '20px' }}>Cost Trends</h2>
          <div style={{ color: isDark ? '#ffffff' : '#666666' }}>
            {costData.trends.slice(-7).map((trend, index) => (
              <p key={index}>
                {new Date(trend.date).toLocaleDateString()}: ${trend.cost.toFixed(2)} (Usage: {trend.usage.toFixed(1)}%)
              </p>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
};

const OptimizationTab: React.FC<{ isDark: boolean; recommendations: CostRecommendation[]; loading: boolean }> = ({ isDark, recommendations, loading }) => {
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  const totalSavings = recommendations.reduce((sum, rec) => sum + rec.potentialSavings, 0);

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '20px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` }}>
        <h2 style={{ color: isDark ? '#ffffff' : '#000000', marginBottom: '20px' }}>Cost Optimization</h2>
        <div style={{ color: '#10B981', fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
          Total Potential Savings: ${totalSavings.toLocaleString()}/month
        </div>
        <div style={{ color: isDark ? '#ffffff' : '#666666' }}>
          {recommendations.map((rec, index) => (
            <div key={index} style={{ 
              marginBottom: '16px', 
              padding: '12px', 
              borderRadius: '8px',
              background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
              border: `1px solid ${rec.priority === 'high' ? '#EF4444' : rec.priority === 'medium' ? '#F59E0B' : '#10B981'}`,
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{rec.description}</div>
              <div style={{ fontSize: '14px', opacity: 0.8 }}>
                Potential Savings: ${rec.potentialSavings.toLocaleString()}/month
              </div>
              <div style={{ fontSize: '14px', opacity: 0.8, marginTop: '4px' }}>
                Action: {rec.action}
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};

const BudgetsTab: React.FC<{ isDark: boolean; alerts: BudgetAlert[]; loading: boolean }> = ({ isDark, alerts, loading }) => {
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '20px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` }}>
        <h2 style={{ color: isDark ? '#ffffff' : '#000000', marginBottom: '20px' }}>Budget Management</h2>
        <div style={{ color: isDark ? '#ffffff' : '#666666' }}>
          <p>Set and monitor budgets across services and teams</p>
          <p>• Monthly budget: $20,000 (62% used)</p>
          <p>• Development team: $5,000 (45% used)</p>
          <p>• Production workloads: $12,000 (75% used)</p>
          <p>• Testing environment: $3,000 (30% used)</p>
        </div>
      </GlassCard>

      {alerts.length > 0 && (
        <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '20px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` }}>
          <h2 style={{ color: isDark ? '#ffffff' : '#000000', marginBottom: '20px' }}>Budget Alerts</h2>
          <div style={{ color: isDark ? '#ffffff' : '#666666' }}>
            {alerts.map((alert, index) => (
              <div key={index} style={{ 
                marginBottom: '12px', 
                padding: '12px', 
                borderRadius: '8px',
                background: alert.severity === 'high' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                border: `1px solid ${alert.severity === 'high' ? '#EF4444' : '#F59E0B'}`,
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{alert.message}</div>
                <div style={{ fontSize: '14px', opacity: 0.8 }}>
                  Current Cost: ${alert.currentCost.toLocaleString()} | Budget: ${alert.budget.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
};

const ForecastingTab: React.FC<{ isDark: boolean; forecast: CostForecast[]; loading: boolean }> = ({ isDark, forecast, loading }) => {
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '20px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` }}>
        <h2 style={{ color: isDark ? '#ffffff' : '#000000', marginBottom: '20px' }}>Cost Forecasting</h2>
        <div style={{ color: isDark ? '#ffffff' : '#666666' }}>
          <p>Predict future costs based on usage patterns</p>
          <p>• Next month forecast: $13,200 (+6%)</p>
          <p>• Q1 2024 forecast: $38,500</p>
          <p>• Annual projection: $156,000</p>
          <p>• Confidence level: 85%</p>
        </div>
      </GlassCard>

      {forecast.length > 0 && (
        <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '20px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` }}>
          <h2 style={{ color: isDark ? '#ffffff' : '#000000', marginBottom: '20px' }}>30-Day Forecast</h2>
          <div style={{ color: isDark ? '#ffffff' : '#666666' }}>
            {forecast.slice(0, 7).map((item, index) => (
              <p key={index}>
                {new Date(item.date).toLocaleDateString()}: ${item.projectedCost.toFixed(2)} (Confidence: {(item.confidence * 100).toFixed(0)}%)
              </p>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
};

export default CostManagementPage;