#!/usr/bin/env bash

set -euo pipefail

repo_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
version="$(tr -d '\r\n' < "${repo_root}/VERSION")"
runtime_root="${repo_root}/web/default/.frontend-runtime"
current_target="$(readlink "${runtime_root}/current" 2>/dev/null || true)"

if [[ "${current_target}" == 'releases/a' ]]; then
  next_target='releases/b'
else
  next_target='releases/a'
fi

mkdir -p "${runtime_root}/releases"

docker run --rm \
  -e DISABLE_ESLINT_PLUGIN=true \
  -e "FRONTEND_BUILD_OUTPUT_DIR=/build/web/default/.frontend-runtime/${next_target}" \
  -e "VITE_REACT_APP_VERSION=${version}" \
  -v "${repo_root}/web:/build/web" \
  -w /build/web/default \
  oven/bun:1@sha256:0733e50325078969732ebe3b15ce4c4be5082f18c4ac1a0f0ca4839c2e4e42a7 \
  bun run build

ln -sfn "${next_target}" "${runtime_root}/current.next"
mv -Tf "${runtime_root}/current.next" "${runtime_root}/current"

echo "Frontend published from ${next_target}. No backend rebuild or container restart was needed."
