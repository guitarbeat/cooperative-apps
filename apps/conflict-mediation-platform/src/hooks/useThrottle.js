import { useState, useEffect, useRef } from 'react';

/**
 * A hook that limits the rate at which a value updates.
 * Useful for high-frequency updates like scroll or drag events where
 * immediate UI updates aren't critical.
 *
 * @param {any} value The value to throttle
 * @param {number} limit The limit in milliseconds (default: 100ms)
 * @returns {any} The throttled value
 */
function useThrottle(value, limit = 100) {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastRan = useRef(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
}

export default useThrottle;
