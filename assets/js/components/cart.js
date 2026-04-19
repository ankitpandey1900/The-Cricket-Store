/**
 * handles all state and UI updates for the shopping cart.
 */
import { formatPrice } from '../core/utils.js';

// Initial State (Internal to module)
let cart = JSON.parse(localStorage.getItem('my_cricket_cart')) || [];
cart.forEach(item => { if (!item.quantity) item.quantity = 1; });

export function clearCart() {
    cart = [];
    localStorage.removeItem('my_cricket_cart');
    updateCartUI();
}

export function getCart() {
    return cart;
}

export function saveCart() {
    localStorage.setItem('my_cricket_cart', JSON.stringify(cart));
}

export function addToCart(newItem, showToastFn) {
    const existingItem = cart.find(item => item.name === newItem.name);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        newItem.quantity = 1;
        cart.push(newItem);
    }
    
    saveCart();
    updateCartUI();
    
    if (showToastFn) {
        showToastFn(`${newItem.name} added to cart!`);
    }
}

export function updateCartUI() {
    const cartNavCount = document.getElementById('cart-count');
    const cartItemsContainer = document.getElementById('cart-items-container');
    const modalTotalPrice = document.getElementById('modal-total-price');
    const checkoutBtn = document.getElementById('checkout-btn');

    if (!cartNavCount || !cartItemsContainer) return;

    // Nav Badge = Total Quantity Sum
    const totalItemsInCart = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartNavCount.textContent = totalItemsInCart;

    cartItemsContainer.innerHTML = '';
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="empty-cart-wrap">
                <div class="empty-cart-icon">🛍️</div>
                <p style="font-weight:600; font-size:16px; color:#111; margin-bottom:5px;">Your bag is empty.</p>
                <p style="font-size:14px;">Once you add something, it will appear here.</p>
            </div>
        `;
        if (checkoutBtn) {
            checkoutBtn.disabled = true;
            checkoutBtn.style.opacity = '0.5';
            checkoutBtn.style.cursor = 'not-allowed';
        }
        if (modalTotalPrice) modalTotalPrice.textContent = '₹0';
        return;
    }

    if (checkoutBtn) {
        checkoutBtn.disabled = false;
        checkoutBtn.style.opacity = '1';
        checkoutBtn.style.cursor = 'pointer';
    }

    let grandTotal = 0;

    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        grandTotal += itemTotal;
        
        const itemDiv = document.createElement('div');
        itemDiv.className = 'cart-item-row'; 
        // Styles moved to modals.css

        itemDiv.innerHTML = `
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">${formatPrice(item.price)} × ${item.quantity} = ${formatPrice(itemTotal)}</div>
            </div>
            
            <div class="cart-item-qty-ctrl">
                <button class="qty-minus" data-index="${index}">−</button>
                <span class="qty-value">${item.quantity}</span>
                <button class="qty-plus" data-index="${index}">+</button>
            </div>

            <div class="cart-item-remove-wrap">
                <button class="remove-item" data-index="${index}">Remove</button>
            </div>
        `;
        cartItemsContainer.appendChild(itemDiv);
    });

    if (modalTotalPrice) modalTotalPrice.textContent = `₹${grandTotal.toLocaleString('en-IN')}`;
}

export function handleCartActions(e) {
    const index = parseInt(e.target.dataset.index, 10);
    if (isNaN(index)) return;

    if (e.target.classList.contains('remove-item')) {
        cart.splice(index, 1);
    } else if (e.target.classList.contains('qty-plus')) {
        cart[index].quantity += 1;
    } else if (e.target.classList.contains('qty-minus')) {
        if (cart[index].quantity > 1) {
            cart[index].quantity -= 1;
        }
    }
    
    saveCart();
    updateCartUI();
}
