import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import uiSlice from './slices/uiSlice';
import userSlice from './slices/userSlice';
import cloudProviderSlice from './slices/cloudProviderSlice';
import demoSlice from './slices/demoSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    ui: uiSlice,
    user: userSlice,
    cloudProviders: cloudProviderSlice,
    demo: demoSlice,
  },
});

// Make store available globally for API service
(window as any).__REDUX_STORE__ = store;

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;