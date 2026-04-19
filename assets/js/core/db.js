/**
 * db.js — localStorage "Database" for Khelo Ji
 * Acts as a persistent in-browser data store.
 * No server needed — perfect for demos & presentations.
 */

const DB_KEYS = {
  PRODUCTS: 'khelo_ji_products',
  USERS: 'khelo_ji_users',
  ORDERS: 'khelo_ji_orders',
  CURRENT_USER: 'khelo_ji_current_user',
};

// ─────────────────────────────────────────
// SEED PRODUCTS (run once on first visit)
// ─────────────────────────────────────────
const SEED_PRODUCTS = [
  { 
    id: 1, sellerId: 'seller_1', brand: 'SG', name: 'ABD(360°) Cricket Bat', 
    price: 24999, originalPrice: 29999, category: 'bat', badge: 'bestseller', 
    stock: 12, rating: 4.9, reviewCount: 124, 
    specs: { willow: 'Grade 1 English', weight: '1.1kg', edges: '40mm' }, 
    image: 'https://images.weserv.nl/?url=https://cricketershop.com/cdn/shop/files/EM_360_Bold_English_Willow_Cricket_Bat_Size_SH_Front_View.png', 
    description: 'English Willow cricket bat engineered for 360-degree stroke play. Ideal for aggressive batsmen who play all around the wicket.', 
    active: true 
  },
  { 
    id: 2, sellerId: 'seller_1', brand: 'Reebok', name: 'Reebok English Willow', 
    price: 18500, originalPrice: 22000, category: 'bat', badge: 'new', 
    stock: 8, rating: 4.7, reviewCount: 89, 
    specs: { willow: 'Grade 1', weight: '1.2kg' }, 
    image: 'https://images.weserv.nl/?url=https://cricketershop.com/cdn/shop/files/reebok-english-willow-default-title-reebok-blast-pro-english-willow-cricket-bat-size-sh-38761399386292.jpg', 
    description: 'Premium English Willow bat from Reebok. High-grade Grade 1+ willow with thick edge and pronounced bow for maximum power.', 
    active: true 
  },
  { 
    id: 3, sellerId: 'seller_1', brand: 'SG', name: 'SG Sierra Plus', 
    price: 9999, originalPrice: 12000, category: 'bat', badge: null, 
    stock: 15, rating: 4.5, reviewCount: 210, 
    specs: { willow: 'English', weight: '1.15kg' }, 
    image: 'https://images.weserv.nl/?url=https://cricketershop.com/cdn/shop/files/sg-english-willow-size-5-sg-slammer-classic-english-willow-cricket-bat-size-38354299060404.jpg', 
    description: 'SG Sierra Plus — a reliable English Willow bat built for consistent performance across all playing conditions.', 
    active: true 
  },
  { 
    id: 4, sellerId: 'seller_1', brand: 'Gray Nicolls', name: 'Gray Nicolls V-Pro', 
    price: 32000, originalPrice: 38000, category: 'bat', badge: 'bestseller', 
    stock: 5, rating: 4.9, reviewCount: 45, 
    specs: { willow: 'Limited Edition', weight: '1.18kg' }, 
    image: 'https://www.gray-nicolls.co.uk/cdn/shop/files/CAAA26EnglishWillowBatsLegendGOLDEditionBat_Face.jpg?v=1760956119&width=500', 
    description: 'The Gray Nicolls Legend Gold Edition — professional-grade bat used by international cricketers.', 
    active: true 
  },
  { 
    id: 10, sellerId: 'seller_1', brand: 'SS', name: 'SS Red Leather Ball', 
    price: 850, originalPrice: 1100, category: 'ball', badge: 'limited', 
    stock: 50, rating: 4.6, reviewCount: 500, 
    specs: { material: 'Alum Tanned', stitching: 'Hand Stitched' }, 
    image: 'https://5.imimg.com/data5/SELLER/Default/2023/10/349574141/GR/AB/PJ/2100883/ss-true-test-cricket-ball-1000x1000.jpg', 
    description: 'SS True Test red leather ball. Hand-stitched with premium alum-tanned leather.', 
    active: true 
  },
  { 
    id: 15, sellerId: 'seller_1', brand: 'Masuri', name: 'Masuri E-Line Helmet', 
    price: 15499, originalPrice: 18000, category: 'protection', badge: null, 
    stock: 8, rating: 4.8, reviewCount: 112, 
    specs: { grill: 'Titanium', weight: '750g' }, 
    image: 'https://images.weserv.nl/?url=https://uzisports.com/cdn/shop/products/masuri-Eline-Ti-helmet_300x.jpg', 
    description: 'Masuri E-Line Titanium Helmet — ultimate protection with titanium grille. ECB approved.', 
    active: true 
  },
];

const SEED_USERS = [
  { id: 'seller_1', name: 'Khelo Ji Official', email: 'seller@kheloji.com', password: 'seller123', role: 'seller', createdAt: new Date().toISOString() },
  { id: 'buyer_1',  name: 'Sachin OG',        email: 'buyer@kheloji.com',  password: 'buyer123',  role: 'buyer',  createdAt: new Date().toISOString() },
];

// ─────────────────────────────────────────
// INITIALIZATION
// ─────────────────────────────────────────
function initDB() {
  if (!localStorage.getItem(DB_KEYS.PRODUCTS)) {
    localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(SEED_PRODUCTS));
  }
  if (!localStorage.getItem(DB_KEYS.USERS)) {
    localStorage.setItem(DB_KEYS.USERS, JSON.stringify(SEED_USERS));
  }
  if (!localStorage.getItem(DB_KEYS.ORDERS)) {
    localStorage.setItem(DB_KEYS.ORDERS, JSON.stringify([]));
  }
}

// ─────────────────────────────────────────
// PRODUCTS
// ─────────────────────────────────────────
function getAllProducts() {
  return JSON.parse(localStorage.getItem(DB_KEYS.PRODUCTS) || '[]');
}

function getActiveProducts() {
  return getAllProducts().filter(p => p.active !== false);
}

function getProductById(id) {
  return getAllProducts().find(p => p.id == id) || null;
}

function getProductsBySeller(sellerId) {
  return getAllProducts().filter(p => p.sellerId === sellerId);
}

function addProduct(product) {
  const products = getAllProducts();
  const newProduct = {
    ...product,
    id: Date.now(),
    active: true,
    createdAt: new Date().toISOString(),
  };
  products.push(newProduct);
  localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(products));
  return newProduct;
}

function updateProduct(id, updates) {
  const products = getAllProducts();
  const idx = products.findIndex(p => p.id == id);
  if (idx === -1) return null;
  products[idx] = { ...products[idx], ...updates };
  localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(products));
  return products[idx];
}

function deleteProduct(id) {
  const products = getAllProducts().filter(p => p.id != id);
  localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(products));
}

// ─────────────────────────────────────────
// USERS / AUTH
// ─────────────────────────────────────────
function getAllUsers() {
  return JSON.parse(localStorage.getItem(DB_KEYS.USERS) || '[]');
}

function getUserByEmail(email) {
  return getAllUsers().find(u => u.email === email.toLowerCase()) || null;
}

function registerUser(name, email, password, role) {
  const users = getAllUsers();
  if (users.find(u => u.email === email.toLowerCase())) {
    return { error: 'Email already registered.' };
  }
  const newUser = {
    id: `${role}_${Date.now()}`,
    name, email: email.toLowerCase(), password, role,
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
  return { user: newUser };
}

function loginUser(email, password) {
  const user = getUserByEmail(email);
  if (!user || user.password !== password) {
    return { error: 'Invalid email or password.' };
  }
  const session = { id: user.id, name: user.name, email: user.email, role: user.role };
  localStorage.setItem(DB_KEYS.CURRENT_USER, JSON.stringify(session));
  return { user: session };
}

function getCurrentUser() {
  return JSON.parse(localStorage.getItem(DB_KEYS.CURRENT_USER) || 'null');
}

function logoutUser() {
  localStorage.removeItem(DB_KEYS.CURRENT_USER);
}

// ─────────────────────────────────────────
// ORDERS
// ─────────────────────────────────────────
function getAllOrders() {
  return JSON.parse(localStorage.getItem(DB_KEYS.ORDERS) || '[]');
}

function getOrdersByBuyer(buyerId) {
  return getAllOrders().filter(o => o.buyerId === buyerId);
}

function getOrdersForSeller(sellerId) {
  return getAllOrders().filter(o => o.items.some(i => i.sellerId === sellerId));
}

function placeOrder(buyerId, buyerName, items, total, shippingAddress, paymentId, phone) {
  const orders = getAllOrders();
  const newOrder = {
    id: `ORD-${Date.now()}`,
    buyerId, buyerName, items, total, shippingAddress,
    phone, // Captured for WhatsApp
    paymentId: paymentId || `PAY-${Date.now()}`,
    status: 'paid',
    createdAt: new Date().toISOString(),
  };
  orders.push(newOrder);
  localStorage.setItem(DB_KEYS.ORDERS, JSON.stringify(orders));

  // --- STOCK MANAGEMENT ---
  const allProducts = getAllProducts();
  items.forEach(orderItem => {
    const product = allProducts.find(p => p.id == orderItem.id || p.name === orderItem.name);
    if (product) {
      product.stock = Math.max(0, product.stock - (orderItem.quantity || 1));
    }
  });
  localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(allProducts));

  return newOrder;
}

function updateOrderStatus(orderId, status) {
  const orders = getAllOrders();
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx === -1) return null;
  orders[idx].status = status;
  localStorage.setItem(DB_KEYS.ORDERS, JSON.stringify(orders));
  return orders[idx];
}

// Export as global object (no module system needed)
window.KheloJiDB = {
  init: initDB,
  products: { getAll: getActiveProducts, getById: getProductById, getBySeller: getProductsBySeller, add: addProduct, update: updateProduct, delete: deleteProduct, getAllRaw: getAllProducts },
  users: { register: registerUser, login: loginUser, current: getCurrentUser, logout: logoutUser },
  orders: { getByBuyer: getOrdersByBuyer, getForSeller: getOrdersForSeller, place: placeOrder, updateStatus: updateOrderStatus },
};
