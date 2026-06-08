import { useStore } from '../store';
import ColorPalette from './ColorPalette';

export default function GlobalPanel() {
  const { state, dispatch } = useStore();
  const { global: g } = state;
  const patch = (p) => dispatch({ type: 'UPDATE_GLOBAL', patch: p });

  return (
    <div className="panel-body">
      <div className="field-group">
        <div className="field-label">High-level description</div>
        <textarea autoComplete="off" data-form-type="other"
          value={g.high_level_description}
          placeholder="One or two sentences summarizing the entire image…"
          onChange={(e) => patch({ high_level_description: e.target.value })}
          rows={3}
        />
      </div>

      <div className="divider" />
      <div className="section-title">Style description</div>

      <div className="field-group">
        <div className="field-label">Aesthetics</div>
        <input type="text" autoComplete="off" data-form-type="other" value={g.aesthetics}
          placeholder='e.g. "warm, playful, vibrant"'
          onChange={(e) => patch({ aesthetics: e.target.value })} />
      </div>

      <div className="field-group">
        <div className="field-label">Lighting</div>
        <input type="text" autoComplete="off" data-form-type="other" value={g.lighting}
          placeholder='e.g. "golden hour, soft shadows"'
          onChange={(e) => patch({ lighting: e.target.value })} />
      </div>

      <div className="field-group">
        <div className="field-label">Medium</div>
        <input type="text" autoComplete="off" data-form-type="other" value={g.medium}
          placeholder='e.g. "photograph", "illustration", "3d_render"'
          onChange={(e) => patch({ medium: e.target.value })} />
      </div>

      <div className="field-group">
        <div className="field-label">Style type</div>
        <div className="style-toggle">
          <button
            className={`style-toggle-btn${g.styleMode === 'photo' ? ' active' : ''}`}
            onClick={() => patch({ styleMode: 'photo' })}
          >photo</button>
          <button
            className={`style-toggle-btn${g.styleMode === 'art_style' ? ' active' : ''}`}
            onClick={() => patch({ styleMode: 'art_style' })}
          >art_style</button>
        </div>
      </div>

      <div className="field-group">
        <div className="field-label">{g.styleMode === 'photo' ? 'Photo' : 'Art style'}</div>
        {g.styleMode === 'photo' ? (
          <input type="text" autoComplete="off" data-form-type="other" value={g.photo}
            placeholder='e.g. "35mm, f/1.4, bokeh, shallow depth of field"'
            onChange={(e) => patch({ photo: e.target.value })} />
        ) : (
          <input type="text" autoComplete="off" data-form-type="other" value={g.art_style}
            placeholder='e.g. "flat vector illustration, bold outlines"'
            onChange={(e) => patch({ art_style: e.target.value })} />
        )}
      </div>

      <div className="field-group">
        <div className="field-label">Global color palette <span style={{ color: 'var(--text-muted)', textTransform: 'none', fontWeight: 400 }}>(max 16)</span></div>
        <ColorPalette colors={g.globalPalette} onChange={(p) => patch({ globalPalette: p })} max={16} />
      </div>

      <div className="divider" />
      <div className="section-title">Compositional deconstruction</div>

      <div className="field-group">
        <div className="field-label">Background</div>
        <textarea autoComplete="off" data-form-type="other"
          value={g.background}
          placeholder="Describe the background and environment…"
          onChange={(e) => patch({ background: e.target.value })}
          rows={3}
        />
      </div>
    </div>
  );
}
