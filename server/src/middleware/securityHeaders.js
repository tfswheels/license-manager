// server/src/middleware/securityHeaders.js

/**
 * Security Headers Middleware
 * Implements comprehensive security headers required for Shopify App Store compliance
 * and general web security best practices
 */
export function securityHeaders(req, res, next) {
  // Content Security Policy (CSP)
  // Restricts sources for scripts, styles, and other resources
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.shopify.com",
    "style-src 'self' 'unsafe-inline' https://cdn.shopify.com",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data: https://cdn.shopify.com",
    "connect-src 'self' https://*.myshopify.com https://cdn.shopify.com https://api.sendgrid.com",
    "frame-ancestors 'self' https://*.myshopify.com https://admin.shopify.com",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');

  res.setHeader('Content-Security-Policy', cspDirectives);

  // X-Frame-Options
  // ALLOW-FROM is deprecated but keeping for backward compatibility
  // Modern browsers use CSP frame-ancestors instead
  res.setHeader('X-Frame-Options', 'ALLOW-FROM https://admin.shopify.com');

  // X-Content-Type-Options
  // Prevents MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // X-XSS-Protection
  // Enable XSS filter in browsers (legacy, CSP is preferred)
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer-Policy
  // Control how much referrer information is sent
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions-Policy (formerly Feature-Policy)
  // Restrict browser features
  const permissionsPolicy = [
    'geolocation=()',
    'microphone=()',
    'camera=()',
    'payment=(self)',
    'usb=()',
    'magnetometer=()',
    'gyroscope=()',
    'accelerometer=()'
  ].join(', ');

  res.setHeader('Permissions-Policy', permissionsPolicy);

  // Strict-Transport-Security (HSTS)
  // Force HTTPS connections (only set in production with HTTPS)
  if (process.env.NODE_ENV === 'production' && req.secure) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // X-DNS-Prefetch-Control
  // Control DNS prefetching
  res.setHeader('X-DNS-Prefetch-Control', 'off');

  // X-Download-Options
  // Prevent IE from executing downloads in site context
  res.setHeader('X-Download-Options', 'noopen');

  // X-Permitted-Cross-Domain-Policies
  // Restrict Adobe Flash and PDF cross-domain access
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');

  next();
}

/**
 * CORS Headers for Embedded Apps
 * More permissive CORS for embedded Shopify apps
 */
export function embeddedAppCors(req, res, next) {
  const origin = req.get('origin');

  // Allow requests from Shopify admin and our own frontend
  const allowedOrigins = [
    'https://admin.shopify.com',
    /^https:\/\/.*\.myshopify\.com$/,
    'http://localhost:5173',
    'https://digikeyhq.com',  // Production custom domain
    'https://license-manager-lovat.vercel.app'  // Legacy URL
  ];

  const isAllowed = allowedOrigins.some(allowed => {
    if (typeof allowed === 'string') {
      return origin === allowed;
    }
    // RegExp
    return allowed.test(origin);
  });

  if (isAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  }

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  next();
}

/**
 * Rate Limiting Headers
 * Inform clients about rate limits
 */
export function rateLimitHeaders(req, res, next) {
  // Set rate limit information headers
  res.setHeader('X-RateLimit-Limit', '1000'); // requests per hour
  res.setHeader('X-RateLimit-Remaining', '999'); // TODO: implement actual tracking
  res.setHeader('X-RateLimit-Reset', Date.now() + 3600000); // 1 hour from now

  next();
}

/**
 * Remove sensitive headers that leak server information
 */
export function removeServerHeaders(req, res, next) {
  // Remove default Express/Node headers that expose server info
  res.removeHeader('X-Powered-By');

  next();
}

/**
 * Apply all security headers at once
 */
export function applyAllSecurityHeaders(req, res, next) {
  removeServerHeaders(req, res, () => {
    securityHeaders(req, res, () => {
      embeddedAppCors(req, res, () => {
        rateLimitHeaders(req, res, next);
      });
    });
  });
}
