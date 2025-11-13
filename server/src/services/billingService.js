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
    trialDays: 7,
    test: false,
    features: {
      maxOrdersPerMonth: -1, // Unlimited during trial
      maxProducts: -1, // Unlimited during trial
      maxLicensesPerProduct: -1, // Unlimited during trial
      emailSupport: false,
      customTemplates: true, // Allow during trial
      advancedRules: true, // Allow during trial
      privateBranding: true, // Allow during trial
      bulkUpload: true, // Allow during trial
      realTimeSync: true // Allow during trial
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
// Map billing plan keys to database enum values
const PLAN_KEY_TO_DB_ENUM = {
  'FREE': 'FREE',
  'STARTER': 'BASIC',
  'GROWTH': 'PRO',
  'SCALE': 'ENTERPRISE'
};

// Reverse mapping for reading from database
const DB_ENUM_TO_PLAN_KEY = {
  'FREE': 'FREE',
  'BASIC': 'STARTER',
  'PRO': 'GROWTH',
  'ENTERPRISE': 'SCALE'
};

export async function saveSubscriptionToDatabase(shopDomain, subscriptionData, planKey) {
  try {
    const [shops] = await db.query('SELECT id FROM shops WHERE shop_domain = ?', [shopDomain]);

    if (shops.length === 0) {
      throw new Error(`Shop not found: ${shopDomain}`);
    }

    const shopId = shops[0].id;

    // Map plan key to database enum value
    const dbPlanEnum = PLAN_KEY_TO_DB_ENUM[planKey] || 'FREE';

    // Map Shopify status to database status
    const statusMap = {
      'ACTIVE': 'active',
      'CANCELLED': 'cancelled',
      'EXPIRED': 'expired',
      'PENDING': 'trial'
    };
    const dbStatus = statusMap[subscriptionData.status] || 'trial';

    await db.query(`
      INSERT INTO subscriptions (
        shop_id,
        shopify_subscription_id,
        plan,
        status,
        price,
        trial_days,
        current_period_end,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        status = VALUES(status),
        plan = VALUES(plan),
        price = VALUES(price),
        current_period_end = VALUES(current_period_end),
        updated_at = NOW()
    `, [
      shopId,
      subscriptionData.id,
      dbPlanEnum,
      dbStatus,
      BILLING_PLANS[planKey].price,
      subscriptionData.trialDays || 0,
      subscriptionData.currentPeriodEnd || null
    ]);

    console.log(`✅ Subscription saved for shop ${shopDomain}: ${planKey} → ${dbPlanEnum}`);

  } catch (error) {
    console.error('Error saving subscription to database:', error);
    console.error('Error details:', error.message);
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

    const subscription = rows[0];

    // Map database enum back to plan key for code compatibility
    if (subscription.plan) {
      subscription.plan_key = DB_ENUM_TO_PLAN_KEY[subscription.plan] || 'FREE';
    }

    // Map database status to uppercase for code compatibility
    if (subscription.status) {
      subscription.subscription_id = subscription.shopify_subscription_id;
    }

    return subscription;

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
 * Check if shop's trial has expired
 */
export async function isTrialExpired(shopId) {
  try {
    const [shops] = await db.execute(
      'SELECT trial_expires_at FROM shops WHERE id = ?',
      [shopId]
    );

    if (shops.length === 0) {
      return false;
    }

    const trialExpiresAt = shops[0].trial_expires_at;

    // If no trial expiration set, trial is not expired
    if (!trialExpiresAt) {
      return false;
    }

    // Check if trial has expired
    return new Date() > new Date(trialExpiresAt);
  } catch (error) {
    console.error('Error checking trial expiration:', error);
    return false; // Fail open
  }
}

/**
 * Check if shop can process more orders based on their plan limit and trial status
 */
export async function canProcessOrder(shopId, shopDomain) {
  try {
    const subscription = await getShopSubscription(shopDomain);
    const [limits, orderCount, trialExpired, shopInfo] = await Promise.all([
      getPlanLimits(shopDomain),
      getMonthlyOrderCount(shopId),
      isTrialExpired(shopId),
      db.query('SELECT access_token FROM shops WHERE id = ?', [shopId])
    ]);

    const accessToken = shopInfo[0]?.[0]?.access_token;

    console.log('🔍 Billing check:', {
      shopDomain,
      hasSubscription: !!subscription,
      subscriptionId: subscription?.subscription_id,
      planKey: subscription?.plan_key,
      limits,
      orderCount,
      trialExpired,
      hasToken: !!accessToken
    });

    // If on FREE plan and trial has expired in our DB, check Shopify's actual status
    if ((!subscription || !subscription.subscription_id) && trialExpired && accessToken) {
      console.log('⚠️ Local trial expired, checking Shopify subscription status...');

      // Check if Shopify has granted them a subscription or trial
      try {
        const shopifyStatus = await hasActiveSubscription(shopDomain, accessToken);

        if (shopifyStatus.hasActive) {
          console.log('✅ Shopify reports active subscription/trial, allowing order');
          // Sync the subscription to our database
          await saveSubscriptionToDatabase(shopDomain, shopifyStatus.subscription, 'FREE');
        } else {
          console.log('❌ No active Shopify subscription and local trial expired, blocking order');
          return {
            allowed: false,
            current: orderCount,
            limit: 0,
            remaining: 0,
            reason: 'trial_expired',
            message: 'Your 7-day free trial has expired. Please upgrade to a paid plan to continue processing orders.'
          };
        }
      } catch (error) {
        console.error('Error checking Shopify subscription status:', error);
        // If we can't check Shopify, block to be safe
        return {
          allowed: false,
          current: orderCount,
          limit: 0,
          remaining: 0,
          reason: 'trial_expired',
          message: 'Your 7-day free trial has expired. Please upgrade to a paid plan to continue processing orders.'
        };
      }
    }

    const maxOrders = limits.maxOrdersPerMonth;
    console.log('📊 Max orders for plan:', maxOrders);

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
