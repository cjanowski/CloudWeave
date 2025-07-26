import React from 'react';
import { useSelector } from 'react-redux';
import { Icon } from './Icon';
import { iconRegistry } from '../../services/iconRegistry';

export const IconDemo: React.FC = () => {
  const { theme } = useSelector((state: any) => state.ui);
  const isDark = theme === 'dark';

  const demoIcons = [
    'auth-login',
    'auth-user',
    'nav-dashboard',
    'cloud-server',
    'monitor-chart',
    'security-shield',
    'cost-dollar',
    'action-settings',
    'status-check',
  ];

  return (
    <div style={{
      padding: '20px',
      backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
      color: isDark ? '#ffffff' : '#000000',
      borderRadius: '8px',
      border: `1px solid ${isDark ? '#333' : '#ddd'}`,
    }}>
      <h3>Icon System Demo</h3>
      <p>Current theme: {theme}</p>
      
      <div style={{ marginBottom: '20px' }}>
        <h4>Icon Sizes</h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <Icon name="auth-login" size="xs" />
          <Icon name="auth-login" size="sm" />
          <Icon name="auth-login" size="md" />
          <Icon name="auth-login" size="lg" />
          <Icon name="auth-login" size="xl" />
          <span>xs, sm, md, lg, xl</span>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h4>Sample Icons</h4>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
          gap: '15px' 
        }}>
          {demoIcons.map((iconName) => (
            <div key={iconName} style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              padding: '10px',
              border: `1px solid ${isDark ? '#444' : '#eee'}`,
              borderRadius: '4px'
            }}>
              <Icon name={iconName} size="lg" />
              <span style={{ fontSize: '12px', marginTop: '5px', textAlign: 'center' }}>
                {iconName}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4>Registry Stats</h4>
        <p>Total icons registered: {iconRegistry.icons.size}</p>
        <p>Categories: {Object.keys(iconRegistry.categories).join(', ')}</p>
      </div>
    </div>
  );
};