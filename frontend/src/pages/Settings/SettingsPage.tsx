import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import { Icon } from '../../components/common/Icon';
import { GlassCard } from '../../components/common/GlassCard';
import { GlassButton } from '../../components/common/GlassButton';
import { toggleTheme } from '../../store/slices/uiSlice';

interface TabItem {
  id: string;
  label: string;
  icon: React.ReactElement;
  content: React.ReactNode;
}

export const SettingsPage: React.FC = () => {
  const { theme } = useSelector((state: any) => state.ui);
  const { user } = useSelector((state: any) => state.auth);
  const dispatch = useDispatch();
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState('profile');

  const tabs: TabItem[] = [
    {
      id: 'profile',
      label: 'Profile',
      icon: <Icon name="auth-user" size="md" />,
      content: <ProfileTab isDark={isDark} user={user} />,
    },
    {
      id: 'security',
      label: 'Security',
      icon: <Icon name="security-shield" size="md" />,
      content: <SecurityTab isDark={isDark} />,
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: <Icon name="monitor-bell" size="md" />,
      content: <NotificationsTab isDark={isDark} />,
    },
    {
      id: 'appearance',
      label: 'Appearance',
      icon: <Icon name="action-settings" size="md" />,
      content: <AppearanceTab isDark={isDark} onToggleTheme={() => dispatch(toggleTheme())} />,
    },
    {
      id: 'organization',
      label: 'Organization',
      icon: <Icon name="cloud-server" size="md" />,
      content: <OrganizationTab isDark={isDark} />,
    },
    {
      id: 'api',
      label: 'API Keys',
      icon: <Icon name="security-key" size="md" />,
      content: <ApiKeysTab isDark={isDark} />,
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
          background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #A855F7 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          Settings
        </h1>
        <p style={{ 
          fontSize: '16px', 
          opacity: 0.7,
          margin: 0,
          color: isDark ? '#ffffff' : '#666666',
        }}>
          Manage your account, security, and application preferences.
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
                border: activeTab === tab.id ? '1px solid #6366F1' : 'none',
                background: activeTab === tab.id 
                  ? (isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)')
                  : 'rgba(0, 0, 0, 0)',
                color: activeTab === tab.id ? '#6366F1' : (isDark ? '#ffffff' : '#666666'),
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
const ProfileTab: React.FC<{ isDark: boolean; user: any }> = ({ isDark, user }) => (
  <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '20px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` }}>
    <h2 style={{ color: isDark ? '#ffffff' : '#000000', marginBottom: '20px' }}>Profile Information</h2>
    <div style={{ color: isDark ? '#ffffff' : '#666666' }}>
      <p><strong>Name:</strong> {user?.name || 'John Doe'}</p>
      <p><strong>Email:</strong> {user?.email || 'john.doe@example.com'}</p>
      <p><strong>Role:</strong> {user?.role || 'Administrator'}</p>
      <p><strong>Company:</strong> {user?.company || 'Acme Corp'}</p>
      <p><strong>Last Login:</strong> 2 hours ago</p>
    </div>
  </GlassCard>
);

const SecurityTab: React.FC<{ isDark: boolean }> = ({ isDark }) => (
  <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '20px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` }}>
    <h2 style={{ color: isDark ? '#ffffff' : '#000000', marginBottom: '20px' }}>Security Settings</h2>
    <div style={{ color: isDark ? '#ffffff' : '#666666' }}>
      <p>• Two-Factor Authentication: Enabled</p>
      <p>• Password Last Changed: 30 days ago</p>
      <p>• Active Sessions: 2</p>
      <p>• Login Notifications: Enabled</p>
      <p>• API Access: Restricted</p>
    </div>
  </GlassCard>
);

const NotificationsTab: React.FC<{ isDark: boolean }> = ({ isDark }) => (
  <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '20px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` }}>
    <h2 style={{ color: isDark ? '#ffffff' : '#000000', marginBottom: '20px' }}>Notification Preferences</h2>
    <div style={{ color: isDark ? '#ffffff' : '#666666' }}>
      <p>• Email Notifications: Enabled</p>
      <p>• Push Notifications: Enabled</p>
      <p>• Security Alerts: Enabled</p>
      <p>• Cost Alerts: Enabled</p>
      <p>• Deployment Notifications: Enabled</p>
    </div>
  </GlassCard>
);

const AppearanceTab: React.FC<{ isDark: boolean; onToggleTheme: () => void }> = ({ isDark, onToggleTheme }) => (
  <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '20px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` }}>
    <h2 style={{ color: isDark ? '#ffffff' : '#000000', marginBottom: '20px' }}>Appearance Settings</h2>
    <div style={{ color: isDark ? '#ffffff' : '#666666', marginBottom: '20px' }}>
      <p>Current Theme: {isDark ? 'Dark' : 'Light'}</p>
      <p>• Glassmorphism Effects: Enabled</p>
      <p>• Animations: Enabled</p>
      <p>• Reduced Motion: Disabled</p>
    </div>
    <GlassButton
      variant="primary"
      size="small"
      isDark={isDark}
      onClick={onToggleTheme}
      style={{ borderRadius: '12px' }}
    >
      Toggle Theme
    </GlassButton>
  </GlassCard>
);

const OrganizationTab: React.FC<{ isDark: boolean }> = ({ isDark }) => (
  <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '20px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` }}>
    <h2 style={{ color: isDark ? '#ffffff' : '#000000', marginBottom: '20px' }}>Organization Settings</h2>
    <div style={{ color: isDark ? '#ffffff' : '#666666' }}>
      <p><strong>Organization:</strong> Acme Corp</p>
      <p><strong>Plan:</strong> Enterprise</p>
      <p><strong>Users:</strong> 25/100</p>
      <p><strong>Billing:</strong> $299/month</p>
      <p><strong>Next Billing:</strong> March 15, 2024</p>
    </div>
  </GlassCard>
);

const ApiKeysTab: React.FC<{ isDark: boolean }> = ({ isDark }) => (
  <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '20px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` }}>
    <h2 style={{ color: isDark ? '#ffffff' : '#000000', marginBottom: '20px' }}>API Keys</h2>
    <div style={{ color: isDark ? '#ffffff' : '#666666' }}>
      <p>• Production API Key: ak_prod_****1234</p>
      <p>• Development API Key: ak_dev_****5678</p>
      <p>• Last Used: 2 hours ago</p>
      <p>• Rate Limit: 1000 requests/hour</p>
      <p>• Permissions: Read/Write</p>
    </div>
  </GlassCard>
);

export default SettingsPage;