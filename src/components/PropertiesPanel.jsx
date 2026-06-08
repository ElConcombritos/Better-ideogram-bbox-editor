import { useStore, ASPECT_RATIOS, normalizeBbox } from '../store';
import ColorPalette from './ColorPalette';

export default function PropertiesPanel() {
  const { state, dispatch } = useStore();
  const { elements, selectedId, aspectRatio } = state;
  const { w: CW, h: CH } = ASPECT_RATIOS[aspectRatio];
  const el = elements.find(e => e.id === selectedId);

  const patch = (p) => dispatch({ type: 'UPDATE_ELEMENT', id: selectedId, patch: p });

  if (!el) {
    return (
      <div className="panel-body">
        <div className="empty-state">
          <div className="empty-state-icon">⬡</div>
          <div className="empty-state-text">
            {state.mode === 'draw'
              ? 'Drag on the canvas to create a bounding box'
              : 'Select an element on the canvas to edit it'}
          </div>
        </div>
        {elements.length > 0 && <ElementList elements={elements} selectedId={selectedId} dispatch={dispatch} />}
      </div>
    );
  }

  const bboxCoords = el.bbox ? normalizeBbox(el.bbox, CW, CH) : null;

  return (
    <div className="panel-body">
      {/* Type */}
      <div className="field-group">
        <div className="field-label">Type</div>
        <div className="type-selector">
          {['obj', 'text', 'bg'].map(t => (
            <button
              key={t}
              className={`type-btn${el.type === t ? ` active-${t}` : ''}`}
              onClick={() => patch({ type: t })}
            >{t}</button>
          ))}
        </div>
      </div>

      {/* Text field — only for type "text" */}
      {el.type === 'text' && (
        <div className="field-group">
          <div className="field-label">Text content</div>
          <input
            type="text"
            autoComplete="off" data-form-type="other"
            value={el.text}
            placeholder='e.g. "ACME TECH"'
            onChange={(e) => patch({ text: e.target.value })}
          />
        </div>
      )}

      {/* Description */}
      <div className="field-group">
        <div className="field-label">Description</div>
        <textarea
          autoComplete="off" data-form-type="other"
          value={el.desc}
          placeholder="Describe this element in detail…"
          onChange={(e) => patch({ desc: e.target.value })}
          rows={4}
        />
      </div>

      {/* Color palette */}
      <div className="field-group">
        <div className="field-label">Color palette <span style={{ color: 'var(--text-muted)', textTransform: 'none', fontWeight: 400 }}>(max 5)</span></div>
        <ColorPalette colors={el.palette} onChange={(p) => patch({ palette: p })} max={5} />
      </div>

      {/* BBox coords */}
      {bboxCoords && (
        <div className="field-group">
          <div className="field-label">BBox [y_min, x_min, y_max, x_max]</div>
          <div className="bbox-preview">[{bboxCoords.join(', ')}]</div>
        </div>
      )}

      <div className="divider" />
      <ElementList elements={elements} selectedId={selectedId} dispatch={dispatch} />
    </div>
  );
}

function ElementList({ elements, selectedId, dispatch }) {
  if (!elements.length) return null;
  return (
    <div className="field-group">
      <div className="section-header">
        <span className="section-title">Elements</span>
        <span className="section-badge">{elements.length}</span>
      </div>
      <div className="elem-list">
        {elements.map((e, idx) => (
          <div
            key={e.id}
            className={`elem-item${selectedId === e.id ? ' selected' : ''}`}
            onClick={() => {
              dispatch({ type: 'SELECT', id: e.id });
              if (selectedId !== e.id) dispatch({ type: 'SET_MODE', mode: 'select' });
            }}
          >
            <span className={`elem-item-index type-${e.type}`}>{idx + 1}</span>
            <span className={`elem-item-type type-${e.type}`}>{e.type}</span>
            <span className="elem-item-desc">{e.desc || <em style={{ opacity: 0.5 }}>no description</em>}</span>
            <button
              className="btn btn-danger btn-icon"
              style={{ width: 22, height: 22, fontSize: 13 }}
              title="Delete element"
              onClick={(ev) => { ev.stopPropagation(); dispatch({ type: 'DELETE_ELEMENT', id: e.id }); }}
            >×</button>
          </div>
        ))}
      </div>
    </div>
  );
}
