/**
 * orders.js — Buyer Order History Logic
 * Khelo Ji Store
 */

document.addEventListener('DOMContentLoaded', async () => {
    // ── Init DB ──
    await window.KheloJiDB.init();

    const ordersList = document.getElementById('orders-list');
    const totalSpentEl = document.getElementById('total-spent');
    const orderCountEl = document.getElementById('order-count');
    const userNameEl = document.getElementById('user-name');

    // Auth guard
    const user = window.KheloJiDB.users.current();
    if (!user) {
        window.location.href = 'login.html'; // Same folder
        return;
    }

    if (userNameEl) userNameEl.textContent = user.name;

    // Nav handling
    window.logout = () => {
        window.KheloJiDB.users.logout();
        window.location.href = 'login.html'; // Same folder
    };

    async function renderOrders() {
        const myOrders = (await window.KheloJiDB.orders.getByBuyer(user.id)).reverse();
        
        if (orderCountEl) orderCountEl.textContent = myOrders.length;
        
        const totalSpent = myOrders.reduce((sum, o) => sum + o.total, 0);
        if (totalSpentEl) totalSpentEl.textContent = totalSpent.toLocaleString('en-IN');

        if (!ordersList) return;

        if (myOrders.length === 0) {
            ordersList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🛒</div>
                    <h3>No orders yet</h3>
                    <p>When you buy cricket gear, your orders will appear here.</p>
                    <a href="../index.html" class="btn-primary" style="display:inline-block;margin-top:20px;text-decoration:none;padding:12px 24px;border-radius:10px;background:var(--red);color:white;font-weight:700;">Start Shopping</a>
                </div>`;
            return;
        }

        ordersList.innerHTML = myOrders.map(order => {
            const date = new Date(order.createdAt).toLocaleDateString('en-IN', {
                year: 'numeric', month: 'long', day: 'numeric'
            });

            const itemsHtml = order.items.map(item => `
                <div class="order-item">
                    <div class="item-info">
                        <span class="item-name">${item.name}</span>
                        <span class="item-qty">Qty: ${item.quantity}</span>
                    </div>
                    <span class="item-price">₹${(item.price * item.quantity).toLocaleString('en-IN')}</span>
                </div>
            `).join('');

            return `
            <div class="order-card">
                <div class="order-header">
                    <div>
                        <div class="order-id">#${order.id}</div>
                        <div class="order-date">${date}</div>
                    </div>
                    <span class="status-badge status-${order.status}">${order.status}</span>
                </div>
                <div class="order-items">
                    ${itemsHtml}
                </div>
                <div class="order-footer">
                    <div class="shipping-info">
                        <strong>📍 Shipping to:</strong><br>
                        ${order.shippingAddress}
                    </div>
                    <div class="order-total">
                        <span class="total-label">Total Paid</span>
                        <span class="total-value">₹${order.total.toLocaleString('en-IN')}</span>
                    </div>
                </div>
            </div>`;
        }).join('');
    }

    renderOrders();
});
