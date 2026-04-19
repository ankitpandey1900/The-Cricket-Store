/**
 * main.js — Khelo Ji Store Front
 * Fully dynamic: loads products from localStorage DB,
 * handles cart, auth-aware nav, and mock payment flow.
 */

import { showToast, formatPrice } from '../core/utils.js';
import { addToCart, updateCartUI, handleCartActions, getCart, clearCart } from '../components/cart.js';
import * as ui from '../components/ui.js';

document.addEventListener('DOMContentLoaded', () => {

    // ── Init DB ──
    window.KheloJiDB.init();

    // ── Auth-Aware Nav ──
    const user = window.KheloJiDB.users.current();
    const authNavEl = document.getElementById('auth-nav-links');
    if (user) {
        if (user.role === 'seller') {
            authNavEl.innerHTML = `<a href="pages/seller.html" style="color:#e5000a;font-weight:700;">🏪 My Dashboard</a> <a href="#" onclick="doLogout()">Logout</a>`;
        } else {
            authNavEl.innerHTML = `<a href="pages/orders.html">📦 My Orders</a> <a href="#" onclick="doLogout()">Logout</a>`;
        }
    } else {
        authNavEl.innerHTML = `<a href="pages/login.html">Login</a> <a href="pages/login.html" style="background:var(--red);color:white;padding:6px 16px;border-radius:20px;font-weight:700;">Register</a>`;
    } 

    window.doLogout = () => {
        window.KheloJiDB.users.logout();
        window.location.reload();
    };

    // ── Load & Render Products ──
    let allProducts = [];
    let currentCategory = 'all';
    let searchQuery = '';

    function renderProducts() {
        const grid = document.getElementById('product-grid');
        document.getElementById('loading-state')?.remove();

        let filtered = allProducts.filter(p => p.active !== false); // Hide inactive products
        
        if (currentCategory !== 'all') {
            filtered = filtered.filter(p => p.category === currentCategory);
        }
        if (searchQuery.trim()) {
            filtered = filtered.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
        }

        if (filtered.length === 0) {
            grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px;color:#888;">
                <div style="font-size:40px;margin-bottom:12px;">🔍</div>
                <p>No products found for "<strong>${searchQuery || currentCategory}</strong>".</p>
            </div>`;
            return;
        }

        grid.innerHTML = filtered.map(p => {
            const isOutOfStock = p.stock <= 0;
            const hasSale = p.originalPrice && p.originalPrice > p.price;
            const discountPct = hasSale ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0;

            const badgeHtml = p.badge
                ? `<span class="badge badge-${p.badge}">${p.badge === 'bestseller' ? 'Best Seller' : p.badge === 'new' ? 'New' : 'Limited'}</span>`
                : hasSale ? `<span class="badge badge-sale">-${discountPct}% SALE</span>` : '';
            
            const starHtml = p.rating 
                ? `<div class="p-rating">` + '★'.repeat(Math.round(p.rating)) + '☆'.repeat(5 - Math.round(p.rating)) + ` <span>(${p.reviewCount || 0})</span></div>`
                : '';

            const stockStatus = isOutOfStock ? `<span style="color:#ff4d4d;font-size:11px;font-weight:700;">OUT OF STOCK</span>` : ``;

            return `
            <div class="product ${isOutOfStock ? 'out-of-stock' : ''}" data-category="${p.category}" data-id="${p.id}">
                <div class="product-img-container">
                    ${badgeHtml}
                    <button class="wishlist-btn" title="Add to Wishlist">♡</button>
                    <img src="${p.image}" alt="${p.name}" style="cursor:pointer;" class="quick-view-trigger" loading="lazy" onerror="this.src='https://via.placeholder.com/200'">
                    <button class="add-to-cart-btn" data-id="${p.id}" ${isOutOfStock ? 'disabled' : ''}>
                        ${isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                </div>
                <div class="product-info">
                    <div class="p-brand">${p.brand || 'Khelo Ji'}</div>
                    <h3>${p.name}</h3>
                    <div class="p-price-row">
                        <span class="p-current-price">${formatPrice(p.price)}</span>
                        ${hasSale ? `<span class="p-old-price">${formatPrice(p.originalPrice)}</span>` : ''}
                    </div>
                    ${starHtml}
                    ${stockStatus}
                </div>
            </div>`;
        }).join('');

        // Attach add-to-cart listeners
        grid.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const productId = btn.dataset.id;
                const product = allProducts.find(p => p.id == productId);
                if (product) addToCart({ name: product.name, price: product.price, image: product.image }, showToast);
            });
        });

        // Attach quick view listeners
        grid.querySelectorAll('.quick-view-trigger').forEach(img => {
            img.addEventListener('click', () => {
                const productDiv = img.closest('.product');
                const productId = productDiv.dataset.id;
                const product = allProducts.find(p => p.id == productId);
                if (!product) return;
                document.getElementById('qv-img').src = product.image;
                document.getElementById('qv-title').textContent = product.name;
                document.getElementById('qv-price').textContent = formatPrice(product.price);
                document.getElementById('qv-desc').textContent = product.description || 'Premium quality cricket equipment from Khelo Ji.';
                
                const specsContainer = document.getElementById('qv-specs-container');
                if (specsContainer && product.specs) {
                    const specsRows = Object.entries(product.specs).map(([k, v]) => `
                        <div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid rgba(255,255,255,0.05); font-size:12px;">
                            <span style="color:#888; text-transform:capitalize;">${k}</span>
                            <span style="color:#fff; font-weight:600;">${v}</span>
                        </div>
                    `).join('');
                    specsContainer.innerHTML = `
                        <div style="margin-top:15px; background:rgba(255,255,255,0.03); padding:12px; border-radius:8px;">
                            <div style="font-size:11px; font-weight:800; color:var(--red); text-transform:uppercase; letter-spacing:1px; margin-bottom:8px;">Technical Details</div>
                            ${specsRows}
                        </div>
                    `;
                } else if (specsContainer) {
                    specsContainer.innerHTML = '';
                }

                const qvBtn = document.getElementById('qv-add-btn');
                qvBtn.onclick = () => {
                    addToCart({ name: product.name, price: product.price }, showToast);
                    ui.toggleModal(document.getElementById('quickview-modal'), 'none');
                };
                ui.toggleModal(document.getElementById('quickview-modal'), 'flex');
            });
        });

        // Wishlist toggle (visual only)
        grid.querySelectorAll('.wishlist-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.textContent === '♡') { btn.textContent = '❤️'; }
                else { btn.textContent = '♡'; }
            });
        });
    }

    // Load products from DB
    allProducts = window.KheloJiDB.products.getAll();
    renderProducts();

    // ── Category Filter ──
    document.querySelectorAll('.cat-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.dataset.cat;
            renderProducts();
        });
    });

    // ── Search ──
    const searchBar = document.getElementById('search-bar');
    if (searchBar) {
        searchBar.addEventListener('input', () => {
            searchQuery = searchBar.value;
            renderProducts();
        });
    }

    // ── Cart UI Init ──
    updateCartUI();

    // ── Cart Modal ──
    const cartModal = document.getElementById('cart-modal');
    const checkoutModal = document.getElementById('checkout-modal');
    const cartNavBtn = document.getElementById('cart-nav');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const closeCheckoutBtn = document.getElementById('close-checkout-btn');
    const cartItemsContainer = document.getElementById('cart-items-container');
    const checkoutBtn = document.getElementById('checkout-btn');

    if (cartNavBtn) cartNavBtn.addEventListener('click', () => ui.toggleModal(cartModal, 'flex'));
    if (closeModalBtn) closeModalBtn.addEventListener('click', () => ui.toggleModal(cartModal, 'none'));
    if (cartItemsContainer) cartItemsContainer.addEventListener('click', handleCartActions);

    window.addEventListener('click', (e) => {
        if (e.target === cartModal) ui.toggleModal(cartModal, 'none');
        if (e.target === checkoutModal) ui.toggleModal(checkoutModal, 'none');
    });

    // ── Checkout Flow ──
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            const cartUser = window.KheloJiDB.users.current();
            if (!cartUser) {
                ui.toggleModal(cartModal, 'none');
                if (confirm('Please log in to place an order. Go to login?')) window.location.href = 'pages/login.html';
                return;
            }
            ui.toggleModal(cartModal, 'none');
            const total = getCart().reduce((s, i) => s + i.price * i.quantity, 0);
            document.getElementById('checkout-total').textContent = total.toLocaleString('en-IN');
            ui.toggleModal(checkoutModal, 'flex');
        });
    }

    if (closeCheckoutBtn) {
        closeCheckoutBtn.addEventListener('click', () => {
            ui.toggleModal(checkoutModal, 'none');
            ui.toggleModal(cartModal, 'flex');
        });
    }

    // ── Quick View Close ──
    const qvModal = document.getElementById('quickview-modal');
    document.getElementById('close-quickview-btn')?.addEventListener('click', () => ui.toggleModal(qvModal, 'none'));
    window.addEventListener('click', e => { if (e.target === qvModal) ui.toggleModal(qvModal, 'none'); });

    // Hero CTA scroll
    document.querySelector('.hero-cta')?.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('products-section').scrollIntoView({ behavior: 'smooth' });
    });

    // ── Checkout Form → Mock Payment ──
    const checkoutForm = document.getElementById('checkout-form');
    let pendingOrderData = null;

    if (checkoutForm) {
        checkoutForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('cust-name').value.trim();
            const address = document.getElementById('cust-address').value.trim();
            const phone = document.getElementById('cust-phone').value.trim();
            if (!name || !address || !phone) return;

            const cartData = getCart();
            const total = cartData.reduce((s, i) => s + i.price * i.quantity, 0);

            pendingOrderData = { name, address, phone, cartData, total };

            // Close checkout, open mock payment
            ui.toggleModal(checkoutModal, 'none');
            document.getElementById('mock-pay-amount').textContent = total.toLocaleString('en-IN');
            document.getElementById('mock-pay-modal').style.display = 'flex';
        });
    }

    window.closeMockPay = () => {
        document.getElementById('mock-pay-modal').style.display = 'none';
        ui.toggleModal(checkoutModal, 'flex');
    };

    window.processMockPayment = () => {
        if (!pendingOrderData) return;
        const btn = document.getElementById('mock-pay-btn');
        btn.textContent = '⏳ Processing...';
        btn.disabled = true;
        btn.style.opacity = '0.7';

        setTimeout(() => {
            document.getElementById('mock-pay-modal').style.display = 'none';
            btn.textContent = 'Pay Now →';
            btn.disabled = false;
            btn.style.opacity = '1';

            const cartUser = window.KheloJiDB.users.current();
            const { name, address, phone, cartData, total } = pendingOrderData;

            // Attach sellerId to each item (from DB)
            const orderItems = cartData.map(item => {
                const productInDB = allProducts.find(p => p.name === item.name);
                return { ...item, id: productInDB ? productInDB.id : null, sellerId: productInDB ? productInDB.sellerId : 'seller_1' };
            });

            const paymentId = 'pay_' + Math.random().toString(36).substr(2, 14).toUpperCase();
            const order = window.KheloJiDB.orders.place(
                cartUser ? cartUser.id : 'guest',
                name,
                orderItems,
                total,
                address,
                paymentId,
                phone
            );

            clearCart();
            pendingOrderData = null;
            document.getElementById('payment-order-id').textContent = `Order ID: ${order.id}`;
            document.getElementById('payment-modal').style.display = 'flex';
        }, 2200);
    };

    window.closePaymentModal = () => {
        document.getElementById('payment-modal').style.display = 'none';
    };
});
