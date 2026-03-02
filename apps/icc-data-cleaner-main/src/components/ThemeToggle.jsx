import React from 'react';

function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={onToggle}
      className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-blue-400 hover:text-blue-600 dark:border-slate-600 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:border-blue-400 dark:hover:text-blue-300"
      aria-pressed={isDark}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      <span aria-hidden className="text-lg">
        {isDark ? '🌙' : '☀️'}
      </span>
      <span className="hidden sm:inline">
        {isDark ? 'Dark mode' : 'Light mode'}
      </span>
    </button>
  );
}

export default ThemeToggle;
