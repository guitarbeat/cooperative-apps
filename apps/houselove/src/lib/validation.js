export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

export const sanitizeInput = (text) => {
  if (!text) return '';
  return text.replace(/[<>]/g, '');
};

export const validateContactForm = (data) => {
  const errors = {};

  if (!data.name || data.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters long.';
  }

  if (!data.email || !validateEmail(data.email)) {
    errors.email = 'Please enter a valid email address.';
  }

  if (!data.message || data.message.trim().length < 10) {
    errors.message = 'Message must be at least 10 characters long.';
  }

  return errors;
};
