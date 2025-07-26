import React from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { DashboardTabs } from './DashboardTabs';

export const Dashboard: React.FC = () => {
  const { theme } = useSelector((state: any) => state.ui);
  const { user } = useSelector((state: any) => state.auth);
  const isDark = theme === 'dark';

  return (
    <div style={{
      background: isDark
        ? 'linear-gradient(135deg, #0F0F23 0%, #1A1B3A 25%, #252659 50%, #2D2F73 75%, #3A3D8F 100%)'
        : 'linear-gradient(135deg, #9eb5e7 0%, #afbfea 8%, #bfc9ec 17%, #cdd3ee 25%, #dbdef1 33%, #dce3f6 42%, #dde8fb 50%, #deedff 58%, #cdefff 67%, #b9f1ff 75%, #a7f4fa 83%, #9df5eb 100%)',
      minHeight: '100vh',
    }}>
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ 
          padding: '24px 24px 0 24px',
          marginBottom: '16px',
        }}
      >
        <h1 style={{ 
          fontSize: '32px', 
          fontWeight: 'bold', 
          margin: '0 0 8px 0',
          color: isDark ? '#ffffff' : '#000000',
          background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 50%, #6D28D9 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          Welcome back, {user?.name || 'User'}!
        </h1>
        <p style={{ 
          fontSize: '16px', 
          opacity: 0.7,
          margin: 0,
          color: isDark ? '#ffffff' : '#666666',
        }}>
          Here's what's happening with your infrastructure today.
        </p>
      </motion.div>

      {/* Dashboard Tabs */}
      <DashboardTabs />
    </div>
  );
};

export default Dashboard;