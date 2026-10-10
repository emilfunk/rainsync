const TOAST_ID = 'rainsync-page-toast';
const TOAST_DURATION_MS = 8000;

/**
 * Show a short message inside the page
 * Used when the extension context is gone and chrome.* APIs no longer work
 */
export function showPageToast(message: string, variant: 'info' | 'error' = 'info'): void {
  // Only keep one toast on screen
  document.getElementById(TOAST_ID)?.remove();

  const toast = document.createElement('div');
  toast.id = TOAST_ID;
  toast.setAttribute('role', 'status');
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    max-width: 90%;
    padding: 12px 20px;
    background: ${variant === 'error' ? '#f4212e' : '#1d9bf0'};
    color: white;
    border-radius: 9999px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    font-size: 15px;
    font-weight: 600;
    z-index: 10000;
  `;

  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), TOAST_DURATION_MS);
}
