/**
 * SAM'S KITCHEN - Backend API Server
 * Handles orders, database operations, and email notifications
 */

const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const nodemailer = require('nodemailer');
require('dotenv').config();
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARE
// ============================================
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// SERVE FRONTEND STATIC FILES
// ============================================

// Rate limiting to prevent spam
const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 orders per windowMs
  message: { error: 'Too many orders from this IP, please try again later.' }
});

// ============================================
// DATABASE CONNECTION
// ============================================

const DATABASE_URL = process.env.DATABASE_URL || 'mysql://root:XAjyNtCGTbUAAPmVayZdnSUcbeVUBscg@mysql.railway.internal:3306/railway';

console.log('Connecting to database...');
console.log('DATABASE_URL set:', !!process.env.DATABASE_URL);

const pool = mysql.createPool(DATABASE_URL);

// Test database connection with better error logging
async function testDBConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully!');
    connection.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Full error:', error);
    console.log('⚠️  Running in mock mode (no database)');
  }
}

testDBConnection();
// Temporary database setup route
app.get('/api/setup-db', async (req, res) => {
  try {
    // Create orders table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_number VARCHAR(50) UNIQUE NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(50) NOT NULL,
        customer_email VARCHAR(255),
        address TEXT NOT NULL,
        area VARCHAR(100) NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL,
        delivery_charge DECIMAL(10,2) NOT NULL,
        total DECIMAL(10,2) NOT NULL,
        notes TEXT,
        status ENUM('pending', 'confirmed', 'preparing', 'out-for-delivery', 'delivered', 'cancelled') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create order_items table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        quantity INT NOT NULL,
        item_type VARCHAR(50) DEFAULT 'product',
        variant VARCHAR(255),
        deal_items JSON,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      )
    `);

    // Create products table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        image VARCHAR(500),
        category VARCHAR(100),
        in_stock BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create deals table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS deals (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        image VARCHAR(500),
        items_included TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    res.json({ success: true, message: 'Database tables created successfully!' });
  } catch (error) {
    console.error('Setup error:', error);
    res.json({ success: false, error: error.message });
  }
});



const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,      // muzzammil.memons@gmail.com
    pass: process.env.EMAIL_PASS       // App password (16 chars)
  },
  tls: {
    rejectUnauthorized: false
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000
});
// Admin email where orders will be sent
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'muzzammil.memons@gmail.com';

function sanitizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function toMoney(value) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue) || numberValue < 0) {
    return null;
  }
  return Number(numberValue.toFixed(2));
}

function isValidEmail(value) {
  if (!value) {
    return true;
  }
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidPhone(value) {
  return /^[0-9+\-\s()]{7,20}$/.test(value);
}

function normalizeOrderItem(item) {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const name = sanitizeString(item.name);
  const price = toMoney(item.price);
  const quantity = Number(item.quantity);
  const itemType = sanitizeString(item.type) || 'product';
  const variant = sanitizeString(item.variant) || null;
  const dealItems = Array.isArray(item.dealItems) ? item.dealItems : null;

  if (!name || price === null || !Number.isInteger(quantity) || quantity < 1 || quantity > 50) {
    return null;
  }

  return {
    name,
    price,
    quantity,
    type: itemType,
    variant,
    dealItems
  };
}

// ============================================
// EMAIL TEMPLATES
// ============================================

function generateOrderEmailHTML(order, items) {
  const itemsList = items.map(item => `
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 10px;">${item.name}</td>
      <td style="padding: 10px; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; text-align: right;">Rs ${item.price}</td>
      <td style="padding: 10px; text-align: right;">Rs ${item.price * item.quantity}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #8e5d3d, #6d462e); padding: 30px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 28px; }
        .header p { margin: 10px 0 0; opacity: 0.9; }
        .content { padding: 30px; }
        .order-info { background: #faf7f2; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .order-info h3 { margin-top: 0; color: #8e5d3d; }
        .info-row { display: flex; justify-content: space-between; margin: 8px 0; }
        .info-label { font-weight: bold; color: #666; }
        .info-value { color: #333; }
        .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .items-table th { background: #8e5d3d; color: white; padding: 12px; text-align: left; }
        .items-table td { padding: 10px; border-bottom: 1px solid #eee; }
        .total-section { background: #faf7f2; padding: 20px; border-radius: 8px; margin-top: 20px; }
        .total-row { display: flex; justify-content: space-between; margin: 8px 0; font-size: 16px; }
        .grand-total { font-size: 20px; font-weight: bold; color: #8e5d3d; border-top: 2px solid #8e5d3d; padding-top: 10px; margin-top: 10px; }
        .footer { background: #333; color: white; padding: 20px; text-align: center; }
        .footer a { color: #c9a227; text-decoration: none; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
        .badge-deal { background: #c9a227; color: #333; }
        .badge-bundle { background: #8e5d3d; color: white; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🍴 SAM'S KITCHEN</h1>
          <p>New Order Received!</p>
        </div>
        
        <div class="content">
          <div class="order-info">
            <h3>📋 Order Details</h3>
            <div class="info-row">
              <span class="info-label">Order Number:</span>
              <span class="info-value" style="font-size: 18px; font-weight: bold; color: #8e5d3d;">${order.orderNumber}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Order Date:</span>
              <span class="info-value">${new Date().toLocaleString('en-PK')}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Status:</span>
              <span class="info-value" style="color: #e67e22; font-weight: bold;">⏳ Pending</span>
            </div>
            <div class="info-row">
              <span class="info-label">Payment Method:</span>
              <span class="info-value">Cash on Delivery</span>
            </div>
          </div>

          <div class="order-info">
            <h3>👤 Customer Information</h3>
            <div class="info-row">
              <span class="info-label">Name:</span>
              <span class="info-value">${order.customerName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Phone:</span>
              <span class="info-value"><a href="tel:${order.customerPhone}">${order.customerPhone}</a></span>
            </div>
            ${order.customerEmail ? `
            <div class="info-row">
              <span class="info-label">Email:</span>
              <span class="info-value"><a href="mailto:${order.customerEmail}">${order.customerEmail}</a></span>
            </div>
            ` : ''}
            <div class="info-row">
              <span class="info-label">Address:</span>
              <span class="info-value">${order.address}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Area:</span>
              <span class="info-value">${order.area}</span>
            </div>
          </div>

          ${order.notes ? `
          <div class="order-info" style="background: #fff3cd;">
            <h3>📝 Order Notes</h3>
            <p style="margin: 0; color: #856404;">${order.notes}</p>
          </div>
          ` : ''}

          <h3>🛒 Order Items</h3>
          <table class="items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Price</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsList}
            </tbody>
          </table>

          <div class="total-section">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>Rs ${order.subtotal}</span>
            </div>
            <div class="total-row">
              <span>Delivery Charge:</span>
              <span>${order.deliveryCharge === 0 ? 'FREE' : 'Rs ' + order.deliveryCharge}</span>
            </div>
            <div class="total-row grand-total">
              <span>Grand Total:</span>
              <span>Rs ${order.total}</span>
            </div>
          </div>
        </div>

        <div class="footer">
          <p><strong>SAM'S KITCHEN</strong></p>
          <p>📞 <a href="tel:03252131688">0325 2131688</a></p>
          <p>📧 <a href="mailto:info@samskitchen.pk">info@samskitchen.pk</a></p>
          <p style="margin-top: 15px; font-size: 12px; opacity: 0.8;">
            This is an automated email. Please do not reply to this message.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateCustomerEmailHTML(order, items) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #8e5d3d, #6d462e); padding: 30px; text-align: center; color: white; }
        .content { padding: 30px; }
        .success-icon { font-size: 60px; text-align: center; margin: 20px 0; }
        .order-number { background: #faf7f2; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; }
        .order-number h2 { margin: 0; color: #8e5d3d; }
        .footer { background: #333; color: white; padding: 20px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🍴 SAM'S KITCHEN</h1>
        </div>
        <div class="content">
          <div class="success-icon">✅</div>
          <h2 style="text-align: center; color: #27ae60;">Order Placed Successfully!</h2>
          <p style="text-align: center;">Thank you for your order. We'll contact you shortly to confirm.</p>
          
          <div class="order-number">
            <p style="margin: 0; color: #666;">Your Order Number</p>
            <h2>${order.orderNumber}</h2>
          </div>

          <p style="text-align: center;">
            <strong>Total: Rs ${order.total}</strong><br>
            Payment Method: Cash on Delivery
          </p>

          <p style="text-align: center; color: #666; font-size: 14px;">
            Questions? Call us at <a href="tel:03252131688" style="color: #8e5d3d;">0325 2131688</a>
          </p>
        </div>
        <div class="footer">
          <p>SAM'S KITCHEN - Premium Frozen Snacks</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// ============================================
// EMAIL FUNCTIONS
// ============================================

async function sendOrderEmails(order, items) {
  try {
    // Verify transporter connection first
    await transporter.verify();
    console.log('✅ Email transporter verified');

    // Email to Admin
    const adminMailOptions = {
      from: `"SAM'S KITCHEN" <${process.env.EMAIL_USER}>`,
      to: ADMIN_EMAIL,
      subject: `🛒 New Order #${order.orderNumber} - SAM'S KITCHEN`,
      html: generateOrderEmailHTML(order, items)
    };

    console.log('Sending admin order email');
    const adminResult = await transporter.sendMail(adminMailOptions);
    console.log('✅ Admin email sent:', adminResult.messageId);

    // Email to Customer (if email provided)
    if (order.customerEmail) {
      const customerMailOptions = {
        from: `"SAM'S KITCHEN" <${process.env.EMAIL_USER}>`,
        to: order.customerEmail,
        subject: `✅ Order Confirmed #${order.orderNumber} - SAM'S KITCHEN`,
        html: generateCustomerEmailHTML(order, items)
      };
      console.log('Sending customer order confirmation email');
      const customerResult = await transporter.sendMail(customerMailOptions);
      console.log('✅ Customer email sent:', customerResult.messageId);
    }

    return true;
  } catch (error) {
    console.error('❌ EMAIL ERROR:', error.message);
    console.error('Full error:', error);
    return false;
  }
}

// ============================================
// API ROUTES
// ============================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM products WHERE in_stock = TRUE ORDER BY id');
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch products' });
  }
});

// Get all deals
app.get('/api/deals', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM deals WHERE is_active = TRUE ORDER BY id');
    // Parse JSON items
    const deals = rows.map(deal => ({
      ...deal,
      items: deal.items_included ? deal.items_included.split(',') : []
    }));
    res.json({ success: true, data: deals });
  } catch (error) {
    console.error('Error fetching deals:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch deals' });
  }
});

// Get single product
app.get('/api/products/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch product' });
  }
});
app.get('/api/db-test', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    await connection.query('SELECT 1');
    connection.release();
    res.json({ success: true, message: 'Database connected' });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});
app.get('/api/check-tables', async (req, res) => {
  try {
    const [tables] = await pool.execute('SHOW TABLES');
    res.json({ 
      success: true, 
      tables: tables.map(t => Object.values(t)[0])
    });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});


// ============================================
// CREATE ORDER (MAIN ENDPOINT)
// ============================================
app.post('/api/orders', orderLimiter, async (req, res) => {
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
  const cleanNotes = sanitizeString(notes).slice(0, 500);
  const normalizedItems = Array.isArray(items) ? items.map(normalizeOrderItem).filter(Boolean) : [];

  if (!cleanCustomerName || !cleanCustomerPhone || !cleanAddress || !cleanArea || normalizedItems.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields'
    });
  }

  if (!isValidPhone(cleanCustomerPhone)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid phone number'
    });
  }

  if (!isValidEmail(cleanCustomerEmail)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid email address'
    });
  }

  if (normalizedItems.length > 50) {
    return res.status(400).json({
      success: false,
      error: 'Too many items in order'
    });
  }

  const cleanSubtotal = Number(
    normalizedItems
      .reduce((sum, item) => sum + (item.price * item.quantity), 0)
      .toFixed(2)
  );
  const cleanDeliveryCharge = toMoney(deliveryCharge ?? 0);
  if (cleanDeliveryCharge === null) {
    return res.status(400).json({
      success: false,
      error: 'Invalid delivery charge'
    });
  }

  const cleanTotal = Number((cleanSubtotal + cleanDeliveryCharge).toFixed(2));
  const requestedTotal = toMoney(total);
  if (requestedTotal !== null && Math.abs(requestedTotal - cleanTotal) > 0.5) {
    return res.status(400).json({
      success: false,
      error: 'Order total mismatch'
    });
  }

  console.log('Order request received', {
    ip: req.ip,
    itemsCount: normalizedItems.length,
    hasEmail: Boolean(cleanCustomerEmail)
  });

  const orderNumber = `SK-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

  let connection;
  try {
    connection = await pool.getConnection();
  } catch (dbError) {
    console.error('Order creation failed: database unavailable');
    return res.status(503).json({
      success: false,
      error: 'Service temporarily unavailable. Please try again.'
    });
  }

  try {
    await connection.beginTransaction();

    const [orderResult] = await connection.execute(
      `INSERT INTO orders (
        order_number, customer_name, customer_phone, customer_email,
        address, area, subtotal, delivery_charge, total, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderNumber,
        cleanCustomerName,
        cleanCustomerPhone,
        cleanCustomerEmail || null,
        cleanAddress,
        cleanArea,
        cleanSubtotal,
        cleanDeliveryCharge,
        cleanTotal,
        cleanNotes || null
      ]
    );
    const orderId = orderResult.insertId;

    for (const item of normalizedItems) {
      await connection.execute(
        `INSERT INTO order_items (
          order_id, product_id, name, price, quantity, item_type, variant, deal_items
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          null,
          item.name,
          item.price,
          item.quantity,
          item.type,
          item.variant,
          item.dealItems ? JSON.stringify(item.dealItems) : null
        ]
      );
    }

    const orderData = {
      orderNumber,
      customerName: cleanCustomerName,
      customerPhone: cleanCustomerPhone,
      customerEmail: cleanCustomerEmail,
      address: cleanAddress,
      area: cleanArea,
      subtotal: cleanSubtotal,
      deliveryCharge: cleanDeliveryCharge,
      total: cleanTotal,
      notes: cleanNotes
    };

        try {
      await sendOrderEmails(orderData, normalizedItems);
    } catch (emailError) {
      console.error('Order email send failed:', emailError.message);
    }
   // Send to Discord
    // Send to Discord
    /**try {
      // Format items list
      const itemsList = normalizedItems.map(item => 
        `• ${item.name} x${item.quantity} - Rs ${item.price * item.quantity}`
      ).join('\n');

      await fetch(process.env.DISCORD_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: "Sam's Kitchen Bot",
          embeds: [{
            title: `🛒 New Order #${orderNumber}`,
            color: 0x8e5d3d,
            fields: [
              { name: '👤 Customer', value: cleanCustomerName, inline: true },
              { name: '📞 Phone', value: cleanCustomerPhone, inline: true },
              { name: '📍 Area', value: cleanArea, inline: true },
              { name: '🛍️ Items', value: itemsList.substring(0, 1024) }, // Discord limit
              { name: '💰 Subtotal', value: `Rs ${cleanSubtotal}`, inline: true },
              { name: '🚚 Delivery', value: `Rs ${cleanDeliveryCharge}`, inline: true },
              { name: '💵 Total', value: `**Rs ${cleanTotal}**`, inline: true },
              { name: '🏠 Address', value: cleanAddress.substring(0, 100) }
            ],
            timestamp: new Date().toISOString()
          }]
        })
      });
      console.log('✅ Discord notification sent');
    } catch (discordError) {
      console.error('Discord error:', discordError.message);
    }**/
    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      data: {
        orderId,
        orderNumber,
        total: cleanTotal,
        status: 'pending'
      }
    });
    } catch (error) {
    try {
      await connection.rollback();
    } catch (rollbackError) {
      console.error('Order rollback failed:', rollbackError.message);
    }
    console.error('❌ Order creation failed:', error.message);
    console.error('Full error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create order: ' + error.message
    });
  }
   finally {
    if (connection) connection.release();
  }
});
// Get all orders (Admin)
app.get('/api/orders', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM orders ORDER BY id DESC');
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch orders' });
  }
});

// Get single order with items
app.get('/api/orders/:orderNumber', async (req, res) => {
  try {
    const [orders] = await pool.execute(
      'SELECT * FROM orders WHERE order_number = ?',
      [req.params.orderNumber]
    );

    if (orders.length === 0) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const [items] = await pool.execute(
      'SELECT * FROM order_items WHERE order_id = ?',
      [orders[0].id]
    );

    // Parse deal_items JSON
    const parsedItems = items.map(item => ({
      ...item,
      deal_items: item.deal_items ? JSON.parse(item.deal_items) : null
    }));

    res.json({ 
      success: true, 
      data: { ...orders[0], items: parsedItems }
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch order' });
  }
});

// Update order status
app.patch('/api/orders/:orderNumber/status', async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'confirmed', 'preparing', 'out-for-delivery', 'delivered', 'cancelled'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, error: 'Invalid status' });
  }

  try {
    await pool.execute(
      'UPDATE orders SET status = ? WHERE order_number = ?',
      [status, req.params.orderNumber]
    );
    res.json({ success: true, message: 'Order status updated' });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ success: false, error: 'Failed to update status' });
  }
});

// Get daily sales report
app.get('/api/reports/daily-sales', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM daily_sales LIMIT 30');
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching daily sales:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch report' });
  }
});

// Get popular products
app.get('/api/reports/popular-products', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM popular_products LIMIT 10');
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching popular products:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch report' });
  }
});

// ============================================
// ERROR HANDLING
// ============================================
app.use((err, req, res, next) => {
  console.error('Unhandled error');
  res.status(500).json({ 
    success: false, 
    error: 'Something went wrong. Please try again.' 
  });
});


// 404 for API only
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'API route not found' });
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║                                                        ║
║           🍴 SAM'S KITCHEN API SERVER 🍴               ║
║                                                        ║
║   Server running on: http://0.0.0.0:${PORT}            ║
║   Health check: http://0.0.0.0:${PORT}/api/health      ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;


