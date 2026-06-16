const OLLAMA_URL = 'http://localhost:11434';
const MODEL = 'gemma4:e2b';

export const DEFAULT_SETTINGS = {
  backend: 'auto',
  provider: 'openai',
  model: '',
  apiKey: '',
  lmStudioUrl: 'http://localhost:1234/v1',
  advancedElementTypes: false,
};

const SETTINGS_KEY = 'ideogram-bbox-settings-v1';

export function loadSettings() {
  try {
    const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
    return { ...DEFAULT_SETTINGS, ...stored };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(patch) {
  const current = loadSettings();
  const next = { ...current, ...patch };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent('ideogram-settings-updated', { detail: next }));
}

export async function checkOllamaStatus() {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`, {
      signal: AbortSignal.timeout(2000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

const CLOUD_PROVIDERS = {
  openai: {
    label: 'OpenAI',
    kind: 'openai',
    url: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o-mini',
    needsKey: true,
    authHeader: (key) => `Bearer ${key}`,
  },
  anthropic: {
    label: 'Anthropic',
    kind: 'anthropic',
    url: 'https://api.anthropic.com/v1/messages',
    model: 'claude-haiku-4-5-20251001',
    needsKey: true,
    authHeader: (key) => key,
  },
  openrouter: {
    label: 'OpenRouter',
    kind: 'openai',
    url: 'https://openrouter.ai/api/v1/chat/completions',
    model: 'openai/gpt-4.1-mini',
    needsKey: true,
    authHeader: (key) => `Bearer ${key}`,
  },
  mistral: {
    label: 'Mistral',
    kind: 'openai',
    url: 'https://api.mistral.ai/v1/chat/completions',
    model: 'mistral-large-latest',
    needsKey: true,
    authHeader: (key) => `Bearer ${key}`,
  },
  google: {
    label: 'Google AI Studio',
    kind: 'google',
    model: 'gemini-2.5-flash',
    needsKey: true,
  },
  lmstudio: {
    label: 'LM Studio',
    kind: 'openai',
    model: 'local-model',
    needsKey: false,
    authHeader: (key) => `Bearer ${key}`,
  },
};

export function getProviderDefaultModel(providerKey) {
  return CLOUD_PROVIDERS[providerKey]?.model || providerKey;
}

export function getProviderLabel(providerKey) {
  return CLOUD_PROVIDERS[providerKey]?.label || providerKey;
}

export function getProviderModels() {
  return Object.fromEntries(Object.entries(CLOUD_PROVIDERS).map(([id, provider]) => [id, provider.model]));
}

function openAICompatibleUrl(provider, settings) {
  if (settings.provider === 'lmstudio') {
    return `${(settings.lmStudioUrl || DEFAULT_SETTINGS.lmStudioUrl).replace(/\/+$/, '')}/chat/completions`;
  }
  return provider.url;
}

async function callCloud(systemMsg, userMsg) {
  const settings = loadSettings();
  const providerKey = settings.provider || 'openai';
  const apiKey = settings.apiKey;
  const provider = CLOUD_PROVIDERS[providerKey];

  if (!provider) throw new Error(`Unknown AI provider: ${providerKey}`);
  if (provider.needsKey && !apiKey) throw new Error('No API key configured. Open Settings to add one.');

  const model = settings.model?.trim() || provider.model;

  console.group('[Cloud] Request');
  console.log('Provider:', providerKey, '| Model:', model);
  console.groupEnd();

  if (provider.kind === 'anthropic') {
    const res = await fetch(provider.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        system: systemMsg,
        messages: [{ role: 'user', content: userMsg }],
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Anthropic HTTP ${res.status}: ${t}`);
    }
    const data = await res.json();
    return data.content?.[0]?.text ?? '';
  }

  if (provider.kind === 'google') {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemMsg }] },
        contents: [{ role: 'user', parts: [{ text: userMsg }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
        },
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Google AI Studio HTTP ${res.status}: ${t}`);
    }
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('') ?? '';
  }

  const headers = { 'Content-Type': 'application/json' };
  if (apiKey || provider.needsKey) headers.Authorization = provider.authHeader(apiKey || 'lm-studio');

  const res = await fetch(openAICompatibleUrl(provider, settings), {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemMsg },
        { role: 'user', content: userMsg },
      ],
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`${providerKey} HTTP ${res.status}: ${t}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

const MAGIC_SYSTEM = `You are a world-class art director and copywriter specializing in AI image generation prompts for Ideogram 4. Your job is to transform a rough caption into a publication-ready, cinematically rich description that will produce a visually stunning image.

## Editorial standards (apply to EVERY field you touch)
- "desc" fields must be specific and painterly: include material, texture, lighting direction, color temperature, surface quality, emotional tone. Never write generic placeholders like "majestic subject" or "stylized font" - describe exactly what you see in your mind's eye.
- "high_level_description" MUST always be filled. If empty, infer a compelling one-line creative director pitch from the elements present. If already filled, enrich it.
- "background" MUST always be filled. If empty, infer the most fitting environment from the subject matter: light sources, atmosphere, depth, secondary elements.
- "style_description" MUST always be filled. If empty, infer the most fitting aesthetic from the subject matter and fill ALL sub-fields (aesthetics, lighting, medium, and either photo or art_style - never both).
- For "text" elements: enrich only the "desc" field (rendering style, font feel, color, treatment) - NEVER alter the "text" field. The "text" value is the literal string the user wants rendered in the image: it is sacred and must be copied verbatim.
- Color palettes must be intentional and harmonious: choose colors that reinforce the mood (e.g. deep amber + charcoal for power, icy blue + white for serenity).

## Hard rules
1. Return ONLY the raw JSON object - no markdown fences, no explanation, no text before or after.
2. Preserve ALL existing "bbox" arrays exactly as-is - never change coordinates.
3. Preserve ALL existing "color_palette" arrays exactly as-is.
4. Preserve ALL existing "text" fields exactly as-is - word for word, including punctuation and capitalisation.
5. Use only these keys per element:
   - type "obj", "bg", "character", "animal", or "crowd": type, bbox (if present), desc, color_palette (if present)
   - type "text": type, bbox (if present), text, desc, color_palette (if present)
6. All hex colors must be uppercase #RRGGBB.
7. Do NOT add keys not in the schema. Do NOT wrap output in markdown.`;

const INSTRUCTIONS = MAGIC_SYSTEM;

const VALID_RATIOS = ['1:1', '16:9', '21:9', '3:2', '4:3', '3:4', '9:16'];

const RATIO_DESCRIPTIONS = `
- "1:1"  -> Square (social media, album covers)
- "16:9" -> Landscape widescreen (cinematic, desktop wallpaper)
- "21:9" -> Landscape ultrawide (panoramic, cinematic letterbox)
- "3:2"  -> Landscape photo (DSLR photo, 6x4 print)
- "4:3"  -> Landscape standard (older TV, presentation slide)
- "3:4"  -> Portrait standard (book cover, A4 page - TALLER than wide)
- "9:16" -> Portrait widescreen (phone screen, story, concert poster - TALLEST format)
IMPORTANT: "3:4" and "9:16" are PORTRAIT (height > width). "4:3" and "3:2" are LANDSCAPE (width > height). Never confuse them.`;

const GENERATE_SYSTEM = `You are a world-class art director, copywriter, and AI image generation specialist for Ideogram 4. Your job is to take a rough user description - even a single vague sentence - and produce a complete, publication-ready JSON caption that will generate a visually stunning, editorially coherent image.

## Your creative mandate
When the user's prompt is vague or sparse, you do NOT produce a generic result. Instead, you make strong creative decisions:
- Choose a specific visual style, mood, and color palette that fits the subject matter.
- Write element descriptions as a cinematographer would brief a VFX artist: precise, sensory, evocative.
- Write text copy (for "text" elements) that is original and thematically sharp - never default to cliches.
- Always fill style_description completely: aesthetics, lighting, medium, and photo/art_style. These fields are NEVER left empty.
- Always fill high_level_description with a one-sentence creative pitch that captures the image's essence and mood.
- Always fill background with a rich set-dressing description: light sources, atmosphere, depth, secondary environmental elements.
- Color palettes must be intentional: 4-6 colors that create visual harmony and reinforce the mood.

## Bbox rules (CRITICAL - spatial accuracy determines composition quality)
- Format: [y_min, x_min, y_max, x_max] - ALL values normalized 0-1000.
- y is the VERTICAL axis: 0 = top edge, 1000 = bottom edge.
- x is the HORIZONTAL axis: 0 = left edge, 1000 = right edge.
- bbox = [top, left, bottom, right]. Think of it as CSS: top/left/bottom/right.
- Text elements must NOT overlap with each other. Stack them vertically.
- At least one "bg" element must cover most of the canvas.
- Subject elements should be sized proportionally - a full-body subject in a poster fills roughly 60-70% of canvas height.

## Spatial reference (internalize these - do not deviate without reason):
- Full background:                   [0,   0,   1000, 1000]
- Large centered subject (portrait): [100, 150, 900,  850]
- Large subject, bottom-anchored:    [300, 100, 1000, 900]
- Full-width headline at top:        [30,  30,  150,  970]
- Full-width subtitle below:         [160, 30,  260,  970]
- Full-width text band at bottom:    [800, 30,  900,  970]
- Small footer line:                 [920, 30,  980,  970]
- Left-half object:                  [100, 10,  900,  490]
- Right-half object:                 [100, 510, 900,  990]
- Top-right badge/logo:              [20,  780, 110,  980]

## Schema rules (MANDATORY):
1. Return ONLY the raw JSON object - no markdown fences, no explanation, no text before or after.
2. Top-level wrapper: { "aspectRatio": "...", "caption": { ...ideogram caption... } }
3. caption schema: { high_level_description, style_description, compositional_deconstruction }
4. style_description key order:
   - photo mode:     aesthetics, lighting, photo, medium, color_palette (optional)
   - art/illus mode: aesthetics, lighting, medium, art_style, color_palette (optional)
5. compositional_deconstruction: { background (string), elements (array) }
6. Element key order:
   - obj/bg/character/animal/crowd: type, bbox, desc, color_palette (optional)
   - text:   type, bbox, text, desc, color_palette (optional)
7. One "text" element per visible line or text group. Never merge multiple lines. Stack vertically with strictly increasing y_min values.
8. Include 4-10 elements. At least one must be type "bg".
9. All hex colors uppercase #RRGGBB. color_palette: max 16 in style_description, max 5 per element.
10. aspectRatio must be one of:${RATIO_DESCRIPTIONS}

## Example of the quality level expected
User prompt: "A poster with a jaguar and some motivational text."

Expected output quality (desc excerpt):
- bg desc: "Dense Amazonian jungle at twilight - deep teal canopy with shafts of golden backlight piercing through, wet leaves catching the last light, ground-level mist softening the lower frame"
- obj desc: "A male Panthera onca in a low, coiled crouch - spotted rosette pattern in warm amber and charcoal on a tawny base coat, muscles tensed under the skin, amber eyes reflecting a catch-light, nose-level with the viewer, fur rim-lit in warm gold against the dark jungle"
- text copy: sharp, original, thematically fitting (e.g. "The jungle does not apologize." not "Believe in Yourself")`;

const GENERATE_INSTRUCTIONS = GENERATE_SYSTEM;

function elementTypesInstruction(settings = loadSettings()) {
  const types = settings.advancedElementTypes
    ? ['bg', 'obj', 'character', 'text', 'animal', 'crowd']
    : ['bg', 'obj', 'character', 'text'];

  const advancedLine = settings.advancedElementTypes
    ? '- Use "animal" for non-human animals and "crowd" for groups, audiences, armies, mobs, or dense gatherings.'
    : '- Do not use "animal" or "crowd" unless advanced element types are enabled in settings.';

  return `## Element type choices
Allowed element types: ${types.map(t => `"${t}"`).join(', ')}.
- Use "bg" for the environment or broad background layer.
- Use "character" for a specific person, humanoid, superhero, mascot, or named fictional subject such as Spider-Man. This tells the model it is an intentional character, not a generic object or prop.
- Use "obj" only for inanimate objects, props, vehicles, furniture, buildings, logos, and other non-character subjects.
- Use "text" only for visible typography or lettering.
${advancedLine}`;
}

async function tryGenerateOnce(systemMsg, userMsg) {
  const data = await callOllama(systemMsg, userMsg);
  const extracted = extractJSON(data);

  if (!extracted) {
    console.error('[GeneratePrompt] No valid JSON:', data);
    throw new Error('The model did not return valid JSON. Check the console for details.');
  }

  return extracted;
}

export async function generateFromPrompt(userPrompt, forcedRatio = null) {
  const settings = loadSettings();
  const ratioInstruction = forcedRatio
    ? `\nIMPORTANT: You MUST use "aspectRatio": "${forcedRatio}" - the user has explicitly chosen this format. Do not override it.`
    : '';
  const typeInstruction = elementTypesInstruction(settings);
  const systemMsg = `${GENERATE_SYSTEM}

${typeInstruction}`;

  const userMsg = `${GENERATE_INSTRUCTIONS}

${typeInstruction}${ratioInstruction}

Natural language description: "${userPrompt}"

Return the JSON object with "aspectRatio" and "caption" keys:`;

  const cloudUserMsg = `${ratioInstruction ? ratioInstruction.trim() + '\n\n' : ''}Natural language description: "${userPrompt}"

Return the JSON object with "aspectRatio" and "caption" keys:`;

  console.group('[GeneratePrompt] Request');
  console.log('User prompt:', userPrompt, '| forcedRatio:', forcedRatio);
  console.groupEnd();

  const { backend = 'auto' } = settings;
  let extracted = null;
  let lastError = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const retryNote = attempt === 1
      ? ''
      : `\n\nPrevious attempt failed: ${lastError?.message || 'unknown error'}. Try again and return ONLY a complete valid JSON object.`;
    try {
      console.log(`[GeneratePrompt] Attempt ${attempt}/3`);
      extracted = await tryGenerateOnce(systemMsg, (backend === 'cloud' ? cloudUserMsg : userMsg) + retryNote);
      break;
    } catch (err) {
      lastError = err;
      if (attempt === 3) throw err;
      console.warn(`[GeneratePrompt] Attempt ${attempt} failed - retrying:`, err.message);
    }
  }

  const aspectRatio = forcedRatio ?? (VALID_RATIOS.includes(extracted.aspectRatio) ? extracted.aspectRatio : '1:1');
  const caption = extracted.caption ?? extracted;

  console.log('[GeneratePrompt] Result:', { aspectRatio, caption });
  return { aspectRatio, caption };
}

async function callOllama(systemMsg, userMsg) {
  const { backend = 'auto' } = loadSettings();

  if (backend === 'cloud') return callCloud(systemMsg, userMsg);

  let response;
  try {
    response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        stream: false,
        messages: [{ role: 'user', content: userMsg }],
        options: { temperature: 0.7, num_predict: 4096 },
      }),
      signal: AbortSignal.timeout(120000),
    });
  } catch (err) {
    if (backend === 'ollama') {
      throw new Error(`Ollama not reachable at ${OLLAMA_URL} - is it running?`, { cause: err });
    }
    console.warn('[Ollama] Not reachable - trying cloud fallback:', err.message);
    return callCloud(systemMsg, userMsg);
  }

  if (!response.ok) {
    const text = await response.text();
    console.error('[Ollama] HTTP error:', response.status, text);
    if (backend === 'ollama') throw new Error(`Ollama HTTP ${response.status}: ${text}`);
    console.warn('[Ollama] Falling back to cloud provider');
    return callCloud(systemMsg, userMsg);
  }

  const data = await response.json();
  console.log('[Ollama] done_reason:', data.done_reason, '| tokens:', data.eval_count);
  if (data.done_reason === 'length') {
    console.warn('[Ollama] Response truncated - JSON may be incomplete');
  }

  return data.message?.content ?? '';
}

function stripEmpty(obj) {
  if (Array.isArray(obj)) return obj.length ? obj : undefined;
  if (obj && typeof obj === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      const cleaned = stripEmpty(v);
      if (cleaned !== undefined && cleaned !== '') out[k] = cleaned;
    }
    return Object.keys(out).length ? out : undefined;
  }
  return obj === '' ? undefined : obj;
}

export async function magicPrompt(captionJSON) {
  const captionStr = JSON.stringify(stripEmpty(captionJSON) ?? captionJSON, null, 2);
  const systemMsg = `${MAGIC_SYSTEM}

${elementTypesInstruction()}`;

  const userMsg = `${INSTRUCTIONS}

${elementTypesInstruction()}

Expand and refine this Ideogram 4 caption. Return ONLY the improved JSON object:

${captionStr}`;

  const cloudUserMsg = `Expand and refine this Ideogram 4 caption. Return ONLY the improved JSON object:

${captionStr}`;

  console.group('[MagicPrompt] Request');
  console.log('Input:', captionJSON);
  console.groupEnd();

  const { backend = 'auto' } = loadSettings();
  const raw = await callOllama(systemMsg, backend === 'cloud' ? cloudUserMsg : userMsg);

  const extracted = extractJSON(raw);
  if (!extracted) {
    console.error('[MagicPrompt] No valid JSON in response:', raw);
    throw new Error('The model did not return valid JSON. See console for details.');
  }

  console.log('[MagicPrompt] JSON parsed OK:', extracted);
  return extracted;
}

function extractJSON(str) {
  let s = str
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/^```(?:json)?\s*/im, '')
    .replace(/\s*```\s*$/m, '')
    .trim();

  try {
    return JSON.parse(s);
  } catch {
    // Try extracting the first JSON object below.
  }

  const start = s.indexOf('{');
  if (start === -1) {
    console.error('[Ollama] No { found in raw:', s.slice(0, 300));
    return null;
  }

  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < s.length; i++) {
    const ch = s[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === '\\' && inString) {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(s.slice(start, i + 1));
        } catch {
          // Fall through to the repair pass below.
        }
        break;
      }
    }
  }

  const partial = s.slice(start);
  const stack = [];
  let fixInStr = false;
  let fixEsc = false;
  for (let i = 0; i < partial.length; i++) {
    const ch = partial[i];
    if (fixEsc) {
      fixEsc = false;
      continue;
    }
    if (ch === '\\' && fixInStr) {
      fixEsc = true;
      continue;
    }
    if (ch === '"') {
      fixInStr = !fixInStr;
      continue;
    }
    if (fixInStr) continue;
    if (ch === '{') stack.push('}');
    else if (ch === '[') stack.push(']');
    else if (ch === '}' || ch === ']') stack.pop();
  }

  const closing = stack.reverse().join('');
  const repaired = partial + closing;
  try {
    const result = JSON.parse(repaired);
    if (closing) console.warn(`[Ollama] JSON repaired by adding: ${closing}`);
    return result;
  } catch (err) {
    console.error('[Ollama] Parse failed after repair:', err.message);
    console.error('[Ollama] Full raw:\n', s);
    return null;
  }
}
