#!/bin/bash
CWEBP=$(command -v cwebp || echo "/opt/homebrew/bin/cwebp")

for f in "$@"; do
  if [ -f "$f" ]; then
    "$CWEBP" -q 87 -sharp_yuv -metadata icc "$f" -o "${f%.*}.webp" && rm "$f"
  fi
done
