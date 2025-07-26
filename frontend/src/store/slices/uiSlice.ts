import { createSlice } from '@reduxjs/toolkit';

interface UiState {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
}

const initialState: UiState = {
  theme: (typeof window !== 'undefined' ? localStorage.getItem('theme') as 'light' | 'dark' : null) || 'light',
  sidebarOpen: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', state.theme);
      }
    },
    setTheme: (state, action) => {
      state.theme = action.payload;
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', action.payload);
      }
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
  },
});

export const { toggleTheme, setTheme, setSidebarOpen, toggleSidebar } = uiSlice.actions;
export default uiSlice.reducer;