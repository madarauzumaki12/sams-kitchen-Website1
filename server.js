/**
 * SAM'S KITCHEN - Backend API Server (MongoDB Version)
 * 100% Free Hosting on Cyclic + MongoDB Atlas
 */

const express = require('express');
const cors = require('cors');
const { connectDB, getDB } = require('./db');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
let db;
connectDB().then(database => {
  db = database;
}).catch(err => {
  console.error('Failed to connect to MongoDB');
});

// Email configuration (Gmail - may not work on Cyclic, use SendGrid instead)
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: { rejectUnauthorized: false },
  connectionTimeout: 10000
});

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'muzzammil.memons@gmail.com';

// Helper functions
function sanitizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function generateOrderNumber() {
  return `SK-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: "SAM'S KITCHEN API is running!",
    database: db ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const products = await db.collection('products').find({ in_stock: true }).toArray();
    res.json({ success: true, data: products });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch products' });
  }
});

// Get all deals
app.get('/api/deals', async (req, res) => {
  try {
    const deals = await db.collection('deals').find({ is_active: true }).toArray();
    res.json({ success: true, data: deals });
  } catch (error) {
    console.error('Error fetching deals:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch deals' });
  }
});

// Create order
app.post('/api/orders', async (req, res) => {
  const {
    customerName,
    customerPhone,
    customerEmail,
    address,
    area,
    items,
    deliveryCharge,
    total,
    notes
  } = req.body;

  const cleanCustomerName = sanitizeString(customerName);
  const cleanCustomerPhone = sanitizeString(customerPhone);
  const cleanCustomerEmail = sanitizeString(customerEmail);
  const cleanAddress = sanitizeString(address);
  const cleanArea = sanitizeString(area);
  const cleanNotes = sanitizeString(notes);
  const orderNumber = generateOrderNumber();

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cleanDeliveryCharge = Number(deliveryCharge) || 0;
  const cleanTotal = Number(total) || (subtotal + cleanDeliveryCharge);

  try {
    const orderData = {
      orderNumber,
      customerName: cleanCustomerName,
      customerPhone: cleanCustomerPhone,
      customerEmail: cleanCustomerEmail,
      address: cleanAddress,
      area: cleanArea,
      items: items,
      subtotal,
      deliveryCharge: cleanDeliveryCharge,
      total: cleanTotal,
      notes: cleanNotes,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('orders').insertOne(orderData);

    // Send Discord notification
    if (process.env.DISCORD_WEBHOOK) {
      try {
        const itemsList = items.map(item => 
          `• ${item.name} x${item.quantity} - Rs ${item.price * item.quantity}`
        ).join('\n');

        await fetch(process.env.DISCORD_WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: "🍴 Sam's Kitchen",
            embeds: [{
              title: `🛒 New Order #${orderNumber}`,
              color: 0x8e5d3d,
              fields: [
                { name: '👤 Customer', value: cleanCustomerName, inline: true },
                { name: '📞 Phone', value: cleanCustomerPhone, inline: true },
                { name: '📍 Area', value: cleanArea, inline: true },
                { name: '🛍️ Items', value: itemsList.substring(0, 1024) },
                { name: '💰 Total', value: `Rs ${cleanTotal}`, inline: true },
                { name: '🏠 Address', value: cleanAddress.substring(0, 100) }
              ],
              timestamp: new Date().toISOString()
            }]
          })
        });
      } catch (discordError) {
        console.error('Discord error:', discordError.message);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      data: {
        orderId: result.insertedId,
        orderNumber,
        total: cleanTotal
      }
    });

  } catch (error) {
    console.error('Order creation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create order'
    });
  }
});

// Get all orders
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await db.collection('orders').find().sort({ createdAt: -1 }).toArray();
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch orders' });
  }
});

// Get single order
app.get('/api/orders/:orderNumber', async (req, res) => {
  try {
    const order = await db.collection('orders').findOne({ orderNumber: req.params.orderNumber });
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch order' });
  }
});

// Database setup route (run once to add sample data)
app.get('/api/setup-db', async (req, res) => {
  try {
    // Add sample products
    await db.collection('products').insertMany([
      { name: 'Chicken Roll', price: 200, description: 'Delicious chicken roll', category: 'rolls', in_stock: true },
      { name: 'Beef Patty', price: 150, description: 'Juicy beef patty', category: 'patties', in_stock: true },
      { name: 'Veg Samosa', price: 60, description: 'Crispy vegetable samosa', category: 'samosas', in_stock: true }
    ]);

    // Add sample deals
    await db.collection('deals').insertMany([
      { name: 'Family Pack', price: 800, description: '10 rolls + 5 patties', items_included: ['rolls', 'patties'], is_active: true }
    ]);

    res.json({ success: true, message: 'Database setup complete with sample data!' });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'API route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║                                                        ║
║           🍴 SAM'S KITCHEN API SERVER 🍴               ║
║                                                        ║
║   Server running on port ${PORT}                       ║
║   Health: /api/health                                  ║
║   Setup: /api/setup-db                                 ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
  `);
});