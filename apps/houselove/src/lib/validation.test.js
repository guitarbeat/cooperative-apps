import { sanitizeInput } from './validation';

describe('sanitizeInput', () => {
  test('returns original value if input is not a string', () => {
    expect(sanitizeInput(null)).toBe(null);
    expect(sanitizeInput(undefined)).toBe(undefined);
    expect(sanitizeInput(123)).toBe(123);
  });

  test('returns same string if no dangerous characters are present', () => {
    const input = 'Hello World';
    expect(sanitizeInput(input)).toBe(input);
  });

  test('escapes < and >', () => {
    const input = '<script>alert(1)</script>';
    const expected = '&lt;script&gt;alert(1)&lt;/script&gt;';
    expect(sanitizeInput(input)).toBe(expected);
  });

  test('escapes &', () => {
    const input = 'Tom & Jerry';
    const expected = 'Tom &amp; Jerry';
    expect(sanitizeInput(input)).toBe(expected);
  });

  test('escapes " and \'', () => {
    const input = 'He said "Hello"';
    const expected = 'He said &quot;Hello&quot;';
    expect(sanitizeInput(input)).toBe(expected);

    const input2 = "It's me";
    const expected2 = "It&#39;s me";
    expect(sanitizeInput(input2)).toBe(expected2);
  });

  test('escapes multiple dangerous characters', () => {
    const input = '<div class="alert">Warning & Error</div>';
    const expected = '&lt;div class=&quot;alert&quot;&gt;Warning &amp; Error&lt;/div&gt;';
    expect(sanitizeInput(input)).toBe(expected);
  });
});
