import React from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from './GlassCard';
import { GlassButton } from './GlassButton';
import { Icon } from './Icon';
import DemoIndicator from './DemoIndicator';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large' | 'xl';
  color?: string;
  isDark?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'medium', 
  color,
  isDark = false 
}) => {
  const sizeMap = {
    small: 16,
    medium: 24,
    large: 32,
    xl: 40,
  };

  const spinnerSize = sizeMap[size];
  const spinnerColor = color || (isDark ? '#ffffff' : '#666666');

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      style={{
        width: spinnerSize,
        height: spinnerSize,
        border: `2px solid ${spinnerColor}20`,
        borderTop: `2px solid ${spinnerColor}`,
        borderRadius: '50%',
      }}
    />
  );
};

interface LoadingStateProps {
  message?: string;
  isDark?: boolean;
  isDemo?: boolean;
  size?: 'small' | 'medium' | 'large';
  showSpinner?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  isDark = false,
  isDemo = false,
  size = 'medium',
  showSpinner = true,
}) => {
  const paddingMap = {
    small: '16px',
    medium: '32px',
    large: '48px',
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: paddingMap[size],
      color: isDark ? '#ffffff' : '#666666',
    }}>
      {showSpinner && (
        <div style={{ marginBottom: '16px' }}>
          <LoadingSpinner size={size} isDark={isDark} />
        </div>
      )}
      
      <div style={{
        fontSize: size === 'small' ? '14px' : size === 'large' ? '18px' : '16px',
        fontWeight: 500,
        textAlign: 'center',
        marginBottom: isDemo ? '8px' : '0',
      }}>
        {message}
      </div>
      
      {isDemo && (
        <div style={{ fontSize: '14px', opacity: 0.7 }}>
          <DemoIndicator size="small" inline /> Loading demo data
        </div>
      )}
    </div>
  );
};

interface ErrorStateProps {
  error: string;
  onRetry?: () => void;
  isDark?: boolean;
  isDemo?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  error,
  onRetry,
  isDark = false,
  isDemo = false,
  size = 'medium',
}) => {
  const paddingMap = {
    small: '16px',
    medium: '32px',
    large: '48px',
  };

  const iconSizeMap = {
    small: 'md' as const,
    medium: 'lg' as const,
    large: 'xl' as const,
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: paddingMap[size],
      textAlign: 'center',
    }}>
      <div style={{ 
        color: '#EF4444', 
        marginBottom: '16px' 
      }}>
        <Icon name="alert-triangle" size={iconSizeMap[size]} />
      </div>
      
      <div style={{
        color: '#EF4444',
        fontSize: size === 'small' ? '14px' : size === 'large' ? '18px' : '16px',
        fontWeight: 500,
        marginBottom: '8px',
      }}>
        Failed to load data
      </div>
      
      <div style={{
        color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
        fontSize: size === 'small' ? '12px' : '14px',
        marginBottom: onRetry ? '16px' : '8px',
        maxWidth: '300px',
      }}>
        {error}
      </div>
      
      {isDemo && (
        <div style={{ 
          fontSize: '12px', 
          opacity: 0.7,
          marginBottom: onRetry ? '16px' : '0',
          color: isDark ? '#ffffff' : '#666666',
        }}>
          <DemoIndicator size="small" inline /> Demo mode active
        </div>
      )}
      
      {onRetry && (
        <GlassButton
          variant="primary"
          size={size === 'large' ? 'medium' : 'small'}
          isDark={isDark}
          onClick={onRetry}
          style={{ borderRadius: '8px' }}
        >
          <Icon name="action-refresh" size="sm" />
          Retry
        </GlassButton>
      )}
    </div>
  );
};

interface EmptyStateProps {
  title?: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: string;
  };
  isDark?: boolean;
  isDemo?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No data found',
  message = 'There is no data to display at the moment.',
  action,
  isDark = false,
  isDemo = false,
  size = 'medium',
}) => {
  const paddingMap = {
    small: '16px',
    medium: '32px',
    large: '48px',
  };

  const iconSizeMap = {
    small: 'md' as const,
    medium: 'lg' as const,
    large: 'xl' as const,
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: paddingMap[size],
      textAlign: 'center',
    }}>
      <div style={{ 
        color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)', 
        marginBottom: '16px' 
      }}>
        <Icon name="inbox" size={iconSizeMap[size]} />
      </div>
      
      <div style={{
        color: isDark ? '#ffffff' : '#000000',
        fontSize: size === 'small' ? '16px' : size === 'large' ? '20px' : '18px',
        fontWeight: 600,
        marginBottom: '8px',
      }}>
        {title}
      </div>
      
      <div style={{
        color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
        fontSize: size === 'small' ? '12px' : '14px',
        marginBottom: isDemo || action ? '16px' : '0',
        maxWidth: '300px',
        lineHeight: 1.5,
      }}>
        {message}
      </div>
      
      {isDemo && (
        <div style={{ 
          fontSize: '12px', 
          opacity: 0.7,
          marginBottom: action ? '16px' : '0',
          color: isDark ? '#ffffff' : '#666666',
        }}>
          <DemoIndicator size="small" inline /> This is demo mode
        </div>
      )}
      
      {action && (
        <GlassButton
          variant="primary"
          size={size === 'large' ? 'medium' : 'small'}
          isDark={isDark}
          onClick={action.onClick}
          style={{ borderRadius: '8px' }}
        >
          {action.icon && <Icon name={action.icon as any} size="sm" />}
          {action.label}
        </GlassButton>
      )}
    </div>
  );
};

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  isDark?: boolean;
  animate?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '20px',
  borderRadius = '4px',
  isDark = false,
  animate = true,
}) => {
  const baseColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  const highlightColor = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)';

  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        background: animate 
          ? `linear-gradient(90deg, ${baseColor} 25%, ${highlightColor} 50%, ${baseColor} 75%)`
          : baseColor,
        backgroundSize: animate ? '200% 100%' : 'auto',
        animation: animate ? 'skeleton-loading 1.5s ease-in-out infinite' : 'none',
      }}
    />
  );
};

// Add CSS animation for skeleton loading
const skeletonStyles = `
  @keyframes skeleton-loading {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
`;

// Inject styles if not already present
if (typeof document !== 'undefined' && !document.getElementById('skeleton-styles')) {
  const style = document.createElement('style');
  style.id = 'skeleton-styles';
  style.textContent = skeletonStyles;
  document.head.appendChild(style);
}

interface CardSkeletonProps {
  isDark?: boolean;
  count?: number;
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({
  isDark = false,
  count = 1,
}) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <GlassCard
          key={index}
          variant="card"
          elevation="medium"
          isDark={isDark}
          style={{ borderRadius: '16px', padding: '20px' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <Skeleton width="120px" height="16px" isDark={isDark} />
              <div style={{ marginTop: '8px' }}>
                <Skeleton width="80px" height="14px" isDark={isDark} />
              </div>
            </div>
            <Skeleton width="60px" height="24px" borderRadius="12px" isDark={isDark} />
          </div>
          
          <div style={{ display: 'grid', gap: '8px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Skeleton width="60px" height="14px" isDark={isDark} />
              <Skeleton width="80px" height="14px" isDark={isDark} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Skeleton width="40px" height="14px" isDark={isDark} />
              <Skeleton width="60px" height="14px" isDark={isDark} />
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <Skeleton width="100%" height="32px" borderRadius="8px" isDark={isDark} />
            <Skeleton width="100%" height="32px" borderRadius="8px" isDark={isDark} />
          </div>
        </GlassCard>
      ))}
    </>
  );
};