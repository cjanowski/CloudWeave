import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import {
  AttachMoney as CostIcon,
  TrendingUp as TrendingIcon,
  Assessment as ReportIcon,
  Savings as OptimizationIcon,
  AccountBalance as BudgetIcon,
  Timeline as ForecastIcon,
} from '@mui/icons-material';
import { GlassCard } from '../../components/common/GlassCard';
import { GlassButton } from '../../components/common/GlassButton';

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

  const tabs: TabItem[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <CostIcon />,
      content: <CostOverview isDark={isDark} />,
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: <ReportIcon />,
      content: <ReportsTab isDark={isDark} />,
    },
    {
      id: 'optimization',
      label: 'Optimization',
      icon: <OptimizationIcon />,
      content: <OptimizationTab isDark={isDark} />,
    },
    {
      id: 'budgets',
      label: 'Budgets',
      icon: <BudgetIcon />,
      content: <BudgetsTab isDark={isDark} />,
    },
    {
      id: 'forecasting',
      label: 'Forecasting',
      icon: <ForecastIcon />,
      content: <ForecastingTab isDark={isDark} />,
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
const CostOverview: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const stats = [
    { title: 'Monthly Spend', value: '$12,450', change: '+8.2%', trend: 'up', icon: <CostIcon /> },
    { title: 'Daily Average', value: '$415', change: '-2.1%', trend: 'down', icon: <TrendingIcon /> },
    { title: 'Budget Remaining', value: '$7,550', change: '-$1,200', trend: 'down', icon: <BudgetIcon /> },
    { title: 'Savings This Month', value: '$2,340', change: '+15%', trend: 'up', icon: <OptimizationIcon /> },
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
            <p>Compute (EC2): $4,200 (34%)</p>
            <p>Storage (S3): $2,800 (22%)</p>
            <p>Database (RDS): $2,100 (17%)</p>
            <p>Networking: $1,650 (13%)</p>
            <p>Other Services: $1,700 (14%)</p>
          </div>
        </GlassCard>

        <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '20px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` }}>
          <h2 style={{ color: isDark ? '#ffffff' : '#000000', marginBottom: '20px' }}>Top Cost Drivers</h2>
          <div style={{ color: isDark ? '#ffffff' : '#666666' }}>
            <p>• Production EC2 instances: $2,400</p>
            <p>• Data transfer costs: $1,200</p>
            <p>• RDS Multi-AZ deployment: $900</p>
            <p>• S3 storage and requests: $800</p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

const ReportsTab: React.FC<{ isDark: boolean }> = ({ isDark }) => (
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
);

const OptimizationTab: React.FC<{ isDark: boolean }> = ({ isDark }) => (
  <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '20px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` }}>
    <h2 style={{ color: isDark ? '#ffffff' : '#000000', marginBottom: '20px' }}>Cost Optimization</h2>
    <div style={{ color: isDark ? '#ffffff' : '#666666' }}>
      <p>AI-powered cost optimization recommendations</p>
      <p>• Right-size underutilized instances (Save $1,200/month)</p>
      <p>• Use Reserved Instances for stable workloads (Save $800/month)</p>
      <p>• Optimize S3 storage classes (Save $340/month)</p>
      <p>• Schedule non-production resources (Save $600/month)</p>
    </div>
  </GlassCard>
);

const BudgetsTab: React.FC<{ isDark: boolean }> = ({ isDark }) => (
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
);

const ForecastingTab: React.FC<{ isDark: boolean }> = ({ isDark }) => (
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
);

export default CostManagementPage;