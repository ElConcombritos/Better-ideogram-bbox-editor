const PROJECT_HISTORY_KEY = 'ideogram-bbox-project-history-v1';
const MAX_PROJECTS = 60;

function safeParse(raw, fallback) {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function snapshotPayload(state) {
  return {
    aspectRatio: state.aspectRatio,
    elements: state.elements || [],
    global: state.global || {},
  };
}

function makeHash(state) {
  return JSON.stringify(snapshotPayload(state));
}

function hasMeaningfulState(state) {
  if (!state) return false;
  if (state.elements?.length) return true;
  const g = state.global || {};
  return Boolean(
    g.high_level_description ||
    g.background ||
    g.aesthetics ||
    g.lighting ||
    g.medium ||
    g.photo ||
    g.art_style ||
    g.globalPalette?.length
  );
}

function firstText(value, max = 64) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  return text.length > max ? `${text.slice(0, max - 1)}...` : text;
}

export function makeProjectTitle(state) {
  const g = state?.global || {};
  const firstElement = state?.elements?.find(el => el.desc || el.text);
  return (
    firstText(g.high_level_description) ||
    firstText(firstElement?.text) ||
    firstText(firstElement?.desc) ||
    'Untitled project'
  );
}

export function loadProjectHistory() {
  if (typeof localStorage === 'undefined') return [];
  return safeParse(localStorage.getItem(PROJECT_HISTORY_KEY) || '[]', []);
}

function saveProjectHistory(items) {
  localStorage.setItem(PROJECT_HISTORY_KEY, JSON.stringify(items.slice(0, MAX_PROJECTS)));
}

export function recordProjectSnapshot(state, source = 'auto', explicitName = '') {
  if (!hasMeaningfulState(state)) return null;

  const now = new Date().toISOString();
  const hash = makeHash(state);
  const items = loadProjectHistory();
  const existing = items.find(item => item.hash === hash);

  if (existing) {
    existing.updatedAt = now;
    existing.source = source;
    existing.title = explicitName || existing.title || makeProjectTitle(state);
    saveProjectHistory([existing, ...items.filter(item => item.id !== existing.id)]);
    return existing;
  }

  const project = {
    id: `project_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    title: explicitName || makeProjectTitle(state),
    source,
    createdAt: now,
    updatedAt: now,
    elementCount: state.elements?.length || 0,
    aspectRatio: state.aspectRatio,
    hash,
    state: {
      ...state,
      selectedId: null,
      mode: 'select',
    },
  };

  saveProjectHistory([project, ...items]);
  return project;
}

export function deleteProjectSnapshot(id) {
  saveProjectHistory(loadProjectHistory().filter(item => item.id !== id));
}

export function clearProjectHistory() {
  saveProjectHistory([]);
}
