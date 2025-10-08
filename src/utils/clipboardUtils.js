/**
 * Utility functions for clipboard operations
 */

/**
 * Copy text to clipboard with fallback for non-HTTPS environments
 * @param {string} text - The text to copy to clipboard
 * @returns {Promise<boolean>} - Returns true if successful, false otherwise
 */
export async function copyToClipboard(text) {
    try {
        // Try modern clipboard API first (works in HTTPS)
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            return true;
        } else {
            // Fallback for HTTP environments
            return fallbackCopyTextToClipboard(text);
        }
    } catch (err) {
        console.error('Failed to copy text:', err);
        return false;
    }
}

/**
 * Fallback method to copy text using execCommand (for HTTP environments)
 * @param {string} text - The text to copy
 * @returns {boolean} - Returns true if successful, false otherwise
 */
function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;

    // Avoid scrolling to bottom
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);

        if (!successful) {
            throw new Error('Fallback copy method failed');
        }

        return true;
    } catch (err) {
        console.error('Failed to copy text using fallback method:', err);
        document.body.removeChild(textArea);
        return false;
    }
}