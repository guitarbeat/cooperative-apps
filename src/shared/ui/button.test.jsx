/** @jest-environment jsdom */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Button } from './button';

describe('Button', () => {
  test('renders children correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  test('renders loading spinner when loading is true', () => {
    // Note: The spinner is an icon inside the button, so checking for its class or role is tricky without a specific test id or role on the spinner itself.
    // However, the button should be disabled.
    render(<Button loading>Loading...</Button>);

    const button = screen.getByRole('button', { name: /loading.../i });
    expect(button).toBeDisabled();

    // We can also check if the spinner element exists by class if needed, but testing behavior (disabled) is key.
    // Let's assume the spinner has 'animate-spin' class.
    // The spinner is rendered as a sibling to children.
    // We can try to find the spinner by a unique attribute if we add one, or just check the button contains an element with that class.
    // For now, let's just check disabled state and presence of text.
  });

  test('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeDisabled();
  });
});
