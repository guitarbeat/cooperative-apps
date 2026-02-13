import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import useDebounce from './useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));
    expect(result.current).toBe('initial');
  });

  it('should debounce the value update', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    // Update the value
    rerender({ value: 'updated', delay: 500 });

    // Should still be the initial value
    expect(result.current).toBe('initial');

    // Advance time by 200ms (less than delay)
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current).toBe('initial');

    // Advance time by 300ms (total 500ms)
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe('updated');
  });

  it('should reset the timer if value changes within the delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    // Update to 'first update'
    rerender({ value: 'first update', delay: 500 });

    // Advance 300ms
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe('initial');

    // Update to 'second update' before timer finishes
    rerender({ value: 'second update', delay: 500 });

    // Advance another 300ms (total 600ms from start, but only 300ms since last update)
    act(() => {
      vi.advanceTimersByTime(300);
    });
    // Should still be 'initial' because the timer was reset
    expect(result.current).toBe('initial');

    // Advance 200ms more (total 500ms since last update)
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current).toBe('second update');
  });
});
