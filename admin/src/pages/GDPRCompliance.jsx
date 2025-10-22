import React from 'react';
import { Shield, Database, Lock, FileText, UserCheck, Bell } from 'lucide-react';

export default function GDPRCompliance() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-4">GDPR Compliance</h1>
      <p className="text-gray-600 mb-8">
        How License Manager protects your data and ensures compliance with the General Data Protection Regulation
      </p>

      <div className="prose prose-lg max-w-none space-y-8">
        <section className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
            <h2 className="text-2xl font-semibold m-0">Our Commitment to GDPR</h2>
          </div>
          <p className="mb-0">
            License Manager is fully committed to compliance with the General Data Protection Regulation (GDPR)
            and respecting the privacy rights of individuals in the European Economic Area (EEA). We have
            implemented technical and organizational measures to ensure your data is processed lawfully,
            fairly, and transparently.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">GDPR Principles We Follow</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-2">Lawfulness & Transparency</h3>
              <p className="text-sm text-gray-600">
                We process data only for legitimate purposes and provide clear information
                about our data practices in our Privacy Policy.
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-2">Purpose Limitation</h3>
              <p className="text-sm text-gray-600">
                We collect data only for specific, explicit purposes (license management and delivery)
                and do not use it for unrelated purposes.
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-2">Data Minimization</h3>
              <p className="text-sm text-gray-600">
                We collect only the minimum data necessary to provide our service and process orders.
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-2">Accuracy</h3>
              <p className="text-sm text-gray-600">
                We sync data directly from Shopify to ensure accuracy and allow you to update
                information at any time.
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-2">Storage Limitation</h3>
              <p className="text-sm text-gray-600">
                We retain data only as long as necessary and automatically delete shop data
                within 48 hours of app uninstallation.
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-2">Security</h3>
              <p className="text-sm text-gray-600">
                We implement industry-standard security measures including encryption,
                access controls, and regular security audits.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <UserCheck className="w-7 h-7 text-green-600" />
            <h2 className="text-2xl font-semibold m-0">Your GDPR Rights</h2>
          </div>

          <p>Under GDPR, you and your customers have the following rights:</p>

          <div className="space-y-3">
            <div className="bg-gray-50 border-l-4 border-green-500 p-4">
              <h3 className="font-semibold mb-1">Right to Access (Article 15)</h3>
              <p className="text-sm text-gray-700 mb-0">
                Request a copy of all personal data we hold. We will provide this information
                in a structured, commonly used format within 30 days.
              </p>
            </div>

            <div className="bg-gray-50 border-l-4 border-blue-500 p-4">
              <h3 className="font-semibold mb-1">Right to Rectification (Article 16)</h3>
              <p className="text-sm text-gray-700 mb-0">
                Request correction of inaccurate or incomplete data. You can update most
                information directly through your Shopify admin.
              </p>
            </div>

            <div className="bg-gray-50 border-l-4 border-red-500 p-4">
              <h3 className="font-semibold mb-1">Right to Erasure / "Right to be Forgotten" (Article 17)</h3>
              <p className="text-sm text-gray-700 mb-0">
                Request deletion of personal data. We automatically handle this through Shopify's
                GDPR webhooks and can also process manual requests.
              </p>
            </div>

            <div className="bg-gray-50 border-l-4 border-yellow-500 p-4">
              <h3 className="font-semibold mb-1">Right to Restriction (Article 18)</h3>
              <p className="text-sm text-gray-700 mb-0">
                Request that we limit how we process your data in certain circumstances.
              </p>
            </div>

            <div className="bg-gray-50 border-l-4 border-purple-500 p-4">
              <h3 className="font-semibold mb-1">Right to Data Portability (Article 20)</h3>
              <p className="text-sm text-gray-700 mb-0">
                Request your data in a machine-readable format to transfer to another service.
              </p>
            </div>

            <div className="bg-gray-50 border-l-4 border-orange-500 p-4">
              <h3 className="font-semibold mb-1">Right to Object (Article 21)</h3>
              <p className="text-sm text-gray-700 mb-0">
                Object to processing of your personal data based on legitimate interests.
              </p>
            </div>

            <div className="bg-gray-50 border-l-4 border-pink-500 p-4">
              <h3 className="font-semibold mb-1">Right to Withdraw Consent (Article 7)</h3>
              <p className="text-sm text-gray-700 mb-0">
                Withdraw consent at any time where processing is based on consent.
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <p className="text-sm mb-0">
              <strong>How to Exercise Your Rights:</strong> Contact us at support@license-manager.app
              with your request. We will respond within 30 days as required by GDPR.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-7 h-7 text-purple-600" />
            <h2 className="text-2xl font-semibold m-0">Automated GDPR Webhook Handling</h2>
          </div>

          <p>
            We have implemented Shopify's mandatory GDPR webhooks to automatically handle data requests:
          </p>

          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <FileText className="w-6 h-6 text-blue-600 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">customers/data_request</h3>
                  <p className="text-sm text-gray-700 mb-2">
                    When a customer requests their data through Shopify, we automatically:
                  </p>
                  <ul className="text-sm text-gray-600 list-disc ml-5 space-y-1">
                    <li>Collect all order information associated with the customer</li>
                    <li>Gather email delivery logs and license allocations</li>
                    <li>Log the request for compliance audit trail</li>
                    <li>Prepare the data for secure delivery to the customer</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Lock className="w-6 h-6 text-red-600 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">customers/redact</h3>
                  <p className="text-sm text-gray-700 mb-2">
                    48 hours after a customer requests data deletion, we automatically:
                  </p>
                  <ul className="text-sm text-gray-600 list-disc ml-5 space-y-1">
                    <li>Anonymize customer information in orders (name, email, address)</li>
                    <li>Redact email addresses in email delivery logs</li>
                    <li>Remove any personally identifiable information (PII)</li>
                    <li>Log the redaction for compliance audit trail</li>
                    <li>Preserve order numbers and license data for business records</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Database className="w-6 h-6 text-purple-600 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">shop/redact</h3>
                  <p className="text-sm text-gray-700 mb-2">
                    48 hours after you uninstall our app, we automatically:
                  </p>
                  <ul className="text-sm text-gray-600 list-disc ml-5 space-y-1">
                    <li>Delete all shop data including access tokens</li>
                    <li>Remove all products, licenses, and inventory data</li>
                    <li>Delete all orders, email logs, and customer information</li>
                    <li>Remove email templates and system settings</li>
                    <li>Permanently delete the shop record from our database</li>
                    <li>Log the deletion for compliance audit trail</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm mb-0">
              <strong>Fully Automated:</strong> These webhooks are processed automatically by our system
              with no manual intervention required. All actions are logged for compliance auditing.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <Lock className="w-7 h-7 text-red-600" />
            <h2 className="text-2xl font-semibold m-0">Security Measures</h2>
          </div>

          <p>We implement comprehensive security measures to protect your data:</p>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Technical Measures</h3>
              <ul className="text-sm text-gray-600 space-y-1 list-disc ml-5">
                <li>HTTPS/TLS encryption for all data transmission</li>
                <li>Encrypted database storage</li>
                <li>HMAC-SHA256 webhook verification</li>
                <li>SQL injection prevention (prepared statements)</li>
                <li>Regular security updates and patches</li>
                <li>Access logging and monitoring</li>
              </ul>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Organizational Measures</h3>
              <ul className="text-sm text-gray-600 space-y-1 list-disc ml-5">
                <li>Limited employee access to data</li>
                <li>Role-based access controls</li>
                <li>Regular security training</li>
                <li>Data processing agreements with vendors</li>
                <li>Incident response procedures</li>
                <li>Regular compliance audits</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="w-7 h-7 text-orange-600" />
            <h2 className="text-2xl font-semibold m-0">Data Breach Notification</h2>
          </div>

          <p>
            In the event of a data breach that poses a risk to your rights and freedoms, we will:
          </p>
          <ul className="list-disc ml-6 space-y-2">
            <li>Notify the relevant supervisory authority within 72 hours of discovery</li>
            <li>Notify affected individuals without undue delay if high risk exists</li>
            <li>Provide details about the nature of the breach and affected data</li>
            <li>Describe measures taken to address the breach</li>
            <li>Provide recommendations to mitigate potential harm</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">International Data Transfers</h2>
          <p>
            Our data is stored on servers located in the United States. If you are in the EEA,
            this means your data will be transferred outside the EEA. We ensure adequate protection
            through:
          </p>
          <ul className="list-disc ml-6 space-y-2">
            <li>Compliance with GDPR requirements for international transfers</li>
            <li>Use of Standard Contractual Clauses (SCCs) where applicable</li>
            <li>Ensuring our cloud providers (Google Cloud, Vercel, Railway) have appropriate safeguards</li>
            <li>Implementing supplementary measures to protect transferred data</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">Data Processing Agreements</h2>
          <p>
            We act as a Data Processor on behalf of Shopify merchants (Data Controllers). Upon request,
            we can provide a Data Processing Agreement (DPA) that outlines:
          </p>
          <ul className="list-disc ml-6 space-y-2">
            <li>The nature and purpose of data processing</li>
            <li>Types of personal data processed</li>
            <li>Categories of data subjects</li>
            <li>Our obligations as a processor</li>
            <li>Your rights as a controller</li>
            <li>Sub-processor arrangements</li>
            <li>Data retention and deletion procedures</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">Third-Party Sub-Processors</h2>
          <p>
            We use the following sub-processors to provide our service:
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="border border-gray-200 px-4 py-2 text-left">Provider</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">Purpose</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">Location</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-200 px-4 py-2">Google Cloud Platform</td>
                  <td className="border border-gray-200 px-4 py-2">Database hosting</td>
                  <td className="border border-gray-200 px-4 py-2">United States</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 px-4 py-2">Vercel</td>
                  <td className="border border-gray-200 px-4 py-2">Frontend hosting</td>
                  <td className="border border-gray-200 px-4 py-2">United States</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 px-4 py-2">Railway</td>
                  <td className="border border-gray-200 px-4 py-2">Backend hosting</td>
                  <td className="border border-gray-200 px-4 py-2">United States</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 px-4 py-2">SendGrid</td>
                  <td className="border border-gray-200 px-4 py-2">Email delivery</td>
                  <td className="border border-gray-200 px-4 py-2">United States</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            All sub-processors are contractually bound to GDPR-compliant data protection terms.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">Contact Our Data Protection Officer</h2>
          <p>
            For GDPR-related inquiries, data subject requests, or concerns about data processing:
          </p>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p><strong>Email:</strong> dpo@license-manager.app</p>
            <p><strong>General Support:</strong> support@license-manager.app</p>
            <p><strong>Response Time:</strong> Within 30 days as required by GDPR</p>
          </div>
        </section>

        <section className="bg-green-50 border border-green-200 rounded-lg p-6 mt-8">
          <h2 className="text-2xl font-semibold mb-4">Supervisory Authority</h2>
          <p className="mb-0">
            If you believe your GDPR rights have been violated, you have the right to lodge a
            complaint with your local data protection supervisory authority. You can find your
            local authority at{' '}
            <a
              href="https://edpb.europa.eu/about-edpb/about-edpb/members_en"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              https://edpb.europa.eu/about-edpb/about-edpb/members_en
            </a>
          </p>
        </section>
      </div>

      <div className="mt-12 pt-8 border-t border-gray-200">
        <p className="text-sm text-gray-500 text-center">
          This GDPR compliance information is current as of {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>
    </div>
  );
}
