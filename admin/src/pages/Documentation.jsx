import React from 'react';

export default function Documentation() {
  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <h1 className="text-4xl font-bold mb-4">DigiKey HQ Documentation</h1>
      <p className="text-xl text-gray-600 mb-8">Complete guide to license key delivery automation for your Shopify store</p>

      <div className="prose prose-lg max-w-none space-y-8">

        {/* Table of Contents */}
        <nav className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <h2 className="text-2xl font-bold mb-4 mt-0">Table of Contents</h2>
          <ol className="list-decimal ml-6 space-y-2">
            <li><a href="#getting-started" className="text-blue-600 hover:underline">Getting Started</a></li>
            <li><a href="#features" className="text-blue-600 hover:underline">Features Overview</a></li>
            <li><a href="#products" className="text-blue-600 hover:underline">Product Management</a></li>
            <li><a href="#licenses" className="text-blue-600 hover:underline">License Management</a></li>
            <li><a href="#templates" className="text-blue-600 hover:underline">Email Templates</a></li>
            <li><a href="#template-rules" className="text-blue-600 hover:underline">Template Assignment Rules</a></li>
            <li><a href="#settings" className="text-blue-600 hover:underline">Settings & Configuration</a></li>
            <li><a href="#orders" className="text-blue-600 hover:underline">Order Processing</a></li>
            <li><a href="#best-practices" className="text-blue-600 hover:underline">Best Practices</a></li>
            <li><a href="#troubleshooting" className="text-blue-600 hover:underline">Troubleshooting</a></li>
            <li><a href="#faq" className="text-blue-600 hover:underline">Frequently Asked Questions</a></li>
          </ol>
        </nav>

        {/* Getting Started */}
        <section id="getting-started" className="space-y-4">
          <h2 className="text-3xl font-bold mt-12">1. Getting Started</h2>

          <h3 className="text-2xl font-semibold mt-6">Quick Setup (3 steps)</h3>
          <ol className="list-decimal ml-6 space-y-3">
            <li>
              <strong>Import Products:</strong> Go to Products page and click "Fetch from Shopify" to import your digital product catalog.
            </li>
            <li>
              <strong>Add License Keys:</strong> Click on any product to manage licenses. Upload license keys via CSV or add them individually.
            </li>
            <li>
              <strong>Configure Email (Optional):</strong> Create custom email templates in the Templates section, or use the default template.
            </li>
          </ol>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
            <p className="font-semibold text-green-900">✓ That's it! Your store is ready to deliver license keys automatically.</p>
            <p className="text-green-800 mt-2">When customers purchase your products, license keys will be delivered instantly via email.</p>
          </div>
        </section>

        {/* Features Overview */}
        <section id="features" className="space-y-4">
          <h2 className="text-3xl font-bold mt-12">2. Features Overview</h2>

          <h3 className="text-2xl font-semibold mt-6">Core Features</h3>
          <ul className="list-disc ml-6 space-y-2">
            <li><strong>Automatic License Delivery:</strong> Instantly email license keys when orders are placed</li>
            <li><strong>Bulk License Management:</strong> Upload hundreds of keys via CSV import</li>
            <li><strong>Custom Email Templates:</strong> Design branded emails with HTML/CSS or use drag-and-drop builder</li>
            <li><strong>Template Assignment Rules:</strong> Automatically assign templates based on product tags, vendor, price, or collections</li>
            <li><strong>Inventory Tracking:</strong> Monitor license key availability and receive low-stock alerts</li>
            <li><strong>Order History:</strong> Complete audit trail of all license deliveries</li>
            <li><strong>Multi-Shop Support:</strong> Manage multiple stores from one account</li>
            <li><strong>GDPR Compliant:</strong> Automatic data handling per privacy regulations</li>
          </ul>

          <h3 className="text-2xl font-semibold mt-6">Advanced Features</h3>
          <ul className="list-disc ml-6 space-y-2">
            <li><strong>Uniqueness Enforcement:</strong> Prevent duplicate license key assignments</li>
            <li><strong>Delivery Methods:</strong> FIFO (First In, First Out) or LIFO (Last In, First Out)</li>
            <li><strong>Out-of-Stock Handling:</strong> Send placeholder emails or skip delivery when licenses run out</li>
            <li><strong>Reply-To Email:</strong> Automatically set to your shop email for customer replies</li>
            <li><strong>Free License Allocation:</strong> Add complimentary keys for any product</li>
            <li><strong>Responsive Design:</strong> Works perfectly on desktop, tablet, and mobile</li>
          </ul>
        </section>

        {/* Products */}
        <section id="products" className="space-y-4">
          <h2 className="text-3xl font-bold mt-12">3. Product Management</h2>

          <h3 className="text-2xl font-semibold mt-6">Importing Products</h3>
          <p>
            The Products page displays all your digital products. To sync with Shopify:
          </p>
          <ol className="list-decimal ml-6 space-y-2">
            <li>Navigate to <strong>Products</strong> in the sidebar</li>
            <li>Click the <strong>"Fetch from Shopify"</strong> button</li>
            <li>Products will automatically sync with tags, vendor, and pricing</li>
          </ol>

          <h3 className="text-2xl font-semibold mt-6">Product Information</h3>
          <p>Each product displays:</p>
          <ul className="list-disc ml-6 space-y-2">
            <li><strong>Product Name:</strong> Synced from Shopify</li>
            <li><strong>Tags:</strong> Used for template assignment rules</li>
            <li><strong>Vendor:</strong> Product manufacturer/publisher</li>
            <li><strong>Price:</strong> Current product price</li>
            <li><strong>Template:</strong> Currently assigned email template</li>
            <li><strong>Licenses:</strong> Available license count and inventory status</li>
          </ul>

          <h3 className="text-2xl font-semibold mt-6">Managing License Keys</h3>
          <p>Click <strong>"Manage Licenses"</strong> on any product to:</p>
          <ul className="list-disc ml-6 space-y-2">
            <li>View all available license keys</li>
            <li>Add individual license keys manually</li>
            <li>Bulk upload via CSV file</li>
            <li>Delete unused licenses</li>
            <li>Monitor which keys are assigned to orders</li>
          </ul>
        </section>

        {/* Licenses */}
        <section id="licenses" className="space-y-4">
          <h2 className="text-3xl font-bold mt-12">4. License Management</h2>

          <h3 className="text-2xl font-semibold mt-6">Adding Licenses Individually</h3>
          <ol className="list-decimal ml-6 space-y-2">
            <li>Go to Products → Click product → Manage Licenses</li>
            <li>Enter license key in the input field</li>
            <li>Click <strong>"Add License"</strong></li>
            <li>License is immediately available for orders</li>
          </ol>

          <h3 className="text-2xl font-semibold mt-6">CSV Bulk Upload</h3>
          <p>To import hundreds or thousands of license keys:</p>
          <ol className="list-decimal ml-6 space-y-2">
            <li>Create a CSV file with one license key per line</li>
            <li>Click <strong>"Upload CSV"</strong> button</li>
            <li>Select your file</li>
            <li>Review the upload summary</li>
            <li>All licenses are now available</li>
          </ol>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <p className="font-semibold text-blue-900">CSV Format Example:</p>
            <pre className="bg-white p-3 rounded mt-2 text-sm">
{`AAAA-BBBB-CCCC-1111
AAAA-BBBB-CCCC-2222
AAAA-BBBB-CCCC-3333`}
            </pre>
            <p className="text-blue-800 mt-2">Each line is one license key. No headers needed.</p>
          </div>

          <h3 className="text-2xl font-semibold mt-6">License States</h3>
          <ul className="list-disc ml-6 space-y-2">
            <li><strong>Available:</strong> Ready to be assigned to orders</li>
            <li><strong>Used:</strong> Already delivered to a customer (displayed in Orders section)</li>
            <li><strong>Inventory Tracking:</strong> Monitor available count on Products page</li>
          </ul>

          <h3 className="text-2xl font-semibold mt-6">Free License Allocation</h3>
          <p>
            Add complimentary licenses for any product without requiring payment:
          </p>
          <ol className="list-decimal ml-6 space-y-2">
            <li>Go to Orders page</li>
            <li>Click <strong>"Add Free License"</strong></li>
            <li>Select product and enter customer email</li>
            <li>License is delivered immediately</li>
          </ol>
        </section>

        {/* Templates */}
        <section id="templates" className="space-y-4">
          <h2 className="text-3xl font-bold mt-12">5. Email Templates</h2>

          <h3 className="text-2xl font-semibold mt-6">Creating Templates</h3>
          <ol className="list-decimal ml-6 space-y-2">
            <li>Navigate to <strong>Templates</strong></li>
            <li>Click <strong>"Create New Template"</strong></li>
            <li>Enter template name (e.g., "Software License Email")</li>
            <li>Design your email using HTML or plain text</li>
            <li>Click <strong>"Save Template"</strong></li>
          </ol>

          <h3 className="text-2xl font-semibold mt-6">Available Variables</h3>
          <p>Use these placeholders in your template (they'll be replaced automatically):</p>
          <ul className="list-disc ml-6 space-y-2 font-mono text-sm bg-gray-50 p-4 rounded">
            <li>{'{{customer_name}}'} - Customer's full name</li>
            <li>{'{{customer_email}}'} - Customer's email address</li>
            <li>{'{{order_number}}'} - Shopify order number</li>
            <li>{'{{product_name}}'} - Product title</li>
            <li>{'{{license_key}}'} - The license key being delivered</li>
            <li>{'{{shop_name}}'} - Your store name</li>
            <li>{'{{order_date}}'} - Date order was placed</li>
          </ul>

          <h3 className="text-2xl font-semibold mt-6">HTML vs Plain Text</h3>
          <ul className="list-disc ml-6 space-y-2">
            <li><strong>HTML Template:</strong> Full design control with styling, logos, colors, tables</li>
            <li><strong>Plain Text Template:</strong> Simple, accessible, works in all email clients</li>
            <li><strong>Best Practice:</strong> Provide both versions for maximum compatibility</li>
          </ul>

          <h3 className="text-2xl font-semibold mt-6">Template Example</h3>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
            <p className="font-semibold mb-2">Subject: Your License Key for {'{{product_name}}'}</p>
            <pre className="bg-white p-3 rounded text-sm whitespace-pre-wrap">
{`Hi {{customer_name}},

Thank you for your purchase! Here is your license key for {{product_name}}:

License Key: {{license_key}}

Order Number: {{order_number}}
Order Date: {{order_date}}

If you have any questions, just reply to this email.

Best regards,
{{shop_name}}`}
            </pre>
          </div>

          <h3 className="text-2xl font-semibold mt-6">Editing Templates</h3>
          <p>
            Click the <strong>Edit</strong> button on any template to modify it. Changes apply immediately to future orders.
          </p>

          <h3 className="text-2xl font-semibold mt-6">Deleting Templates</h3>
          <p>
            Templates can be deleted if they're not assigned to any products. Unassign from products first via Template Rules page.
          </p>
        </section>

        {/* Template Rules */}
        <section id="template-rules" className="space-y-4">
          <h2 className="text-3xl font-bold mt-12">6. Template Assignment Rules</h2>

          <h3 className="text-2xl font-semibold mt-6">What Are Template Rules?</h3>
          <p>
            Template assignment rules automatically assign the right email template to products based on their attributes.
            This saves you from manually assigning templates to hundreds of products.
          </p>

          <h3 className="text-2xl font-semibold mt-6">Rule Types</h3>
          <ul className="list-disc ml-6 space-y-3">
            <li>
              <strong>Tag Rules:</strong> Assign templates based on product tags
              <ul className="list-circle ml-6 mt-1 text-sm">
                <li>Example: All products tagged "software" use "Software License Email"</li>
              </ul>
            </li>
            <li>
              <strong>Vendor Rules:</strong> Assign templates by product vendor/manufacturer
              <ul className="list-circle ml-6 mt-1 text-sm">
                <li>Example: All "Adobe" products use "Adobe License Template"</li>
              </ul>
            </li>
            <li>
              <strong>Price Range Rules:</strong> Assign templates by price brackets
              <ul className="list-circle ml-6 mt-1 text-sm">
                <li>Example: Products over $100 use "Premium License Email"</li>
              </ul>
            </li>
            <li>
              <strong>Collection Rules:</strong> Assign templates by product collections (coming soon)
            </li>
          </ul>

          <h3 className="text-2xl font-semibold mt-6">Creating Rules</h3>
          <ol className="list-decimal ml-6 space-y-2">
            <li>Navigate to <strong>Template Rules</strong></li>
            <li>Click <strong>"Add Rule"</strong></li>
            <li>Select rule type (Tag, Vendor, Price Range)</li>
            <li>Enter rule value (e.g., "software", "Adobe", "$50-$100")</li>
            <li>Select which template to assign</li>
            <li>Set priority (lower number = higher priority)</li>
            <li>Click <strong>"Save"</strong></li>
          </ol>

          <h3 className="text-2xl font-semibold mt-6">Rule Priority</h3>
          <p>
            When multiple rules match a product, the rule with the <strong>lowest priority number wins</strong>:
          </p>
          <ul className="list-disc ml-6 space-y-2">
            <li>Priority 1 = Highest priority (applied first)</li>
            <li>Priority 100 = Lower priority (default)</li>
            <li>Priority 999 = Lowest priority (fallback)</li>
          </ul>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
            <p className="font-semibold text-yellow-900">Example Scenario:</p>
            <p className="text-yellow-800 mt-2">
              Product "Adobe Photoshop" has tag "software" and vendor "Adobe":<br/>
              • Rule 1 (Priority 10): Tag "software" → Template A<br/>
              • Rule 2 (Priority 20): Vendor "Adobe" → Template B<br/>
              <br/>
              <strong>Result:</strong> Template A is used (lower priority number wins)
            </p>
          </div>

          <h3 className="text-2xl font-semibold mt-6">Applying Rules</h3>
          <p>
            After creating rules, click <strong>"Apply Rules to All Products"</strong> to automatically assign templates
            to your entire catalog. Rules are also applied automatically when syncing new products from Shopify.
          </p>

          <h3 className="text-2xl font-semibold mt-6">Exclusion Tags</h3>
          <p>
            Set an exclusion tag in Settings to bypass template rules for specific products. Products with this tag
            will keep their manually assigned template, ignoring all automatic rules.
          </p>
        </section>

        {/* Settings */}
        <section id="settings" className="space-y-4">
          <h2 className="text-3xl font-bold mt-12">7. Settings & Configuration</h2>

          <h3 className="text-2xl font-semibold mt-6">License Delivery Settings</h3>
          <ul className="list-disc ml-6 space-y-2">
            <li>
              <strong>Delivery Method:</strong>
              <ul className="list-circle ml-6 mt-1">
                <li><strong>FIFO (First In, First Out):</strong> Oldest licenses delivered first</li>
                <li><strong>LIFO (Last In, First Out):</strong> Newest licenses delivered first</li>
              </ul>
            </li>
            <li>
              <strong>Enforce Unique Licenses:</strong> Prevent the same license from being used multiple times globally
            </li>
            <li>
              <strong>Enforce Unique Per Order:</strong> Prevent duplicate licenses within the same order (for multi-quantity purchases)
            </li>
          </ul>

          <h3 className="text-2xl font-semibold mt-6">Out-of-Stock Behavior</h3>
          <p>Choose what happens when a product runs out of license keys:</p>
          <ul className="list-disc ml-6 space-y-2">
            <li><strong>No Email:</strong> Skip sending email (silent failure, you'll be notified)</li>
            <li><strong>Send Placeholder:</strong> Send email with placeholder text explaining keys will arrive later</li>
          </ul>

          <h3 className="text-2xl font-semibold mt-6">Email Configuration</h3>
          <ul className="list-disc ml-6 space-y-2">
            <li><strong>From Email:</strong> mail@digikeyhq.com (verified domain)</li>
            <li><strong>From Name:</strong> DigiKey HQ (or customize)</li>
            <li><strong>Reply-To Email:</strong> Automatically set to your shop email (customers reply to you, not us)</li>
          </ul>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
            <p className="font-semibold text-green-900">✓ Reply-To Email Auto-Population</p>
            <p className="text-green-800 mt-2">
              Your shop email is automatically fetched from Shopify and set as the reply-to address.
              When customers reply to license emails, replies go directly to your inbox.
            </p>
          </div>

          <h3 className="text-2xl font-semibold mt-6">Notifications</h3>
          <ul className="list-disc ml-6 space-y-2">
            <li><strong>Admin Notification Email:</strong> Where to send alerts</li>
            <li><strong>Notify on Out of Stock:</strong> Get email when products run out of licenses</li>
            <li><strong>Notify on Uniqueness Issues:</strong> Get email when duplicate license problems occur</li>
          </ul>
        </section>

        {/* Orders */}
        <section id="orders" className="space-y-4">
          <h2 className="text-3xl font-bold mt-12">8. Order Processing</h2>

          <h3 className="text-2xl font-semibold mt-6">How Orders Work</h3>
          <ol className="list-decimal ml-6 space-y-2">
            <li>Customer places order on your Shopify store</li>
            <li>Shopify sends webhook notification to DigiKey HQ</li>
            <li>App identifies products requiring license keys</li>
            <li>License keys are assigned from available inventory</li>
            <li>Email is sent to customer using assigned template</li>
            <li>Order is recorded in Orders page with full details</li>
          </ol>

          <h3 className="text-2xl font-semibold mt-6">Viewing Orders</h3>
          <p>
            The Orders page shows all license deliveries with:
          </p>
          <ul className="list-disc ml-6 space-y-2">
            <li>Order number and date</li>
            <li>Customer name and email</li>
            <li>Product name</li>
            <li>License key delivered</li>
            <li>Email delivery status</li>
            <li>Template used</li>
          </ul>

          <h3 className="text-2xl font-semibold mt-6">Order Details</h3>
          <p>
            Click any order to see complete details including:
          </p>
          <ul className="list-disc ml-6 space-y-2">
            <li>Full customer information</li>
            <li>All line items with quantities</li>
            <li>License keys assigned to each item</li>
            <li>Email content sent to customer</li>
            <li>Delivery timestamp</li>
          </ul>

          <h3 className="text-2xl font-semibold mt-6">Multi-Quantity Orders</h3>
          <p>
            When customers order quantity &gt; 1, multiple unique license keys are automatically assigned
            and delivered in a single email (when "Enforce Unique Per Order" is enabled).
          </p>
        </section>

        {/* Best Practices */}
        <section id="best-practices" className="space-y-4">
          <h2 className="text-3xl font-bold mt-12">9. Best Practices</h2>

          <h3 className="text-2xl font-semibold mt-6">License Key Management</h3>
          <ul className="list-disc ml-6 space-y-2">
            <li>Maintain at least 20-50 available licenses per product</li>
            <li>Enable low-stock notifications to get alerts at 10 keys remaining</li>
            <li>Upload new licenses in bulk before running promotions</li>
            <li>Use CSV import for faster management of large key sets</li>
            <li>Enable uniqueness enforcement to prevent accidental duplicate assignments</li>
          </ul>

          <h3 className="text-2xl font-semibold mt-6">Email Templates</h3>
          <ul className="list-disc ml-6 space-y-2">
            <li>Include clear instructions on how to use the license key</li>
            <li>Provide download links for software products</li>
            <li>Add your support contact information</li>
            <li>Use both HTML and plain text versions</li>
            <li>Test templates by placing test orders</li>
            <li>Include order number for easy reference</li>
          </ul>

          <h3 className="text-2xl font-semibold mt-6">Template Rules</h3>
          <ul className="list-disc ml-6 space-y-2">
            <li>Start with broad rules (e.g., tag-based) at priority 100</li>
            <li>Add specific overrides (e.g., vendor-based) at priority 10-50</li>
            <li>Use exclusion tags for special products that need manual template assignment</li>
            <li>Re-apply rules after making changes to ensure consistency</li>
            <li>Review product assignments after creating new rules</li>
          </ul>

          <h3 className="text-2xl font-semibold mt-6">Security</h3>
          <ul className="list-disc ml-6 space-y-2">
            <li>Monitor Orders page for any suspicious activity</li>
            <li>Verify email delivery status regularly</li>
            <li>Keep license inventory updated and accurate</li>
            <li>Review GDPR compliance settings periodically</li>
          </ul>

          <h3 className="text-2xl font-semibold mt-6">Customer Experience</h3>
          <ul className="list-disc ml-6 space-y-2">
            <li>Test the complete purchase flow from customer perspective</li>
            <li>Ensure emails are professional and branded</li>
            <li>Provide clear activation/installation instructions</li>
            <li>Set reply-to email so customer replies reach you directly</li>
            <li>Include links to support resources or FAQs</li>
          </ul>
        </section>

        {/* Troubleshooting */}
        <section id="troubleshooting" className="space-y-4">
          <h2 className="text-3xl font-bold mt-12">10. Troubleshooting</h2>

          <h3 className="text-2xl font-semibold mt-6">Products Not Syncing</h3>
          <p><strong>Problem:</strong> "Fetch from Shopify" doesn't import products</p>
          <p><strong>Solutions:</strong></p>
          <ul className="list-disc ml-6 space-y-2">
            <li>Verify app has read_products permission in Shopify admin</li>
            <li>Check that products exist in your Shopify store</li>
            <li>Try refreshing the page and clicking "Fetch from Shopify" again</li>
            <li>Check browser console for error messages</li>
          </ul>

          <h3 className="text-2xl font-semibold mt-6">Licenses Not Delivered</h3>
          <p><strong>Problem:</strong> Customer placed order but didn't receive license email</p>
          <p><strong>Solutions:</strong></p>
          <ul className="list-disc ml-6 space-y-2">
            <li>Check Orders page to see if order was processed</li>
            <li>Verify product has available license keys</li>
            <li>Check spam/junk folder for email</li>
            <li>Confirm customer email is correct in Shopify order</li>
            <li>Review Settings → Out-of-Stock Behavior configuration</li>
            <li>Check if product has an assigned email template</li>
          </ul>

          <h3 className="text-2xl font-semibold mt-6">Template Rules Not Working</h3>
          <p><strong>Problem:</strong> Products not getting correct template assigned</p>
          <p><strong>Solutions:</strong></p>
          <ul className="list-disc ml-6 space-y-2">
            <li>Click "Apply Rules to All Products" after creating/editing rules</li>
            <li>Check rule priority - lower numbers win</li>
            <li>Verify product has tags/vendor that match your rules</li>
            <li>Check if product has exclusion tag set in Settings</li>
            <li>Review rule order and priority settings</li>
          </ul>

          <h3 className="text-2xl font-semibold mt-6">CSV Upload Fails</h3>
          <p><strong>Problem:</strong> Bulk license upload doesn't work</p>
          <p><strong>Solutions:</strong></p>
          <ul className="list-disc ml-6 space-y-2">
            <li>Ensure CSV has one license key per line</li>
            <li>Remove any headers or extra columns</li>
            <li>Check for special characters or encoding issues</li>
            <li>Save as UTF-8 CSV format</li>
            <li>Try uploading smaller batches if file is very large</li>
          </ul>

          <h3 className="text-2xl font-semibold mt-6">Dashboard Shows Wrong Store</h3>
          <p><strong>Problem:</strong> Seeing data from different Shopify store</p>
          <p><strong>Solutions:</strong></p>
          <ul className="list-disc ml-6 space-y-2">
            <li>Clear browser cache and cookies</li>
            <li>Re-install the app from correct store</li>
            <li>Check URL has correct ?shop= parameter</li>
            <li>Log out and log back in through Shopify admin</li>
          </ul>

          <h3 className="text-2xl font-semibold mt-6">Need More Help?</h3>
          <p>
            Contact support at <a href="mailto:support@digikeyhq.com" className="text-blue-600 hover:underline">support@digikeyhq.com</a> or
            visit our <a href="https://digikeyhq.com/privacy-policy" className="text-blue-600 hover:underline">Privacy Policy</a> and{' '}
            <a href="https://digikeyhq.com/terms-of-service" className="text-blue-600 hover:underline">Terms of Service</a>.
          </p>
        </section>

        {/* FAQ */}
        <section id="faq" className="space-y-4">
          <h2 className="text-3xl font-bold mt-12">11. Frequently Asked Questions</h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold">Q: How are license keys delivered?</h3>
              <p className="mt-2">
                A: License keys are sent via email immediately when an order is placed. The email is sent to the
                customer's email address from their Shopify order using your configured email template.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold">Q: Can I use my own email domain?</h3>
              <p className="mt-2">
                A: Currently, emails are sent from mail@digikeyhq.com with your shop email as the reply-to address.
                This means customer replies come directly to you. Custom sender domains require domain verification
                and are available on Enterprise plans.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold">Q: What happens if I run out of license keys?</h3>
              <p className="mt-2">
                A: You can configure this in Settings. Options are: (1) Don't send email and notify admin, or
                (2) Send email with placeholder text explaining keys will arrive later. You'll receive a notification
                either way if enabled.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold">Q: Can I manually send a license key to a customer?</h3>
              <p className="mt-2">
                A: Yes! Use the "Add Free License" feature on the Orders page. Select the product, enter the
                customer's email, and a license will be delivered immediately.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold">Q: Do you store customer payment information?</h3>
              <p className="mt-2">
                A: No. We never see or store payment information. All payments are processed by Shopify. We only
                receive order notifications to deliver license keys.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold">Q: Is this app GDPR compliant?</h3>
              <p className="mt-2">
                A: Yes. We have GDPR webhook handlers for customer data requests, redaction, and shop redaction.
                View our <a href="/gdpr-compliance" className="text-blue-600 hover:underline">GDPR Compliance</a> page for details.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold">Q: Can I have different email templates for different products?</h3>
              <p className="mt-2">
                A: Absolutely! Create multiple templates and use Template Assignment Rules to automatically assign
                them based on tags, vendor, price, or collections.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold">Q: What format should my license keys be in?</h3>
              <p className="mt-2">
                A: Any format works! Common formats include: XXXX-XXXX-XXXX, serial numbers, activation codes,
                download URLs, or plain text keys. The system stores them as-is and delivers exactly what you upload.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold">Q: Can I track which licenses were sent to which customers?</h3>
              <p className="mt-2">
                A: Yes! The Orders page shows complete history of every license delivery including customer email,
                product, license key, and timestamp. Click any order for full details.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold">Q: What happens with multi-quantity orders?</h3>
              <p className="mt-2">
                A: When a customer orders quantity &gt; 1, multiple unique license keys are assigned and sent in one
                email. Enable "Enforce Unique Per Order" in Settings to guarantee no duplicates within the same order.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold">Q: Can I test the app before going live?</h3>
              <p className="mt-2">
                A: Yes! Install on a Shopify development store, add test products and licenses, then place test
                orders to see the complete flow. The free plan supports full functionality.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold">Q: How do I upgrade or change plans?</h3>
              <p className="mt-2">
                A: Plan management is handled through the Shopify App Store. Click "Manage subscription" in your
                Shopify admin or contact support for assistance.
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-gray-200">
          <p className="text-center text-gray-600">
            <strong>DigiKey HQ</strong> - Automated License Key Delivery for Shopify
          </p>
          <p className="text-center text-sm text-gray-500 mt-2">
            Need help? Email <a href="mailto:support@digikeyhq.com" className="text-blue-600 hover:underline">support@digikeyhq.com</a>
          </p>
          <p className="text-center text-sm text-gray-500 mt-4">
            <a href="/privacy-policy" className="text-blue-600 hover:underline">Privacy Policy</a>
            {' • '}
            <a href="/terms-of-service" className="text-blue-600 hover:underline">Terms of Service</a>
            {' • '}
            <a href="/gdpr-compliance" className="text-blue-600 hover:underline">GDPR Compliance</a>
          </p>
        </footer>
      </div>
    </div>
  );
}
