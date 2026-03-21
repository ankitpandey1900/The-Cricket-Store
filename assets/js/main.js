/**
 * Entry Point - Khelo Ji
 * Orchestrates the modular components.
 */

import { showToast } from './utils.js';
import { addToCart, updateCartUI, handleCartActions, getCart } from './cart.js';
import * as ui from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
    // ---- DOM Elements ----
    const searchBar = document.getElementById('search-bar');
    const categoryBtns = document.querySelectorAll('.cat-btn');
    const allProducts = document.querySelectorAll('.product');
    const cartNavBtn = document.getElementById('cart-nav');
    const cartModal = document.getElementById('cart-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const cartItemsContainer = document.getElementById('cart-items-container');
    const checkoutBtn = document.getElementById('checkout-btn');
    const checkoutModal = document.getElementById('checkout-modal');
    const quickviewModal = document.getElementById('quickview-modal');
    
    // Initialize UI
    updateCartUI();

    // ---- Module Initializers ----
    ui.initSearch(allProducts, categoryBtns);
    ui.initFilters(categoryBtns, allProducts, searchBar);
    
    ui.initQuickView(
        document.querySelectorAll('.quick-view-trigger'),
        quickviewModal,
        {
            img: document.getElementById('qv-img'),
            title: document.getElementById('qv-title'),
            price: document.getElementById('qv-price')
        },
        addToCart,
        showToast
    );

    // ---- General Listeners ----

    // Shop Now Scroll
    const heroCta = document.querySelector('.hero-cta');
    if (heroCta) {
        heroCta.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('products-section').scrollIntoView({ behavior: 'smooth' });
        });
    }

    // Add to Cart Forms
    document.querySelectorAll('form[action="/add-to-cart"]').forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const productDiv = form.closest('.product');
            const name = productDiv.querySelector('h3').textContent.trim();
            const priceText = productDiv.querySelector('p').textContent;
            const price = parseInt(priceText.replace(/[^0-9]/g, ''), 10);
            
            addToCart({ name, price }, showToast);
        });
    });

    // Cart Modal Toggles
    if (cartNavBtn) cartNavBtn.addEventListener('click', () => ui.toggleModal(cartModal, 'flex'));
    if (closeModalBtn) closeModalBtn.addEventListener('click', () => ui.toggleModal(cartModal, 'none'));
    
    window.addEventListener('click', (e) => {
        if (e.target === cartModal) ui.toggleModal(cartModal, 'none');
        if (e.target === checkoutModal) ui.toggleModal(checkoutModal, 'none');
    });

    // Cart Actions (Delegated)
    if (cartItemsContainer) {
        cartItemsContainer.addEventListener('click', handleCartActions);
    }

    // Checkout Flow
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            ui.toggleModal(cartModal, 'none');
            const totalVal = getCart().reduce((sum, item) => sum + (item.price * item.quantity), 0);
            document.getElementById('checkout-total').textContent = totalVal.toLocaleString('en-IN');
            ui.toggleModal(checkoutModal, 'flex');
        });
    }

    const closeCheckoutBtn = document.getElementById('close-checkout-btn');
    if (closeCheckoutBtn) {
        closeCheckoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            ui.toggleModal(checkoutModal, 'none');
            ui.toggleModal(cartModal, 'flex');
        });
    }

    // Razorpay Integration
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const customerName = document.getElementById('cust-name').value;
            const cartData = getCart();
            const totalVal = cartData.reduce((sum, item) => sum + (item.price * item.quantity), 0);

            const options = {
                "key": "rzp_test_YOUR_KEY_HERE",
                "amount": totalVal * 100,
                "currency": "INR",
                "name": "Khelo Ji",
                "description": "Premium Cricket Equipment",
                "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQpCV4y0zd9kh1PSHWPsgwtOAs6jC30cfpf4w&s",
                "handler": function (response) {
                    showToast(`🎉 Payment Successful! ID: ${response.razorpay_payment_id}`);
                    ui.toggleModal(checkoutModal, 'none');
                    // Clear cart
                    localStorage.removeItem('my_cricket_cart');
                    window.location.reload(); 
                },
                "prefill": { "name": customerName },
                "theme": { "color": "#e5000a" }
            };
            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', (resp) => showToast(`❌ Failed: ${resp.error.description}`));
            rzp.open();
        });
    }
});
