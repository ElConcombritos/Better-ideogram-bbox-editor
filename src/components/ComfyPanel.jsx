import { useMemo, useRef, useState } from 'react';
import { buildJSON } from '../store';
import { runComfyWorkflow } from '../comfyApi';

const STORAGE_KEY = 'ideogram-bbox-comfy-settings';

const DEFAULT_SETTINGS = {
  baseUrl: 'http://127.0.0.1:8188',
  promptNodeId: '98:24',
  seedNodeId: '98:18',
  filenameNodeId: '158',
  filenamePrefix: 'bbox_editor',
  workflowText: '',
};

function loadSettings() {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function cloneWithCaption(workflowText, caption, settings) {
  const workflow = JSON.parse(workflowText);
  const promptNode = workflow[settings.promptNodeId];

  if (!promptNode?.inputs || !('text' in promptNode.inputs)) {
    throw new Error(`Node ${settings.promptNodeId} must have an inputs.text field.`);
  }

  promptNode.inputs.text = JSON.stringify(caption);

  const seedNode = workflow[settings.seedNodeId];
  if (seedNode?.inputs && 'noise_seed' in seedNode.inputs) {
    seedNode.inputs.noise_seed = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
  }

  const filenameNode = workflow[settings.filenameNodeId];
  if (filenameNode?.inputs && 'filename_prefix' in filenameNode.inputs && settings.filenamePrefix.trim()) {
    filenameNode.inputs.filename_prefix = settings.filenamePrefix.trim();
  }

  return workflow;
}

export default function ComfyPanel({ state }) {
  const [settings, setSettings] = useState(loadSettings);
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [promptId, setPromptId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const workflowInputRef = useRef(null);

  const hasWorkflow = settings.workflowText.trim().length > 0;
  const canGenerate = hasWorkflow && settings.baseUrl.trim() && settings.promptNodeId.trim() && status !== 'running';

  const caption = useMemo(() => buildJSON(state), [state]);

  const updateSetting = (key, value) => {
    setSettings(current => {
      const next = { ...current, [key]: value };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const importWorkflow = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = String(ev.target.result || '');
        JSON.parse(text);
        updateSetting('workflowText', text);
        setMessage(`Workflow loaded: ${file.name}`);
      } catch (error) {
        setMessage(`Workflow import failed: ${error.message}`);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const generate = async () => {
    setStatus('running');
    setMessage('Queueing workflow in ComfyUI...');
    setImageUrl('');
    setPromptId('');

    try {
      const workflow = cloneWithCaption(settings.workflowText, caption, settings);
      const result = await runComfyWorkflow({
        baseUrl: settings.baseUrl,
        workflow,
        clientId: 'ideogram-bbox-editor',
      });

      setPromptId(result.promptId);
      setImageUrl(result.imageUrl);
      setMessage(`Done: ${result.image.filename}`);
      setStatus('done');
    } catch (error) {
      setMessage(error.message);
      setStatus('error');
    }
  };

  return (
    <div className="comfy-panel">
      <div className="comfy-panel-title">ComfyUI</div>

      <div className="field-group">
        <label className="field-label">Server URL</label>
        <input
          type="text"
          value={settings.baseUrl}
          onChange={(event) => updateSetting('baseUrl', event.target.value)}
          placeholder="http://127.0.0.1:8188"
        />
      </div>

      <div className="comfy-grid">
        <div className="field-group">
          <label className="field-label">Prompt node</label>
          <input
            type="text"
            value={settings.promptNodeId}
            onChange={(event) => updateSetting('promptNodeId', event.target.value)}
            placeholder="98:24"
          />
        </div>
        <div className="field-group">
          <label className="field-label">Seed node</label>
          <input
            type="text"
            value={settings.seedNodeId}
            onChange={(event) => updateSetting('seedNodeId', event.target.value)}
            placeholder="98:18"
          />
        </div>
      </div>

      <div className="field-group">
        <label className="field-label">Filename prefix</label>
        <input
          type="text"
          value={settings.filenamePrefix}
          onChange={(event) => updateSetting('filenamePrefix', event.target.value)}
          placeholder="bbox_editor"
        />
      </div>

      <div className="comfy-actions">
        <button
          className="btn btn-default"
          onClick={() => workflowInputRef.current?.click()}
          title="Load workflow API JSON exported from ComfyUI"
        >
          {hasWorkflow ? 'Replace workflow' : 'Load workflow'}
        </button>
        <button
          className="btn btn-accent"
          disabled={!canGenerate}
          onClick={generate}
          title="Send current JSON to ComfyUI"
        >
          {status === 'running' ? 'Generating...' : 'Generate'}
        </button>
        <input
          ref={workflowInputRef}
          type="file"
          accept=".json,application/json"
          style={{ display: 'none' }}
          onChange={importWorkflow}
        />
      </div>

      {message && (
        <div className={`comfy-message comfy-message-${status}`}>
          {message}
        </div>
      )}

      {promptId && (
        <div className="comfy-meta">
          Prompt ID: <span>{promptId}</span>
        </div>
      )}

      {imageUrl && (
        <a className="comfy-preview" href={imageUrl} target="_blank" rel="noreferrer">
          <img src={imageUrl} alt="Generated ComfyUI result" />
        </a>
      )}
    </div>
  );
}
