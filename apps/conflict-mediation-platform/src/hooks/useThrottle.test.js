import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import useThrottle from './useThrottle';

describe('useThrottle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return the initial value immediately', () => {
    const { result } = renderHook(() => useThrottle('initial', 100));
    expect(result.current).toBe('initial');
  });

  it('should throttle updates', () => {
    const { result, rerender } = renderHook(({ val }) => useThrottle(val, 100), {
      initialProps: { val: 'initial' },
    });

    expect(result.current).toBe('initial');

    // Update value before timeout
    rerender({ val: 'updated' });

    // Should still be initial because of throttle
    expect(result.current).toBe('initial');

    // Advance time by 50ms (halfway)
    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(result.current).toBe('initial');

    // Advance time by another 50ms (total 100ms)
    act(() => {
      vi.advanceTimersByTime(50);
    });

    // Should now be updated
    expect(result.current).toBe('updated');
  });

  it('should handle rapid updates by only taking the latest', () => {
    const { result, rerender } = renderHook(({ val }) => useThrottle(val, 100), {
      initialProps: { val: 'initial' },
    });

    rerender({ val: 'update1' });
    rerender({ val: 'update2' });
    rerender({ val: 'update3' });

    expect(result.current).toBe('initial');

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current).toBe('update3');
  });
});
