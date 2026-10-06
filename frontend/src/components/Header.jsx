import { useApp } from '../context/AppContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { projectName, projectCode } from '../utils/helpers.js';

export default function Header({ project, onProjectChange, projects }) {
  const { audience, setAudience } = useApp();
  const { user } = useAuth();
  return (
    <header className="topbar">
      <div className="topbar-left">
        {projects.length > 1 && (
          <select value={project?.id || ''} onChange={onProjectChange} aria-label="Select project" className="project-select">
            {projects.map((item) => <option key={item.id} value={item.id}>{projectName(item)}</option>)}
          </select>
        )}
        <span className="topbar-code">{projectCode(project)}</span>
      </div>
      {user?.is_staff && (
        <div className="audience-switch" aria-label="Audience">
          <span>Audience</span>
          <button className={audience === 'team' ? 'is-active' : ''} onClick={() => setAudience('team')} aria-pressed={audience === 'team'}>Team</button>
          <button className={audience === 'client' ? 'is-active' : ''} onClick={() => setAudience('client')} aria-pressed={audience === 'client'}>Client</button>
        </div>
      )}
    </header>
  );
}
