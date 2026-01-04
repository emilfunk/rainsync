# RainSync

A Chrome extension that automatically syncs your Twitter bookmarks to Raindrop.io in real-time.

## Features

- **Real-time sync**: Automatically syncs bookmarks as you bookmark tweets
- **One-way archive**: Twitter bookmarks are synced to Raindrop, never deleted
- **Smart metadata**: Auto-tags with author handles and preserves tweet content
- **Quote tweet support**: Saves both quoted tweet and commentary
- **Resilient**: Retry logic handles network failures gracefully

## Development Status

✅ **Phase 1: Foundation** - Complete
- Project scaffolding with Vite + React + TypeScript
- Chrome extension Manifest V3 configuration
- Basic UI components (popup and options pages)
- Type-safe storage utilities

🚧 **Phase 2: Raindrop.io Integration** - Next up
- API client implementation
- Token authentication
- Collection management

⏳ **Phase 3: Twitter Bookmark Detection** - Pending
⏳ **Phase 4: Sync Manager & Service Worker** - Pending
⏳ **Phase 5: User Interface Enhancement** - Pending

## Installation

### For Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build the extension:**
   ```bash
   npm run build
   ```

3. **Load in Chrome:**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `dist` folder from this project

4. **Development mode with auto-rebuild:**
   ```bash
   npm run dev
   ```
   This watches for changes and rebuilds automatically. You'll need to click the refresh button on the extension card in `chrome://extensions/` after each build.

## Project Structure

```
rainsync/
├── public/
│   └── manifest.json           # Extension manifest
├── src/
│   ├── background/            # Service worker
│   ├── content/               # Content scripts for Twitter
│   ├── popup/                 # Extension popup UI
│   ├── options/               # Settings page
│   └── shared/                # Shared utilities and types
│       ├── types/             # TypeScript definitions
│       ├── constants/         # App constants
│       └── utils/             # Helper functions
├── dist/                      # Build output (load this in Chrome)
└── tests/                     # Test files
```

## Scripts

- `npm run dev` - Build in watch mode for development
- `npm run build` - Production build
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run type-check` - TypeScript type checking
- `npm test` - Run tests (when implemented)

## Tech Stack

- **Build**: Vite 5
- **Language**: TypeScript 5.3
- **UI**: React 18
- **Extension**: Chrome Manifest V3
- **API**: Raindrop.io REST API
- **Storage**: chrome.storage.local

## How It Works

1. **Detection**: MutationObserver watches for bookmark button state changes on Twitter
2. **Extraction**: Extract tweet metadata (text, author, URL, etc.) from DOM
3. **Queueing**: Add bookmarks to sync queue with retry support
4. **Syncing**: Background service worker syncs to Raindrop.io API
5. **Persistence**: All state persisted to chrome.storage for service worker resilience

## Configuration

After installation:
1. Click the extension icon
2. Click "Settings"
3. Create a test token in [Raindrop.io settings](https://app.raindrop.io/settings/integrations)
4. Paste the token and save

## License

MIT

## Contributing

This project is currently in active development. Contributions welcome once Phase 1-5 are complete.
