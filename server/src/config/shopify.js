import { shopifyApi, LATEST_API_VERSION } from '@shopify/shopify-api';
import '@shopify/shopify-api/adapters/node';
import dotenv from 'dotenv';

dotenv.config();

export const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  scopes: process.env.SHOPIFY_SCOPES.split(','),
  hostName: process.env.APP_URL.replace(/https?:\/\//, ''),
  hostScheme: process.env.APP_URL.startsWith('https') ? 'https' : 'http',
  apiVersion: LATEST_API_VERSION,
  isEmbeddedApp: true,  // Enable embedded app mode for Shopify App Store
  logger: {
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'info'
  }
});

export const shopifyConfig = {
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecret: process.env.SHOPIFY_API_SECRET,
  scopes: process.env.SHOPIFY_SCOPES,
  redirectUri: process.env.SHOPIFY_REDIRECT_URI,
  webhookSecret: process.env.SHOPIFY_WEBHOOK_SECRET
};
