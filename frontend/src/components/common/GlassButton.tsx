import React from 'react';
import { motion } from 'framer-motion';
// import { createPressableGlassStyle } from '../../styles/glassmorphism';

// Removed unused interface

export interface GlassButtonProps {
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  blurAmount?: number;
  isDark?: boolean;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  style?: React.CSSProperties;
  className?: string;
}

/**
 * GlassButton component with glassmorphism effects and multiple variants
 * Features press animations, loading states, and theme-aware styling
 */
export const GlassButton: React.FC<GlassButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  // blurAmount, // Unused for now
  isDark = false,
  onClick,
  style,
  type = 'button',
  className,
}) => {
  // Create glassmorphism styles (currently using inline styles)
  // const glassStyles = createPressableGlassStyle(isDark, {
  //   variant: 'button',
  //   elevation: variant === 'primary' ? 'high' : 'medium',
  //   blur: blurAmount,
  // });

  // Get size-specific styles
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          padding: '8px 16px',
          fontSize: '14px',
          minHeight: '36px',
        };
      case 'large':
        return {
          padding: '16px 32px',
          fontSize: '16px',
          minHeight: '52px',
        };
      case 'medium':
      default:
        return {
          padding: '12px 24px',
          fontSize: '15px',
          minHeight: '44px',
        };
    }
  };

  // Get variant-specific styles
  const getVariantStyles = () => {
    const alpha = isDark ? 0.15 : 0.2;
    
    switch (variant) {
      case 'primary':
        return {
          background: isDark 
            ? `rgba(124, 58, 237, ${alpha})` 
            : `rgba(124, 58, 237, ${alpha})`,
          border: `1px solid #7C3AED`,
          color: '#7C3AED',
        };
      case 'secondary':
        return {
          background: isDark 
            ? `rgba(236, 72, 153, ${alpha})` 
            : `rgba(236, 72, 153, ${alpha})`,
          border: `1px solid #EC4899`,
          color: '#EC4899',
        };
      case 'outline':
        return {
          background: isDark 
            ? 'rgba(139, 92, 246, 0.05)' 
            : 'rgba(255, 255, 255, 0.1)',
          border: `1px solid ${isDark ? '#ffffff' : '#000000'}`,
          color: isDark ? '#ffffff' : '#000000',
        };
      case 'ghost':
        return {
          background: isDark 
            ? 'rgba(139, 92, 246, 0.05)' 
            : 'rgba(255, 255, 255, 0.1)',
          borderWidth: '0px',
          borderStyle: 'none',
          borderColor: 'transparent',
          color: isDark ? '#ffffff' : '#000000',
        };
      default:
        return {};
    }
  };

  // Handle click
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !loading && onClick) {
      onClick(event);
    }
  };

  const isDisabled = disabled || loading;

  // Combined styles
  const combinedStyle: React.CSSProperties = {
    ...getSizeStyles(),
    ...getVariantStyles(),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    borderRadius: '12px',
    fontWeight: 600,
    textTransform: 'none',
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    opacity: isDisabled ? 0.5 : 1,
    transition: 'all 0.2s ease-in-out',
    backdropFilter: variant !== 'ghost' ? 'blur(10px)' : 'none',
    WebkitBackdropFilter: variant !== 'ghost' ? 'blur(10px)' : 'none',
    ...style,
  };

  // Animation variants
  const hoverVariant = !isDisabled ? {
    y: -2,
    boxShadow: '0 12px 30px rgba(0, 0, 0, 0.15)',
    background: variant === 'ghost' 
      ? (isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255, 255, 255, 0.2)')
      : undefined,
  } : {};

  const tapVariant = !isDisabled ? {
    y: 0,
    boxShadow: '0 6px 15px rgba(0, 0, 0, 0.1)',
    background: variant === 'ghost' 
      ? (isDark ? 'rgba(139, 92, 246, 0.1)' : 'rgba(255, 255, 255, 0.15)')
      : undefined,
  } : {};

  return (
    <motion.button
      style={combinedStyle}
      onClick={handleClick}
      disabled={isDisabled}
      whileHover={hoverVariant}
      whileTap={tapVariant}
      whileFocus={{ 
        outline: '2px solid #7C3AED',
        outlineOffset: '2px',
      }}
      type={type}
      className={className}
    >
      {iconPosition === 'left' && icon}
      {loading && (
        <div
          style={{
            width: '16px',
            height: '16px',
            border: '2px solid currentColor',
            borderTop: '2px solid rgba(0, 0, 0, 0)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
      )}
      {children}
      {iconPosition === 'right' && icon}
    </motion.button>
  );
};

export default GlassButton;