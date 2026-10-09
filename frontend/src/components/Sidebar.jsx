import { useEffect, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { BookOpen, Calendar, CheckSquare, ChevronUp, Grid2X2, Layers, LogOut, ShieldCheck, TriangleAlert, Database, Package, FolderKanban, PanelLeftClose, PanelLeftOpen, Receipt, ShoppingBag, Users } from 'lucide-react';
import { preferencesApi } from '../api/preferences.js';
import { useApp } from '../context/AppContext.jsx';

const NAV = [
  { to: '/app/projects', label: 'Projects', icon: FolderKanban },
  { to: '/app/dashboard', label: 'Dashboard', icon: Grid2X2 },
  { to: '/app/billing', label: 'Invoices', icon: Receipt },
  { to: '/app/plan', label: 'Plan', icon: Layers },
  { to: '/app/tasks', label: 'Tasks', icon: CheckSquare },
  { to: '/app/approvals', label: 'Approvals', icon: ShieldCheck },
  { to: '/app/risks', label: 'Risks', icon: TriangleAlert },
  { to: '/app/knowledge', label: 'Knowledge', icon: BookOpen },
  { to: '/app/milestones', label: 'Milestones', icon: Calendar },
];

const ADMIN_NAV = [
  { to: '/app/admin/services', label: 'Services', icon: Database },
  { to: '/app/admin/products', label: 'Products', icon: Package },
];

function initialsOf(user) {
  const name = user?.full_name || user?.username || '';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '—';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function Sidebar({ user, onSignOut }) {
  const { showToast } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('app:sidebar-collapsed') === '1';
  });
  const [controlOpen, setControlOpen] = useState(() => {
    if (typeof window === 'undefined') return true;
    const cached = window.localStorage.getItem('app:delivery-control-open');
    return cached !== null ? cached === '1' : true;
  });
  const menuRef = useRef(null);
  const isStaff = user?.is_staff;
  // In the icon rail the section toggle has no room, so the links
  // always show there regardless of the stored preference.
  const controlVisible = collapsed || controlOpen;

  useEffect(() => {
    window.localStorage.setItem('app:sidebar-collapsed', collapsed ? '1' : '0');
    document.documentElement.classList.toggle('sidebar-collapsed', collapsed);
  }, [collapsed]);

  useEffect(() => {
    window.localStorage.setItem('app:delivery-control-open', controlOpen ? '1' : '0');
  }, [controlOpen]);

  useEffect(() => {
    let active = true;
    preferencesApi.get()
      .then((prefs) => {
        if (!active) return;
        setControlOpen(!prefs.delivery_control_collapsed);
      })
      .catch(() => {
        // A failed read leaves the section expanded; nothing to persist yet.
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const handleClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false);
    };
    const handleKey = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [menuOpen]);

  const toggleControl = () => {
    const next = !controlOpen;
    setControlOpen(next);
    preferencesApi.update({ delivery_control_collapsed: !next })
      .catch(() => {
        // Revert the optimistic toggle so the UI never disagrees
        // with what the database actually stored.
        setControlOpen(controlOpen);
        showToast('Could not save the Delivery control layout.', 'error');
      });
  };

  const displayName = user?.full_name || user?.username || 'Signed in';

  return (
    <nav className={`sidebar${collapsed ? ' is-collapsed' : ''}`} aria-label="Main navigation">
      <Link to="/" className="sidebar-logo" aria-label="Web Dev Advisor — home" title="Web Dev Advisor — home">
        <span className="logo-mark" aria-hidden="true">WDA</span>
        {!collapsed && <span className="logo-text">Web Dev Advisor</span>}
      </Link>
      <button
        type="button"
        className="sidebar-collapse"
        onClick={() => setCollapsed((prev) => !prev)}
        aria-expanded={!collapsed}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
        {!collapsed && <span>Collapse</span>}
      </button>
      {isStaff && (
        <>
          <NavLink
            to="/app/orders"
            title="Orders"
            className={({ isActive }) => `sidebar-link${isActive ? ' is-active' : ''}`}
          >
            <ShoppingBag size={16} strokeWidth={1.8} />
            <span>Orders</span>
          </NavLink>
          <NavLink
            to="/app/clients"
            title="Clients"
            className={({ isActive }) => `sidebar-link${isActive ? ' is-active' : ''}`}
          >
            <Users size={16} strokeWidth={1.8} />
            <span>Clients</span>
          </NavLink>
        </>
      )}
      <button
        type="button"
        className="sidebar-section"
        onClick={toggleControl}
        aria-expanded={controlOpen}
        aria-controls="delivery-control-items"
        title={controlOpen ? 'Collapse delivery control' : 'Expand delivery control'}
      >
        <span className="sidebar-label">Delivery control</span>
        <ChevronUp size={13} className={controlOpen ? 'sidebar-caret is-open' : 'sidebar-caret'} aria-hidden="true" />
      </button>
      <div
        id="delivery-control-items"
        className={`sidebar-section-body${controlVisible ? '' : ' is-collapsed'}`}
      >
        <div className="sidebar-section-inner">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/app/dashboard'}
              title={collapsed ? label : undefined}
              className={({ isActive }) => `sidebar-link${isActive ? ' is-active' : ''}`}
            >
              <Icon size={16} strokeWidth={1.8} />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </div>
      {isStaff && (
        <>
          <div className="sidebar-label" style={{ marginTop: '8px' }}>Admin</div>
          {ADMIN_NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              title={collapsed ? label : undefined}
              className={({ isActive }) => `sidebar-link${isActive ? ' is-active' : ''}`}
            >
              <Icon size={16} strokeWidth={1.8} />
              <span>{label}</span>
            </NavLink>
          ))}
        </>
      )}
      <div className="sidebar-foot" title="Humans own outcomes">
        <span className="signal-dot" />
        {!collapsed && <span>Humans own outcomes</span>}
      </div>

      <div className="account" ref={menuRef}>
        {menuOpen && (
          <div className="account-menu" role="menu">
            <div className="account-menu-head">
              <strong>{displayName}</strong>
              {user?.email && <span>{user.email}</span>}
            </div>
            <button type="button" role="menuitem" className="account-menu-item" onClick={onSignOut}>
              <LogOut size={14} strokeWidth={1.8} />
              Sign out
            </button>
          </div>
        )}
        <button
          type="button"
          className="account-trigger"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          title={displayName}
        >
          <span className="account-avatar" aria-hidden="true">{initialsOf(user)}</span>
          {!collapsed && (
            <>
              <span className="account-name">{displayName}</span>
              <ChevronUp size={13} className={menuOpen ? 'account-caret is-open' : 'account-caret'} aria-hidden="true" />
            </>
          )}
        </button>
      </div>
    </nav>
  );
}
