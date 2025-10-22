// server/src/services/emailService.js
import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';
import { getTemplateForProduct, renderTemplate, formatLicenseKeys } from './templateService.js';

dotenv.config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function sendLicenseEmail({
  email,
  firstName,
  lastName,
  orderNumber,
  productName,
  productId,
  licenses,
  settings = null,
  placeholder = null
}) {
  try {
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
      license_keys_text: licenseKeysText
    };

    // Render HTML and text content
    const htmlContent = renderTemplate(template.email_html_template, variables);
    const textContent = renderTemplate(template.email_text_template, {
      ...variables,
      license_keys: variables.license_keys_text
    });
    const subject = renderTemplate(template.email_subject, variables);

    // Determine sender (use custom if configured, otherwise use defaults)
    const fromEmail = settings?.custom_sender_email || process.env.FROM_EMAIL;
    const fromName = settings?.custom_sender_name || process.env.FROM_NAME;

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

    // Add reply-to if configured (for SaaS multi-tenant setup)
    if (settings?.reply_to_email) {
      msg.replyTo = settings.reply_to_email;
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

export async function sendInventoryAlert({ productName, availableCount, threshold }) {
  try {
    const msg = {
      to: process.env.ADMIN_EMAIL,
      from: {
        email: process.env.FROM_EMAIL,
        name: process.env.FROM_NAME
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
        email: process.env.FROM_EMAIL,
        name: process.env.FROM_NAME || 'License Manager'
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