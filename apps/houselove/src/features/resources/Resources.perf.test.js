import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Resources from './ResourcesPage';

// 1. Setup the spy
const mockRenderSpy = jest.fn(({ resources }) => (
  <div data-testid="mock-list">List items: {resources.length}</div>
));

// 2. Mock the child component
// We simulate the behavior of ResourceList being React.memo
// This verifies that Resources component passes stable props (referentially equal)
// such that a memoized child would NOT re-render.
jest.mock('./ResourceList', () => {
  const React = require('react');
  return React.memo((props) => mockRenderSpy(props));
});

// Mock UI components to avoid noise
jest.mock('../../shared/ui/input', () => {
  const React = require('react');
  return {
    Input: React.forwardRef((props, ref) => <input ref={ref} {...props} />),
  };
});

describe('Resources Performance', () => {
  beforeEach(() => {
    mockRenderSpy.mockClear();
  });

  it('does not re-render the list when search term changes immediately (before debounce)', async () => {
    render(<Resources />);

    // Initial render
    expect(mockRenderSpy).toHaveBeenCalledTimes(1);

    const input = screen.getByLabelText('Search resources');

    // Type 'G'. This updates local state `searchTerm` in Resources.
    // However, `debouncedSearchTerm` (used for filtering) has not changed yet.
    userEvent.type(input, 'G');

    // Verify that the list component did NOT re-render.
    // If Resources was not memoizing the filtered list correctly,
    // or if it was passing a new array reference every time,
    // React.memo would have allowed a re-render.
    expect(mockRenderSpy).toHaveBeenCalledTimes(1);

    // Now wait for the debounce to kick in (300ms)
    await waitFor(() => {
      // Once debounce triggers, `debouncedSearchTerm` updates.
      // `filteredResources` updates.
      // The list should re-render now.
      expect(mockRenderSpy).toHaveBeenCalledTimes(2);
    });
  });
});
