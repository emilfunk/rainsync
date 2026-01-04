import { logger } from '../shared/utils/logger';

logger.info('RainSync content script loaded on', window.location.href);

// Content script initialization
// Bookmark detection will be implemented in Phase 3

// For now, just log that we're active
function init() {
  logger.info('RainSync content script initialized');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
