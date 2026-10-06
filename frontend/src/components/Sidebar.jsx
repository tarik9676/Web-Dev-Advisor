import { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { BookOpen, CheckSquare, ChevronUp, Grid2X2, Layers, LogOut, ShieldCheck, TriangleAlert, Database, Package, FolderKanban, PanelLeftClose, PanelLeftOpen, Receipt } from 'lucide-react';

const NAV = [
  { to: '/app/dashboard', label: 'Dashboard', icon: Grid2X2 },
  { to: '/app/plan', label: 'Plan', icon: Layers },
  { to: '/app/tasks', label: 'Tasks', icon: CheckSquare },
  { to: '/app/approvals', label: 'Approvals', icon: ShieldCheck },
  { to: '/app/risks', label: 'Risks', icon: TriangleAlert },
  { to: '/app/knowledge', label: 'Knowledge', icon: BookOpen },
];

const ADMIN_NAV = [
  { to: '/app/admin/services', label: 'Services', icon: Database },
  { to: '/app/admin/products', label: 'Products', icon: Package },
];

const PROJECT_NAV = [
  { to: '/app/projects', label: 'Projects', icon: FolderKanban },
  { to: '/app/billing', label: 'Invoices', icon: Receipt },
];

function initialsOf(user) {
  const name = user?.full_name || user?.username || '';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '—';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function Sidebar({ user, onSignOut }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('app:sidebar-collapsed') === '1';
  });
  const menuRef = useRef(null);
  const isStaff = user?.is_staff;

  useEffect(() => {
    window.localStorage.setItem('app:sidebar-collapsed', collapsed ? '1' : '0');
    document.documentElement.classList.toggle('sidebar-collapsed', collapsed);
  }, [collapsed]);

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

  const displayName = user?.full_name || user?.username || 'Signed in';

  return (
    <nav className={`sidebar${collapsed ? ' is-collapsed' : ''}`} aria-label="Main navigation">
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
      <div className="sidebar-label">Delivery control</div>
      {isStaff && PROJECT_NAV.map(({ to, label, icon: Icon }) => (
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
