// Create new file: server/src/routes/sendgridWebhook.js

import express from 'express';
import crypto from 'crypto';
import db from '../config/database.js';

const router = express.Router();

// Verify SendGrid webhook signature
function verifySendGridSignature(req, res, next) {
  const signature = req.get('X-Twilio-Email-Event-Webhook-Signature');
  const timestamp = req.get('X-Twilio-Email-Event-Webhook-Timestamp');
  
  // If no verification key set, skip verification (for testing)
  if (!process.env.SENDGRID_WEBHOOK_VERIFY_KEY) {
    console.warn('⚠️ SendGrid webhook verification disabled - no SENDGRID_WEBHOOK_VERIFY_KEY set');
    next();
    return;
  }

  const payload = timestamp + req.body.toString();
  const publicKey = process.env.SENDGRID_WEBHOOK_VERIFY_KEY;

  try {
    const verifier = crypto.createVerify('sha256');
    verifier.update(payload);
    
    const isValid = verifier.verify(
      publicKey,
      signature,
      'base64'
    );

    if (isValid) {
      next();
    } else {
      console.error('❌ SendGrid webhook verification failed');
      res.status(401).send('Unauthorized');
    }
  } catch (error) {
    console.error('SendGrid verification error:', error);
    res.status(500).send('Verification error');
  }
}

// SendGrid event webhook
router.post('/events', async (req, res) => {
  try {
    const events = req.body;

    if (!Array.isArray(events)) {
      console.error('Invalid SendGrid webhook payload');
      return res.status(400).send('Invalid payload');
    }

    console.log(`📧 Received ${events.length} SendGrid event(s)`);

    for (const event of events) {
      const { event: eventType, email, timestamp } = event;

      // Map SendGrid event types to our delivery statuses
      let deliveryStatus = 'pending';
      switch (eventType) {
        case 'delivered':
          deliveryStatus = 'delivered';
          break;
        case 'bounce':
        case 'blocked':
          deliveryStatus = 'bounced';
          break;
        case 'dropped':
          deliveryStatus = 'dropped';
          break;
        case 'spamreport':
          deliveryStatus = 'spam';
          break;
        default:
          // Ignore other events (open, click, etc.)
          continue;
      }

      // Update email_logs for this email address
      // Find most recent email log for this address
      try {
        const [result] = await db.execute(
          `UPDATE email_logs 
           SET delivery_status = ?, 
               delivery_updated_at = FROM_UNIXTIME(?)
           WHERE customer_email = ?
           AND delivery_status = 'pending'
           ORDER BY id DESC
           LIMIT 1`,
          [deliveryStatus, timestamp, email]
        );

        if (result.affectedRows > 0) {
          console.log(`✅ Updated delivery status for ${email}: ${deliveryStatus}`);
        } else {
          console.log(`⚠️ No pending email log found for ${email}`);
        }
      } catch (dbError) {
        console.error(`Database error updating ${email}:`, dbError);
      }
    }

    res.status(200).send('OK');

  } catch (error) {
    console.error('SendGrid webhook processing error:', error);
    res.status(500).send('Error');
  }
});

export default router;