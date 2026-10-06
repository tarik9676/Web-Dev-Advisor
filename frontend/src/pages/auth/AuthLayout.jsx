import { Link, Outlet } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

const PROMISES = [
  { title: 'Humans own outcomes', body: 'AI produces bounded deliverables. Every decision stays with a named person.' },
  { title: 'One source of truth', body: 'Plan, tasks, approvals, and risks stay in a single delivery record.' },
  { title: 'Approval gates built in', body: 'Client-facing, financial, security, and production decisions never auto-approve.' },
];

export default function AuthLayout() {
  return (
    <div className="auth-layout">
      <aside className="auth-aside">
        <Link to="/" className="logo" aria-label="Web Dev Advisor Home">
          <span className="logo-mark">WDA</span>
          <span className="logo-text">Web Dev Advisor</span>
        </Link>
        <div className="auth-aside-body">
          <p className="auth-aside-kicker">Delivery control for WooCommerce</p>
          <h1 className="auth-aside-title">Plan the work. Prove the outcome.</h1>
          <ul className="auth-aside-list">
            {PROMISES.map((item) => (
              <li key={item.title}>
                <ShieldCheck size={15} strokeWidth={1.8} aria-hidden="true" />
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.body}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <p className="auth-aside-foot">WooCommerce delivery planning for agencies and in-house teams.</p>
      </aside>

      <main className="auth-main">
        <div className="auth-card">
          <Link to="/" className="auth-back"><ArrowLeft size={13} /> Back to site</Link>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
