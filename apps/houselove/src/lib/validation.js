
/**
 * Sanitizes input by encoding HTML entities to prevent XSS.
 * @param {string} str - The input string to sanitize.
 * @returns {string} - The sanitized string.
 */
export const sanitizeInput = (str) => {
  if (typeof str !== 'string') return str;
  return str.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&#39;';
      default: return char;
    }
  });
};
