import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GlassCard } from '../common/GlassCard';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  const { isAuthenticated, user } = useSelector((state: any) => state.auth);
  const { theme } = useSelector((state: any) => state.ui);
  const location = useLocation();
  const isDark = theme === 'dark';

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If role is required and user doesn't have it, show access denied
  if (requiredRole && user?.role !== requiredRole && user?.role !== 'admin') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: isDark
          ? 'linear-gradient(135deg, #0F0F23 0%, #1A1B3A 25%, #252659 50%, #2D2F73 75%, #3A3D8F 100%)'
          : 'linear-gradient(135deg, #9eb5e7 0%, #afbfea 8%, #bfc9ec 17%, #cdd3ee 25%, #dbdef1 33%, #dce3f6 42%, #dde8fb 50%, #deedff 58%, #cdefff 67%, #b9f1ff 75%, #a7f4fa 83%, #9df5eb 100%)',
        padding: '20px',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5 }}
          style={{ width: '100%', maxWidth: '400px' }}
        >
          <GlassCard
            variant="modal"
            elevation="high"
            isDark={isDark}
            style={{
              padding: '40px',
              textAlign: 'center',
            }}
          >
            <div style={{
              fontSize: '48px',
              marginBottom: '20px',
            }}>
              🚫
            </div>
            <h1 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              margin: '0 0 16px 0',
              color: isDark ? '#ffffff' : '#000000',
            }}>
              Access Denied
            </h1>
            <p style={{
              color: isDark ? '#ffffff' : '#666666',
              opacity: 0.8,
              margin: 0,
              fontSize: '16px',
            }}>
              You don't have permission to access this page. Required role: {requiredRole}
            </p>
          </GlassCard>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;