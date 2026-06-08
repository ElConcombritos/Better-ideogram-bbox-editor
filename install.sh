#!/usr/bin/env bash
set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RESET='\033[0m'

echo ""
echo -e "${CYAN}  Ideogram BBox Editor — Installer${RESET}"
echo "  ──────────────────────────────────"
echo ""

# ── Check Node.js ──────────────────────────────────────────────
if ! command -v node &>/dev/null; then
  echo "  [ERROR] Node.js not found. Install Node.js 18+ from https://nodejs.org and re-run."
  exit 1
fi

NODE_VER=$(node -e "process.exit(parseInt(process.versions.node) < 18 ? 1 : 0)" 2>/dev/null && echo "ok" || echo "old")
if [ "$NODE_VER" = "old" ]; then
  echo "  [ERROR] Node.js 18+ required. Current version: $(node -v)"
  exit 1
fi

echo -e "  ${GREEN}✓${RESET} Node.js $(node -v)"

# ── Install npm dependencies ────────────────────────────────────
echo ""
echo "  Installing npm dependencies…"
npm install
echo -e "  ${GREEN}✓${RESET} npm dependencies installed"

# ── Ollama (optional) ──────────────────────────────────────────
echo ""
echo -e "  ${YELLOW}Optional:${RESET} Ollama enables the Magic Prompt feature (local AI, no API key needed)."
printf "  Install or configure Ollama? [y/N] "
read -r INSTALL_OLLAMA

if [[ "${INSTALL_OLLAMA,,}" == "y" ]]; then
  if command -v ollama &>/dev/null; then
    echo -e "  ${GREEN}✓${RESET} Ollama already installed: $(ollama --version 2>/dev/null || echo 'installed')"
  else
    echo "  Downloading and installing Ollama…"
    curl -fsSL https://ollama.com/install.sh | sh
    echo -e "  ${GREEN}✓${RESET} Ollama installed"
  fi

  echo ""
  printf "  Pull the default model (gemma4:e2b, ~3 GB)? [y/N] "
  read -r PULL_MODEL
  if [[ "${PULL_MODEL,,}" == "y" ]]; then
    echo "  Pulling gemma4:e2b — this may take a few minutes…"
    ollama pull gemma4:e2b
    echo -e "  ${GREEN}✓${RESET} Model ready"
  else
    echo "  Skipped. You can pull it later with: ollama pull gemma4:e2b"
  fi
else
  echo "  Skipped. Magic Prompt will use a cloud provider (configure in Settings ⚙)."
fi

# ── Done ────────────────────────────────────────────────────────
echo ""
echo -e "  ${GREEN}Installation complete.${RESET}"
echo "  Run the app with:  ./start.sh   or   npm run dev"
echo ""
