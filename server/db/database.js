/**
 * database.js — SQLite Setup, Schema & Seed Data
 * Khelo Ji Cricket Store
 */

const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'shop.db');
const db = new Database(DB_PATH);

// Enable WAL mode for performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

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
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    seller_id   INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name        TEXT    NOT NULL,
    price       INTEGER NOT NULL,
    category    TEXT    NOT NULL,
    description TEXT,
    image_url   TEXT,
    stock       INTEGER NOT NULL DEFAULT 10,
    badge       TEXT,
    is_active   INTEGER NOT NULL DEFAULT 1,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
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

  // All existing hardcoded products
  const products = [
    { name: 'ABD(360°) Cricket Bat', price: 24999, category: 'bat', badge: 'bestseller', stock: 12, image_url: 'https://images.weserv.nl/?url=https://cricketershop.com/cdn/shop/files/EM_360_Bold_English_Willow_Cricket_Bat_Size_SH_Front_View.png', description: 'English Willow cricket bat engineered for 360-degree stroke play. Ideal for aggressive batsmen who play all around the wicket.' },
    { name: 'Reebok English Willow', price: 18500, category: 'bat', badge: 'new', stock: 8, image_url: 'https://images.weserv.nl/?url=https://cricketershop.com/cdn/shop/files/reebok-english-willow-default-title-reebok-blast-pro-english-willow-cricket-bat-size-sh-38761399386292.jpg', description: 'Premium English Willow bat from Reebok. High-grade Grade 1+ willow with a thick edge and pronounced bow for maximum power.' },
    { name: 'SG Sierra Plus', price: 9999, category: 'bat', badge: null, stock: 15, image_url: 'https://images.weserv.nl/?url=https://cricketershop.com/cdn/shop/files/sg-english-willow-size-5-sg-slammer-classic-english-willow-cricket-bat-size-38354299060404.jpg', description: 'SG Sierra Plus — a reliable English Willow bat built for consistent performance across all playing conditions.' },
    { name: 'Gray Nicolls V-Pro', price: 32000, category: 'bat', badge: 'bestseller', stock: 5, image_url: 'https://www.gray-nicolls.co.uk/cdn/shop/files/CAAA26EnglishWillowBatsLegendGOLDEditionBat_Face.jpg?v=1760956119&width=500', description: 'The Gray Nicolls Legend Gold Edition — professional-grade bat used by international cricketers. Exceptional balance and pickup.' },
    { name: 'DSC Be Fearless EW', price: 14500, category: 'bat', badge: 'new', stock: 10, image_url: 'https://images.weserv.nl/?url=https://whacksports.com.au/cdn/shop/files/DSC-Spliit-Special-Edition-English-Willow-Cricket-Bat-2024-1_35dd28cd-c4ce-4b1f-b490-724c42942c27.jpg?v=1727009989', description: 'DSC Special Edition English Willow. Fearless design, fearless performance. Built for power hitters.' },
    { name: 'Kookaburra Ghost Limited', price: 28500, category: 'bat', badge: 'new', stock: 6, image_url: 'https://images.weserv.nl/?url=https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRdgMXyTX1DpA6DlXI2f0qlEtoTJM1DfQfXLOdkpPfn8YG5aAIl1kATy7qM8zjMi5GNX4FhwVrVIGdecsfzuxxfqx-W0DA6_WU2R9Zyv9pMI7U3g5Xx7AfvOA', description: 'Kookaburra Ghost Limited Edition — an iconic bat with massive edges and a perfectly balanced profile for explosive batting.' },
    { name: 'SG Sunny Tonny Classic', price: 15500, category: 'bat', badge: 'limited', stock: 4, image_url: 'https://scssports.in/cdn/shop/files/1_ee211b00-c7b6-463f-a815-511d15407faa.png?v=1738058892&width=980', description: 'The SG Sunny Tonny Classic — a tribute bat co-designed with the legendary Sunil Gavaskar. Collector\'s item for cricket fans.' },
    { name: 'MRF Grand Edition', price: 42000, category: 'bat', badge: 'bestseller', stock: 3, image_url: 'https://images.weserv.nl/?url=https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcSlKXaE6DZv5cdWi4IguVHIyBW_QS_cacGZOk_Xfz-A9GrHnSnZwZeyX22nZpHWN6ClsoeC8Gr8psp-x6q7I6rFMoeF8fgy7qo_f1ZqNgkF0USu5qMkqY-qLA', description: 'MRF Grand Edition — the flagship bat from the iconic Indian brand. Same profile used by Virat Kohli. Grade 1 English Willow.' },
    { name: 'Kookaburra Kahuna Pro', price: 21000, category: 'bat', badge: null, stock: 7, image_url: 'https://images.weserv.nl/?url=https://www.vks.com/images/product/full/kookaburra-kahuna-pro-cricket-bat-40753-1.jpg', description: 'Kookaburra Kahuna Pro — a dominant bat with a mid-to-high sweet spot and premium English Willow. Built for test-level performance.' },
    { name: 'SS Red Leather Ball', price: 850, category: 'ball', badge: 'limited', stock: 50, image_url: 'https://5.imimg.com/data5/SELLER/Default/2023/10/349574141/GR/AB/PJ/2100883/ss-true-test-cricket-ball-1000x1000.jpg', description: 'SS True Test red leather ball. Hand-stitched with premium alum-tanned leather. Ideal for red-ball cricket and practice.' },
    { name: 'Kookaburra Turf White Ball', price: 15000, category: 'ball', badge: 'limited', stock: 20, image_url: 'https://images.weserv.nl/?url=https://cricketershop.com/cdn/shop/files/kookaburra-white-cricket-ball-adult-kookaburra-turf-white-official-odi-and-t20-cricket-ball-37411931619508.jpg?v=1745772520&width=1080', description: 'Official Kookaburra Turf White Ball — the ball used in ODIs and T20 internationals. Premium quality for competitive play.' },
    { name: 'SG Test White Ball', price: 4500, category: 'ball', badge: null, stock: 30, image_url: 'https://cdn.shopify.com/s/files/1/0827/6249/8336/files/1_fa9da12e-a4da-443b-9de1-686ff569629b.png?v=1720246548', description: 'SG Test White Ball — premium match-quality white leather ball for T20 and one-day format. Machine-stitched for uniformity.' },
    { name: 'Khelo Ji Cricket Ball', price: 950, category: 'ball', badge: null, stock: 100, image_url: 'https://imgs.search.brave.com/1pg8NwLnpf-jilza3MDbsvns-7Q3LWE5inZ-iAbSBVU/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9zdGF0aWMudmVjdGVlenl1LmNvbS9zeXN0ZW0vcmVzb3VyY2VzL3RodW1ibmFpbHMvMDI3LzI0My81MDMvc21hbGwvYS1tYWxlLWhhbmQtaG9sZGluZy1hLXJlZC10ZXN0LW1hdGNoLWxlYXRoZXItc3RpdGNoLWNyaWNrZXQtYmFsbC1jbG9zZXVwLXBpY3R1cmUtd2hpdGUtYmFja2dyb3VuZC1waG90by5qcGc', description: 'Khelo Ji branded leather cricket ball — perfect for club matches, practice sessions, and gully cricket alike.' },
    { name: 'SG Club Leather Ball', price: 700, category: 'ball', badge: null, stock: 80, image_url: 'https://m.media-amazon.com/images/I/31L0DdF4oLL._SY300_SX300_QL70_FMwebp_.jpg', description: 'SG Club Leather Ball — an affordable, durable option for school, college, and club-level cricket. Great seam life.' },
    { name: 'Masuri E-Line Helmet', price: 15499, category: 'protection', badge: null, stock: 8, image_url: 'https://images.weserv.nl/?url=https://uzisports.com/cdn/shop/products/masuri-Eline-Ti-helmet_300x.jpg', description: 'Masuri E-Line Titanium Helmet — ultimate protection with a titanium grille and ABS shell. ECB approved.' },
    { name: 'SS Pro Player Gloves', price: 4800, category: 'protection', badge: null, stock: 15, image_url: 'https://cricketerpro.com/cdn/shop/files/SS_Ton_Player_Ed_Batting_Gloves_1_Cricketer_Pro.jpg?v=1744401030', description: 'SS Ton Player Edition Batting Gloves — crafted from premium leather with maximum palm and finger protection.' },
    { name: 'Gray Nicolls Ultimate Pro', price: 6500, category: 'protection', badge: 'new', stock: 10, image_url: 'https://cricketershop.com/cdn/shop/files/gray-nicolls-titanium-grill-m-gray-nicolls-ultimate-pro-360-titanium-cricket-helmet-37990854656180.jpg?v=1745775256&width=1080', description: 'Gray Nicolls Ultimate Pro 360 Helmet — 360-degree vision grille with superior ventilation and head protection.' },
    { name: 'Bass Gloves', price: 3499, category: 'protection', badge: null, stock: 12, image_url: 'https://imgs.search.brave.com/hbFScLde27sGZzImq7w9lFpVupw88Vx3UrH06HkNJ7Q/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jcmlja2V0ZXJzaG9wLmNvbS9jZG4vc2hvcC9maWxlcy9iYXMtdmFtcGlyZS1iYXR0aW5nLWdsb3Zlcy1yaWdodC1oYW5kZWQtYmFzLXZhbXBpcmUtcGxheWVyLWVkaXRpb24tY3JpY2tldC1iYXR0aW5nLWdsb3Zlcy1tZW5zLXNpemUtcmlnaHQtYW5kLWxlZnQtaGFuZGVkLTM4MTE5NDc5MDgzMTg4LndlYnA_dj0xNzQ1NzcyNDMzJndpZHRoPTEwMDA', description: 'BAS Vampire Player Edition Batting Gloves — top-grain leather with advanced finger stall protection for serious batters.' },
    { name: 'SS Dragon Gloves', price: 2149, category: 'protection', badge: null, stock: 20, image_url: 'https://cricketerpro.com/cdn/shop/files/SSDragonBattingGloves2CricketerPro_1880x.webp?v=1766842404', description: 'SS Dragon Batting Gloves — designed for young cricketers and club players. Comfortable, durable, great grip.' },
    { name: 'SG Ecolite Batting Pads', price: 2200, category: 'protection', badge: null, stock: 18, image_url: 'https://images.weserv.nl/?url=https://cricketershop.com/cdn/shop/files/sg-batting-pads-junior-sg-rp-ecolite-cricket-batting-leg-guard-size-39055109882036.jpg?v=1745776104&width=1080', description: 'SG Ecolite Batting Pads — lightweight leg guards made from high-density foam. Excellent protection for juniors and club players.' },
    { name: 'Gray Nicolls Ultimate Pro 360 Helmet', price: 12000, category: 'protection', badge: null, stock: 6, image_url: 'https://images.weserv.nl/?url=https://cricketershop.com/cdn/shop/files/gray-nicolls-titanium-grill-m-gray-nicolls-ultimate-pro-360-titanium-cricket-helmet-38289690329268.webp?v=1745775259&width=1080', description: 'The definitive Gray Nicolls Pro 360 Helmet. Multi-directional impact protection system with titanium wire grille.' },
    { name: 'Kookaburra Batting Pad', price: 3799, category: 'protection', badge: null, stock: 14, image_url: 'https://cricketershop.com/cdn/shop/files/kookaburra-batting-pads-for-right-handed-batsman-adult-kookaburra-kahuna-600-cricket-batting-leg-guard-pads-37989254430900.jpg?v=1745772954&width=1080', description: 'Kookaburra Kahuna 600 Batting Pad — excellent protection with a split-cane construction and synthetic outer.' },
    { name: 'MoonWalker Thigh Guard', price: 4449, category: 'protection', badge: 'bestseller', stock: 9, image_url: 'https://cricketershop.com/cdn/shop/files/moonwalkr-thigh-guards-right-hand-batsman-xs-moonwalkr-2-0-cricket-batting-combo-thigh-guard-pad-navy-blue-38290342215860.webp?v=1745773223&width=1800', description: 'Moonwalkr 2.0 Thigh Guard — combo inner and outer protection for batters. Premium construction used by IPL players.' },
    { name: 'Shrey Masterclass Air', price: 9800, category: 'protection', badge: null, stock: 7, image_url: 'https://images.weserv.nl/?url=https://ik.imagekit.io/vyka3olhl/uk/product-3/navy-blue/SHREY_MASTER_CLASS_AIR_2.0_TITANIUM__H011_NAVY_4_HD_6udJFBW6-Z.webp', description: 'Shrey Masterclass Air 2.0 Titanium Grille Helmet — the choice of IPL professionals. Ultra-lightweight, maximum safety.' },
    { name: 'DSC Beginner Kit', price: 7999, category: 'protection', badge: null, stock: 11, image_url: 'https://cricketerpro.com/cdn/shop/files/DSCEconomyCricketKit1CricketerPro.jpg?v=1743709266', description: 'DSC Economy Cricket Kit — complete beginner package including bat, pads, gloves, and helmet for school cricketers.' },
    { name: 'SG Test Thigh Pad', price: 1800, category: 'protection', badge: null, stock: 25, image_url: 'https://images.weserv.nl/?url=https://cricketershop.com/cdn/shop/files/sg-thigh-guards-adult-sg-test-cricket-batting-thigh-guard-pad-38199021600948_1800x1800.webp', description: 'SG Test Thigh Guard — professional-grade thigh protection with high-density foam for serious match play.' },
    { name: 'SG Test Arm Guard', price: 950, category: 'protection', badge: 'bestseller', stock: 30, image_url: 'https://images.weserv.nl/?url=https://cricketershop.com/cdn/shop/files/sg-elbow-guards-mens-sg-test-cricket-batting-elbow-guard-size-39052541034676_1800x1800.png', description: 'SG Test Elbow Guard — premium arm protection with articulated foam pads and adjustable velcro straps.' },
    { name: 'Robo Arm', price: 1499, category: 'accessories', badge: null, stock: 20, image_url: 'https://cricketerpro.com/cdn/shop/files/Roboarm-black.jpg?v=1696974716', description: 'Robo Arm training aid — improve your batting technique and footwork with this innovative cricket training tool.' },
    { name: 'Grey Nicolls Cricket Trunk', price: 799, category: 'accessories', badge: 'new', stock: 40, image_url: 'https://cricketerpro.com/cdn/shop/files/CoverpointTrunksMens_Cricketerpro.jpg?v=1696808919', description: 'Gray Nicolls Coverpoint Cricket Trunks — comfortable, breathable inner shorts for batters and wicketkeepers.' },
    { name: 'SG Steadler 5.0 Cricket Shoes', price: 1400, category: 'accessories', badge: null, stock: 25, image_url: 'https://cricketerpro.com/cdn/shop/files/1_ac7c6be2-350d-4920-8563-c7a2073ebf23.jpg?v=1696974978', description: 'SG Steadler 5.0 Spiked Cricket Shoes — durable, comfortable shoes with metal spikes for excellent grip on turf.' },
    { name: 'Cricket Stumps', price: 1249, category: 'accessories', badge: 'bestseller', stock: 35, image_url: 'https://cricketerpro.com/cdn/shop/files/NIVI_Spring_Stumps_2_Cricketer_Pro_medium.webp?v=1770493278', description: 'NIVI Spring Stumps — regulation-size cricket stumps with spring base. Easy to set up, perfect for practice and matches.' },
    { name: 'Shrey Intense Compression Sleeve', price: 1299, category: 'accessories', badge: null, stock: 50, image_url: 'https://cricketershop.com/cdn/shop/files/shrey-training-s-shrey-intense-compression-cricket-long-sleeve-colour-navy-blue-38319779971252.webp?v=1745773347&width=540', description: 'Shrey Intense Compression Long Sleeve — worn by cricketers under kit for warmth and muscle support during cold conditions.' },
    { name: 'Puma Rubber Shoes', price: 6299, category: 'accessories', badge: null, stock: 18, image_url: 'https://imgs.search.brave.com/gMEGs5NKwCVRMklR0Iv4oEZdcHCzMCzXqCLqPW9TZDA/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jcmlja2V0em9uZXVzYS5jb20vY2RuL3Nob3AvZmlsZXMvRzFfMmYwNDBiNDgtYzI2ZS00N2ZkLWE5MGMtMDI0Njg0ZDYzYzQ0XzM4MHg0MjBfY3JvcF9jZW50ZXIuanBnP3Y9MTY5ODM3NzMzNA', description: 'Puma Rubber Cricket Shoes — ideal for hard pitches and indoor cricket. Non-marking rubber sole with superior traction.' },
    { name: 'Nike Domain Spike Shoes', price: 13799, category: 'accessories', badge: null, stock: 10, image_url: 'https://cricketershop.com/cdn/shop/files/Nike_Domain_3_Low_Spikes_Cricket_Shoes_Composite_View.webp?v=1771497992&width=1080', description: 'Nike Domain 3 Low Spike Cricket Shoes — professional-grade spiked shoes with Nike\'s reactive foam cushioning for all-day comfort.' },
    { name: 'SS Gutsy Pro Kit Bag', price: 7500, category: 'accessories', badge: 'limited', stock: 12, image_url: 'https://images.weserv.nl/?url=https://www.pentathlon.in/wp-content/uploads/2021/07/gutsy_ton-1_2.jpg', description: 'SS Gutsy Pro Kit Bag — large-capacity cricket bag with separate bat, boot, and accessory compartments. Team-quality bag.' },
    { name: 'SS Bat Cover Full PVC', price: 800, category: 'accessories', badge: null, stock: 60, image_url: 'https://images.weserv.nl/?url=https://whacksports.com.au/cdn/shop/products/SS-Bat-Cover-Flap-Type-Blue-2024-2_1200x1200.jpg', description: 'SS Full PVC Bat Cover — durable bat case with flap-type closure. Protects your willow from moisture and dust.' },
    { name: 'SS Bat Grip Multi-Color', price: 250, category: 'accessories', badge: 'new', stock: 100, image_url: 'https://images.weserv.nl/?url=https://cricketshop.co.za/wp-content/uploads/2019/05/SS-CHEVRON-GRIP_SKU-100443.jpg', description: 'SS Chevron Bat Grip — replace your worn grip easily with this textured PU grip. Available in multiple colors.' },
    { name: 'SS Bat Oil', price: 350, category: 'accessories', badge: 'new', stock: 80, image_url: 'https://images.weserv.nl/?url=https://www.sstoncricket.com/wp-content/uploads/2023/04/IMG-20250919-WA0002.jpg', description: 'SS Raw Linseed Bat Oil — essential pre-season treatment for new English Willow bats to improve durability and performance.' },
    { name: 'Khelo Ji Official Grip', price: 199, category: 'accessories', badge: null, stock: 150, image_url: 'https://cricketershop.com/cdn/shop/files/GM_Band_Matrix_Cricket_Bat_Handle_Grip_Single_Front_View.jpg?v=1765179150&width=1080', description: 'Khelo Ji branded GM Matrix bat grip — designed for excellent moisture absorption and a non-slip hold during batting.' },
    { name: 'SS Sun Glass', price: 2199, category: 'accessories', badge: null, stock: 22, image_url: 'https://www.sstoncricket.com/wp-content/uploads/2025/01/falcon-6000.jpg', description: 'SS Falcon 6000 Cricket Sunglasses — polarized lenses with UV400 protection. Essential for fielders in bright conditions.' },
  ];

  const insertProduct = db.prepare(
    `INSERT INTO products (seller_id, name, price, category, description, image_url, stock, badge)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const insertMany = db.transaction((products) => {
    for (const p of products) {
      insertProduct.run(sellerId, p.name, p.price, p.category, p.description, p.image_url, p.stock, p.badge || null);
    }
  });

  insertMany(products);

  console.log(`✅ Seeded ${products.length} products and 2 demo users.`);
  console.log('   Seller: seller@kheloji.com / seller123');
  console.log('   Buyer:  buyer@kheloji.com  / buyer123');
}

seedDatabase();

module.exports = db;
