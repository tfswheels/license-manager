import { shopifyApi, LATEST_API_VERSION } from '@shopify/shopify-api';
import '@shopify/shopify-api/adapters/node';
import dotenv from 'dotenv';

dotenv.config();

// Debug: Log the raw scopes from environment to diagnose Railway variable issue
console.log('🔍 DEBUG SHOPIFY_SCOPES raw:', JSON.stringify(process.env.SHOPIFY_SCOPES));
console.log('🔍 DEBUG SHOPIFY_SCOPES length:', process.env.SHOPIFY_SCOPES?.length);
console.log('🔍 DEBUG SHOPIFY_OPTIONAL_SCOPES raw:', JSON.stringify(process.env.SHOPIFY_OPTIONAL_SCOPES));

// Split scopes and trim whitespace from each scope
const scopesArray = process.env.SHOPIFY_SCOPES?.split(',').map(s => s.trim()) || [];
const optionalScopesArray = process.env.SHOPIFY_OPTIONAL_SCOPES?.split(',').map(s => s.trim()).filter(Boolean) || [];

console.log('🔍 DEBUG Required scopes array:', scopesArray);
console.log('🔍 DEBUG Optional scopes array:', optionalScopesArray);
console.log('🔍 DEBUG Number of required scopes:', scopesArray.length);
console.log('🔍 DEBUG Number of optional scopes:', optionalScopesArray.length);

// Combine required and optional scopes for the OAuth request
// Shopify will request all of them, but we'll only validate required ones
const allScopesArray = [...scopesArray, ...optionalScopesArray];

export const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  scopes: allScopesArray,  // Request both required and optional scopes
  hostName: process.env.APP_URL.replace(/https?:\/\//, ''),
  hostScheme: process.env.APP_URL.startsWith('https') ? 'https' : 'http',
  apiVersion: '2025-10',  // Latest stable API version
  isEmbeddedApp: true,  // Enable embedded app mode for Shopify App Store
  logger: {
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'info'
  }
});

export const shopifyConfig = {
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecret: process.env.SHOPIFY_API_SECRET,
  scopes: process.env.SHOPIFY_SCOPES,
  optionalScopes: process.env.SHOPIFY_OPTIONAL_SCOPES,
  redirectUri: process.env.SHOPIFY_REDIRECT_URI,
  webhookSecret: process.env.SHOPIFY_WEBHOOK_SECRET
};
