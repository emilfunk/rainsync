#!/bin/bash

# RainSync - Chrome Web Store Release Builder
# This script builds the extension and creates a zip file ready for submission

set -e  # Exit on error

echo "🚀 Building RainSync for Chrome Web Store submission..."
echo ""

# Get version from manifest
VERSION=$(node -p "require('./manifest.json').version")
echo "📦 Version: $VERSION"
echo ""

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist
rm -f rainsync-*.zip
echo "✅ Clean complete"
echo ""

# Run TypeScript compiler
echo "🔨 Running TypeScript compiler..."
npm run type-check
echo "✅ TypeScript check complete"
echo ""

# Build the extension
echo "⚙️  Building extension..."
npm run build
echo "✅ Build complete"
echo ""

# Verify critical files exist
echo "🔍 Verifying build output..."
# Check every file referenced by the built manifest (bundled names are hashed)
if [ ! -f "dist/manifest.json" ]; then
    echo "❌ ERROR: Required file missing: dist/manifest.json"
    exit 1
fi
node -e '
const fs = require("fs");
const m = JSON.parse(fs.readFileSync("dist/manifest.json", "utf8"));
const files = [
  m.background?.service_worker,
  m.action?.default_popup,
  m.options_ui?.page,
  ...(m.content_scripts ?? []).flatMap((c) => [...(c.js ?? []), ...(c.css ?? [])]),
].filter(Boolean);
const missing = files.filter((f) => !fs.existsSync("dist/" + f));
for (const f of missing) console.error("❌ ERROR: Required file missing: dist/" + f);
process.exit(missing.length ? 1 : 0);
'
echo "✅ All required files present"
echo ""

# Check for icons (warn if missing)
echo "🎨 Checking for icons..."
if [ ! -f "dist/icons/icon128.png" ]; then
    echo "⚠️  WARNING: Icons not found in dist/icons/"
    echo "   You need to create icons before submission!"
    echo "   See public/icons/README.md for details"
else
    echo "✅ Icons found"
fi
echo ""

# Create zip file
ZIP_NAME="rainsync-v${VERSION}.zip"
echo "📦 Creating submission package: $ZIP_NAME"
cd dist
zip -r ../$ZIP_NAME . -x "*.DS_Store" -x "__MACOSX/*"
cd ..
echo "✅ Package created: $ZIP_NAME"
echo ""

# Get zip file size
ZIP_SIZE=$(du -h "$ZIP_NAME" | cut -f1)
echo "📊 Package size: $ZIP_SIZE"
echo ""

# Verify zip contents
echo "🔍 Verifying package contents..."
ZIP_CONTENTS=$(unzip -l "$ZIP_NAME" | head -20)
echo "$ZIP_CONTENTS"
echo ""

# Final checks
echo "✅ BUILD SUCCESSFUL!"
echo ""
echo "📋 Next steps:"
echo "   1. Test the extension:"
echo "      - Extract: unzip $ZIP_NAME -d test-extension"
echo "      - Load in Chrome: chrome://extensions (Developer mode → Load unpacked)"
echo "   2. Create icons if not done (see public/icons/README.md)"
echo "   3. Take screenshots for Chrome Web Store"
echo "   4. Review CHROME_STORE_SUBMISSION.md for submission steps"
echo ""
echo "🎯 Submission package ready: $ZIP_NAME"
echo ""
