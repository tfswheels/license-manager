// server/src/routes/billing.js
import express from 'express';
import { shopify } from '../config/shopify.js';
import {
  createSubscription,
  hasActiveSubscription,
  cancelSubscription,
  saveSubscriptionToDatabase,
  getShopSubscription,
  BILLING_PLANS
} from '../services/billingService.js';
import db from '../config/database.js';

const router = express.Router();

/**
 * Billing callback - handles confirmation after merchant accepts charge
 * This is where Shopify redirects after merchant approves subscription
 */
router.get('/callback', async (req, res) => {
  try {
    const { charge_id, shop } = req.query;

    console.log(`📋 Billing callback received for shop: ${shop}, charge_id: ${charge_id}`);

    if (!shop || !charge_id) {
      return res.status(400).send('Missing required parameters');
    }

    // Get shop's access token
    const [shops] = await db.query('SELECT access_token FROM shops WHERE shop_domain = ?', [shop]);

    if (shops.length === 0) {
      return res.status(404).send('Shop not found');
    }

    const accessToken = shops[0].access_token;

    // Get subscription details from Shopify
    const client = new shopify.clients.Graphql({
      session: { shop, accessToken }
    });

    const query = `
      query GetSubscription($id: ID!) {
        node(id: $id) {
          ... on AppSubscription {
            id
            name
            status
            createdAt
            currentPeriodEnd
            trialDays
            test
            lineItems {
              plan {
                pricingDetails {
                  ... on AppRecurringPricing {
                    price {
                      amount
                    }
                    interval
                  }
                }
              }
            }
          }
        }
      }
    `;

    const response = await client.query({
      data: {
        query,
        variables: { id: `gid://shopify/AppSubscription/${charge_id}` }
      }
    });

    const subscription = response.body.data.node;

    if (!subscription) {
      console.error('❌ Subscription not found');
      return res.status(404).send('Subscription not found');
    }

    console.log(`✅ Subscription status: ${subscription.status}`);

    // Determine which plan this is based on price
    const price = parseFloat(subscription.lineItems[0]?.plan?.pricingDetails?.price?.amount || 0);
    let planKey = 'FREE';

    for (const [key, plan] of Object.entries(BILLING_PLANS)) {
      if (plan.price === price) {
        planKey = key;
        break;
      }
    }

    // Save subscription to database
    await saveSubscriptionToDatabase(shop, subscription, planKey);

    if (subscription.status === 'ACTIVE') {
      console.log(`✅ Subscription activated for ${shop}: ${subscription.name}`);
      // Redirect to app with success message
      res.redirect(`https://license-manager-lovat.vercel.app?shop=${shop}&billing=success`);
    } else {
      console.warn(`⚠️ Subscription not active: ${subscription.status}`);
      // Redirect with pending status
      res.redirect(`https://license-manager-lovat.vercel.app?shop=${shop}&billing=pending`);
    }

  } catch (error) {
    console.error('❌ Billing callback error:', error);
    res.status(500).send('Error processing billing callback');
  }
});

/**
 * Check subscription status for a shop
 */
router.get('/status', async (req, res) => {
  try {
    const { shop } = req.query;

    if (!shop) {
      return res.status(400).json({ error: 'Missing shop parameter' });
    }

    // Get from database
    const subscription = await getShopSubscription(shop);

    if (!subscription || !subscription.subscription_id) {
      return res.json({
        hasSubscription: false,
        plan: 'FREE',
        status: null,
        features: BILLING_PLANS.FREE.features
      });
    }

    const plan = BILLING_PLANS[subscription.plan_key] || BILLING_PLANS.FREE;

    res.json({
      hasSubscription: true,
      plan: subscription.plan_key,
      planName: subscription.plan_name,
      status: subscription.status,
      price: subscription.price,
      trialDays: subscription.trial_days,
      currentPeriodEnd: subscription.current_period_end,
      isTest: subscription.is_test,
      features: plan.features
    });

  } catch (error) {
    console.error('Error checking subscription status:', error);
    res.status(500).json({ error: 'Failed to check subscription status' });
  }
});

/**
 * Create a new subscription (initiate billing)
 */
router.post('/subscribe', async (req, res) => {
  try {
    const { shop, plan } = req.body;

    if (!shop || !plan) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    if (!BILLING_PLANS[plan]) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    // Get shop's access token
    const [shops] = await db.query('SELECT access_token FROM shops WHERE shop_domain = ?', [shop]);

    if (shops.length === 0) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    const accessToken = shops[0].access_token;

    // Check if shop already has an active subscription
    const existingSubscription = await hasActiveSubscription(shop, accessToken);

    if (existingSubscription.hasActive) {
      return res.status(400).json({
        error: 'Shop already has an active subscription',
        subscription: existingSubscription.subscription
      });
    }

    // Create new subscription
    const result = await createSubscription(shop, accessToken, plan);

    if (!result) {
      // Free plan
      return res.json({
        success: true,
        plan: 'FREE',
        confirmationUrl: null
      });
    }

    res.json({
      success: true,
      plan,
      confirmationUrl: result.confirmationUrl,
      subscription: result.subscription
    });

  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
});

/**
 * Cancel subscription
 */
router.post('/cancel', async (req, res) => {
  try {
    const { shop } = req.body;

    if (!shop) {
      return res.status(400).json({ error: 'Missing shop parameter' });
    }

    // Get shop's access token and subscription
    const [shops] = await db.query(`
      SELECT s.access_token, sub.subscription_id
      FROM shops s
      LEFT JOIN subscriptions sub ON s.id = sub.shop_id
      WHERE s.shop_domain = ?
      ORDER BY sub.created_at DESC
      LIMIT 1
    `, [shop]);

    if (shops.length === 0) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    const { access_token: accessToken, subscription_id: subscriptionId } = shops[0];

    if (!subscriptionId) {
      return res.status(400).json({ error: 'No active subscription found' });
    }

    // Cancel subscription in Shopify
    await cancelSubscription(shop, accessToken, subscriptionId);

    // Update database
    await db.query(`
      UPDATE subscriptions
      SET status = 'CANCELLED', updated_at = NOW()
      WHERE subscription_id = ?
    `, [subscriptionId]);

    res.json({
      success: true,
      message: 'Subscription cancelled successfully'
    });

  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

/**
 * Get available billing plans
 */
router.get('/plans', (req, res) => {
  const plans = Object.entries(BILLING_PLANS).map(([key, plan]) => ({
    key,
    name: plan.name,
    price: plan.price,
    interval: plan.interval,
    trialDays: plan.trialDays || 0,
    features: plan.features
  }));

  res.json({ plans });
});

export default router;
