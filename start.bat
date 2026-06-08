@echo off
setlocal
title BBox Editor

cd /d "%~dp0"

:: ── Check Node.js ─────────────────────────────────────────────────────────────
where node >nul 2>&1
if errorlevel 1 (
  echo.
  echo  [ERROR] Node.js not found.
  echo  Download and install Node.js 18+ from https://nodejs.org
  echo  then double-click start.bat again.
  echo.
  pause
  exit /b 1
)

:: ── Install dependencies if node_modules is missing ──────────────────────────
if not exist "node_modules\" (
  echo  Installing dependencies, please wait...
  call npm install
  if errorlevel 1 ( echo  [ERROR] npm install failed & pause & exit /b 1 )
)

:: ── Start Ollama if installed but not running ─────────────────────────────────
where ollama >nul 2>&1
if not errorlevel 1 (
  curl -sf http://localhost:11434/api/tags >nul 2>&1
  if errorlevel 1 (
    echo  Starting Ollama in background...
    start /B ollama serve >nul 2>&1
    timeout /t 2 /nobreak >nul
  )
)

:: ── Start dev server, then open browser once ready ───────────────────────────
echo  Starting BBox Editor...
start /B cmd /c "npm run dev"

echo  Waiting for server...
:wait_loop
timeout /t 1 /nobreak >nul
curl -sf http://localhost:5173 >nul 2>&1
if errorlevel 1 goto wait_loop

start http://localhost:5173
echo.
echo  BBox Editor is running at http://localhost:5173
echo  Close this window to stop the server.
echo.

:: Keep window open
:keep_open
timeout /t 5 /nobreak >nul
goto keep_open
