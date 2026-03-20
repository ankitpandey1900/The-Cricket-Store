document.addEventListener('DOMContentLoaded', () => {
    // ---- State ----
    let cart = JSON.parse(localStorage.getItem('my_cricket_cart')) || [];
    // Fallback for previous item versions without quantity
    cart.forEach(item => { if (!item.quantity) item.quantity = 1; });
    let currentQuickViewItem = null; // Temp hold item for Quick View Add

    // ---- DOM Elements ----
    const searchBar = document.getElementById('search-bar');
    const categoryBtns = document.querySelectorAll('.cat-btn');
    const allProducts = document.querySelectorAll('.product');

    const cartNavCount = document.getElementById('cart-count');
    const cartNavBtn = document.getElementById('cart-nav');
    
    // Cart Modal Elements
    const cartModal = document.getElementById('cart-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const cartItemsContainer = document.getElementById('cart-items-container');
    const modalTotalPrice = document.getElementById('modal-total-price');
    const checkoutBtn = document.getElementById('checkout-btn');
    
    // Checkout Modal Elements
    const checkoutModal = document.getElementById('checkout-modal');
    const closeCheckoutBtn = document.getElementById('close-checkout-btn');
    const checkoutForm = document.getElementById('checkout-form');
    const checkoutTotal = document.getElementById('checkout-total');

    // Quick View Modal Elements
    const quickviewTriggers = document.querySelectorAll('.quick-view-trigger');
    const quickviewModal = document.getElementById('quickview-modal');
    const closeQuickviewBtn = document.getElementById('close-quickview-btn');
    const qvImg = document.getElementById('qv-img');
    const qvTitle = document.getElementById('qv-title');
    const qvPrice = document.getElementById('qv-price');
    const qvAddBtn = document.getElementById('qv-add-btn');

    const toast = document.getElementById('toast');
    
    // Original Form Submits (Add to Cart logic)
    const forms = document.querySelectorAll('form[action="/add-to-cart"]');

    // Initialize UI on load
    updateCartUI();

    // ---- Event Listeners ----
    
    // 1. Search Bar Logic
    if (searchBar) {
        searchBar.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            
            // Remove active style from category buttons if searching
            categoryBtns.forEach(btn => {
                btn.style.background = 'white';
                btn.style.color = '#333';
                btn.style.border = '1px solid #ccc';
            });
            
            allProducts.forEach(product => {
                const name = product.querySelector('h3').textContent.toLowerCase();
                if (name.includes(query)) {
                    product.style.display = 'block';
                } else {
                    product.style.display = 'none';
                }
            });
        });
    }

    // 2. Category Filter Chips Logic
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const selectedCat = e.target.getAttribute('data-cat');

            // Reset Search Bar
            if (searchBar) searchBar.value = '';

            // Styling up the buttons
            categoryBtns.forEach(b => {
                b.style.background = 'white';
                b.style.color = '#333';
                b.style.border = '1px solid #ccc';
            });
            e.target.style.background = '#006400';
            e.target.style.color = 'white';
            e.target.style.border = 'none';

            // Filter the products grid
            allProducts.forEach(product => {
                const productCat = product.getAttribute('data-category');
                if (selectedCat === 'all' || productCat === selectedCat) {
                    product.style.display = 'block';
                } else {
                    product.style.display = 'none';
                }
            });
        });
    });

    // 3. Quick View Modal Interaction
    quickviewTriggers.forEach(img => {
        img.addEventListener('click', (e) => {
            const productDiv = e.target.closest('.product');
            const name = productDiv.querySelector('h3').textContent.trim();
            const priceText = productDiv.querySelector('p').textContent;
            const imgSrc = e.target.src;
            const price = parseInt(priceText.replace(/[^0-9]/g, ''), 10);

            // Populate Quick View
            qvImg.src = imgSrc;
            qvTitle.textContent = name;
            qvPrice.textContent = `₹${price.toLocaleString('en-IN')}`;
            
            // Store temporarily for the add button
            currentQuickViewItem = { name, price };

            // Show Modal
            quickviewModal.style.display = 'flex';
        });
    });

    closeQuickviewBtn.addEventListener('click', () => {
        quickviewModal.style.display = 'none';
    });

    qvAddBtn.addEventListener('click', () => {
        if (currentQuickViewItem) {
            addToCart(currentQuickViewItem);
            showToast(`${currentQuickViewItem.name} added to cart!`);
            quickviewModal.style.display = 'none';
        }
    });

    // 4. Standard Add to Cart Logic
    forms.forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const productDiv = form.closest('.product');
            const name = productDiv.querySelector('h3').textContent.trim();
            const priceText = productDiv.querySelector('p').textContent;
            
            const price = parseInt(priceText.replace(/[^0-9]/g, ''), 10);
            
            addToCart({ name, price });
            showToast(`${name} added to cart!`);
        });
    });

    // 5. Cart UI Interactions (Opening/Closing)
    cartNavBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openModal();
    });

    closeModalBtn.addEventListener('click', closeModal);
    
    cartModal.addEventListener('click', (e) => {
        if (e.target === cartModal) closeModal();
    });

    // Delegated Event listening for + / - / Remove Buttons Inside the Cart Modal
    cartItemsContainer.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index, 10);
        if (isNaN(index)) return;

        if (e.target.classList.contains('remove-item')) {
            cart.splice(index, 1);
            saveCart();
            updateCartUI();
        } else if (e.target.classList.contains('qty-plus')) {
            cart[index].quantity += 1;
            saveCart();
            updateCartUI();
        } else if (e.target.classList.contains('qty-minus')) {
            if (cart[index].quantity > 1) {
                cart[index].quantity -= 1;
                saveCart();
                updateCartUI();
            }
        }
    });

    // 6. Checkout Navigation
    checkoutBtn.addEventListener('click', () => {
        closeModal();
        let totalVal = 0;
        cart.forEach(item => totalVal += (item.price * item.quantity));
        checkoutTotal.textContent = totalVal.toLocaleString('en-IN');
        checkoutModal.style.display = 'flex';
    });

    closeCheckoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        checkoutModal.style.display = 'none';
        openModal(); 
    });

    checkoutForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const customerName = document.getElementById('cust-name').value;
        const msg = `🎉 Order Confirmed! Thank you ${customerName}.`;
        showToast(msg);
        
        checkoutModal.style.display = 'none';
        cart = [];
        saveCart();
        updateCartUI();
        checkoutForm.reset();
    });


    // ---- Core Functions ----
    function addToCart(newItem) {
        // Check if item already exists based on Name
        const existingItem = cart.find(item => item.name === newItem.name);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            newItem.quantity = 1;
            cart.push(newItem);
        }
        
        saveCart();
        updateCartUI();
    }

    function saveCart() {
        localStorage.setItem('my_cricket_cart', JSON.stringify(cart));
    }

    function updateCartUI() {
        // Nav Badge = Total Quantity Sum
        const totalItemsInCart = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartNavCount.textContent = totalItemsInCart;

        cartItemsContainer.innerHTML = '';
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p style="text-align:center; color:#777; margin:20px 0;">Your cart is empty.</p>';
            checkoutBtn.disabled = true;
            modalTotalPrice.textContent = '₹0';
            checkoutBtn.style.opacity = '0.5';
            checkoutBtn.style.cursor = 'not-allowed';
            return;
        }

        checkoutBtn.disabled = false;
        checkoutBtn.style.opacity = '1';
        checkoutBtn.style.cursor = 'pointer';

        let grandTotal = 0;

        // Render each stacked item
        cart.forEach((item, index) => {
            const itemTotal = item.price * item.quantity;
            grandTotal += itemTotal;
            
            const itemDiv = document.createElement('div');
            itemDiv.style.display = 'flex';
            itemDiv.style.justifyContent = 'space-between';
            itemDiv.style.alignItems = 'center';
            itemDiv.style.marginBottom = '15px';
            itemDiv.style.paddingBottom = '15px';
            itemDiv.style.borderBottom = '1px solid #eee';

            itemDiv.innerHTML = `
                <div style="text-align:left; flex:2;">
                    <div style="font-weight:bold; font-size:15px; color:#333; margin-bottom:5px;">${item.name}</div>
                    <div style="color:#006400; font-size:14px; font-weight:bold;">₹${item.price.toLocaleString('en-IN')} x ${item.quantity} = ₹${itemTotal.toLocaleString('en-IN')}</div>
                </div>
                
                <div style="flex:1; display:flex; justify-content:center; align-items:center; gap:8px;">
                    <button class="qty-minus" data-index="${index}" style="padding:2px 8px; border:1px solid #ccc; background:#f9f9f9; font-weight:bold; cursor:pointer; border-radius:3px;">-</button>
                    <span style="font-weight:bold; width:15px; text-align:center;">${item.quantity}</span>
                    <button class="qty-plus" data-index="${index}" style="padding:2px 8px; border:1px solid #ccc; background:#f9f9f9; font-weight:bold; cursor:pointer; border-radius:3px;">+</button>
                </div>

                <div style="flex:1; text-align:right;">
                    <button class="remove-item" data-index="${index}" style="background:#dc3545; color:white; padding:6px 10px; font-size:12px; border-radius:4px; border:none; font-weight:bold; cursor:pointer;">Remove</button>
                </div>
            `;
            cartItemsContainer.appendChild(itemDiv);
        });

        // Update Total
        modalTotalPrice.textContent = `₹${grandTotal.toLocaleString('en-IN')}`;
    }

    function openModal() {
        cartModal.style.display = 'flex';
    }

    function closeModal() {
        cartModal.style.display = 'none';
    }

    function showToast(msg) {
        toast.textContent = msg;
        toast.style.visibility = 'visible';
        
        // Hide after 3.5s
        setTimeout(() => {
            toast.style.visibility = 'hidden';
        }, 3500);
    }
});
