import { useMemo, useState } from 'react';
import { useStore } from '../store';
import {
  clearProjectHistory,
  deleteProjectSnapshot,
  loadProjectHistory,
  makeProjectTitle,
  recordProjectSnapshot,
} from '../projectHistory';

function formatDate(value) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return '';
  }
}

export default function ProjectHistoryModal({ onClose }) {
  const { state, dispatch } = useStore();
  const [projects, setProjects] = useState(() => loadProjectHistory());
  const [name, setName] = useState(() => makeProjectTitle(state));
  const hasProjects = projects.length > 0;

  const stats = useMemo(() => ({
    elements: state.elements?.length || 0,
    ratio: state.aspectRatio,
  }), [state]);

  const refresh = () => setProjects(loadProjectHistory());

  const saveCurrent = () => {
    recordProjectSnapshot(state, 'manual', name.trim() || makeProjectTitle(state));
    refresh();
  };

  const load = (project) => {
    if (!window.confirm(`Load "${project.title}"? Current unsaved canvas changes stay in history snapshots.`)) return;
    dispatch({ type: 'LOAD_STATE', state: project.state });
    onClose();
  };

  const remove = (id) => {
    deleteProjectSnapshot(id);
    refresh();
  };

  const clear = () => {
    if (!window.confirm('Clear all saved project history?')) return;
    clearProjectHistory();
    refresh();
  };

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal project-modal">
        <div className="modal-header">
          <div>
            <div className="modal-title">Project History</div>
            <div className="modal-subtitle">Saved canvas snapshots and generated projects</div>
          </div>
          <button className="btn btn-ghost btn-icon" style={{ marginLeft: 12 }} onClick={onClose}>x</button>
        </div>

        <div className="modal-body project-history-body">
          <div className="project-save-row">
            <div className="project-save-meta">
              <div className="project-save-title">Current project</div>
              <div className="project-save-subtitle">{stats.elements} elements - {stats.ratio}</div>
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project name"
            />
            <button className="btn btn-accent" onClick={saveCurrent}>Save snapshot</button>
          </div>

          <div className="project-list-header">
            <span>{projects.length} snapshots</span>
            <button className="btn btn-ghost" onClick={clear} disabled={!hasProjects}>Clear</button>
          </div>

          {hasProjects ? (
            <div className="project-history-list">
              {projects.map(project => (
                <div key={project.id} className="project-history-item">
                  <div className="project-history-main" onClick={() => load(project)}>
                    <div className="project-history-title">{project.title}</div>
                    <div className="project-history-meta">
                      {project.aspectRatio} - {project.elementCount} elements - {formatDate(project.updatedAt)}
                    </div>
                  </div>
                  <button
                    className="btn btn-danger btn-icon"
                    title="Delete snapshot"
                    onClick={() => remove(project.id)}
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">H</div>
              <div className="empty-state-text">No saved snapshots yet. Create or generate something, then save the current project.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
