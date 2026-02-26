# 🚀 QUICK START - Get Your Backend Online in 10 Minutes!

## 📁 Files Created for You

```
/mnt/okcomputer/output/sams-kitchen-backend/
├── database/
│   └── schema.sql          ← MySQL Database Schema
├── server.js               ← Main API Server
├── package.json            ← Dependencies
├── .env.example            ← Environment Template
├── .gitignore              ← Git Ignore File
├── README.md               ← Full Documentation
├── HOSTING-GUIDE.md        ← Step-by-Step Hosting Guide
└── QUICK-START.md          ← This file!
```

---

## ⚡ FASTEST WAY - Railway (5 Minutes)

### 1. Install Railway CLI
```bash
curl -fsSL https://railway.app/install.sh | sh
```

### 2. Login & Setup
```bash
cd /mnt/okcomputer/output/sams-kitchen-backend
railway login
railway init
```

### 3. Add MySQL Database
- Go to [railway.app/dashboard](https://railway.app/dashboard)
- Click your project → "New" → "Database" → "Add MySQL"

### 4. Add Environment Variables
In Railway Dashboard → Variables, add:
```
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
ADMIN_EMAIL=muzzammil.memons@gmail.com
```

### 5. Deploy!
```bash
railway up
```

✅ **Done!** Your API is live!

---

## 📧 Email Setup (Required!)

### Get Gmail App Password:
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Step Verification**
3. Search **"App passwords"**
4. Generate password for "Mail"
5. Copy the 16-character code

---

## 🧪 Test Your API

Once deployed, test with:
```bash
# Health check
curl https://your-url.railway.app/api/health

# Create test order
curl -X POST https://your-url.railway.app/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Test",
    "customerPhone": "03251234567",
    "address": "Test Address",
    "area": "Downtown",
    "items": [{"name": "Samosa", "price": 60, "quantity": 2}],
    "subtotal": 120,
    "deliveryCharge": 0,
    "total": 120
  }'
```

---

## 🔗 Connect to Frontend

Update your React app's `.env`:
```env
VITE_API_URL=https://your-railway-url.railway.app/api
```

---

## 📊 What Happens When Someone Orders?

1. ✅ Customer clicks "Place Order" on your website
2. ✅ Order saved to MySQL database
3. ✅ **Email sent to:** muzzammil.memons@gmail.com
4. ✅ Customer sees order confirmation

---

## 🆘 Common Issues

| Problem | Solution |
|---------|----------|
| "Cannot connect to DB" | Check DB credentials in Railway variables |
| "Emails not sending" | Verify Gmail App Password |
| "CORS error" | Update CORS in server.js with your frontend URL |

---

## 📞 Need More Help?

Read the full guides:
- **README.md** - Complete API documentation
- **HOSTING-GUIDE.md** - Detailed hosting instructions

---

## 🎉 You're Ready!

Your backend will:
- ✅ Store all orders in database
- ✅ Send email notifications
- ✅ Handle products, deals, bundles
- ✅ Generate order numbers
- ✅ Work 24/7 for FREE!

**Good luck with SAM'S KITCHEN! 🍴**
