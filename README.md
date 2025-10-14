# License Manager for Shopify

A SendOwl-like digital license distribution system for Shopify stores. Automatically sends license keys to customers after purchase.

## 🎯 Project Overview

**Goal:** Automate digital license delivery for Shopify products
**Timeline:** 3-day sprint (currently Day 1 complete)
**Tech Stack:** Node.js, MySQL, React, Shopify API, SendGrid

## ✅ Completed (Day 1)

### Backend Infrastructure
- ✅ MySQL database schema (7 tables)
- ✅ OAuth installation flow for Shopify Partner App
- ✅ Webhook handler for order creation
- ✅ Core license allocation engine
- ✅ Email service integration (SendGrid)
- ✅ Low inventory alerts
- ✅ Admin API endpoints (full CRUD)
- ✅ Successfully installed on test store

### Database Schema
- **shops** - Stores installed Shopify shops with access tokens
- **products** - Shopify products linked to license pools
- **licenses** - License keys (allocated/available)
- **orders** - Order information from Shopify
- **order_items** - Line items with license allocation tracking
- **email_logs** - Email delivery audit trail
- **inventory_alerts** - Low stock notifications

## 🏗️ Architecture

```
shopify-order → webhook → allocate-licenses → send-email
                              ↓
                         update-database
                              ↓
                       check-inventory-alerts
```

## 📦 Tech Stack

### Backend
- **Node.js** with ES6 modules
- **Express** - API server
- **MySQL 2** - Database driver
- **@shopify/shopify-api** - Shopify integration
- **@sendgrid/mail** - Email delivery
- **dotenv** - Environment configuration

### Frontend (Coming Day 2)
- **React + Vite** - Admin dashboard
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Lucide React** - Icons

## 🚀 Getting Started

### Prerequisites
- Node.js v20+
- MySQL database (Google Cloud SQL)
- Shopify Partner account
- SendGrid account (for emails)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/tfswheels/license-manager.git
cd license-manager
```

2. **Install backend dependencies**
```bash
cd server
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env with your credentials
```

4. **Setup database**
```bash
node setup-database.js
```

5. **Start the server**
```bash
npm run dev
```

Server runs on `http://localhost:3001`

### Environment Variables

```env
# Server
PORT=3001
NODE_ENV=development
APP_URL=http://localhost:3001

# MySQL Database
DB_HOST=your_host
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=license_manager
DB_PORT=3306

# Shopify Partner App
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SHOPIFY_SCOPES=read_products,read_orders,read_customers
SHOPIFY_REDIRECT_URI=http://localhost:3001/auth/callback
SHOPIFY_WEBHOOK_SECRET=your_webhook_secret

# SendGrid
SENDGRID_API_KEY=your_sendgrid_key
FROM_EMAIL=licenses@yourdomain.com
FROM_NAME=Your Company

# Admin Alerts
ADMIN_EMAIL=admin@yourdomain.com
LOW_INVENTORY_THRESHOLD=10
```

## 📡 API Endpoints

### Authentication
- `GET /auth/install?shop=<shop>` - Start OAuth installation
- `GET /auth/callback` - OAuth callback handler
- `GET /auth/status?shop=<shop>` - Check installation status

### Webhooks
- `POST /webhooks/orders/create` - Order creation webhook

### Admin API
- `GET /api/admin/shops` - List installed shops
- `POST /api/admin/shops/:shopId/sync-products` - Sync products from Shopify
- `GET /api/admin/products` - List products
- `POST /api/admin/products/:productId/licenses/upload` - Upload licenses
- `GET /api/admin/products/:productId/licenses` - View licenses
- `DELETE /api/admin/licenses/:licenseId` - Delete license
- `POST /api/admin/licenses/:licenseId/release` - Release allocated license
- `GET /api/admin/orders` - List orders
- `GET /api/admin/orders/:orderId` - Order details
- `POST /api/admin/orders/:orderId/allocate` - Manually allocate licenses
- `GET /api/admin/stats` - Dashboard statistics

## 🔄 Workflow

### Normal Flow
1. Customer places order on Shopify
2. Shopify sends webhook to `/webhooks/orders/create`
3. System allocates licenses from available pool
4. Email sent to customer with license keys
5. Licenses marked as allocated in database
6. Inventory levels checked for low stock alerts

### Manual Allocation
1. Admin views orders with failed allocations
2. Admin uploads more licenses
3. Admin triggers manual allocation
4. System allocates and sends emails

## 🛠️ Development

### Project Structure
```
license-manager/
├── server/
│   ├── src/
│   │   ├── config/          # Database & Shopify config
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   └── index.js         # Main server
│   ├── migrations/          # SQL schema
│   ├── .env                 # Environment variables
│   └── package.json
└── admin/                   # (Coming Day 2)
    └── React admin panel
```

### Database Tools
- **MySQL Workbench** - GUI for database management
- **check-shops.js** - View installed shops
- **setup-database.js** - Initialize database

### Running Tests
```bash
# Check server health
curl http://localhost:3001/health

# Check installed shops
node check-shops.js

# Test connection
node test-connection.js
```

## 🎯 Roadmap

### Day 2 (Next)
- [ ] React admin dashboard
- [ ] Product management UI
- [ ] CSV license upload interface
- [ ] Order history viewer
- [ ] Manual license allocation UI

### Day 3
- [ ] Testing & bug fixes
- [ ] Deployment to production
- [ ] Documentation
- [ ] Monitoring setup

### Future Enhancements
- [ ] Bulk operations
- [ ] License expiration dates
- [ ] Usage tracking
- [ ] Analytics dashboard
- [ ] Multi-language support
- [ ] Advanced email templates

## 📝 Notes

- Database uses UTC timestamps
- Licenses are not unique in DB (can have duplicates for inventory)
- Each email must have unique licenses
- Allocated licenses cannot be sent to another customer unless released
- Low inventory alerts sent max once per 24 hours per product

## 🔒 Security

- OAuth access tokens stored encrypted
- Webhook signature verification
- CORS configured for admin panel only
- Environment variables for all secrets

## 📄 License

Private project - All rights reserved

## 👥 Team

- **Development**: Started October 13, 2025
- **Developer**: Jeremiah (tfswheels)

## 🐛 Known Issues

None currently - Day 1 complete, all systems operational!

## 📞 Support

For issues or questions, contact: TFS WHEELS TEAM