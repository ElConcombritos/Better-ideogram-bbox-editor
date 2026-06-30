import { useMemo, useRef, useState } from 'react';
import { buildJSON } from '../store';
import { runComfyWorkflow } from '../comfyApi';

const STORAGE_KEY = 'ideogram-bbox-comfy-settings';

const DEFAULT_SETTINGS = {
  baseUrl: '/comfy',
  promptNodeId: '98:24',
  seedNodeId: '98:18',
  filenameNodeId: '158',
  filenamePrefix: 'bbox_editor',
  workflowText: '',
};

function unwrapWorkflow(parsed) {
  return parsed?.prompt && typeof parsed.prompt === 'object' ? parsed.prompt : parsed;
}

function findTextNodes(workflow) {
  return Object.entries(workflow || {})
    .filter(([, node]) => node?.inputs && typeof node.inputs === 'object' && 'text' in node.inputs)
    .map(([id, node]) => ({
      id,
      classType: node.class_type || 'Unknown',
      title: node._meta?.title || '',
      text: String(node.inputs.text || ''),
    }));
}

function pickPromptNodeId(workflow, preferredId) {
  const nodes = findTextNodes(workflow);
  if (nodes.some(node => node.id === preferredId)) return preferredId;

  const positive = nodes.find(node =>
    /cliptextencode/i.test(node.classType) &&
    /positive|prompt/i.test(`${node.title} ${node.text}`)
  );
  if (positive) return positive.id;

  const clip = nodes.find(node => /cliptextencode/i.test(node.classType));
  return clip?.id || nodes[0]?.id || '';
}

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const settings = { ...DEFAULT_SETTINGS, ...saved };
    if (settings.baseUrl === 'http://127.0.0.1:8188' || settings.baseUrl === 'http://localhost:8188') {
      settings.baseUrl = '/comfy';
    }
    return settings;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function cloneWithCaption(workflowText, caption, settings) {
  const workflow = unwrapWorkflow(JSON.parse(workflowText));
  const promptNodeId = pickPromptNodeId(workflow, settings.promptNodeId);
  const promptNode = workflow[promptNodeId];

  if (!promptNode?.inputs || !('text' in promptNode.inputs)) {
    const candidates = findTextNodes(workflow).map(node => `${node.id} (${node.classType})`).join(', ');
    throw new Error(
      candidates
        ? `Node ${settings.promptNodeId} has no inputs.text field. Try one of: ${candidates}`
        : 'No node with inputs.text found. Make sure you loaded the ComfyUI API Format JSON, not the UI workflow JSON.'
    );
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
  const [textNodes, setTextNodes] = useState(() => {
    if (!loadSettings().workflowText) return [];
    try {
      return findTextNodes(unwrapWorkflow(JSON.parse(loadSettings().workflowText)));
    } catch {
      return [];
    }
  });
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
        const workflow = unwrapWorkflow(JSON.parse(text));
        const detectedTextNodes = findTextNodes(workflow);
        const promptNodeId = pickPromptNodeId(workflow, settings.promptNodeId);

        setSettings(current => {
          const next = { ...current, workflowText: text, promptNodeId: promptNodeId || current.promptNodeId };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          return next;
        });
        setTextNodes(detectedTextNodes);
        setMessage(
          promptNodeId
            ? `Workflow loaded: ${file.name}. Prompt node: ${promptNodeId}`
            : `Workflow loaded: ${file.name}, but no text node was detected.`
        );
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
            list="comfy-text-node-options"
            placeholder="98:24"
          />
          <datalist id="comfy-text-node-options">
            {textNodes.map(node => (
              <option
                key={node.id}
                value={node.id}
                label={`${node.classType}${node.title ? ` - ${node.title}` : ''}`}
              />
            ))}
          </datalist>
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
