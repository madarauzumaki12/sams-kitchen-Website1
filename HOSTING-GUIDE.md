# 🚀 FREE HOSTING GUIDE - Step by Step

This guide will show you how to host SAM'S KITCHEN backend for **FREE** using Railway (recommended) or Render.

---

## 🎯 OPTION 1: Railway (Recommended - Easiest)

### Step 1: Create Railway Account
1. Go to **[Railway.app](https://railway.app)**
2. Click "Start a New Project"
3. Sign up with **GitHub** (recommended)

### Step 2: Install Railway CLI
```bash
# On Mac/Linux
curl -fsSL https://railway.app/install.sh | sh

# On Windows (PowerShell as Admin)
iwr https://railway.app/install.ps1 -useb | iex
```

### Step 3: Login to Railway
```bash
railway login
```

### Step 4: Prepare Your Project
```bash
# Navigate to your backend folder
cd sams-kitchen-backend

# Create a new Railway project
railway init
```

### Step 5: Add MySQL Database
1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click your project
3. Click **"New"** → **"Database"** → **"Add MySQL"**
4. Wait for database to be created

### Step 6: Set Environment Variables
In Railway Dashboard:
1. Click your project
2. Go to **"Variables"** tab
3. Add these variables:

```
PORT=3000
NODE_ENV=production

# Database (Railway will auto-fill these when you add MySQL)
DB_HOST=${{MySQL.MYSQLHOST}}
DB_USER=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
DB_NAME=${{MySQL.MYSQLDATABASE}}

# Email (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
ADMIN_EMAIL=muzzammil.memons@gmail.com
```

### Step 7: Deploy!
```bash
railway up
```

Your API will be live at: `https://your-project-name.up.railway.app`

### Step 8: Get Your URL
```bash
railway domain
```

---

## 🎯 OPTION 2: Render (Free Forever)

### Step 1: Create Render Account
1. Go to **[Render.com](https://render.com)**
2. Sign up with **GitHub**

### Step 2: Create MySQL Database (Using PlanetScale)

**Why PlanetScale?** Because Render's free PostgreSQL is different from MySQL.

1. Go to **[PlanetScale.com](https://planetscale.com)**
2. Sign up with GitHub
3. Click **"Create Database"**
4. Name it `samskitchen`
5. Select region closest to you
6. Click **"Create Database"**

**Get Connection String:**
1. In PlanetScale dashboard, click your database
2. Go to **"Connect"** tab
3. Select **"Node.js"** from dropdown
4. Copy the connection details

### Step 3: Push Code to GitHub
```bash
# Initialize git (if not done)
git init

# Add files
git add .

# Commit
git commit -m "Initial backend commit"

# Create GitHub repo and push
git remote add origin https://github.com/YOUR_USERNAME/sams-kitchen-backend.git
git push -u origin main
```

### Step 4: Create Web Service on Render
1. In Render dashboard, click **"New"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure:
   - **Name:** `sams-kitchen-api`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** `Free`

### Step 5: Add Environment Variables
In Render dashboard, click **"Environment"**:

```
PORT=10000
NODE_ENV=production

# Database (from PlanetScale)
DB_HOST=your-planetscale-host.com
DB_USER=your-username
DB_PASSWORD=your-password
DB_NAME=samskitchen

# Email
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
ADMIN_EMAIL=muzzammil.memons@gmail.com
```

### Step 6: Deploy
Click **"Create Web Service"**

Your API will be live at: `https://sams-kitchen-api.onrender.com`

---

## 🎯 OPTION 3: Vercel + PlanetScale (Serverless)

### Step 1: Setup PlanetScale Database
Follow Step 2 from Render option above.

### Step 2: Install Vercel CLI
```bash
npm i -g vercel
```

### Step 3: Deploy
```bash
cd sams-kitchen-backend
vercel
```

### Step 4: Add Environment Variables
```bash
vercel env add DB_HOST
vercel env add DB_USER
vercel env add DB_PASSWORD
vercel env add DB_NAME
vercel env add EMAIL_USER
vercel env add EMAIL_PASS
vercel env add ADMIN_EMAIL
```

### Step 5: Redeploy
```bash
vercel --prod
```

---

## 📧 Gmail App Password Setup

### Why App Password?
Gmail doesn't allow direct password login for security. You need an App Password.

### Step-by-Step:

**1. Enable 2-Step Verification**
- Go to [myaccount.google.com](https://myaccount.google.com)
- Click **"Security"**
- Under **"Signing in to Google"**, click **"2-Step Verification"**
- Turn it **ON**

**2. Generate App Password**
- In Security, search for **"App passwords"**
- Click **"App passwords"**
- Select app: **"Mail"**
- Select device: **"Other (Custom name)"**
- Name it: `SAM'S KITCHEN API`
- Click **"Generate"**
- **COPY the 16-character password** (it looks like: `abcd efgh ijkl mnop`)

**3. Update Your .env**
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop
ADMIN_EMAIL=muzzammil.memons@gmail.com
```

---

## 🔗 Connect Frontend to Backend

### Update Your React App

In your frontend `.env`:
```env
VITE_API_URL=https://your-backend-url.com/api
```

In your frontend code:
```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Create order
const createOrder = async (orderData) => {
  const response = await fetch(`${API_URL}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData)
  });
  return response.json();
};
```

---

## ✅ Testing Your API

### Test with curl:
```bash
# Health check
curl https://your-api.com/api/health

# Get products
curl https://your-api.com/api/products

# Create order
curl -X POST https://your-api.com/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Test User",
    "customerPhone": "03251234567",
    "address": "Test Address",
    "area": "Downtown",
    "items": [{"name": "Test Item", "price": 100, "quantity": 1}],
    "subtotal": 100,
    "deliveryCharge": 0,
    "total": 100
  }'
```

---

## 📊 Free Tier Limits

| Platform | Database | Bandwidth | Uptime | Best For |
|----------|----------|-----------|--------|----------|
| **Railway** | 500MB | 100GB | Always on | Production |
| **Render** | 1GB | 100GB | Sleeps after 15min | Small projects |
| **Vercel** | External | 100GB | Always on | Serverless |
| **PlanetScale** | 5GB | 1B reads | Always on | MySQL |

---

## 🆘 Troubleshooting

### Issue: "Cannot connect to database"
**Solution:**
- Check if DB_HOST is correct
- Whitelist your IP in database settings
- Verify password has no special characters

### Issue: "Emails not sending"
**Solution:**
- Verify Gmail App Password is correct
- Check if 2-Step Verification is enabled
- Try using a different Gmail account

### Issue: "CORS error"
**Solution:**
- Add your frontend URL to CORS in server.js
- Or use `*` for all origins (not recommended for production)

### Issue: "Port already in use"
**Solution:**
- Railway/Render will provide PORT automatically
- Don't hardcode PORT in production

---

## 🎉 You're Done!

Your backend is now live and ready to receive orders!

**Next Steps:**
1. Update your frontend API URL
2. Test placing an order
3. Check your email (muzzammil.memons@gmail.com)
4. Share your website with the world!

---

## 📞 Need Help?

- **Railway Docs:** [docs.railway.app](https://docs.railway.app)
- **Render Docs:** [render.com/docs](https://render.com/docs)
- **PlanetScale Docs:** [planetscale.com/docs](https://planetscale.com/docs)

**SAM'S KITCHEN Support:**
- Email: info@samskitchen.pk
- Phone: 0325 2131688
