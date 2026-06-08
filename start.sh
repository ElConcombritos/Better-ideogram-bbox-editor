#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

# ── Install dependencies if node_modules is missing ───────────────────────────
if [ ! -d "node_modules" ]; then
  echo "  Installing dependencies, please wait…"
  npm install
fi

# ── Start Ollama in background if installed but not running ───────────────────
if command -v ollama &>/dev/null; then
  if ! curl -sf http://localhost:11434/api/tags &>/dev/null; then
    echo "  Starting Ollama in background…"
    ollama serve &>/dev/null &
    disown
    sleep 1
  fi
fi

# ── Start dev server in background, open browser once ready ───────────────────
npm run dev &
SERVER_PID=$!

echo "  Waiting for server to be ready…"
for i in $(seq 1 30); do
  if curl -sf http://localhost:5173 &>/dev/null; then
    # xdg-open for Linux; fallback silently if not available
    xdg-open http://localhost:5173 2>/dev/null || true
    echo "  BBox Editor is running at http://localhost:5173"
    break
  fi
  sleep 0.5
done

wait $SERVER_PID
