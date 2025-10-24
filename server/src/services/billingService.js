// server/src/services/billingService.js
import { shopify } from '../config/shopify.js';
import db from '../config/database.js';

/**
 * Billing Plans Configuration
 * Customize these plans according to your pricing strategy
 */
export const BILLING_PLANS = {
  FREE: {
    name: 'Free Trial',
    price: 0,
    interval: null,
    test: false,
    features: {
      maxOrdersPerMonth: 10,
      maxProducts: 2,
      maxLicensesPerProduct: 100,
      emailSupport: false,
      customTemplates: false,
      advancedRules: false
    }
  },
  STARTER: {
    name: 'Starter',
    price: 14.99,
    interval: 'EVERY_30_DAYS',
    trialDays: 7,
    test: false,
    features: {
      maxOrdersPerMonth: 100,
      maxProducts: -1, // unlimited
      maxLicensesPerProduct: -1, // unlimited
      emailSupport: true,
      customTemplates: true,
      advancedRules: true,
      privateBranding: true,
      bulkUpload: true,
      realTimeSync: true
    }
  },
  GROWTH: {
    name: 'Growth',
    price: 24.99,
    interval: 'EVERY_30_DAYS',
    trialDays: 7,
    test: false,
    features: {
      maxOrdersPerMonth: 499,
      maxProducts: -1, // unlimited
      maxLicensesPerProduct: -1, // unlimited
      emailSupport: true,
      customTemplates: true,
      advancedRules: true,
      privateBranding: true,
      bulkUpload: true,
      realTimeSync: true,
      prioritySupport: true,
      customSenderDomains: true,
      orderHistoryExport: true,
      dedicatedOnboarding: true
    }
  },
  SCALE: {
    name: 'Scale',
    price: 34.99,
    interval: 'EVERY_30_DAYS',
    trialDays: 7,
    test: false,
    features: {
      maxOrdersPerMonth: -1, // unlimited (500+)
      maxProducts: -1, // unlimited
      maxLicensesPerProduct: -1, // unlimited
      emailSupport: true,
      customTemplates: true,
      advancedRules: true,
      privateBranding: true,
      bulkUpload: true,
      realTimeSync: true,
      premiumSupport: true,
      customSenderDomains: true,
      orderHistoryExport: true,
      whiteGloveSetup: true,
      customIntegrations: true,
      apiAccess: true,
      accountManager: true
    }
  }
};

/**
 * Create a recurring application charge (subscription)
 */
export async function createSubscription(shop, accessToken, planKey = 'BASIC') {
  const plan = BILLING_PLANS[planKey];

  if (!plan || plan.price === 0) {
    // Free plan - no subscription needed
    return null;
  }

  const client = new shopify.clients.Graphql({
    session: { shop, accessToken }
  });

  try {
    const mutation = `
      mutation AppSubscriptionCreate($name: String!, $lineItems: [AppSubscriptionLineItemInput!]!, $returnUrl: URL!, $trialDays: Int, $test: Boolean) {
        appSubscriptionCreate(
          name: $name
          lineItems: $lineItems
          returnUrl: $returnUrl
          trialDays: $trialDays
          test: $test
        ) {
          appSubscription {
            id
            status
            name
            createdAt
            trialDays
            currentPeriodEnd
          }
          confirmationUrl
          userErrors {
            field
            message
          }
        }
      }
    `;

    const response = await client.query({
      data: {
        query: mutation,
        variables: {
          name: plan.name,
          lineItems: [
            {
              plan: {
                appRecurringPricingDetails: {
                  price: { amount: plan.price, currencyCode: 'USD' },
                  interval: plan.interval
                }
              }
            }
          ],
          returnUrl: `${process.env.APP_URL}/auth/billing/callback`,
          trialDays: plan.trialDays || 0,
          test: process.env.NODE_ENV === 'development' || plan.test
        }
      }
    });

    const { appSubscriptionCreate } = response.body.data;

    if (appSubscriptionCreate.userErrors?.length > 0) {
      console.error('Subscription creation errors:', appSubscriptionCreate.userErrors);
      throw new Error(appSubscriptionCreate.userErrors[0].message);
    }

    return {
      subscription: appSubscriptionCreate.appSubscription,
      confirmationUrl: appSubscriptionCreate.confirmationUrl
    };

  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
}

/**
 * Check if a shop has an active subscription
 */
export async function hasActiveSubscription(shop, accessToken) {
  const client = new shopify.clients.Graphql({
    session: { shop, accessToken }
  });

  try {
    const query = `
      query {
        currentAppInstallation {
          activeSubscriptions {
            id
            name
            status
            createdAt
            currentPeriodEnd
            trialDays
            test
          }
        }
      }
    `;

    const response = await client.query({
      data: { query }
    });

    const subscriptions = response.body.data.currentAppInstallation.activeSubscriptions;

    // Check if there's at least one active subscription
    const activeSubscription = subscriptions.find(sub => sub.status === 'ACTIVE');

    return {
      hasActive: !!activeSubscription,
      subscription: activeSubscription || null,
      allSubscriptions: subscriptions
    };

  } catch (error) {
    console.error('Error checking subscription:', error);
    return { hasActive: false, subscription: null, allSubscriptions: [] };
  }
}

/**
 * Cancel an active subscription
 */
export async function cancelSubscription(shop, accessToken, subscriptionId) {
  const client = new shopify.clients.Graphql({
    session: { shop, accessToken }
  });

  try {
    const mutation = `
      mutation AppSubscriptionCancel($id: ID!) {
        appSubscriptionCancel(id: $id) {
          appSubscription {
            id
            status
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const response = await client.query({
      data: {
        query: mutation,
        variables: { id: subscriptionId }
      }
    });

    const { appSubscriptionCancel } = response.body.data;

    if (appSubscriptionCancel.userErrors?.length > 0) {
      console.error('Subscription cancellation errors:', appSubscriptionCancel.userErrors);
      throw new Error(appSubscriptionCancel.userErrors[0].message);
    }

    return appSubscriptionCancel.appSubscription;

  } catch (error) {
    console.error('Error cancelling subscription:', error);
    throw error;
  }
}

/**
 * Store subscription information in the database
 */
export async function saveSubscriptionToDatabase(shopDomain, subscriptionData, planKey) {
  try {
    const [shops] = await db.query('SELECT id FROM shops WHERE shop_domain = ?', [shopDomain]);

    if (shops.length === 0) {
      throw new Error(`Shop not found: ${shopDomain}`);
    }

    const shopId = shops[0].id;

    await db.query(`
      INSERT INTO subscriptions (
        shop_id,
        subscription_id,
        plan_name,
        plan_key,
        status,
        price,
        interval_type,
        trial_days,
        current_period_end,
        is_test,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        status = VALUES(status),
        plan_name = VALUES(plan_name),
        plan_key = VALUES(plan_key),
        price = VALUES(price),
        current_period_end = VALUES(current_period_end),
        updated_at = NOW()
    `, [
      shopId,
      subscriptionData.id,
      subscriptionData.name,
      planKey,
      subscriptionData.status,
      BILLING_PLANS[planKey].price,
      BILLING_PLANS[planKey].interval,
      subscriptionData.trialDays || 0,
      subscriptionData.currentPeriodEnd || null,
      subscriptionData.test || false
    ]);

    console.log(`✅ Subscription saved for shop ${shopDomain}`);

  } catch (error) {
    console.error('Error saving subscription to database:', error);
    throw error;
  }
}

/**
 * Get shop's current subscription from database
 */
export async function getShopSubscription(shopDomain) {
  try {
    const [rows] = await db.query(`
      SELECT s.*, sub.*
      FROM shops s
      LEFT JOIN subscriptions sub ON s.id = sub.shop_id
      WHERE s.shop_domain = ?
      ORDER BY sub.created_at DESC
      LIMIT 1
    `, [shopDomain]);

    if (rows.length === 0) {
      return null;
    }

    return rows[0];

  } catch (error) {
    console.error('Error fetching shop subscription:', error);
    throw error;
  }
}

/**
 * Check if shop has access to a specific feature based on their plan
 */
export async function hasFeatureAccess(shopDomain, featureName) {
  try {
    const subscription = await getShopSubscription(shopDomain);

    if (!subscription || !subscription.plan_key) {
      // No subscription or free plan - check FREE tier
      const freePlan = BILLING_PLANS.FREE;
      return freePlan.features[featureName] || false;
    }

    const plan = BILLING_PLANS[subscription.plan_key];

    if (!plan) {
      return false;
    }

    return plan.features[featureName] || false;

  } catch (error) {
    console.error('Error checking feature access:', error);
    return false;
  }
}

/**
 * Get plan limits for a shop
 */
export async function getPlanLimits(shopDomain) {
  try {
    const subscription = await getShopSubscription(shopDomain);

    if (!subscription || !subscription.plan_key) {
      return BILLING_PLANS.FREE.features;
    }

    const plan = BILLING_PLANS[subscription.plan_key];
    return plan ? plan.features : BILLING_PLANS.FREE.features;

  } catch (error) {
    console.error('Error getting plan limits:', error);
    return BILLING_PLANS.FREE.features;
  }
}

/**
 * Get order count for current billing period
 */
export async function getMonthlyOrderCount(shopId) {
  try {
    // Count orders from the start of current month
    const [rows] = await db.execute(`
      SELECT COUNT(*) as order_count
      FROM orders
      WHERE shop_id = ?
        AND order_type != 'manual'
        AND created_at >= DATE_FORMAT(NOW(), '%Y-%m-01 00:00:00')
    `, [shopId]);

    return rows[0]?.order_count || 0;
  } catch (error) {
    console.error('Error getting monthly order count:', error);
    return 0;
  }
}

/**
 * Check if shop can process more orders based on their plan limit
 */
export async function canProcessOrder(shopId, shopDomain) {
  try {
    const [limits, orderCount] = await Promise.all([
      getPlanLimits(shopDomain),
      getMonthlyOrderCount(shopId)
    ]);

    const maxOrders = limits.maxOrdersPerMonth;

    // -1 means unlimited
    if (maxOrders === -1) {
      return {
        allowed: true,
        current: orderCount,
        limit: -1,
        remaining: -1
      };
    }

    const allowed = orderCount < maxOrders;

    return {
      allowed,
      current: orderCount,
      limit: maxOrders,
      remaining: Math.max(0, maxOrders - orderCount)
    };
  } catch (error) {
    console.error('Error checking order limit:', error);
    // On error, allow the order to go through (fail open)
    return { allowed: true, current: 0, limit: -1, remaining: -1 };
  }
}

/**
 * Get usage statistics for a shop
 */
export async function getShopUsageStats(shopId, shopDomain) {
  try {
    const [subscription, limits, orderCount] = await Promise.all([
      getShopSubscription(shopDomain),
      getPlanLimits(shopDomain),
      getMonthlyOrderCount(shopId)
    ]);

    const planKey = subscription?.plan_key || 'FREE';
    const plan = BILLING_PLANS[planKey];

    return {
      plan: {
        key: planKey,
        name: plan.name,
        price: plan.price
      },
      orders: {
        current: orderCount,
        limit: limits.maxOrdersPerMonth,
        remaining: limits.maxOrdersPerMonth === -1 ? -1 : Math.max(0, limits.maxOrdersPerMonth - orderCount),
        percentage: limits.maxOrdersPerMonth === -1 ? 0 : Math.round((orderCount / limits.maxOrdersPerMonth) * 100)
      },
      features: limits
    };
  } catch (error) {
    console.error('Error getting usage stats:', error);
    throw error;
  }
}
