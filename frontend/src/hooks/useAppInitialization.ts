import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../store';
import { getUserProfileAsync } from '../store/slices/authSlice';
import { syncUserData } from '../store/slices/userSlice';
import { AuthService } from '../services/authService';

export const useAppInitialization = () => {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const initializeApp = async () => {
      // Check if user is authenticated
      if (AuthService.isAuthenticated()) {
        try {
          // Fetch user profile including onboarding status
          const result = await dispatch(getUserProfileAsync());
          
          // If successful, sync the user data to the user slice
          if (getUserProfileAsync.fulfilled.match(result) && result.payload) {
            dispatch(syncUserData(result.payload));
          }
        } catch (error) {
          console.error('Failed to initialize app:', error);
        }
      }
    };

    initializeApp();
  }, [dispatch]);
};