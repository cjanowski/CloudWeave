import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import uiSlice from './slices/uiSlice';
import userSlice from './slices/userSlice';
import cloudProviderSlice from './slices/cloudProviderSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    ui: uiSlice,
    user: userSlice,
    cloudProviders: cloudProviderSlice,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;