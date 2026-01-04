import { useState, useEffect } from 'react';
import { getStorage, setStorage } from '../shared/utils/storage';
import { MessageType } from '../shared/types/messages';

interface BulkSyncProgress {
  isRunning: boolean;
  total: number;
  synced: number;
  errors: number;
  status: string;
}

export function Options() {
  const [token, setToken] = useState('');
  const [syncEnabled, setSyncEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [bulkSyncProgress, setBulkSyncProgress] = useState<BulkSyncProgress>({
    isRunning: false,
    total: 0,
    synced: 0,
    errors: 0,
    status: '',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const storedToken = await getStorage('raindropToken');
      const storedSyncEnabled = await getStorage('syncEnabled');

      setToken(storedToken || '');
      setSyncEnabled(storedSyncEnabled ?? true);
    } catch (error) {
      console.error('Failed to load settings', error);
    }
  }

  async function validateToken(tokenToValidate: string): Promise<boolean> {
    setValidating(true);
    setValidationError(null);

    try {
      // Send message to background script to validate token
      const response = await chrome.runtime.sendMessage({
        type: MessageType.VALIDATE_TOKEN,
        payload: { token: tokenToValidate },
      });

      if (response.valid) {
        return true;
      } else {
        setValidationError(response.error || 'Invalid token');
        return false;
      }
    } catch (error) {
      setValidationError('Failed to validate token. Please try again.');
      console.error('Token validation failed', error);
      return false;
    } finally {
      setValidating(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setValidationError(null);

    try {
      // Validate token if provided
      if (token.trim()) {
        const isValid = await validateToken(token.trim());
        if (!isValid) {
          return; // Don't save if validation failed
        }
        await setStorage('raindropToken', token.trim());
      }

      await setStorage('syncEnabled', syncEnabled);

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save settings', error);
      setValidationError('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function startBulkSync() {
    // Check if token is configured
    if (!token) {
      setValidationError('Please configure your Raindrop.io token first.');
      return;
    }

    setBulkSyncProgress({
      isRunning: true,
      total: 0,
      synced: 0,
      errors: 0,
      status: 'Starting bulk sync...',
    });

    try {
      // Send message to background to start bulk sync
      const response = await chrome.runtime.sendMessage({
        type: MessageType.START_BULK_SYNC,
      });

      if (response.error) {
        setBulkSyncProgress({
          isRunning: false,
          total: 0,
          synced: 0,
          errors: 0,
          status: `Error: ${response.error}`,
        });
      } else {
        // Start polling for progress
        const interval = setInterval(async () => {
          const progressResponse = await chrome.runtime.sendMessage({
            type: MessageType.BULK_SYNC_PROGRESS,
          });

          setBulkSyncProgress(progressResponse);

          if (!progressResponse.isRunning) {
            clearInterval(interval);
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Bulk sync failed', error);
      setBulkSyncProgress({
        isRunning: false,
        total: 0,
        synced: 0,
        errors: 0,
        status: `Error: ${(error as Error).message}`,
      });
    }
  }

  return (
    <div className="options">
      <div className="container">
        <header>
          <h1>RainSync Settings</h1>
          <p className="subtitle">Configure your Twitter to Raindrop.io sync</p>
        </header>

        <main>
          <section className="section">
            <h2>Raindrop.io Authentication</h2>
            <p className="help-text">
              Create a test token in your{' '}
              <a href="https://app.raindrop.io/settings/integrations" target="_blank" rel="noopener noreferrer">
                Raindrop.io settings
              </a>
            </p>
            <input
              type="password"
              value={token}
              onChange={(e) => {
                setToken(e.target.value);
                setValidationError(null);
              }}
              placeholder="Paste your Raindrop.io test token"
              className="token-input"
              disabled={validating}
            />
            {validationError && (
              <p className="error-text">{validationError}</p>
            )}
            {validating && (
              <p className="info-text">Validating token...</p>
            )}
          </section>

          <section className="section">
            <h2>Sync Settings</h2>
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={syncEnabled}
                onChange={(e) => setSyncEnabled(e.target.checked)}
              />
              <span>Enable automatic sync</span>
            </label>
          </section>

          <section className="section">
            <h2>Bulk Sync</h2>
            <p className="help-text">
              Sync all existing bookmarks from your Twitter bookmarks page. This will process all
              bookmarks on twitter.com/i/bookmarks.
            </p>
            <button
              onClick={startBulkSync}
              disabled={bulkSyncProgress.isRunning || !token}
              className="btn-bulk-sync"
            >
              {bulkSyncProgress.isRunning ? 'Syncing...' : 'Start Bulk Sync'}
            </button>
            {bulkSyncProgress.status && (
              <div className="bulk-sync-status">
                <p className="status-text">{bulkSyncProgress.status}</p>
                {bulkSyncProgress.total > 0 && (
                  <div className="progress-stats">
                    <span>Total: {bulkSyncProgress.total}</span>
                    <span>Synced: {bulkSyncProgress.synced}</span>
                    {bulkSyncProgress.errors > 0 && (
                      <span className="errors">Errors: {bulkSyncProgress.errors}</span>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>

          <div className="actions">
            <button onClick={handleSave} disabled={saving} className="btn-save">
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
            {saved && <span className="saved-indicator">✓ Saved</span>}
          </div>
        </main>
      </div>
    </div>
  );
}
