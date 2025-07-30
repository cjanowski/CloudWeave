import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { demoDataService } from '../../services/demoDataService';
import type { DemoInfrastructure, DemoDeployment, DemoMetric, DemoAlert, DemoCostData } from '../../services/demoDataService';

export interface DemoState {
  isDemo: boolean;
  scenario: 'startup' | 'enterprise' | 'devops' | 'multicloud';
  demoDataLoaded: boolean;
  demoIndicatorsVisible: boolean;
  infrastructure: DemoInfrastructure[];
  deployments: DemoDeployment[];
  metrics: DemoMetric[];
  alerts: DemoAlert[];
  costData: DemoCostData | null;
  loading: boolean;
  error: string | null;
}

const initialState: DemoState = {
  isDemo: false,
  scenario: 'startup',
  demoDataLoaded: false,
  demoIndicatorsVisible: true,
  infrastructure: [],
  deployments: [],
  metrics: [],
  alerts: [],
  costData: null,
  loading: false,
  error: null,
};

// Async thunks
export const initializeDemoData = createAsyncThunk<
  void,
  'startup' | 'enterprise' | 'devops' | 'multicloud',
  { rejectValue: string }
>(
  'demo/initializeDemoData',
  async (scenario, { rejectWithValue }) => {
    try {
      await demoDataService.initializeDemoData(scenario);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to initialize demo data');
    }
  }
);

export const loadDemoInfrastructure = createAsyncThunk<
  DemoInfrastructure[],
  void,
  { rejectValue: string }
>(
  'demo/loadInfrastructure',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { demo: DemoState };
      if (!state.demo.isDemo) {
        return [];
      }
      return await demoDataService.getDemoInfrastructure();
    } catch (error: any) {
      // Fallback to local demo data if API fails
      const state = getState() as { demo: DemoState };
      return demoDataService.generateLocalDemoData('infrastructure', state.demo.scenario);
    }
  }
);

export const loadDemoDeployments = createAsyncThunk<
  DemoDeployment[],
  void,
  { rejectValue: string }
>(
  'demo/loadDeployments',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { demo: DemoState };
      if (!state.demo.isDemo) {
        return [];
      }
      return await demoDataService.getDemoDeployments();
    } catch (error: any) {
      // Fallback to local demo data if API fails
      const state = getState() as { demo: DemoState };
      return demoDataService.generateLocalDemoData('deployments', state.demo.scenario);
    }
  }
);

export const loadDemoMetrics = createAsyncThunk<
  DemoMetric[],
  { start?: string; end?: string },
  { rejectValue: string }
>(
  'demo/loadMetrics',
  async ({ start, end }, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { demo: DemoState };
      if (!state.demo.isDemo) {
        return [];
      }
      return await demoDataService.getDemoMetrics(start, end);
    } catch (error: any) {
      // Fallback to local demo data if API fails
      const state = getState() as { demo: DemoState };
      return demoDataService.generateLocalDemoData('metrics', state.demo.scenario);
    }
  }
);

export const loadDemoAlerts = createAsyncThunk<
  DemoAlert[],
  void,
  { rejectValue: string }
>(
  'demo/loadAlerts',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { demo: DemoState };
      if (!state.demo.isDemo) {
        return [];
      }
      return await demoDataService.getDemoAlerts();
    } catch (error: any) {
      // Fallback to local demo data if API fails
      const state = getState() as { demo: DemoState };
      return demoDataService.generateLocalDemoData('alerts', state.demo.scenario);
    }
  }
);

export const loadDemoCostData = createAsyncThunk<
  DemoCostData,
  void,
  { rejectValue: string }
>(
  'demo/loadCostData',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { demo: DemoState };
      if (!state.demo.isDemo) {
        throw new Error('Not in demo mode');
      }
      return await demoDataService.getDemoCostData();
    } catch (error: any) {
      // Fallback to local demo data if API fails
      const state = getState() as { demo: DemoState };
      return demoDataService.generateLocalDemoData('cost', state.demo.scenario);
    }
  }
);

export const completeOnboarding = createAsyncThunk<
  void,
  { demoMode: boolean; preferences?: Record<string, any> },
  { rejectValue: string }
>(
  'demo/completeOnboarding',
  async ({ demoMode, preferences }, { rejectWithValue }) => {
    try {
      await demoDataService.completeOnboarding({ demoMode, preferences });
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to complete onboarding');
    }
  }
);

export const transitionToReal = createAsyncThunk<
  void,
  { cloudProviders: string[]; keepSettings: boolean },
  { rejectValue: string }
>(
  'demo/transitionToReal',
  async ({ cloudProviders, keepSettings }, { rejectWithValue }) => {
    try {
      await demoDataService.transitionToReal({ cloudProviders, keepSettings });
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to transition to real data');
    }
  }
);

const demoSlice = createSlice({
  name: 'demo',
  initialState,
  reducers: {
    setDemoMode: (state, action: PayloadAction<boolean>) => {
      state.isDemo = action.payload;
      if (!action.payload) {
        // Clear demo data when exiting demo mode
        state.infrastructure = [];
        state.deployments = [];
        state.metrics = [];
        state.alerts = [];
        state.costData = null;
        state.demoDataLoaded = false;
      }
    },
    setDemoScenario: (state, action: PayloadAction<DemoState['scenario']>) => {
      state.scenario = action.payload;
    },
    setDemoIndicatorsVisible: (state, action: PayloadAction<boolean>) => {
      state.demoIndicatorsVisible = action.payload;
    },
    clearDemoData: (state) => {
      state.infrastructure = [];
      state.deployments = [];
      state.metrics = [];
      state.alerts = [];
      state.costData = null;
      state.demoDataLoaded = false;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetDemoState: () => initialState,
  },
  extraReducers: (builder) => {
    // Initialize Demo Data
    builder
      .addCase(initializeDemoData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(initializeDemoData.fulfilled, (state) => {
        state.loading = false;
        state.isDemo = true;
        state.demoDataLoaded = true;
        state.error = null;
      })
      .addCase(initializeDemoData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to initialize demo data';
      });

    // Load Demo Infrastructure
    builder
      .addCase(loadDemoInfrastructure.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadDemoInfrastructure.fulfilled, (state, action) => {
        state.loading = false;
        state.infrastructure = action.payload;
        state.error = null;
      })
      .addCase(loadDemoInfrastructure.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to load demo infrastructure';
      });

    // Load Demo Deployments
    builder
      .addCase(loadDemoDeployments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadDemoDeployments.fulfilled, (state, action) => {
        state.loading = false;
        state.deployments = action.payload;
        state.error = null;
      })
      .addCase(loadDemoDeployments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to load demo deployments';
      });

    // Load Demo Metrics
    builder
      .addCase(loadDemoMetrics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadDemoMetrics.fulfilled, (state, action) => {
        state.loading = false;
        state.metrics = action.payload;
        state.error = null;
      })
      .addCase(loadDemoMetrics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to load demo metrics';
      });

    // Load Demo Alerts
    builder
      .addCase(loadDemoAlerts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadDemoAlerts.fulfilled, (state, action) => {
        state.loading = false;
        state.alerts = action.payload;
        state.error = null;
      })
      .addCase(loadDemoAlerts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to load demo alerts';
      });

    // Load Demo Cost Data
    builder
      .addCase(loadDemoCostData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadDemoCostData.fulfilled, (state, action) => {
        state.loading = false;
        state.costData = action.payload;
        state.error = null;
      })
      .addCase(loadDemoCostData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to load demo cost data';
      });

    // Complete Onboarding
    builder
      .addCase(completeOnboarding.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(completeOnboarding.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(completeOnboarding.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to complete onboarding';
      });

    // Transition to Real
    builder
      .addCase(transitionToReal.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(transitionToReal.fulfilled, (state) => {
        state.loading = false;
        state.isDemo = false;
        state.demoDataLoaded = false;
        state.infrastructure = [];
        state.deployments = [];
        state.metrics = [];
        state.alerts = [];
        state.costData = null;
        state.error = null;
      })
      .addCase(transitionToReal.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to transition to real data';
      });
  },
});

export const {
  setDemoMode,
  setDemoScenario,
  setDemoIndicatorsVisible,
  clearDemoData,
  clearError,
  resetDemoState,
} = demoSlice.actions;

export default demoSlice.reducer;