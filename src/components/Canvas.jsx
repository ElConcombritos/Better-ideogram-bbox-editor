import { useRef, useState, useEffect, useCallback } from 'react';
import { useStore, ASPECT_RATIOS } from '../store';

const MIN_SIZE = 8;
const HS = 5;
const HANDLES = ['nw','n','ne','e','se','s','sw','w'];
const SNAP = 20; // grid snap in canvas units

function getHandlePos({ x, y, w, h }, pos) {
  const cx = x + w / 2, cy = y + h / 2;
  switch (pos) {
    case 'nw': return [x,     y    ];
    case 'n':  return [cx,    y    ];
    case 'ne': return [x + w, y    ];
    case 'e':  return [x + w, cy   ];
    case 'se': return [x + w, y + h];
    case 's':  return [cx,    y + h];
    case 'sw': return [x,     y + h];
    case 'w':  return [x,     cy   ];
    default:   return [cx,    cy   ];
  }
}

function resizeBbox(orig, handle, dx, dy) {
  let { x, y, w, h } = orig;
  if (handle.includes('n')) { y += dy; h -= dy; }
  if (handle.includes('s')) { h += dy; }
  if (handle.includes('w')) { x += dx; w -= dx; }
  if (handle.includes('e')) { w += dx; }
  if (w < 0) { x += w; w = -w; }
  if (h < 0) { y += h; h = -h; }
  return { x, y, w: Math.max(MIN_SIZE, w), h: Math.max(MIN_SIZE, h) };
}

function snapVal(v) { return Math.round(v / SNAP) * SNAP; }

export default function Canvas({ snapEnabled, magicLoading }) {
  const { state, dispatch } = useStore();
  const { elements, selectedId, mode, aspectRatio } = state;
  const { w: CW, h: CH } = ASPECT_RATIOS[aspectRatio];

  const svgRef = useRef(null);
  const [drawing, setDrawing]   = useState(null);
  const [dragging, setDragging] = useState(null);
  const [resizing, setResizing] = useState(null);
  const [tooltip, setTooltip]   = useState(null);
  const [zoom, setZoom]         = useState(1);
  const [zoomVisible, setZoomVisible] = useState(false);
  const zoomTimer = useRef(null);

  // Show zoom indicator briefly
  const showZoom = useCallback(() => {
    setZoomVisible(true);
    clearTimeout(zoomTimer.current);
    zoomTimer.current = setTimeout(() => setZoomVisible(false), 1200);
  }, []);

  // Ctrl+scroll zoom
  useEffect(() => {
    const onWheel = (e) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      setZoom(z => Math.min(3, Math.max(0.3, z - e.deltaY * 0.001)));
      showZoom();
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => window.removeEventListener('wheel', onWheel);
  }, [showZoom]);

  const toSVG = useCallback((clientX, clientY) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const sx = CW / rect.width;
    const sy = CH / rect.height;
    return {
      x: Math.max(0, Math.min(CW, (clientX - rect.left) * sx)),
      y: Math.max(0, Math.min(CH, (clientY - rect.top)  * sy)),
    };
  }, [CW, CH]);

  const getPoint = useCallback((e) => {
    const src = e.touches ? e.touches[0] : e;
    let p = toSVG(src.clientX, src.clientY);
    if (snapEnabled) { p.x = snapVal(p.x); p.y = snapVal(p.y); }
    return p;
  }, [toSVG, snapEnabled]);

  const onBgDown = useCallback((e) => {
    if (mode !== 'draw') { dispatch({ type: 'SELECT', id: null }); return; }
    e.preventDefault();
    const p = getPoint(e);
    setDrawing({ x0: p.x, y0: p.y, x1: p.x, y1: p.y });
  }, [mode, dispatch, getPoint]);

  const onElemDown = useCallback((e, id) => {
    if (mode !== 'select') return;
    e.preventDefault(); e.stopPropagation();
    dispatch({ type: 'SELECT', id });
    const p = getPoint(e);
    const el = elements.find(el => el.id === id);
    setDragging({ id, ox: p.x - el.bbox.x, oy: p.y - el.bbox.y, startBbox: el.bbox });
  }, [mode, elements, dispatch, getPoint]);

  const onHandleDown = useCallback((e, id, handle) => {
    e.preventDefault(); e.stopPropagation();
    const p = getPoint(e);
    const el = elements.find(el => el.id === id);
    setResizing({ id, handle, startBbox: el.bbox, ox: p.x, oy: p.y });
  }, [elements, getPoint]);

  const onMove = useCallback((e) => {
    const p = getPoint(e);
    if (drawing) {
      setDrawing(d => ({ ...d, x1: p.x, y1: p.y }));
      const x = Math.min(drawing.x0, p.x), y = Math.min(drawing.y0, p.y);
      const w = Math.abs(p.x - drawing.x0),  h = Math.abs(p.y - drawing.y0);
      const yn  = Math.round((y / CH) * 1000),    xn  = Math.round((x / CW) * 1000);
      const yn2 = Math.round(((y+h) / CH) * 1000), xn2 = Math.round(((x+w) / CW) * 1000);
      setTooltip({ x: p.x, y: p.y, text: `[${yn}, ${xn}, ${yn2}, ${xn2}]` });
    }
    if (dragging) {
      const newX = Math.max(0, Math.min(CW - dragging.startBbox.w, p.x - dragging.ox));
      const newY = Math.max(0, Math.min(CH - dragging.startBbox.h, p.y - dragging.oy));
      dispatch({ type: 'UPDATE_ELEMENT', id: dragging.id, patch: { bbox: { ...dragging.startBbox, x: newX, y: newY } } });
    }
    if (resizing) {
      const dx = p.x - resizing.ox, dy = p.y - resizing.oy;
      dispatch({ type: 'UPDATE_ELEMENT', id: resizing.id, patch: { bbox: resizeBbox(resizing.startBbox, resizing.handle, dx, dy) } });
    }
  }, [drawing, dragging, resizing, dispatch, getPoint, CW, CH]);

  const onUp = useCallback(() => {
    if (drawing) {
      const x = Math.min(drawing.x0, drawing.x1), y = Math.min(drawing.y0, drawing.y1);
      const w = Math.abs(drawing.x1 - drawing.x0), h = Math.abs(drawing.y1 - drawing.y0);
      if (w >= MIN_SIZE && h >= MIN_SIZE) dispatch({ type: 'ADD_ELEMENT', bbox: { x, y, w, h } });
    }
    setDrawing(null); setDragging(null); setResizing(null); setTooltip(null);
  }, [drawing, dispatch]);

  useEffect(() => {
    const opts = { passive: false };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
    window.addEventListener('touchmove', onMove, opts);
    window.addEventListener('touchend',  onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend',  onUp);
    };
  }, [onMove, onUp]);

  // Snap grid lines
  const gridLines = [];
  if (snapEnabled) {
    for (let x = SNAP; x < CW; x += SNAP)
      gridLines.push(<line key={`v${x}`} className="snap-grid-line" x1={x} y1={0} x2={x} y2={CH} />);
    for (let y = SNAP; y < CH; y += SNAP)
      gridLines.push(<line key={`h${y}`} className="snap-grid-line" x1={0} y1={y} x2={CW} y2={y} />);
  }

  // Draw preview
  let drawPreview = null;
  if (drawing) {
    const x = Math.min(drawing.x0, drawing.x1), y = Math.min(drawing.y0, drawing.y1);
    drawPreview = (
      <rect
        className="draw-preview"
        x={x} y={y}
        width={Math.abs(drawing.x1 - drawing.x0)}
        height={Math.abs(drawing.y1 - drawing.y0)}
      />
    );
  }

  // Canvas display dimensions — maintain aspect ratio, fit in container
  const displayW = CW;
  const displayH = CH;

  return (
    <div className="canvas-area">
      <div className="canvas-zoom-wrap" style={{ transform: `scale(${zoom})` }}>
        <div className={`canvas-wrapper mode-${mode}`} style={{ width: displayW, height: displayH }}>
          <svg
            ref={svgRef}
            width={displayW}
            height={displayH}
            viewBox={`0 0 ${CW} ${CH}`}
            style={{ display: 'block', background: '#ffffff' }}
            onMouseDown={onBgDown}
            onTouchStart={onBgDown}
          >
            {gridLines}

            {elements.map((el, idx) => {
              if (!el.bbox) return null;
              const { id, type, bbox, desc } = el;
              const { x, y, w, h } = bbox;
              const isSel = selectedId === id;
              const typeClass = `type-${type}`;

              return (
                <g key={id}>
                  <rect
                    className={`bbox-rect ${typeClass}${isSel ? ' selected' : ''}`}
                    x={x} y={y} width={w} height={h}
                    onMouseDown={(e) => onElemDown(e, id)}
                    onTouchStart={(e) => onElemDown(e, id)}
                  />

                  {/* Index badge */}
                  <rect
                    className={`elem-index-bg ${typeClass}`}
                    x={x + 4} y={y + 4}
                    width={16} height={14}
                    rx={3}
                  />
                  <text
                    className={`elem-index-text ${typeClass}`}
                    x={x + 12} y={y + 14}
                    textAnchor="middle"
                  >
                    {idx + 1}
                  </text>

                  {/* Resize handles on selection */}
                  {isSel && HANDLES.map(handle => {
                    const [hx, hy] = getHandlePos({ x, y, w, h }, handle);
                    return (
                      <rect
                        key={handle}
                        className={`resize-handle ${handle}`}
                        x={hx - HS} y={hy - HS}
                        width={HS * 2} height={HS * 2}
                        rx={2}
                        onMouseDown={(e) => onHandleDown(e, id, handle)}
                        onTouchStart={(e) => onHandleDown(e, id, handle)}
                      />
                    );
                  })}
                </g>
              );
            })}

            {drawPreview}
          </svg>

          {/* Bbox tooltip */}
          {tooltip && (
            <div
              className="bbox-tooltip"
              style={{
                left: Math.min(tooltip.x + 12, CW - 180),
                top:  Math.max(tooltip.y - 32, 4),
              }}
            >
              {tooltip.text}
            </div>
          )}

          {/* Magic prompt overlay */}
          {magicLoading && (
            <div className="canvas-magic-overlay">
              <div className="magic-spinner" />
              <div className="magic-label">Expanding prompt…</div>
              <div className="magic-sublabel">gemma4:e2b via Ollama</div>
            </div>
          )}
        </div>
      </div>

      {/* Zoom indicator */}
      <div className={`zoom-indicator${zoomVisible ? ' visible' : ''}`}>
        <button
          className="btn btn-ghost"
          style={{ padding: '1px 6px', fontSize: 11 }}
          onClick={() => { setZoom(z => Math.max(0.3, z - 0.1)); showZoom(); }}
        >−</button>
        {Math.round(zoom * 100)}%
        <button
          className="btn btn-ghost"
          style={{ padding: '1px 6px', fontSize: 11 }}
          onClick={() => { setZoom(z => Math.min(3, z + 0.1)); showZoom(); }}
        >+</button>
        <button
          className="btn btn-ghost"
          style={{ padding: '1px 6px', fontSize: 11 }}
          onClick={() => { setZoom(1); showZoom(); }}
        >reset</button>
      </div>
    </div>
  );
}
