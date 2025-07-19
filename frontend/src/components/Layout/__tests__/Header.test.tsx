import React from 'react'
import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import { configureStore } from '@reduxjs/toolkit'

import Header from '../Header'
import { theme } from '../../../theme'
import authSlice from '../../../store/slices/authSlice'
import uiSlice from '../../../store/slices/uiSlice'

const mockStore = configureStore({
  reducer: {
    auth: authSlice,
    ui: uiSlice,
  },
  preloadedState: {
    auth: {
      user: {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        organizationId: '1',
        permissions: [],
      },
      token: 'mock-token',
      isAuthenticated: true,
      isLoading: false,
      error: null,
    },
    ui: {
      sidebarOpen: true,
      notificationCenterOpen: false,
      theme: 'light',
      loading: {},
      snackbar: {
        open: false,
        message: '',
        severity: 'info',
      },
    },
  },
})

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <Provider store={mockStore}>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          {component}
        </ThemeProvider>
      </BrowserRouter>
    </Provider>
  )
}

describe('Header', () => {
  it('renders without crashing', () => {
    renderWithProviders(<Header />)
    expect(screen.getByRole('banner')).toBeInTheDocument()
  })

  it('displays search input', () => {
    renderWithProviders(<Header />)
    expect(screen.getByPlaceholderText(/search resources/i)).toBeInTheDocument()
  })

  it('displays user avatar', () => {
    renderWithProviders(<Header />)
    expect(screen.getByRole('button', { name: /account menu/i })).toBeInTheDocument()
  })
})