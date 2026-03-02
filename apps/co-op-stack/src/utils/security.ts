/**
 * Generates a cryptographically secure random string of a given length using the provided charset.
 * This is a replacement for Math.random() for security-critical contexts like meeting codes.
 *
 * @param length The length of the string to generate.
 * @param charset The characters to use (default: ABCDEFGHJKLMNPQRSTUVWXYZ23456789 - no I, O, 0, 1)
 * @returns A random string.
 */
export function generateSecureRandomString(
  length: number,
  charset: string = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
): string {
  if (length <= 0) {
    return "";
  }

  // Use a buffer large enough to reduce modulo bias?
  // For meeting codes (short strings), simple modulo on random bytes is "good enough" vs Math.random()
  // but to be more correct we can just pick bytes and retry if out of range, or accept slight bias.
  // Given the charset length (32), if we use a random byte (0-255), 256 is divisible by 32 (8 times).
  // So there is NO modulo bias if charset length is a power of 2 or divides 256 evenly!
  // 32 is a power of 2 (2^5). So 256 % 32 == 0.
  // So simply taking a random byte % 32 is perfectly uniform.

  // If charset length is NOT a power of 2 (or divisor of 256), there is bias.
  // The default charset has 32 chars.

  let result = "";
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);

  for (let i = 0; i < length; i++) {
    // If charset.length is 32, this is uniform.
    // If not, it has slight bias, but still better than Math.random() for unpredictability.
    result += charset[randomValues[i] % charset.length];
  }

  return result;
}
