#!/usr/bin/env bash
# Headless screenshot with the installed Chrome. Usage:
#   scripts/shoot.sh <url> <out.png> [desktop|mobile]
# Good enough for plain sites; WebGL pages (illoca) come out empty — shoot those by hand.
set -euo pipefail
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
size="1440,900"
[[ "${3:-desktop}" == "mobile" ]] && size="390,844"
"$CHROME" --headless=new --hide-scrollbars --window-size="$size" \
  --virtual-time-budget=8000 --screenshot="$2" "$1" 2>/dev/null
echo "wrote $2"
