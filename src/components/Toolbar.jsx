import { useEffect, useState } from 'react';
import { useStore, ASPECT_RATIOS } from '../store';
import { checkOllamaStatus, getProviderDefaultModel, loadSettings } from '../ai';

function activeBackendShort() {
  const { backend = 'auto', provider = 'openai', model } = loadSettings();
  if (backend === 'ollama') return 'Ollama';
  const m = model?.trim() || getProviderDefaultModel(provider);
  return backend === 'cloud' ? m : `Ollama / ${m}`;
}

export default function Toolbar({ onUndo, onRedo, canUndo, canRedo, onOpenTemplates, onOpenHistory, onMagic, magicStatus, magicError, onClearMagicError, appMode, onAppModeChange, onOpenSettings, theme, onThemeToggle }) {
  const { state, dispatch } = useStore();
  const { aspectRatio } = state;
  const [ollamaOnline, setOllamaOnline] = useState(null); // null=checking, true, false

  // Check Ollama status once on mount, then every 30s
  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      const online = await checkOllamaStatus();
      if (!cancelled) setOllamaOnline(online);
    };
    check();
    const id = setInterval(check, 30000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      const tag = document.activeElement?.tagName;
      const isEditing = tag === 'INPUT' || tag === 'TEXTAREA';
      if (isEditing) return;

      if (e.key === 'd' || e.key === 'D') { dispatch({ type: 'SET_MODE', mode: 'draw' }); return; }
      if (e.key === 'v' || e.key === 'V') { dispatch({ type: 'SET_MODE', mode: 'select' }); return; }
      if (e.key === 'Delete' || e.key === 'Backspace') { dispatch({ type: 'DELETE_ELEMENT' }); return; }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); e.shiftKey ? onRedo() : onUndo(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); onRedo(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dispatch, onUndo, onRedo]);

  const changeRatio = (ratio) => {
    if (ratio === aspectRatio) return;
    const hasContent = state.elements.length > 0 ||
      state.global.high_level_description || state.global.background || state.global.aesthetics;
    if (hasContent && !window.confirm('Changing aspect ratio will reset the entire project. Continue?')) return;
    dispatch({ type: 'SET_ASPECT', ratio });
  };

  const isLoading = magicStatus === 'loading';

  return (
    <div className="topbar">
      {/* Logo */}
      <div className="topbar-logo">
        <div className="topbar-logo-icon">B</div>
        <div className="topbar-logo-name">BBox Editor</div>
      </div>

      <div className="topbar-sep" />

      {/* Undo / Redo */}
      <button className="btn btn-ghost btn-icon" onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)">
        <UndoIcon />
      </button>
      <button className="btn btn-ghost btn-icon" onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Y)">
        <RedoIcon />
      </button>

      <div className="topbar-sep" />

      {/* Aspect ratio */}
      <select
        className="ratio-select"
        value={aspectRatio}
        onChange={(e) => changeRatio(e.target.value)}
        title="Canvas aspect ratio"
      >
        {Object.entries(ASPECT_RATIOS).map(([r, v]) => (
          <option key={r} value={r}>{r} — {v.label}</option>
        ))}
      </select>

      <div className="topbar-sep" />

      {/* Templates */}
      <button className="btn btn-ghost" onClick={onOpenTemplates} title="Open template gallery">
        <TemplatesIcon /> Templates
      </button>
      <button className="btn btn-ghost" onClick={onOpenHistory} title="Open project history">
        <HistoryIcon /> History
      </button>

      <div className="topbar-spacer" />

      {/* Mode toggle */}
      <div className="mode-toggle">
        <button
          className={`mode-toggle-btn${appMode === 'manual' ? ' active' : ''}`}
          onClick={() => onAppModeChange('manual')}
        >
          <EditIcon /> Manual
        </button>
        <button
          className={`mode-toggle-btn${appMode === 'generate' ? ' active' : ''}`}
          onClick={() => onAppModeChange('generate')}
        >
          <SparkleIcon /> Generate
        </button>
      </div>

      <div className="topbar-sep" />

      {/* Ollama status badge */}
      <div
        className="ollama-badge"
        title={ollamaOnline === null ? 'Checking Ollama…' : ollamaOnline ? 'Ollama is running locally' : 'Ollama offline — cloud fallback active'}
      >
        <span className={`ollama-dot ${ollamaOnline === null ? 'checking' : ollamaOnline ? 'online' : 'offline'}`} />
        <span className="ollama-label">
          {ollamaOnline === null ? 'Ollama…' : ollamaOnline ? 'Ollama' : 'Cloud'}
        </span>
      </div>

      {/* Settings */}
      <button className="btn btn-ghost btn-icon" onClick={onOpenSettings} title="Settings">
        <SettingsIcon />
      </button>

      {/* Theme toggle */}
      <button
        className="btn btn-ghost btn-icon"
        onClick={onThemeToggle}
        title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      >
        {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
      </button>

      <div className="topbar-sep" />

      {/* Magic prompt */}
      <button
        className={`btn ${isLoading ? 'btn-active' : 'btn-accent'}`}
        onClick={onMagic}
        disabled={isLoading}
        title="Refine current prompt with AI"
      >
        {isLoading ? <><SpinnerIcon /> {activeBackendShort()}…</> : <><SparkleIcon /> Magic</>}
      </button>

      {/* Error toast */}
      {magicError && (
        <div className="error-toast" onClick={onClearMagicError} title="Click to dismiss">
          <span>⚠</span>
          <span className="error-toast-msg">{magicError}</span>
          <span style={{ opacity: 0.5, fontSize: 11 }}>dismiss</span>
        </div>
      )}
    </div>
  );
}

/* ── Icons ── */
function UndoIcon() {
  return (
    <svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7H11a3 3 0 0 1 0 6H8" /><path d="M6 4L3 7l3 3" />
    </svg>
  );
}
function RedoIcon() {
  return (
    <svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 7H5a3 3 0 0 0 0 6h3" /><path d="M10 4l3 3-3 3" />
    </svg>
  );
}
function SparkleIcon() {
  return (
    <svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor">
      <path d="M8 1l1.5 4.5L14 7l-4.5 1.5L8 13l-1.5-4.5L2 7l4.5-1.5z" />
    </svg>
  );
}
function SpinnerIcon() {
  return (
    <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      style={{ animation: 'spin 0.75s linear infinite' }}>
      <path d="M8 2a6 6 0 1 0 6 6" />
    </svg>
  );
}
function TemplatesIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="5" height="5" rx="1" />
      <rect x="9" y="2" width="5" height="5" rx="1" />
      <rect x="2" y="9" width="5" height="5" rx="1" />
      <rect x="9" y="9" width="5" height="5" rx="1" />
    </svg>
  );
}
function HistoryIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v4h4" />
      <path d="M3.5 7A5 5 0 1 0 5 3.5L3 5.5" />
      <path d="M8 5.5V8l2 1.2" />
    </svg>
  );
}
function EditIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 2l3 3-8 8H3v-3l8-8z" />
    </svg>
  );
}
function SettingsIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="2" />
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" />
    </svg>
  );
}
function SunIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="3" />
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" />
    </svg>
  );
}
function MoonIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13.5 9.5A6 6 0 0 1 6.5 2.5a6 6 0 1 0 7 7z" />
    </svg>
  );
}
