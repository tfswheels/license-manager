import React from 'react';

export default function TermsOfService() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>

      <div className="prose prose-lg max-w-none space-y-6">
        <p className="text-gray-600">
          <strong>Last updated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">1. Agreement to Terms</h2>
          <p>
            By installing and using License Manager ("the App", "our App", "we", "us", or "our"),
            you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these
            Terms, please do not use the App.
          </p>
          <p>
            These Terms constitute a legally binding agreement between you (the Shopify store owner)
            and License Manager regarding your use of our application.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">2. Description of Service</h2>
          <p>
            License Manager is a Shopify application that provides automated license key management
            and delivery services. The App allows you to:
          </p>
          <ul className="list-disc ml-6 space-y-2">
            <li>Upload and manage digital license keys</li>
            <li>Automatically allocate license keys to customer orders</li>
            <li>Send customized emails with license information</li>
            <li>Track license inventory and receive low-stock alerts</li>
            <li>Configure delivery rules and email templates</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">3. Shopify Platform Integration</h2>
          <p>
            The App is designed to work with Shopify's e-commerce platform. By using this App:
          </p>
          <ul className="list-disc ml-6 space-y-2">
            <li>You must have an active Shopify store subscription</li>
            <li>You agree to Shopify's Terms of Service and Privacy Policy</li>
            <li>You grant us permission to access your shop data as specified in our Privacy Policy</li>
            <li>You understand that we integrate with Shopify's APIs and webhooks</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">4. User Responsibilities</h2>

          <h3 className="text-xl font-semibold mt-4">4.1 Account Security</h3>
          <p>You are responsible for:</p>
          <ul className="list-disc ml-6 space-y-2">
            <li>Maintaining the security of your Shopify account</li>
            <li>All activities that occur under your account</li>
            <li>Notifying us immediately of any unauthorized use</li>
          </ul>

          <h3 className="text-xl font-semibold mt-4">4.2 License Key Management</h3>
          <p>You are responsible for:</p>
          <ul className="list-disc ml-6 space-y-2">
            <li>The accuracy and validity of license keys uploaded to the App</li>
            <li>Ensuring you have the legal right to distribute the license keys</li>
            <li>Compliance with any third-party licensing agreements</li>
            <li>Maintaining adequate license inventory for your orders</li>
          </ul>

          <h3 className="text-xl font-semibold mt-4">4.3 Email Communications</h3>
          <p>You are responsible for:</p>
          <ul className="list-disc ml-6 space-y-2">
            <li>The content of email templates you create</li>
            <li>Compliance with anti-spam laws (CAN-SPAM, GDPR, etc.)</li>
            <li>Ensuring email content is accurate and not misleading</li>
            <li>Providing a valid reply-to email address for customer inquiries</li>
          </ul>

          <h3 className="text-xl font-semibold mt-4">4.4 Prohibited Uses</h3>
          <p>You agree NOT to:</p>
          <ul className="list-disc ml-6 space-y-2">
            <li>Use the App for any illegal or unauthorized purpose</li>
            <li>Violate any laws in your jurisdiction</li>
            <li>Distribute pirated, counterfeit, or unauthorized license keys</li>
            <li>Spam or harass customers through the email functionality</li>
            <li>Attempt to reverse engineer, decompile, or hack the App</li>
            <li>Interfere with or disrupt the App's infrastructure</li>
            <li>Use the App to transmit viruses, malware, or harmful code</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">5. Billing and Payments</h2>

          <h3 className="text-xl font-semibold mt-4">5.1 Subscription Plans</h3>
          <p>
            License Manager offers various subscription plans billed through Shopify's billing system.
            By subscribing, you agree to:
          </p>
          <ul className="list-disc ml-6 space-y-2">
            <li>Pay all applicable fees for your chosen plan</li>
            <li>Provide accurate billing information</li>
            <li>Allow Shopify to charge your payment method on file</li>
            <li>Accept automatic renewal unless cancelled</li>
          </ul>

          <h3 className="text-xl font-semibold mt-4">5.2 Free Trials</h3>
          <p>
            If we offer a free trial period, you will not be charged until the trial ends.
            Your subscription will automatically begin at the end of the trial unless you cancel.
          </p>

          <h3 className="text-xl font-semibold mt-4">5.3 Refunds</h3>
          <p>
            Subscription fees are non-refundable except:
          </p>
          <ul className="list-disc ml-6 space-y-2">
            <li>Where required by law</li>
            <li>At our sole discretion for exceptional circumstances</li>
            <li>For billing errors or duplicate charges</li>
          </ul>

          <h3 className="text-xl font-semibold mt-4">5.4 Plan Changes and Cancellation</h3>
          <p>
            You may upgrade, downgrade, or cancel your subscription at any time through your
            Shopify admin. Changes take effect at the start of the next billing cycle.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">6. Data and Privacy</h2>
          <p>
            Our collection, use, and protection of your data is governed by our Privacy Policy.
            By using the App, you consent to our data practices as described in the Privacy Policy.
          </p>
          <p>
            We comply with:
          </p>
          <ul className="list-disc ml-6 space-y-2">
            <li>General Data Protection Regulation (GDPR)</li>
            <li>California Consumer Privacy Act (CCPA)</li>
            <li>Shopify's data protection requirements</li>
            <li>Other applicable privacy laws and regulations</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">7. Intellectual Property</h2>

          <h3 className="text-xl font-semibold mt-4">7.1 Our Intellectual Property</h3>
          <p>
            The App, including its code, design, features, and content, is owned by License Manager
            and is protected by copyright, trademark, and other intellectual property laws.
          </p>

          <h3 className="text-xl font-semibold mt-4">7.2 Your Content</h3>
          <p>
            You retain all rights to the content you upload to the App (license keys, email templates,
            product data, etc.). By using the App, you grant us a limited license to:
          </p>
          <ul className="list-disc ml-6 space-y-2">
            <li>Store and process your content to provide our services</li>
            <li>Display your content within the App interface</li>
            <li>Transmit your content (e.g., sending license keys to customers)</li>
          </ul>
          <p className="mt-4">
            This license terminates when you delete the content or uninstall the App.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">8. Service Availability and Support</h2>

          <h3 className="text-xl font-semibold mt-4">8.1 Uptime and Availability</h3>
          <p>
            We strive to provide reliable service but do not guarantee uninterrupted access.
            The App may be unavailable due to:
          </p>
          <ul className="list-disc ml-6 space-y-2">
            <li>Scheduled maintenance</li>
            <li>Emergency updates or patches</li>
            <li>Third-party service outages (Shopify, SendGrid, hosting providers)</li>
            <li>Unforeseen technical issues</li>
          </ul>

          <h3 className="text-xl font-semibold mt-4">8.2 Customer Support</h3>
          <p>
            We provide customer support via email. We aim to respond to inquiries within 48 hours
            during business days. Support does not include:
          </p>
          <ul className="list-disc ml-6 space-y-2">
            <li>Custom development or feature requests</li>
            <li>Third-party software troubleshooting</li>
            <li>General Shopify platform support</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">9. Disclaimers and Limitations of Liability</h2>

          <h3 className="text-xl font-semibold mt-4">9.1 "AS IS" Warranty Disclaimer</h3>
          <p>
            THE APP IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND,
            EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:
          </p>
          <ul className="list-disc ml-6 space-y-2">
            <li>Warranties of merchantability</li>
            <li>Fitness for a particular purpose</li>
            <li>Non-infringement</li>
            <li>Accuracy, reliability, or completeness of information</li>
          </ul>

          <h3 className="text-xl font-semibold mt-4">9.2 Limitation of Liability</h3>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR:
          </p>
          <ul className="list-disc ml-6 space-y-2">
            <li>Any indirect, incidental, special, or consequential damages</li>
            <li>Loss of profits, revenue, data, or business opportunities</li>
            <li>Email delivery failures or delays</li>
            <li>Incorrect license allocation or distribution</li>
            <li>Data loss or corruption</li>
            <li>Actions of third-party service providers</li>
          </ul>
          <p className="mt-4">
            OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID FOR THE APP IN THE
            PAST 12 MONTHS, OR $100 USD, WHICHEVER IS GREATER.
          </p>

          <h3 className="text-xl font-semibold mt-4">9.3 Third-Party Services</h3>
          <p>
            The App integrates with third-party services (Shopify, SendGrid, etc.). We are not
            responsible for:
          </p>
          <ul className="list-disc ml-6 space-y-2">
            <li>Third-party service outages or errors</li>
            <li>Changes to third-party APIs or policies</li>
            <li>Third-party data breaches or security incidents</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">10. Indemnification</h2>
          <p>
            You agree to indemnify, defend, and hold harmless License Manager, its officers,
            directors, employees, and agents from any claims, liabilities, damages, losses,
            and expenses arising from:
          </p>
          <ul className="list-disc ml-6 space-y-2">
            <li>Your use of the App</li>
            <li>Your violation of these Terms</li>
            <li>Your violation of any third-party rights (including intellectual property rights)</li>
            <li>The license keys or content you upload or distribute</li>
            <li>Your email communications to customers</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">11. Termination</h2>

          <h3 className="text-xl font-semibold mt-4">11.1 Termination by You</h3>
          <p>
            You may terminate your use of the App at any time by uninstalling it from your
            Shopify store. Upon uninstallation:
          </p>
          <ul className="list-disc ml-6 space-y-2">
            <li>Your subscription will be cancelled</li>
            <li>You will lose access to all App features</li>
            <li>Your data will be deleted within 48 hours (per GDPR requirements)</li>
          </ul>

          <h3 className="text-xl font-semibold mt-4">11.2 Termination by Us</h3>
          <p>
            We may suspend or terminate your access to the App immediately if:
          </p>
          <ul className="list-disc ml-6 space-y-2">
            <li>You violate these Terms</li>
            <li>You engage in fraudulent or illegal activity</li>
            <li>Your account poses a security risk</li>
            <li>Payment is past due</li>
            <li>We discontinue the App (with 30 days' notice)</li>
          </ul>

          <h3 className="text-xl font-semibold mt-4">11.3 Effect of Termination</h3>
          <p>
            Upon termination:
          </p>
          <ul className="list-disc ml-6 space-y-2">
            <li>All rights granted to you will cease</li>
            <li>You must stop using the App immediately</li>
            <li>Provisions that by their nature should survive will survive (e.g., indemnification, limitation of liability)</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">12. Changes to Terms</h2>
          <p>
            We reserve the right to modify these Terms at any time. We will notify you of
            material changes by:
          </p>
          <ul className="list-disc ml-6 space-y-2">
            <li>Posting the updated Terms on this page</li>
            <li>Updating the "Last updated" date</li>
            <li>Sending an email notification (for significant changes)</li>
          </ul>
          <p className="mt-4">
            Your continued use of the App after changes become effective constitutes acceptance
            of the new Terms. If you do not agree to the changes, you must uninstall the App.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">13. Governing Law and Dispute Resolution</h2>

          <h3 className="text-xl font-semibold mt-4">13.1 Governing Law</h3>
          <p>
            These Terms are governed by the laws of [Your Jurisdiction], without regard to
            conflict of law principles.
          </p>

          <h3 className="text-xl font-semibold mt-4">13.2 Dispute Resolution</h3>
          <p>
            Any disputes arising from these Terms or your use of the App shall be resolved through:
          </p>
          <ol className="list-decimal ml-6 space-y-2">
            <li>Good faith negotiations between the parties</li>
            <li>Mediation, if negotiations fail</li>
            <li>Binding arbitration or courts of [Your Jurisdiction], if mediation fails</li>
          </ol>

          <h3 className="text-xl font-semibold mt-4">13.3 Class Action Waiver</h3>
          <p>
            You agree to resolve disputes on an individual basis only. You waive any right
            to participate in class actions or class-wide arbitration.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">14. General Provisions</h2>

          <h3 className="text-xl font-semibold mt-4">14.1 Entire Agreement</h3>
          <p>
            These Terms, together with our Privacy Policy, constitute the entire agreement
            between you and License Manager regarding the App.
          </p>

          <h3 className="text-xl font-semibold mt-4">14.2 Severability</h3>
          <p>
            If any provision of these Terms is found to be unenforceable, the remaining
            provisions will remain in full force and effect.
          </p>

          <h3 className="text-xl font-semibold mt-4">14.3 Waiver</h3>
          <p>
            Our failure to enforce any provision of these Terms does not constitute a waiver
            of that provision or our right to enforce it later.
          </p>

          <h3 className="text-xl font-semibold mt-4">14.4 Assignment</h3>
          <p>
            You may not assign or transfer these Terms without our written consent. We may
            assign our rights and obligations to any third party.
          </p>

          <h3 className="text-xl font-semibold mt-4">14.5 Force Majeure</h3>
          <p>
            We are not liable for any failure to perform due to circumstances beyond our
            reasonable control (e.g., natural disasters, wars, pandemics, internet outages).
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">15. Contact Information</h2>
          <p>
            If you have questions about these Terms, please contact us at:
          </p>
          <div className="bg-gray-50 p-4 rounded-lg mt-4">
            <p><strong>Email:</strong> support@license-manager.app</p>
            <p><strong>Response Time:</strong> We aim to respond within 48 hours</p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">16. Acknowledgment</h2>
          <p>
            BY INSTALLING AND USING LICENSE MANAGER, YOU ACKNOWLEDGE THAT YOU HAVE READ,
            UNDERSTOOD, AND AGREE TO BE BOUND BY THESE TERMS OF SERVICE.
          </p>
        </section>
      </div>

      <div className="mt-12 pt-8 border-t border-gray-200">
        <p className="text-sm text-gray-500 text-center">
          These Terms of Service are effective as of the date listed above and apply to all users of License Manager.
        </p>
      </div>
    </div>
  );
}
