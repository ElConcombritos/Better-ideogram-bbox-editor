import { useCallback, useEffect, useState } from 'react';
import { StoreProvider, useStore, ASPECT_RATIOS } from './store';
import Toolbar from './components/Toolbar';
import Toolbox from './components/Toolbox';
import Canvas from './components/Canvas';
import RightPanel from './components/RightPanel';
import JsonPanel from './components/JsonPanel';
import TemplateGallery from './components/TemplateGallery';
import GenerateView from './components/GenerateView';
import SettingsModal from './components/SettingsModal';
import ProjectHistoryModal from './components/ProjectHistoryModal';
import { useMagicPrompt } from './useMagicPrompt';
import { recordProjectSnapshot } from './projectHistory';

const THEME_KEY = 'ideogram-bbox-theme';

function AppInner() {
  const { state, dispatch, undo, redo, canUndo, canRedo } = useStore();
  const [snapEnabled, setSnapEnabled] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [appMode, setAppMode] = useState('manual'); // 'manual' | 'generate'
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || 'light');
  const [elementClipboard, setElementClipboard] = useState(null);
  const { run: runMagic, generate, status: magicStatus, error: magicError, clearError } = useMagicPrompt(state, dispatch);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'dark' : '');
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  const copySelectedElement = useCallback(() => {
    const selected = state.elements.find(el => el.id === state.selectedId);
    if (!selected) return;
    setElementClipboard({
      ...selected,
      bbox: selected.bbox ? { ...selected.bbox } : null,
      palette: [...(selected.palette || [])],
    });
  }, [state.elements, state.selectedId]);

  const pasteElement = useCallback(() => {
    if (!elementClipboard) return;
    const { w: canvasW, h: canvasH } = ASPECT_RATIOS[state.aspectRatio];
    dispatch({ type: 'PASTE_ELEMENT', element: elementClipboard, canvasW, canvasH });
  }, [dispatch, elementClipboard, state.aspectRatio]);

  useEffect(() => {
    const hasContent = state.elements.length > 0 ||
      state.global.high_level_description ||
      state.global.background ||
      state.global.aesthetics ||
      state.global.lighting;
    if (!hasContent) return;
    const id = setTimeout(() => recordProjectSnapshot(state, 'auto'), 1800);
    return () => clearTimeout(id);
  }, [state.aspectRatio, state.elements, state.global, state]);

  // Dopo generate, torna in manual per vedere il risultato sul canvas
  const handleGenerate = async (prompt) => {
    await generate(prompt);
    setAppMode('manual');
  };

  return (
    <>
      <Toolbar
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        onOpenTemplates={() => setShowTemplates(true)}
        onOpenSettings={() => setShowSettings(true)}
        onOpenHistory={() => setShowHistory(true)}
        onMagic={runMagic}
        magicStatus={magicStatus}
        magicError={magicError}
        onClearMagicError={clearError}
        appMode={appMode}
        onAppModeChange={setAppMode}
        theme={theme}
        onThemeToggle={toggleTheme}
      />

      {appMode === 'generate' ? (
        <GenerateView
          onGenerate={handleGenerate}
          magicStatus={magicStatus}
        />
      ) : (
        <div className="main-layout">
          <Toolbox
            snapEnabled={snapEnabled}
            onSnapToggle={() => setSnapEnabled(s => !s)}
            onCopyElement={copySelectedElement}
            onPasteElement={pasteElement}
            canCopy={Boolean(state.selectedId)}
            canPaste={Boolean(elementClipboard)}
          />
          <div className="center-col">
            <Canvas
              snapEnabled={snapEnabled}
              magicLoading={magicStatus === 'loading'}
              onCopyElement={copySelectedElement}
              onPasteElement={pasteElement}
              canCopy={Boolean(state.selectedId)}
              canPaste={Boolean(elementClipboard)}
            />
          </div>
          <RightPanel />
          <JsonPanel />
        </div>
      )}

      {showTemplates && <TemplateGallery onClose={() => setShowTemplates(false)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showHistory && <ProjectHistoryModal onClose={() => setShowHistory(false)} />}
    </>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AppInner />
    </StoreProvider>
  );
}
