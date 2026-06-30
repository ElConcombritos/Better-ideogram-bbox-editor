const DEFAULT_TIMEOUT_MS = 180000;
const POLL_INTERVAL_MS = 1000;

function trimBaseUrl(baseUrl) {
  return (baseUrl || '').trim().replace(/\/+$/, '');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function findFirstImage(outputs) {
  for (const output of Object.values(outputs || {})) {
    if (output?.images?.length) return output.images[0];
  }
  return null;
}

export function buildImageUrl(baseUrl, image) {
  const params = new URLSearchParams({
    filename: image.filename,
    subfolder: image.subfolder || '',
    type: image.type || 'output',
  });
  return `${trimBaseUrl(baseUrl)}/view?${params.toString()}`;
}

export async function queueComfyPrompt({ baseUrl, workflow, clientId = 'bbox-editor' }) {
  const response = await fetch(`${trimBaseUrl(baseUrl)}/prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: workflow, client_id: clientId }),
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message = body?.error?.message || body?.error || response.statusText;
    throw new Error(`ComfyUI refused the prompt: ${message}`);
  }
  if (!body?.prompt_id) throw new Error('ComfyUI did not return a prompt_id.');

  return body.prompt_id;
}

export async function waitForComfyImage({ baseUrl, promptId, timeoutMs = DEFAULT_TIMEOUT_MS }) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const response = await fetch(`${trimBaseUrl(baseUrl)}/history/${encodeURIComponent(promptId)}`);
    const history = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(`Could not read ComfyUI history: ${response.statusText}`);
    }

    const result = history?.[promptId];
    if (result) {
      if (result.status?.status_str === 'error') {
        throw new Error('ComfyUI generation failed.');
      }

      const image = findFirstImage(result.outputs);
      if (image) {
        return {
          image,
          imageUrl: buildImageUrl(baseUrl, image),
          result,
        };
      }
    }

    await sleep(POLL_INTERVAL_MS);
  }

  throw new Error('Timed out while waiting for ComfyUI.');
}

export async function runComfyWorkflow({ baseUrl, workflow, clientId }) {
  const promptId = await queueComfyPrompt({ baseUrl, workflow, clientId });
  const imageResult = await waitForComfyImage({ baseUrl, promptId });
  return { promptId, ...imageResult };
}
