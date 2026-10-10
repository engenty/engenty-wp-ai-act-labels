#!/bin/sh
# ai-act-image-labels.zip: what WordPress installs, built files included, sources of the build left out.
set -eu
cd "$(dirname "$0")/.."
[ -f build/tool.js ] || npm run build
rm -rf dist && mkdir -p dist/ai-act-image-labels
cp -R ai-act-image-labels.php uninstall.php readme.txt LICENSE includes build assets skills languages dist/ai-act-image-labels/
rm -f ai-act-image-labels.zip
(cd dist && zip -qr ../ai-act-image-labels.zip ai-act-image-labels)
rm -rf dist
echo "ai-act-image-labels.zip"
