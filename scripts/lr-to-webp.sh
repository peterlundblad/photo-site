#!/bin/bash
set -euo pipefail

CWEBP=$(command -v cwebp || echo "/opt/homebrew/bin/cwebp")
if [ -x "/opt/homebrew/bin/python3" ]; then
  PYTHON3="/opt/homebrew/bin/python3"
elif [ -x "/Library/Developer/CommandLineTools/usr/bin/python3" ]; then
  PYTHON3="/Library/Developer/CommandLineTools/usr/bin/python3"
else
  PYTHON3=$(command -v python3 || echo "python3")
fi
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

VIDEO_MODE=false
POSITIONAL=()
for arg in "$@"; do
  if [ "$arg" = "--video" ]; then
    VIDEO_MODE=true
  else
    POSITIONAL+=("$arg")
  fi
done
set -- ${POSITIONAL[@]+"${POSITIONAL[@]}"}

if [ $# -eq 0 ]; then
  echo "Usage: $0 [--video] <image_directory> [Title] [YYYY-MM-DD]" >&2
  echo "   or: $0 [--video] <file1.jpg> [file2.jpg ...]" >&2
  exit 1
fi

DIM_CACHE_FILE="$(mktemp)"
trap 'rm -f "$DIM_CACHE_FILE"' EXIT

convert_jpeg_to_webp() {
  local src="$1"
  local out="${src%.*}.webp"
  local base
  base="$(basename "$out")"

  # Read dimensions via sips on the source JPEG right before converting/removing it
  local dims
  dims=$(sips -g pixelWidth -g pixelHeight "$src" 2>/dev/null | awk '/pixelWidth/{w=$2} /pixelHeight/{h=$2} END{if (w && h) print w, h}')
  if [ -n "$dims" ]; then
    printf "%s\t%s\n" "$base" "$dims" >> "$DIM_CACHE_FILE"
  fi

  "$CWEBP" -q 87 -sharp_yuv -metadata icc "$src" -o "$out" && rm "$src"
}

TARGET_DIR=""
CUSTOM_TITLE=""
CUSTOM_DATE=""

if [ -d "$1" ]; then
  TARGET_DIR="${1%/}"
  CUSTOM_TITLE="${2:-}"
  CUSTOM_DATE="${3:-}"

  while IFS= read -r -d '' jpg_file; do
    convert_jpeg_to_webp "$jpg_file"
  done < <(find "$TARGET_DIR" -maxdepth 1 -type f \( -iname "*.jpg" -o -iname "*.jpeg" \) -print0)
else
  TARGET_DIR="$(dirname "$1")"
  for f in "$@"; do
    if [ -f "$f" ]; then
      case "$f" in
        *.jpg|*.jpeg|*.JPG|*.JPEG)
          convert_jpeg_to_webp "$f"
          ;;
      esac
    fi
  done
fi

if [ -z "$TARGET_DIR" ] || [ ! -d "$TARGET_DIR" ]; then
  exit 0
fi

# Collect .webp filenames in TARGET_DIR sorted naturally via python3 (macOS BSD sort lacks -V)
WEBP_FILES=()
while IFS= read -r line; do
  [ -n "$line" ] && WEBP_FILES+=("$line")
done < <(
  find "$TARGET_DIR" -maxdepth 1 -type f -iname "*.webp" -exec basename {} \; | \
  "$PYTHON3" -c 'import sys, re; print("\n".join(sorted([l for l in sys.stdin.read().splitlines() if l], key=lambda s: [int(t) if t.isdigit() else t.lower() for t in re.split(r"(\d+)", s)])))'
)

if [ ${#WEBP_FILES[@]} -eq 0 ]; then
  echo "No .webp files found in $TARGET_DIR; skipping post generation."
  exit 0
fi

# Resolve Title and Date
ABS_TARGET_DIR="$(cd "$TARGET_DIR" && pwd)"
FOLDER_NAME="$(basename "$ABS_TARGET_DIR")"

if [ -n "$CUSTOM_TITLE" ]; then
  TITLE="$CUSTOM_TITLE"
else
  TITLE=$("$PYTHON3" -c 'import sys; s = sys.argv[1].replace("-", " ").replace("_", " "); print(s.title() if s.islower() or " " in s else s[0].upper() + s[1:])' "$FOLDER_NAME")
fi

if [ -n "$CUSTOM_DATE" ]; then
  POST_DATE="$CUSTOM_DATE"
else
  POST_DATE="$(date +%Y-%m-%d)"
fi

POST_SLUG=$(printf "%s" "$TITLE" | tr ' ' '-' | tr -s '-')
POST_FILE="${REPO_ROOT}/_posts/${POST_DATE}-${POST_SLUG}.markdown"

if [ -e "$POST_FILE" ]; then
  echo "Notice: ${POST_FILE#"$REPO_ROOT/"} already exists; skipping post creation."
  exit 0
fi

# Resolve root-relative image_dir (e.g. /assets/images/2026/beaune/)
REL_DIR="${ABS_TARGET_DIR#"$REPO_ROOT"}"
REL_DIR="${REL_DIR#/}"
REL_DIR="${REL_DIR%/}"
IMAGE_DIR="/${REL_DIR}/"
FIRST_IMAGE="${IMAGE_DIR}${WEBP_FILES[0]}"

# Helper to read dimensions of a .webp file (cached JPEG sips -> WebP sips -> Python WebP header fallback)
get_webp_dimensions() {
  local file_path="$1"
  local base_name
  base_name="$(basename "$file_path")"

  if [ -s "$DIM_CACHE_FILE" ]; then
    local cached
    cached=$(awk -F'\t' -v b="$base_name" '$1 == b {print $2; exit}' "$DIM_CACHE_FILE")
    if [ -n "$cached" ]; then
      echo "$cached"
      return 0
    fi
  fi

  local dims
  dims=$(sips -g pixelWidth -g pixelHeight "$file_path" 2>/dev/null | awk '/pixelWidth/{w=$2} /pixelHeight/{h=$2} END{if (w && h) print w, h}')
  if [ -n "$dims" ]; then
    echo "$dims"
    return 0
  fi

  # Fallback: inspect WebP RIFF/VP8/VP8L/VP8X header via python3
  "$PYTHON3" - "$file_path" <<'PYEOF'
import struct, sys
with open(sys.argv[1], "rb") as f:
    data = f.read(64)
if len(data) >= 30 and data[:4] == b"RIFF" and data[8:12] == b"WEBP":
    chunk = data[12:16]
    if chunk == b"VP8X":
        w = 1 + int.from_bytes(data[24:27], "little")
        h = 1 + int.from_bytes(data[27:30], "little")
        print(f"{w} {h}")
    elif chunk == b"VP8 ":
        w, h = struct.unpack("<HH", data[26:30])
        print(f"{w & 0x3fff} {h & 0x3fff}")
    elif chunk == b"VP8L":
        bits = struct.unpack("<I", data[21:25])[0]
        w = (bits & 0x3fff) + 1
        h = ((bits >> 14) & 0x3fff) + 1
        print(f"{w} {h}")
PYEOF
}

GALLERY_LINES=()
PORTRAIT_BUFFER=()

if [ "$VIDEO_MODE" = true ]; then
  for webp in "${WEBP_FILES[@]}"; do
    GALLERY_LINES+=("  - ${webp}")
  done
else
  for webp in "${WEBP_FILES[@]}"; do
    dims=$(get_webp_dimensions "${ABS_TARGET_DIR}/${webp}")
    width=$(printf "%s" "$dims" | awk '{print $1}')
    height=$(printf "%s" "$dims" | awk '{print $2}')

    if [ -n "$width" ] && [ -n "$height" ] && [ "$width" -gt "$height" ]; then
      GALLERY_LINES+=("  - [${webp}:three]")
    else
      PORTRAIT_BUFFER+=("$webp")
      if [ ${#PORTRAIT_BUFFER[@]} -eq 3 ]; then
        GALLERY_LINES+=("  - [${PORTRAIT_BUFFER[0]}, ${PORTRAIT_BUFFER[1]}, ${PORTRAIT_BUFFER[2]}]")
        PORTRAIT_BUFFER=()
      fi
    fi
  done

  if [ ${#PORTRAIT_BUFFER[@]} -eq 2 ]; then
    GALLERY_LINES+=("  - [${PORTRAIT_BUFFER[0]}, ${PORTRAIT_BUFFER[1]}]")
  elif [ ${#PORTRAIT_BUFFER[@]} -eq 1 ]; then
    GALLERY_LINES+=("  - [${PORTRAIT_BUFFER[0]}]")
  fi
fi

{
  echo "---"
  echo "title: ${TITLE}"
  echo "date: ${POST_DATE} 10:00:00"
  echo "layout: post"
  echo "categories:"
  echo "  - photography"
  echo "image_dir: ${IMAGE_DIR}"
  echo "featured_image: ${FIRST_IMAGE}"
  if [ "$VIDEO_MODE" = true ]; then
    echo "gallery_style: video"
  fi
  echo "gallery:"
  for line in "${GALLERY_LINES[@]}"; do
    echo "$line"
  done
  echo "---"
  echo ""
  echo "Write post intro here."
  echo ""
  echo "{% include masonry.html %}"
} > "$POST_FILE"

echo "Created draft post: ${POST_FILE#"$REPO_ROOT/"}"
