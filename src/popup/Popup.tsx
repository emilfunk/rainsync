import { useState, useEffect } from 'react';
import { getStorage } from '../shared/utils/storage';

export function Popup() {
  const [syncEnabled, setSyncEnabled] = useState<boolean>(true);
  const [totalSynced, setTotalSynced] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatus();
  }, []);

  async function loadStatus() {
    try {
      const enabled = await getStorage('syncEnabled');
      const synced = await getStorage('totalSynced');

      setSyncEnabled(enabled ?? true);
      setTotalSynced(synced ?? 0);
    } catch (error) {
      console.error('Failed to load status', error);
    } finally {
      setLoading(false);
    }
  }

  function openSettings() {
    chrome.runtime.openOptionsPage();
  }

  if (loading) {
    return (
      <div className="popup">
        <div className="loading">Loading...</div>
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
        <div className={`indicator ${syncEnabled ? 'active' : 'disabled'}`}>
          <span className="dot"></span>
          <span className="text">{syncEnabled ? 'Active' : 'Disabled'}</span>
        </div>
      </div>

      <div className="stats">
        <div className="stat">
          <span className="label">Total Synced</span>
          <span className="value">{totalSynced}</span>
        </div>
      </div>

      <footer>
        <button onClick={openSettings} className="btn-settings">
          Settings
        </button>
      </footer>
    </div>
  );
}
