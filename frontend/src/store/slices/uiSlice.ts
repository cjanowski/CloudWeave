import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface UIState {
  sidebarOpen: boolean
  notificationCenterOpen: boolean
  theme: 'light' | 'dark'
  loading: {
    [key: string]: boolean
  }
  snackbar: {
    open: boolean
    message: string
    severity: 'success' | 'error' | 'warning' | 'info'
  }
}

const initialState: UIState = {
  sidebarOpen: true,
  notificationCenterOpen: false,
  theme: 'light',
  loading: {},
  snackbar: {
    open: false,
    message: '',
    severity: 'info',
  },
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen
    },
    setNotificationCenterOpen: (state, action: PayloadAction<boolean>) => {
      state.notificationCenterOpen = action.payload
    },
    toggleNotificationCenter: (state) => {
      state.notificationCenterOpen = !state.notificationCenterOpen
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload
    },
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light'
    },
    setLoading: (state, action: PayloadAction<{ key: string; loading: boolean }>) => {
      state.loading[action.payload.key] = action.payload.loading
    },
    clearLoading: (state, action: PayloadAction<string>) => {
      delete state.loading[action.payload]
    },
    showSnackbar: (state, action: PayloadAction<{
      message: string
      severity?: 'success' | 'error' | 'warning' | 'info'
    }>) => {
      state.snackbar = {
        open: true,
        message: action.payload.message,
        severity: action.payload.severity || 'info',
      }
    },
    hideSnackbar: (state) => {
      state.snackbar.open = false
    },
  },
})

export const {
  setSidebarOpen,
  toggleSidebar,
  setNotificationCenterOpen,
  toggleNotificationCenter,
  setTheme,
  toggleTheme,
  setLoading,
  clearLoading,
  showSnackbar,
  hideSnackbar,
} = uiSlice.actions

export default uiSlice.reducer