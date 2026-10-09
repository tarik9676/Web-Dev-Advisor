import { useCallback, useEffect, useState } from 'react';
import { Loader2, Plus, Send, Ban, Copy, Receipt } from 'lucide-react';
import { invoicesApi } from '../../api/invoices';
import { projectsApi } from '../../api/projects';
import { api } from '../../api/client';
import { currencyValue, formatDate } from '../../utils/helpers';
import { useApp } from '../../context/AppContext.jsx';
import Header from '../../components/Header.jsx';
import DatePicker from '../../components/DatePicker.jsx';

const EMPTY_INVOICE = {
  label: '',
  description: '',
  amount: '',
  currency: 'USD',
  due_date: '',
  client_email: '',
  milestone: '',
};

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

function InvoiceRow({ invoice, onSend, onVoid, busy }) {
  const canSend = invoice.status === 'draft' || invoice.status === 'overdue';
  const canVoid = invoice.status !== 'paid' && invoice.status !== 'void';
  return (
    <tr>
      <td>
        <strong>{invoice.invoice_number}</strong>
        <br />
        <small>{invoice.label}</small>
      </td>
      <td>{invoice.milestone_name || '—'}</td>
      <td className="mono">{currencyValue(invoice.amount, invoice.currency)}</td>
      <td>
        <span className={`status-badge ${statusBadgeClass(invoice.status)}`}>
          {STATUS_LABELS[invoice.status] || invoice.status}
        </span>
      </td>
      <td>{formatDate(invoice.due_date)}</td>
      <td>{invoice.paid_at ? formatDate(invoice.paid_at) : '—'}</td>
      <td>
        <div className="inline-actions">
          {canSend && (
            <button className="button secondary" onClick={() => onSend(invoice)} disabled={busy} title="Create payment link" type="button">
              <Send size={14} />
            </button>
          )}
          {canVoid && (
            <button className="button secondary danger" onClick={() => onVoid(invoice)} disabled={busy} title="Void invoice" type="button">
              <Ban size={14} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function BillingPage() {
  const { projectId: contextProjectId, projects, selectProject, loadProject } = useApp();
  const project = projects.find((item) => String(item.id) === String(contextProjectId)) || projects[0];
  const [projectsList, setProjectsList] = useState([]);
  const [projectId, setProjectId] = useState(null);
  const [summary, setSummary] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [draft, setDraft] = useState(EMPTY_INVOICE);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [checkoutLink, setCheckoutLink] = useState(null);

  useEffect(() => {
    let active = true;
    projectsApi.getAll({})
      .then((items) => {
        if (!active) return;
        setProjectsList(items);
        if (items.length) setProjectId(String(items[0].id));
        else setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message);
        setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const handleProjectChange = (event) => {
    const id = event.target.value;
    setProjectId(id);
    loadBilling(id);
  };

  const loadBilling = useCallback(async (id) => {
    if (!id) return;
    setError(null);
    try {
      const [rows, totals] = await Promise.all([
        invoicesApi.getAll(id),
        invoicesApi.getBillingSummary(id),
      ]);
      setInvoices(rows);
      setSummary(totals);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMilestones = useCallback(async (id) => {
    if (!id) return;
    try {
      const data = await api.get(`/projects/${id}/milestones/`);
      setMilestones(data.results || data);
    } catch {
      setMilestones([]);
    }
  }, []);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    setCheckoutLink(null);
    loadBilling(projectId);
    loadMilestones(projectId);
  }, [projectId, loadBilling, loadMilestones]);

  const handleCreate = async () => {
    if (!draft.label.trim()) {
      setError('An invoice label is required.');
      return;
    }
    if (!draft.amount || Number(draft.amount) <= 0) {
      setError('Amount must be greater than zero.');
      return;
    }
    setBusyId('new');
    setError(null);
    try {
      await invoicesApi.create(projectId, {
        label: draft.label,
        description: draft.description,
        amount: draft.amount,
        currency: draft.currency || 'USD',
        due_date: draft.due_date || null,
        client_email: draft.client_email,
        milestone: draft.milestone || null,
      });
      setDraft(EMPTY_INVOICE);
      await loadBilling(projectId);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleSend = async (invoice) => {
    setBusyId(invoice.id);
    setError(null);
    setNotice(null);
    setCheckoutLink(null);
    try {
      const result = await invoicesApi.send(projectId, invoice.id);
      setCheckoutLink({ invoice, url: result.checkout_url });
      setNotice(`${result.invoice.invoice_number} is ready to pay.`);
      await loadBilling(projectId);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleVoid = async (invoice) => {
    if (!confirm(`Void ${invoice.invoice_number}? It stops being owed.`)) return;
    setBusyId(invoice.id);
    setError(null);
    try {
      await invoicesApi.void(projectId, invoice.id);
      await loadBilling(projectId);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(checkoutLink.url);
      setNotice('Payment link copied.');
    } catch {
      setNotice('Copy failed — select the link manually.');
    }
  };

  if (loading) {
    return (
      <div className="page billing-page">
        <div className="skeleton-table">
          <div className="skeleton-row">
            <span /><span /><span /><span /><span /><span />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page billing-page">
      <Header project={project} onProjectChange={handleProjectChange} projects={projects} />
      <div className="page-heading">
        <div>
          <span className="eyebrow">Billing</span>
          <h1>Invoices</h1>
          <p>Issue milestone installments, send a payment link, and track what has landed</p>
        </div>
        <select value={projectId || ''} onChange={(e) => setProjectId(e.target.value)}>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.client_name} — {project.project_name}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="toast toast-error">{error}</div>}
      {notice && <div className="toast">{notice}</div>}

      {summary && (
        <div className="panel table-panel">
          <div className="panel-heading">
            <div>
              <span>Position</span>
              <small>Paid and outstanding across every non-void invoice</small>
            </div>
          </div>
          <div className="form-grid">
            <label><span>Budget</span><p>{currencyValue(summary.budget, summary.currency)}</p></label>
            <label><span>Invoiced</span><p>{currencyValue(summary.invoiced, summary.currency)}</p></label>
            <label><span>Paid</span><p>{currencyValue(summary.paid, summary.currency)}</p></label>
            <label><span>Outstanding</span><p>{currencyValue(summary.outstanding, summary.currency)}</p></label>
          </div>
        </div>
      )}

      {checkoutLink && (
        <div className="panel meta-panel">
          <div className="panel-heading">
            <div>
              <strong>Payment link for {checkoutLink.invoice.invoice_number}</strong>
              <small>Send this to the client. Paid status flips from the Stripe webhook, not from a click.</small>
            </div>
            <button className="button secondary" onClick={handleCopyLink} type="button">
              <Copy size={14} /> Copy link
            </button>
          </div>
          <div className="meta-panel-body">
            <a href={checkoutLink.url} target="_blank" rel="noreferrer" className="mono">{checkoutLink.url}</a>
          </div>
        </div>
      )}

      <div className="panel table-panel">
        <div className="panel-heading">
          <div>
            <span>Invoices</span>
            <small>One project, several payments</small>
          </div>
          <span className="panel-count">{invoices.length}</span>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Milestone</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Due</th>
                <th>Paid</th>
                <th style={{ width: '110px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <InvoiceRow
                  key={invoice.id}
                  invoice={invoice}
                  onSend={handleSend}
                  onVoid={handleVoid}
                  busy={busyId === invoice.id}
                />
              ))}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={7} className="state-panel">
                    No invoices yet. Issue a first installment below.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel meta-panel">
        <div className="panel-heading">
          <div>
            <strong>Issue an installment</strong>
            <small>Tie it to the milestone it unlocks so finance reads in delivery terms</small>
          </div>
        </div>
        <div className="meta-panel-body">
          <div className="form-grid">
            <label>
              <span>Label <em className="meta-required">*</em></span>
              <input
                type="text"
                value={draft.label}
                onChange={(e) => setDraft(prev => ({ ...prev, label: e.target.value }))}
                placeholder="Deposit — unlocks discovery"
              />
            </label>
            <label>
              <span>Amount <em className="meta-required">*</em></span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={draft.amount}
                onChange={(e) => setDraft(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="4000.00"
              />
            </label>
            <label>
              <span>Currency</span>
              <input
                type="text"
                maxLength={3}
                value={draft.currency}
                onChange={(e) => setDraft(prev => ({ ...prev, currency: e.target.value.toUpperCase() }))}
                placeholder="USD"
              />
            </label>
            <label>
              <span>Milestone</span>
              <select
                value={draft.milestone}
                onChange={(e) => setDraft(prev => ({ ...prev, milestone: e.target.value }))}
              >
                <option value="">None</option>
                {milestones.map((milestone) => (
                  <option key={milestone.id} value={milestone.id}>{milestone.name}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Client email</span>
              <input
                type="email"
                value={draft.client_email}
                onChange={(e) => setDraft(prev => ({ ...prev, client_email: e.target.value }))}
                placeholder="ap@client.com"
              />
            </label>
            <label>
              <span>Due date</span>
              <DatePicker value={draft.due_date} onChange={(val) => setDraft(prev => ({ ...prev, due_date: val }))} placeholder="Select due date" />
            </label>
            <label className="span-2">
              <span>Description</span>
              <textarea
                rows={2}
                value={draft.description}
                onChange={(e) => setDraft(prev => ({ ...prev, description: e.target.value }))}
                placeholder="What this installment covers."
              />
            </label>
          </div>
          <button className="button primary" onClick={handleCreate} disabled={busyId === 'new'} type="button">
            {busyId === 'new' ? <Loader2 size={14} className="spin" /> : <><Plus size={14} /> Issue Invoice</>}
          </button>
        </div>
      </div>

      <p className="muted" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        <Receipt size={14} /> Paid status is written only by a verified Stripe webhook. Voiding is the one status a human sets by hand.
      </p>
    </div>
  );
}