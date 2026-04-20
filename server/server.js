/**
 * server.js — Main Entry Point for Khelo Ji Backend
 * Express + SQLite (better-sqlite3)
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./db/database');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'khelo_ji_super_secret_key_123'; // In production, use process.env.JWT_SECRET

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..'))); // Serve static files from root

// Helpers
const generateToken = (user) => {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
};

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token.' });
    req.user = user;
    next();
  });
};

// ─────────────────────────────────────────────
// AUTH ROUTES
// ─────────────────────────────────────────────

app.post('/api/auth/register', (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'All fields required.' });

  try {
    const passwordHash = bcrypt.hashSync(password, 10);
    const stmt = db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)');
    const result = stmt.run(name, email.toLowerCase(), passwordHash, role || 'buyer');
    
    const user = { id: result.lastInsertRowid, name, email, role: role || 'buyer' };
    const token = generateToken(user);
    res.status(201).json({ user, token });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Email already registered.' });
    }
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });

  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken(user);
    res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error during login.' });
  }
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// ─────────────────────────────────────────────
// PRODUCT ROUTES
// ─────────────────────────────────────────────

app.get('/api/products', (req, res) => {
  try {
    const products = db.prepare('SELECT * FROM products WHERE is_active = 1').all();
    // Parse specs JSON
    const parsed = products.map(p => ({
      ...p,
      specs: p.specs ? JSON.parse(p.specs) : null,
      image: p.image_url,
      originalPrice: p.original_price,
      createdAt: new Date(p.created_at + ' UTC').toISOString()
    }));
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products.' });
  }
});

app.get('/api/products/seller', authenticateToken, (req, res) => {
  if (req.user.role !== 'seller') return res.status(403).json({ error: 'Sellers only.' });
  try {
    const products = db.prepare('SELECT * FROM products WHERE seller_id = ?').all(req.user.id);
    const parsed = products.map(p => ({
      ...p,
      specs: p.specs ? JSON.parse(p.specs) : null,
      image: p.image_url,
      originalPrice: p.original_price,
      createdAt: new Date(p.created_at + ' UTC').toISOString()
    }));
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch seller products.' });
  }
});

app.post('/api/products', authenticateToken, (req, res) => {
  if (req.user.role !== 'seller') return res.status(403).json({ error: 'Sellers only.' });
  const { name, brand, price, category, description, stock, badge, specs } = req.body;
  const image_url = req.body.image_url || req.body.image;
  const original_price = req.body.original_price || req.body.originalPrice;

  try {
    const stmt = db.prepare(`
      INSERT INTO products (seller_id, name, brand, price, original_price, category, description, image_url, stock, badge, specs)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      req.user.id, name, brand || 'Khelo Ji', price, original_price || null, 
      category, description, image_url, stock || 10, badge || null, 
      specs ? JSON.stringify(specs) : null
    );
    res.status(201).json({ id: result.lastInsertRowid, message: 'Product created.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create product.' });
  }
});

app.put('/api/products/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'seller') return res.status(403).json({ error: 'Sellers only.' });
  const { id } = req.params;
  const updates = req.body;

  try {
    // Check ownership
    const product = db.prepare('SELECT seller_id FROM products WHERE id = ?').get(id);
    if (!product) return res.status(404).json({ error: 'Product not found.' });
    if (product.seller_id !== req.user.id) return res.status(403).json({ error: 'Not your product.' });

    // Build dynamic update query
    const fields = Object.keys(updates).filter(k => k !== 'id' && k !== 'seller_id');
    if (fields.length === 0) return res.status(400).json({ error: 'No updates provided.' });

    const sql = `UPDATE products SET ${fields.map(f => `${f === 'image' ? 'image_url' : f} = ?`).join(', ')} WHERE id = ?`;
    const values = fields.map(f => f === 'specs' ? JSON.stringify(updates[f]) : updates[f]);
    db.prepare(sql).run(...values, id);

    res.json({ message: 'Product updated.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update product.' });
  }
});

app.delete('/api/products/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'seller') return res.status(403).json({ error: 'Sellers only.' });
  const { id } = req.params;

  try {
    const product = db.prepare('SELECT seller_id FROM products WHERE id = ?').get(id);
    if (!product) return res.status(404).json({ error: 'Product not found.' });
    if (product.seller_id !== req.user.id) return res.status(403).json({ error: 'Not your product.' });

    db.prepare('DELETE FROM products WHERE id = ?').run(id);
    res.json({ message: 'Product deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete product.' });
  }
});

// ─────────────────────────────────────────────
// ORDER ROUTES
// ─────────────────────────────────────────────

app.post('/api/orders', authenticateToken, (req, res) => {
  const { items, total, shipping_name, shipping_address, phone, razorpay_payment_id } = req.body;
  if (!items || !items.length) return res.status(400).json({ error: 'No items in order.' });

  try {
    db.exec('BEGIN TRANSACTION');

    // 1. Create Order
    const orderStmt = db.prepare(`
      INSERT INTO orders (buyer_id, total, status, razorpay_payment_id, shipping_name, shipping_address, phone)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const orderResult = orderStmt.run(
      req.user.id, total, 'paid', razorpay_payment_id || 'MOCK_PAY', shipping_name, shipping_address, phone
    );
    const orderId = orderResult.lastInsertRowid;

    // 2. Add Items & Update Stock
    const itemStmt = db.prepare(`
      INSERT INTO order_items (order_id, product_id, product_name, quantity, price_at_purchase)
      VALUES (?, ?, ?, ?, ?)
    `);
    const stockStmt = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');

    for (const item of items) {
      itemStmt.run(orderId, item.id, item.name, item.quantity, item.price);
      stockStmt.run(item.quantity, item.id);
    }

    db.exec('COMMIT');
    res.status(201).json({ id: `ORD-${orderId}`, status: 'paid', message: 'Order placed.' });
  } catch (err) {
    db.exec('ROLLBACK');
    console.error('Order Error:', err.message);
    res.status(500).json({ error: 'Failed to place order.' });
  }
});

app.get('/api/orders/buyer', authenticateToken, (req, res) => {
  try {
    const orders = db.prepare('SELECT * FROM orders WHERE buyer_id = ? ORDER BY created_at DESC').all(req.user.id);
    
    // For each order, get items
    const ordersWithItems = orders.map(o => {
      const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(o.id);
      const normalizedItems = items.map(i => ({ ...i, price: i.price_at_purchase }));
      return { 
        ...o, 
        items: normalizedItems, 
        buyerName: o.shipping_name,
        createdAt: new Date(o.created_at + ' UTC').toISOString()
      };
    });
    
    res.json(ordersWithItems);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders.' });
  }
});

app.get('/api/orders/seller', authenticateToken, (req, res) => {
  if (req.user.role !== 'seller') return res.status(403).json({ error: 'Sellers only.' });
  try {
    // Get orders that contain the seller's products
    const orders = db.prepare(`
      SELECT DISTINCT o.* FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      WHERE p.seller_id = ?
      ORDER BY o.created_at DESC
    `).all(req.user.id);

    const ordersWithItems = orders.map(o => {
      const items = db.prepare(`
        SELECT oi.* FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ? AND p.seller_id = ?
      `).all(o.id, req.user.id);
      const normalizedItems = items.map(i => ({ ...i, price: i.price_at_purchase }));
      return { 
        ...o, 
        items: normalizedItems, 
        buyerName: o.shipping_name,
        createdAt: new Date(o.created_at + ' UTC').toISOString()
      };
    });

    res.json(ordersWithItems);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch seller orders.' });
  }
});

app.patch('/api/orders/:id/status', authenticateToken, (req, res) => {
  if (req.user.role !== 'seller') return res.status(403).json({ error: 'Sellers only.' });
  const { id } = req.params;
  const { status } = req.body;

  try {
    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, id.replace('ORD-', ''));
    res.json({ message: 'Order status updated.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update order status.' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Khelo Ji Server running at http://localhost:${PORT}`);
});
