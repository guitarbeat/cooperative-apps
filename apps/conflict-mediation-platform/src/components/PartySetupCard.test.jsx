import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PartySetupCard from './PartySetupCard';

// Mock dependencies
vi.mock('./EnhancedFormField', () => ({
  default: ({ label, ...props }) => (
    <div data-testid="enhanced-form-field">
      <label>{label}</label>
      <input {...props} />
    </div>
  ),
}));

vi.mock('./AvatarEmojiPicker', () => ({
  default: () => <div data-testid="avatar-emoji-picker">Avatar Picker</div>,
}));

vi.mock('./FormField', () => ({
  default: ({ label, ...props }) => (
    <div data-testid="form-field">
      <label>{label}</label>
      <input {...props} />
    </div>
  ),
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
    section: ({ children, ...props }) => <section {...props}>{children}</section>,
  },
}));

describe('PartySetupCard Accessibility', () => {
  const defaultProps = {
    partyKey: 'A',
    displayName: 'Party A',
    fallbackName: 'Party A',
    color: '#6B8E47',
    normalizedColor: '#6B8E47',
    onColorChange: vi.fn(),
    onNameChange: vi.fn(),
    selectedEmoji: '🦁',
    onEmojiChange: vi.fn(),
    nameValue: 'Alice',
    error: '',
    colorFieldProps: {},
    nameFieldProps: {},
    toRgba: (hex) => `rgba(${hex}, 1)`,
    normalizePartyColor: (hex) => hex,
    accentColor: '#6B8E47',
    side: 'left',
  };

  it('renders color swatches with accessible names', () => {
    render(<PartySetupCard {...defaultProps} />);

    // Check for a specific color button with a descriptive name
    // The current implementation uses hex codes in aria-label, so this should fail
    // if we look for "Use Olive Green for Party A"

    // We expect failure here because currently aria-label is `Use #6B8E47 for Party A`
    // We want it to be `Use Olive Green for Party A`
    const oliveButton = screen.queryByRole('button', { name: /Use Olive Green for Party A/i });
    expect(oliveButton).not.toBeNull();
  });

  it('renders all recommended color swatches', () => {
    render(<PartySetupCard {...defaultProps} />);
    // Just to ensure buttons are rendered at all
    const buttons = screen.getAllByRole('button');
    // There are 7 recommended colors + 1 random button + emoji buttons (mocked out)
    // Actually random button is there.
    expect(buttons.length).toBeGreaterThan(5);
  });
});
