import React from 'react';
import { Theme } from '../types';
import SunIcon from './icons/SunIcon';
import MoonIcon from './icons/MoonIcon';
import TerminalIcon from './icons/TerminalIcon';

interface ThemeSwitcherProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ theme, setTheme }) => {
  const options = [
    { name: Theme.Light, icon: <SunIcon className="w-5 h-5" />, label: 'Light Mode' },
    { name: Theme.Dark, icon: <MoonIcon className="w-5 h-5" />, label: 'Dark Mode' },
    { name: Theme.Hacker, icon: <TerminalIcon className="w-5 h-5" />, label: 'Hacker Mode' },
  ];

  return (
    <div className="p-1 flex items-center gap-1 rounded-full bg-[var(--card-bg)] ring-1 ring-[var(--ring-color)] shadow-md">
      {options.map((option) => (
        <button
          key={option.name}
          onClick={() => setTheme(option.name)}
          className={`p-1.5 rounded-full transition-colors duration-300 ${
            theme === option.name
              ? 'bg-[var(--accent-color)] text-[var(--accent-contrast-text)]'
              : 'text-[var(--text-muted-color)] hover:text-[var(--text-color)]'
          }`}
          aria-label={`Switch to ${option.label}`}
          title={option.label}
        >
          {option.icon}
        </button>
      ))}
    </div>
  );
};

export default ThemeSwitcher;
