import { describe, it, expect } from 'vitest';
import { generateSecureRandomString } from '../security';

describe('generateSecureRandomString', () => {
  it('should generate a string of the correct length', () => {
    const length = 10;
    const result = generateSecureRandomString(length);
    expect(result).toHaveLength(length);
  });

  it('should only contain characters from the default charset', () => {
    const length = 100;
    const result = generateSecureRandomString(length);
    const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

    for (const char of result) {
      expect(charset).toContain(char);
    }
  });

  it('should generate unique strings (statistical check)', () => {
    // Generate 1000 strings and ensure uniqueness.
    // Given the length (e.g. 6) and charset (32), collision probability is very low.
    const count = 1000;
    const set = new Set<string>();
    for (let i = 0; i < count; i++) {
      set.add(generateSecureRandomString(6));
    }

    // Check if we got at least 99% unique strings (should be 100%)
    expect(set.size).toBeGreaterThan(count * 0.99);
  });

  it('should support custom charset', () => {
    const length = 10;
    const customCharset = 'ABC';
    const result = generateSecureRandomString(length, customCharset);

    expect(result).toHaveLength(length);
    for (const char of result) {
      expect(customCharset).toContain(char);
    }
  });

  it('should handle length 0', () => {
    const result = generateSecureRandomString(0);
    expect(result).toBe('');
  });
});
