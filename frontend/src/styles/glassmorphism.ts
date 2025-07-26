import React from 'react';

/**
 * Glassmorphism configuration interface
 */
export interface GlassmorphismConfig {
  blur?: number;
  opacity?: number;
  borderRadius?: number;
  borderWidth?: number;
  elevation?: 'low' | 'medium' | 'high';
  variant?: 'card' | 'button' | 'input' | 'modal' | 'navigation';
}

/**
 * Theme-aware glassmorphism style generator for web
 */
export const createGlassStyle = (
  isDark: boolean = false,
  config: GlassmorphismConfig = {}
): React.CSSProperties => {
  const {
    blur = 20,
    opacity = 0.15,
    borderRadius = 16,
    borderWidth = 1,
    elevation = 'medium',
    variant = 'card',
  } = config;

  // Base glass style with proper backdrop filter
  const baseStyle: React.CSSProperties = {
    backdropFilter: `blur(${blur}px) saturate(180%)`,
    WebkitBackdropFilter: `blur(${blur}px) saturate(180%)`,
    borderRadius: `${borderRadius}px`,
    position: 'relative',
    overflow: 'hidden',
  };

  // Get elevation-specific styles
  const elevationStyles = getElevationStyles(elevation);
  
  // Get variant-specific styles
  const variantStyles = getVariantStyles(variant, isDark, opacity, borderWidth);

  return {
    ...baseStyle,
    ...elevationStyles,
    ...variantStyles,
  };
};

/**
 * Get elevation-specific styles
 */
const getElevationStyles = (elevation: 'low' | 'medium' | 'high'): React.CSSProperties => {
  const elevationMap = {
    low: {
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    },
    medium: {
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    },
    high: {
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)',
    },
  };

  return elevationMap[elevation];
};

/**
 * Get variant-specific styles
 */
const getVariantStyles = (
  variant: 'card' | 'button' | 'input' | 'modal' | 'navigation',
  isDark: boolean,
  opacity: number,
  borderWidth: number
): React.CSSProperties => {
  const alpha = isDark ? opacity * 1.2 : opacity;

  switch (variant) {
    case 'card':
      return {
        background: isDark 
          ? `rgba(139, 92, 246, ${alpha})` 
          : `rgba(255, 255, 255, ${alpha + 0.1})`,
        border: `${borderWidth}px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.3)'}`,
      };

    case 'button':
      return {
        background: isDark 
          ? `rgba(139, 92, 246, ${alpha * 1.5})` 
          : `rgba(255, 255, 255, ${alpha + 0.15})`,
        border: `${borderWidth}px solid ${isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.4)'}`,
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
      };

    case 'input':
      return {
        background: isDark 
          ? `rgba(139, 92, 246, ${alpha * 0.8})` 
          : `rgba(255, 255, 255, ${alpha + 0.1})`,
        border: `${borderWidth}px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.2)'}`,
      };

    case 'modal':
      return {
        background: isDark 
          ? `rgba(139, 92, 246, ${alpha * 2})` 
          : `rgba(255, 255, 255, ${alpha + 0.2})`,
        border: `2px solid ${isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.5)'}`,
      };

    case 'navigation':
      return {
        background: isDark 
          ? `rgba(139, 92, 246, ${alpha * 1.3})` 
          : `rgba(255, 255, 255, ${alpha + 0.15})`,
        border: `${borderWidth}px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.3)'}`,
      };

    default:
      return {};
  }
};

/**
 * Create glassmorphism overlay styles for modals and backdrops
 */
export const createGlassOverlayStyle = (
  isDark: boolean = false,
  opacity: number = 0.8
): React.CSSProperties => {
  return {
    background: isDark 
      ? `rgba(15, 15, 35, ${opacity * 0.7})` 
      : `rgba(255, 255, 255, ${opacity * 0.3})`,
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  };
};

/**
 * Create pressable glass styles for buttons
 */
export const createPressableGlassStyle = (
  isDark: boolean = false,
  config: GlassmorphismConfig = {}
): {
  default: React.CSSProperties;
  hover: React.CSSProperties;
  active: React.CSSProperties;
} => {
  const defaultStyle = createGlassStyle(isDark, config);
  
  const hoverStyle: React.CSSProperties = {
    ...defaultStyle,
    background: isDark 
      ? 'rgba(139, 92, 246, 0.25)' 
      : 'rgba(255, 255, 255, 0.3)',
    transform: 'translateY(-2px)',
    boxShadow: '0 12px 30px rgba(0, 0, 0, 0.15)',
  };

  const activeStyle: React.CSSProperties = {
    ...defaultStyle,
    background: isDark 
      ? 'rgba(139, 92, 246, 0.15)' 
      : 'rgba(255, 255, 255, 0.25)',
    transform: 'translateY(0px)',
    boxShadow: '0 6px 15px rgba(0, 0, 0, 0.1)',
  };

  return {
    default: defaultStyle,
    hover: hoverStyle,
    active: activeStyle,
  };
};