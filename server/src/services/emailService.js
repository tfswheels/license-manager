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
  licenses 
}) {
  try {
    // Get template for this product
    const template = await getTemplateForProduct(productId);

    // Prepare template variables
    const variables = {
      first_name: firstName || 'Customer',
      last_name: lastName || '',
      order_number: orderNumber,
      product_name: productName,
      license_keys: formatLicenseKeys(licenses, true), // HTML format
      license_keys_text: formatLicenseKeys(licenses, false) // Text format
    };

    // Render HTML and text content
    const htmlContent = renderTemplate(template.email_html_template, variables);
    const textContent = renderTemplate(template.email_text_template, {
      ...variables,
      license_keys: variables.license_keys_text // Use text format for plain email
    });
    const subject = renderTemplate(template.email_subject, variables);

    const msg = {
      to: email,
      from: {
        email: process.env.FROM_EMAIL,
        name: process.env.FROM_NAME
      },
      subject: subject,
      text: textContent,
      html: htmlContent
    };

    await sgMail.send(msg);
    console.log(`✅ Email sent to ${email} using template: ${template.template_name}`);
    
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