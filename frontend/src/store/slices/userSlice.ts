import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { apiService } from '../../services/apiService';

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  dateFormat: string;
  currency: string;
  notifications: {
    email: boolean;
    push: boolean;
    desktop: boolean;
    alerts: boolean;
    deployments: boolean;
    costAlerts: boolean;
    security: boolean;
  };
  dashboard: {
    layout: 'grid' | 'list';
    refreshInterval: number;
    defaultView: string;
    showWelcome: boolean;
  };
  defaultCloudProvider?: string;
}

export interface UserState {
  preferences: UserPreferences;
  onboardingCompleted: boolean;
  demoMode: boolean;
  demoScenario: 'startup' | 'enterprise' | 'devops' | 'multicloud';
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  preferences: {
    theme: 'system',
    language: 'en',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    dateFormat: 'MM/DD/YYYY',
    currency: 'USD',
    notifications: {
      email: true,
      push: true,
      desktop: true,
      alerts: true,
      deployments: true,
      costAlerts: true,
      security: true,
    },
    dashboard: {
      layout: 'grid',
      refreshInterval: 300,
      defaultView: 'overview',
      showWelcome: true,
    },
  },
  onboardingCompleted: false,
  demoMode: false,
  demoScenario: 'startup',
  loading: false,
  error: null,
};

// Async thunks
export const setUserPreferences = createAsyncThunk<
  UserPreferences,
  UserPreferences,
  { rejectValue: string }
>(
  'user/setPreferences',
  async (preferences, { rejectWithValue }) => {
    try {
      const response = await apiService.put('/user/preferences', preferences);
      return response.preferences || preferences;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to save preferences');
    }
  }
);

export const getUserPreferences = createAsyncThunk<
  UserPreferences,
  void,
  { rejectValue: string }
>(
  'user/getPreferences',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.get('/user/preferences');
      return response.preferences;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to load preferences');
    }
  }
);

export const completeOnboarding = createAsyncThunk<
  void,
  { demoMode: boolean; preferences?: UserPreferences },
  { rejectValue: string }
>(
  'user/completeOnboarding',
  async ({ demoMode, preferences }, { rejectWithValue }) => {
    try {
      await apiService.post('/user/complete-onboarding', {
        demoMode,
        preferences,
      });
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to complete onboarding');
    }
  }
);

export const initializeDemoData = createAsyncThunk<
  void,
  'startup' | 'enterprise' | 'devops' | 'multicloud',
  { rejectValue: string }
>(
  'user/initializeDemoData',
  async (scenario, { rejectWithValue }) => {
    try {
      await apiService.post('/user/initialize-demo', { scenario });
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to initialize demo data');
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setOnboardingCompleted: (state, action: PayloadAction<boolean>) => {
      state.onboardingCompleted = action.payload;
    },
    setDemoMode: (state, action: PayloadAction<boolean>) => {
      state.demoMode = action.payload;
    },
    setDemoScenario: (state, action: PayloadAction<UserState['demoScenario']>) => {
      state.demoScenario = action.payload;
    },
    updatePreferences: (state, action: PayloadAction<Partial<UserPreferences>>) => {
      state.preferences = { ...state.preferences, ...action.payload };
    },
    updateNotificationPreferences: (
      state,
      action: PayloadAction<Partial<UserPreferences['notifications']>>
    ) => {
      state.preferences.notifications = {
        ...state.preferences.notifications,
        ...action.payload,
      };
    },
    updateDashboardPreferences: (
      state,
      action: PayloadAction<Partial<UserPreferences['dashboard']>>
    ) => {
      state.preferences.dashboard = {
        ...state.preferences.dashboard,
        ...action.payload,
      };
    },
    clearError: (state) => {
      state.error = null;
    },
    resetUserState: () => initialState,
  },
  extraReducers: (builder) => {
    // Set User Preferences
    builder
      .addCase(setUserPreferences.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(setUserPreferences.fulfilled, (state, action) => {
        state.loading = false;
        state.preferences = action.payload;
        state.error = null;
      })
      .addCase(setUserPreferences.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to save preferences';
      });

    // Get User Preferences
    builder
      .addCase(getUserPreferences.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUserPreferences.fulfilled, (state, action) => {
        state.loading = false;
        state.preferences = action.payload;
        state.error = null;
      })
      .addCase(getUserPreferences.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to load preferences';
      });

    // Complete Onboarding
    builder
      .addCase(completeOnboarding.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(completeOnboarding.fulfilled, (state) => {
        state.loading = false;
        state.onboardingCompleted = true;
        state.error = null;
      })
      .addCase(completeOnboarding.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to complete onboarding';
      });

    // Initialize Demo Data
    builder
      .addCase(initializeDemoData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(initializeDemoData.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(initializeDemoData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to initialize demo data';
      });
  },
});

export const {
  setOnboardingCompleted,
  setDemoMode,
  setDemoScenario,
  updatePreferences,
  updateNotificationPreferences,
  updateDashboardPreferences,
  clearError,
  resetUserState,
} = userSlice.actions;

export default userSlice.reducer;