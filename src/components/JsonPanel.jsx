import { useState, useRef } from 'react';
import { useStore, buildJSON, ASPECT_RATIOS } from '../store';

// Minimal JSON syntax highlighter — returns HTML string
function highlight(json) {
  return json
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(
      /("(?:[^"\\]|\\.)*")(\s*:)?|(\b\d+\.?\d*\b)|(true|false|null)|([{}[\],])/g,
      (match, str, colon, num, kw, punct) => {
        if (str && colon)  return `<span class="json-key">${str}</span><span class="json-punct">:</span>`;
        if (str)           return `<span class="json-str">${str}</span>`;
        if (num != null)   return `<span class="json-num">${num}</span>`;
        if (kw)            return `<span class="json-${kw === 'null' ? 'null' : 'bool'}">${kw}</span>`;
        if (punct)         return `<span class="json-punct">${punct}</span>`;
        return match;
      }
    );
}

function loadFromJSON(data, aspectRatio) {
  const { w: CW, h: CH } = ASPECT_RATIOS[aspectRatio];
  const gPatch = {
    high_level_description: data.high_level_description || '',
    background: data.compositional_deconstruction?.background || '',
    aesthetics: data.style_description?.aesthetics || '',
    lighting:   data.style_description?.lighting   || '',
    medium:     data.style_description?.medium     || '',
    photo:      data.style_description?.photo      || '',
    art_style:  data.style_description?.art_style  || '',
    globalPalette: data.style_description?.color_palette || [],
    styleMode: data.style_description?.art_style ? 'art_style' : 'photo',
  };
  const elements = (data.compositional_deconstruction?.elements || []).map((el, i) => {
    let bbox = null;
    if (el.bbox?.length === 4) {
      // Ideogram spec: [y_min, x_min, y_max, x_max]
      const [y1, x1, y2, x2] = el.bbox;
      bbox = {
        x: (x1 / 1000) * CW, y: (y1 / 1000) * CH,
        w: Math.max(8, ((x2 - x1) / 1000) * CW),
        h: Math.max(8, ((y2 - y1) / 1000) * CH),
      };
    }
    return { id: i + 1, type: el.type || 'obj', desc: el.desc || '', text: el.text || '', bbox, palette: el.color_palette || [] };
  });
  return { gPatch, elements };
}

export default function JsonPanel() {
  const { state, dispatch } = useStore();
  const [compact, setCompact] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef(null);

  const caption = buildJSON(state);
  const jsonStr = compact
    ? JSON.stringify(caption, null, 0)
      .replace(/,/g, ', ')
    : JSON.stringify(caption, null, 2);

  const copy = async () => {
    // For Ideogram: compact with no spaces around separators
    const forModel = JSON.stringify(caption, null, compact ? 0 : 2);
    await navigator.clipboard.writeText(forModel);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const exportFile = () => {
    const blob = new Blob([JSON.stringify(caption, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'ideogram-caption.json'; a.click();
    URL.revokeObjectURL(url);
  };

  const importFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!data.compositional_deconstruction)
          throw new Error('Missing "compositional_deconstruction" — is this an Ideogram 4 caption?');
        const { gPatch, elements } = loadFromJSON(data, state.aspectRatio);
        dispatch({
          type: 'LOAD_STATE',
          state: {
            ...state,
            elements,
            selectedId: null,
            nextId: elements.length + 1,
            global: { ...state.global, ...gPatch },
            mode: 'select',
          },
        });
      } catch (err) { alert(`Import failed: ${err.message}`); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="json-panel">
      <div className="json-panel-header">
        <span className="json-panel-title">JSON Output</span>
        <div
          className={`json-compact-toggle${compact ? ' active' : ''}`}
          onClick={() => setCompact(c => !c)}
          title="Toggle compact format"
        >
          {compact ? '{ }' : '{ … }'}
        </div>
      </div>

      <div
        className="json-output"
        dangerouslySetInnerHTML={{ __html: highlight(jsonStr) }}
      />

      <div style={{ display: 'flex', gap: 6, padding: '8px 10px', borderTop: '1px solid var(--border-subtle)', flexShrink: 0 }}>
        <button
          className="btn btn-ghost"
          style={{ flex: 1, justifyContent: 'center', fontSize: 11 }}
          onClick={() => fileInputRef.current?.click()}
          title="Import .json file"
        >
          ↑ Import
        </button>
        <button
          className="btn btn-ghost"
          style={{ flex: 1, justifyContent: 'center', fontSize: 11 }}
          onClick={exportFile}
          title="Download .json"
        >
          ↓ Export
        </button>
        <button
          className={`btn ${copied ? 'btn-success-flash' : 'btn-accent'}`}
          style={{ flex: 1, justifyContent: 'center', fontSize: 11 }}
          onClick={copy}
          title="Copy JSON to clipboard"
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
        <input ref={fileInputRef} type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={importFile} />
      </div>
    </div>
  );
}
