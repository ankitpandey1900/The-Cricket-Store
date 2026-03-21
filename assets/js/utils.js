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
