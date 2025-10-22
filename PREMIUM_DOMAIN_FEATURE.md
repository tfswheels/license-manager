# Premium Feature: Custom Domain Verification

## Overview
Allow premium/enterprise tier merchants to send emails from their own verified domains instead of the platform domain.

## Implementation Plan

### Phase 1: Backend Integration

#### 1. Add Domain Verification Service
```javascript
// server/src/services/domainVerificationService.js

import sgClient from '@sendgrid/client';

/**
 * Initiate domain authentication for a merchant
 * @param {string} domain - Merchant's domain (e.g., "merchantshop.com")
 * @returns {Promise<Object>} DNS records to be added
 */
async function initiateDomainVerification(domain) {
  const request = {
    method: 'POST',
    url: '/v3/whitelabel/domains',
    body: {
      domain: domain,
      subdomain: 'em', // Creates em.merchantshop.com for sending
      automatic_security: true,
      default: false
    }
  };

  const [response] = await sgClient.request(request);
  return {
    id: response.body.id,
    dns_records: response.body.dns, // SPF, DKIM, CNAME records
    valid: response.body.valid,
    domain: response.body.domain
  };
}

/**
 * Check verification status of a domain
 */
async function checkDomainVerification(domainId) {
  const request = {
    method: 'GET',
    url: `/v3/whitelabel/domains/${domainId}/validate`
  };

  const [response] = await sgClient.request(request);
  return {
    valid: response.body.valid,
    validation_results: response.body.validation_results
  };
}
```

#### 2. Add API Endpoints
```javascript
// server/src/routes/admin.js

// Request domain verification (Premium tier only)
router.post('/shops/:shopId/domain-verification/initiate', async (req, res) => {
  const { shopId } = req.params;
  const { domain, senderEmail } = req.body;

  // TODO: Check if shop has premium subscription
  // if (!shop.subscription_tier === 'premium') {
  //   return res.status(403).json({ error: 'Premium feature' });
  // }

  try {
    const verification = await initiateDomainVerification(domain);

    // Store verification records in database
    await updateShopSettings(shopId, {
      domain_verification_status: 'pending',
      domain_verification_records: JSON.stringify(verification.dns_records),
      verified_domain: domain,
      custom_sender_email: senderEmail
    });

    res.json({
      success: true,
      dns_records: verification.dns_records,
      instructions: 'Add these DNS records to your domain registrar'
    });
  } catch (error) {
    console.error('Domain verification error:', error);
    res.status(500).json({ error: 'Failed to initiate domain verification' });
  }
});

// Check verification status
router.post('/shops/:shopId/domain-verification/check', async (req, res) => {
  // TODO: Get domainId from database
  // Check verification status
  // Update database with result
});
```

### Phase 2: Frontend UI

#### 1. Add Premium Badge/Indicator
```jsx
// In SystemSettings.jsx, show different UI based on tier

{shop.subscription_tier === 'premium' ? (
  <div className="space-y-4">
    <div className="flex items-center gap-2">
      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded">
        PREMIUM
      </span>
      <span className="text-sm text-gray-600">
        Custom domain verification available
      </span>
    </div>

    {/* Show domain verification wizard */}
    <DomainVerificationWizard shopId={selectedShop} />
  </div>
) : (
  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
    <p className="text-sm text-gray-700 mb-2">
      Want to send emails from your own domain?
    </p>
    <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
      Upgrade to Premium →
    </button>
  </div>
)}
```

#### 2. Domain Verification Wizard Component
```jsx
// admin/src/components/DomainVerificationWizard.jsx

const DomainVerificationWizard = ({ shopId }) => {
  const [step, setStep] = useState(1);
  const [domain, setDomain] = useState('');
  const [dnsRecords, setDnsRecords] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState('pending');

  const steps = [
    { id: 1, title: 'Enter Domain', icon: Globe },
    { id: 2, title: 'Add DNS Records', icon: Server },
    { id: 3, title: 'Verify', icon: CheckCircle }
  ];

  // Step 1: Enter domain
  // Step 2: Show DNS records to add
  // Step 3: Check verification and show status

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      {/* Form for each step */}
      {/* DNS record display with copy buttons */}
      {/* Verification status check */}
    </div>
  );
};
```

### Phase 3: Subscription Tier Integration

#### 1. Add Subscription Model
```sql
CREATE TABLE subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  shop_id INT NOT NULL UNIQUE,
  tier ENUM('free', 'basic', 'premium', 'enterprise') DEFAULT 'free',
  features JSON,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NULL,
  FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE
);

-- Define features per tier
INSERT INTO subscriptions (shop_id, tier, features) VALUES
(1, 'premium', JSON_OBJECT(
  'custom_domain', true,
  'priority_support', true,
  'advanced_analytics', true
));
```

#### 2. Feature Gating Middleware
```javascript
// server/src/middleware/checkFeature.js

export function requireFeature(feature) {
  return async (req, res, next) => {
    const { shopId } = req.params;

    const [subscriptions] = await db.execute(
      'SELECT tier, features FROM subscriptions WHERE shop_id = ?',
      [shopId]
    );

    if (subscriptions.length === 0) {
      return res.status(403).json({
        error: 'No subscription found',
        upgrade_url: '/pricing'
      });
    }

    const { tier, features } = subscriptions[0];
    const featureEnabled = features[feature] === true;

    if (!featureEnabled) {
      return res.status(403).json({
        error: `This feature requires ${tier} tier or higher`,
        current_tier: tier,
        upgrade_url: '/pricing'
      });
    }

    next();
  };
}

// Usage:
router.post('/shops/:shopId/domain-verification/initiate',
  requireFeature('custom_domain'),
  async (req, res) => {
    // Handler
  }
);
```

## Feature Comparison Matrix

| Feature | Free/Basic | Premium | Enterprise |
|---------|------------|---------|------------|
| Email Sending | ✅ Platform domain | ✅ Platform domain | ✅ Platform domain |
| Custom Display Name | ✅ | ✅ | ✅ |
| Reply-To Email | ✅ | ✅ | ✅ |
| **Custom Domain** | ❌ | ✅ | ✅ |
| Priority Support | ❌ | ✅ | ✅ |
| Dedicated IP | ❌ | ❌ | ✅ |

## UI/UX for Upselling

### Free/Basic Users See:
```
┌─────────────────────────────────────────┐
│ Email Settings                           │
├─────────────────────────────────────────┤
│ Shop Display Name: [Your Shop Name    ] │
│ Reply-To Email:    [support@shop.com  ] │
│                                          │
│ ┌───────────────────────────────────┐   │
│ │ 💎 Want to use your own domain?   │   │
│ │                                   │   │
│ │ Send from licenses@yourshop.com   │   │
│ │ instead of our platform domain    │   │
│ │                                   │   │
│ │ [Upgrade to Premium →]            │   │
│ └───────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### Premium Users See:
```
┌─────────────────────────────────────────┐
│ Email Settings          [PREMIUM]        │
├─────────────────────────────────────────┤
│ ○ Platform Domain (Default)              │
│   From: "Shop <licenses@platform.com>"  │
│                                          │
│ ● Custom Domain (Verified ✓)            │
│   From: "Shop <licenses@yourshop.com>"  │
│                                          │
│   Domain: yourshop.com                   │
│   Status: Verified ✅                    │
│   [Change Domain]                        │
└─────────────────────────────────────────┘
```

## Testing Strategy

1. **Test with SendGrid Sandbox** first
2. **Use test domain** (e.g., test.yourdomain.com)
3. **Verify DNS propagation** (can take 24-48 hours)
4. **Test email delivery** before launching
5. **Monitor deliverability** per custom domain

## Support Documentation Needed

### For Merchants:
1. "How to Verify Your Custom Domain"
2. "Where to Find DNS Records in Popular Registrars"
3. "Troubleshooting Domain Verification"
4. "Understanding Email Deliverability"

### For Your Support Team:
1. "Checking Domain Verification Status"
2. "Common DNS Configuration Issues"
3. "How to Re-verify Failed Domains"

## Rollout Plan

### Week 1-2: Backend
- [ ] Add subscription model
- [ ] Implement domain verification service
- [ ] Create API endpoints
- [ ] Add feature gating

### Week 3-4: Frontend
- [ ] Build verification wizard UI
- [ ] Add subscription tier indicators
- [ ] Create upgrade prompts
- [ ] Test user flow

### Week 5: Testing & Docs
- [ ] Test verification flow end-to-end
- [ ] Write merchant documentation
- [ ] Train support team
- [ ] Create demo videos

### Week 6: Launch
- [ ] Beta test with select premium users
- [ ] Monitor deliverability
- [ ] Gather feedback
- [ ] Full rollout

## Pricing Consideration

Typical SaaS pricing for this feature:
- **Basic**: $0-29/month (platform domain only)
- **Premium**: $79-149/month (custom domain)
- **Enterprise**: $299+/month (custom domain + dedicated IP)

## Notes

- SendGrid subusers cost extra (~$20/month each)
- Consider if cost of subuser should be factored into premium pricing
- Alternative: Use main account with verified domains (better for cost)
- Monitor email reputation per custom domain
- Consider maximum domains per shop (e.g., 1-3)
