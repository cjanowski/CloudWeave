import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { useSelector } from 'react-redux';
import type { IconProps, IconSize } from '../../types/icon';
import { iconRegistry } from '../../services/iconRegistry';
import { getIconTheme } from '../../styles/iconTheme';
import { HelpCircle } from 'lucide-react';

// Error boundary for icon rendering
interface IconErrorBoundaryState {
  hasError: boolean;
}

class IconErrorBoundary extends Component<
  { children: ReactNode; fallbackIcon?: string },
  IconErrorBoundaryState
> {
  constructor(props: { children: ReactNode; fallbackIcon?: string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): IconErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('Icon failed to render:', error.message, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <span 
          className="icon-fallback" 
          aria-hidden="true"
          style={{ 
            display: 'inline-block',
            width: '1em',
            height: '1em',
            fontSize: 'inherit'
          }}
        >
          {this.props.fallbackIcon || '□'}
        </span>
      );
    }
    return this.props.children;
  }
}

// Main Icon component
export const Icon: React.FC<IconProps> = ({
  name,
  size = 'md',
  color,
  className = '',
  style = {},
  'aria-label': ariaLabel,
  'aria-hidden': ariaHidden,
  onClick,
  strokeWidth,
}) => {
  // Get current theme from Redux store
  const { theme: currentTheme } = useSelector((state: any) => state.ui);
  const isDark = currentTheme === 'dark';
  
  // Get the icon component from registry
  const IconComponent = iconRegistry.get(name);
  
  // Get current theme
  const theme = getIconTheme(isDark);
  
  // Calculate size
  const iconSize = typeof size === 'number' ? size : theme.sizes[size as IconSize];
  
  // Determine color
  const iconColor = color || theme.colors.primary;
  
  // Determine stroke width
  const iconStrokeWidth = strokeWidth || theme.strokeWidth.normal;
  
  // If icon not found, use fallback
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in registry`);
    return (
      <IconErrorBoundary>
        <HelpCircle
          size={iconSize}
          color={theme.colors.muted}
          strokeWidth={iconStrokeWidth}
          className={`icon icon-fallback ${className}`}
          style={style}
          aria-label={ariaLabel || `Missing icon: ${name}`}
          aria-hidden={ariaHidden}
          onClick={onClick}
        />
      </IconErrorBoundary>
    );
  }

  return (
    <IconErrorBoundary>
      <IconComponent
        size={iconSize}
        color={iconColor}
        strokeWidth={iconStrokeWidth}
        className={`icon icon-${name} ${className}`}
        style={style}
        aria-label={ariaLabel}
        aria-hidden={ariaHidden}
        onClick={onClick}
      />
    </IconErrorBoundary>
  );
};

export default Icon;