import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ErrorBoundary from './ErrorBoundary';
import * as utils from '@/lib/utils';

// Mock the utils module
vi.mock('@/lib/utils', async () => {
  const actual = await vi.importActual('@/lib/utils');
  return {
    ...actual,
    isDev: vi.fn(),
  };
});

// Mock clipboard
const mockWriteText = vi.fn();
Object.assign(navigator, {
  clipboard: {
    writeText: mockWriteText,
  },
});

const ProblematicComponent = () => {
  throw new Error('Test error');
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    mockWriteText.mockClear();
    vi.mocked(utils.isDev).mockReset();
  });

  it('includes stack trace when copying in dev mode', async () => {
    vi.mocked(utils.isDev).mockReturnValue(true);

    // Prevent console.error from cluttering output
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ProblematicComponent />
      </ErrorBoundary>
    );

    // Find the copy button (it has "Copy" text initially)
    const copyButton = screen.getByRole('button', { name: /Copy/i });
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalled();
    });

    const copiedText = mockWriteText.mock.calls[0][0];
    const copiedData = JSON.parse(copiedText);

    expect(copiedData.stack).toBeDefined();
    // componentStack might be undefined depending on how React captures it in test environment,
    // but stack should be there from the Error object.

    consoleSpy.mockRestore();
  });

  it('excludes stack trace when copying in production mode', async () => {
    vi.mocked(utils.isDev).mockReturnValue(false);

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ProblematicComponent />
      </ErrorBoundary>
    );

    const copyButton = screen.getByRole('button', { name: /Copy/i });
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalled();
    });

    const copiedText = mockWriteText.mock.calls[0][0];
    const copiedData = JSON.parse(copiedText);

    expect(copiedData.stack).toBeUndefined();
    expect(copiedData.componentStack).toBeUndefined();
    expect(copiedData.message).toBe('Test error');

    consoleSpy.mockRestore();
  });
});
