/**
 * Show loading indicator
 */
export function showLoading() {
    document.getElementById('loadingIndicator').style.display = 'flex';
}

/**
 * Hide loading indicator
 */
export function hideLoading() {
    document.getElementById('loadingIndicator').style.display = 'none';
}

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - Notification type (success, error, warning)
 */
export function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

/**
 * Truncate string to a specified length
 * @param {string} str - String to truncate
 * @param {number} length - Maximum length
 * @returns {string} Truncated string
 */
export function truncateString(str, length) {
    return str.length > length ? str.substring(0, length) + '...' : str;
}
