/* eslint-disable react-refresh/only-export-components, react-hooks/refs */
import { createContext, useContext, useReducer, useCallback, useRef } from 'react';

// ── Aspect ratios ──────────────────────────────────────────────
export const ASPECT_RATIOS = {
  '1:1':   { w: 600, h: 600,  label: 'Square' },
  '3:2':   { w: 720, h: 480,  label: 'Photo' },
  '4:3':   { w: 640, h: 480,  label: 'Standard' },
  '16:9':  { w: 720, h: 405,  label: 'Widescreen' },
  '21:9':  { w: 756, h: 324,  label: 'Ultrawide' },
  '3:4':   { w: 480, h: 640,  label: 'Portrait Standard' },
  '9:16':  { w: 405, h: 720,  label: 'Portrait Widescreen' },
};

// ── Initial state ──────────────────────────────────────────────
const initialGlobal = {
  high_level_description: '',
  clientStyle: '',
  clientContext: '',
  aesthetics: '',
  lighting: '',
  medium: '',
  styleMode: 'photo', // 'photo' | 'art_style'
  photo: '',
  art_style: '',
  globalPalette: [],
  background: '',
};

const makeInitialState = () => ({
  aspectRatio: '1:1',
  elements: [],   // { id, type:'obj'|'text'|'bg'|'character'|'animal'|'crowd', desc, text, bbox:{x,y,w,h}, palette:[] }
  selectedId: null,
  mode: 'draw',   // 'draw' | 'select'
  global: { ...initialGlobal },
  nextId: 1,
});


// ── Reducer ────────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {
    case 'SET_MODE':
      return { ...state, mode: action.mode, selectedId: null };

    case 'SET_ASPECT': {
      return { ...makeInitialState(), aspectRatio: action.ratio };
    }

    case 'ADD_ELEMENT': {
      const el = {
        id: state.nextId,
        type: 'obj',
        desc: '',
        text: '',
        bbox: action.bbox,
        palette: [],
      };
      return {
        ...state,
        elements: [...state.elements, el],
        selectedId: el.id,
        nextId: state.nextId + 1,
        mode: 'select',
      };
    }

    case 'PASTE_ELEMENT': {
      if (!action.element) return state;
      const offset = 20;
      let bbox = action.element.bbox ? { ...action.element.bbox } : null;
      if (bbox && action.canvasW && action.canvasH) {
        bbox = {
          ...bbox,
          x: Math.max(0, Math.min(action.canvasW - bbox.w, bbox.x + offset)),
          y: Math.max(0, Math.min(action.canvasH - bbox.h, bbox.y + offset)),
        };
      }
      const el = {
        ...action.element,
        id: state.nextId,
        bbox,
        palette: [...(action.element.palette || [])],
      };
      return {
        ...state,
        elements: [...state.elements, el],
        selectedId: el.id,
        nextId: state.nextId + 1,
        mode: 'select',
      };
    }

    case 'SELECT': return { ...state, selectedId: action.id };

    case 'UPDATE_ELEMENT': {
      return {
        ...state,
        elements: state.elements.map(el =>
          el.id === action.id ? { ...el, ...action.patch } : el
        ),
      };
    }

    case 'REORDER_ELEMENTS':
      return { ...state, elements: action.elements };

    case 'DELETE_ELEMENT': {
      const id = action.id ?? state.selectedId;
      return {
        ...state,
        elements: state.elements.filter(el => el.id !== id),
        selectedId: state.selectedId === id ? null : state.selectedId,
      };
    }

    case 'CLEAR_CANVAS':
      return { ...state, elements: [], selectedId: null, nextId: 1, global: { ...initialGlobal } };

    case 'UPDATE_GLOBAL':
      return { ...state, global: { ...state.global, ...action.patch } };

    case 'LOAD_STATE':
      return { ...action.state };

    default:
      return state;
  }
}

// ── Undo/Redo wrapper ──────────────────────────────────────────
// Actions that modify canvas history (not ephemeral UI state)
const HISTORY_ACTIONS = new Set([
  'SET_ASPECT', 'ADD_ELEMENT', 'UPDATE_ELEMENT', 'DELETE_ELEMENT',
  'CLEAR_CANVAS', 'REORDER_ELEMENTS', 'UPDATE_GLOBAL', 'LOAD_STATE', 'PASTE_ELEMENT',
]);

function useUndoReducer() {
  const past = useRef([]);
  const future = useRef([]);
  const [state, rawDispatch] = useReducer(reducer, undefined, makeInitialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  const dispatch = useCallback((action) => {
    if (HISTORY_ACTIONS.has(action.type)) {
      past.current.push(stateRef.current);
      if (past.current.length > 100) past.current.shift();
      future.current = [];
    }
    rawDispatch(action);
  }, []);

  const undo = useCallback(() => {
    if (!past.current.length) return;
    future.current.push(stateRef.current);
    const prev = past.current.pop();
    rawDispatch({ type: 'LOAD_STATE', state: prev });
  }, []);

  const redo = useCallback(() => {
    if (!future.current.length) return;
    past.current.push(stateRef.current);
    const next = future.current.pop();
    rawDispatch({ type: 'LOAD_STATE', state: next });
  }, []);

  const canUndo = past.current.length > 0;
  const canRedo = future.current.length > 0;

  return { state, dispatch, undo, redo, canUndo, canRedo };
}

// ── Context ────────────────────────────────────────────────────
const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const store = useUndoReducer();
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore() {
  return useContext(StoreContext);
}

// ── JSON serialization ─────────────────────────────────────────
// Normalizza coordinate pixel → 0-1000, ordine [y_min, x_min, y_max, x_max]
export function normalizeBbox(bbox, canvasW, canvasH) {
  const x1 = Math.max(0, bbox.x);
  const y1 = Math.max(0, bbox.y);
  const x2 = Math.min(canvasW, bbox.x + bbox.w);
  const y2 = Math.min(canvasH, bbox.y + bbox.h);
  return [
    Math.round((y1 / canvasH) * 1000),
    Math.round((x1 / canvasW) * 1000),
    Math.round((y2 / canvasH) * 1000),
    Math.round((x2 / canvasW) * 1000),
  ];
}

export function buildJSON(state) {
  const { global: g, elements, aspectRatio } = state;
  const { w: cw, h: ch } = ASPECT_RATIOS[aspectRatio];

  const caption = {};

  caption.aspect_ratio = aspectRatio;

  if (g.high_level_description.trim())
    caption.high_level_description = g.high_level_description.trim();

  // style_description
  const hasStyle = g.aesthetics || g.lighting || g.medium ||
    g.clientStyle || (g.styleMode === 'photo' ? g.photo : g.art_style);
  if (hasStyle) {
    const sd = {};
    const aesthetics = [g.clientStyle, g.aesthetics].filter(Boolean).join('; ');
    if (aesthetics) sd.aesthetics = aesthetics;
    if (g.lighting)   sd.lighting   = g.lighting;
    if (g.styleMode === 'photo') {
      if (g.photo)  sd.photo  = g.photo;
      if (g.medium) sd.medium = g.medium;
    } else {
      if (g.medium)     sd.medium     = g.medium;
      if (g.art_style)  sd.art_style  = g.art_style;
    }
    if (g.globalPalette.length) sd.color_palette = g.globalPalette.map(c => c.toUpperCase());
    caption.style_description = sd;
  }

  // compositional_deconstruction always present
  const cd = {};
  cd.background = [g.clientContext, g.background].filter(Boolean).join(' ');

  cd.elements = elements.map(el => {
    const obj = {};
    obj.type = el.type;
    if (el.bbox) {
      const nb = normalizeBbox(el.bbox, cw, ch);
      // Only include bbox if it has non-trivial size
      if (nb[2] - nb[0] > 0 && nb[3] - nb[1] > 0)
        obj.bbox = nb;
    }
    if (el.type === 'text' && el.text) obj.text = el.text;
    obj.desc = el.desc || '';
    if (el.palette?.length) obj.color_palette = el.palette.map(c => c.toUpperCase());
    return obj;
  });

  caption.compositional_deconstruction = cd;
  return caption;
}
