import { useState, useEffect } from 'react';
import { MessageType } from '../shared/types/messages';
import { formatRelativeTime } from '../shared/utils/date-formatter';

interface SyncStatus {
  syncEnabled: boolean;
  lastSyncTime?: number;
  totalSynced: number;
  lastError?: string;
  isProcessing: boolean;
  queueLength: number;
}

export function Popup() {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatus();
    // Refresh status every 5 seconds
    const interval = setInterval(loadStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  async function loadStatus() {
    try {
      const response = await chrome.runtime.sendMessage({
        type: MessageType.SYNC_STATUS_REQUEST,
      });

      setStatus(response);
    } catch (error) {
      console.error('Failed to load status', error);
    } finally {
      setLoading(false);
    }
  }

  function openSettings() {
    chrome.runtime.openOptionsPage();
  }

  function getStatusText(): string {
    if (!status) return 'Unknown';
    if (!status.syncEnabled) return 'Disabled';
    if (status.isProcessing) return 'Syncing...';
    if (status.queueLength > 0) return `Queue: ${status.queueLength}`;
    return 'Active';
  }

  function getStatusClass(): string {
    if (!status) return 'unknown';
    if (!status.syncEnabled) return 'disabled';
    if (status.isProcessing) return 'syncing';
    if (status.lastError) return 'error';
    return 'active';
  }

  if (loading) {
    return (
      <div className="popup">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="popup">
        <div className="error">Failed to load status</div>
      </div>
    );
  }

  return (
    <div className="popup">
      <header>
        <h1>RainSync</h1>
        <p className="tagline">Twitter → Raindrop.io</p>
      </header>

      <div className="status">
        <div className={`indicator ${getStatusClass()}`}>
          <span className="dot"></span>
          <span className="text">{getStatusText()}</span>
        </div>
      </div>

      {status.lastError && (
        <div className="error-box">
          <strong>Error:</strong> {status.lastError}
        </div>
      )}

      <div className="stats">
        <div className="stat">
          <span className="label">Total Synced</span>
          <span className="value">{status.totalSynced}</span>
        </div>
        <div className="stat">
          <span className="label">Last Sync</span>
          <span className="value">{formatRelativeTime(status.lastSyncTime)}</span>
        </div>
        {status.queueLength > 0 && (
          <div className="stat">
            <span className="label">Queue</span>
            <span className="value">{status.queueLength} pending</span>
          </div>
        )}
      </div>

      <footer>
        <button onClick={openSettings} className="btn-settings">
          Settings
        </button>
      </footer>
    </div>
  );
}
