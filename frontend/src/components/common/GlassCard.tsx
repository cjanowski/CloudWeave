import React from 'react';
import { motion } from 'framer-motion';
import { createGlassStyle } from '../../styles/glassmorphism';

interface GlassmorphismConfig {
  blur?: number;
  opacity?: number;
  borderRadius?: number;
  borderWidth?: number;
  elevation?: 'low' | 'medium' | 'high';
  variant?: 'card' | 'button' | 'input' | 'modal' | 'navigation';
}

export interface GlassCardProps {
  children: React.ReactNode;
  elevation?: 'low' | 'medium' | 'high';
  variant?: 'card' | 'button' | 'input' | 'modal' | 'navigation';
  blurAmount?: number;
  pressable?: boolean;
  isDark?: boolean;
  animate?: boolean;
  style?: React.CSSProperties;
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
}

/**
 * GlassCard component with glassmorphism effects for web
 * Features blur effects, semi-transparent backgrounds, and theme-aware styling
 */
export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  elevation = 'medium',
  variant = 'card',
  blurAmount,
  pressable = false,
  isDark = false,
  animate = true,
  style,
  onClick,
  className,
}) => {
  // Create glassmorphism configuration
  const glassConfig: GlassmorphismConfig = {
    elevation,
    variant,
    blur: blurAmount,
  };

  // Create glass styles
  const glassStyle = createGlassStyle(isDark, glassConfig);

  // Combined styles
  const combinedStyle: React.CSSProperties = {
    ...glassStyle,
    padding: '16px',
    cursor: pressable ? 'pointer' : 'default',
    transition: 'all 0.2s ease-in-out',
    ...style,
  };

  // Handle click
  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (pressable && onClick) {
      onClick(event);
    }
  };

  // Animation variants for hover states
  const hoverVariant = pressable ? {
    y: -2,
    boxShadow: '0 12px 30px rgba(0, 0, 0, 0.15)',
    background: isDark
      ? 'rgba(139, 92, 246, 0.25)'
      : 'rgba(255, 255, 255, 0.35)',
  } : {};

  const tapVariant = pressable ? {
    y: 0,
    boxShadow: '0 6px 15px rgba(0, 0, 0, 0.1)',
    background: isDark
      ? 'rgba(139, 92, 246, 0.15)'
      : 'rgba(255, 255, 255, 0.25)',
  } : {};

  if (animate) {
    return (
      <motion.div
        style={combinedStyle}
        onClick={handleClick}
        whileHover={hoverVariant}
        whileTap={tapVariant}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={className}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div
      style={combinedStyle}
      onClick={handleClick}
      className={className}
    >
      {children}
    </div>
  );
};

export default GlassCard;