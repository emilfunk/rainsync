# Chrome Web Store Listing Content

## Extension Name
**RainSync**

The store takes the name from `name` in `manifest.json`.

## Summary (Short Description)
Automatically sync Twitter bookmarks to Raindrop.io in real-time

The store takes the summary from `description` in `manifest.json` (132 characters max).
To change it, edit the manifest and rebuild with `npm run build:release`.

## Detailed Description

**Automatically backup your Twitter bookmarks to Raindrop.io**

RainSync seamlessly syncs your Twitter/X bookmarks to Raindrop.io, creating a permanent, searchable archive of everything you save. No more lost bookmarks when tweets get deleted or accounts go private.

### ✨ Key Features

**🔄 Real-Time Sync**
Bookmarks are automatically synced the moment you save them on Twitter/X. Just bookmark as usual, and RainSync handles the rest.

**📦 Bulk Import**
Import all your existing Twitter bookmarks at once with our intelligent auto-scrolling bulk sync feature.

**🏷️ Smart Organization**
- Automatic tagging (`twitter`, `tweet-deleted`, `retweet`)
- Add an optional custom tag when you bookmark
- All bookmarks organized in a dedicated collection
- Full tweet text, author info, and timestamps preserved

**📝 Complete Preservation**
- Full tweet content saved
- Quote tweets included with context
- Author name and handle
- Bookmark timestamp
- Special handling for deleted tweets

**🔒 Privacy First**
- No data collection or tracking
- Your API token stays on your device
- Direct sync between Twitter and Raindrop
- Open source for full transparency

**⚡ Reliable & Smart**
- Automatic retry on failures
- Duplicate detection
- Rate limit handling
- Queue system ensures nothing is lost
- Persistent sync across browser sessions

**🎯 Simple Setup**
1. Install RainSync
2. Add your Raindrop.io API token
3. Start bookmarking on Twitter/X

That's it! Your bookmarks are automatically synced.

### 📱 Perfect For

- Researchers archiving threads and sources
- Creators collecting inspiration
- Professionals saving industry insights
- Anyone who wants a permanent backup of saved tweets
- Users frustrated by Twitter's bookmark limitations

### 🆚 Why RainSync?

**Unlike Twitter's Built-in Bookmarks:**
- ✅ Permanent backup (survives deleted tweets)
- ✅ Full search capabilities via Raindrop
- ✅ Organized with tags and collections
- ✅ Export options (Raindrop supports multiple formats)
- ✅ Accessible from any device
- ✅ Quote tweet context preserved

**Why Choose RainSync:**
- 🎯 Purpose-built for Twitter → Raindrop workflow
- ⚡ Fast and lightweight
- 🔓 Open source and transparent
- 📈 Active development

### 🔐 Permissions Explained

- **Storage**: Save settings and sync queue locally
- **Notifications**: Report results when a bulk import finishes, or when the X tab was closed before a sync finished
- **Twitter/X Access**: Detect bookmark actions and read tweet content
- **Raindrop.io Access**: Send bookmarks to your account

All permissions are used solely for core functionality. No tracking or analytics.

### 🛠️ Technical Details

- Built with TypeScript and React
- Chrome Manifest V3 compliant
- Automatic retry with exponential backoff
- Rate limiting to respect API limits
- Comprehensive error handling
- Queue persistence across sessions

### 📊 Open Source

RainSync is fully open source:
- **GitHub**: github.com/weppami/rainsync
- **License**: MIT
- **Contributions**: Welcome!

### 💡 How It Works

1. You bookmark a tweet on Twitter/X
2. RainSync detects the bookmark action
3. Tweet data is extracted and queued
4. Bookmark is synced to your "Twitter Bookmarks" collection in Raindrop
5. A confirmation appears on the page once it is saved ("Saved to Raindrop.io")

Removing a bookmark on X does not delete it from Raindrop.io, so your archive stays intact.

### ⚙️ Requirements

- Chrome, Brave, Edge, or any Chromium browser
- Free Raindrop.io account
- Raindrop.io API token (free test token)

### 🆘 Support

- **Documentation**: Full guide in README
- **Issues and questions**: GitHub Issues

### 🚀 Coming Soon

- Custom collection selection
- Thread saving (save entire tweet threads)
- Advanced filtering options
- Export to JSON
- Firefox support

### ⭐ Reviews Appreciated!

If RainSync helps you, please leave a review and rating. It helps others discover the extension!

---

**Never lose a bookmarked tweet again. Start using RainSync today!**

## Category
**Productivity**

## Language
English

## Screenshots
1280x800, in `store/screenshots/`. Upload in this order:
1. `4-flow.png`: bookmark on X with the tag modal, saved in Raindrop.io
2. `1-popup.png`: extension popup with sync status
3. `2-settings.png`: settings page
4. `3-features.png`: feature overview

## Promotional Images
- Small promo tile 440x280: `store/promo-tile-440x280.png`
- Marquee promo tile 1400x560 (optional, not made yet)

## Additional Information

**Website**: https://github.com/weppami/rainsync

**Support URL**: https://github.com/weppami/rainsync/issues

**Privacy Policy**: https://weppami.github.io/rainsync/privacy

## Keywords/Tags
The store has no keyword field. Use these words naturally in the description.
- twitter
- bookmarks
- raindrop
- backup
- archive
- sync
- productivity
- read-later
- organization

## Target Audience
- Twitter power users
- Researchers
- Content creators
- Professionals
- Anyone who bookmarks tweets regularly

## Unique Selling Points (USPs)
1. Purpose-built Twitter/X → Raindrop.io sync
2. Real-time automatic sync
3. Preserves deleted tweet content
4. Custom tag support for organization
5. Completely privacy-focused (no tracking)
6. Open source and transparent
