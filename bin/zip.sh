#!/bin/sh
# ai-act-labels.zip: what WordPress installs, built files included, sources of the build left out.
set -eu
cd "$(dirname "$0")/.."
[ -f build/tool.js ] || npm run build
rm -rf dist && mkdir -p dist/ai-act-labels
cp -R ai-act-labels.php uninstall.php readme.txt LICENSE includes build assets skills languages dist/ai-act-labels/
rm -f ai-act-labels.zip
(cd dist && zip -qr ../ai-act-labels.zip ai-act-labels)
rm -rf dist
echo "ai-act-labels.zip"
