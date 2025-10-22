// server/src/middleware/verifySessionToken.js
import { shopify } from '../config/shopify.js';

/**
 * Middleware to verify Shopify session tokens for embedded apps
 * Session tokens are JWTs signed by Shopify that authenticate the merchant
 *
 * For embedded apps, session tokens should be included in the Authorization header
 * as: Authorization: Bearer <session_token>
 */
export async function verifySessionToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // For backward compatibility during transition, allow requests without session tokens
      // TODO: Make this required once fully migrated to embedded app
      console.warn('⚠️ No session token provided in request');
      return next();
    }

    const sessionToken = authHeader.replace('Bearer ', '');

    try {
      // Verify and decode the session token using Shopify's utility
      // This validates the signature and checks expiration
      const payload = await shopify.utils.decodeSessionToken(sessionToken);

      // Extract shop domain from the destination (dest) claim
      // Format: https://shop-domain.myshopify.com
      const shopDomain = payload.dest.replace('https://', '');

      // Attach verified information to request object
      req.shopDomain = shopDomain;
      req.sessionToken = payload;
      req.isAuthenticated = true;

      console.log(`✅ Session token verified for shop: ${shopDomain}`);
      next();

    } catch (verifyError) {
      console.error('❌ Session token verification error:', verifyError.message);
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired session token'
      });
    }

  } catch (error) {
    console.error('❌ Session token middleware error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Strict version - requires valid session token
 * Use this for routes that absolutely require authentication
 */
export async function requireSessionToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Session token required for embedded app authentication'
    });
  }

  // Use the main verification logic
  return verifySessionToken(req, res, next);
}
