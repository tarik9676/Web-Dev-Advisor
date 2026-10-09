import { useCallback, useEffect, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Loader2 } from 'lucide-react';
import { invoicesApi } from '../../api/invoices';
import { currencyValue, formatDate } from '../../utils/helpers';
import { SkeletonTable } from '../../components/Skeleton.jsx';
import ErrorState from '../../components/ErrorState.jsx';
import { useApp } from '../../context/AppContext.jsx';
import Header from '../../components/Header.jsx';

const STATUS_LABELS = {
  draft: 'Draft',
  sent: 'Sent',
  paid: 'Paid',
  overdue: 'Overdue',
  void: 'Void',
};

function statusBadgeClass(status) {
  if (status === 'paid') return '';
  if (status === 'draft') return 'draft';
  if (status === 'void') return 'archived';
  return '';
}

function GrowthIndicator({ growth }) {
  if (!growth) return null;
  const pct = growth.percent;
  const isUp = pct > 0;
  const isFlat = pct === 0;
  return (
    <div className={`growth-indicator${isUp ? ' is-up' : isFlat ? ' is-flat' : ' is-down'}`}>
      {isUp ? <ArrowUpRight size={16} /> : isFlat ? <span style={{ fontSize: 14 }}>−</span> : <ArrowDownRight size={16} />}
      <div>
        <strong>{pct !== null ? `${pct > 0 ? '+' : ''}${pct}%` : '—'}</strong>
        <small>{growth.current_label} vs {growth.previous_label}</small>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const { projectId, projects, selectProject, loadProject } = useApp();
  const project = projects.find((item) => String(item.id) === String(projectId)) || projects[0];
  const [analytics, setAnalytics] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleProjectChange = (event) => {
    const id = event.target.value;
    selectProject(id);
    loadProject(id);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [analyticsData, ordersData] = await Promise.all([
        invoicesApi.getAnalytics(),
        invoicesApi.getAllAcrossProjects(),
      ]);
      setAnalytics(analyticsData);
      setOrders(ordersData.results || ordersData);
    } catch (caught) {
      setError(caught);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (error) return <ErrorState message="Failed to load orders" onRetry={load} />;
  if (loading || !analytics) {
    return (
      <div className="page">
        <div className="page-heading">
          <div>
            <span className="eyebrow">Billing</span>
            <h1>Orders</h1>
            <p>Observe income and growth across every project</p>
          </div>
        </div>
        <SkeletonTable rows={8} />
      </div>
    );
  }

  const totals = analytics.totals || {};

  return (
    <div className="page orders-page">
      <Header project={project} onProjectChange={handleProjectChange} projects={projects} />
      <div className="page-heading">
        <div>
          <span className="eyebrow">Billing</span>
          <h1>Orders</h1>
          <p>Observe income and growth across every project</p>
        </div>
      </div>

      <section className="analytics-band" aria-label="Billing analytics">
        <div className="analytics-card">
          <span>Invoiced</span>
          <strong>{currencyValue(totals.invoiced, totals.currency)}</strong>
          <small>{totals.invoice_count} invoices</small>
        </div>
        <div className="analytics-card">
          <span>Paid</span>
          <strong>{currencyValue(totals.paid, totals.currency)}</strong>
          <small>{totals.paid_count} payments</small>
        </div>
        <div className="analytics-card">
          <span>Outstanding</span>
          <strong className="danger-text">{currencyValue(totals.outstanding, totals.currency)}</strong>
          <small>awaiting payment</small>
        </div>
        <div className="analytics-card analytics-growth">
          <span>Growth</span>
          <GrowthIndicator growth={analytics.growth} />
        </div>
      </section>

      <section className="panel table-panel">
        <div className="panel-heading">
          <div>
            <span>All orders</span>
            <small>Across every project you can see</small>
          </div>
          <span className="panel-count">{orders.length}</span>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Project</th>
                <th>Label</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Due</th>
                <th>Paid</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 && (
                <tr>
                  <td colSpan={7} className="state-panel">No invoices found.</td>
                </tr>
              )}
              {orders.map((order) => (
                <tr key={order.id}>
                  <td><strong>{order.invoice_number}</strong></td>
                  <td>{order.project_name || '—'}</td>
                  <td>{order.label || '—'}</td>
                  <td className="mono">{currencyValue(order.amount, order.currency)}</td>
                  <td>
                    <span className={`status-badge ${statusBadgeClass(order.status)}`}>
                      {STATUS_LABELS[order.status] || order.status}
                    </span>
                  </td>
                  <td>{formatDate(order.due_date)}</td>
                  <td>{formatDate(order.paid_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
