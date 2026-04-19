/**
 * ui.js — Shared UI Utilities
 * Khelo Ji Cricket Store
 */

/**
 * Toggles modal visibility
 * @param {HTMLElement} modal - The modal overlay element
 * @param {string} display - 'flex', 'block', or 'none'
 */
export function toggleModal(modal, display) {
    if (modal) {
        modal.style.display = display;
        
        // Prevent body scroll when modal is open
        if (display === 'none') {
            document.body.style.overflow = 'auto';
        } else {
            document.body.style.overflow = 'hidden';
        }
    }
}

/**
 * Copy to clipboard utility
 * @param {string} text - Text to copy
 */
export function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        console.log('Copied to clipboard');
    });
}
