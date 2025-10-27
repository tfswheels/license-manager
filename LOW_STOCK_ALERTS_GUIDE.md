# Low Stock Alerts Debugging Guide

## Overview
This document explains how the low stock alert system works, what might prevent alerts from being sent, and how to debug the issue.

---

## 🔄 Low Stock Alert Flow

### When Alerts Are Triggered
Low stock alerts are checked **automatically after every order is processed**. The trigger point is:

**File**: `server/src/services/orderService.js:127`
```javascript
await checkInventoryAlerts(connection, dbProductId, shopId);
```

### The Alert Check Process

The `checkInventoryAlerts()` function in `server/src/services/inventoryService.js:4` performs these checks **in order**:

1. **Fetch Shop Settings** (lines 7-12)
   - Gets `low_stock_threshold`, `notify_on_low_stock`, and `notification_email` from the database

2. **Check if Alerts are Enabled** (line 15)
   - ❌ **EXITS if** `notify_on_low_stock` is FALSE or not set
   - ❌ **EXITS if** no shop_settings record exists

3. **Check Notification Email** (lines 22-26)
   - ❌ **EXITS if** `notification_email` is NULL or empty
   - Logs: `⚠️ Low stock alerts enabled but no notification_email configured for shop {shopId}`

4. **Count Available Licenses** (lines 28-34)
   - Counts unallocated licenses: `SELECT COUNT(*) WHERE allocated = FALSE`

5. **Compare Against Threshold** (line 37)
   - Threshold defaults to 10 if not set
   - ❌ **EXITS if** available count > threshold (not low stock yet)

6. **Check for Recent Alerts** (lines 38-44)
   - Prevents spam by checking if an alert was sent in the last 24 hours
   - ❌ **EXITS if** alert was already sent within 24 hours

7. **Send Alert Email** (lines 55-60)
   - Calls `sendInventoryAlert()` in `emailService.js`
   - Records alert in `inventory_alerts` table (lines 62-67)

---

## 📧 Email Details

### Email Recipient
**Sent to**: The `notification_email` field from the `shop_settings` table

This is configured in:
- **Admin Panel**: System Settings → "Notification Email Address"
- **Database**: `shop_settings.notification_email`

### Email Content

**From**: `emailService.js:147-203`

**Subject**:
```
⚠️ Low Inventory Alert: {Product Name}
```

**Text Version**:
```
Low inventory alert for {Product Name}

Available licenses: {availableCount}
Threshold: {threshold}

Please upload more licenses to avoid running out.
```

**HTML Version**:
- Orange alert header with "⚠️ Low Inventory Alert"
- Product name
- Available licenses count
- Configured threshold
- Message: "Please upload more licenses to avoid running out."

**Sender**:
- Email: `process.env.SENDGRID_SENDER_EMAIL` or `mail@digikeyhq.com`
- Name: `process.env.FROM_NAME` or `DigiKey HQ`

---

## 🔍 Why Alerts Might Not Be Sent

### Most Common Issues (in order of likelihood)

#### 1. ❌ **Notification Email Not Set**
**Problem**: The `notification_email` field in `shop_settings` is NULL

**How to Check**:
```sql
SELECT notification_email, notify_on_low_stock, low_stock_threshold
FROM shop_settings
WHERE shop_id = YOUR_SHOP_ID;
```

**How to Fix**:
1. Go to Admin Panel → System Settings
2. Scroll to "Notification Settings"
3. Enter an email in "Notification Email Address"
4. Enable "Notify on Low Stock"
5. Set "Low Stock Threshold" (default: 10)
6. Click "Save Settings"

**Note**: The UI only shows the "Notify on Low Stock" checkbox AFTER you set a notification email.

---

#### 2. ❌ **Notify on Low Stock is Disabled**
**Problem**: The `notify_on_low_stock` field is FALSE

**Check**: Same SQL query as above

**Fix**: Enable the checkbox in System Settings (only visible after setting notification email)

---

#### 3. ⏰ **Alert Recently Sent (Within 24 Hours)**
**Problem**: An alert was already sent within the last 24 hours

**How to Check**:
```sql
SELECT product_id, available_count, threshold, alert_sent_at
FROM inventory_alerts
WHERE product_id = YOUR_PRODUCT_ID
  AND alert_sent = TRUE
  AND alert_sent_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
ORDER BY alert_sent_at DESC;
```

**Why**: This prevents alert spam. You'll only get one alert per product every 24 hours.

**Fix**: Wait 24 hours from the last alert, or manually clear old alerts:
```sql
DELETE FROM inventory_alerts
WHERE product_id = YOUR_PRODUCT_ID
  AND alert_sent_at < DATE_SUB(NOW(), INTERVAL 24 HOUR);
```

---

#### 4. 📦 **Stock Not Actually Low**
**Problem**: Available licenses are above the threshold

**How to Check**:
```sql
SELECT
  p.product_name,
  COUNT(*) as total_licenses,
  SUM(CASE WHEN l.allocated = FALSE THEN 1 ELSE 0 END) as available,
  ss.low_stock_threshold
FROM licenses l
JOIN products p ON l.product_id = p.id
JOIN shop_settings ss ON p.shop_id = ss.shop_id
WHERE p.id = YOUR_PRODUCT_ID
GROUP BY p.id;
```

**Alert triggers when**: `available <= low_stock_threshold`

**Fix**:
- Lower the threshold in System Settings, OR
- Wait for more orders to reduce available licenses below threshold

---

#### 5. 🔧 **Migration Not Run**
**Problem**: The `low_stock_threshold` and `notify_on_low_stock` columns don't exist

**How to Check**:
```sql
DESCRIBE shop_settings;
```

**Look for**: `low_stock_threshold` and `notify_on_low_stock` columns

**Fix**: Run the migration:
```bash
mysql -u root license_manager < server/migrations/ADD_LOW_STOCK_ALERTS.sql
```

---

#### 6. 📋 **No shop_settings Record**
**Problem**: No row exists in `shop_settings` for the shop

**How to Check**:
```sql
SELECT * FROM shop_settings WHERE shop_id = YOUR_SHOP_ID;
```

**Fix**: The system should auto-create settings on first use, but you can manually create:
```sql
INSERT INTO shop_settings (shop_id, notify_on_low_stock, low_stock_threshold)
VALUES (YOUR_SHOP_ID, TRUE, 10);
```

---

## 🛠️ Debugging Steps

### Step 1: Run the Debug Script
```bash
cd server
node debug-low-stock-alerts.js
```

This script will check:
- All shops and their settings
- Whether notification email is set
- Whether low stock alerts are enabled
- Current inventory levels for all products
- Recent alert history
- Specific reasons why alerts might not be sent

### Step 2: Check Logs
When orders are processed, look for these log messages:

**Success**:
```
⚠️ Low inventory alert sent for {productName} to {email}
✅ Inventory alert sent for {productName}
```

**Warnings**:
```
⚠️ Low stock alerts enabled but no notification_email configured for shop {shopId}
```

### Step 3: Manual Test
To force an alert (for testing), you can:

1. Set a high threshold temporarily:
   ```sql
   UPDATE shop_settings
   SET low_stock_threshold = 999, notify_on_low_stock = TRUE
   WHERE shop_id = YOUR_SHOP_ID;
   ```

2. Clear recent alerts:
   ```sql
   DELETE FROM inventory_alerts WHERE product_id = YOUR_PRODUCT_ID;
   ```

3. Process a test order (or wait for a real order)

4. Check if email was sent

5. Reset threshold:
   ```sql
   UPDATE shop_settings
   SET low_stock_threshold = 10
   WHERE shop_id = YOUR_SHOP_ID;
   ```

---

## 📊 Database Schema

### shop_settings Table
```sql
low_stock_threshold INT DEFAULT 10
notify_on_low_stock BOOLEAN DEFAULT TRUE
notification_email VARCHAR(255)
```

### inventory_alerts Table
```sql
id INT AUTO_INCREMENT PRIMARY KEY
product_id INT NOT NULL
available_count INT NOT NULL
threshold INT NOT NULL
alert_sent BOOLEAN DEFAULT FALSE
alert_sent_at TIMESTAMP
```

---

## ✅ Checklist for Working Alerts

- [ ] Migration `ADD_LOW_STOCK_ALERTS.sql` has been run
- [ ] Shop has a record in `shop_settings` table
- [ ] `notification_email` is set to a valid email address
- [ ] `notify_on_low_stock` is TRUE (enabled)
- [ ] `low_stock_threshold` is set to appropriate value (default: 10)
- [ ] SendGrid API key is configured in `.env` file
- [ ] Product has licenses in the database
- [ ] Available licenses are at or below threshold
- [ ] No alert was sent in the last 24 hours for this product
- [ ] Orders are being processed (alerts only trigger on order processing)

---

## 🎯 Quick Fix Summary

**Most likely you need to**:
1. Go to System Settings in the admin panel
2. Set the "Notification Email Address" field
3. Enable the "Notify on Low Stock" checkbox
4. Set the "Low Stock Threshold" (e.g., 10)
5. Save settings

**The alert will be sent**:
- Automatically when the next order is processed
- Only if available licenses ≤ threshold
- Only once per 24 hours per product
