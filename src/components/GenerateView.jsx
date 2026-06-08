import { useRef, useState } from 'react';
import { loadSettings } from '../ai';

const SUGGESTIONS = [
  { label: 'Portrait', text: 'A dramatic noir photograph of a rain-soaked Tokyo street at night. A lone detective under a red neon sign.' },
  { label: 'Product', text: 'Minimalist product shot of a glass perfume bottle on a white marble surface, soft studio lighting.' },
  { label: 'Landscape', text: 'Epic aerial view of an ancient mountain city at dusk, warm lantern lights, cinematic 16:9.' },
  { label: 'Poster', text: 'Bold modernist typographic poster for a jazz festival in Milan, Swiss International Style, red and black.' },
  { label: 'Interior', text: 'Cozy Scandinavian living room with afternoon golden light streaming through large windows.' },
  { label: 'Fantasy', text: 'A fantasy warrior in silver armor standing on a cliff edge, stormy sky, dramatic rim lighting.' },
];

const PROVIDER_MODELS = {
  openai:     'gpt-4o-mini',
  anthropic:  'claude-haiku-4-5',
  openrouter: 'openai/gpt-4.1-mini',
};

function activeBackendLabel() {
  const { backend = 'auto', provider = 'openai', model } = loadSettings();
  if (backend === 'ollama') return 'Ollama (gemma4:e2b)';
  const providerModel = model?.trim() || PROVIDER_MODELS[provider] || provider;
  if (backend === 'cloud') return providerModel;
  // auto: show both, Ollama preferred
  return `Ollama → ${providerModel} fallback`;
}

export default function GenerateView({ onGenerate, magicStatus }) {
  const [value, setValue] = useState('');
  const textareaRef = useRef(null);
  const isLoading = magicStatus === 'loading';
  const backendLabel = activeBackendLabel();

  const submit = () => {
    const v = value.trim();
    if (!v || isLoading) return;
    onGenerate(v);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
  };

  const applySuggestion = (text) => {
    setValue(text);
    textareaRef.current?.focus();
  };

  return (
    <div className="generate-view">
      <div className="generate-view-inner">
        {/* Header */}
        <div className="generate-header">
          <h1 className="generate-title">Describe your image</h1>
          <p className="generate-subtitle">
            AI will build the full Ideogram 4 JSON prompt for you — bounding boxes, style, colors and all.
          </p>
        </div>

        {/* Main input */}
        <div className={`generate-box${isLoading ? ' loading' : ''}`}>
          {isLoading ? (
            <div className="generate-thinking">
              <div className="generate-spinner" />
              <span>Building your prompt with <strong>{backendLabel}</strong>…</span>
            </div>
          ) : (
            <>
              <textarea
                ref={textareaRef}
                className="generate-textarea"
                value={value}
                rows={3}
                placeholder="A cinematic portrait of a samurai at golden hour, 9:16, shallow depth of field…"
                autoFocus
                onChange={(e) => {
                  setValue(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
                }}
                onKeyDown={onKeyDown}
              />
              <div className="generate-box-footer">
                <span className="generate-hint"><kbd>Enter</kbd> to generate · <kbd>Shift+Enter</kbd> new line</span>
                <button
                  className={`generate-send${value.trim() ? ' active' : ''}`}
                  onClick={submit}
                  disabled={!value.trim()}
                >
                  <SendIcon /> Generate
                </button>
              </div>
            </>
          )}
        </div>

        {/* Suggestions */}
        {!isLoading && (
          <div className="generate-suggestions">
            <div className="generate-suggestions-label">Try an example</div>
            <div className="generate-suggestions-grid">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  className="generate-suggestion-card"
                  onClick={() => applySuggestion(s.text)}
                >
                  <span className="generate-suggestion-label">{s.label}</span>
                  <span className="generate-suggestion-text">{s.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SendIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2L2 7l5 2 2 5 5-12z" />
    </svg>
  );
}
