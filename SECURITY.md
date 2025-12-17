# Pokisham E-Commerce Security Implementation

## Overview
This document outlines the comprehensive security measures implemented in the Pokisham e-commerce application to protect against common web vulnerabilities.

## Security Features Implemented

### 1. Authentication & Authorization

#### Secure Cookie-Based Authentication
- **HttpOnly Cookies**: Prevents XSS attacks from accessing tokens
- **Secure Flag**: Ensures cookies are only sent over HTTPS in production
- **SameSite=Strict**: Protects against CSRF attacks
- **7-day expiration**: Automatic session timeout
- **Dual storage**: Cookies (primary) + localStorage (fallback)

#### JWT Token Security
- Strong secret key requirement (minimum 32 characters)
- Token expiration (7 days default)
- Proper token validation on every request

### 2. HTTP Security Headers

#### Content Security Policy (CSP)
```
default-src 'self'
script-src 'self' 'unsafe-inline' 'unsafe-eval'
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com
img-src 'self' data: https: blob:
connect-src 'self' http://localhost:5000 https://api.razorpay.com
```

#### Additional Headers
- **X-Frame-Options: DENY** - Prevents clickjacking
- **X-Content-Type-Options: nosniff** - Prevents MIME type sniffing
- **X-XSS-Protection: 1; mode=block** - Enables browser XSS protection
- **Referrer-Policy: strict-origin-when-cross-origin**
- **Permissions-Policy** - Restricts browser features

### 3. Rate Limiting

Protects against brute force and DoS attacks:

| Endpoint Type | Limit | Window |
|--------------|-------|--------|
| Login/Register | 5 requests | 15 minutes |
| OTP Requests | 3 requests | 10 minutes |
| Password Reset | 3 requests | 1 hour |
| General API | 100 requests | 15 minutes |
| Brute Force Protection | 3 failed attempts | 5 minutes |

### 4. Input Sanitization

#### Frontend (Client)
- **DOMPurify**: Sanitizes HTML content
- **Input validation**: Email, phone, file names
- **URL validation**: Only allows http/https protocols
- **Special character escaping**: Prevents XSS

#### Backend (Server)
- **express-mongo-sanitize**: Prevents NoSQL injection
- **validator**: Input validation library
- **HPP protection**: Prevents HTTP Parameter Pollution

### 5. Data Protection

#### NoSQL Injection Prevention
```javascript
// Automatically sanitizes MongoDB queries
app.use(mongoSanitize({ replaceWith: '_' }));
```

#### Request Size Limits
- Body size: 10MB maximum
- Prevents memory exhaustion attacks
- Automatic validation middleware

### 6. CORS Configuration

Strict CORS policy:
```javascript
{
  origin: ['http://localhost:3000', 'http://136.185.19.6:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 600
}
```

### 7. Logging & Monitoring

#### Suspicious Activity Detection
Automatically logs patterns indicating attacks:
- Script injection attempts
- Event handler injection
- SQL/NoSQL injection patterns
- Logs include: IP, timestamp, request details

### 8. File Upload Security

- File type validation (images only)
- File size limits (10MB)
- File name sanitization
- Path traversal prevention

## Security Best Practices

### For Developers

1. **Never commit `.env` files**
   - Use `.env.example` as template
   - Keep secrets in environment variables

2. **Always sanitize user input**
   ```javascript
   import { sanitizeText, sanitizeHTML } from '../utils/security';

   const cleanInput = sanitizeText(userInput);
   ```

3. **Use rate limiting on sensitive endpoints**
   ```javascript
   router.post('/login', authLimiter, bruteForceProtection, login);
   ```

4. **Validate all inputs**
   ```javascript
   import { isValidEmail, isValidPhone } from '../utils/security';

   if (!isValidEmail(email)) {
     return res.status(400).json({ error: 'Invalid email' });
   }
   ```

### For Production Deployment

1. **Environment Variables**
   ```bash
   NODE_ENV=production
   JWT_SECRET=<strong-random-32+-character-string>
   COOKIE_SECURE=true
   ENABLE_HSTS=true
   ```

2. **HTTPS Required**
   - Enable SSL/TLS certificates
   - Force HTTPS redirects
   - Enable HSTS header

3. **Database Security**
   - Use MongoDB authentication
   - Enable encryption at rest
   - Regular backups
   - Connection string security

4. **Update Dependencies Regularly**
   ```bash
   npm audit
   npm audit fix
   npm update
   ```

## Security Checklist

### Before Deploying to Production

- [ ] Change JWT_SECRET to strong random string (32+ characters)
- [ ] Change SESSION_SECRET to strong random string
- [ ] Set NODE_ENV=production
- [ ] Enable HTTPS/SSL certificates
- [ ] Set COOKIE_SECURE=true
- [ ] Enable HSTS (ENABLE_HSTS=true)
- [ ] Update ALLOWED_ORIGINS to production domains
- [ ] Review and tighten CSP directives
- [ ] Enable MongoDB authentication
- [ ] Set up firewall rules
- [ ] Configure proper CORS origins
- [ ] Set up monitoring and alerts
- [ ] Regular security audits (npm audit)
- [ ] Set up automated backups
- [ ] Review all API rate limits
- [ ] Test authentication flows
- [ ] Verify file upload restrictions
- [ ] Check error handling (no sensitive data in errors)

## Common Vulnerabilities Prevented

### ✅ OWASP Top 10 Coverage

1. **A01: Broken Access Control**
   - JWT-based authentication
   - Role-based access control (RBAC)
   - Protected routes with middleware

2. **A02: Cryptographic Failures**
   - Secure cookie flags (HttpOnly, Secure)
   - HTTPS enforcement in production
   - Strong JWT secrets

3. **A03: Injection**
   - MongoDB sanitization
   - Input validation
   - Parameterized queries

4. **A04: Insecure Design**
   - Rate limiting on sensitive endpoints
   - Brute force protection
   - Account lockout mechanisms

5. **A05: Security Misconfiguration**
   - Helmet.js security headers
   - Proper CORS configuration
   - Error handling without leaking info

6. **A06: Vulnerable Components**
   - Regular npm audits
   - Dependency updates
   - Version tracking

7. **A07: Authentication Failures**
   - Secure session management
   - Multi-factor authentication ready
   - Password strength requirements

8. **A08: Software and Data Integrity**
   - Input sanitization
   - File upload validation
   - CSP implementation

9. **A09: Logging Failures**
   - Suspicious activity logging
   - Error logging
   - Security event monitoring

10. **A10: SSRF**
    - URL validation
    - Allowed protocols whitelist
    - Origin validation

## Incident Response

### If Security Breach Detected

1. **Immediate Actions**
   - Rotate JWT_SECRET and SESSION_SECRET
   - Force logout all users
   - Review access logs
   - Identify affected users

2. **Investigation**
   - Check suspicious activity logs
   - Review authentication logs
   - Analyze attack patterns

3. **Remediation**
   - Patch vulnerabilities
   - Update dependencies
   - Strengthen affected areas

4. **Communication**
   - Notify affected users
   - Document incident
   - Update security measures

## Security Utilities Available

### Frontend (`client/src/utils/security.js`)
- `sanitizeHTML(dirty)` - Sanitize HTML content
- `sanitizeText(input)` - Remove all HTML tags
- `sanitizeURL(url)` - Validate and clean URLs
- `escapeHTML(str)` - Escape special characters
- `isValidEmail(email)` - Email validation
- `isValidPhone(phone)` - Phone validation (Indian format)
- `sanitizeFileName(fileName)` - Clean file names
- `rateLimit(func, delay)` - Client-side rate limiting
- `debounce(func, wait)` - Debounce function calls

### Backend (`server/middleware/security.js`)
- `setSecurityHeaders()` - Helmet security headers
- `authLimiter` - Rate limit auth endpoints
- `otpLimiter` - Rate limit OTP requests
- `apiLimiter` - General API rate limiting
- `passwordResetLimiter` - Password reset rate limiting
- `sanitizeData()` - NoSQL injection prevention
- `preventHPP()` - HTTP Parameter Pollution prevention
- `logSuspiciousActivity` - Attack pattern detection
- `bruteForceProtection` - Brute force attack prevention

## Testing Security

### Manual Testing
```bash
# Test rate limiting
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"wrong"}' \
  --repeat 6

# Test XSS protection
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"<script>alert(1)</script>","email":"test@test.com"}'
```

### Automated Testing
```bash
# Run security audit
npm audit

# Fix vulnerabilities
npm audit fix

# Check for outdated packages
npm outdated
```

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [Express Rate Limit](https://github.com/express-rate-limit/express-rate-limit)
- [DOMPurify](https://github.com/cure53/DOMPurify)

## Support

For security concerns or to report vulnerabilities, please contact:
- Email: security@pokisham.com
- Create a private issue in the repository

**Do not disclose security vulnerabilities publicly.**

---

Last Updated: 2025-12-17
Version: 1.0.0
