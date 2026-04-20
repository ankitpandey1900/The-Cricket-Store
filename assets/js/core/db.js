/**
 * db.js — API Client for Khelo Ji (Backend SQL Bridge)
 * Replaces the old localStorage logic with asynchronous fetch calls.
 */

const API_BASE = 'http://localhost:3000/api';

const DB_KEYS = {
    TOKEN: 'khelo_ji_auth_token',
    USER: 'khelo_ji_current_user',
};

// ── Generic Fetch Wrapper ──
async function apiFetch(endpoint, options = {}) {
    const token = localStorage.getItem(DB_KEYS.TOKEN);
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
    };

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'API Request Failed');
        return data;
    } catch (err) {
        console.error(`API Error [${endpoint}]:`, err.message);
        throw err;
    }
}

// ─────────────────────────────────────────
// AUTH / USERS
// ─────────────────────────────────────────
async function loginUser(email, password) {
    try {
        const { user, token } = await apiFetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        localStorage.setItem(DB_KEYS.TOKEN, token);
        localStorage.setItem(DB_KEYS.USER, JSON.stringify(user));
        return { user };
    } catch (err) {
        return { error: err.message };
    }
}

async function registerUser(name, email, password, role) {
    try {
        const { user, token } = await apiFetch('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ name, email, password, role })
        });
        localStorage.setItem(DB_KEYS.TOKEN, token);
        localStorage.setItem(DB_KEYS.USER, JSON.stringify(user));
        return { user };
    } catch (err) {
        return { error: err.message };
    }
}

function getCurrentUser() {
    return JSON.parse(localStorage.getItem(DB_KEYS.USER) || 'null');
}

function logoutUser() {
    localStorage.removeItem(DB_KEYS.TOKEN);
    localStorage.removeItem(DB_KEYS.USER);
}

// ─────────────────────────────────────────
// PRODUCTS
// ─────────────────────────────────────────
async function getAllProducts() {
    return await apiFetch('/products');
}

async function getProductById(id) {
    const all = await getAllProducts();
    return all.find(p => p.id == id) || null;
}

async function getProductsBySeller() {
    return await apiFetch('/products/seller');
}

async function addProduct(product) {
    return await apiFetch('/products', {
        method: 'POST',
        body: JSON.stringify(product)
    });
}

async function updateProduct(id, updates) {
    return await apiFetch(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
    });
}

async function deleteProduct(id) {
    return await apiFetch(`/products/${id}`, {
        method: 'DELETE'
    });
}

// ─────────────────────────────────────────
// ORDERS
// ─────────────────────────────────────────
async function placeOrder(buyerId, buyerName, items, total, shippingAddress, paymentId, phone) {
    return await apiFetch('/orders', {
        method: 'POST',
        body: JSON.stringify({
            items,
            total,
            shipping_name: buyerName,
            shipping_address: shippingAddress,
            phone,
            razorpay_payment_id: paymentId
        })
    });
}

async function getOrdersForBuyer() {
    return await apiFetch('/orders/buyer');
}

async function getOrdersForSeller() {
    return await apiFetch('/orders/seller');
}

async function updateOrderStatus(orderId, status) {
    return await apiFetch(`/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
    });
}

// ─────────────────────────────────────────
// EXPORT
// ─────────────────────────────────────────
window.KheloJiDB = {
    init: () => console.log('🚀 Backend API Initialized'),
    users: { register: registerUser, login: loginUser, current: getCurrentUser, logout: logoutUser },
    products: { getAll: getAllProducts, getById: getProductById, getBySeller: getProductsBySeller, add: addProduct, update: updateProduct, delete: deleteProduct, getAllRaw: getAllProducts },
    orders: { getByBuyer: getOrdersForBuyer, getForSeller: getOrdersForSeller, place: placeOrder, updateStatus: updateOrderStatus },
};
