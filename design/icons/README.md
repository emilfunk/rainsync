# RainSync Icons

This directory contains the extension icons required for Chrome Web Store submission.

## Required Icon Sizes

You need to create PNG icons in the following sizes:

- **icon16.png** - 16x16 pixels (toolbar, favicon)
- **icon32.png** - 32x32 pixels (Windows computers)
- **icon48.png** - 48x48 pixels (extension management page)
- **icon128.png** - 128x128 pixels (Chrome Web Store, installation)

## Design Guidelines

### Brand Colors
- **Primary**: #1da1f2 (Twitter blue)
- **Secondary**: #0066FF (Raindrop blue)
- **Accent**: #14B8A6 (Teal/sync indicator)
- **Background**: White or gradient

### Icon Concept Ideas

#### Option 1: Droplet + Twitter Bird
- Blue water droplet with a small Twitter bird silhouette
- Symbolizes tweets "raining" into Raindrop

#### Option 2: Sync Symbol
- Circular sync arrows connecting a Twitter icon to a droplet
- Shows the synchronization concept

#### Option 3: Letter R
- Stylized "R" for RainSync
- Incorporate droplet or rain elements
- Use Twitter blue color

#### Option 4: Bookmark + Droplet
- Bookmark icon transforming into water droplets
- Represents bookmarks flowing to Raindrop

### Design Requirements

1. **Visibility**: Must be recognizable at 16x16 pixels
2. **Contrast**: Should work on both light and dark backgrounds
3. **Simplicity**: Avoid overly detailed designs at small sizes
4. **Brand Alignment**: Reflect both Twitter and Raindrop aesthetically
5. **Professional**: Clean, modern design suitable for productivity tool

### Tools for Creating Icons

- **Figma** (free, browser-based)
- **Adobe Illustrator** (professional)
- **Inkscape** (free, open-source)
- **Canva** (easy, template-based)
- **GIMP** (free, raster graphics)

### Export Settings

- **Format**: PNG
- **Transparency**: Yes (transparent background recommended)
- **Color Space**: sRGB
- **Bit Depth**: 24-bit or 32-bit (with alpha channel)

### Current Temporary Icon

Currently using an inline SVG data URI in code:
```
Blue square with white "R" letter
Background: #1da1f2 (Twitter blue)
Text: White, bold, centered
```

This should be replaced with proper PNG icons before publication.

## How to Add Icons

1. Create icons in the required sizes
2. Save as PNG files with exact names:
   - `icon16.png`
   - `icon32.png`
   - `icon48.png`
   - `icon128.png`
3. Place files in this directory (`public/icons/`)
4. Icons are automatically included in build via manifest.json

## Testing Icons

After adding icons:
1. Run `npm run build`
2. Load extension in Chrome
3. Check icon appears correctly:
   - In browser toolbar
   - In extension management page (chrome://extensions)
   - In popup title bar
4. Test on both light and dark Chrome themes

## Chrome Web Store Assets

In addition to extension icons, you'll need:

### Promotional Images
- **128x128**: Store icon (same as icon128.png)
- **440x280**: Small promotional tile
- **920x680**: Large promotional tile (optional)
- **1400x560**: Marquee promotional banner (optional)

### Screenshots
- **1280x800** or **640x400**: 3-5 screenshots
- Show key features:
  1. Extension popup with sync status
  2. Settings/options page
  3. Custom tag modal on Twitter
  4. Raindrop.io with synced bookmarks
  5. Bulk sync in action

## License

Icons should be:
- Original work OR
- Licensed for commercial use OR
- Used with proper attribution

Include license information if using third-party icon elements.
