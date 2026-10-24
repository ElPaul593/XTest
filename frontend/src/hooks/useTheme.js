import { useCallback, useEffect, useState } from 'react';

const THEME_STORAGE_KEY = 'culturaltrip-theme';

function readStoredTheme() {
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY);
    return value === 'dark' || value === 'light' ? value : null;
  } catch {
    return null;
  }
}

function getInitialTheme() {
  const storedTheme = readStoredTheme();
  if (storedTheme) return storedTheme;

  return window.matchMedia?.('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark';
}

export default function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // El tema se mantiene aplicado aunque el navegador no permita persistirlo.
    }
  }, [theme]);

  useEffect(() => {
    if (readStoredTheme()) return undefined;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    const handleChange = (event) => setTheme(event.matches ? 'light' : 'dark');
    mediaQuery.addEventListener?.('change', handleChange);

    return () => mediaQuery.removeEventListener?.('change', handleChange);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, toggleTheme };
}
