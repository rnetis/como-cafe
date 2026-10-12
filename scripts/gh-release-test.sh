#!/usr/bin/env bash
set -euo pipefail

TEST_TAG="v0.0.0-gh-release-test"
TEST_REPO="rnetis/como-cafe-gh-release-test-$$"
cleanup() {
  set +e
  echo "--- cleanup ---"
  if [ -d "$CLONE" ]; then
    rm -rf "$CLONE"
  fi
  if [ -n "${TEST_REPO:-}" ]; then
    gh repo delete "$TEST_REPO" --yes 2>/dev/null || true
  fi
}
trap cleanup EXIT

CLONE=$(mktemp -d)

echo "=== scaffolding a throwaway private repo ==="
gh repo create "$TEST_REPO" --private --source=HEAD --remote=ghtest --push 2>&1 | sed -n '1,40p' || true

git push ghtest "$TEST_TAG" 2>&1 | sed -n '1,40p' || true
git push ghtest "HEAD:refs/heads/main" 2>&1 | sed -n '1,40p' || true

echo "=== create release from tag ==="
gh release create "$TEST_TAG" --target "$TEST_TAG" --title "Release $TEST_TAG" --notes "Auto-test release body." --draft=false 2>&1 | sed -n '1,40p' || true

echo "=== publish release ==="
gh release edit "$TEST_TAG" --draft=false 2>&1 | sed -n '1,40p' || true

echo "=== verify: gh release view ==="
gh release view "$TEST_TAG" --json tagName,name,body,publishedAt --jq '{tag:.tag_name,name:.name,published:(.publishedAt//"missing")}' 2>/dev/null || true

echo "=== verify: gh api ==="
gh api "repos/$TEST_REPO/releases/tags/$TEST_TAG" --jq '{tag:.tag_name,name:.name,published:.published_at,body:(.body|if .==null then "" else . end)}' 2>/dev/null || true

echo "=== DONE ==="
