/**
 * database.js — SQLite Setup, Schema & Seed Data
 * Khelo Ji Cricket Store
 */

const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'shop.db');
const db = new DatabaseSync(DB_PATH);

// Note: node:sqlite handles some pragmas differently, but let's stick to standard SQL
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

// ─────────────────────────────────────────────
// SCHEMA
// ─────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT    NOT NULL,
    email         TEXT    UNIQUE NOT NULL,
    password_hash TEXT    NOT NULL,
    role          TEXT    NOT NULL DEFAULT 'buyer',
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS products (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    seller_id      INTEGER REFERENCES users(id) ON DELETE CASCADE,
    brand          TEXT    DEFAULT 'Khelo Ji',
    name           TEXT    NOT NULL,
    price          INTEGER NOT NULL,
    original_price INTEGER,
    category       TEXT    NOT NULL,
    description    TEXT,
    image_url      TEXT,
    stock          INTEGER NOT NULL DEFAULT 10,
    rating         REAL    DEFAULT 0,
    review_count   INTEGER DEFAULT 0,
    badge          TEXT,
    specs          TEXT,   -- JSON string
    is_active      INTEGER NOT NULL DEFAULT 1,
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS orders (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    buyer_id            INTEGER REFERENCES users(id),
    total               INTEGER NOT NULL,
    status              TEXT    NOT NULL DEFAULT 'pending',
    razorpay_order_id   TEXT,
    razorpay_payment_id TEXT,
    shipping_name       TEXT,
    shipping_address    TEXT,
    phone               TEXT,
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id            INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id          INTEGER REFERENCES products(id),
    product_name        TEXT    NOT NULL,
    quantity            INTEGER NOT NULL,
    price_at_purchase   INTEGER NOT NULL
  );
`);

// ─────────────────────────────────────────────
// SEED DATA
// ─────────────────────────────────────────────
function seedDatabase() {
  const sellerExists = db.prepare('SELECT id FROM users WHERE email = ?').get('seller@kheloji.com');
  if (sellerExists) return; // Already seeded

  console.log('🌱 Seeding database...');

  // Create demo seller
  const sellerHash = bcrypt.hashSync('seller123', 10);
  const sellerResult = db.prepare(
    `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)`
  ).run('Khelo Ji Official', 'seller@kheloji.com', sellerHash, 'seller');
  const sellerId = sellerResult.lastInsertRowid;

  // Create demo buyer
  const buyerHash = bcrypt.hashSync('buyer123', 10);
  db.prepare(
    `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)`
  ).run('Demo Buyer', 'buyer@kheloji.com', buyerHash, 'buyer');

  // All existing hardcoded products from the frontend v1
  const products = [
    { 
      brand: 'SG', name: 'ABD(360°) Cricket Bat', price: 24999, original_price: 29999, category: 'bat', 
      description: 'The legendary English Willow bat engineered for 360-degree stroke play.', 
      image_url: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=500&q=80', 
      stock: 5, rating: 4.9, review_count: 124, badge: 'bestseller', 
      specs: { willow: 'Grade 1 English', weight: '1.1kg', edges: '40mm' } 
    },
    { 
      brand: 'Reebok', name: 'Reebok Wing Edition', price: 18500, original_price: 22000, category: 'bat', 
      description: 'Premium choice for professional touch and powerful drives.', 
      image_url: 'https://images.unsplash.com/photo-1624526267942-ade09630f972?w=500&q=80', 
      stock: 8, rating: 4.7, review_count: 89, badge: 'new' 
    },
    { 
      brand: 'SG', name: 'SG Sierra Plus', price: 9999, original_price: 12000, category: 'bat', 
      description: 'Versatile English Willow bat, balanced for consistent performance.', 
      image_url: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=500&q=80', 
      stock: 15, rating: 4.5, review_count: 210 
    },
    { 
      brand: 'Gray Nicolls', name: 'V-Pro Professional', price: 32000, original_price: 38000, category: 'bat', 
      description: 'Elite grade English Willow with explosive power and lightweight pick-up.', 
      image_url: 'https://images.unsplash.com/photo-1624526267942-ade09630f972?w=500&q=80', 
      stock: 3, rating: 4.9, review_count: 45, badge: 'bestseller' 
    },
    { 
      brand: 'SS', name: 'SS Red Leather Ball', price: 850, original_price: 1100, category: 'ball', 
      description: 'Standard 4-piece leather ball for club matches.', 
      image_url: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=500&q=80', 
      stock: 100, rating: 4.6, review_count: 500, badge: 'limited' 
    },
    { 
      brand: 'Masuri', name: 'E-Line Titanium Helmet', price: 15499, original_price: 18000, category: 'protection', 
      description: 'World-class protection with a high-grade titanium grille.', 
      image_url: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=500&q=80', 
      stock: 10, rating: 4.8, review_count: 112 
    },
    { 
      brand: 'SG', name: 'SG Kit Bag Professional', price: 1500, original_price: 2000, category: 'accessories', 
      description: 'Durable nylon bag with wheels and multiple compartments.', 
      image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80', 
      stock: 40, rating: 4.4, review_count: 75 
    },
    { 
      brand: 'SS', name: 'SS Bat Linseed Oil', price: 350, original_price: 450, category: 'accessories', 
      description: 'Essential for maintaining and knocking in English Willow bats.', 
      image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80', 
      stock: 200, rating: 4.3, review_count: 300, badge: 'new' 
    },
    { 
      brand: 'SG', name: 'SG Test Thigh Pad', price: 1800, original_price: 2200, category: 'protection', 
      description: 'Dual-density foam protection for high-level match play.', 
      image_url: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=500&q=80', 
      stock: 30, rating: 4.7, review_count: 145 
    },
    { 
      brand: 'SG', name: 'SG Test Arm Guard', price: 950, original_price: 1200, category: 'protection', 
      description: 'Lightweight and ergonomic protection for the forearm.', 
      image_url: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=500&q=80', 
      stock: 50, rating: 4.5, review_count: 85, badge: 'bestseller' 
    },
    { 
      brand: 'Khelo Ji', name: 'Match Grade Ball', price: 950, original_price: 1200, category: 'ball', 
      description: 'Premium Khelo Ji branded white ball for T20 night matches.', 
      image_url: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=500&q=80', 
      stock: 120, rating: 4.8, review_count: 64 
    },
    { 
      brand: 'SG', name: 'SG Club Ball', price: 700, original_price: 900, category: 'ball', 
      description: 'Ideal for training and club matches, high-quality leather.', 
      image_url: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=500&q=80', 
      stock: 250, rating: 4.2, review_count: 420 
    },
    { 
      brand: 'SG', name: 'SG Test White Pads', price: 4500, original_price: 5500, category: 'protection', 
      description: 'Traditional wrap-around batting pads for maximum comfort.', 
      image_url: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=500&q=80', 
      stock: 15, rating: 4.7, review_count: 98 
    },
    { 
      brand: 'Nike', name: 'Lunar Dominate Spikes', price: 12999, original_price: 15000, category: 'shoes', 
      description: 'High-performance spikes with superior grip and traction.', 
      image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80', 
      stock: 25, rating: 4.9, review_count: 32, badge: 'trending' 
    }
  ];

  const insertProduct = db.prepare(
    `INSERT INTO products (seller_id, brand, name, price, original_price, category, description, image_url, stock, rating, review_count, badge, specs)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  try {
    db.exec('BEGIN TRANSACTION');
    for (const p of products) {
      insertProduct.run(
        sellerId, 
        p.brand, 
        p.name, 
        p.price, 
        p.original_price, 
        p.category, 
        p.description, 
        p.image_url, 
        p.stock, 
        p.rating, 
        p.review_count, 
        p.badge || null, 
        p.specs ? JSON.stringify(p.specs) : null
      );
    }
    db.exec('COMMIT');
    console.log(`✅ Seeded ${products.length} products and 2 demo users.`);
  } catch (err) {
    db.exec('ROLLBACK');
    console.error('❌ Seeding failed:', err.message);
  }
}

seedDatabase();

module.exports = db;
