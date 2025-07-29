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
      id: 'cloud-accounts',
      label: 'Cloud Accounts',
      icon: <Icon name="cloud-server" size="md" />,
      content: <CloudAccountsTab isDark={isDark} />,
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
    {
      id: 'ai-integrations',
      label: 'AI Integrations',
      icon: <Icon name="ai-robot" size="md" />,
      content: <AiIntegrationsTab isDark={isDark} />,
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
const ProfileTab: React.FC<{ isDark: boolean; user: any }> = ({ isDark, user }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || 'John Doe',
    email: user?.email || 'john.doe@example.com',
    role: user?.role || 'Administrator',
    company: user?.company || 'Acme Corp',
    phone: user?.phone || '+1 (555) 123-4567',
    timezone: user?.timezone || 'UTC-8 (Pacific)',
    bio: user?.bio || 'Cloud infrastructure engineer with 5+ years of experience.',
  });

  const handleSave = () => {
    // Save profile data
    console.log('Saving profile:', profileData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    // Reset to original data
    setProfileData({
      name: user?.name || 'John Doe',
      email: user?.email || 'john.doe@example.com',
      role: user?.role || 'Administrator',
      company: user?.company || 'Acme Corp',
      phone: user?.phone || '+1 (555) 123-4567',
      timezone: user?.timezone || 'UTC-8 (Pacific)',
      bio: user?.bio || 'Cloud infrastructure engineer with 5+ years of experience.',
    });
    setIsEditing(false);
  };

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      {/* Profile Header */}
      <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '20px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ color: isDark ? '#ffffff' : '#000000', margin: 0 }}>Profile Information</h2>
          {!isEditing ? (
            <GlassButton
              variant="primary"
              size="small"
              isDark={isDark}
              onClick={() => setIsEditing(true)}
              style={{ borderRadius: '12px' }}
            >
              <Icon name="action-edit" size="sm" />
              Edit Profile
            </GlassButton>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <GlassButton
                variant="primary"
                size="small"
                isDark={isDark}
                onClick={handleSave}
                style={{ borderRadius: '12px' }}
              >
                Save
              </GlassButton>
              <GlassButton
                variant="ghost"
                size="small"
                isDark={isDark}
                onClick={handleCancel}
                style={{ borderRadius: '12px' }}
              >
                Cancel
              </GlassButton>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #A855F7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#ffffff'
          }}>
            {profileData.name.split(' ').map(n => n[0]).join('').toUpperCase()}
          </div>
          <div>
            <h3 style={{ color: isDark ? '#ffffff' : '#000000', margin: '0 0 4px 0', fontSize: '24px' }}>
              {profileData.name}
            </h3>
            <p style={{ color: isDark ? '#ffffff' : '#666666', margin: '0 0 4px 0', fontSize: '16px' }}>
              {profileData.role} at {profileData.company}
            </p>
            <p style={{ color: isDark ? '#ffffff' : '#666666', margin: 0, fontSize: '14px', opacity: 0.7 }}>
              Last login: 2 hours ago
            </p>
          </div>
        </div>

        {isEditing ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            <div>
              <label style={{ color: isDark ? '#ffffff' : '#666666', marginBottom: '8px', display: 'block', fontSize: '14px' }}>
                Full Name
              </label>
              <input
                type="text"
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
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
                Email Address
              </label>
              <input
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
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
                Phone Number
              </label>
              <input
                type="tel"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
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
                Company
              </label>
              <input
                type="text"
                value={profileData.company}
                onChange={(e) => setProfileData({ ...profileData, company: e.target.value })}
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

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ color: isDark ? '#ffffff' : '#666666', marginBottom: '8px', display: 'block', fontSize: '14px' }}>
                Bio
              </label>
              <textarea
                value={profileData.bio}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                  background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                  color: isDark ? '#ffffff' : '#000000',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            <div>
              <div style={{ color: isDark ? '#ffffff' : '#666666', fontSize: '14px', marginBottom: '4px' }}>Email</div>
              <div style={{ color: isDark ? '#ffffff' : '#000000', fontSize: '16px' }}>{profileData.email}</div>
            </div>
            <div>
              <div style={{ color: isDark ? '#ffffff' : '#666666', fontSize: '14px', marginBottom: '4px' }}>Phone</div>
              <div style={{ color: isDark ? '#ffffff' : '#000000', fontSize: '16px' }}>{profileData.phone}</div>
            </div>
            <div>
              <div style={{ color: isDark ? '#ffffff' : '#666666', fontSize: '14px', marginBottom: '4px' }}>Timezone</div>
              <div style={{ color: isDark ? '#ffffff' : '#000000', fontSize: '16px' }}>{profileData.timezone}</div>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ color: isDark ? '#ffffff' : '#666666', fontSize: '14px', marginBottom: '4px' }}>Bio</div>
              <div style={{ color: isDark ? '#ffffff' : '#000000', fontSize: '16px' }}>{profileData.bio}</div>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Account Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {[
          { label: 'Account Age', value: '2 years', color: '#6366F1' },
          { label: 'Projects', value: '12', color: '#10B981' },
          { label: 'Deployments', value: '156', color: '#F59E0B' },
          { label: 'Team Members', value: '8', color: '#EF4444' },
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
    </div>
  );
};

const SecurityTab: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: true,
    loginNotifications: true,
    sessionTimeout: '24h',
    apiAccess: 'restricted',
  });
  const [activeSessions, setActiveSessions] = useState([
    { id: '1', device: 'MacBook Pro', location: 'San Francisco, CA', lastActive: '2 minutes ago', current: true },
    { id: '2', device: 'iPhone 14', location: 'San Francisco, CA', lastActive: '1 hour ago', current: false },
    { id: '3', device: 'Chrome Browser', location: 'New York, NY', lastActive: '2 days ago', current: false },
  ]);

  const handleToggleSetting = (setting: string) => {
    setSecuritySettings(prev => ({
      ...prev,
      [setting]: !prev[setting as keyof typeof prev]
    }));
  };

  const handleTerminateSession = (sessionId: string) => {
    setActiveSessions(sessions => sessions.filter(s => s.id !== sessionId));
  };

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      {/* Security Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {[
          { label: 'Security Score', value: '95%', color: '#10B981' },
          { label: 'Active Sessions', value: activeSessions.length, color: '#6366F1' },
          { label: 'Last Password Change', value: '30d ago', color: '#F59E0B' },
          { label: '2FA Status', value: securitySettings.twoFactorEnabled ? 'Enabled' : 'Disabled', color: securitySettings.twoFactorEnabled ? '#10B981' : '#EF4444' },
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
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: stat.color, marginBottom: '4px' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '14px', color: isDark ? '#ffffff' : '#666666', opacity: 0.7 }}>
                {stat.label}
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Security Settings */}
      <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '20px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` }}>
        <h3 style={{ color: isDark ? '#ffffff' : '#000000', marginBottom: '20px' }}>Security Settings</h3>
        <div style={{ display: 'grid', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: isDark ? '#ffffff' : '#000000', fontSize: '16px', fontWeight: 500, marginBottom: '4px' }}>
                Two-Factor Authentication
              </div>
              <div style={{ color: isDark ? '#ffffff' : '#666666', fontSize: '14px', opacity: 0.8 }}>
                Add an extra layer of security to your account
              </div>
            </div>
            <GlassButton
              variant={securitySettings.twoFactorEnabled ? 'primary' : 'ghost'}
              size="small"
              isDark={isDark}
              onClick={() => handleToggleSetting('twoFactorEnabled')}
              style={{ borderRadius: '12px' }}
            >
              {securitySettings.twoFactorEnabled ? 'Enabled' : 'Enable'}
            </GlassButton>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: isDark ? '#ffffff' : '#000000', fontSize: '16px', fontWeight: 500, marginBottom: '4px' }}>
                Login Notifications
              </div>
              <div style={{ color: isDark ? '#ffffff' : '#666666', fontSize: '14px', opacity: 0.8 }}>
                Get notified when someone logs into your account
              </div>
            </div>
            <GlassButton
              variant={securitySettings.loginNotifications ? 'primary' : 'ghost'}
              size="small"
              isDark={isDark}
              onClick={() => handleToggleSetting('loginNotifications')}
              style={{ borderRadius: '12px' }}
            >
              {securitySettings.loginNotifications ? 'Enabled' : 'Enable'}
            </GlassButton>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: isDark ? '#ffffff' : '#000000', fontSize: '16px', fontWeight: 500, marginBottom: '4px' }}>
                Change Password
              </div>
              <div style={{ color: isDark ? '#ffffff' : '#666666', fontSize: '14px', opacity: 0.8 }}>
                Last changed 30 days ago
              </div>
            </div>
            <GlassButton
              variant="ghost"
              size="small"
              isDark={isDark}
              style={{ borderRadius: '12px' }}
            >
              Change Password
            </GlassButton>
          </div>
        </div>
      </GlassCard>

      {/* Active Sessions */}
      <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '20px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ color: isDark ? '#ffffff' : '#000000', margin: 0 }}>Active Sessions</h3>
          <GlassButton
            variant="ghost"
            size="small"
            isDark={isDark}
            style={{ borderRadius: '12px' }}
          >
            Terminate All
          </GlassButton>
        </div>
        <div style={{ display: 'grid', gap: '12px' }}>
          {activeSessions.map((session) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ color: '#6366F1', fontSize: '20px' }}>
                  <Icon name={session.device.includes('iPhone') ? 'mobile' : session.device.includes('MacBook') ? 'laptop' : 'monitor'} size="md" />
                </div>
                <div>
                  <div style={{ 
                    color: isDark ? '#ffffff' : '#000000',
                    fontWeight: 500,
                    fontSize: '16px',
                    marginBottom: '4px'
                  }}>
                    {session.device}
                    {session.current && (
                      <span style={{ 
                        color: '#10B981',
                        fontSize: '12px',
                        fontWeight: 500,
                        marginLeft: '8px',
                        padding: '2px 6px',
                        background: 'rgba(16, 185, 129, 0.1)',
                        borderRadius: '4px'
                      }}>
                        Current
                      </span>
                    )}
                  </div>
                  <div style={{ 
                    color: isDark ? '#ffffff' : '#666666',
                    fontSize: '14px',
                    opacity: 0.8
                  }}>
                    {session.location} • {session.lastActive}
                  </div>
                </div>
              </div>

              {!session.current && (
                <GlassButton
                  variant="ghost"
                  size="small"
                  isDark={isDark}
                  onClick={() => handleTerminateSession(session.id)}
                  style={{ borderRadius: '8px', color: '#EF4444' }}
                >
                  Terminate
                </GlassButton>
              )}
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};

const CloudAccountsTab: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const [cloudAccounts, setCloudAccounts] = useState([
    { id: '1', provider: 'aws', name: 'Production AWS', status: 'connected', region: 'us-east-1' },
    { id: '2', provider: 'gcp', name: 'Development GCP', status: 'disconnected', region: 'us-central1' },
  ]);

  const handleConnectAccount = (provider: string) => {
    console.log(`Connecting to ${provider}...`);
    // This would typically open OAuth flow or configuration modal
  };

  const handleDisconnectAccount = (accountId: string) => {
    setCloudAccounts(accounts => 
      accounts.map(account => 
        account.id === accountId 
          ? { ...account, status: 'disconnected' }
          : account
      )
    );
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'aws': return 'aws';
      case 'gcp': return 'gcp';
      case 'azure': return 'azure';
      default: return 'cloud';
    }
  };

  const getProviderName = (provider: string) => {
    switch (provider) {
      case 'aws': return 'Amazon Web Services';
      case 'gcp': return 'Google Cloud Platform';
      case 'azure': return 'Microsoft Azure';
      default: return provider.toUpperCase();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Cloud Provider Accounts
        </h3>
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Connect your cloud provider accounts to manage infrastructure and monitor costs.
        </p>
      </div>

      {/* Connected Accounts */}
      <div className="space-y-4">
        <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Connected Accounts
        </h4>
        {cloudAccounts.filter(account => account.status === 'connected').map((account) => (
          <GlassCard key={account.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Icon name={getProviderIcon(account.provider)} size="md" />
                <div>
                  <h5 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {account.name}
                  </h5>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {getProviderName(account.provider)} • {account.region}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Connected
                </span>
                <GlassButton
                  variant="secondary"
                  size="small"
                  onClick={() => handleDisconnectAccount(account.id)}
                >
                  Disconnect
                </GlassButton>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Available Providers */}
      <div className="space-y-4">
        <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Add Cloud Account
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { provider: 'aws', name: 'Amazon Web Services', description: 'Connect your AWS account' },
            { provider: 'gcp', name: 'Google Cloud', description: 'Connect your GCP project' },
            { provider: 'azure', name: 'Microsoft Azure', description: 'Connect your Azure subscription' },
          ].map((provider) => (
            <GlassCard key={provider.provider} className="p-4 text-center">
              <Icon name={getProviderIcon(provider.provider)} size="lg" className="mx-auto mb-3" />
              <h5 className={`font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {provider.name}
              </h5>
              <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {provider.description}
              </p>
              <GlassButton
                variant="primary"
                size="small"
                onClick={() => handleConnectAccount(provider.provider)}
                className="w-full"
              >
                Connect
              </GlassButton>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* Disconnected Accounts */}
      {cloudAccounts.filter(account => account.status === 'disconnected').length > 0 && (
        <div className="space-y-4">
          <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Disconnected Accounts
          </h4>
          {cloudAccounts.filter(account => account.status === 'disconnected').map((account) => (
            <GlassCard key={account.id} className="p-4 opacity-60">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Icon name={getProviderIcon(account.provider)} size="md" />
                  <div>
                    <h5 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {account.name}
                    </h5>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {getProviderName(account.provider)} • {account.region}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Disconnected
                  </span>
                  <GlassButton
                    variant="primary"
                    size="small"
                    onClick={() => handleConnectAccount(account.provider)}
                  >
                    Reconnect
                  </GlassButton>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
};

const NotificationsTab: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const [notifications, setNotifications] = useState({
    email: {
      security: true,
      deployments: true,
      costs: true,
      system: false,
      marketing: false,
    },
    push: {
      security: true,
      deployments: false,
      costs: true,
      system: true,
    },
    slack: {
      enabled: false,
      webhook: '',
      channel: '#alerts',
    },
  });

  const handleToggleNotification = (category: string, type: string) => {
    setNotifications(prev => {
      const categorySettings = prev[category as keyof typeof prev] as any;
      return {
        ...prev,
        [category]: {
          ...categorySettings,
          [type]: !categorySettings[type]
        }
      };
    });
  };

  const notificationCategories = [
    {
      title: 'Email Notifications',
      description: 'Receive notifications via email',
      icon: 'mail',
      settings: [
        { key: 'security', label: 'Security Alerts', description: 'Login attempts, password changes, etc.' },
        { key: 'deployments', label: 'Deployment Updates', description: 'Deployment status and completion notifications' },
        { key: 'costs', label: 'Cost Alerts', description: 'Budget thresholds and cost anomalies' },
        { key: 'system', label: 'System Updates', description: 'Maintenance and system announcements' },
        { key: 'marketing', label: 'Marketing', description: 'Product updates and newsletters' },
      ]
    },
    {
      title: 'Push Notifications',
      description: 'Receive browser push notifications',
      icon: 'monitor-bell',
      settings: [
        { key: 'security', label: 'Security Alerts', description: 'Critical security events' },
        { key: 'deployments', label: 'Deployment Updates', description: 'Real-time deployment status' },
        { key: 'costs', label: 'Cost Alerts', description: 'Budget and spending alerts' },
        { key: 'system', label: 'System Alerts', description: 'Infrastructure issues and outages' },
      ]
    }
  ];

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      {/* Notification Categories */}
      {notificationCategories.map((category) => (
        <GlassCard key={category.title} variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '20px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ color: '#6366F1', fontSize: '24px' }}>
              <Icon name={category.icon} size="lg" />
            </div>
            <div>
              <h3 style={{ color: isDark ? '#ffffff' : '#000000', margin: '0 0 4px 0', fontSize: '18px' }}>
                {category.title}
              </h3>
              <p style={{ color: isDark ? '#ffffff' : '#666666', margin: 0, fontSize: '14px', opacity: 0.8 }}>
                {category.description}
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '16px' }}>
            {category.settings.map((setting) => (
              <div key={setting.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: isDark ? '#ffffff' : '#000000', fontSize: '16px', fontWeight: 500, marginBottom: '4px' }}>
                    {setting.label}
                  </div>
                  <div style={{ color: isDark ? '#ffffff' : '#666666', fontSize: '14px', opacity: 0.8 }}>
                    {setting.description}
                  </div>
                </div>
                <div style={{ marginLeft: '16px' }}>
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    cursor: 'pointer',
                    position: 'relative'
                  }}>
                    <input
                      type="checkbox"
                      checked={(() => {
                        const categoryKey = category.title.toLowerCase().split(' ')[0] as keyof typeof notifications;
                        const categorySettings = notifications[categoryKey] as any;
                        return categorySettings[setting.key] || false;
                      })()}
                      onChange={() => handleToggleNotification(category.title.toLowerCase().split(' ')[0], setting.key)}
                      style={{ display: 'none' }}
                    />
                    <div style={{
                      width: '44px',
                      height: '24px',
                      borderRadius: '12px',
                      background: (() => {
                        const categoryKey = category.title.toLowerCase().split(' ')[0] as keyof typeof notifications;
                        const categorySettings = notifications[categoryKey] as any;
                        return categorySettings[setting.key] 
                          ? '#6366F1' 
                          : isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
                      })(),
                      position: 'relative',
                      transition: 'all 0.2s ease',
                    }}>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: '#ffffff',
                        position: 'absolute',
                        top: '2px',
                        left: (() => {
                          const categoryKey = category.title.toLowerCase().split(' ')[0] as keyof typeof notifications;
                          const categorySettings = notifications[categoryKey] as any;
                          return categorySettings[setting.key] ? '22px' : '2px';
                        })(),
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                      }} />
                    </div>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      ))}

      {/* Slack Integration */}
      <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '20px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{ color: '#6366F1', fontSize: '24px' }}>
            <Icon name="chat" size="lg" />
          </div>
          <div>
            <h3 style={{ color: isDark ? '#ffffff' : '#000000', margin: '0 0 4px 0', fontSize: '18px' }}>
              Slack Integration
            </h3>
            <p style={{ color: isDark ? '#ffffff' : '#666666', margin: 0, fontSize: '14px', opacity: 0.8 }}>
              Send notifications to your Slack workspace
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: isDark ? '#ffffff' : '#000000', fontSize: '16px', fontWeight: 500, marginBottom: '4px' }}>
                Enable Slack Notifications
              </div>
              <div style={{ color: isDark ? '#ffffff' : '#666666', fontSize: '14px', opacity: 0.8 }}>
                Connect your Slack workspace to receive alerts
              </div>
            </div>
            <GlassButton
              variant={notifications.slack.enabled ? 'primary' : 'ghost'}
              size="small"
              isDark={isDark}
              onClick={() => setNotifications(prev => ({ ...prev, slack: { ...prev.slack, enabled: !prev.slack.enabled } }))}
              style={{ borderRadius: '12px' }}
            >
              {notifications.slack.enabled ? 'Connected' : 'Connect'}
            </GlassButton>
          </div>

          {notifications.slack.enabled && (
            <>
              <div>
                <label style={{ color: isDark ? '#ffffff' : '#666666', marginBottom: '8px', display: 'block', fontSize: '14px' }}>
                  Webhook URL
                </label>
                <input
                  type="url"
                  value={notifications.slack.webhook}
                  onChange={(e) => setNotifications(prev => ({ ...prev, slack: { ...prev.slack, webhook: e.target.value } }))}
                  placeholder="https://hooks.slack.com/services/..."
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
                  Channel
                </label>
                <input
                  type="text"
                  value={notifications.slack.channel}
                  onChange={(e) => setNotifications(prev => ({ ...prev, slack: { ...prev.slack, channel: e.target.value } }))}
                  placeholder="#alerts"
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
            </>
          )}
        </div>
      </GlassCard>
    </div>
  );
};

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

const OrganizationTab: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const [orgData, setOrgData] = useState({
    name: 'Acme Corp',
    plan: 'Enterprise',
    users: 25,
    maxUsers: 100,
    billing: 299,
    nextBilling: '2024-03-15',
    domain: 'acme.com',
    industry: 'Technology',
    size: '50-100 employees'
  });
  const [teamMembers, setTeamMembers] = useState([
    { id: '1', name: 'John Doe', email: 'john.doe@acme.com', role: 'Admin', status: 'active', lastActive: '2 hours ago' },
    { id: '2', name: 'Jane Smith', email: 'jane.smith@acme.com', role: 'Developer', status: 'active', lastActive: '1 day ago' },
    { id: '3', name: 'Mike Johnson', email: 'mike.johnson@acme.com', role: 'DevOps', status: 'active', lastActive: '3 hours ago' },
    { id: '4', name: 'Sarah Wilson', email: 'sarah.wilson@acme.com', role: 'Developer', status: 'inactive', lastActive: '1 week ago' },
  ]);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Developer');

  const handleInviteUser = () => {
    if (inviteEmail) {
      const newMember = {
        id: Date.now().toString(),
        name: inviteEmail.split('@')[0],
        email: inviteEmail,
        role: inviteRole,
        status: 'pending' as const,
        lastActive: 'Pending invitation'
      };
      setTeamMembers([...teamMembers, newMember]);
      setInviteEmail('');
      setShowInviteForm(false);
    }
  };

  const handleRemoveUser = (userId: string) => {
    setTeamMembers(teamMembers.filter(member => member.id !== userId));
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin': return '#EF4444';
      case 'DevOps': return '#F59E0B';
      case 'Developer': return '#10B981';
      default: return '#6366F1';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'inactive': return '#6B7280';
      case 'pending': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      {/* Organization Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {[
          { label: 'Plan', value: orgData.plan, color: '#6366F1' },
          { label: 'Users', value: `${orgData.users}/${orgData.maxUsers}`, color: '#10B981' },
          { label: 'Monthly Cost', value: `$${orgData.billing}`, color: '#F59E0B' },
          { label: 'Active Members', value: teamMembers.filter(m => m.status === 'active').length, color: '#EF4444' },
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

      {/* Organization Details */}
      <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '20px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ color: isDark ? '#ffffff' : '#000000', margin: 0 }}>Organization Details</h3>
          <GlassButton
            variant="ghost"
            size="small"
            isDark={isDark}
            style={{ borderRadius: '12px' }}
          >
            <Icon name="action-edit" size="sm" />
            Edit
          </GlassButton>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          <div>
            <div style={{ color: isDark ? '#ffffff' : '#666666', fontSize: '14px', marginBottom: '4px' }}>Organization Name</div>
            <div style={{ color: isDark ? '#ffffff' : '#000000', fontSize: '16px' }}>{orgData.name}</div>
          </div>
          <div>
            <div style={{ color: isDark ? '#ffffff' : '#666666', fontSize: '14px', marginBottom: '4px' }}>Domain</div>
            <div style={{ color: isDark ? '#ffffff' : '#000000', fontSize: '16px' }}>{orgData.domain}</div>
          </div>
          <div>
            <div style={{ color: isDark ? '#ffffff' : '#666666', fontSize: '14px', marginBottom: '4px' }}>Industry</div>
            <div style={{ color: isDark ? '#ffffff' : '#000000', fontSize: '16px' }}>{orgData.industry}</div>
          </div>
          <div>
            <div style={{ color: isDark ? '#ffffff' : '#666666', fontSize: '14px', marginBottom: '4px' }}>Company Size</div>
            <div style={{ color: isDark ? '#ffffff' : '#000000', fontSize: '16px' }}>{orgData.size}</div>
          </div>
          <div>
            <div style={{ color: isDark ? '#ffffff' : '#666666', fontSize: '14px', marginBottom: '4px' }}>Next Billing</div>
            <div style={{ color: isDark ? '#ffffff' : '#000000', fontSize: '16px' }}>{orgData.nextBilling}</div>
          </div>
        </div>
      </GlassCard>

      {/* Team Members */}
      <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '20px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ color: isDark ? '#ffffff' : '#000000', margin: 0 }}>Team Members ({teamMembers.length})</h3>
          <GlassButton
            variant="primary"
            size="small"
            isDark={isDark}
            onClick={() => setShowInviteForm(true)}
            style={{ borderRadius: '12px' }}
          >
            <Icon name="action-plus" size="sm" />
            Invite Member
          </GlassButton>
        </div>

        {showInviteForm && (
          <div style={{ 
            marginBottom: '20px', 
            padding: '16px', 
            background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
            borderRadius: '12px',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 150px auto', gap: '12px', alignItems: 'end' }}>
              <div>
                <label style={{ color: isDark ? '#ffffff' : '#666666', marginBottom: '8px', display: 'block', fontSize: '14px' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="user@company.com"
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
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
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
                  <option value="Developer">Developer</option>
                  <option value="DevOps">DevOps</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <GlassButton
                  variant="primary"
                  size="small"
                  isDark={isDark}
                  onClick={handleInviteUser}
                  style={{ borderRadius: '8px' }}
                >
                  Send
                </GlassButton>
                <GlassButton
                  variant="ghost"
                  size="small"
                  isDark={isDark}
                  onClick={() => setShowInviteForm(false)}
                  style={{ borderRadius: '8px' }}
                >
                  Cancel
                </GlassButton>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gap: '8px' }}>
          {teamMembers.map((member) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
                borderRadius: '8px',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: '#ffffff'
                }}>
                  {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </div>
                <div>
                  <div style={{ 
                    color: isDark ? '#ffffff' : '#000000',
                    fontWeight: 500,
                    fontSize: '14px',
                    marginBottom: '2px'
                  }}>
                    {member.name}
                  </div>
                  <div style={{ 
                    color: isDark ? '#ffffff' : '#666666',
                    fontSize: '12px',
                    opacity: 0.8
                  }}>
                    {member.email} • {member.lastActive}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ 
                  padding: '4px 8px',
                  borderRadius: '12px',
                  background: `${getRoleColor(member.role)}20`,
                  border: `1px solid ${getRoleColor(member.role)}40`,
                  fontSize: '12px',
                  fontWeight: 500,
                  color: getRoleColor(member.role)
                }}>
                  {member.role}
                </div>

                <div style={{ 
                  padding: '4px 8px',
                  borderRadius: '12px',
                  background: `${getStatusColor(member.status)}20`,
                  border: `1px solid ${getStatusColor(member.status)}40`,
                  fontSize: '12px',
                  fontWeight: 500,
                  color: getStatusColor(member.status),
                  textTransform: 'capitalize'
                }}>
                  {member.status}
                </div>

                <GlassButton
                  variant="ghost"
                  size="small"
                  isDark={isDark}
                  onClick={() => handleRemoveUser(member.id)}
                  style={{ borderRadius: '8px', color: '#EF4444' }}
                >
                  <Icon name="action-delete" size="sm" />
                </GlassButton>
              </div>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};

const ApiKeysTab: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const [apiKeys, setApiKeys] = useState([
    { 
      id: '1', 
      name: 'Production API Key', 
      key: 'ak_prod_1234567890abcdef', 
      environment: 'production', 
      permissions: ['read', 'write'], 
      lastUsed: '2 hours ago',
      created: '2024-01-10',
      rateLimit: 1000,
      status: 'active'
    },
    { 
      id: '2', 
      name: 'Development API Key', 
      key: 'ak_dev_abcdef1234567890', 
      environment: 'development', 
      permissions: ['read', 'write', 'delete'], 
      lastUsed: '1 day ago',
      created: '2024-01-08',
      rateLimit: 500,
      status: 'active'
    },
    { 
      id: '3', 
      name: 'Testing API Key', 
      key: 'ak_test_567890abcdef1234', 
      environment: 'testing', 
      permissions: ['read'], 
      lastUsed: '1 week ago',
      created: '2024-01-05',
      rateLimit: 100,
      status: 'inactive'
    },
  ]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newKeyData, setNewKeyData] = useState({
    name: '',
    environment: 'development',
    permissions: ['read'],
    rateLimit: 500
  });
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());

  const handleCreateKey = () => {
    if (newKeyData.name) {
      const newKey = {
        id: Date.now().toString(),
        ...newKeyData,
        key: `ak_${newKeyData.environment}_${Math.random().toString(36).substring(2, 18)}`,
        lastUsed: 'Never',
        created: new Date().toISOString().split('T')[0],
        status: 'active' as const
      };
      setApiKeys([...apiKeys, newKey]);
      setNewKeyData({
        name: '',
        environment: 'development',
        permissions: ['read'],
        rateLimit: 500
      });
      setShowCreateForm(false);
    }
  };

  const handleDeleteKey = (keyId: string) => {
    setApiKeys(apiKeys.filter(key => key.id !== keyId));
  };

  const handleToggleReveal = (keyId: string) => {
    const newRevealed = new Set(revealedKeys);
    if (newRevealed.has(keyId)) {
      newRevealed.delete(keyId);
    } else {
      newRevealed.add(keyId);
    }
    setRevealedKeys(newRevealed);
  };

  const handleTogglePermission = (permission: string) => {
    const newPermissions = newKeyData.permissions.includes(permission)
      ? newKeyData.permissions.filter(p => p !== permission)
      : [...newKeyData.permissions, permission];
    setNewKeyData({ ...newKeyData, permissions: newPermissions });
  };

  const maskKey = (key: string) => {
    return key.substring(0, 8) + '****' + key.substring(key.length - 4);
  };

  const getEnvironmentColor = (env: string) => {
    switch (env) {
      case 'production': return '#EF4444';
      case 'development': return '#10B981';
      case 'testing': return '#F59E0B';
      default: return '#6366F1';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'inactive': return '#6B7280';
      case 'revoked': return '#EF4444';
      default: return '#6B7280';
    }
  };

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      {/* API Keys Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {[
          { label: 'Total Keys', value: apiKeys.length, color: '#6366F1' },
          { label: 'Active Keys', value: apiKeys.filter(k => k.status === 'active').length, color: '#10B981' },
          { label: 'Total Requests', value: '12.5K', color: '#F59E0B' },
          { label: 'Rate Limit', value: `${apiKeys.reduce((sum, k) => sum + k.rateLimit, 0)}/hr`, color: '#EF4444' },
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

      {/* API Keys Management */}
      <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '20px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ color: isDark ? '#ffffff' : '#000000', margin: 0 }}>API Keys</h3>
          <GlassButton
            variant="primary"
            size="small"
            isDark={isDark}
            onClick={() => setShowCreateForm(true)}
            style={{ borderRadius: '12px' }}
          >
            <Icon name="action-plus" size="sm" />
            Create API Key
          </GlassButton>
        </div>

        {showCreateForm && (
          <div style={{ 
            marginBottom: '20px', 
            padding: '20px', 
            background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
            borderRadius: '12px',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`
          }}>
            <h4 style={{ color: isDark ? '#ffffff' : '#000000', marginBottom: '16px' }}>Create New API Key</h4>
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ color: isDark ? '#ffffff' : '#666666', marginBottom: '8px', display: 'block', fontSize: '14px' }}>
                  Key Name
                </label>
                <input
                  type="text"
                  value={newKeyData.name}
                  onChange={(e) => setNewKeyData({ ...newKeyData, name: e.target.value })}
                  placeholder="My API Key"
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ color: isDark ? '#ffffff' : '#666666', marginBottom: '8px', display: 'block', fontSize: '14px' }}>
                    Environment
                  </label>
                  <select
                    value={newKeyData.environment}
                    onChange={(e) => setNewKeyData({ ...newKeyData, environment: e.target.value })}
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
                    <option value="development">Development</option>
                    <option value="testing">Testing</option>
                    <option value="production">Production</option>
                  </select>
                </div>

                <div>
                  <label style={{ color: isDark ? '#ffffff' : '#666666', marginBottom: '8px', display: 'block', fontSize: '14px' }}>
                    Rate Limit (requests/hour)
                  </label>
                  <input
                    type="number"
                    value={newKeyData.rateLimit}
                    onChange={(e) => setNewKeyData({ ...newKeyData, rateLimit: parseInt(e.target.value) || 500 })}
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

              <div>
                <label style={{ color: isDark ? '#ffffff' : '#666666', marginBottom: '8px', display: 'block', fontSize: '14px' }}>
                  Permissions
                </label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {['read', 'write', 'delete'].map(permission => (
                    <label key={permission} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={newKeyData.permissions.includes(permission)}
                        onChange={() => handleTogglePermission(permission)}
                        style={{
                          width: '16px',
                          height: '16px',
                          accentColor: '#6366F1'
                        }}
                      />
                      <span style={{ color: isDark ? '#ffffff' : '#000000', fontSize: '14px', textTransform: 'capitalize' }}>
                        {permission}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <GlassButton
                  variant="primary"
                  size="small"
                  isDark={isDark}
                  onClick={handleCreateKey}
                  style={{ borderRadius: '8px' }}
                >
                  Create Key
                </GlassButton>
                <GlassButton
                  variant="ghost"
                  size="small"
                  isDark={isDark}
                  onClick={() => setShowCreateForm(false)}
                  style={{ borderRadius: '8px' }}
                >
                  Cancel
                </GlassButton>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gap: '12px' }}>
          {apiKeys.map((apiKey) => (
            <motion.div
              key={apiKey.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
                borderRadius: '12px',
                padding: '16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <div style={{ 
                    color: isDark ? '#ffffff' : '#000000',
                    fontWeight: 600,
                    fontSize: '16px',
                    marginBottom: '4px'
                  }}>
                    {apiKey.name}
                  </div>
                  <div style={{ 
                    color: isDark ? '#ffffff' : '#666666',
                    fontSize: '14px',
                    opacity: 0.8,
                    marginBottom: '8px'
                  }}>
                    Created: {apiKey.created} • Last used: {apiKey.lastUsed}
                  </div>
                  <div style={{ 
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    color: isDark ? '#ffffff' : '#000000',
                    background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    {revealedKeys.has(apiKey.id) ? apiKey.key : maskKey(apiKey.key)}
                    <GlassButton
                      variant="ghost"
                      size="small"
                      isDark={isDark}
                      onClick={() => handleToggleReveal(apiKey.id)}
                      style={{ borderRadius: '6px', padding: '4px 8px' }}
                    >
                      <Icon name={revealedKeys.has(apiKey.id) ? 'action-hide' : 'action-view'} size="sm" />
                    </GlassButton>
                    <GlassButton
                      variant="ghost"
                      size="small"
                      isDark={isDark}
                      onClick={() => navigator.clipboard.writeText(apiKey.key)}
                      style={{ borderRadius: '6px', padding: '4px 8px' }}
                    >
                      <Icon name="action-copy" size="sm" />
                    </GlassButton>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ 
                    padding: '4px 8px',
                    borderRadius: '12px',
                    background: `${getEnvironmentColor(apiKey.environment)}20`,
                    border: `1px solid ${getEnvironmentColor(apiKey.environment)}40`,
                    fontSize: '12px',
                    fontWeight: 500,
                    color: getEnvironmentColor(apiKey.environment),
                    textTransform: 'capitalize'
                  }}>
                    {apiKey.environment}
                  </div>

                  <div style={{ 
                    padding: '4px 8px',
                    borderRadius: '12px',
                    background: `${getStatusColor(apiKey.status)}20`,
                    border: `1px solid ${getStatusColor(apiKey.status)}40`,
                    fontSize: '12px',
                    fontWeight: 500,
                    color: getStatusColor(apiKey.status),
                    textTransform: 'capitalize'
                  }}>
                    {apiKey.status}
                  </div>

                  <GlassButton
                    variant="ghost"
                    size="small"
                    isDark={isDark}
                    onClick={() => handleDeleteKey(apiKey.id)}
                    style={{ borderRadius: '8px', color: '#EF4444' }}
                  >
                    <Icon name="action-delete" size="sm" />
                  </GlassButton>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                <div>
                  <div style={{ color: isDark ? '#ffffff' : '#666666', fontSize: '12px', marginBottom: '4px' }}>
                    Permissions
                  </div>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {apiKey.permissions.map(permission => (
                      <span key={permission} style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                        fontSize: '11px',
                        color: isDark ? '#ffffff' : '#000000',
                        textTransform: 'capitalize'
                      }}>
                        {permission}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ color: isDark ? '#ffffff' : '#666666', fontSize: '12px', marginBottom: '4px' }}>
                    Rate Limit
                  </div>
                  <div style={{ color: isDark ? '#ffffff' : '#000000', fontSize: '14px', fontWeight: 500 }}>
                    {apiKey.rateLimit.toLocaleString()}/hour
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

const AiIntegrationsTab: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const [aiServices, setAiServices] = useState([
    {
      id: 'openai',
      name: 'OpenAI',
      description: 'ChatGPT, GPT-4, and other OpenAI models',
      icon: 'ai-sparkles',
      status: 'connected',
      apiKey: 'sk-proj-****1234',
      model: 'gpt-4',
      lastUsed: '2 hours ago',
      usage: { requests: 1250, tokens: 45000, cost: 12.50 }
    },
    {
      id: 'anthropic',
      name: 'Anthropic',
      description: 'Claude and other Anthropic models',
      icon: 'ai-brain',
      status: 'disconnected',
      apiKey: '',
      model: 'claude-3-sonnet',
      lastUsed: 'Never',
      usage: { requests: 0, tokens: 0, cost: 0 }
    },
    {
      id: 'google',
      name: 'Google AI',
      description: 'Gemini and other Google AI models',
      icon: 'ai-lightning',
      status: 'disconnected',
      apiKey: '',
      model: 'gemini-pro',
      lastUsed: 'Never',
      usage: { requests: 0, tokens: 0, cost: 0 }
    },
    {
      id: 'azure',
      name: 'Azure OpenAI',
      description: 'OpenAI models via Azure',
      icon: 'ai-circuit',
      status: 'disconnected',
      apiKey: '',
      model: 'gpt-4',
      lastUsed: 'Never',
      usage: { requests: 0, tokens: 0, cost: 0 }
    }
  ]);
  const [editingService, setEditingService] = useState<string | null>(null);
  const [editData, setEditData] = useState({ apiKey: '', model: '', endpoint: '' });

  const handleEditService = (serviceId: string) => {
    const service = aiServices.find(s => s.id === serviceId);
    if (service) {
      setEditData({
        apiKey: service.apiKey,
        model: service.model,
        endpoint: ''
      });
      setEditingService(serviceId);
    }
  };

  const handleSaveService = () => {
    if (editingService && editData.apiKey) {
      setAiServices(services =>
        services.map(service =>
          service.id === editingService
            ? {
                ...service,
                apiKey: editData.apiKey,
                model: editData.model || service.model,
                status: 'connected' as const
              }
            : service
        )
      );
      setEditingService(null);
      setEditData({ apiKey: '', model: '', endpoint: '' });
    }
  };

  const handleDisconnectService = (serviceId: string) => {
    setAiServices(services =>
      services.map(service =>
        service.id === serviceId
          ? { ...service, status: 'disconnected' as const, apiKey: '' }
          : service
      )
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return '#10B981';
      case 'disconnected': return '#6B7280';
      case 'error': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getServiceIcon = (serviceId: string) => {
    switch (serviceId) {
      case 'openai': return 'ai-sparkles';
      case 'anthropic': return 'ai-brain';
      case 'google': return 'ai-lightning';
      case 'azure': return 'ai-circuit';
      default: return 'ai-robot';
    }
  };

  const totalUsage = aiServices.reduce((sum, service) => ({
    requests: sum.requests + service.usage.requests,
    tokens: sum.tokens + service.usage.tokens,
    cost: sum.cost + service.usage.cost
  }), { requests: 0, tokens: 0, cost: 0 });

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      {/* AI Usage Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {[
          { label: 'Connected Services', value: aiServices.filter(s => s.status === 'connected').length, color: '#10B981' },
          { label: 'Total Requests', value: totalUsage.requests.toLocaleString(), color: '#6366F1' },
          { label: 'Tokens Used', value: `${(totalUsage.tokens / 1000).toFixed(1)}K`, color: '#F59E0B' },
          { label: 'Monthly Cost', value: `$${totalUsage.cost.toFixed(2)}`, color: '#EF4444' },
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

      {/* AI Services */}
      <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '20px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` }}>
        <h3 style={{ color: isDark ? '#ffffff' : '#000000', marginBottom: '20px' }}>AI Service Integrations</h3>
        <div style={{ display: 'grid', gap: '16px' }}>
          {aiServices.map((service) => (
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ color: '#6366F1', fontSize: '24px' }}>
                    <Icon name={getServiceIcon(service.id)} size="lg" />
                  </div>
                  <div>
                    <div style={{ 
                      color: isDark ? '#ffffff' : '#000000',
                      fontWeight: 600,
                      fontSize: '18px',
                      marginBottom: '4px'
                    }}>
                      {service.name}
                    </div>
                    <div style={{ 
                      color: isDark ? '#ffffff' : '#666666',
                      fontSize: '14px',
                      opacity: 0.8
                    }}>
                      {service.description}
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

              {editingService === service.id ? (
                <div style={{ display: 'grid', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ color: isDark ? '#ffffff' : '#666666', marginBottom: '8px', display: 'block', fontSize: '14px' }}>
                      API Key
                    </label>
                    <input
                      type="password"
                      value={editData.apiKey}
                      onChange={(e) => setEditData({ ...editData, apiKey: e.target.value })}
                      placeholder="Enter your API key"
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
                      Model
                    </label>
                    <input
                      type="text"
                      value={editData.model}
                      onChange={(e) => setEditData({ ...editData, model: e.target.value })}
                      placeholder={service.model}
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
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <GlassButton
                      variant="primary"
                      size="small"
                      isDark={isDark}
                      onClick={handleSaveService}
                      style={{ borderRadius: '8px' }}
                    >
                      Save
                    </GlassButton>
                    <GlassButton
                      variant="ghost"
                      size="small"
                      isDark={isDark}
                      onClick={() => setEditingService(null)}
                      style={{ borderRadius: '8px' }}
                    >
                      Cancel
                    </GlassButton>
                  </div>
                </div>
              ) : (
                <>
                  {service.status === 'connected' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                      <div>
                        <div style={{ color: isDark ? '#ffffff' : '#666666', fontSize: '12px', marginBottom: '4px' }}>
                          Model
                        </div>
                        <div style={{ color: isDark ? '#ffffff' : '#000000', fontSize: '14px', fontWeight: 500 }}>
                          {service.model}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: isDark ? '#ffffff' : '#666666', fontSize: '12px', marginBottom: '4px' }}>
                          Requests
                        </div>
                        <div style={{ color: isDark ? '#ffffff' : '#000000', fontSize: '14px', fontWeight: 500 }}>
                          {service.usage.requests.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: isDark ? '#ffffff' : '#666666', fontSize: '12px', marginBottom: '4px' }}>
                          Tokens
                        </div>
                        <div style={{ color: isDark ? '#ffffff' : '#000000', fontSize: '14px', fontWeight: 500 }}>
                          {service.usage.tokens.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: isDark ? '#ffffff' : '#666666', fontSize: '12px', marginBottom: '4px' }}>
                          Cost
                        </div>
                        <div style={{ color: isDark ? '#ffffff' : '#000000', fontSize: '14px', fontWeight: 500 }}>
                          ${service.usage.cost.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: isDark ? '#ffffff' : '#666666', fontSize: '12px', marginBottom: '4px' }}>
                          Last Used
                        </div>
                        <div style={{ color: isDark ? '#ffffff' : '#000000', fontSize: '14px', fontWeight: 500 }}>
                          {service.lastUsed}
                        </div>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '8px' }}>
                    {service.status === 'connected' ? (
                      <>
                        <GlassButton
                          variant="ghost"
                          size="small"
                          isDark={isDark}
                          onClick={() => handleEditService(service.id)}
                          style={{ borderRadius: '8px' }}
                        >
                          <Icon name="action-edit" size="sm" />
                          Edit
                        </GlassButton>
                        <GlassButton
                          variant="ghost"
                          size="small"
                          isDark={isDark}
                          onClick={() => handleDisconnectService(service.id)}
                          style={{ borderRadius: '8px', color: '#EF4444' }}
                        >
                          <Icon name="action-disconnect" size="sm" />
                          Disconnect
                        </GlassButton>
                      </>
                    ) : (
                      <GlassButton
                        variant="primary"
                        size="small"
                        isDark={isDark}
                        onClick={() => handleEditService(service.id)}
                        style={{ borderRadius: '8px' }}
                      >
                        <Icon name="action-connect" size="sm" />
                        Connect
                      </GlassButton>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          ))}
        </div>
      </GlassCard>

      {/* Usage Guidelines */}
      <GlassCard variant="card" elevation="medium" isDark={isDark} style={{ borderRadius: '20px', border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` }}>
        <h3 style={{ color: isDark ? '#ffffff' : '#000000', marginBottom: '16px' }}>Usage Guidelines</h3>
        <div style={{ color: isDark ? '#ffffff' : '#666666', fontSize: '14px', lineHeight: '1.6' }}>
          <div style={{ marginBottom: '12px' }}>
            <strong style={{ color: isDark ? '#ffffff' : '#000000' }}>Security:</strong> API keys are encrypted and stored securely. Never share your API keys with others.
          </div>
          <div style={{ marginBottom: '12px' }}>
            <strong style={{ color: isDark ? '#ffffff' : '#000000' }}>Rate Limits:</strong> Each service has its own rate limits. Monitor your usage to avoid hitting limits.
          </div>
          <div style={{ marginBottom: '12px' }}>
            <strong style={{ color: isDark ? '#ffffff' : '#000000' }}>Costs:</strong> AI services charge based on usage. Set up billing alerts in your provider accounts.
          </div>
          <div>
            <strong style={{ color: isDark ? '#ffffff' : '#000000' }}>Models:</strong> Different models have different capabilities and costs. Choose the right model for your use case.
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default SettingsPage;