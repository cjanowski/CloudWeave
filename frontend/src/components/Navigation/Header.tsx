import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { toggleTheme } from '../../store/slices/uiSlice';
import { logout } from '../../store/slices/authSlice';
import { GlassButton } from '../common/GlassButton';
import { Icon } from '../common/Icon';

interface HeaderProps {
  sidebarWidth: number;
  collapsedSidebarWidth: number;
}

export const Header: React.FC<HeaderProps> = ({
  sidebarWidth,
  collapsedSidebarWidth,
}) => {
  const dispatch = useDispatch();
  const { theme } = useSelector((state: any) => state.ui);
  const { user } = useSelector((state: any) => state.auth);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const isDark = theme === 'dark';
  const currentSidebarWidth = collapsedSidebarWidth;

  const headerStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: currentSidebarWidth,
    right: 0,
    height: '64px',
    zIndex: 999,
    transition: 'left 0.3s ease-in-out',
  };

  return (
    <motion.div
      style={headerStyle}
      initial={{ y: -64 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div
        style={{
          height: '100%',
          background: isDark
            ? 'rgba(139, 92, 246, 0.2)'
            : 'rgba(255, 255, 255, 0.25)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderRadius: '0 0 24px 24px',
          borderLeft: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.3)'}`,
          borderRight: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.3)'}`,
          borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.3)'}`,
          borderTop: 'none',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          gap: '16px',
        }}
      >

        {/* Left Spacer */}
        <div style={{ flex: 1 }} />

        {/* Search - Centered */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          style={{ maxWidth: '400px', width: '100%' }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 16px',
              gap: '8px',
              background: isDark
                ? 'rgba(139, 92, 246, 0.12)'
                : 'rgba(255, 255, 255, 0.25)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.2)'}`,
              borderRadius: '12px',
            }}
          >
            <Icon name="security-scan" size="sm" color={isDark ? '#ffffff' : '#666666'} />
            <input
              type="text"
              placeholder="Search resources, deployments..."
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                background: 'transparent',
                color: isDark ? '#ffffff' : '#000000',
                fontSize: '14px',
              }}
            />
          </div>
        </motion.div>

        {/* Right Spacer */}
        <div style={{ flex: 1 }} />

        {/* Theme Toggle */}
        <GlassButton
          variant="ghost"
          size="small"
          isDark={isDark}
          onClick={() => dispatch(toggleTheme())}
          icon={<Icon name={isDark ? 'theme-sun' : 'theme-moon'} size="sm" />}
          style={{ minWidth: '40px', padding: '8px' }}
        >
        </GlassButton>

        {/* Notifications */}
        <GlassButton
          variant="ghost"
          size="small"
          isDark={isDark}
          icon={<Icon name="monitor-bell" size="sm" />}
          style={{ minWidth: '40px', padding: '8px' }}
        >
        </GlassButton>

        <div style={{ position: 'relative' }}>
          <GlassButton
            variant="ghost"
            size="small"
            isDark={isDark}
            onClick={() => setShowUserMenu(!showUserMenu)}
            icon={<Icon name="auth-user" size="sm" />}
            style={{ minWidth: '40px', padding: '8px' }}
          >
            {user?.name || 'User'}
          </GlassButton>

          {showUserMenu && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '8px',
                minWidth: '200px',
                background: isDark
                  ? 'rgba(139, 92, 246, 0.3)'
                  : 'rgba(255, 255, 255, 0.4)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                border: `2px solid ${isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.5)'}`,
                borderRadius: '16px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)',
                padding: '8px',
              }}
            >
              <div style={{ padding: '8px 16px', borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}` }}>
                <div style={{ fontWeight: 600, color: isDark ? '#ffffff' : '#000000' }}>{user?.name}</div>
                <div style={{ fontSize: '12px', opacity: 0.7, color: isDark ? '#ffffff' : '#000000' }}>{user?.email}</div>
              </div>
              <div style={{ padding: '8px 0' }}>
                <GlassButton
                  variant="ghost"
                  size="small"
                  isDark={isDark}
                  onClick={() => {
                    dispatch(logout());
                    setShowUserMenu(false);
                  }}
                  style={{ width: '100%', justifyContent: 'flex-start' }}
                >
                  Logout
                </GlassButton>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};