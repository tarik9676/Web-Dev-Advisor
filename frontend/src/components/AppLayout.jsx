import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { FolderOpen } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import Layout from './Layout.jsx';
import Sidebar from './Sidebar.jsx';
import Toast from './Toast.jsx';

export default function AppLayout() {
  const { projectId, audience, selectProject, loadProjects, loadProject } = useApp();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/app/admin');
  const isProjectRoute = location.pathname.startsWith('/app/projects');
  const isBillingRoute = location.pathname.startsWith('/app/billing');
  const isOrdersRoute = location.pathname.startsWith('/app/orders');
  // Routes that manage the catalog, projects, orders, or invoices are not scoped to one
  // project, so they must not be replaced by the "no project access" empty state.
  const isUnscopedRoute = isAdminRoute || isProjectRoute || isBillingRoute || isOrdersRoute;
  // The topbar carries the project switcher and audience toggle. It is hidden
  // only on catalog admin routes; every other /app surface shows it.
  const isDeliveryRoute = !isAdminRoute;
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    let active = true;
    loadProjects()
      .then((items) => {
        if (!active) return;
        setProjects(items);
        setLoadError(null);
        const requested = new URLSearchParams(window.location.search).get('project');
        const nextId = requested || items[0]?.id;
        if (nextId) {
          selectProject(nextId);
          loadProject(nextId);
        }
      })
      .catch(() => {
        if (active) setLoadError('Could not load your projects.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [loadProjects, loadProject, selectProject]);

  useEffect(() => {
    if (projectId) loadProject(projectId);
  }, [projectId, audience, loadProject]);

  const project = projects.find((item) => String(item.id) === String(projectId)) || projects[0];
  const handleProjectChange = (event) => {
    const id = event.target.value;
    selectProject(id);
    loadProject(id);
    navigate(`/app/dashboard?project=${id}`);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  const noAccess = !isUnscopedRoute && !loading && !loadError && projects.length === 0;

  return (
    <Layout>
      <div className="app-body">
        <Sidebar user={user} onSignOut={handleSignOut} />
        <main className={isAdminRoute ? 'app-main is-full-bleed' : 'app-main'}>
          {noAccess ? (
            <NoProjectAccess user={user} />
          ) : (
            <Outlet />
          )}
        </main>
      </div>
      <Toast />
    </Layout>
  );
}

function NoProjectAccess({ user }) {
  return (
    <div className="no-access">
      <span className="no-access-mark"><FolderOpen size={22} strokeWidth={1.6} /></span>
      <h1>No project access yet</h1>
      <p>
        {user?.full_name || user?.username || 'Your account'} is signed in, but no delivery project has been
        shared with it yet. A project owner has to add you before workstreams, tasks, and approvals appear here.
      </p>
      <div className="no-access-actions">
        <a className="button secondary" href="/contact">Request access</a>
        <a className="button primary" href="/services">View our services</a>
      </div>
    </div>
  );
}
