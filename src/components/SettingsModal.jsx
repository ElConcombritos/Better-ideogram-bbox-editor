import { useState } from 'react';
import { loadSettings, saveSettings } from '../ai';

const PROVIDERS = [
  { id: 'openai',     label: 'OpenAI',      model: 'gpt-4o-mini',          hint: 'Get a key at platform.openai.com' },
  { id: 'anthropic',  label: 'Anthropic',   model: 'claude-haiku-4-5',     hint: 'Get a key at console.anthropic.com' },
  { id: 'openrouter', label: 'OpenRouter',  model: 'openai/gpt-4.1-mini',  hint: 'Get a key at openrouter.ai — supports 300+ models' },
];

const BACKENDS = [
  { id: 'ollama', label: 'Ollama only',  desc: 'Always use local Ollama — error if offline' },
  { id: 'auto',   label: 'Auto',         desc: 'Ollama if running, cloud fallback otherwise' },
  { id: 'cloud',  label: 'Cloud only',   desc: 'Always use the cloud provider below' },
];

export default function SettingsModal({ onClose }) {
  const initial = loadSettings();
  const [backend, setBackend] = useState(initial.backend || 'auto');
  const [provider, setProvider] = useState(initial.provider || 'openai');
  const [model, setModel] = useState(initial.model || '');
  const [apiKey, setApiKey] = useState(initial.apiKey || '');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  const selectedProvider = PROVIDERS.find(p => p.id === provider);
  const selectedBackend = BACKENDS.find(b => b.id === backend);

  // When switching provider, clear the custom model so the placeholder updates
  const handleProviderChange = (id) => {
    setProvider(id);
    setModel('');
  };

  const save = () => {
    saveSettings({ backend, provider, model: model.trim(), apiKey: apiKey.trim() });
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <div>
            <div className="modal-title">Settings</div>
            <div className="modal-subtitle">AI backend for Magic Prompt and Generate</div>
          </div>
          <button className="btn btn-ghost btn-icon" style={{ marginLeft: 12 }} onClick={onClose}>✕</button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Backend selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>AI backend</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {BACKENDS.map(b => (
                <button
                  key={b.id}
                  className={`btn ${backend === b.id ? 'btn-accent' : 'btn-ghost'}`}
                  style={{ flex: 1, fontSize: 12 }}
                  onClick={() => setBackend(b.id)}
                >
                  {b.label}
                </button>
              ))}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{selectedBackend.desc}</div>
          </div>

          {/* Ollama info (shown when not cloud-only) */}
          {backend !== 'cloud' && (
            <div style={{ background: 'var(--bg-3)', borderRadius: 6, padding: '10px 12px', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Ollama at <code>localhost:11434</code> · model <code>{MODEL_LABEL}</code><br />
              Change the model in <code>src/ollama.js</code> → <code>MODEL</code>.
            </div>
          )}

          {/* Provider + Model (shown when not ollama-only) */}
          {backend !== 'ollama' && (<>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Cloud provider</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {PROVIDERS.map(p => (
                  <button
                    key={p.id}
                    className={`btn ${provider === p.id ? 'btn-accent' : 'btn-ghost'}`}
                    style={{ flex: 1, fontSize: 12 }}
                    onClick={() => handleProviderChange(p.id)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{selectedProvider.hint}</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Model</label>
              <input
                type="text"
                value={model}
                onChange={e => setModel(e.target.value)}
                placeholder={selectedProvider.model}
                style={{
                  background: 'var(--bg-3)', border: '1px solid var(--border)',
                  borderRadius: 6, padding: '7px 10px', fontSize: 13,
                  color: 'var(--text-primary)', fontFamily: 'monospace',
                }}
                onKeyDown={e => e.key === 'Enter' && save()}
              />
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Leave blank to use the default. For OpenRouter, use the full model ID (e.g. <code>openai/gpt-4.1-mini</code>).
              </div>
            </div>
          </>)}

          {/* API key (shown when not ollama-only) */}
          {backend !== 'ollama' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>API Key</label>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="Paste your API key here…"
                style={{
                  flex: 1, background: 'var(--bg-3)', border: '1px solid var(--border)',
                  borderRadius: 6, padding: '7px 10px', fontSize: 13,
                  color: 'var(--text-primary)', fontFamily: 'monospace',
                }}
                onKeyDown={e => e.key === 'Enter' && save()}
              />
              <button className="btn btn-ghost btn-icon" onClick={() => setShowKey(v => !v)} title={showKey ? 'Hide key' : 'Show key'}>
                {showKey ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Stored in browser localStorage only — never sent to any server other than the selected provider.
            </div>
          </div>
          )}

          {/* Save */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className={`btn ${saved ? 'btn-active' : 'btn-accent'}`} onClick={save}>
              {saved ? '✓ Saved' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Needed for the hint text — mirrors the constant in ollama.js
const MODEL_LABEL = 'gemma4:e2b';

function EyeIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" />
      <circle cx="8" cy="8" r="2" />
    </svg>
  );
}
function EyeOffIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 6.5C13.6 7.1 14 7.6 14 8s-2.5 5-6 5a6 6 0 0 1-2.5-.6M3 9.5C2.4 8.9 2 8.4 2 8s2.5-5 6-5c.9 0 1.8.2 2.5.6" />
      <line x1="2" y1="2" x2="14" y2="14" />
    </svg>
  );
}
