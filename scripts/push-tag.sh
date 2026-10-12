#!/usr/bin/env bash
set -euo pipefail

TAG="${1:-}"
if [ -z "$TAG" ]; then
  echo "usage: bash scripts/push-tag.sh <tag>" >&2
  echo "example: bash scripts/push-tag.sh v1.2.0" >&2
  exit 2
fi

if ! git rev-parse --verify "$TAG" >/dev/null 2>&1; then
  echo "local tag missing: $TAG" >&2
  exit 2
fi

REMOTE="${2:-origin}"

echo "pushing $TAG → $REMOTE"
git push "$REMOTE" "refs/tags/$TAG" 2>&1 | sed -n '1,40p' || true

echo "--- remote ref ---"
git ls-remote --tags "$REMOTE" "$TAG" 2>/dev/null | sed -n '1p' || true

echo "--- github release view ---"
gh release view "$TAG" --json tagName,name,body,publishedAt --jq '{tag:.tag_name,name:.name,published:.publishedAt,body:(.body|if .==null then "" else . end)}' 2>/dev/null || true

echo "--- github api fallback ---"
gh api "repos/rnetis/como-cafe/releases/tags/$TAG" --jq '{tag:.tag_name,name:.name,draft:.draft,prerelease:.prerelease,published:.published_at,body:(.body|if .==null then "" else . end)}' 2>/dev/null || true
