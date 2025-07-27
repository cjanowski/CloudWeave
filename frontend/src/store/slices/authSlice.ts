import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { useSelector, useDispatch } from 'react-redux';
import { AuthService, TokenManager } from '../../services/authService';
import type { User, ForgotPasswordRequest } from '../../types/api';
import type { LoginCredentials, RegisterCredentials, ApiError } from '../../services/authService';
import type { RootState } from '../index';

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

// Initialize state from stored tokens
const token = TokenManager.getToken();
const user = TokenManager.getUser();

const initialState: AuthState = {
  isAuthenticated: AuthService.isAuthenticated(),
  user: user,
  token: token,
  loading: false,
  error: null,
};

// Async thunks for authentication actions
export const loginAsync = createAsyncThunk<
  { user: User; token: string },
  LoginCredentials,
  { rejectValue: string }
>(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await AuthService.login(credentials);
      return { user: response.user, token: response.token };
    } catch (error: any) {
      const apiError = error as ApiError;
      return rejectWithValue(apiError.message);
    }
  }
);

export const registerAsync = createAsyncThunk<
  { user: User; token: string },
  RegisterCredentials,
  { rejectValue: string }
>(
  'auth/register',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await AuthService.register(credentials);
      return { user: response.user, token: response.token };
    } catch (error: any) {
      const apiError = error as ApiError;
      return rejectWithValue(apiError.message);
    }
  }
);

export const forgotPasswordAsync = createAsyncThunk<
  { message: string },
  ForgotPasswordRequest,
  { rejectValue: string }
>(
  'auth/forgotPassword',
  async (request, { rejectWithValue }) => {
    try {
      const response = await AuthService.forgotPassword(request);
      return response;
    } catch (error: any) {
      const apiError = error as ApiError;
      return rejectWithValue(apiError.message);
    }
  }
);

export const logoutAsync = createAsyncThunk<void, void, { rejectValue: string }>(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await AuthService.logout();
    } catch (error: any) {
      const apiError = error as ApiError;
      return rejectWithValue(apiError.message);
    }
  }
);

export const getCurrentUserAsync = createAsyncThunk<
  User | null,
  void,
  { rejectValue: string }
>(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const user = await AuthService.getCurrentUser();
      return user;
    } catch (error: any) {
      const apiError = error as ApiError;
      return rejectWithValue(apiError.message);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setUser: (state, action) => {
      state.user = action.payload;
    },
    // Legacy actions for backward compatibility
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.error = null;
    },
    loginFailure: (state, action) => {
      state.loading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.error = action.payload || 'Login failed';
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.error = null;
      TokenManager.clearTokens();
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(loginAsync.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = action.payload || 'Login failed';
      });

    // Register
    builder
      .addCase(registerAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(registerAsync.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = action.payload || 'Registration failed';
      });

    // Forgot Password
    builder
      .addCase(forgotPasswordAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(forgotPasswordAsync.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(forgotPasswordAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to send reset email';
      });

    // Logout
    builder
      .addCase(logoutAsync.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutAsync.fulfilled, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = null;
      })
      .addCase(logoutAsync.rejected, (state, action) => {
        state.loading = false;
        // Still logout locally even if API call fails
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = action.payload || 'Logout failed';
      });

    // Get Current User
    builder
      .addCase(getCurrentUserAsync.pending, (state) => {
        state.loading = true;
      })
      .addCase(getCurrentUserAsync.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.user = action.payload;
          state.isAuthenticated = true;
        } else {
          state.isAuthenticated = false;
          state.user = null;
          state.token = null;
        }
      })
      .addCase(getCurrentUserAsync.rejected, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      });
  },
});

export const { 
  clearError, 
  setUser, 
  loginStart, 
  loginSuccess, 
  loginFailure, 
  logout 
} = authSlice.actions;

// Custom hook to access auth state and actions
export const useAuth = () => {
  const dispatch = useDispatch();
  const auth = useSelector((state: RootState) => state.auth);

  return {
    ...auth,
    login: (credentials: LoginCredentials) => dispatch(loginAsync(credentials)),
    register: (credentials: RegisterCredentials) => dispatch(registerAsync(credentials)),
    forgotPassword: (request: ForgotPasswordRequest) => dispatch(forgotPasswordAsync(request)),
    logout: () => dispatch(logoutAsync()),
    getCurrentUser: () => dispatch(getCurrentUserAsync()),
    clearError: () => dispatch(clearError()),
  };
};

export default authSlice.reducer;