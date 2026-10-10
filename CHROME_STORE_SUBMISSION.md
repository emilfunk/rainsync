# Chrome Web Store Submission Checklist

This document contains everything you need to submit RainSync to the Chrome Web Store.

## Pre-Submission Checklist

### ✅ Code & Build

- [ ] All features tested and working
- [ ] No console errors in production build
- [x] All tests passing (`npm test`)
- [x] Production build created (`npm run build:release`)
- [ ] Extension tested with clean install
- [ ] Extension tested in incognito mode
- [ ] Cross-browser testing (Chrome, Brave, Edge)

### ✅ Documentation

- [x] Privacy Policy created (docs/privacy.md)
- [x] Store listing content prepared (STORE_LISTING.md)
- [x] README updated with final information
- [x] LICENSE file included (MIT)
- [x] GitHub repository public and accessible

### ✅ Assets

- [x] Icon 16x16 (icon16.png)
- [x] Icon 32x32 (icon32.png)
- [x] Icon 48x48 (icon48.png)
- [x] Icon 128x128 (icon128.png)
- [x] Store icon 128x128 (public/icons/icon128.png)
- [x] Small promotional tile 440x280 (store/promo-tile-440x280.png)
- [x] 3-5 screenshots (store/screenshots/, 1280x800)

### ✅ Manifest

- [x] Version number set (1.0.0)
- [x] Description updated
- [x] Icons referenced correctly
- [x] Permissions minimized and justified
- [x] Homepage URL set
- [x] Author information added

### ✅ Legal & Compliance

- [x] Privacy policy hosted (or ready to host)
- [x] Privacy policy URL ready
- [ ] Terms of service (if applicable)
- [x] Permissions justified in documentation
- [ ] No prohibited content
- [ ] Complies with Chrome Web Store policies

## Developer Account Setup

### Step 1: Create Chrome Web Store Developer Account

1. Turn on 2-Step Verification for the Google account (required to publish)
2. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
3. Pay one-time $5 developer registration fee
4. Accept developer agreement
5. Complete publisher information and verify the contact email
6. Declare trader / non-trader status (EU Digital Services Act); a free
   hobby project is usually non-trader

### Step 2: Prepare Hosting

**Privacy Policy URL:** https://weppami.github.io/rainsync/privacy

The policy lives in `docs/privacy.md` and is served by GitHub Pages
(Settings → Pages → Deploy from branch `main`, folder `/docs`).

## Building for Submission

### Step 1: Build the Submission Package

```bash
npm run build:release
```

This type-checks, builds, verifies every file referenced by
`dist/manifest.json` exists, and creates `rainsync-v<version>.zip` with the
extension files at the root (`manifest.json`, `service-worker-loader.js`,
`assets/`, `src/`, `icons/`).

### Step 2: Test the Zip Package

1. Open Chrome: `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the unzipped folder
5. Test all functionality
6. Check for any errors in console

## Chrome Web Store Submission Form

### Store Listing Tab

**Product Details:**
- **Extension name**: RainSync
- **Summary**: taken from `description` in `manifest.json` (132 char max), edit it there
- **Category**: Productivity
- **Language**: English

**Detailed Description:**
- Copy from STORE_LISTING.md (up to 16,000 characters)
- Use formatting to highlight features
- Include clear call-to-action

**Icon:**
- Upload `public/icons/icon128.png`

**Screenshots** (`store/screenshots/`, 1280x800), in this order:
1. `4-flow.png` — bookmark on X, saved in Raindrop
2. `1-popup.png`
3. `2-settings.png`
4. `3-features.png`

**Promotional images:**
- Small tile 440x280: `store/promo-tile-440x280.png`
- Marquee 1400x560 (optional)

**Links:**
- **Homepage**: https://github.com/weppami/rainsync
- **Support**: https://github.com/weppami/rainsync/issues

### Privacy Tab

**Privacy Policy:**
- URL: https://weppami.github.io/rainsync/privacy
- Check box: "This extension complies with the Chrome Web Store policies"

**Permissions Justification:**

For each permission, provide clear justification:

1. **storage**
   - "Required to store user settings, API token, and sync queue locally on the user's device"

2. **notifications**
   - "Used to notify users when bookmarks are successfully synced and for important status updates"

3. **host_permissions: twitter.com, x.com**
   - "Required to detect bookmark actions and extract tweet content from Twitter/X pages"

4. **host_permissions: api.raindrop.io**
   - "Required to communicate with Raindrop.io API to sync bookmarks to user's account"

**Remote code:** No, I am not using remote code. All JavaScript is bundled in the package.

**Data Usage — what to tick:**

The form asks what the extension *handles*, not only what reaches your servers.
RainSync has no servers, but it does handle these, so tick them:

- ☑ **Authentication information** — the Raindrop.io API token the user enters,
  stored in `chrome.storage.local` and sent only to api.raindrop.io
- ☑ **Website content** — tweet text, author name/handle, URL and quoted-tweet
  text read from Twitter/X and sent to the user's own Raindrop.io account

Leave the rest unticked (personally identifiable info, health, financial,
personal communications, location, web history, user activity). RainSync
only reads tweets the user bookmarks; it does not log browsing or clicks.

**Certify all three disclosures:**
- ☑ I do not sell or transfer user data to third parties, outside of the approved use cases
- ☑ I do not use or transfer user data for purposes that are unrelated to my item's single purpose
- ☑ I do not use or transfer user data to determine creditworthiness or for lending purposes

Sending data to Raindrop.io at the user's request is the extension's single
purpose, so it falls under the approved use cases.

**Test instructions** (Test instructions tab):

Reviewers need a Raindrop.io account to see a sync. Either give them the
token of a dedicated test account (revoke it after review), or:

1. Create a free account at raindrop.io
2. Settings → Integrations → create an app → "Create test token"
3. Paste the token in RainSync Settings and click Save
4. Bookmark any tweet on x.com; it appears in the "Twitter Bookmarks" collection

**Single Purpose:**
- "Sync Twitter/X bookmarks to Raindrop.io"

### Distribution Tab

**Visibility:**
- ⚪ Public (recommended)
- ⚪ Unlisted (only accessible via direct link)
- ⚪ Private (only for specific users/domains)

**Regions:**
- Select "All regions" or specific countries

**Pricing:**
- Free

## Review Process

### What to Expect

1. **Submission**: Upload your extension
2. **Review Queue**: Usually 1-3 business days
3. **Review**: Google reviews for policy compliance
4. **Potential Outcomes**:
   - ✅ **Approved**: Extension goes live
   - ⚠️ **Rejected**: Reasons provided, fix and resubmit
   - ⏸️ **Additional Info Requested**: Respond promptly

### Common Rejection Reasons (and how we've addressed them)

1. **Single Purpose Violation**
   - ✅ RainSync has one clear purpose: sync bookmarks

2. **Permissions Overreach**
   - ✅ We only request essential permissions
   - ✅ Each permission is justified

3. **Privacy Policy Missing**
   - ✅ Hosted at https://weppami.github.io/rainsync/privacy

4. **Misleading Descriptions**
   - ✅ Store listing is accurate and clear

5. **Poor Quality Icons/Screenshots**
   - ✅ Icons rebuilt from the 1024px source, screenshots from the real extension

## Post-Submission

### If Approved

1. **Celebrate!** 🎉
2. Update README with Chrome Web Store link
3. Share on social media
4. Monitor reviews and ratings
5. Respond to user feedback

### If Rejected

1. Read rejection reason carefully
2. Make necessary changes
3. Test thoroughly
4. Resubmit with explanation of changes

## Updating the Extension

### For Future Updates

1. Increment version in manifest.json
2. Create changelog in GitHub releases
3. Build new version
4. Upload to Chrome Web Store
5. Add release notes in submission

**Version Numbering:**
- Major.Minor.Patch (e.g., 1.0.0)
- Bug fixes: 1.0.1, 1.0.2
- New features: 1.1.0, 1.2.0
- Breaking changes: 2.0.0

## Support & Maintenance

### After Publication

- **Monitor**: Check Chrome Web Store dashboard regularly
- **Reviews**: Respond to user reviews professionally
- **Issues**: Track and fix bugs via GitHub Issues
- **Updates**: Release updates for new features and fixes
- **Stats**: Monitor usage statistics in dashboard

## Useful Links

- **Developer Dashboard**: https://chrome.google.com/webstore/devconsole
- **Developer Program Policies**: https://developer.chrome.com/docs/webstore/program-policies/
- **Branding Guidelines**: https://developer.chrome.com/docs/webstore/branding/
- **Best Practices**: https://developer.chrome.com/docs/webstore/best_practices/

## Quick Reference: What You Need NOW

### Must Have Before Submission:
1. ✅ Extension built (`npm run build:release`)
2. ✅ Privacy policy hosted (URL ready)
3. ✅ Icons created (16, 32, 48, 128)
4. ✅ Screenshots taken (4 images)
5. ✅ Promotional tile created (440x280)
6. ⚠️ Developer account created ($5 fee paid, 2-Step Verification on)
7. ✅ Manifest finalized
8. ✅ GitHub repository public
9. ⚠️ Final manual test of the zip

### Can Do After Initial Submission:
- Marquee banner
- Video trailer
- Translations

## Timeline Estimate

- **Preparation**: 1-2 days (icons, screenshots, testing)
- **Submission**: 30 minutes (filling out forms)
- **Review**: 1-3 business days
- **Revisions (if needed)**: 1 day + additional review time
- **Total**: 3-7 days from start to published

## Final Pre-Flight Check

Before clicking "Submit for Review":

- [ ] Extension zip file created and tested
- [ ] All required icons uploaded
- [ ] Screenshots uploaded
- [ ] Store listing description complete
- [ ] Privacy policy URL added
- [ ] All permissions justified
- [ ] Test instructions filled in
- [ ] Developer account verified
- [ ] Payment method on file (for account)
- [x] GitHub repository public
- [x] README updated

**Ready to submit? Let's make RainSync available to the world! 🚀**
