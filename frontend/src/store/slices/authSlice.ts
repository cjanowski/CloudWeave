import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface User {
  id: string
  email: string
  name: string
  role: string
  organizationId: string
  permissions: string[]
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  isLoading: false,
  error: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.isLoading = true
      state.error = null
    },
    loginSuccess: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.isLoading = false
      state.isAuthenticated = true
      state.user = action.payload.user
      state.token = action.payload.token
      state.error = null
      localStorage.setItem('token', action.payload.token)
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false
      state.isAuthenticated = false
      state.user = null
      state.token = null
      state.error = action.payload
      localStorage.removeItem('token')
    },
    logout: (state) => {
      state.isAuthenticated = false
      state.user = null
      state.token = null
      state.error = null
      localStorage.removeItem('token')
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload
      state.isAuthenticated = true
      state.error = null
    },
    clearError: (state) => {
      state.error = null
    },
    updateUserProfile: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload }
      }
    },
  },
})

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  setUser,
  clearError,
  updateUserProfile,
} = authSlice.actions

export default authSlice.reducer