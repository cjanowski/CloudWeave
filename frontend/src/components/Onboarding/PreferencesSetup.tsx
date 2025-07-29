import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { Icon } from '../common/Icon';
import { GlassCard } from '../common/GlassCard';
import { GlassButton } from '../common/GlassButton';
import { GlassInput } from '../common/GlassInput';
import type { RootState, AppDispatch } from '../../store';
import { setUserPreferences } from '../../store/slices/userSlice';
import { setTheme } from '../../store/slices/uiSlice';

export interface PreferencesSetupProps {
  onComplete: () => void;
  isDark: boolean;
  isOnboarding?: boolean;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  dateFormat: string;
  currency: string;
  notifications: {
    email: boolean;
    push: boolean;
    desktop: boolean;
    alerts: boolean;
    deployments: boolean;
    costAlerts: boolean;
    security: boolean;
  };
  dashboard: {
    layout: 'grid' | 'list';
    refreshInterval: number;
    defaultView: string;
    showWelcome: boolean;
  };
  defaultCloudProvider?: string;
}

const timezones = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)' },
  { value: 'Europe/Paris', label: 'Central European Time (CET)' },
  { value: 'Europe/Berlin', label: 'Central European Time (CET)' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)' },
  { value: 'Asia/Shanghai', label: 'China Standard Time (CST)' },
  { value: 'Asia/Kolkata', label: 'India Standard Time (IST)' },
  { value: 'Australia/Sydney', label: 'Australian Eastern Time (AET)' },
];

const languages = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'it', label: 'Italiano' },
  { value: 'pt', label: 'Português' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
  { value: 'zh', label: '中文' },
];

const currencies = [
  { value: 'USD', label: 'US Dollar ($)' },
  { value: 'EUR', label: 'Euro (€)' },
  { value: 'GBP', label: 'British Pound (£)' },
  { value: 'JPY', label: 'Japanese Yen (¥)' },
  { value: 'CAD', label: 'Canadian Dollar (C$)' },
  { value: 'AUD', label: 'Australian Dollar (A$)' },
  { value: 'CHF', label: 'Swiss Franc (CHF)' },
  { value: 'CNY', label: 'Chinese Yuan (¥)' },
  { value: 'INR', label: 'Indian Rupee (₹)' },
];

const dateFormats = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (US)' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (EU)' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO)' },
  { value: 'DD MMM YYYY', label: 'DD MMM YYYY (e.g., 15 Jan 2024)' },
  { value: 'MMM DD, YYYY', label: 'MMM DD, YYYY (e.g., Jan 15, 2024)' },
];

const refreshIntervals = [
  { value: 30, label: '30 seconds' },
  { value: 60, label: '1 minute' },
  { value: 300, label: '5 minutes' },
  { value: 600, label: '10 minutes' },
  { value: 1800, label: '30 minutes' },
  { value: 3600, label: '1 hour' },
];

export const PreferencesSetup: React.FC<PreferencesSetupProps> = ({
  onComplete,
  isDark,
  isOnboarding = false,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { theme } = useSelector((state: RootState) => state.ui);
  const { user } = useSelector((state: RootState) => state.auth);

  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: theme || 'system',
    language: 'en',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    dateFormat: 'MM/DD/YYYY',
    currency: 'USD',
    notifications: {
      email: true,
      push: true,
      desktop: true,
      alerts: true,
      deployments: true,
      costAlerts: true,
      security: true,
    },
    dashboard: {
      layout: 'grid',
      refreshInterval: 300,
      defaultView: 'overview',
      showWelcome: true,
    },
  });

  const [currentStep, setCurrentStep] = useState<'general' | 'notifications' | 'dashboard'>('general');

  const handlePreferenceChange = (key: string, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleNestedPreferenceChange = (category: string, key: string, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof UserPreferences],
        [key]: value,
      },
    }));
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    handlePreferenceChange('theme', newTheme);
    if (newTheme !== 'system') {
      dispatch(setTheme(newTheme));
    } else {
      // Apply system theme
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      dispatch(setTheme(systemTheme));
    }
  };

  const handleSavePreferences = async () => {
    try {
      await dispatch(setUserPreferences(preferences)).unwrap();
      onComplete();
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  };

  const renderGeneralPreferences = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ display: 'grid', gap: '24px' }}
    >
      <div>
        <h3 style={{
          fontSize: '20px',
          fontWeight: 600,
          margin: '0 0 16px 0',
          color: isDark ? '#ffffff' : '#000000',
        }}>
          General Preferences
        </h3>
        <p style={{
          fontSize: '14px',
          color: isDark ? '#ffffff' : '#666666',
          opacity: 0.8,
          margin: '0 0 24px 0',
        }}>
          Customize your basic application settings
        </p>
      </div>

      {/* Theme Selection */}
      <div>
        <label style={{
          color: isDark ? '#ffffff' : '#666666',
          fontSize: '14px',
          fontWeight: 500,
          marginBottom: '12px',
          display: 'block',
        }}>
          Theme Preference
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {[
            { value: 'light', label: 'Light', icon: '☀️', desc: 'Light theme' },
            { value: 'dark', label: 'Dark', icon: '🌙', desc: 'Dark theme' },
            { value: 'system', label: 'System', icon: '💻', desc: 'Follow system' },
          ].map(themeOption => (
            <motion.div
              key={themeOption.value}
              onClick={() => handleThemeChange(themeOption.value as 'light' | 'dark' | 'system')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                background: preferences.theme === themeOption.value
                  ? (isDark ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)')
                  : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'),
                border: preferences.theme === themeOption.value
                  ? '2px solid #8B5CF6'
                  : `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                borderRadius: '12px',
                padding: '16px',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.3s ease',
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>{themeOption.icon}</div>
              <div style={{
                fontSize: '14px',
                fontWeight: 500,
                color: isDark ? '#ffffff' : '#000000',
                marginBottom: '4px',
              }}>
                {themeOption.label}
              </div>
              <div style={{
                fontSize: '12px',
                color: isDark ? '#ffffff' : '#666666',
                opacity: 0.7,
              }}>
                {themeOption.desc}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Language and Region */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        <div>
          <label style={{
            color: isDark ? '#ffffff' : '#666666',
            fontSize: '14px',
            fontWeight: 500,
            marginBottom: '8px',
            display: 'block',
          }}>
            Language
          </label>
          <select
            value={preferences.language}
            onChange={(e) => handlePreferenceChange('language', e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
              background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
              color: isDark ? '#ffffff' : '#000000',
              fontSize: '14px',
            }}
          >
            {languages.map(lang => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{
            color: isDark ? '#ffffff' : '#666666',
            fontSize: '14px',
            fontWeight: 500,
            marginBottom: '8px',
            display: 'block',
          }}>
            Timezone
          </label>
          <select
            value={preferences.timezone}
            onChange={(e) => handlePreferenceChange('timezone', e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
              background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
              color: isDark ? '#ffffff' : '#000000',
              fontSize: '14px',
            }}
          >
            {timezones.map(tz => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Date Format and Currency */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        <div>
          <label style={{
            color: isDark ? '#ffffff' : '#666666',
            fontSize: '14px',
            fontWeight: 500,
            marginBottom: '8px',
            display: 'block',
          }}>
            Date Format
          </label>
          <select
            value={preferences.dateFormat}
            onChange={(e) => handlePreferenceChange('dateFormat', e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
              background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
              color: isDark ? '#ffffff' : '#000000',
              fontSize: '14px',
            }}
          >
            {dateFormats.map(format => (
              <option key={format.value} value={format.value}>
                {format.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{
            color: isDark ? '#ffffff' : '#666666',
            fontSize: '14px',
            fontWeight: 500,
            marginBottom: '8px',
            display: 'block',
          }}>
            Currency
          </label>
          <select
            value={preferences.currency}
            onChange={(e) => handlePreferenceChange('currency', e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
              background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
              color: isDark ? '#ffffff' : '#000000',
              fontSize: '14px',
            }}
          >
            {currencies.map(currency => (
              <option key={currency.value} value={currency.value}>
                {currency.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </motion.div>
  );

  const renderNotificationPreferences = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ display: 'grid', gap: '24px' }}
    >
      <div>
        <h3 style={{
          fontSize: '20px',
          fontWeight: 600,
          margin: '0 0 16px 0',
          color: isDark ? '#ffffff' : '#000000',
        }}>
          Notification Preferences
        </h3>
        <p style={{
          fontSize: '14px',
          color: isDark ? '#ffffff' : '#666666',
          opacity: 0.8,
          margin: '0 0 24px 0',
        }}>
          Choose how you'd like to receive notifications
        </p>
      </div>

      {/* Notification Channels */}
      <div>
        <h4 style={{
          fontSize: '16px',
          fontWeight: 500,
          margin: '0 0 16px 0',
          color: isDark ? '#ffffff' : '#000000',
        }}>
          Notification Channels
        </h4>
        <div style={{ display: 'grid', gap: '16px' }}>
          {[
            { key: 'email', label: 'Email Notifications', icon: '📧', desc: 'Receive notifications via email' },
            { key: 'push', label: 'Push Notifications', icon: '📱', desc: 'Browser push notifications' },
            { key: 'desktop', label: 'Desktop Notifications', icon: '💻', desc: 'System desktop notifications' },
          ].map(channel => (
            <div
              key={channel.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                borderRadius: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '20px' }}>{channel.icon}</span>
                <div>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: 500,
                    color: isDark ? '#ffffff' : '#000000',
                    marginBottom: '4px',
                  }}>
                    {channel.label}
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: isDark ? '#ffffff' : '#666666',
                    opacity: 0.8,
                  }}>
                    {channel.desc}
                  </div>
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={preferences.notifications[channel.key as keyof typeof preferences.notifications]}
                  onChange={(e) => handleNestedPreferenceChange('notifications', channel.key, e.target.checked)}
                  style={{
                    width: '20px',
                    height: '20px',
                    marginRight: '8px',
                    accentColor: '#8B5CF6',
                  }}
                />
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Notification Types */}
      <div>
        <h4 style={{
          fontSize: '16px',
          fontWeight: 500,
          margin: '0 0 16px 0',
          color: isDark ? '#ffffff' : '#000000',
        }}>
          Notification Types
        </h4>
        <div style={{ display: 'grid', gap: '16px' }}>
          {[
            { key: 'alerts', label: 'System Alerts', icon: '🚨', desc: 'Critical system alerts and warnings' },
            { key: 'deployments', label: 'Deployment Updates', icon: '🚀', desc: 'Deployment status and progress' },
            { key: 'costAlerts', label: 'Cost Alerts', icon: '💰', desc: 'Budget and cost threshold alerts' },
            { key: 'security', label: 'Security Notifications', icon: '🔒', desc: 'Security events and vulnerabilities' },
          ].map(type => (
            <div
              key={type.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                borderRadius: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '20px' }}>{type.icon}</span>
                <div>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: 500,
                    color: isDark ? '#ffffff' : '#000000',
                    marginBottom: '4px',
                  }}>
                    {type.label}
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: isDark ? '#ffffff' : '#666666',
                    opacity: 0.8,
                  }}>
                    {type.desc}
                  </div>
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={preferences.notifications[type.key as keyof typeof preferences.notifications]}
                  onChange={(e) => handleNestedPreferenceChange('notifications', type.key, e.target.checked)}
                  style={{
                    width: '20px',
                    height: '20px',
                    marginRight: '8px',
                    accentColor: '#8B5CF6',
                  }}
                />
              </label>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );

  const renderDashboardPreferences = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ display: 'grid', gap: '24px' }}
    >
      <div>
        <h3 style={{
          fontSize: '20px',
          fontWeight: 600,
          margin: '0 0 16px 0',
          color: isDark ? '#ffffff' : '#000000',
        }}>
          Dashboard Preferences
        </h3>
        <p style={{
          fontSize: '14px',
          color: isDark ? '#ffffff' : '#666666',
          opacity: 0.8,
          margin: '0 0 24px 0',
        }}>
          Customize your dashboard layout and behavior
        </p>
      </div>

      {/* Layout Selection */}
      <div>
        <label style={{
          color: isDark ? '#ffffff' : '#666666',
          fontSize: '14px',
          fontWeight: 500,
          marginBottom: '12px',
          display: 'block',
        }}>
          Dashboard Layout
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          {[
            { value: 'grid', label: 'Grid Layout', icon: '⊞', desc: 'Card-based grid layout' },
            { value: 'list', label: 'List Layout', icon: '☰', desc: 'Compact list layout' },
          ].map(layout => (
            <motion.div
              key={layout.value}
              onClick={() => handleNestedPreferenceChange('dashboard', 'layout', layout.value)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                background: preferences.dashboard.layout === layout.value
                  ? (isDark ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)')
                  : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'),
                border: preferences.dashboard.layout === layout.value
                  ? '2px solid #8B5CF6'
                  : `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                borderRadius: '12px',
                padding: '16px',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.3s ease',
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>{layout.icon}</div>
              <div style={{
                fontSize: '14px',
                fontWeight: 500,
                color: isDark ? '#ffffff' : '#000000',
                marginBottom: '4px',
              }}>
                {layout.label}
              </div>
              <div style={{
                fontSize: '12px',
                color: isDark ? '#ffffff' : '#666666',
                opacity: 0.7,
              }}>
                {layout.desc}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Refresh Interval */}
      <div>
        <label style={{
          color: isDark ? '#ffffff' : '#666666',
          fontSize: '14px',
          fontWeight: 500,
          marginBottom: '8px',
          display: 'block',
        }}>
          Auto-refresh Interval
        </label>
        <select
          value={preferences.dashboard.refreshInterval}
          onChange={(e) => handleNestedPreferenceChange('dashboard', 'refreshInterval', parseInt(e.target.value))}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
            background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
            color: isDark ? '#ffffff' : '#000000',
            fontSize: '14px',
          }}
        >
          {refreshIntervals.map(interval => (
            <option key={interval.value} value={interval.value}>
              {interval.label}
            </option>
          ))}
        </select>
      </div>

      {/* Additional Options */}
      <div>
        <h4 style={{
          fontSize: '16px',
          fontWeight: 500,
          margin: '0 0 16px 0',
          color: isDark ? '#ffffff' : '#000000',
        }}>
          Additional Options
        </h4>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px',
          background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
          border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
          borderRadius: '12px',
        }}>
          <div>
            <div style={{
              fontSize: '16px',
              fontWeight: 500,
              color: isDark ? '#ffffff' : '#000000',
              marginBottom: '4px',
            }}>
              Show Welcome Message
            </div>
            <div style={{
              fontSize: '14px',
              color: isDark ? '#ffffff' : '#666666',
              opacity: 0.8,
            }}>
              Display welcome message on dashboard
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={preferences.dashboard.showWelcome}
              onChange={(e) => handleNestedPreferenceChange('dashboard', 'showWelcome', e.target.checked)}
              style={{
                width: '20px',
                height: '20px',
                marginRight: '8px',
                accentColor: '#8B5CF6',
              }}
            />
          </label>
        </div>
      </div>
    </motion.div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 'general':
        return renderGeneralPreferences();
      case 'notifications':
        return renderNotificationPreferences();
      case 'dashboard':
        return renderDashboardPreferences();
      default:
        return renderGeneralPreferences();
    }
  };

  const steps = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  ];

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Step Navigation */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '8px',
          marginBottom: '24px',
        }}>
          {steps.map((step, index) => (
            <GlassButton
              key={step.id}
              variant={currentStep === step.id ? 'primary' : 'ghost'}
              size="small"
              isDark={isDark}
              onClick={() => setCurrentStep(step.id as typeof currentStep)}
              style={{
                minWidth: 'auto',
                padding: '8px 16px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: currentStep === step.id ? 600 : 400,
              }}
            >
              <span style={{ marginRight: '8px' }}>{step.icon}</span>
              {step.label}
            </GlassButton>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div style={{ flex: 1, marginBottom: '32px' }}>
        {renderStepContent()}
      </div>

      {/* Navigation Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <GlassButton
          variant="ghost"
          size="medium"
          isDark={isDark}
          onClick={() => {
            if (currentStepIndex > 0) {
              setCurrentStep(steps[currentStepIndex - 1].id as typeof currentStep);
            }
          }}
          disabled={currentStepIndex === 0}
          style={{
            opacity: currentStepIndex === 0 ? 0.5 : 1,
          }}
        >
          <Icon name="arrow-left" size="sm" />
          Previous
        </GlassButton>

        <div style={{ display: 'flex', gap: '12px' }}>
          {currentStepIndex < steps.length - 1 ? (
            <GlassButton
              variant="primary"
              size="medium"
              isDark={isDark}
              onClick={() => setCurrentStep(steps[currentStepIndex + 1].id as typeof currentStep)}
            >
              Next
              <Icon name="arrow-right" size="sm" />
            </GlassButton>
          ) : (
            <GlassButton
              variant="primary"
              size="medium"
              isDark={isDark}
              onClick={handleSavePreferences}
            >
              <Icon name="check" size="sm" />
              Complete Setup
            </GlassButton>
          )}
        </div>
      </div>
    </div>
  );
};

export default PreferencesSetup;