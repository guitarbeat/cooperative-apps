import { useState, useEffect } from 'react';

/**
 * A hook that delays updating a value until a specified delay has passed
 * since the last time the value changed.
 *
 * @param {any} value The value to debounce
 * @param {number} delay The delay in milliseconds
 * @returns {any} The debounced value
 */
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Update debounced value after delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cancel the timeout if value changes (also on component unmount)
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
