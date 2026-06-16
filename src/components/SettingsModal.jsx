import { useState } from 'react';
import { getProviderDefaultModel, loadSettings, saveSettings } from '../ai';

const PROVIDERS = [
  { id: 'openai', label: 'OpenAI', hint: 'OpenAI-compatible chat completions.' },
  { id: 'anthropic', label: 'Anthropic', hint: 'Claude Messages API.' },
  { id: 'openrouter', label: 'OpenRouter', hint: 'OpenAI-compatible router for many models.' },
  { id: 'mistral', label: 'Mistral', hint: 'Mistral chat completions API.' },
  { id: 'google', label: 'Google AI Studio', hint: 'Gemini generateContent API.' },
  { id: 'lmstudio', label: 'LM Studio', hint: 'Local OpenAI-compatible server.' },
];

const BACKENDS = [
  { id: 'ollama', label: 'Ollama only', desc: 'Always use local Ollama and error if offline.' },
  { id: 'auto', label: 'Auto', desc: 'Try Ollama first, then fall back to the selected provider.' },
  { id: 'cloud', label: 'Provider only', desc: 'Always use the selected provider.' },
];

const inputStyle = {
  background: 'var(--bg-tertiary)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  padding: '7px 10px',
  fontSize: 13,
  color: 'var(--text)',
  fontFamily: 'monospace',
};

function Field({ label, children, hint }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>{label}</label>
      {children}
      {hint && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{hint}</div>}
    </div>
  );
}

export default function SettingsModal({ onClose }) {
  const initial = loadSettings();
  const [backend, setBackend] = useState(initial.backend || 'auto');
  const [provider, setProvider] = useState(initial.provider || 'openai');
  const [model, setModel] = useState(initial.model || '');
  const [apiKey, setApiKey] = useState(initial.apiKey || '');
  const [lmStudioUrl, setLmStudioUrl] = useState(initial.lmStudioUrl || 'http://localhost:1234/v1');
  const [advancedElementTypes, setAdvancedElementTypes] = useState(Boolean(initial.advancedElementTypes));
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  const selectedProvider = PROVIDERS.find(p => p.id === provider) || PROVIDERS[0];
  const selectedBackend = BACKENDS.find(b => b.id === backend) || BACKENDS[1];
  const providerNeedsKey = provider !== 'lmstudio';

  const handleProviderChange = (id) => {
    setProvider(id);
    setModel('');
  };

  const save = () => {
    saveSettings({
      backend,
      provider,
      model: model.trim(),
      apiKey: apiKey.trim(),
      lmStudioUrl: lmStudioUrl.trim(),
      advancedElementTypes,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal settings-modal">
        <div className="modal-header">
          <div>
            <div className="modal-title">Settings</div>
            <div className="modal-subtitle">AI backend for Magic Prompt and Generate</div>
          </div>
          <button className="btn btn-ghost btn-icon" style={{ marginLeft: 12 }} onClick={onClose}>x</button>
        </div>

        <div className="modal-body settings-body">
          <Field label="AI backend" hint={selectedBackend.desc}>
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
          </Field>

          {backend !== 'cloud' && (
            <div className="settings-card" style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Ollama at <code>localhost:11434</code> - model <code>gemma4:e2b</code>
            </div>
          )}

          {backend !== 'ollama' && (
            <>
              <Field label="Cloud provider" hint={selectedProvider.hint}>
                <div className="provider-grid">
                  {PROVIDERS.map(p => (
                    <button
                      key={p.id}
                      className={`btn ${provider === p.id ? 'btn-accent' : 'btn-ghost'}`}
                      onClick={() => handleProviderChange(p.id)}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </Field>

              {provider === 'lmstudio' && (
                <Field label="LM Studio base URL" hint="Start the LM Studio local server, then keep the /v1 base URL here.">
                  <input type="text" value={lmStudioUrl} onChange={e => setLmStudioUrl(e.target.value)} style={inputStyle} />
                </Field>
              )}

              <Field
                label="Model"
                hint={provider === 'openrouter'
                  ? 'For OpenRouter, use the full model ID.'
                  : 'Leave blank to use the provider default.'}
              >
                <input
                  type="text"
                  value={model}
                  onChange={e => setModel(e.target.value)}
                  placeholder={getProviderDefaultModel(provider)}
                  style={inputStyle}
                  onKeyDown={e => e.key === 'Enter' && save()}
                />
              </Field>

              {providerNeedsKey && (
                <Field label="API key" hint="Stored in browser localStorage and only sent to the selected provider.">
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={apiKey}
                      onChange={e => setApiKey(e.target.value)}
                      placeholder="Paste your API key here"
                      style={{ ...inputStyle, flex: 1 }}
                      onKeyDown={e => e.key === 'Enter' && save()}
                    />
                    <button className="btn btn-ghost btn-icon" onClick={() => setShowKey(v => !v)} title={showKey ? 'Hide key' : 'Show key'}>
                      {showKey ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </Field>
              )}
            </>
          )}

          <div className="settings-card settings-toggle-card">
            <div>
              <div className="settings-toggle-title">Extra element types</div>
              <div className="settings-toggle-desc">Adds Animal and Crowd to the element type selector.</div>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={advancedElementTypes}
                onChange={e => setAdvancedElementTypes(e.target.checked)}
              />
              <span className="switch-track" />
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className={`btn ${saved ? 'btn-active' : 'btn-accent'}`} onClick={save}>
              {saved ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

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
