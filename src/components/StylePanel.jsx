import { useStore } from '../store';

const STYLE_PRESETS = [
  {
    label: 'Photo réaliste',
    value: 'Realistic commercial photography, natural materials, believable proportions, clean professional composition, accurate texture and shadows.',
  },
  {
    label: 'Publicité premium',
    value: 'High-end advertising visual, polished composition, premium product staging, refined contrast, glossy highlights, elegant typography-friendly design.',
  },
  {
    label: 'Fast food coloré',
    value: 'Colorful fast food promotional style, bold appetizing colors, energetic composition, punchy contrast, playful commercial visual language.',
  },
  {
    label: 'Luxe sobre',
    value: 'Minimal luxury advertising style, restrained palette, elegant negative space, premium materials, subtle lighting, sophisticated editorial composition.',
  },
  {
    label: 'Illustration',
    value: 'Modern editorial illustration, stylized shapes, clean readable composition, expressive colors, polished digital artwork.',
  },
  {
    label: 'Cartoon',
    value: 'Bold cartoon illustration, playful exaggerated shapes, friendly characterful design, bright colors, simple readable lighting.',
  },
  {
    label: '3D produit',
    value: 'High-quality 3D product render, crisp forms, realistic materials, controlled studio lighting, clean commercial presentation.',
  },
  {
    label: 'Minimaliste',
    value: 'Minimalist graphic design, simple composition, strong negative space, restrained colors, clean hierarchy, low visual clutter.',
  },
];

const CONTEXT_PRESETS = [
  {
    label: 'Restaurant moderne',
    value: 'Modern restaurant environment with tasteful decor, warm practical lights, clean surfaces, subtle depth, professional hospitality atmosphere.',
  },
  {
    label: 'Street food',
    value: 'Street food setting with lively urban energy, casual counter details, warm signage glow, textured materials, appetizing informal atmosphere.',
  },
  {
    label: 'Fond sombre premium',
    value: 'Premium dark background with controlled contrast, subtle gradients, refined reflections, uncluttered space for foreground elements and overlays.',
  },
  {
    label: 'Ambiance familiale',
    value: 'Warm family-friendly atmosphere, welcoming colors, soft approachable lighting, casual comfortable environment, cheerful but not childish.',
  },
  {
    label: 'Été / terrasse',
    value: 'Sunny summer terrace atmosphere, outdoor cafe feeling, bright natural light, fresh colors, relaxed seasonal mood.',
  },
  {
    label: 'Nuit / événement',
    value: 'Night event atmosphere with dramatic lighting, neon or stage accents, deep contrast, festive energy, cinematic depth.',
  },
];

export default function StylePanel() {
  const { state, dispatch } = useStore();
  const { global: g } = state;
  const patch = (p) => dispatch({ type: 'UPDATE_GLOBAL', patch: p });

  return (
    <div className="panel-body">
      <div className="field-group">
        <div className="field-label">Style global</div>
        <textarea
          autoComplete="off"
          data-form-type="other"
          value={g.clientStyle}
          placeholder="Décris le rendu souhaité : photo réaliste, publicité premium, cartoon..."
          onChange={(e) => patch({ clientStyle: e.target.value })}
          rows={3}
        />
        <PresetChips
          presets={STYLE_PRESETS}
          onPick={(value) => patch({ clientStyle: value })}
        />
      </div>

      <div className="divider" />

      <div className="field-group">
        <div className="field-label">Ambiance / contexte</div>
        <textarea
          autoComplete="off"
          data-form-type="other"
          value={g.clientContext}
          placeholder="Décris le décor ou l’ambiance : restaurant moderne, terrasse, fond sombre..."
          onChange={(e) => patch({ clientContext: e.target.value })}
          rows={3}
        />
        <PresetChips
          presets={CONTEXT_PRESETS}
          onPick={(value) => patch({ clientContext: value })}
        />
      </div>

      <div className="style-note">
        These fields are injected into the JSON sent to ComfyUI. Presets replace the field value, then you can edit the text freely.
      </div>
    </div>
  );
}

function PresetChips({ presets, onPick }) {
  return (
    <div className="preset-chip-grid">
      {presets.map((preset) => (
        <button
          key={preset.label}
          className="preset-chip"
          type="button"
          onClick={() => onPick(preset.value)}
          title={preset.value}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}
