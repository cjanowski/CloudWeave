import { configureStore } from '@reduxjs/toolkit'
import authSlice from './slices/authSlice'
import uiSlice from './slices/uiSlice'
import organizationSlice from './slices/organizationSlice'

export const store = configureStore({
  reducer: {
    auth: authSlice,
    ui: uiSlice,
    organization: organizationSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch