import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>

      <div className="prose prose-lg max-w-none space-y-6">
        <p className="text-gray-600">
          <strong>Last updated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">1. Introduction</h2>
          <p>
            This Privacy Policy describes how License Manager ("we", "our", or "us") collects, uses,
            and protects your information when you use our Shopify application. We are committed to
            protecting your privacy and handling your data in an open and transparent manner.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">2. Information We Collect</h2>

          <h3 className="text-xl font-semibold mt-4">2.1 Information from Shopify</h3>
          <p>When you install our app, we collect:</p>
          <ul className="list-disc ml-6 space-y-2">
            <li>Shop domain and basic shop information</li>
            <li>Product information (titles, IDs, prices, variants)</li>
            <li>Order information (order numbers, line items, customer details)</li>
            <li>Customer information (names, email addresses) associated with orders</li>
          </ul>

          <h3 className="text-xl font-semibold mt-4">2.2 Information You Provide</h3>
          <p>We collect information you directly provide through our app:</p>
          <ul className="list-disc ml-6 space-y-2">
            <li>License keys uploaded to our system</li>
            <li>Email templates and customization settings</li>
            <li>System configuration and preferences</li>
          </ul>

          <h3 className="text-xl font-semibold mt-4">2.3 Automatically Collected Information</h3>
          <p>We automatically collect:</p>
          <ul className="list-disc ml-6 space-y-2">
            <li>Email delivery status and logs</li>
            <li>License allocation and usage data</li>
            <li>Application usage analytics</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">3. How We Use Your Information</h2>
          <p>We use the collected information to:</p>
          <ul className="list-disc ml-6 space-y-2">
            <li>Provide and maintain our license management service</li>
            <li>Process orders and automatically deliver license keys to customers</li>
            <li>Send transactional emails with license information</li>
            <li>Monitor inventory levels and send low-stock alerts</li>
            <li>Improve our application and develop new features</li>
            <li>Comply with legal obligations</li>
            <li>Prevent fraud and ensure security</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">4. Data Sharing and Disclosure</h2>
          <p>We do not sell your personal information. We may share your information with:</p>

          <h3 className="text-xl font-semibold mt-4">4.1 Service Providers</h3>
          <ul className="list-disc ml-6 space-y-2">
            <li><strong>SendGrid:</strong> For email delivery services</li>
            <li><strong>Google Cloud:</strong> For database hosting and infrastructure</li>
            <li><strong>Vercel/Railway:</strong> For application hosting</li>
          </ul>

          <h3 className="text-xl font-semibold mt-4">4.2 Legal Requirements</h3>
          <p>
            We may disclose your information if required by law, court order, or governmental authority,
            or to protect our rights, property, or safety.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">5. Data Storage and Security</h2>
          <p>
            We implement appropriate technical and organizational security measures to protect your data:
          </p>
          <ul className="list-disc ml-6 space-y-2">
            <li>Encrypted data transmission using HTTPS/TLS</li>
            <li>Secure database storage with access controls</li>
            <li>Regular security updates and monitoring</li>
            <li>Limited employee access to personal data</li>
            <li>HMAC verification for webhook authenticity</li>
          </ul>
          <p className="mt-4">
            Your data is stored on secure servers located in the United States and is retained
            for as long as your Shopify store uses our application.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">6. Your Rights (GDPR)</h2>
          <p>If you are in the European Economic Area (EEA), you have the following rights:</p>
          <ul className="list-disc ml-6 space-y-2">
            <li><strong>Access:</strong> Request access to your personal data</li>
            <li><strong>Rectification:</strong> Request correction of inaccurate data</li>
            <li><strong>Erasure:</strong> Request deletion of your data ("right to be forgotten")</li>
            <li><strong>Restriction:</strong> Request restriction of processing</li>
            <li><strong>Data Portability:</strong> Request transfer of your data</li>
            <li><strong>Objection:</strong> Object to processing of your data</li>
            <li><strong>Withdraw Consent:</strong> Withdraw consent at any time</li>
          </ul>
          <p className="mt-4">
            To exercise these rights, please contact us using the information in the Contact section below.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">7. GDPR Compliance</h2>
          <p>
            We comply with GDPR requirements through:
          </p>
          <ul className="list-disc ml-6 space-y-2">
            <li>Processing data only for specified, explicit, and legitimate purposes</li>
            <li>Implementing appropriate security measures</li>
            <li>Responding to data subject requests within 30 days</li>
            <li>Maintaining records of processing activities</li>
            <li>Providing data breach notifications when required</li>
            <li>Supporting Shopify's mandatory GDPR webhooks:
              <ul className="list-circle ml-6 mt-2">
                <li>customers/data_request - Customer data export</li>
                <li>customers/redact - Customer data deletion</li>
                <li>shop/redact - Shop data deletion upon uninstall</li>
              </ul>
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">8. California Privacy Rights (CCPA)</h2>
          <p>
            California residents have additional rights under the California Consumer Privacy Act (CCPA):
          </p>
          <ul className="list-disc ml-6 space-y-2">
            <li>Right to know what personal information is collected</li>
            <li>Right to know if personal information is sold or disclosed</li>
            <li>Right to opt-out of the sale of personal information</li>
            <li>Right to deletion of personal information</li>
            <li>Right to non-discrimination for exercising CCPA rights</li>
          </ul>
          <p className="mt-4">
            <strong>Note:</strong> We do not sell personal information.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">9. Data Retention</h2>
          <p>
            We retain your information for as long as necessary to:
          </p>
          <ul className="list-disc ml-6 space-y-2">
            <li>Provide our services to you</li>
            <li>Comply with legal obligations</li>
            <li>Resolve disputes and enforce agreements</li>
          </ul>
          <p className="mt-4">
            When you uninstall our app, we will delete or anonymize your data within 48 hours
            after receiving Shopify's shop/redact webhook, except where we are required to
            retain it for legal or regulatory purposes.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">10. Children's Privacy</h2>
          <p>
            Our service is not intended for users under the age of 13 (or 16 in the EEA).
            We do not knowingly collect personal information from children. If you become
            aware that a child has provided us with personal information, please contact us.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">11. International Data Transfers</h2>
          <p>
            Your information may be transferred to and processed in countries other than your own.
            We ensure that appropriate safeguards are in place to protect your information in
            compliance with applicable data protection laws.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">12. Changes to This Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any
            material changes by posting the new Privacy Policy on this page and updating the
            "Last updated" date. We encourage you to review this Privacy Policy periodically.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">13. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy or our data practices, please contact us at:
          </p>
          <div className="bg-gray-50 p-4 rounded-lg mt-4">
            <p><strong>Email:</strong> support@license-manager.app</p>
            <p><strong>Response Time:</strong> We aim to respond within 48 hours</p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">14. Shopify-Specific Information</h2>
          <p>
            This app is provided through the Shopify App Store and is subject to Shopify's
            Terms of Service and Privacy Policy. For more information about how Shopify
            handles your data, please visit{' '}
            <a
              href="https://www.shopify.com/legal/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Shopify's Privacy Policy
            </a>.
          </p>
        </section>
      </div>

      <div className="mt-12 pt-8 border-t border-gray-200">
        <p className="text-sm text-gray-500 text-center">
          This Privacy Policy is effective as of the date listed above and applies to all users of License Manager.
        </p>
      </div>
    </div>
  );
}
