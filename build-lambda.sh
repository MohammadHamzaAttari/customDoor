#!/bin/bash
set -euo pipefail

echo "╔══════════════════════════════════════╗"
echo "║  Building Lambda Package             ║"
echo "╚══════════════════════════════════════╝"

# Clean
rm -rf lambda-build lambda-package.zip
mkdir -p lambda-build

# Step 1: Bundle server code
echo ""
echo "📦 [1/3] Bundling server code with esbuild..."

npx esbuild lambda-entry.ts \
    --bundle \
    --platform=node \
    --target=node20 \
    --outfile=lambda-build/index.js \
    --format=cjs \
    --minify \
    --sourcemap \
    --external:pg-native \
    --external:better-sqlite3 \
    --external:@mapbox/node-pre-gyp \
    --loader:.node=copy

# Step 2: Copy only needed node_modules
echo ""
echo "📦 [2/3] Installing production dependencies..."

cp package.json lambda-build/
cd lambda-build

# Install only what's needed
npm install --omit=dev --ignore-scripts 2>/dev/null

# Clean up unnecessary files
find node_modules -type f \( \
    -name "*.d.ts" -o \
    -name "*.map" -o \
    -name "*.md" -o \
    -name "LICENSE*" -o \
    -name "CHANGELOG*" -o \
    -name "*.test.js" -o \
    -name "*.spec.js" \
\) -delete 2>/dev/null || true

rm -rf node_modules/.cache \
       node_modules/*/test \
       node_modules/*/tests \
       node_modules/*/.github \
       node_modules/*/docs \
       node_modules/*/example \
       node_modules/*/examples 2>/dev/null || true

cd ..

# Step 3: Create zip
echo ""
echo "📦 [3/3] Creating zip..."

cd lambda-build
zip -r ../lambda-package.zip index.js index.js.map node_modules/ -q
cd ..

# Report
LAMBDA_SIZE=$(du -h lambda-package.zip | cut -f1)
echo ""
echo "✅ Lambda package built!"
echo "   File: lambda-package.zip"
echo "   Size: ${LAMBDA_SIZE}"

# Check if under 50MB limit for direct upload
SIZE_BYTES=$(wc -c < lambda-package.zip)
if [ "$SIZE_BYTES" -gt 52428800 ]; then
    echo "⚠️  Package > 50MB — will upload via S3"
else
    echo "   ✅ Under 50MB — direct upload OK"
fi
