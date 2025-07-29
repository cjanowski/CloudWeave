import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiService } from '../../services/apiService';

export interface CloudCredentials {
  [key: string]: string;
}

export interface ValidationResult {
  valid: boolean;
  permissions: string[];
  limitations: string[];
  regions: string[];
  services: string[];
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface CloudProvider {
  id: string;
  name: string;
  provider: 'aws' | 'gcp' | 'azure';
  credentialType: string;
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  region?: string;
  lastSync?: string;
  syncInterval?: number;
  tags?: string[];
  validationResult?: ValidationResult;
  createdAt: string;
  updatedAt: string;
}

export interface CloudProviderState {
  providers: CloudProvider[];
  activeProvider: CloudProvider | null;
  connectionStatus: Record<string, 'connected' | 'disconnected' | 'error' | 'pending'>;
  validationResults: Record<string, ValidationResult>;
  loading: boolean;
  error: string | null;
  testingConnection: boolean;
}

const initialState: CloudProviderState = {
  providers: [],
  activeProvider: null,
  connectionStatus: {},
  validationResults: {},
  loading: false,
  error: null,
  testingConnection: false,
};

// Async thunks
export const getCloudProviders = createAsyncThunk<
  CloudProvider[],
  void,
  { rejectValue: string }
>(
  'cloudProvider/getProviders',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.get('/cloud-providers');
      return response.providers || [];
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to load cloud providers');
    }
  }
);

export interface AddCloudProviderRequest {
  name: string;
  provider: 'aws' | 'gcp' | 'azure';
  credentialType: string;
  credentials: CloudCredentials;
  region?: string;
  tags?: string[];
}

export const addCloudProvider = createAsyncThunk<
  CloudProvider,
  AddCloudProviderRequest,
  { rejectValue: string }
>(
  'cloudProvider/addProvider',
  async (providerData, { rejectWithValue }) => {
    try {
      const response = await apiService.post('/cloud-providers', providerData);
      return response.provider;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to add cloud provider');
    }
  }
);

export interface UpdateCloudProviderRequest {
  id: string;
  name?: string;
  credentials?: CloudCredentials;
  region?: string;
  tags?: string[];
}

export const updateCloudProvider = createAsyncThunk<
  CloudProvider,
  UpdateCloudProviderRequest,
  { rejectValue: string }
>(
  'cloudProvider/updateProvider',
  async ({ id, ...updateData }, { rejectWithValue }) => {
    try {
      const response = await apiService.put(`/cloud-providers/${id}`, updateData);
      return response.provider;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update cloud provider');
    }
  }
);

export const removeCloudProvider = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>(
  'cloudProvider/removeProvider',
  async (providerId, { rejectWithValue }) => {
    try {
      await apiService.delete(`/cloud-providers/${providerId}`);
      return providerId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to remove cloud provider');
    }
  }
);

export interface TestConnectionRequest {
  provider: 'aws' | 'gcp' | 'azure';
  credentialType: string;
  credentials: CloudCredentials;
}

export const testCloudProviderConnection = createAsyncThunk<
  ValidationResult,
  TestConnectionRequest,
  { rejectValue: string }
>(
  'cloudProvider/testConnection',
  async (testData, { rejectWithValue }) => {
    try {
      const response = await apiService.post('/cloud-providers/test-connection', testData);
      return response.validationResult;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Connection test failed');
    }
  }
);

export const syncCloudProvider = createAsyncThunk<
  CloudProvider,
  string,
  { rejectValue: string }
>(
  'cloudProvider/syncProvider',
  async (providerId, { rejectWithValue }) => {
    try {
      const response = await apiService.post(`/cloud-providers/${providerId}/sync`);
      return response.provider;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to sync cloud provider');
    }
  }
);

export const validateCloudProviderCredentials = createAsyncThunk<
  ValidationResult,
  string,
  { rejectValue: string }
>(
  'cloudProvider/validateCredentials',
  async (providerId, { rejectWithValue }) => {
    try {
      const response = await apiService.post(`/cloud-providers/${providerId}/validate`);
      return response.validationResult;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to validate credentials');
    }
  }
);

const cloudProviderSlice = createSlice({
  name: 'cloudProvider',
  initialState,
  reducers: {
    setActiveProvider: (state, action: PayloadAction<CloudProvider | null>) => {
      state.activeProvider = action.payload;
    },
    updateProviderStatus: (
      state,
      action: PayloadAction<{ id: string; status: CloudProvider['status'] }>
    ) => {
      const { id, status } = action.payload;
      const provider = state.providers.find(p => p.id === id);
      if (provider) {
        provider.status = status;
      }
      state.connectionStatus[id] = status;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearValidationResult: (state, action: PayloadAction<string>) => {
      delete state.validationResults[action.payload];
    },
    resetCloudProviderState: () => initialState,
  },
  extraReducers: (builder) => {
    // Get Cloud Providers
    builder
      .addCase(getCloudProviders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCloudProviders.fulfilled, (state, action) => {
        state.loading = false;
        state.providers = action.payload;
        state.error = null;
        
        // Update connection status
        action.payload.forEach(provider => {
          state.connectionStatus[provider.id] = provider.status;
        });
        
        // Set active provider if none is set and providers exist
        if (!state.activeProvider && action.payload.length > 0) {
          state.activeProvider = action.payload.find(p => p.status === 'connected') || action.payload[0];
        }
      })
      .addCase(getCloudProviders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to load cloud providers';
      });

    // Add Cloud Provider
    builder
      .addCase(addCloudProvider.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addCloudProvider.fulfilled, (state, action) => {
        state.loading = false;
        state.providers.push(action.payload);
        state.connectionStatus[action.payload.id] = action.payload.status;
        state.error = null;
        
        // Set as active provider if it's the first one or if it's connected
        if (!state.activeProvider || action.payload.status === 'connected') {
          state.activeProvider = action.payload;
        }
      })
      .addCase(addCloudProvider.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to add cloud provider';
      });

    // Update Cloud Provider
    builder
      .addCase(updateCloudProvider.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCloudProvider.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.providers.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.providers[index] = action.payload;
          state.connectionStatus[action.payload.id] = action.payload.status;
        }
        
        // Update active provider if it's the same one
        if (state.activeProvider?.id === action.payload.id) {
          state.activeProvider = action.payload;
        }
        
        state.error = null;
      })
      .addCase(updateCloudProvider.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update cloud provider';
      });

    // Remove Cloud Provider
    builder
      .addCase(removeCloudProvider.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeCloudProvider.fulfilled, (state, action) => {
        state.loading = false;
        state.providers = state.providers.filter(p => p.id !== action.payload);
        delete state.connectionStatus[action.payload];
        delete state.validationResults[action.payload];
        
        // Clear active provider if it was the removed one
        if (state.activeProvider?.id === action.payload) {
          state.activeProvider = state.providers.length > 0 ? state.providers[0] : null;
        }
        
        state.error = null;
      })
      .addCase(removeCloudProvider.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to remove cloud provider';
      });

    // Test Cloud Provider Connection
    builder
      .addCase(testCloudProviderConnection.pending, (state) => {
        state.testingConnection = true;
        state.error = null;
      })
      .addCase(testCloudProviderConnection.fulfilled, (state, action) => {
        state.testingConnection = false;
        // Store validation result temporarily for the test
        state.validationResults['test'] = action.payload;
        state.error = null;
      })
      .addCase(testCloudProviderConnection.rejected, (state, action) => {
        state.testingConnection = false;
        state.error = action.payload || 'Connection test failed';
      });

    // Sync Cloud Provider
    builder
      .addCase(syncCloudProvider.pending, (state, action) => {
        const providerId = action.meta.arg;
        state.connectionStatus[providerId] = 'pending';
        state.error = null;
      })
      .addCase(syncCloudProvider.fulfilled, (state, action) => {
        const index = state.providers.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.providers[index] = action.payload;
          state.connectionStatus[action.payload.id] = action.payload.status;
        }
        
        // Update active provider if it's the same one
        if (state.activeProvider?.id === action.payload.id) {
          state.activeProvider = action.payload;
        }
        
        state.error = null;
      })
      .addCase(syncCloudProvider.rejected, (state, action) => {
        const providerId = action.meta.arg;
        state.connectionStatus[providerId] = 'error';
        state.error = action.payload || 'Failed to sync cloud provider';
      });

    // Validate Cloud Provider Credentials
    builder
      .addCase(validateCloudProviderCredentials.pending, (state, action) => {
        const providerId = action.meta.arg;
        state.connectionStatus[providerId] = 'pending';
        state.error = null;
      })
      .addCase(validateCloudProviderCredentials.fulfilled, (state, action) => {
        const providerId = action.meta.arg;
        state.validationResults[providerId] = action.payload;
        state.connectionStatus[providerId] = action.payload.valid ? 'connected' : 'error';
        
        // Update provider status
        const provider = state.providers.find(p => p.id === providerId);
        if (provider) {
          provider.status = action.payload.valid ? 'connected' : 'error';
          provider.validationResult = action.payload;
        }
        
        state.error = null;
      })
      .addCase(validateCloudProviderCredentials.rejected, (state, action) => {
        const providerId = action.meta.arg;
        state.connectionStatus[providerId] = 'error';
        state.error = action.payload || 'Failed to validate credentials';
      });
  },
});

export const {
  setActiveProvider,
  updateProviderStatus,
  clearError,
  clearValidationResult,
  resetCloudProviderState,
} = cloudProviderSlice.actions;

export default cloudProviderSlice.reducer;