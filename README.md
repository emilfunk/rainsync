# RainSync

> Automatically sync your Twitter/X bookmarks to Raindrop.io in real-time

<p align="center">
  <img src="https://img.shields.io/badge/Chrome-Extension-green?logo=googlechrome" alt="Chrome Extension">
  <img src="https://img.shields.io/badge/Manifest-V3-blue" alt="Manifest V3">
  <img src="https://img.shields.io/badge/License-MIT-yellow" alt="MIT License">
</p>

## Features

✨ **Real-time Sync** - Automatically syncs bookmarks as you save them on Twitter/X
📦 **Bulk Sync** - Import all existing bookmarks at once
🔄 **Queue System** - Reliable sync with automatic retry on failures
🏷️ **Smart Tagging** - Auto-tags with author handle and tweet metadata
📝 **Quote Tweet Support** - Preserves both quoted content and commentary
🗑️ **Deleted Tweet Handling** - Archives deleted tweets with special tags
⚡ **Rate Limiting** - Smart delays to respect API limits
🎨 **Clean UI** - Simple popup and options interface
🔒 **Privacy First** - Your data stays between Twitter and Raindrop

## Installation

### From Source (Development)

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/rainsync.git
   cd rainsync
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the extension**
   ```bash
   npm run build
   ```

4. **Load in Chrome**
   - Open Chrome and go to `chrome://extensions`
   - Enable "Developer mode" (toggle in top-right)
   - Click "Load unpacked"
   - Select the `dist` folder from the project

### From Chrome Web Store

*Coming soon*

## Setup

### 1. Get a Raindrop.io Test Token

1. Go to [Raindrop.io Settings → Integrations](https://app.raindrop.io/settings/integrations)
2. Click "Create new app"
3. Create a test token
4. Copy the token (you'll need it in the next step)

### 2. Configure RainSync

1. Click the RainSync extension icon in Chrome
2. Click "Settings"
3. Paste your Raindrop.io test token
4. The extension will validate your token automatically
5. Click "Save Settings"

That's it! RainSync is now active and will sync your Twitter bookmarks automatically.

## Usage

### Real-time Syncing

Simply bookmark tweets on Twitter/X as you normally would. RainSync will:
1. Detect the bookmark action
2. Extract tweet metadata
3. Add it to the sync queue
4. Upload to your "Twitter Bookmarks" collection in Raindrop.io

### Bulk Sync

To import all your existing bookmarks:

1. Open RainSync Settings
2. Scroll to the "Bulk Sync" section
3. Click "Start Bulk Sync"
4. A new tab will open to `twitter.com/i/bookmarks`
5. The extension will automatically scroll and extract all bookmarks
6. Wait for the completion notification

**⏱️ Important: Sync Timing**
- Bulk sync **queues** bookmarks quickly (30-60 seconds for scrolling)
- Bookmarks are **synced gradually** with rate limiting delays
- **500ms delay** between each sync to respect API limits
- **Large collections take time**: 100 bookmarks ≈ 1-2 minutes, 500 bookmarks ≈ 5-10 minutes
- Check the popup to monitor queue progress
- Bookmarks appear in Raindrop.io as they're synced, not all at once
- **You can close the tab** - syncing continues in the background

### Viewing Status

Click the RainSync extension icon to see:
- Current sync status (Active/Syncing/Error/Disabled)
- Total bookmarks synced
- Last sync time
- Queue length (if any pending)
- Error messages (if any)

## How It Works

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Twitter   │─────▶│   RainSync   │─────▶│ Raindrop.io │
│  (Bookmark) │      │ (Extension)  │      │ (Archive)   │
└─────────────┘      └──────────────┘      └─────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │ Sync Queue   │
                     │ • Retry      │
                     │ • Persist    │
                     │ • Rate Limit │
                     └──────────────┘
```

### Architecture

- **Content Script** - Detects bookmark actions using MutationObserver
- **Background Service Worker** - Manages queue and API communication
- **Raindrop API Client** - Handles authentication and bookmark creation
- **Sync Manager** - Queue processing with exponential backoff retry
- **Collection Manager** - Finds or creates "Twitter Bookmarks" collection

## Bookmark Format

Each synced bookmark includes:

- **Title**: First 100 characters of the tweet
- **URL**: Direct link to the tweet
- **Tags**: Author's handle (e.g., `@username`), plus `tweet-deleted` if unavailable
- **Description**:
  - Full tweet text
  - Quoted tweet (if applicable)
  - Author info
  - Bookmark timestamp
  - Retweet indicator (if applicable)
  - Deletion warning (if tweet was unavailable)

### Example

```
Title: [DELETED] This is an example tweet that was deleted
URL: https://x.com/username/status/1234567890
Tags: @username, tweet-deleted
Description:
This is an example tweet that was deleted

Quoted tweet from @another:
This is the quoted content

Author: Example User (@username)
Bookmarked: 2026-01-04T12:00:00.000Z

⚠️ Note: This tweet was unavailable or deleted at the time of archiving.
The content preserved here may be incomplete or represent a placeholder.
```

## Development

### Project Structure

```
rainsync/
├── src/
│   ├── background/          # Service worker
│   │   ├── index.ts         # Main service worker
│   │   ├── raindrop-api.ts  # API client
│   │   ├── sync-manager.ts  # Queue & sync logic
│   │   ├── retry-handler.ts # Exponential backoff
│   │   └── collection-manager.ts
│   ├── content/             # Content scripts
│   │   ├── twitter.ts       # Main content script
│   │   ├── bookmark-detector.ts
│   │   ├── tweet-extractor.ts
│   │   └── dom-selectors.ts
│   ├── popup/               # Extension popup
│   │   ├── Popup.tsx
│   │   └── styles.css
│   ├── options/             # Settings page
│   │   ├── Options.tsx
│   │   └── styles.css
│   └── shared/              # Shared utilities
│       ├── types/           # TypeScript types
│       ├── utils/           # Utilities
│       └── constants/       # Constants
├── tests/                   # Test files
├── public/
│   └── manifest.json        # Extension manifest
└── dist/                    # Build output
```

### Scripts

```bash
# Development build with watch mode
npm run dev

# Production build
npm run build

# Run tests
npm test

# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format
```

### Tech Stack

- **TypeScript 5.3** - Type-safe development
- **React 18** - UI components
- **Vite 5** - Build tooling
- **Vitest** - Testing framework
- **Chrome Manifest V3** - Latest extension standard
- **Raindrop.io API** - Bookmark storage

## Error Handling

RainSync includes comprehensive error handling:

- **Network Errors**: Detects connection issues and retries automatically
- **Rate Limits**: Respects API rate limits with smart delays
- **Authentication Errors**: Clear messages if token is invalid
- **Duplicate Detection**: Skips bookmarks that already exist
- **Retry Logic**: Exponential backoff (1s, 2s, 4s, 8s, 16s) up to 5 attempts
- **User-Friendly Messages**: Technical errors are translated to readable messages

## Privacy & Data

- **No tracking** - RainSync doesn't collect any analytics or usage data
- **Local storage** - Settings and queue stored locally in your browser
- **Direct sync** - Data flows directly from Twitter to Raindrop.io
- **Token security** - Your Raindrop token is stored securely in Chrome's encrypted storage
- **Open source** - Full transparency of what the code does

## Troubleshooting

### Extension not syncing

1. Check that sync is enabled in Settings
2. Verify your Raindrop.io token is valid
3. Look for error messages in the popup
4. Check browser console for detailed logs

### "Extension context invalidated" error

This happens when the extension is reloaded while Twitter is open:
1. A blue notification will appear in the top-right
2. Simply refresh the Twitter tab
3. Syncing will resume normally

### Bookmarks not appearing in Raindrop (yet)

**If you just ran bulk sync:**
1. **Be patient!** Bookmarks sync gradually, not all at once
2. Click the RainSync popup to check queue status
3. Wait for "Queue: 0" - this means all bookmarks are synced
4. Refresh Raindrop.io to see newly synced bookmarks

**If sync is stuck:**
1. Check the "Twitter Bookmarks" collection in Raindrop.io
2. Verify sync status in the popup
3. Look for error messages
4. Check the queue length - if it's not decreasing, there may be an error

### Rate limit errors

If you see "Rate limit reached" errors:
- This is normal for bulk operations
- The extension will automatically retry
- Wait a minute and syncing will resume

## Development Status

✅ **Phase 1: Foundation** - Complete
✅ **Phase 2: Raindrop.io Integration** - Complete
✅ **Phase 3: Twitter Bookmark Detection** - Complete
✅ **Phase 4: Sync Manager & Service Worker** - Complete
✅ **Phase 5: User Interface Enhancement** - Complete
✅ **Phase 6: Bulk Sync & Edge Cases** - Complete
🚧 **Phase 7: Testing & Documentation** - In Progress
⏳ **Phase 8: Chrome Web Store Release** - Pending

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Roadmap

- [ ] Chrome Web Store release
- [ ] Support for Twitter threads (save entire thread)
- [ ] Custom collection selection
- [ ] Export data to JSON
- [ ] Support for Edge and Brave browsers
- [ ] Background auto-sync for all bookmarks
- [ ] Selective sync (filter by author, keywords)
- [ ] Two-way sync (Raindrop → Twitter)

## License

MIT License - see [LICENSE](LICENSE) file for details

## Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/rainsync/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/rainsync/discussions)

## Acknowledgments

- Built with [Anthropic Claude](https://www.anthropic.com/claude)
- Powered by [Raindrop.io API](https://developer.raindrop.io/)
- Uses [@samrum/vite-plugin-web-extension](https://github.com/samrum/vite-plugin-web-extension)

---

<p align="center">Made with ❤️ by the RainSync team</p>
