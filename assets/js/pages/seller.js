/**
 * seller.js — Seller Dashboard Logic
 * Khelo Ji Store
 */

document.addEventListener('DOMContentLoaded', async () => {
    await window.KheloJiDB.init();

    // Elements
    const sellerPanelOverview = document.getElementById('panel-overview');
    const sellerPanelAdd = document.getElementById('panel-add');
    const sellerPanelProducts = document.getElementById('panel-products');
    const sellerPanelOrders = document.getElementById('panel-orders');
    
    const sellerTabOverview = document.getElementById('tab-overview');
    const sellerTabAdd = document.getElementById('tab-add');
    const sellerTabProducts = document.getElementById('tab-products');
    const sellerTabOrders = document.getElementById('tab-orders');

    const sellerNameDisplay = document.getElementById('seller-name-display');
    const toastEl = document.getElementById('toast');
    const editModal = document.getElementById('edit-modal');

    // Auth guard
    const seller = window.KheloJiDB.users.current();
    if (!seller || seller.role !== 'seller') {
        window.location.href = 'login.html';
        return;
    }

    if (sellerNameDisplay) sellerNameDisplay.textContent = seller.name;

    window.logout = () => {
        window.KheloJiDB.users.logout();
        window.location.href = 'login.html';
    };

    // ─── PANEL NAVIGATION ───
    window.showPanel = async (id) => {
        [sellerPanelOverview, sellerPanelAdd, sellerPanelProducts, sellerPanelOrders].forEach(p => p && p.classList.remove('active'));
        [sellerTabOverview, sellerTabAdd, sellerTabProducts, sellerTabOrders].forEach(t => t && t.classList.remove('active'));
        
        const activePanel = document.getElementById('panel-' + id);
        const activeTab = document.getElementById('tab-' + id);
        if (activePanel) activePanel.classList.add('active');
        if (activeTab) activeTab.classList.add('active');

        if (id === 'overview') await renderOverview();
        if (id === 'products') await renderProductsTable();
        if (id === 'orders') await renderOrdersTable();
    };

    function showToast(msg) {
        if (!toastEl) return;
        toastEl.textContent = msg;
        toastEl.classList.add('show');
        setTimeout(() => toastEl.classList.remove('show'), 3000);
    }

    // ─── OVERVIEW ───
    async function renderOverview() {
        const myProducts = await window.KheloJiDB.products.getBySeller(seller.id);
        const allOrders = await window.KheloJiDB.orders.getForSeller(seller.id);

        let revenue = 0;
        allOrders.forEach(o => {
            o.items.filter(i => i.sellerId === seller.id).forEach(i => { revenue += i.price * i.quantity; });
        });

        const revStat = document.getElementById('stat-revenue');
        const ordStat = document.getElementById('stat-orders');
        const listStat = document.getElementById('stat-listings');
        
        if (revStat) revStat.textContent = '₹' + revenue.toLocaleString('en-IN');
        if (ordStat) ordStat.textContent = allOrders.length;
        if (listStat) listStat.textContent = myProducts.filter(p => p.active).length;

        const tbody = document.getElementById('recent-orders-tbody');
        if (!tbody) return;

        const recent = allOrders.slice(-5).reverse();
        if (recent.length === 0) {
            tbody.innerHTML = '<tr class="empty-row"><td colspan="6">No orders yet. Share your store link!</td></tr>';
            return;
        }
        tbody.innerHTML = recent.map(o => {
            const date = new Date(o.createdAt).toLocaleDateString('en-IN');
            const totalForSeller = o.items.filter(i => i.sellerId === seller.id).reduce((sum, item) => sum + item.price * item.quantity, 0);
            return `<tr>
              <td style="font-family:monospace;font-size:12px;color:var(--red);">${o.id}</td>
              <td>${o.buyerName}</td>
              <td>${o.items.length} item${o.items.length > 1 ? 's' : ''}</td>
              <td style="font-weight:700;">₹${totalForSeller.toLocaleString('en-IN')}</td>
              <td><span class="status-badge status-${o.status}">${o.status}</span></td>
              <td style="color:var(--muted);">${date}</td>
            </tr>`;
        }).join('');
    }

    // ─── PRODUCTS TABLE ───
    window.renderProductsTable = async (filter = '') => {
        const allSellerProducts = await window.KheloJiDB.products.getBySeller(seller.id);
        const filtered = allSellerProducts.filter(p => p.name.toLowerCase().includes(filter.toLowerCase()));
        
        const countEl = document.getElementById('products-count');
        if (countEl) countEl.textContent = `${filtered.length} product${filtered.length !== 1 ? 's' : ''}`;

        const tbody = document.getElementById('products-tbody');
        if (!tbody) return;

        if (filtered.length === 0) {
            tbody.innerHTML = '<tr class="empty-row"><td colspan="8">No products yet. Go to "Add Product" to list your first item!</td></tr>';
            return;
        }
        tbody.innerHTML = filtered.map(p => {
            const badgeHtml = p.badge ? `<span class="badge-chip badge-${p.badge}">${p.badge}</span>` : '<span style="color:var(--muted);font-size:12px;">—</span>';
            return `<tr>
              <td><img class="product-img-thumb" src="${p.image}" alt="${p.name}" onerror="this.src='https://via.placeholder.com/44'"></td>
              <td class="product-name-cell">${p.name}</td>
              <td><span class="product-cat">${p.category}</span></td>
              <td style="font-weight:700;">₹${Number(p.price).toLocaleString('en-IN')}</td>
              <td>${p.stock}</td>
              <td>${badgeHtml}</td>
              <td>
                <button class="toggle-active ${p.active ? 'on' : 'off'}" onclick="toggleActive(${p.id})" title="${p.active ? 'Active' : 'Inactive'}">
                  ${p.active ? '●' : '○'}
                </button>
              </td>
              <td>
                <div class="action-btns">
                  <button class="btn-edit" onclick="openEditModal(${p.id})">Edit</button>
                  <button class="btn-del" onclick="deleteProduct(${p.id})">Delete</button>
                </div>
              </td>
            </tr>`;
        }).join('');
    };

    window.filterProductsTable = (val) => window.renderProductsTable(val);

    window.toggleActive = async (id) => {
        const p = await window.KheloJiDB.products.getById(id);
        if (!p) return;
        await window.KheloJiDB.products.update(id, { active: !p.active });
        await window.renderProductsTable();
        showToast(p.active ? '🔴 Product hidden from store.' : '🟢 Product now live in store!');
    };

    window.deleteProduct = async (id) => {
        if (!confirm('Are you sure you want to delete this product?')) return;
        await window.KheloJiDB.products.delete(id);
        await window.renderProductsTable();
        showToast('🗑️ Product deleted.');
    };

    // ─── ADD PRODUCT ───
    window.handleAddProduct = async () => {
        const name = document.getElementById('add-name').value.trim();
        const price = parseInt(document.getElementById('add-price').value);
        const category = document.getElementById('add-category').value;
        const stock = parseInt(document.getElementById('add-stock').value);
        const badge = document.getElementById('add-badge').value || null;
        const image = document.getElementById('add-image').value.trim();
        const brand = document.getElementById('add-brand').value.trim() || 'Khelo Ji';
        const originalPrice = parseInt(document.getElementById('add-original-price').value) || null;
        const description = document.getElementById('add-desc').value.trim();

        if (!name || !price || !category || isNaN(stock) || !image) {
            alert('Please fill all required fields (Name, Price, Category, Stock, Image URL).');
            return;
        }

        await window.KheloJiDB.products.add({ 
            sellerId: seller.id, 
            name, 
            brand,
            price, 
            originalPrice,
            category, 
            stock, 
            badge, 
            image, 
            description: description || 'Quality cricket equipment from Khelo Ji.' 
        });
        window.clearAddForm();
        showToast('✅ Product listed successfully! It\'s live in the store.');
        window.showPanel('products');
    };

    window.clearAddForm = () => {
        ['add-name','add-price','add-category','add-stock','add-badge','add-image','add-desc'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
    };

    // ─── EDIT MODAL ───
    window.openEditModal = async (id) => {
        const p = await window.KheloJiDB.products.getById(id);
        if (!p) return;
        document.getElementById('edit-id').value = p.id;
        document.getElementById('edit-name').value = p.name;
        document.getElementById('edit-brand').value = p.brand || '';
        document.getElementById('edit-price').value = p.price;
        document.getElementById('edit-original-price').value = p.originalPrice || '';
        document.getElementById('edit-category').value = p.category;
        document.getElementById('edit-stock').value = p.stock;
        document.getElementById('edit-badge').value = p.badge || '';
        document.getElementById('edit-image').value = p.image;
        document.getElementById('edit-desc').value = p.description || '';
        editModal.classList.add('open');
    };

    window.closeEditModal = () => editModal.classList.remove('open');

    window.handleEditSave = async () => {
        const id = parseInt(document.getElementById('edit-id').value);
        const updates = {
            name: document.getElementById('edit-name').value.trim(),
            brand: document.getElementById('edit-brand').value.trim(),
            price: parseInt(document.getElementById('edit-price').value),
            originalPrice: parseInt(document.getElementById('edit-original-price').value) || null,
            category: document.getElementById('edit-category').value,
            stock: parseInt(document.getElementById('edit-stock').value),
            badge: document.getElementById('edit-badge').value || null,
            image: document.getElementById('edit-image').value.trim(),
            description: document.getElementById('edit-desc').value.trim(),
        };
        await window.KheloJiDB.products.update(id, updates);
        window.closeEditModal();
        await window.renderProductsTable();
        showToast('✅ Product updated!');
    };

    if (editModal) {
        editModal.addEventListener('click', e => {
            if (e.target === editModal) window.closeEditModal();
        });
    }

    // ─── ORDERS TABLE ───
    async function renderOrdersTable() {
        const orders = (await window.KheloJiDB.orders.getForSeller(seller.id)).reverse();
        const tbody = document.getElementById('orders-tbody');
        if (!tbody) return;

        if (orders.length === 0) {
            tbody.innerHTML = '<tr class="empty-row"><td colspan="7">No incoming orders yet.</td></tr>';
            return;
        }

        const rows = [];
        orders.forEach(order => {
            order.items.filter(i => i.sellerId === seller.id).forEach(item => {
                const date = new Date(order.createdAt).toLocaleDateString('en-IN');
                rows.push(`<tr>
                  <td style="font-family:monospace;font-size:12px;color:var(--red);">${order.id}</td>
                  <td>${order.buyerName}</td>
                  <td>${item.name}</td>
                  <td>${item.quantity}</td>
                  <td style="font-weight:700;">₹${(item.price * item.quantity).toLocaleString('en-IN')}</td>
                  <td>
                    <select class="order-status-select" onchange="updateOrderStatus('${order.id}', this.value)">
                      <option value="paid" ${order.status==='paid'?'selected':''}>Paid</option>
                      <option value="processing" ${order.status==='processing'?'selected':''}>Processing</option>
                      <option value="shipped" ${order.status==='shipped'?'selected':''}>Shipped</option>
                      <option value="delivered" ${order.status==='delivered'?'selected':''}>Delivered</option>
                    </select>
                  </td>
                  <td style="color:var(--muted);">${date}</td>
                </tr>`);
            });
        });
        tbody.innerHTML = rows.join('');
    }

    window.updateOrderStatus = async (orderId, status) => {
        await window.KheloJiDB.orders.updateStatus(orderId, status);
        showToast(`📦 Order ${orderId} marked as ${status}`);
    };

    // Initial render
    await renderOverview();
});
