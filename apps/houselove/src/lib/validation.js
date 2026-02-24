export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.replace(/[&<>"'/]/g, (match) => {
    const escape = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;',
    };
    return escape[match];
  });
};
