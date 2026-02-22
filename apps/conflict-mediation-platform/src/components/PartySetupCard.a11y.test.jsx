import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PartySetupCard from './PartySetupCard';

// Mock Lucide icons to avoid rendering issues in test environment if any
vi.mock('lucide-react', () => ({
  Palette: () => <div data-testid="palette-icon" />,
  Dices: () => <div data-testid="dices-icon" />,
  Check: () => <div data-testid="check-icon" />,
  X: () => <div data-testid="x-icon" />,
  AlertCircle: () => <div data-testid="alert-icon" />,
  HelpCircle: () => <div data-testid="help-icon" />,
  Eye: () => <div data-testid="eye-icon" />,
  EyeOff: () => <div data-testid="eye-off-icon" />,
  Lightbulb: () => <div data-testid="lightbulb-icon" />,
}));

// Mock EnhancedFormField since it might have complex dependencies
vi.mock('./EnhancedFormField', () => ({
  default: (props) => (
    <div data-testid="enhanced-form-field">
      <label htmlFor={props.id}>{props.label}</label>
      <input id={props.id} placeholder={props.placeholder} value={props.value} onChange={(e) => props.onChange(e.target.value)} />
    </div>
  ),
}));

// Mock FormField similarly
vi.mock('./FormField', () => ({
  default: (props) => (
    <div data-testid="form-field">
      <label htmlFor={props.id}>{props.label}</label>
      <input id={props.id} type={props.type} value={props.value} onChange={(e) => props.onChange(e.target.value)} />
    </div>
  ),
}));

// Mock AvatarEmojiPicker similarly
vi.mock('./AvatarEmojiPicker', () => ({
  default: () => <div data-testid="avatar-picker" />,
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
    nameValue: 'John',
    error: '',
    colorFieldProps: {},
    nameFieldProps: {},
    // Simple mock implementation for utility functions
    toRgba: (hex, alpha) => `rgba(0,0,0,${alpha})`,
    normalizePartyColor: (color) => color,
    accentColor: '#6B8E47',
    side: 'left',
  };

  it('renders color swatches with accessible human-readable labels', () => {
    render(<PartySetupCard {...defaultProps} />);

    // We expect to find buttons with "Select Olive Green" or similar
    // The current implementation uses hex codes, so this should fail initially
    // if the label is "Use #6B8E47 for Party A"

    // Check for Olive Green (#6B8E47) which is SELECTED in defaultProps
    const oliveGreenButton = screen.getByLabelText(/Selected Olive Green for Party A/i);
    expect(oliveGreenButton).toBeInTheDocument();
    expect(oliveGreenButton).toHaveAttribute('aria-pressed', 'true'); // Or implicitly via label

    // Check for Teal (#0D9488) which is UNSELECTED
    const tealButton = screen.getByLabelText(/Select Teal for Party A/i);
    expect(tealButton).toBeInTheDocument();

    // Ensure "Select" vs "Selected" distinction
    expect(tealButton).not.toHaveAttribute('aria-label', expect.stringMatching(/Selected/));
  });

  it('verifies that hex codes are NOT used in labels', () => {
    render(<PartySetupCard {...defaultProps} />);

    // We want to ensure NO button has a label containing the hex code
    const hexButton = screen.queryByLabelText(/#6B8E47/i);
    expect(hexButton).not.toBeInTheDocument();
  });
});
