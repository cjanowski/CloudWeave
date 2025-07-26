import { useSelector } from 'react-redux';
import { getIconTheme } from '../styles/iconTheme';
import type { IconTheme } from '../types/icon';

export const useIconTheme = (): IconTheme => {
  const { theme } = useSelector((state: any) => state.ui);
  const isDark = theme === 'dark';
  return getIconTheme(isDark);
};