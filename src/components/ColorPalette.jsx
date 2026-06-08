import { useRef } from 'react';

function ColorChip({ color, onEdit, onRemove }) {
  const pickerRef = useRef(null);

  return (
    <div className="color-chip-wrap" title={color}>
      <div className="color-chip" style={{ background: color }} />
      <div className="color-chip-actions">
        <button
          className="color-chip-action"
          title="Edit color"
          onClick={() => pickerRef.current?.click()}
        >✎</button>
        <button
          className="color-chip-action color-chip-remove"
          title="Remove color"
          onClick={onRemove}
        >×</button>
      </div>
      {/* Picker inline per chip — Firefox rispetta il click diretto */}
      <input
        ref={pickerRef}
        type="color"
        defaultValue={color}
        style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
        onInput={(e) => onEdit(e.target.value.toUpperCase())}
      />
    </div>
  );
}

export default function ColorPalette({ colors, onChange, max = 5 }) {
  const addPickerRef = useRef(null);
  const adding = useRef(false);

  const remove = (idx) => onChange(colors.filter((_, i) => i !== idx));
  const edit   = (idx, hex) => { const n = [...colors]; n[idx] = hex; onChange(n); };

  return (
    <div className="palette-wrap">
      <div className="palette-row">
        {colors.map((c, i) => (
          <ColorChip
            key={i}
            color={c}
            onEdit={(hex) => edit(i, hex)}
            onRemove={() => remove(i)}
          />
        ))}
        {colors.length < max && (
          <button
            className="color-chip-add"
            title="Add color"
            onClick={() => {
              adding.current = false;
              addPickerRef.current.value = '#6366f1';
              addPickerRef.current?.click();
            }}
          >+</button>
        )}
        <input
          ref={addPickerRef}
          type="color"
          style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
          onInput={(e) => {
            const hex = e.target.value.toUpperCase();
            if (!adding.current) {
              // Prima variazione: aggiunge nuovo colore
              adding.current = true;
              onChange([...colors, hex]);
            } else {
              // Variazioni successive: aggiorna l'ultimo aggiunto
              const next = [...colors];
              next[next.length - 1] = hex;
              onChange(next);
            }
          }}
          onBlur={() => { adding.current = false; }}
        />
      </div>
      {colors.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {colors.map((c, i) => (
            <span key={i} style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-muted)' }}>{c}</span>
          ))}
        </div>
      )}
    </div>
  );
}
