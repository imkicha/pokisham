import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param {string} dirty - Untrusted HTML string
 * @param {object} config - DOMPurify configuration options
 * @returns {string} Sanitized HTML string
 */
export const sanitizeHTML = (dirty, config = {}) => {
  if (!dirty || typeof dirty !== 'string') return '';

  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ...config,
  });
};

/**
 * Sanitize plain text input (removes all HTML tags)
 * @param {string} input - User input string
 * @returns {string} Plain text string
 */
export const sanitizeText = (input) => {
  if (!input || typeof input !== 'string') return '';

  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
};

/**
 * Validate and sanitize URL
 * @param {string} url - URL string to validate
 * @returns {string|null} Sanitized URL or null if invalid
 */
export const sanitizeURL = (url) => {
  if (!url || typeof url !== 'string') return null;

  try {
    const urlObj = new URL(url);
    // Only allow http and https protocols
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      return null;
    }
    return urlObj.href;
  } catch (e) {
    return null;
  }
};

/**
 * Escape special characters for safe display
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
export const escapeHTML = (str) => {
  if (!str || typeof str !== 'string') return '';

  const escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return str.replace(/[&<>"'/]/g, (char) => escapeMap[char]);
};

/**
 * Validate email format
 * @param {string} email - Email address to validate
 * @returns {boolean} True if valid email format
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

/**
 * Validate phone number (Indian format)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid phone format
 */
export const isValidPhone = (phone) => {
  if (!phone || typeof phone !== 'string') return false;

  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/[\s-]/g, ''));
};

/**
 * Sanitize file name
 * @param {string} fileName - File name to sanitize
 * @returns {string} Sanitized file name
 */
export const sanitizeFileName = (fileName) => {
  if (!fileName || typeof fileName !== 'string') return '';

  // Remove path separators and special characters
  return fileName
    .replace(/[\/\\]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .substring(0, 255);
};

/**
 * Rate limiting helper for client-side
 * @param {Function} func - Function to rate limit
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Rate limited function
 */
export const rateLimit = (func, delay = 1000) => {
  let lastCall = 0;

  return function (...args) {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      return func.apply(this, args);
    }
  };
};

/**
 * Debounce function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait = 300) => {
  let timeout;

  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Prevent CSRF attacks by validating origin
 * @param {string} origin - Request origin
 * @param {Array<string>} allowedOrigins - List of allowed origins
 * @returns {boolean} True if origin is allowed
 */
export const isAllowedOrigin = (origin, allowedOrigins = []) => {
  const defaultAllowed = [
    'http://localhost:3000',
    'http://localhost:5000',
    window.location.origin,
  ];

  const allowed = [...defaultAllowed, ...allowedOrigins];
  return allowed.includes(origin);
};
