import React from 'react';
import { useTheme } from './ThemeContext';

export const ThemeSwitch: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`px-3 py-2 rounded transition-colors border focus:outline-none ${theme === 'dark' ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'} hover:shadow`}
      aria-label="Toggle dark mode"
    >
      {theme === 'dark' ? '🌙 Modo Oscuro' : '☀️ Modo Claro'}
    </button>
  );
};
