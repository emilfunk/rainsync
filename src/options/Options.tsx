import { useState, useEffect } from 'react';
import { getStorage, setStorage } from '../shared/utils/storage';

export function Options() {
  const [token, setToken] = useState('');
  const [syncEnabled, setSyncEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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

  async function handleSave() {
    setSaving(true);
    setSaved(false);

    try {
      if (token.trim()) {
        await setStorage('raindropToken', token.trim());
      }
      await setStorage('syncEnabled', syncEnabled);

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save settings', error);
      alert('Failed to save settings. Please try again.');
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
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste your Raindrop.io test token"
              className="token-input"
            />
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
