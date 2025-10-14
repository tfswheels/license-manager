import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function sendLicenseEmail({ email, firstName, orderNumber, productName, licenses }) {
  try {
    const licenseList = licenses.map((key, index) => 
      `${index + 1}. ${key}`
    ).join('\n');

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
    .content { background-color: #f9f9f9; padding: 30px; border-radius: 5px; margin-top: 20px; }
    .license-box { background-color: white; border: 2px solid #4CAF50; padding: 20px; margin: 20px 0; border-radius: 5px; }
    .license-key { font-family: 'Courier New', monospace; font-size: 16px; color: #2196F3; word-break: break-all; }
    .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Your License Key${licenses.length > 1 ? 's' : ''}</h1>
    </div>
    <div class="content">
      <p>Hey ${firstName},</p>
      
      <p>Thank you for your purchase! Your order <strong>#${orderNumber}</strong> has been confirmed.</p>
      
      <p><strong>Product:</strong> ${productName}</p>
      
      <div class="license-box">
        <p><strong>Your License Key${licenses.length > 1 ? 's' : ''}:</strong></p>
        ${licenses.map((key, i) => `
          <p class="license-key">${i + 1}. ${key}</p>
        `).join('')}
      </div>
      
      <p>Please save these license keys in a secure location. You'll need them to activate your product.</p>
      
      <p>If you have any questions or need assistance, please don't hesitate to contact us.</p>
      
      <p>Cheers!<br>${process.env.FROM_NAME || 'The Team'}</p>
    </div>
    <div class="footer">
      <p>This email was sent because you placed an order with us.</p>
    </div>
  </div>
</body>
</html>
    `;

    const textContent = `
Hey ${firstName},

Thank you for your purchase! Your order #${orderNumber} has been confirmed.

Product: ${productName}

Your License Key${licenses.length > 1 ? 's' : ''}:
${licenseList}

Please save these license keys in a secure location. You'll need them to activate your product.

If you have any questions or need assistance, please don't hesitate to contact us.

Cheers!
${process.env.FROM_NAME || 'The Team'}
    `;

    const msg = {
      to: email,
      from: {
        email: process.env.FROM_EMAIL,
        name: process.env.FROM_NAME
      },
      subject: `Your License Key${licenses.length > 1 ? 's' : ''} for ${productName}`,
      text: textContent,
      html: htmlContent
    };

    await sgMail.send(msg);
    console.log(`✅ Email sent to ${email}`);
    
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
