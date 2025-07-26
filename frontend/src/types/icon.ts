import type { LucideIcon } from 'lucide-react';
import type { CSSProperties } from 'react';

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface IconSizeMap {
  xs: 12;   // Small inline icons
  sm: 16;   // Form field icons, small buttons
  md: 20;   // Default size, navigation icons
  lg: 24;   // Large buttons, headers
  xl: 32;   // Hero sections, large displays
}

export interface IconProps {
  name: string;                    // Icon identifier
  size?: IconSize | number;        // xs, sm, md, lg, xl, or number
  color?: string;                  // CSS color value or theme token
  className?: string;              // Additional CSS classes
  style?: CSSProperties;           // Inline styles
  'aria-label'?: string;          // Accessibility label
  'aria-hidden'?: boolean;        // Hide from screen readers
  onClick?: () => void;           // Click handler for interactive icons
  strokeWidth?: number;           // Override default stroke width
}

export interface IconTheme {
  colors: {
    primary: string;      // Main brand color
    secondary: string;    // Secondary actions
    success: string;      // Success states
    warning: string;      // Warning states
    error: string;        // Error states
    info: string;         // Information states
    muted: string;        // Disabled/muted icons
    inverse: string;      // For dark backgrounds
  };
  
  sizes: IconSizeMap;
  
  strokeWidth: {
    thin: 1;
    normal: 2;
    thick: 3;
  };
}

export interface IconRegistry {
  // Core icon mapping
  icons: Map<string, LucideIcon>;
  
  // Icon categories for organization
  categories: {
    auth: string[];           // login, logout, user, lock, etc.
    navigation: string[];     // menu, home, back, forward, etc.
    cloud: string[];          // server, database, network, etc.
    monitoring: string[];     // chart, graph, alert, etc.
    security: string[];       // shield, key, certificate, etc.
    cost: string[];          // dollar, chart-line, budget, etc.
    actions: string[];       // edit, delete, save, copy, etc.
    status: string[];        // check, x, warning, info, etc.
  };
  
  // Methods
  register(name: string, component: LucideIcon): void;
  get(name: string): LucideIcon | null;
  getCategory(category: keyof IconRegistry['categories']): string[];
  exists(name: string): boolean;
}

export type IconMapping = Record<string, string>;