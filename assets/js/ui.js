/**
 * UI Module
 * Handles non-cart UI interactions like filters, search, and modal toggles.
 */

export function initSearch(allProducts, categoryBtns) {
    const searchBar = document.getElementById('search-bar');
    if (!searchBar) return;

    searchBar.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        
        // Reset category buttons
        categoryBtns.forEach(btn => {
            btn.style.background = 'white';
            btn.style.color = '#333';
            btn.style.border = '1px solid #ccc';
        });
        
        allProducts.forEach(product => {
            const name = product.querySelector('h3').textContent.toLowerCase();
            product.style.display = name.includes(query) ? 'block' : 'none';
        });
    });
}

export function initFilters(categoryBtns, allProducts, searchBar) {
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const selectedCat = e.target.getAttribute('data-cat');

            if (searchBar) searchBar.value = '';

            // Styling
            categoryBtns.forEach(b => {
                b.style.background = 'white';
                b.style.color = '#111';
                b.style.border = '1px solid #e5e5e5';
            });
            e.target.style.background = '#111';
            e.target.style.color = 'white';
            e.target.style.border = '1.5px solid #111';

            // Filter Grid
            allProducts.forEach(product => {
                const productCat = product.getAttribute('data-category');
                product.style.display = (selectedCat === 'all' || productCat === selectedCat) ? 'block' : 'none';
            });
        });
    });
}

export function initQuickView(triggers, modal, qvElements, addToCartFn, showToastFn) {
    let currentQuickViewItem = null;

    triggers.forEach(img => {
        img.addEventListener('click', (e) => {
            const productDiv = e.target.closest('.product');
            const name = productDiv.querySelector('h3').textContent.trim();
            const priceText = productDiv.querySelector('p').textContent;
            const imgSrc = e.target.src;
            const price = parseInt(priceText.replace(/[^0-9]/g, ''), 10);

            qvElements.img.src = imgSrc;
            qvElements.title.textContent = name;
            qvElements.price.textContent = `₹${price.toLocaleString('en-IN')}`;
            
            currentQuickViewItem = { name, price };
            modal.style.display = 'flex';
        });
    });

    const closeBtn = modal.querySelector('.close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    const addBtn = document.getElementById('qv-add-btn');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            if (currentQuickViewItem) {
                addToCartFn(currentQuickViewItem, showToastFn);
                modal.style.display = 'none';
            }
        });
    }
}

export function toggleModal(modal, display) {
    if (modal) modal.style.display = display;
}
