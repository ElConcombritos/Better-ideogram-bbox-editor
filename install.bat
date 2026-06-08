@echo off
setlocal enabledelayedexpansion

echo.
echo   Ideogram BBox Editor -- Installer
echo   ----------------------------------
echo.

:: ── Check Node.js ───────────────────────────────────────────────
where node >nul 2>&1
if errorlevel 1 (
  echo   [ERROR] Node.js not found. Install Node.js 18+ from https://nodejs.org and re-run.
  pause & exit /b 1
)

for /f "tokens=1 delims=v" %%v in ('node -v') do set NODE_RAW=%%v
for /f "tokens=1 delims=." %%m in ("%NODE_RAW:~1%") do set NODE_MAJOR=%%m
if %NODE_MAJOR% LSS 18 (
  echo   [ERROR] Node.js 18+ required. Current version: %NODE_RAW%
  pause & exit /b 1
)

echo   [OK] Node.js found

:: ── Install npm dependencies ─────────────────────────────────────
echo.
echo   Installing npm dependencies...
call npm install
if errorlevel 1 ( echo   [ERROR] npm install failed & pause & exit /b 1 )
echo   [OK] npm dependencies installed

:: ── Ollama (optional) ────────────────────────────────────────────
echo.
echo   Optional: Ollama enables Magic Prompt (local AI, no API key needed).
set /p INSTALL_OLLAMA="  Install or configure Ollama? [y/N] "

if /i "!INSTALL_OLLAMA!"=="y" (
  where ollama >nul 2>&1
  if errorlevel 1 (
    echo   Ollama not found. Please download and install it manually:
    echo   https://ollama.com/download/windows
    echo   Then run this script again or pull the model manually.
  ) else (
    echo   [OK] Ollama already installed
  )

  echo.
  set /p PULL_MODEL="  Pull the default model (gemma4:e2b, ~3 GB)? [y/N] "
  if /i "!PULL_MODEL!"=="y" (
    echo   Pulling gemma4:e2b -- this may take a few minutes...
    ollama pull gemma4:e2b
    echo   [OK] Model ready
  ) else (
    echo   Skipped. Pull it later with: ollama pull gemma4:e2b
  )
) else (
  echo   Skipped. Magic Prompt will use a cloud provider (configure in Settings).
)

:: ── Done ──────────────────────────────────────────────────────────
echo.
echo   Installation complete.
echo   Run the app with:  start.bat   or   npm run dev
echo.
pause
