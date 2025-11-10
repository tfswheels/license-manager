import { Check, Zap, Shield, Palette, Tag, TrendingUp, Mail, FileText, HelpCircle, ArrowRight } from 'lucide-react';

function LandingPage() {
  const features = [
    {
      icon: Zap,
      title: 'Unlimited Email Templates',
      description: 'Create as many custom email templates as you need with live preview. No limits, unlike SendOwl\'s single template.',
      highlight: 'vs SendOwl: 1 template only'
    },
    {
      icon: Tag,
      title: 'Smart Template Assignment',
      description: 'Automatically assign templates by product tags, vendor, price range, or custom rules. Set it once and forget it.',
      highlight: 'vs SendOwl: Manual only'
    },
    {
      icon: Palette,
      title: 'Private Branding',
      description: 'Use your own sender name and reply-to email. Your customers only see your brand, not ours.',
      highlight: 'SendOwl branding everywhere'
    },
    {
      icon: Shield,
      title: 'Bulk License Management',
      description: 'Upload thousands of license keys via CSV. Efficient inventory tracking with low stock alerts.',
      highlight: 'Fast & reliable'
    },
    {
      icon: TrendingUp,
      title: 'Real-Time Inventory',
      description: 'Track available licenses in real-time. Get alerts when stock runs low. Never oversell.',
      highlight: 'Always in sync'
    },
    {
      icon: Mail,
      title: 'Instant Delivery',
      description: 'Licenses delivered immediately after purchase via professional emails. No delays, no manual work.',
      highlight: 'Fully automated'
    }
  ];

  const pricingTiers = [
    {
      name: 'Starter',
      price: '$14.99',
      period: '/month',
      orders: 'Up to 100 orders/month',
      features: [
        'Unlimited email templates',
        'Smart template rules',
        'Private branding',
        'CSV bulk upload',
        'Real-time inventory',
        'Email support'
      ],
      cta: 'Start Free Trial',
      popular: false
    },
    {
      name: 'Growth',
      price: '$24.99',
      period: '/month',
      orders: '100-499 orders/month',
      features: [
        'Everything in Starter',
        'Priority email support',
        'Advanced template rules',
        'Custom sender domains',
        'Order history export',
        'Dedicated onboarding'
      ],
      cta: 'Start Free Trial',
      popular: true
    },
    {
      name: 'Scale',
      price: '$34.99',
      period: '/month',
      orders: '500+ orders/month',
      features: [
        'Everything in Growth',
        'Premium support (24hr)',
        'White-glove setup',
        'Custom integrations',
        'API access',
        'Account manager'
      ],
      cta: 'Start Free Trial',
      popular: false
    }
  ];

  const comparison = [
    { feature: 'Email Templates', digikey: 'Unlimited', sendowl: '1 Template' },
    { feature: 'Auto Template Assignment', digikey: 'Yes', sendowl: 'No' },
    { feature: 'Private Branding', digikey: 'Full Control', sendowl: 'Limited' },
    { feature: 'CSV Bulk Upload', digikey: 'Yes', sendowl: 'Manual Entry' },
    { feature: 'Real-Time Sync', digikey: 'Yes', sendowl: 'Delayed' },
    { feature: 'Shopify Native', digikey: 'Yes', sendowl: 'External' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">DigiKey HQ</span>
          </div>
          <a
            href="https://apps.shopify.com/digikey-hq"
            className="btn-primary flex items-center gap-2"
          >
            Install on Shopify
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
          Automate License Key Delivery
          <br />
          <span className="text-blue-600">The Smart Way</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Deliver software licenses, product keys, and digital downloads instantly with unlimited custom templates,
          smart automation, and complete branding control. Built exclusively for Shopify.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <a
            href="https://apps.shopify.com/digikey-hq"
            className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            Start Free 7-Day Trial
            <ArrowRight className="w-5 h-5" />
          </a>
          <a
            href="#pricing"
            className="px-8 py-4 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-lg border-2 border-gray-300"
          >
            View Pricing
          </a>
        </div>
        <p className="text-sm text-gray-500 mt-4">No credit card required • 7-day free trial • Cancel anytime</p>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose DigiKey HQ?</h2>
          <p className="text-xl text-gray-600">Everything you need to automate license delivery. Nothing you don't.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-100"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 mb-3">{feature.description}</p>
                <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full">
                  {feature.highlight}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Comparison Table */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">DigiKey HQ vs SendOwl</h2>
          <p className="text-xl text-gray-600">See why merchants are switching</p>
        </div>

        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left py-4 px-6 font-semibold text-gray-900">Feature</th>
                <th className="text-center py-4 px-6 font-semibold text-blue-600">DigiKey HQ</th>
                <th className="text-center py-4 px-6 font-semibold text-gray-500">SendOwl</th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((row, index) => (
                <tr key={index} className="border-b border-gray-100">
                  <td className="py-4 px-6 text-gray-900">{row.feature}</td>
                  <td className="py-4 px-6 text-center">
                    <span className="inline-flex items-center gap-1 text-green-600 font-semibold">
                      <Check className="w-5 h-5" /> {row.digikey}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center text-gray-500">{row.sendowl}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
          <p className="text-xl text-gray-600">Choose the plan that fits your business. Scale as you grow.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {pricingTiers.map((tier, index) => (
            <div
              key={index}
              className={`bg-white rounded-xl shadow-lg p-8 relative ${
                tier.popular ? 'ring-2 ring-blue-600 transform scale-105' : ''
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{tier.name}</h3>
                <div className="flex items-baseline justify-center gap-1 mb-2">
                  <span className="text-4xl font-bold text-gray-900">{tier.price}</span>
                  <span className="text-gray-500">{tier.period}</span>
                </div>
                <p className="text-sm text-gray-600">{tier.orders}</p>
              </div>

              <ul className="space-y-3 mb-8">
                {tier.features.map((feature, fIndex) => (
                  <li key={fIndex} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <a
                href="https://apps.shopify.com/digikey-hq"
                className={`block w-full py-3 px-6 rounded-lg font-semibold text-center transition-colors ${
                  tier.popular
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                {tier.cta}
              </a>
            </div>
          ))}
        </div>

        <p className="text-center text-gray-500 mt-8">
          All plans include 7-day free trial • No credit card required • Cancel anytime
        </p>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Automate Your License Delivery?</h2>
          <p className="text-xl mb-8 text-blue-100">
            Join hundreds of Shopify merchants who trust DigiKey HQ to deliver licenses instantly.
          </p>
          <a
            href="https://apps.shopify.com/digikey-hq"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors font-bold text-lg shadow-xl"
          >
            Install Free on Shopify
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">DigiKey HQ</span>
              </div>
              <p className="text-sm text-gray-400">
                The smartest way to deliver license keys on Shopify.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="https://apps.shopify.com/digikey-hq" className="hover:text-white transition-colors">Install App</a></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="/documentation" className="hover:text-white transition-colors flex items-center gap-1">
                  <FileText className="w-4 h-4" /> Documentation
                </a></li>
                <li><a href="/support" className="hover:text-white transition-colors flex items-center gap-1">
                  <HelpCircle className="w-4 h-4" /> Contact Support
                </a></li>
                <li><a href="mailto:mail@digikeyhq.com" className="hover:text-white transition-colors flex items-center gap-1">
                  <Mail className="w-4 h-4" /> mail@digikeyhq.com
                </a></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="/terms-of-service" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="/gdpr-compliance" className="hover:text-white transition-colors">GDPR Compliance</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-sm">
            <p className="text-gray-400">
              © {new Date().getFullYear()} DigiKey HQ. All rights reserved.
            </p>
            <p className="text-gray-400 mt-4 md:mt-0">
              Built with ❤️ for Shopify merchants
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
