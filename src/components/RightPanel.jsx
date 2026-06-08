import { useState } from 'react';
import PropertiesPanel from './PropertiesPanel';
import GlobalPanel from './GlobalPanel';

export default function RightPanel() {
  const [tab, setTab] = useState('element');
  return (
    <div className="right-panel">
      <div className="panel-tabs">
        <div className={`panel-tab${tab === 'element' ? ' active' : ''}`} onClick={() => setTab('element')}>Element</div>
        <div className={`panel-tab${tab === 'global'  ? ' active' : ''}`} onClick={() => setTab('global')}>Global</div>
      </div>
      {tab === 'element' ? <PropertiesPanel /> : <GlobalPanel />}
    </div>
  );
}
