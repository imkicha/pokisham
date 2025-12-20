const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const hpp = require('hpp');

/**
 * Set security HTTP headers using Helmet
 */
const setSecurityHeaders = () => {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'", "https://api.razorpay.com"],
        frameSrc: ["'self'", "https://api.razorpay.com"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  });
};

/**
 * Rate limiting for authentication routes
 */
const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many login attempts, please try again after 5 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

/**
 * Rate limiting for OTP requests
 */
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 3, // Limit each IP to 3 OTP requests per windowMs
  message: {
    success: false,
    message: 'Too many OTP requests, please try again after 10 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * General API rate limiting
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Higher limit in development
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for GET requests to public endpoints in development
    if (process.env.NODE_ENV !== 'production') {
      const publicGetEndpoints = ['/api/categories', '/api/products'];
      return req.method === 'GET' && publicGetEndpoints.some(endpoint => req.path.startsWith(endpoint));
    }
    return false;
  }
});

/**
 * Strict rate limiting for password reset
 */
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  message: {
    success: false,
    message: 'Too many password reset attempts, please try again after 1 hour',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Data sanitization against NoSQL injection
 */


/**
 * Prevent HTTP Parameter Pollution
 */
const preventHPP = () => {
  return hpp({
    whitelist: [
      'price',
      'rating',
      'category',
      'sort',
      'page',
      'limit',
      'quantity',
      'includeTenant',
      'isFeatured',
      'isTrending',
      'search',
      'status',
    ],
  });
};

/**
 * Custom middleware to add additional security headers
 */
const additionalSecurityHeaders = (req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=(self)'
  );

  // HSTS (HTTP Strict Transport Security) - Only in production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  next();
};

/**
 * Validate request body size
 */
const validateRequestSize = (req, res, next) => {
  const contentLength = req.headers['content-length'];
  const contentType = req.headers['content-type'] || '';

  // Allow larger payloads for multipart/form-data (file uploads) - 50MB limit
  // For regular JSON requests, use 10MB limit
  const isMultipart = contentType.includes('multipart/form-data');
  const maxSize = isMultipart ? 50 * 1024 * 1024 : 10 * 1024 * 1024;

  if (contentLength && parseInt(contentLength) > maxSize) {
    return res.status(413).json({
      success: false,
      message: 'Request entity too large',
    });
  }

  next();
};

/**
 * Log suspicious activities
 */
const logSuspiciousActivity = (req, res, next) => {
  const suspiciousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /onerror=/gi,
    /onclick=/gi,
    /<iframe/gi,
    /eval\(/gi,
    /expression\(/gi,
  ];

  const checkValue = (value) => {
    if (typeof value === 'string') {
      for (const pattern of suspiciousPatterns) {
        if (pattern.test(value)) {
          console.warn('⚠️  Suspicious activity detected:', {
            ip: req.ip,
            method: req.method,
            url: req.originalUrl,
            value: value.substring(0, 100),
            timestamp: new Date().toISOString(),
          });
          return true;
        }
      }
    } else if (typeof value === 'object' && value !== null) {
      for (const key in value) {
        if (checkValue(value[key])) return true;
      }
    }
    return false;
  };

  checkValue(req.body);
  checkValue(req.query);
  checkValue(req.params);

  next();
};

/**
 * Prevent brute force attacks on sensitive endpoints
 */
const bruteForceProtection = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // 3 attempts
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: 'Too many failed attempts, please try again later',
  },
});

module.exports = {
  setSecurityHeaders,
  authLimiter,
  otpLimiter,
  apiLimiter,
  passwordResetLimiter,
  preventHPP,
  additionalSecurityHeaders,
  validateRequestSize,
  logSuspiciousActivity,
  bruteForceProtection,
};
