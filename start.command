#!/usr/bin/env bash
# Double-click this file in Finder to start the app (macOS).
# On first run: right-click → Open → Open (to bypass Gatekeeper).

# Move to the folder where this script lives, regardless of where it was launched from
cd "$(dirname "$0")"

# ── Check Node.js ──────────────────────────────────────────────────────────────
if ! command -v node &>/dev/null; then
  osascript -e 'display alert "Node.js not found" message "Install Node.js 18+ from https://nodejs.org then double-click start.command again." buttons {"OK"} default button "OK"'
  exit 1
fi

# ── Install dependencies if node_modules is missing ───────────────────────────
if [ ! -d "node_modules" ]; then
  osascript -e 'display notification "Installing dependencies, please wait…" with title "BBox Editor"'
  npm install
fi

# ── Start Ollama in background if installed but not running ───────────────────
if command -v ollama &>/dev/null; then
  if ! curl -sf http://localhost:11434/api/tags &>/dev/null; then
    echo "Starting Ollama in background…"
    ollama serve &>/dev/null &
    disown
    sleep 1
  fi
fi

# ── Start dev server in background, then open browser once it's ready ─────────
npm run dev &
SERVER_PID=$!

echo "Waiting for server to be ready…"
for i in $(seq 1 30); do
  if curl -sf http://localhost:5173 &>/dev/null; then
    open http://localhost:5173
    break
  fi
  sleep 0.5
done

# Keep terminal open so the server keeps running; Ctrl+C to stop
wait $SERVER_PID
