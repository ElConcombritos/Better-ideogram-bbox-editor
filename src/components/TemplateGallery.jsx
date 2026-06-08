import { useStore, ASPECT_RATIOS } from '../store';

// Each template: a full state-compatible description + SVG preview layout
const TEMPLATES = [
  {
    id: 'portrait',
    name: 'Character Portrait',
    desc: 'Full-body character, text overlay, background scene',
    ratio: '9:16',
    preview: (
      <svg viewBox="0 0 100 160" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="160" fill="#1a1d27"/>
        <rect x="0" y="0" width="100" height="160" fill="#22263a" rx="2"/>
        <rect x="20" y="30" width="60" height="100" rx="2" fill="rgba(99,102,241,0.15)" stroke="#6366f1" strokeWidth="1"/>
        <rect x="5" y="135" width="90" height="18" rx="2" fill="rgba(245,158,11,0.15)" stroke="#f59e0b" strokeWidth="1"/>
        <text x="50" y="146" textAnchor="middle" fill="#f59e0b" fontSize="6" fontFamily="monospace">text</text>
        <text x="50" y="85" textAnchor="middle" fill="#6366f1" fontSize="6" fontFamily="monospace">obj</text>
      </svg>
    ),
    global: {
      high_level_description: 'A dramatic full-body portrait of a fantasy warrior in ornate silver armor, standing against a stormy sky.',
      aesthetics: 'cinematic, dark fantasy, dramatic',
      lighting: 'rim lighting, dramatic side shadows, moonlight',
      medium: 'illustration',
      styleMode: 'art_style',
      photo: '',
      art_style: 'detailed digital painting, concept art, hyper-detailed',
      globalPalette: ['#1A1A2E', '#16213E', '#0F3460', '#E94560', '#F5F5F5'],
      background: 'A tempestuous night sky with swirling storm clouds and distant lightning. Rocky cliffs fade into darkness below.',
    },
    elements: [
      { type: 'obj', bboxN: [30, 20, 875, 620], desc: 'A tall warrior in ornate silver armor with intricate engravings, standing in a powerful pose. The armor catches the moonlight with a cold metallic sheen. The warrior has a determined expression, short dark hair, and a large sword resting on their shoulder.' },
      { type: 'text', bboxN: [875, 5, 990, 985], text: 'THE LAST GUARDIAN', desc: 'Bold, weathered serif title text in off-white across the bottom, slightly worn texture.' },
    ],
  },
  {
    id: 'product',
    name: 'Product Shot',
    desc: 'Clean product photography with text label',
    ratio: '1:1',
    preview: (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" fill="#0d1120"/>
        <rect x="25" y="15" width="50" height="55" rx="4" fill="rgba(16,185,129,0.12)" stroke="#10b981" strokeWidth="1"/>
        <rect x="10" y="78" width="40" height="12" rx="2" fill="rgba(245,158,11,0.12)" stroke="#f59e0b" strokeWidth="1"/>
        <rect x="55" y="78" width="35" height="12" rx="2" fill="rgba(245,158,11,0.12)" stroke="#f59e0b" strokeWidth="1"/>
        <text x="50" y="47" textAnchor="middle" fill="#10b981" fontSize="5" fontFamily="monospace">bg</text>
      </svg>
    ),
    global: {
      high_level_description: 'A minimalist product photograph of a sleek glass perfume bottle on a reflective white surface.',
      aesthetics: 'minimal, clean, luxurious',
      lighting: 'soft studio lighting, subtle reflections, diffused shadows',
      medium: 'photograph',
      styleMode: 'photo',
      photo: 'macro lens, f/8, product photography, white seamless backdrop',
      art_style: '',
      globalPalette: ['#FFFFFF', '#F0F0F0', '#C8A96E', '#2D2D2D', '#E8E0D5'],
      background: 'A seamless white studio background with a soft, barely visible shadow and gentle gradient.',
    },
    elements: [
      { type: 'bg', bboxN: [50, 100, 700, 900], desc: 'A frosted glass perfume bottle with a gold metallic cap, cylindrical form, printed with an elegant serif logo. The bottle casts a soft elongated shadow on the white surface.' },
      { type: 'text', bboxN: [720, 80, 820, 480], text: 'LUMIÈRE', desc: 'Elegant thin gold serif brand name below the product.' },
      { type: 'text', bboxN: [720, 500, 820, 920], text: 'Eau de Parfum', desc: 'Small italicized subtitle in warm grey, right-aligned.' },
    ],
  },
  {
    id: 'landscape',
    name: 'Epic Landscape',
    desc: 'Wide cinematic scene with atmospheric elements',
    ratio: '16:9',
    preview: (
      <svg viewBox="0 0 160 90" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="160" height="90" fill="#080b14"/>
        <rect x="0" y="0" width="160" height="45" fill="rgba(99,102,241,0.06)" stroke="none"/>
        <rect x="10" y="50" width="60" height="30" rx="2" fill="rgba(99,102,241,0.12)" stroke="#6366f1" strokeWidth="0.8"/>
        <rect x="90" y="40" width="60" height="40" rx="2" fill="rgba(99,102,241,0.12)" stroke="#6366f1" strokeWidth="0.8"/>
        <rect x="35" y="5" width="90" height="30" rx="2" fill="rgba(16,185,129,0.1)" stroke="#10b981" strokeWidth="0.8"/>
        <text x="80" y="23" textAnchor="middle" fill="#10b981" fontSize="5" fontFamily="monospace">bg</text>
      </svg>
    ),
    global: {
      high_level_description: 'A sweeping aerial view of an ancient mountain city at dusk, with warm lantern lights beginning to glow across tiered stone architecture.',
      aesthetics: 'epic, atmospheric, warm-cool contrast',
      lighting: 'golden hour transitioning to dusk, warm lantern glows, cool purple sky',
      medium: 'photograph',
      styleMode: 'photo',
      photo: 'wide angle, f/11, drone aerial, long exposure',
      art_style: '',
      globalPalette: ['#FF6B35', '#2B2D42', '#8D99AE', '#EDF2F4', '#EF233C'],
      background: 'A vast mountain valley at the transition from golden hour to dusk. The sky shifts from deep amber at the horizon to violet-purple at the zenith, scattered with early stars.',
    },
    elements: [
      { type: 'bg', bboxN: [0, 0, 500, 1000], desc: 'Sweeping mountain sky at dusk — warm orange glow near horizon fading to deep purple above.' },
      { type: 'obj', bboxN: [500, 50, 950, 480], desc: 'Ancient stone city with tiered architecture cascading down a mountainside. Hundreds of warm lanterns create a golden glow. Detailed carved facades, archways, and terraced gardens.' },
      { type: 'obj', bboxN: [400, 550, 1000, 980], desc: 'A dramatic rocky mountain peak in the background, partially wrapped in low mist clouds, rendered in cool blue-grey tones against the sunset sky.' },
    ],
  },
  {
    id: 'typography',
    name: 'Typography Poster',
    desc: 'Bold typographic composition with layout precision',
    ratio: '4:3',
    preview: (
      <svg viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="120" height="90" fill="#080b14"/>
        <rect x="10" y="10" width="100" height="70" rx="2" fill="rgba(16,185,129,0.08)" stroke="#10b981" strokeWidth="0.8"/>
        <rect x="20" y="20" width="80" height="18" rx="1" fill="rgba(245,158,11,0.15)" stroke="#f59e0b" strokeWidth="0.8"/>
        <rect x="20" y="44" width="55" height="10" rx="1" fill="rgba(245,158,11,0.1)" stroke="#f59e0b" strokeWidth="0.6"/>
        <rect x="20" y="60" width="35" height="8" rx="1" fill="rgba(245,158,11,0.08)" stroke="#f59e0b" strokeWidth="0.6"/>
        <text x="60" y="32" textAnchor="middle" fill="#f59e0b" fontSize="5" fontFamily="monospace">HEADLINE</text>
      </svg>
    ),
    global: {
      high_level_description: 'A bold modernist typographic poster for a jazz music festival, using strong geometric letterforms and a restricted color palette.',
      aesthetics: 'modernist, bold, geometric, Swiss design',
      lighting: 'flat, even, no shadows — graphic design lighting',
      medium: 'graphic_design',
      styleMode: 'art_style',
      photo: '',
      art_style: 'Swiss International Style, bold sans-serif typography, geometric shapes, flat color',
      globalPalette: ['#1A1A1A', '#FFFFFF', '#FF3300', '#FFD700', '#004FFF'],
      background: 'A stark white background with a large red geometric rectangle occupying the left third of the composition.',
    },
    elements: [
      { type: 'text', bboxN: [80, 30, 280, 970], text: 'JAZZ NOIR', desc: 'Massive bold black sans-serif headline spanning the width of the poster. Ultra-heavy weight, tight tracking.' },
      { type: 'text', bboxN: [320, 30, 420, 600], text: 'INTERNATIONAL FESTIVAL', desc: 'Medium weight all-caps sans-serif subtitle in deep red, tracking widely spaced.' },
      { type: 'text', bboxN: [480, 30, 560, 400], text: 'MILAN · SEPT 12–21 · 2025', desc: 'Small golden sans-serif date and location details, left-aligned.' },
    ],
  },
  {
    id: 'event-poster',
    name: 'Event Poster',
    desc: 'Concert / festival poster with date, lineup, and visual identity',
    ratio: '9:16',
    preview: (
      <svg viewBox="0 0 100 160" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="160" fill="#08020f"/>
        <rect x="5" y="5" width="90" height="150" rx="3" fill="rgba(168,85,247,0.06)" stroke="#a855f7" strokeWidth="0.8"/>
        <rect x="10" y="20" width="80" height="30" rx="2" fill="rgba(168,85,247,0.18)" stroke="#a855f7" strokeWidth="0.8"/>
        <rect x="10" y="58" width="80" height="14" rx="1" fill="rgba(245,158,11,0.15)" stroke="#f59e0b" strokeWidth="0.6"/>
        <rect x="10" y="78" width="55" height="10" rx="1" fill="rgba(245,158,11,0.1)" stroke="#f59e0b" strokeWidth="0.6"/>
        <rect x="10" y="94" width="40" height="8" rx="1" fill="rgba(245,158,11,0.08)" stroke="#f59e0b" strokeWidth="0.5"/>
        <rect x="15" y="125" width="70" height="25" rx="3" fill="rgba(168,85,247,0.12)" stroke="#a855f7" strokeWidth="0.7"/>
        <text x="50" y="140" textAnchor="middle" fill="#a855f7" fontSize="5" fontFamily="monospace">bg art</text>
        <text x="50" y="38" textAnchor="middle" fill="#f0e8ff" fontSize="7" fontFamily="monospace" fontWeight="bold">HEADLINE</text>
      </svg>
    ),
    global: {
      high_level_description: 'A bold concert poster for an electronic music festival set in an underground warehouse venue.',
      aesthetics: 'dark, neon, underground, high contrast',
      lighting: 'dramatic stage lighting, deep shadows, neon purple and amber glows',
      medium: 'graphic_design',
      styleMode: 'art_style',
      photo: '',
      art_style: 'contemporary concert poster design, bold typography, grungy texture overlays, limited color palette',
      globalPalette: ['#08020F', '#A855F7', '#F59E0B', '#F0E8FF', '#1A0030'],
      background: 'Deep black background with a subtle grungy texture and faint purple radial glow emanating from center-bottom.',
    },
    elements: [
      { type: 'text', bboxN: [40, 10, 230, 990], text: 'CIRCUIT BREAK', desc: 'Massive bold uppercase display font title, slightly condensed. Off-white or very light purple tint, ultra-heavy weight spanning full width.' },
      { type: 'text', bboxN: [260, 10, 330, 990], text: 'ELECTRONIC MUSIC FESTIVAL', desc: 'Medium-weight all-caps subtitle in warm amber, widely tracked, sitting below the main title.' },
      { type: 'text', bboxN: [360, 10, 430, 990], text: 'DAFT PUNK · BICEP · FRED AGAIN', desc: 'Headliner names in medium white sans-serif, separated by centered dots.' },
      { type: 'text', bboxN: [460, 10, 520, 990], text: 'WAREHOUSE 23 · MILAN · 14 SEP 2025', desc: 'Small venue and date details in amber, clean sans-serif.' },
      { type: 'bg',  bboxN: [600, 0, 1000, 1000], desc: 'Abstract visual of a silhouetted crowd against dramatic stage lighting — purple and amber beams cutting through haze, smoke machines, and laser grid effects.' },
    ],
  },
  {
    id: 'infographic',
    name: 'Infographic',
    desc: 'Data visualization layout with title, sections and icons',
    ratio: '4:3',
    preview: (
      <svg viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="120" height="90" fill="#080f1a"/>
        <rect x="5" y="5" width="110" height="18" rx="2" fill="rgba(16,185,129,0.12)" stroke="#10b981" strokeWidth="0.8"/>
        <rect x="5" y="28" width="34" height="55" rx="2" fill="rgba(99,102,241,0.1)" stroke="#6366f1" strokeWidth="0.7"/>
        <rect x="43" y="28" width="34" height="55" rx="2" fill="rgba(99,102,241,0.1)" stroke="#6366f1" strokeWidth="0.7"/>
        <rect x="81" y="28" width="34" height="55" rx="2" fill="rgba(99,102,241,0.1)" stroke="#6366f1" strokeWidth="0.7"/>
        <text x="22" y="58" textAnchor="middle" fill="#6366f1" fontSize="5" fontFamily="monospace">01</text>
        <text x="60" y="58" textAnchor="middle" fill="#6366f1" fontSize="5" fontFamily="monospace">02</text>
        <text x="98" y="58" textAnchor="middle" fill="#6366f1" fontSize="5" fontFamily="monospace">03</text>
        <text x="60" y="15" textAnchor="middle" fill="#10b981" fontSize="5" fontFamily="monospace">TITLE</text>
      </svg>
    ),
    global: {
      high_level_description: 'A clean data-driven infographic explaining three key steps to sustainable living, with bold statistics and simple icons.',
      aesthetics: 'clean, informational, modern, trustworthy',
      lighting: 'flat design, no shadows, high contrast text on dark background',
      medium: 'graphic_design',
      styleMode: 'art_style',
      photo: '',
      art_style: 'modern infographic design, flat icons, bold data typography, grid layout, limited accent colors',
      globalPalette: ['#080F1A', '#10B981', '#6366F1', '#F0FDF4', '#94A3B8'],
      background: 'A very dark navy background (#080F1A) with subtle grid lines suggesting data and precision.',
    },
    elements: [
      { type: 'text', bboxN: [20, 20, 130, 980], text: '3 STEPS TO A SUSTAINABLE FUTURE', desc: 'Bold clean sans-serif headline in bright green, spanning the full width at the top of the layout.' },
      { type: 'obj',  bboxN: [160, 10, 940, 340], desc: 'First data column: large bold number "01" in indigo, simple flat leaf icon above it, short bold label "REDUCE" below, followed by 2 lines of small descriptive body text in light grey. Rounded rectangle card with subtle indigo border.' },
      { type: 'obj',  bboxN: [160, 350, 940, 660], desc: 'Second data column: large bold number "02" in indigo, flat recycling icon, bold label "REUSE", followed by brief descriptive text. Same card style as column 1.' },
      { type: 'obj',  bboxN: [160, 670, 940, 985], desc: 'Third data column: large bold number "03" in indigo, flat solar panel icon, bold label "RECYCLE", followed by brief descriptive text. Same card style.' },
    ],
  },
  {
    id: 'room',
    name: 'Interior Scene',
    desc: 'Architectural interior with furniture and lighting',
    ratio: '16:9',
    preview: (
      <svg viewBox="0 0 160 90" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="160" height="90" fill="#0d1120"/>
        <rect x="0" y="0" width="160" height="90" fill="rgba(16,185,129,0.05)" stroke="#10b981" strokeWidth="0.8"/>
        <rect x="20" y="50" width="55" height="35" rx="2" fill="rgba(99,102,241,0.12)" stroke="#6366f1" strokeWidth="0.8"/>
        <rect x="85" y="55" width="35" height="30" rx="2" fill="rgba(99,102,241,0.1)" stroke="#6366f1" strokeWidth="0.8"/>
        <rect x="130" y="20" width="25" height="65" rx="2" fill="rgba(245,158,11,0.1)" stroke="#f59e0b" strokeWidth="0.8"/>
        <rect x="60" y="20" width="50" height="35" rx="2" fill="rgba(99,102,241,0.08)" stroke="#6366f1" strokeWidth="0.6"/>
      </svg>
    ),
    global: {
      high_level_description: 'A cozy Scandinavian living room bathed in late afternoon sun, featuring a low profile sofa, wooden coffee table, and large windows.',
      aesthetics: 'warm, minimal, Scandinavian, hygge',
      lighting: 'warm afternoon sunlight streaming through large windows, long golden shadows across wooden floors',
      medium: 'photograph',
      styleMode: 'photo',
      photo: 'interior photography, 24mm wide angle, f/5.6, natural light',
      art_style: '',
      globalPalette: ['#F5E6D3', '#D4B896', '#8B6F5E', '#4A3728', '#E8DDD0'],
      background: 'Warm-toned Scandinavian living room with light oak hardwood floors, white plaster walls, and large floor-to-ceiling windows letting in warm afternoon light.',
    },
    elements: [
      { type: 'obj', bboxN: [550, 100, 950, 680], desc: 'A low-profile ivory linen three-seat sofa with plump cushions and wooden legs. Slightly rumpled, lived-in appearance. A chunky knit throw draped over one armrest.' },
      { type: 'obj', bboxN: [600, 300, 880, 720], desc: 'A round light oak coffee table with thin tapered legs, holding a small ceramic vase with dried pampas grass and two stacked art books.' },
      { type: 'obj', bboxN: [100, 700, 990, 980], desc: 'Floor-to-ceiling window with thin black metal frames, casting warm rectangular light panels across the floor. Sheer white curtains partially drawn.' },
      { type: 'obj', bboxN: [200, 80, 780, 130], desc: 'A minimal shelf on the wall with a small potted monstera, two books spine-out, and a round ceramic sculpture.' },
    ],
  },
];

function denormalizeElements(elements, CW, CH) {
  return elements.map((el, i) => {
    let bbox = null;
    if (el.bboxN) {
      const [yn, xn, yn2, xn2] = el.bboxN;
      bbox = {
        x: (xn  / 1000) * CW, y: (yn  / 1000) * CH,
        w: Math.max(8, ((xn2 - xn) / 1000) * CW),
        h: Math.max(8, ((yn2 - yn) / 1000) * CH),
      };
    }
    return { id: i + 1, type: el.type, desc: el.desc || '', text: el.text || '', bbox, palette: [] };
  });
}

export default function TemplateGallery({ onClose }) {
  const { state, dispatch } = useStore();

  const load = (tpl) => {
    const ratio = tpl.ratio || state.aspectRatio;
    const { w: CW, h: CH } = ASPECT_RATIOS[ratio];
    const elements = denormalizeElements(tpl.elements, CW, CH);

    if (state.elements.length > 0 &&
        !window.confirm(`Load "${tpl.name}"? This will replace the current canvas.`)) return;

    dispatch({
      type: 'LOAD_STATE',
      state: {
        ...state,
        aspectRatio: ratio,
        elements,
        selectedId: null,
        nextId: elements.length + 1,
        mode: 'select',
        global: { ...state.global, ...tpl.global },
      },
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-header">
          <div>
            <div className="modal-title">Template Gallery</div>
            <div className="modal-subtitle">Start from a pre-built layout — all elements are editable after loading</div>
          </div>
          <button
            className="btn btn-ghost btn-icon"
            style={{ marginLeft: 12 }}
            onClick={onClose}
          >✕</button>
        </div>
        <div className="modal-body">
          <div className="template-grid">
            {TEMPLATES.map(tpl => (
              <div key={tpl.id} className="template-card" onClick={() => load(tpl)}>
                <div className="template-preview" style={{ background: '#080b14' }}>
                  {tpl.preview}
                </div>
                <div className="template-info">
                  <div className="template-name">{tpl.name}</div>
                  <div className="template-desc">{tpl.desc} · {tpl.ratio}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
