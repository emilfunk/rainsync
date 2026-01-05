# Privacy Policy for RainSync

**Last Updated: January 5, 2026**

## Introduction

RainSync ("we", "our", or "the extension") is committed to protecting your privacy. This Privacy Policy explains how RainSync handles your data when you use our Chrome browser extension.

## Data Collection and Usage

### What Data We Collect

RainSync collects and stores the following data **locally on your device only**:

1. **Raindrop.io API Token**: Your Raindrop.io test token for authentication
2. **Extension Settings**: Sync preferences and configuration
3. **Sync Queue**: Temporary storage of bookmarks pending sync
4. **Statistics**: Local counters (total synced, last sync time)

### What Data We Do NOT Collect

- **No Analytics**: We do not collect usage analytics or tracking data
- **No Personal Information**: We do not collect names, emails, or personal identifiers
- **No Tweet Content**: Tweet data is only processed locally and sent directly to Raindrop.io
- **No Server Storage**: We do not operate servers or databases that store your data

### How Your Data is Used

1. **Raindrop.io Token**: Used exclusively to authenticate API requests to Raindrop.io
2. **Tweet Data**: Extracted from Twitter/X bookmarks and sent directly to your Raindrop.io account
3. **Sync Queue**: Temporarily stores bookmarks until successfully synced
4. **Settings**: Controls extension behavior according to your preferences

## Data Storage

All data is stored locally using Chrome's encrypted storage (`chrome.storage.local`):

- **Location**: Your browser's local storage
- **Encryption**: Chrome provides encryption for extension storage
- **Persistence**: Data remains until you uninstall the extension or clear it manually
- **Access**: Only accessible by the RainSync extension

## Data Sharing

RainSync **does not share your data** with any third parties. The only external communication is:

1. **Raindrop.io API**: Bookmark data is sent directly to your Raindrop.io account using your API token
2. **Twitter/X**: The extension reads bookmark data from Twitter/X pages you visit

We do not:
- Sell your data
- Share data with advertisers
- Send data to our servers (we don't have any)
- Track your browsing activity outside of Twitter/X

## Third-Party Services

RainSync integrates with:

### Raindrop.io
- **Purpose**: Store your Twitter bookmarks
- **Data Sent**: Tweet URLs, text, author info, timestamps
- **Privacy Policy**: https://raindrop.io/privacy
- **Control**: You control your Raindrop.io account and can delete data anytime

### Twitter/X
- **Purpose**: Detect bookmark actions and extract tweet data
- **Data Read**: Only from pages you actively visit
- **Privacy Policy**: https://twitter.com/privacy

## Permissions Explanation

RainSync requires the following permissions:

1. **storage**: Store settings and sync queue locally
2. **notifications**: Show sync status notifications
3. **host_permissions (twitter.com, x.com)**: Detect bookmarks and extract tweet data
4. **host_permissions (api.raindrop.io)**: Send bookmarks to your Raindrop account

All permissions are used solely for the extension's core functionality.

## Your Rights and Controls

You have complete control over your data:

1. **View Data**: All data is stored locally in your browser
2. **Delete Data**: Uninstall the extension to remove all local data
3. **Token Removal**: Delete your token in extension settings
4. **Clear Queue**: Queue clears automatically after successful sync
5. **Disable Sync**: Toggle sync off in settings to stop all operations

## Data Retention

- **Local Storage**: Data persists until you uninstall the extension
- **Raindrop.io**: Bookmarks remain in your Raindrop account until you delete them
- **Sync Queue**: Cleared automatically after successful sync or max retries

## Security

We implement security best practices:

1. **Encrypted Storage**: Chrome encrypts extension storage
2. **Direct API Communication**: No intermediary servers
3. **Token Security**: API tokens stored securely in Chrome storage
4. **No External Tracking**: No third-party analytics or tracking scripts

## Children's Privacy

RainSync does not knowingly collect data from children under 13. The extension is intended for general audiences who have Twitter/X and Raindrop.io accounts.

## Changes to Privacy Policy

We may update this Privacy Policy occasionally. Changes will be reflected in the "Last Updated" date. Continued use after changes constitutes acceptance.

## Open Source

RainSync is open source. You can review the code to verify our privacy practices:
- **Repository**: https://github.com/yourusername/rainsync
- **License**: MIT License

## Contact

For privacy concerns or questions:
- **GitHub Issues**: https://github.com/yourusername/rainsync/issues
- **Email**: [Your contact email]

## Compliance

RainSync complies with:
- Chrome Web Store Developer Program Policies
- GDPR principles (minimal data collection, user control)
- Privacy by design principles

## Summary

**In Plain English:**
- We don't collect or store your personal data
- Your API token stays on your device
- Bookmarks go directly from Twitter to your Raindrop account
- No tracking, no analytics, no servers
- You're in complete control

---

**Your privacy matters to us. RainSync is designed to respect it.**
