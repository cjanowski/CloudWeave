import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { RegisterPage } from '../RegisterPage';
import authSlice from '../../../store/slices/authSlice';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock the auth service
vi.mock('../../../services/authService', () => ({
  AuthService: {
    register: vi.fn(),
    isAuthenticated: vi.fn(() => false),
  },
  TokenManager: {
    getToken: vi.fn(() => null),
    getUser: vi.fn(() => null),
    setTokens: vi.fn(),
    setUser: vi.fn(),
    clearTokens: vi.fn(),
    isTokenExpired: vi.fn(() => true),
  },
}));

// Mock navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: authSlice,
    },
    preloadedState: {
      auth: {
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
        error: null,
        ...initialState,
      },
    },
  });
};

const renderWithProviders = (component: React.ReactElement, initialState = {}) => {
  const store = createTestStore(initialState);
  return {
    ...render(
      <Provider store={store}>
        <BrowserRouter>
          {component}
        </BrowserRouter>
      </Provider>
    ),
    store,
  };
};

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderWithProviders(<RegisterPage />);
    expect(screen.getByText('CloudWeave')).toBeInTheDocument();
  });

  it('displays error message from Redux state', () => {
    renderWithProviders(<RegisterPage />, { error: 'Email already exists' });
    expect(screen.getByText('Email already exists')).toBeInTheDocument();
  });

  it('shows loading state during registration', () => {
    renderWithProviders(<RegisterPage />, { loading: true });
    const submitButton = screen.getByRole('button', { name: /create account/i });
    expect(submitButton).toBeDisabled();
  });
});