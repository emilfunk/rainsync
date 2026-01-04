import { useState, useEffect } from 'react';
import { getStorage, setStorage } from '../shared/utils/storage';
import { MessageType } from '../shared/types/messages';

export function Options() {
  const [token, setToken] = useState('');
  const [syncEnabled, setSyncEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

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
