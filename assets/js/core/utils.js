/**
 * showToast - Standard notification utility
 * @param {string} msg - Message to display
 */
export function showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = msg;
    toast.classList.add('visible');
    
    // Hide after 3s
    setTimeout(() => {
        toast.classList.remove('visible');
    }, 3000);
}

/**
 * formatPrice - Formats number to Indian Rupee currency string
 * @param {number} price 
 * @returns {string}
 */
export function formatPrice(price) {
    return '₹' + Number(price).toLocaleString('en-IN');
}
