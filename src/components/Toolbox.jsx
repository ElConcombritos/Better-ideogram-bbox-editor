import { useStore } from '../store';

export default function Toolbox({ snapEnabled, onSnapToggle, onCopyElement, onPasteElement, canCopy, canPaste }) {
  const { state, dispatch } = useStore();
  const { mode, selectedId, elements } = state;

  const moveZ = (dir) => {
    if (!selectedId) return;
    const idx = elements.findIndex(e => e.id === selectedId);
    if (idx === -1) return;
    const next = [...elements];
    const target = dir === 'up' ? idx + 1 : idx - 1;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    dispatch({ type: 'REORDER_ELEMENTS', elements: next });
  };

  return (
    <div className="toolbox">
      {/* Draw */}
      <button
        className={`tool-btn${mode === 'draw' ? ' active' : ''}`}
        onClick={() => dispatch({ type: 'SET_MODE', mode: 'draw' })}
        title="Draw bounding box (D)"
      >
        <DrawIcon />
        Draw
      </button>

      {/* Select */}
      <button
        className={`tool-btn${mode === 'select' ? ' active' : ''}`}
        onClick={() => dispatch({ type: 'SET_MODE', mode: 'select' })}
        title="Select / move (V)"
      >
        <SelectIcon />
        Select
      </button>

      <div className="toolbox-sep" />

      {/* Copy / paste */}
      <button
        className="tool-btn"
        onClick={onCopyElement}
        disabled={!canCopy}
        title="Copy selected element (Ctrl+C)"
      >
        <CopyIcon />
        Copy
      </button>
      <button
        className="tool-btn"
        onClick={onPasteElement}
        disabled={!canPaste}
        title="Paste copied element (Ctrl+V)"
      >
        <PasteIcon />
        Paste
      </button>

      <div className="toolbox-sep" />

      {/* Delete */}
      <button
        className="tool-btn"
        style={{ color: selectedId ? 'var(--danger)' : undefined }}
        onClick={() => dispatch({ type: 'DELETE_ELEMENT' })}
        disabled={!selectedId}
        title="Delete selected (Del)"
      >
        <DeleteIcon />
        Delete
      </button>

      <div className="toolbox-sep" />

      {/* Z-order */}
      <button
        className="tool-btn"
        onClick={() => moveZ('up')}
        disabled={!selectedId}
        title="Bring forward"
      >
        <BringFwdIcon />
        Forward
      </button>
      <button
        className="tool-btn"
        onClick={() => moveZ('down')}
        disabled={!selectedId}
        title="Send backward"
      >
        <SendBkIcon />
        Back
      </button>

      <div className="toolbox-sep" />

      {/* Clear canvas */}
      <button
        className="tool-btn"
        style={{ color: elements.length ? 'var(--danger)' : undefined }}
        onClick={() => {
          if (elements.length === 0) return;
          if (window.confirm('Clear all elements from the canvas?')) {
            dispatch({ type: 'CLEAR_CANVAS' });
          }
        }}
        disabled={elements.length === 0}
        title="Clear all elements"
      >
        <ClearIcon />
        Clear
      </button>

      <div className="toolbox-sep" />

      {/* Snap toggle */}
      <button
        className={`tool-btn${snapEnabled ? ' active' : ''}`}
        onClick={onSnapToggle}
        title="Toggle snap to grid"
      >
        <SnapIcon />
        Snap
      </button>
    </div>
  );
}

function DrawIcon() {
  return (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="12" height="12" rx="1" strokeDasharray="3 2" />
      <path d="M14 4l-3 3" />
    </svg>
  );
}
function SelectIcon() {
  return (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4l4 10 2-4 4-2z" />
    </svg>
  );
}
function DeleteIcon() {
  return (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6h10M7 6V4h4v2M8 9v4M10 9v4M5 6l1 9h6l1-9" />
    </svg>
  );
}
function CopyIcon() {
  return (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="5" width="8" height="10" rx="1" />
      <path d="M4 12H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v1" />
    </svg>
  );
}
function PasteIcon() {
  return (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4h6M7 2h4l1 2H6z" />
      <rect x="4" y="4" width="10" height="12" rx="1" />
      <path d="M7 8h4M7 11h3" />
    </svg>
  );
}
function BringFwdIcon() {
  return (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="6" width="8" height="8" rx="1" />
      <rect x="4" y="4" width="8" height="8" rx="1" strokeOpacity="0.4" />
      <path d="M9 8v4M7 10h4" />
    </svg>
  );
}
function SendBkIcon() {
  return (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="8" height="8" rx="1" />
      <rect x="6" y="6" width="8" height="8" rx="1" strokeOpacity="0.4" />
      <path d="M9 8v4M7 10h4" />
    </svg>
  );
}
function ClearIcon() {
  return (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3l12 12M15 3L3 15" />
    </svg>
  );
}
function SnapIcon() {
  return (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="5" cy="5" r="1" fill="currentColor" stroke="none" />
      <circle cx="9" cy="5" r="1" fill="currentColor" stroke="none" />
      <circle cx="13" cy="5" r="1" fill="currentColor" stroke="none" />
      <circle cx="5" cy="9" r="1" fill="currentColor" stroke="none" />
      <circle cx="9" cy="9" r="1" fill="currentColor" stroke="none" />
      <circle cx="13" cy="9" r="1" fill="currentColor" stroke="none" />
      <circle cx="5" cy="13" r="1" fill="currentColor" stroke="none" />
      <circle cx="9" cy="13" r="1" fill="currentColor" stroke="none" />
      <circle cx="13" cy="13" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
