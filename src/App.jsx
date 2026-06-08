import { useEffect, useState } from 'react';
import { StoreProvider, useStore } from './store';
import Toolbar from './components/Toolbar';
import Toolbox from './components/Toolbox';
import Canvas from './components/Canvas';
import RightPanel from './components/RightPanel';
import JsonPanel from './components/JsonPanel';
import TemplateGallery from './components/TemplateGallery';
import GenerateView from './components/GenerateView';
import SettingsModal from './components/SettingsModal';
import { useMagicPrompt } from './useMagicPrompt';

const THEME_KEY = 'ideogram-bbox-theme';

function AppInner() {
  const { state, dispatch, undo, redo, canUndo, canRedo } = useStore();
  const [snapEnabled, setSnapEnabled] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [appMode, setAppMode] = useState('manual'); // 'manual' | 'generate'
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || 'light');
  const { run: runMagic, generate, status: magicStatus, error: magicError, clearError } = useMagicPrompt(state, dispatch);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'dark' : '');
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');

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
          />
          <div className="center-col">
            <Canvas
              snapEnabled={snapEnabled}
              magicLoading={magicStatus === 'loading'}
            />
          </div>
          <RightPanel />
          <JsonPanel />
        </div>
      )}

      {showTemplates && <TemplateGallery onClose={() => setShowTemplates(false)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
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
