'use client';

import { useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { useCookies } from './useCookies';

export type Theme = 'light' | 'dark';

export function useTheme() {
  const { setCookie, getCookie } = useCookies();
  const [theme, setThemeState] = useLocalStorage<Theme>('theme', 'light');

  // Sync theme with document class and cookie
  useEffect(() => {
    if (typeof document === 'undefined') return;

    // Apply theme to document
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);

    // Sync with cookie for server-side rendering
    setCookie('theme', theme, {
      expires: 365, // 1 year
      path: '/',
      sameSite: 'lax',
    });
  }, [theme, setCookie]);

  // Initialize theme from cookie on mount (for SSR compatibility)
  useEffect(() => {
    const cookieTheme = getCookie('theme') as Theme;
    if (cookieTheme && cookieTheme !== theme) {
      setThemeState(cookieTheme);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount to avoid infinite loop

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const isDark = theme === 'dark';

  return {
    theme,
    setTheme,
    toggleTheme,
    isDark,
  };
}
