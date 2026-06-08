# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # dev server su http://localhost:5173
npm run build    # build di produzione in dist/
npm run preview  # preview del build
```

Non ci sono test automatici. Verifica manuale nel browser.

## Architettura

Single-page app React + Vite senza dipendenze esterne (no Zustand, no Redux).

### State management: `src/store.jsx`

Tutto lo stato vive in un unico `useReducer` wrappato in `useUndoReducer` che gestisce la history per undo/redo (stack `past`/`future` tramite `useRef`). Il Context è in `StoreProvider`; i componenti accedono con `useStore()`.

**Struttura stato:**
```
{
  aspectRatio: '1:1' | '16:9' | '9:16' | '4:3',
  elements: [{ id, type, desc, text, bbox:{x,y,w,h}, palette:[] }],
  selectedId: number | null,
  mode: 'draw' | 'select',
  global: { high_level_description, aesthetics, lighting, medium,
            styleMode, photo, art_style, globalPalette, background },
  nextId: number,
}
```

`bbox` è in pixel relativi al canvas. La normalizzazione a 0–1000 avviene solo in `buildJSON()` e `normalizeBbox()`.

**Actions importanti del reducer:**
- `SET_ASPECT` — resetta canvas mantenendo i campi `global`
- `ADD_ELEMENT` — aggiunge elemento e passa automaticamente in `select` mode
- `LOAD_STATE` — usata sia da undo/redo che da import JSON

Solo le action in `HISTORY_ACTIONS` (modifiche strutturali) finiscono nello stack undo. I cambiamenti di `mode` e `selectedId` non sono undo-abili.

### Canvas: `src/components/Canvas.jsx`

SVG puro scalato con `viewBox`. Gli event listener globali `mousemove`/`mouseup`/`touchmove`/`touchend` sono su `window` (non sull'SVG) per non perdere il drag quando il mouse esce dall'area.

- **Draw mode**: `onBgDown` → `setDrawing` → `onMove` aggiorna preview → `onUp` fa `ADD_ELEMENT`
- **Select mode**: `onElemDown` → `setDragging` → `onMove` fa `UPDATE_ELEMENT` in tempo reale
- **Resize**: `onHandleDown` → `setResizing` → `onMove` chiama `resizeBbox()` che gestisce il flip (drag oltre il bordo opposto)
- 8 handle per elemento selezionato: 4 angoli (`nw/ne/sw/se`) + 4 medi (`n/s/e/w`)

### Serializzazione JSON: `buildJSON()` in `store.jsx`

L'**ordine delle chiavi** segue la specifica Ideogram 4:
- `style_description` photo: `aesthetics → lighting → photo → medium → color_palette`
- `style_description` art_style: `aesthetics → lighting → medium → art_style → color_palette`
- elementi `obj`/`bg`: `type → bbox → desc → color_palette`
- elementi `text`: `type → bbox → text → desc → color_palette`

`color_palette` viene sempre emesso in UPPERCASE (`#RRGGBB`).

### Import JSON: `JsonPanel.jsx` → `loadFromJSON()`

Riconverte `[y_min, x_min, y_max, x_max]` normalizzati in pixel bbox usando le dimensioni del `aspectRatio` corrente. Usa `LOAD_STATE` per rimpiazzare elementi e global in un colpo solo.

### Magic Prompt: `src/ai.js` + `src/useMagicPrompt.js`

Il pulsante **✦ Magic Prompt** in toolbar invia il JSON corrente a Ollama (`http://localhost:11434`) con il modello `gemma4:e2b` e un system prompt che istruisce il modello a:
- arricchire descrizioni testuali
- riempire campi vuoti (high_level_description, style_description, background)
- **non modificare mai** bbox e color_palette esistenti

Flusso: `buildJSON(state)` → `magicPrompt()` (fetch Ollama `/api/chat`) → `captionToState()` → `dispatch(LOAD_STATE)`.

`captionToState()` in `useMagicPrompt.js` è la controparte di `loadFromJSON()` in `JsonPanel.jsx` — stessa logica di conversione, da mantenere sincronizzate.

Per cambiare modello: modificare `MODEL` in `ollama.js`. Per cambiare le istruzioni al modello: modificare `SYSTEM_PROMPT` in `ollama.js`.

## Note critiche

- **Ordine bbox**: `[y_min, x_min, y_max, x_max]` — y prima di x, non il solito x,y
- **Normalizzazione**: `Math.round((px / dim) * 1000)`, range 0–1000 (non 0–1)
- `styleMode` decide quale chiave scrivere (`photo` vs `art_style`) — mai entrambe nello stesso JSON
- Il canvas SVG usa `viewBox` + `width/height: 100%` quindi le coordinate interne rimangono sempre nel range `[0, CW] × [0, CH]` indipendentemente dal zoom CSS
