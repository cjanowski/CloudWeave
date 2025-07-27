import { motion } from 'framer-motion';
import { GlassCard } from './GlassCard';

// Skeleton Loader Component
export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  isDark?: boolean;
}

export function Skeleton({
  width = '100%',
  height = '20px',
  borderRadius = '4px',
  className = '',
  isDark = false,
}: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <motion.div
        animate={{
          x: ['-100%', '100%'],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(90deg, transparent, ${
            isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.8)'
          }, transparent)`,
        }}
      />
    </div>
  );
}

// Card Skeleton Component
export interface CardSkeletonProps {
  lines?: number;
  showAvatar?: boolean;
  showActions?: boolean;
  className?: string;
  isDark?: boolean;
}

export function CardSkeleton({
  lines = 3,
  showAvatar = false,
  showActions = false,
  className = '',
  isDark = false,
}: CardSkeletonProps) {
  return (
    <GlassCard className={`card-skeleton ${className}`} isDark={isDark}>
      <div style={{ padding: '16px' }}>
        {showAvatar && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <Skeleton width="40px" height="40px" borderRadius="50%" isDark={isDark} />
            <div style={{ flex: 1 }}>
              <Skeleton width="120px" height="16px" isDark={isDark} />
              <div style={{ marginTop: '4px' }}>
                <Skeleton width="80px" height="12px" isDark={isDark} />
              </div>
            </div>
          </div>
        )}
        
        {Array.from({ length: lines }, (_, i) => (
          <div key={i} style={{ marginBottom: i === lines - 1 ? 0 : '8px' }}>
            <Skeleton
              width={i === lines - 1 ? '60%' : '100%'}
              height="16px"
              isDark={isDark}
            />
          </div>
        ))}
        
        {showActions && (
          <div style={{ 
            display: 'flex', 
            gap: '8px', 
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
          }}>
            <Skeleton width="80px" height="32px" borderRadius="6px" isDark={isDark} />
            <Skeleton width="80px" height="32px" borderRadius="6px" isDark={isDark} />
          </div>
        )}
      </div>
    </GlassCard>
  );
}

// Table Skeleton Component
export interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  className?: string;
  isDark?: boolean;
}

export function TableSkeleton({
  rows = 5,
  columns = 4,
  showHeader = true,
  className = '',
  isDark = false,
}: TableSkeletonProps) {
  return (
    <GlassCard className={`table-skeleton ${className}`} isDark={isDark}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          {showHeader && (
            <thead>
              <tr style={{
                borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
              }}>
                {Array.from({ length: columns }, (_, i) => (
                  <th key={i} style={{ padding: '12px 8px', textAlign: 'left' }}>
                    <Skeleton width="80px" height="16px" isDark={isDark} />
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {Array.from({ length: rows }, (_, rowIndex) => (
              <tr
                key={rowIndex}
                style={{
                  borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
                }}
              >
                {Array.from({ length: columns }, (_, colIndex) => (
                  <td key={colIndex} style={{ padding: '12px 8px' }}>
                    <Skeleton
                      width={colIndex === 0 ? '120px' : colIndex === columns - 1 ? '60px' : '100px'}
                      height="16px"
                      isDark={isDark}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}

// Loading Spinner Component
export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  className?: string;
}

export function LoadingSpinner({
  size = 'md',
  color = '#3B82F6',
  className = '',
}: LoadingSpinnerProps) {
  const sizeMap = {
    sm: 16,
    md: 24,
    lg: 32,
    xl: 48,
  };

  const spinnerSize = sizeMap[size];

  return (
    <motion.div
      className={`loading-spinner ${className}`}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: 'linear',
      }}
      style={{
        width: spinnerSize,
        height: spinnerSize,
        border: `2px solid transparent`,
        borderTop: `2px solid ${color}`,
        borderRadius: '50%',
      }}
    />
  );
}

// Loading Overlay Component
export interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  className?: string;
  isDark?: boolean;
}

export function LoadingOverlay({
  isVisible,
  message = 'Loading...',
  className = '',
  isDark = false,
}: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`loading-overlay ${className}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
    >
      <GlassCard isDark={isDark} style={{ padding: '32px', textAlign: 'center' }}>
        <LoadingSpinner size="lg" color={isDark ? '#ffffff' : '#3B82F6'} />
        <div style={{
          marginTop: '16px',
          fontSize: '16px',
          color: isDark ? '#ffffff' : '#333333',
        }}>
          {message}
        </div>
      </GlassCard>
    </motion.div>
  );
}

// Progress Bar Component
export interface ProgressBarProps {
  value: number;
  max?: number;
  showLabel?: boolean;
  color?: string;
  backgroundColor?: string;
  height?: number;
  className?: string;
  isDark?: boolean;
}

export function ProgressBar({
  value,
  max = 100,
  showLabel = true,
  color = '#3B82F6',
  backgroundColor,
  height = 8,
  className = '',
  isDark = false,
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);
  const defaultBgColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

  return (
    <div className={`progress-bar ${className}`}>
      {showLabel && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
          fontSize: '14px',
          color: isDark ? '#ffffff' : '#333333',
        }}>
          <span>Progress</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      
      <div
        style={{
          width: '100%',
          height: `${height}px`,
          backgroundColor: backgroundColor || defaultBgColor,
          borderRadius: `${height / 2}px`,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{
            height: '100%',
            backgroundColor: color,
            borderRadius: `${height / 2}px`,
          }}
        />
      </div>
    </div>
  );
}

// Pulse Loading Component
export interface PulseLoadingProps {
  count?: number;
  size?: number;
  color?: string;
  className?: string;
}

export function PulseLoading({
  count = 3,
  size = 8,
  color = '#3B82F6',
  className = '',
}: PulseLoadingProps) {
  return (
    <div className={`pulse-loading ${className}`} style={{ display: 'flex', gap: '4px' }}>
      {Array.from({ length: count }, (_, i) => (
        <motion.div
          key={i}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.2,
          }}
          style={{
            width: size,
            height: size,
            backgroundColor: color,
            borderRadius: '50%',
          }}
        />
      ))}
    </div>
  );
}