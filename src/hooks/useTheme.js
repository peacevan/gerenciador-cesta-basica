import { useState, useEffect } from 'react';

const THEME_STORAGE_KEY = 'listVoiceTheme';

export default function useTheme() {
  const getInitialTheme = () => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme) return savedTheme;
    return 'dark';
  };

  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
  };

  return { theme, toggleTheme, isDark: theme === 'dark' };
}
