import { useEffect, useState, useCallback } from 'react';

interface KeyboardShortcutsConfig {
  onFocusAddInput?: () => void;
  onFocusSearch?: () => void;
  onNextSpeaker?: () => void;
  onUndo?: () => void;
  onToggleShortcuts?: () => void;
}

export const useKeyboardShortcuts = (config: KeyboardShortcutsConfig) => {
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);

  const toggleShortcuts = useCallback(() => {
    setShowKeyboardShortcuts(prev => !prev);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case 'n':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            config.onFocusAddInput?.();
          }
          break;
        case 'f':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            config.onFocusSearch?.();
          }
          break;
        case 'Enter':
          config.onNextSpeaker?.();
          break;
        case 'z':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            config.onUndo?.();
          }
          break;
        case '?':
          toggleShortcuts();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [config, toggleShortcuts]);

  return {
    showKeyboardShortcuts,
    toggleShortcuts
  };
};