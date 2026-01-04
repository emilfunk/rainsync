# RainSync - Twitter to Raindrop.io Bookmark Sync Extension

## Overview
A Chrome extension that automatically syncs Twitter bookmarks to Raindrop.io in real-time, creating a permanent archive of bookmarked tweets with rich metadata.

## Core Functionality

### Sync Behavior
- **Direction**: One-way sync from Twitter → Raindrop.io
  - Twitter bookmarks are treated as temporary workspace
  - Raindrop.io serves as permanent archive
  - Unbookmarking on Twitter does NOT remove from Raindrop
- **Timing**: Real-time sync when user bookmarks a tweet
  - Immediate sync upon bookmark action
  - No scheduled/periodic syncing
  - Manual bulk sync option available in settings
- **Duplicate Handling**: Skip duplicates
  - If URL already exists in Raindrop.io, ignore the sync
  - Prevents overwriting manually organized bookmarks
  - Based on URL matching

### Data Organization
- **Collection**: Dedicated "Twitter Bookmarks" collection in Raindrop.io
  - Single collection for all synced tweets
  - Clean separation from other bookmarks
  - Collection created automatically on first sync if it doesn't exist

### Metadata Extraction & Storage
- **Auto-tagging**: Add author handle as tag
  - Format: `@username`
  - Enables filtering by author in Raindrop
- **Tweet Content**: Save the bookmarked tweet text only
  - No full thread context
  - Just the specific tweet that was bookmarked
- **Quote Tweets**: Special handling for quote tweets
  - Save both the quoted tweet content and the quote commentary
  - Include both in the notes/description field
- **Title**: Use tweet text (first 100 chars or first line)
- **URL**: Direct link to the specific tweet
- **Notes/Description**:
  - Tweet full text
  - For quote tweets: quoted tweet + commentary
  - Author information
  - Timestamp of bookmark

### Tweet Deletion Handling
- If original tweet is deleted after bookmarking:
  - Keep bookmark in Raindrop with archived text/metadata
  - Mark with special tag or note indicating source deleted
  - Preserve all extracted data even if tweet becomes unavailable

## Technical Implementation

### Chrome Extension Architecture
- **Manifest**: Version 3 (required for Chrome)
- **Background Processing**: Service Worker with persistent data
  - Use chrome.storage for maintaining state
  - Service worker handles sync operations
  - Persist sync queue and state across service worker restarts

### Twitter Data Access
- **Method**: Scrape from logged-in session
  - Extract bookmark data from Twitter web interface
  - Uses user's existing authenticated session
  - No Twitter API keys required
- **Detection**: Monitor DOM mutations
  - Watch for bookmark button state changes on Twitter
  - Content script injected into twitter.com pages
  - Detect when bookmark button changes from unbookmarked → bookmarked state
  - Extract tweet data from DOM when bookmark detected

### Raindrop.io Integration
- **Authentication**: OAuth flow with test token
  - User creates test token in Raindrop.io settings
  - User pastes token once during setup
  - No backend server required
  - Simple and secure approach
- **Token Storage**: chrome.storage.local (encrypted)
  - Standard Chrome extension storage
  - Encrypted at rest
  - Tied to Chrome profile
  - Survives extension updates
- **API Integration**:
  - Use Raindrop.io REST API
  - Create/update bookmarks via API
  - Check for duplicates before creating
  - Create collection if needed

### Error Handling & Resilience
- **Retry Logic**: Exponential backoff for failed syncs
  - Automatically retry failed operations
  - Increasing delays: 1s, 2s, 4s, 8s, etc.
  - Most network failures are transient
  - Max retry attempts: 5
- **Error Logging**: Basic error logs in console only
  - Log errors to browser console for debugging
  - No persistent logs or analytics
  - User can check console if issues occur
- **Graceful Degradation**:
  - If Raindrop API is down, queue bookmarks locally
  - Retry when connectivity restored
  - Show error state in UI but don't block usage

### Bulk Sync & Performance
- **Rate Limiting**: Respect Raindrop API quotas
  - Throttle requests to avoid hitting rate limits
  - Delay between bulk sync operations
  - Slower but safe approach
- **Initial Sync**: Handle large existing bookmark collections
  - Process in batches to avoid overwhelming API
  - Run as background task
  - Don't block browser or user interaction

## User Interface

### Extension Popup
When user clicks extension icon, show:
- **Sync Status**: Active/paused/error state
- **Last Sync Time**: Timestamp of most recent successful sync
- **Settings Access**: Button to open settings page
- **Manual Sync**: Button to trigger bulk sync of all bookmarks

### Settings Page (chrome://extensions options page)
- **Raindrop Token Input**: Field to enter/update test token
- **Sync Toggle**: Enable/disable automatic sync temporarily
  - Allows pausing without removing credentials
- **Manual Bulk Sync**: Button to sync all existing bookmarks
  - With progress indicator
  - Shows count of synced vs. total bookmarks
- **Export/Backup**: Export all synced bookmarks as JSON
  - For backup or migration purposes
  - Include all metadata

### Visual Feedback
- **Extension Icon Badge**: Show sync state
  - Green: Sync active and healthy
  - Yellow: Syncing in progress
  - Red: Error state
  - Gray: Sync disabled
- **Notifications**: For critical errors only
  - Don't spam user with notifications
  - Only show for authentication failures or persistent errors

## User Flows

### First-Time Setup
1. User installs extension
2. Extension prompts for Raindrop.io test token
3. User creates test token in Raindrop.io settings
4. User pastes token into extension
5. Extension validates token
6. User optionally triggers bulk sync of existing bookmarks
7. Real-time sync begins for new bookmarks

### Normal Operation
1. User browses Twitter (twitter.com or x.com)
2. User clicks bookmark button on a tweet
3. Content script detects bookmark action
4. Content script extracts tweet metadata from DOM
5. Service worker receives bookmark data
6. Service worker checks for duplicate in Raindrop
7. If not duplicate, creates bookmark in Raindrop
8. On success: Update last sync time, show success state
9. On failure: Retry with exponential backoff, show error if persistent

### Manual Bulk Sync
1. User clicks manual sync button in popup or settings
2. Extension fetches all Twitter bookmarks
3. Shows progress indicator
4. Processes each bookmark with rate limiting
5. Skips duplicates automatically
6. Shows completion summary (X new bookmarks synced)

## Edge Cases & Special Handling

### Quote Tweets
- Extract both the original quoted tweet and the quote commentary
- Format in notes field:
  ```
  [Quote commentary text]

  Quoted tweet from @original_author:
  [Original tweet text]
  ```

### Retweets
- Handle as normal bookmarks
- Save the retweet URL and metadata
- Tag with retweeter's handle

### Deleted Tweets
- Preserve bookmark even if tweet is deleted
- Keep all archived metadata
- Add tag: `tweet-deleted`
- Note in description: "Original tweet no longer available"

### Long Threads
- Only save the specific bookmarked tweet text
- Don't include thread context
- URL will link to tweet in context of thread

### Network Failures
- Queue failed bookmark syncs locally
- Retry with exponential backoff
- Persist queue in chrome.storage
- Process queue when connectivity restored

### API Rate Limits
- Detect rate limit errors from Raindrop API
- Pause sync operations until rate limit resets
- Show user notification about rate limit
- Queue bookmarks for retry after cooldown

### Multiple Devices
- Token stored locally per Chrome profile
- No cross-device sync of extension state
- Each device syncs independently to same Raindrop account
- Duplicate detection prevents multiple syncs of same URL

## Data Privacy & Security

### Data Storage
- Raindrop token: Encrypted in chrome.storage.local
- Bookmark queue: Stored locally, cleared after successful sync
- No data sent to third-party servers (except Raindrop.io API)
- No analytics or tracking

### Permissions Required
- `storage`: For saving token and sync state
- `host_permissions`: For twitter.com and x.com (DOM access)
- `host_permissions`: For Raindrop.io API access
- `scripting`: For content script injection (if needed)

### Security Considerations
- Token never exposed in logs or console
- HTTPS only for API communication
- No eval() or unsafe code execution
- Content Security Policy compliant

## Technical Stack

### Required Technologies
- **Manifest V3**: Chrome extension format
- **Service Worker**: Background processing
- **Content Scripts**: Twitter DOM monitoring
- **Chrome Storage API**: Persistent data storage
- **Raindrop.io REST API**: Bookmark management
- **Mutation Observer**: DOM change detection

### Development Stack (Suggested)
- TypeScript for type safety
- Build tool: Vite or Webpack
- Testing: Jest + Chrome extension testing framework
- Linting: ESLint + Prettier

## Future Enhancements (Out of Scope for V1)

- Twitter Lists/Moments support
- Custom tag format configuration
- Filtering rules (only sync tweets matching criteria)
- Two-way sync option
- Batch multiple bookmarks in single API call
- Detailed activity log with export
- Browser notification on successful sync
- Integration with other bookmark services
- Mobile browser support

## Success Criteria

- ✅ Real-time sync works within 2 seconds of bookmarking
- ✅ Handles 1000+ existing bookmarks in bulk sync
- ✅ Zero data loss (all bookmarks eventually synced)
- ✅ Graceful error handling with user visibility
- ✅ Simple setup process (< 2 minutes)
- ✅ No noticeable performance impact on Twitter browsing
- ✅ Works across Twitter UI updates (resilient DOM detection)

## Open Questions / Decisions Needed

None - specification is complete based on interview.

## Timeline & Milestones

**Phase 1: Core Functionality**
- Manifest V3 setup
- Content script for DOM monitoring
- Service worker for background sync
- Basic Raindrop.io API integration
- Token storage and authentication

**Phase 2: Error Handling & Polish**
- Retry logic with exponential backoff
- Error logging and user feedback
- Bulk sync implementation
- Rate limiting

**Phase 3: UI & Settings**
- Extension popup with sync status
- Settings page with token input
- Manual sync controls
- Export functionality

**Phase 4: Edge Cases & Testing**
- Quote tweet handling
- Deleted tweet handling
- Network failure recovery
- Comprehensive testing

**Phase 5: Documentation & Release**
- User documentation
- Chrome Web Store listing
- README and installation instructions
