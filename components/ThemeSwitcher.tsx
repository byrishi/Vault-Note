import React from 'react';
import { Theme } from '../types';

interface ThemeSwitcherProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ theme, setTheme }) => (
  <div className="theme-picker" role="group" aria-label="Color theme">
    {[Theme.Light, Theme.Dark, Theme.Hacker].map((option) => (
      <button key={option} className={theme === option ? 'theme-option is-selected' : 'theme-option'} onClick={() => setTheme(option)} aria-pressed={theme === option} aria-label={'Switch to ' + option + ' theme'} title={option.charAt(0).toUpperCase() + option.slice(1)}>
        <span className={'theme-swatch theme-swatch-' + option} aria-hidden="true" />
      </button>
    ))}
  </div>
);

export default ThemeSwitcher;
