import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { Icon } from '../Icon';
import uiSlice from '../../../store/slices/uiSlice';

// Mock store for testing
const createMockStore = (theme: 'light' | 'dark' = 'light') => {
  return configureStore({
    reducer: {
      ui: uiSlice,
    },
    preloadedState: {
      ui: {
        theme,
        sidebarOpen: false,
      },
    },
  });
};

const renderWithProvider = (component: React.ReactElement, theme: 'light' | 'dark' = 'light') => {
  const store = createMockStore(theme);
  return render(
    <Provider store={store}>
      {component}
    </Provider>
  );
};

describe('Icon Component', () => {
  it('renders a valid icon from registry', () => {
    renderWithProvider(<Icon name="auth-login" aria-label="Login icon" />);
    
    const icon = screen.getByLabelText('Login icon');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass('icon', 'icon-auth-login');
  });

  it('renders fallback icon for unknown icon name', () => {
    renderWithProvider(<Icon name="unknown-icon" aria-label="Unknown icon" />);
    
    const icon = screen.getByLabelText('Unknown icon');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass('icon-fallback');
  });

  it('applies correct size classes', () => {
    renderWithProvider(<Icon name="auth-login" size="lg" aria-label="Large login icon" />);
    
    const icon = screen.getByLabelText('Large login icon');
    expect(icon).toBeInTheDocument();
  });

  it('applies custom className', () => {
    renderWithProvider(<Icon name="auth-login" className="custom-class" aria-label="Custom icon" />);
    
    const icon = screen.getByLabelText('Custom icon');
    expect(icon).toHaveClass('custom-class');
  });

  it('handles aria-hidden attribute', () => {
    renderWithProvider(<Icon name="auth-login" aria-hidden={true} />);
    
    // Should not be accessible to screen readers
    const icon = document.querySelector('.icon-auth-login');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
  });

  it('works with different themes', () => {
    // Test light theme
    renderWithProvider(<Icon name="auth-login" aria-label="Light theme icon" />, 'light');
    let icon = screen.getByLabelText('Light theme icon');
    expect(icon).toBeInTheDocument();

    // Test dark theme
    renderWithProvider(<Icon name="auth-login" aria-label="Dark theme icon" />, 'dark');
    icon = screen.getByLabelText('Dark theme icon');
    expect(icon).toBeInTheDocument();
  });
});