import { useState } from 'react';
import PropertiesPanel from './PropertiesPanel';
import StylePanel from './StylePanel';
import GlobalPanel from './GlobalPanel';

export default function RightPanel() {
  const [tab, setTab] = useState('element');
  return (
    <div className="right-panel">
      <div className="panel-tabs">
        <div className={`panel-tab${tab === 'element' ? ' active' : ''}`} onClick={() => setTab('element')}>Element</div>
        <div className={`panel-tab${tab === 'style' ? ' active' : ''}`} onClick={() => setTab('style')}>Style</div>
        <div className={`panel-tab${tab === 'global'  ? ' active' : ''}`} onClick={() => setTab('global')}>Global</div>
      </div>
      {tab === 'element' && <PropertiesPanel />}
      {tab === 'style' && <StylePanel />}
      {tab === 'global' && <GlobalPanel />}
    </div>
  );
}
