import { useState, useCallback } from 'react';
import { magicPrompt, generateFromPrompt } from './ai';
import { buildJSON, ASPECT_RATIOS } from './store';

export function captionToState(caption, aspectRatio, currentState) {
  const { w: CW, h: CH } = ASPECT_RATIOS[aspectRatio];

  const gPatch = {
    high_level_description: caption.high_level_description || '',
    background: caption.compositional_deconstruction?.background || '',
    aesthetics: caption.style_description?.aesthetics || '',
    lighting:   caption.style_description?.lighting   || '',
    medium:     caption.style_description?.medium     || '',
    photo:      caption.style_description?.photo      || '',
    art_style:  caption.style_description?.art_style  || '',
    globalPalette: caption.style_description?.color_palette || [],
    styleMode: caption.style_description?.art_style ? 'art_style' : 'photo',
  };

  const rawEls = caption.compositional_deconstruction?.elements || [];
  const newElements = rawEls.map((el, i) => {
    let bbox = null;
    if (el.bbox?.length === 4) {
      // Ideogram spec: [y_min, x_min, y_max, x_max]
      const [y1, x1, y2, x2] = el.bbox;
      bbox = {
        x: (x1 / 1000) * CW,
        y: (y1 / 1000) * CH,
        w: Math.max(8, ((x2 - x1) / 1000) * CW),
        h: Math.max(8, ((y2 - y1) / 1000) * CH),
      };
    }
    return {
      id: i + 1,
      type: el.type || 'obj',
      desc: el.desc || '',
      text: el.text || '',
      bbox,
      palette: el.color_palette || [],
    };
  });

  return {
    ...currentState,
    aspectRatio,
    elements: newElements,
    selectedId: null,
    nextId: newElements.length + 1,
    global: { ...currentState.global, ...gPatch },
    mode: 'select',
  };
}

export function useMagicPrompt(state, dispatch) {
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'error'
  const [error, setError] = useState(null);

  // Espande/raffina il JSON corrente
  const run = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const caption = buildJSON(state);
      const expanded = await magicPrompt(caption);
      dispatch({ type: 'LOAD_STATE', state: captionToState(expanded, state.aspectRatio, state) });
      setStatus('idle');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }, [state, dispatch]);

  // Genera da zero partendo da linguaggio naturale
  const generate = useCallback(async (userPrompt) => {
    setStatus('loading');
    setError(null);
    try {
      const { aspectRatio, caption } = await generateFromPrompt(userPrompt, state.aspectRatio);
      dispatch({ type: 'LOAD_STATE', state: captionToState(caption, aspectRatio, state) });
      setStatus('idle');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }, [state, dispatch]);

  const clearError = useCallback(() => { setStatus('idle'); setError(null); }, []);

  return { run, generate, status, error, clearError };
}
