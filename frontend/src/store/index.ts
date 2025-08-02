import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import authSlice from './slices/authSlice';
import uiSlice from './slices/uiSlice';
import userSlice from './slices/userSlice';
import cloudProviderSlice from './slices/cloudProviderSlice';
import demoSlice from './slices/demoSlice';

// Persist config for user slice
const userPersistConfig = {
  key: 'user',
  storage,
  whitelist: ['onboardingCompleted', 'demoMode', 'demoScenario', 'preferences']
};

const persistedUserReducer = persistReducer(userPersistConfig, userSlice);

export const store = configureStore({
  reducer: {
    auth: authSlice,
    ui: uiSlice,
    user: persistedUserReducer,
    cloudProviders: cloudProviderSlice,
    demo: demoSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);

// Make store available globally for API service
(window as any).__REDUX_STORE__ = store;

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;