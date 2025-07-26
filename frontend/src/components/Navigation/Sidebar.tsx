import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '../common/Icon';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  path?: string;
  children?: NavItem[];
}

const navigationItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'nav-dashboard',
    path: '/dashboard',
  },
  {
    id: 'infrastructure',
    label: 'Infrastructure',
    icon: 'cloud-server',
    path: '/infrastructure',
    children: [
      { id: 'resources', label: 'Resources', icon: 'cloud-storage', path: '/infrastructure/resources' },
      { id: 'templates', label: 'Templates', icon: 'cloud-container', path: '/infrastructure/templates' },
    ],
  },
  {
    id: 'deployments',
    label: 'Deployments',
    icon: 'action-upload',
    path: '/deployments',
    children: [
      { id: 'pipelines', label: 'Pipelines', icon: 'monitor-activity', path: '/deployments/pipelines' },
      { id: 'history', label: 'History', icon: 'monitor-clock', path: '/deployments/history' },
    ],
  },
  {
    id: 'monitoring',
    label: 'Monitoring',
    icon: 'monitor-chart',
    path: '/monitoring',
    children: [
      { id: 'metrics', label: 'Metrics', icon: 'monitor-line-chart', path: '/monitoring/metrics' },
      { id: 'alerts', label: 'Alerts', icon: 'monitor-alert', path: '/monitoring/alerts' },
    ],
  },
  {
    id: 'security',
    label: 'Security',
    icon: 'security-shield',
    path: '/security',
    children: [
      { id: 'policies', label: 'Policies', icon: 'security-key', path: '/security/policies' },
      { id: 'compliance', label: 'Compliance', icon: 'security-shield-check', path: '/security/compliance' },
    ],
  },
  {
    id: 'cost-management',
    label: 'Cost Management',
    icon: 'cost-dollar',
    path: '/cost-management',
    children: [
      { id: 'overview', label: 'Overview', icon: 'cost-chart', path: '/cost-management/overview' },
      { id: 'optimization', label: 'Optimization', icon: 'cost-savings', path: '/cost-management/optimization' },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: 'action-settings',
    path: '/settings',
  },
];

interface SidebarProps {
  width?: number;
  collapsedWidth?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  width = 280,
  collapsedWidth = 64,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, sidebarOpen } = useSelector((state: any) => state.ui);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  
  const isDark = theme === 'dark';
  
  // Sidebar should only be expanded when explicitly opened via Redux state (no hover behavior)
  const isExpanded = sidebarOpen;

  const handleItemClick = (item: NavItem) => {
    if (item.children && isExpanded) {
      setExpandedItems(prev =>
        prev.includes(item.id)
          ? prev.filter(id => id !== item.id)
          : [...prev, item.id]
      );
    } else if (item.path) {
      navigate(item.path);
    }
  };

  const isItemActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const sidebarStyle: React.CSSProperties = {
    position: 'fixed',
    left: 0,
    top: 0,
    height: '100vh',
    width: isExpanded ? width : collapsedWidth,
    transition: 'width 0.3s ease-in-out',
    zIndex: 1002, // Higher than header to show on top when expanded
  };

  return (
    <motion.div
      style={{
        ...sidebarStyle,
        background: isDark 
          ? 'linear-gradient(135deg, rgba(15, 15, 35, 0.9) 0%, rgba(26, 27, 58, 0.9) 25%, rgba(37, 38, 89, 0.9) 50%, rgba(45, 47, 115, 0.9) 75%, rgba(58, 61, 143, 0.9) 100%)'
          : 'linear-gradient(135deg, rgba(158, 181, 231, 0.9) 0%, rgba(175, 191, 234, 0.9) 8%, rgba(191, 201, 236, 0.9) 17%, rgba(205, 211, 238, 0.9) 25%, rgba(219, 222, 241, 0.9) 33%, rgba(220, 227, 246, 0.9) 42%, rgba(221, 232, 251, 0.9) 50%, rgba(222, 237, 255, 0.9) 58%, rgba(205, 239, 255, 0.9) 67%, rgba(185, 241, 255, 0.9) 75%, rgba(167, 244, 250, 0.9) 83%, rgba(157, 245, 235, 0.9) 100%)',
        borderRadius: '0px', // Remove all rounded corners
      }}
      initial={{ x: -width }}
      animate={{ x: 0 }}
      transition={{ duration: 0.3 }}
      // Removed hover behavior - sidebar only responds to Redux state now
    >
      <div
        style={{
          height: '100%',
          border: 'none', // Remove all borders
          borderRadius: '0px', // Remove all rounded corners
          boxShadow: 'none', // Remove box shadow
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          backdropFilter: 'none', // Remove backdrop filter
          WebkitBackdropFilter: 'none',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isExpanded ? 'flex-start' : 'center',
            padding: '20px',
            borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
          }}
        >
          <motion.div
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            style={{
              marginRight: isExpanded ? 8 : 0,
              cursor: 'pointer',
              filter: 'drop-shadow(0 2px 4px rgba(124, 58, 237, 0.3))',
            }}
          >
            <Icon name="cloud-cdn" size="xl" color="#7C3AED" />
          </motion.div>
          <AnimatePresence>
            {isExpanded && (
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  margin: 0,
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 50%, #6D28D9 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  cursor: 'pointer',
                }}
              >
                CloudWeave
              </motion.h1>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div style={{ flex: 1, padding: '16px 8px', overflowY: 'auto' }}>
          {navigationItems.map((item, index) => {
            const isActive = item.path ? isItemActive(item.path) : false;
            const isExpanded = expandedItems.includes(item.id);

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                style={{ marginBottom: '8px' }}
              >
                <div
                  onClick={() => handleItemClick(item)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isExpanded ? 'flex-start' : 'center',
                    padding: '12px 16px',
                    margin: '0 8px',
                    borderRadius: '12px',
                    color: isActive ? '#7C3AED' : isDark ? '#ffffff' : '#000000',
                    fontWeight: isActive ? 600 : 400,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    background: isActive 
                      ? (isDark ? 'rgba(124, 58, 237, 0.2)' : 'rgba(124, 58, 237, 0.1)')
                      : 'rgba(0, 0, 0, 0)',
                    border: `1px solid ${isActive ? '#7C3AED' : 'rgba(0, 0, 0, 0)'}`,
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = isDark 
                        ? 'rgba(139, 92, 246, 0.1)' 
                        : 'rgba(255, 255, 255, 0.15)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(0, 0, 0, 0)';
                    }
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    minWidth: '24px',
                    marginRight: isExpanded ? '12px' : 0,
                  }}>
                    <Icon name={item.icon} size="sm" />
                  </div>
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        style={{ 
                          fontSize: '15px',
                          whiteSpace: 'nowrap',
                          flex: 1,
                        }}
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {item.children && isExpanded && (
                    <motion.div
                      animate={{ rotate: expandedItems.includes(item.id) ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Icon name={expandedItems.includes(item.id) ? 'nav-up' : 'nav-down'} size="xs" />
                    </motion.div>
                  )}
                </div>

                {/* Sub-items */}
                <AnimatePresence>
                  {item.children && isExpanded && expandedItems.includes(item.id) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{ marginLeft: '16px', marginTop: '4px' }}
                    >
                      {item.children.map((child) => {
                        const isChildActive = child.path ? isItemActive(child.path) : false;
                        return (
                          <div
                            key={child.id}
                            onClick={() => child.path && navigate(child.path)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              padding: '8px 16px',
                              margin: '4px 8px',
                              borderRadius: '8px',
                              color: isChildActive ? '#7C3AED' : isDark ? '#ffffff' : '#000000',
                              fontSize: '14px',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease-in-out',
                              background: isChildActive 
                                ? (isDark ? 'rgba(124, 58, 237, 0.15)' : 'rgba(124, 58, 237, 0.08)')
                                : 'rgba(0, 0, 0, 0)',
                            }}
                            onMouseEnter={(e) => {
                              if (!isChildActive) {
                                e.currentTarget.style.background = isDark 
                                  ? 'rgba(139, 92, 246, 0.1)' 
                                  : 'rgba(255, 255, 255, 0.15)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isChildActive) {
                                e.currentTarget.style.background = 'rgba(0, 0, 0, 0)';
                              }
                            }}
                          >
                            <div style={{ marginRight: '8px' }}>
                              <Icon name={child.icon} size="xs" />
                            </div>
                            {child.label}
                          </div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default Sidebar;