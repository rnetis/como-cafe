#!/usr/bin/env bash
set -euo pipefail

VERSION="${1:-}"
APP_ID="cafe.como.desk"
SUPPLY_BIN="${SUPPLY_BIN:-supply}"

if [ -z "$VERSION" ]; then
  echo "usage: $0 <version>" >&2
  exit 2
fi

for path in src-tauri/tauri.conf.json src-tauri/Cargo.toml; do
  if [ ! -f "$path" ]; then
    echo "missing $path" >&2
    exit 1
  fi
done

# sed -i '' is macOS/BSD; GNU/Linux use sed -i. Stay portable by writing to a
# temp file and replacing atomically only when the replacement succeeded.
apply_json_version() {
  local path="$1"
  local version="$2"
  local tmp
  tmp=$(mktemp)
  if sed "s/\"version\": \"[^\"]*\"/\"version\": \"${version}\"/" "$path" > "$tmp"; then
    mv "$tmp" "$path"
  else
    rm -f "$tmp"
    return 1
  fi
}

apply_toml_version() {
  local path="$1"
  local version="$2"
  local tmp
  tmp=$(mktemp)
  if sed "s/^version = \"[^\"]*\"/version = \"${version}\"/" "$path" > "$tmp"; then
    mv "$tmp" "$path"
  else
    rm -f "$tmp"
    return 1
  fi
}

apply_json_version src-tauri/tauri.conf.json "$VERSION"
apply_toml_version src-tauri/Cargo.toml "$VERSION"

if command -v "$SUPPLY_BIN" >/dev/null 2>&1; then
  "$SUPPLY_BIN" set --android-app="${APP_ID}" --version="${VERSION}" || true
else
  echo "skip supply version bump ($SUPPLY_BIN not on PATH)" >&2
fi

echo "set ${VERSION} in src-tauri/tauri.conf.json and src-tauri/Cargo.toml"
