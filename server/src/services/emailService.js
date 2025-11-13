// server/src/services/emailService.js
import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';
import { getTemplateForProduct, renderTemplate, formatLicenseKeys } from './templateService.js';

dotenv.config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Fetch shop email from Shopify API
 */
async function getShopEmail(shopDomain, accessToken) {
  try {
    const query = `
      query {
        shop {
          email
        }
      }
    `;

    const response = await fetch(`https://${shopDomain}/admin/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken
      },
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      console.error('Failed to fetch shop email:', response.status);
      return null;
    }

    const result = await response.json();
    return result.data?.shop?.email || null;
  } catch (error) {
    console.error('Error fetching shop email:', error);
    return null;
  }
}

export async function sendLicenseEmail({
  email,
  firstName,
  lastName,
  orderNumber,
  productName,
  productId,
  licenses,
  settings = null,
  placeholder = null,
  shopDomain = null,
  accessToken = null,
  shopName = null
}) {
  try {
    // Check if email is valid
    if (!email) {
      console.warn(`⚠️ No email address provided for order ${orderNumber}. Skipping email.`);
      return { success: false, reason: 'no_email' };
    }

    // Get template for this product
    const template = await getTemplateForProduct(productId);

    // Determine license keys to use (actual licenses or placeholder)
    let licenseKeysHtml, licenseKeysText;

    if (licenses.length > 0) {
      licenseKeysHtml = formatLicenseKeys(licenses, true);
      licenseKeysText = formatLicenseKeys(licenses, false);
    } else if (placeholder) {
      // Use placeholder when no licenses available
      licenseKeysHtml = `<div class="placeholder-message">${placeholder}</div>`;
      licenseKeysText = placeholder;
    } else {
      // Default placeholder if none provided
      licenseKeysHtml = '<div class="placeholder-message">License keys will be provided separately.</div>';
      licenseKeysText = 'License keys will be provided separately.';
    }

    // Prepare template variables
    const variables = {
      first_name: firstName || 'Customer',
      last_name: lastName || '',
      order_number: orderNumber,
      product_name: productName,
      license_keys: licenseKeysHtml,
      license_keys_text: licenseKeysText,
      shop_name: shopName || shopDomain || 'Our Store'
    };

    // Render HTML and text content
    const htmlContent = renderTemplate(template.email_html_template, variables);
    const textContent = renderTemplate(template.email_text_template, {
      ...variables,
      license_keys: variables.license_keys_text
    });
    const subject = renderTemplate(template.email_subject, variables);

    // Determine sender (use custom if configured, otherwise use defaults)
    const fromEmail = settings?.custom_sender_email || process.env.FROM_EMAIL || 'mail@digikeyhq.com';
    const fromName = settings?.custom_sender_name || process.env.FROM_NAME || 'DigiKey HQ';

    const msg = {
      to: email,
      from: {
        email: fromEmail,
        name: fromName
      },
      subject: subject,
      text: textContent,
      html: htmlContent
    };

    // Determine reply-to email
    // Priority: 1. User settings, 2. Shop email, 3. From email
    let replyToEmail = settings?.reply_to_email;

    if (!replyToEmail && shopDomain && accessToken) {
      // Fetch shop email from Shopify API to use as default reply-to
      const shopEmail = await getShopEmail(shopDomain, accessToken);
      if (shopEmail) {
        replyToEmail = shopEmail;
        console.log(`📧 Using shop email as reply-to: ${shopEmail}`);
      }
    }

    // If no reply-to found, use from email
    if (!replyToEmail) {
      replyToEmail = fromEmail;
    }

    msg.replyTo = replyToEmail;

    // Add BCC if enabled in settings
    if (settings?.bcc_notification_email && settings?.notification_email) {
      msg.bcc = settings.notification_email;
      console.log(`📧 BCC enabled, copying to: ${settings.notification_email}`);
    }

    await sgMail.send(msg);
    console.log(`✅ Email sent to ${email} using template: ${template.template_name} from ${fromEmail}`);

    return { success: true };

  } catch (error) {
    console.error('Email sending error:', error);
    if (error.response) {
      console.error('SendGrid error:', error.response.body);
    }
    throw error;
  }
}

export async function sendInventoryAlert({ productName, availableCount, threshold, toEmail }) {
  try {
    if (!toEmail) {
      console.error('No email address provided for inventory alert');
      return;
    }

    const msg = {
      to: toEmail,
      from: {
        email: process.env.SENDGRID_SENDER_EMAIL || 'mail@digikeyhq.com',
        name: process.env.FROM_NAME || 'DigiKey HQ'
      },
      subject: `⚠️ Low Inventory Alert: ${productName}`,
      text: `
Low inventory alert for ${productName}

Available licenses: ${availableCount}
Threshold: ${threshold}

Please upload more licenses to avoid running out.
      `,
      html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .alert { background-color: #ff9800; color: white; padding: 20px; border-radius: 5px; }
    .content { padding: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="alert">
      <h2>⚠️ Low Inventory Alert</h2>
    </div>
    <div class="content">
      <p><strong>Product:</strong> ${productName}</p>
      <p><strong>Available Licenses:</strong> ${availableCount}</p>
      <p><strong>Threshold:</strong> ${threshold}</p>
      <p>Please upload more licenses to avoid running out.</p>
    </div>
  </div>
</body>
</html>
      `
    };

    await sgMail.send(msg);
    console.log(`✅ Inventory alert sent for ${productName}`);

  } catch (error) {
    console.error('Inventory alert error:', error);
  }
}

export async function sendNotificationEmail({ to, subject, message }) {
  try {
    const msg = {
      to: to,
      from: {
        email: process.env.FROM_EMAIL || 'mail@digikeyhq.com',
        name: process.env.FROM_NAME || 'DigiKey HQ'
      },
      subject: subject,
      text: message,
      html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .notification { background-color: #2196F3; color: white; padding: 20px; border-radius: 5px; }
    .content { padding: 20px; background-color: #f5f5f5; border-radius: 5px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="notification">
      <h2>License Manager Notification</h2>
    </div>
    <div class="content">
      <p>${message}</p>
    </div>
  </div>
</body>
</html>
      `
    };

    await sgMail.send(msg);
    console.log(`✅ Notification email sent to ${to}: ${subject}`);

    return { success: true };

  } catch (error) {
    console.error('Notification email error:', error);
    if (error.response) {
      console.error('SendGrid error:', error.response.body);
    }
    // Don't throw - notifications shouldn't break the main flow
    return { success: false, error: error.message };
  }
}