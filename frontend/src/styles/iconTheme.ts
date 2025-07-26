import type { IconTheme, IconSizeMap } from '../types/icon';

export const iconSizes: IconSizeMap = {
  xs: 12,   // Small inline icons
  sm: 16,   // Form field icons, small buttons
  md: 20,   // Default size, navigation icons
  lg: 24,   // Large buttons, headers
  xl: 32,   // Hero sections, large displays
};

export const lightIconTheme: IconTheme = {
  colors: {
    primary: '#1976d2',      // Main brand color
    secondary: '#757575',    // Secondary actions
    success: '#2e7d32',      // Success states
    warning: '#ed6c02',      // Warning states
    error: '#d32f2f',        // Error states
    info: '#0288d1',         // Information states
    muted: '#9e9e9e',        // Disabled/muted icons
    inverse: '#ffffff',      // For dark backgrounds
  },
  sizes: iconSizes,
  strokeWidth: {
    thin: 1,
    normal: 2,
    thick: 3,
  },
};

export const darkIconTheme: IconTheme = {
  colors: {
    primary: '#90caf9',      // Main brand color (lighter for dark mode)
    secondary: '#b0b0b0',    // Secondary actions
    success: '#66bb6a',      // Success states
    warning: '#ffb74d',      // Warning states
    error: '#f44336',        // Error states
    info: '#29b6f6',         // Information states
    muted: '#757575',        // Disabled/muted icons
    inverse: '#000000',      // For light backgrounds
  },
  sizes: iconSizes,
  strokeWidth: {
    thin: 1,
    normal: 2,
    thick: 3,
  },
};

// Helper function to get theme based on current mode
export const getIconTheme = (isDarkMode: boolean): IconTheme => {
  return isDarkMode ? darkIconTheme : lightIconTheme;
};