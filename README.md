# 🍴 SAM'S KITCHEN - Backend API

Complete backend API for SAM'S KITCHEN with order management and email notifications.

---

## 📋 Features

- ✅ **Order Management** - Create, read, update orders
- ✅ **Email Notifications** - Automatic emails to admin and customers
- ✅ **Database Integration** - MySQL with proper schema
- ✅ **REST API** - Full CRUD operations
- ✅ **Rate Limiting** - Prevent spam
- ✅ **Reports** - Daily sales, popular products

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
```bash
cd sams-kitchen-backend
npm install
```

### 2. Setup Environment Variables
```bash
cp .env.example .env
# Edit .env with your credentials
```

### 3. Setup Database
```bash
# Login to MySQL
mysql -u root -p

# Run the schema
source database/schema.sql
```

### 4. Start Server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

Server will run at: `http://localhost:3000`

---

## 📧 Email Setup (Gmail)

### Step 1: Enable 2-Step Verification
1. Go to [Google Account](https://myaccount.google.com)
2. Security → 2-Step Verification → Turn ON

### Step 2: Generate App Password
1. Security → App passwords
2. Select "Mail" and your device
3. Copy the 16-character password

### Step 3: Update .env
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx  (the app password)
ADMIN_EMAIL=muzzammil.memons@gmail.com
```

---

## 🌐 FREE HOSTING OPTIONS

### Option 1: Railway (Recommended - Easiest)

**Step 1: Create Account**
1. Go to [Railway.app](https://railway.app)
2. Sign up with GitHub

**Step 2: Deploy**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Deploy
railway up
```

**Step 3: Add MySQL Database**
1. In Railway dashboard, click "New"
2. Select "Database" → "Add MySQL"
3. Copy connection details to environment variables

**Step 4: Environment Variables**
In Railway dashboard → Variables:
```
PORT=3000
DB_HOST=${{MySQL.MYSQLHOST}}
DB_USER=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
DB_NAME=${{MySQL.MYSQLDATABASE}}
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
ADMIN_EMAIL=muzzammil.memons@gmail.com
```

**Cost:** FREE (500 hours/month + $5 credit)

---

### Option 2: Render (Free Forever)

**Step 1: Create Account**
1. Go to [Render.com](https://render.com)
2. Sign up with GitHub

**Step 2: Create MySQL Database**
1. Dashboard → "New" → "PostgreSQL" (use as MySQL alternative)
2. OR use [PlanetScale](https://planetscale.com) for free MySQL

**Step 3: Create Web Service**
1. "New" → "Web Service"
2. Connect your GitHub repo
3. Settings:
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`

**Step 4: Environment Variables**
Add in Render dashboard:
```
PORT=10000
DB_HOST=your-db-host
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=your-db-name
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
ADMIN_EMAIL=muzzammil.memons@gmail.com
```

**Cost:** FREE (sleeps after 15 min inactivity)

---

### Option 3: Vercel + PlanetScale (Serverless)

**Step 1: Setup PlanetScale (Free MySQL)**
1. Go to [PlanetScale.com](https://planetscale.com)
2. Create account → New Database
3. Get connection string

**Step 2: Setup Vercel**
1. Go to [Vercel.com](https://vercel.com)
2. Import your GitHub repo
3. Add environment variables

**Step 3: Deploy**
Vercel will auto-deploy on every push!

**Cost:** FREE (100GB bandwidth/month)

---

### Option 4: Fly.io (Best Performance)

**Step 1: Install Fly CLI**
```bash
curl -L https://fly.io/install.sh | sh
```

**Step 2: Deploy**
```bash
# Login
fly auth login

# Launch app
fly launch

# Create database
fly postgres create

# Deploy
fly deploy
```

**Cost:** FREE ($5 credit/month)

---

## 🔌 API Endpoints

### Health Check
```http
GET /api/health
```

### Products
```http
GET    /api/products          # Get all products
GET    /api/products/:id      # Get single product
```

### Deals
```http
GET    /api/deals             # Get all deals
```

### Orders
```http
POST   /api/orders            # Create new order
GET    /api/orders            # Get all orders (admin)
GET    /api/orders/:orderNumber  # Get single order
PATCH  /api/orders/:orderNumber/status  # Update status
```

### Reports
```http
GET    /api/reports/daily-sales
GET    /api/reports/popular-products
```

---

## 📦 Create Order Example

```javascript
// Frontend code to create order
const orderData = {
  customerName: "John Doe",
  customerPhone: "03251234567",
  customerEmail: "john@example.com",
  address: "House 123, Street 4",
  area: "Downtown",
  items: [
    {
      productId: 1,
      name: "Malai Boti Samosa",
      price: 60,
      quantity: 2,
      type: "product",
      variant: "single"
    },
    {
      productId: 101,
      name: "Snack Feast Box",
      price: 600,
      quantity: 1,
      type: "deal",
      dealItems: ["2 Cheese Balls", "1 Chicken Pocket", "..."]
    }
  ],
  subtotal: 720,
  deliveryCharge: 0,
  total: 720,
  notes: "Please deliver after 6 PM"
};

fetch('https://your-api.com/api/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(orderData)
})
.then(res => res.json())
.then(data => console.log(data));
```

---

## 📁 Project Structure

```
sams-kitchen-backend/
├── database/
│   └── schema.sql          # Database schema
├── .env                    # Environment variables
├── .env.example            # Example env file
├── .gitignore
├── package.json
├── README.md
└── server.js               # Main server file
```

---

## 🛠️ Database Schema

### Tables
- **products** - Product catalog
- **deals** - Special deals/offers
- **customers** - Customer information
- **orders** - Order records
- **order_items** - Items in each order
- **wishlist** - Customer wishlists

### Views
- **daily_sales** - Daily revenue report
- **popular_products** - Best selling items
- **order_status_summary** - Orders by status

---

## 📞 Support

For issues or questions:
- Email: info@samskitchen.pk
- Phone: 0325 2131688

---

## 📄 License

MIT License - Feel free to use and modify!
