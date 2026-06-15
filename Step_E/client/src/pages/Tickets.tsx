import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Plus, PenLine, Trash2, Search, Wrench, AlertTriangle } from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import { api, Lookups } from '../lib/api';

interface TicketRow {
  id: number;
  issue: string;
  asset_name: string;
  technician_name: string;
  opened_at: string;
  resolved_at: string | null;
  urgency: string;
  status: string;
}

interface TicketForm {
  assetId: string;
  staffId: string;
  issue: string;
  openedAt: string;
  resolvedAt: string;
  urgency: string;
  status: string;
}

const emptyForm: TicketForm = {
  assetId: '',
  staffId: '',
  issue: '',
  openedAt: '',
  resolvedAt: '',
  urgency: 'Medium',
  status: 'Open',
};

const URGENCY_OPTIONS = ['Low', 'Medium', 'High', 'Urgent'];
const STATUS_OPTIONS = ['Open', 'In Progress', 'Resolved', 'Closed'];

function UrgencyPill({ urgency }: { urgency: string }) {
  const styles: Record<string, string> = {
    'Urgent': 'border-red-400/30 text-red-200/95 bg-red-400/[0.08]',
    'High': 'border-champagne-400/35 text-champagne-200 bg-champagne-400/[0.09]',
    'Medium': 'border-sky-400/25 text-sky-200/85 bg-sky-400/[0.06]',
  };
  return (
    <span className={`pill ${styles[urgency] ?? 'border-white/15 text-pearl/60 bg-white/[0.04]'}`}>
      {urgency}
    </span>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    'Open': 'border-emerald-400/25 text-emerald-200/90 bg-emerald-400/[0.07]',
    'In Progress': 'border-sky-400/25 text-sky-200/85 bg-sky-400/[0.06]',
    'Resolved': 'border-champagne-400/30 text-champagne-200 bg-champagne-400/[0.08]',
  };
  return (
    <span className={`pill ${styles[status] ?? 'border-white/15 text-pearl/60 bg-white/[0.04]'}`}>
      {status}
    </span>
  );
}

export default function Tickets() {
  const [rows, setRows] = useState<TicketRow[]>([]);
  const [lookups, setLookups] = useState<Lookups | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<TicketForm>(emptyForm);
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Update modal — strict Fetch-before-Update workflow
  const [updateOpen, setUpdateOpen] = useState(false);
  const [fetchId, setFetchId] = useState('');
  const [fetched, setFetched] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [updateForm, setUpdateForm] = useState<TicketForm>(emptyForm);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Delete confirmation modal — holds the row pending removal
  const [deleteTarget, setDeleteTarget] = useState<TicketRow | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [tickets, lk] = await Promise.all([
        api<TicketRow[]>('/api/tickets'),
        api<Lookups>('/api/lookups'),
      ]);
      setRows(tickets);
      setLookups(lk);
      setPageError(null);
    } catch (err) {
      setPageError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function openCreate() {
    setCreateForm({ ...emptyForm, openedAt: new Date().toISOString().slice(0, 10) });
    setCreateError(null);
    setCreateOpen(true);
  }

  function openUpdate() {
    setFetchId('');
    setFetched(false);
    setUpdateForm(emptyForm);
    setUpdateError(null);
    setUpdateOpen(true);
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      await api('/api/tickets', { method: 'POST', body: JSON.stringify(createForm) });
      setCreateOpen(false);
      await refresh();
    } catch (err) {
      setCreateError((err as Error).message);
    } finally {
      setCreating(false);
    }
  }

  /** Step 1 of the professor's workflow: fetch the record by its PK. */
  async function handleFetch() {
    if (!fetchId.trim()) {
      setUpdateError('Please enter a Ticket ID first.');
      return;
    }
    setFetching(true);
    setUpdateError(null);
    try {
      const rec = await api<{
        asset_id: number; staff_id: number; issue: string;
        opened_at: string; resolved_at: string | null; urgency: string; status: string;
      }>(`/api/tickets/${fetchId.trim()}`);
      setUpdateForm({
        assetId: String(rec.asset_id),
        staffId: String(rec.staff_id),
        issue: rec.issue,
        openedAt: rec.opened_at,
        resolvedAt: rec.resolved_at ?? '',
        urgency: rec.urgency,
        status: rec.status,
      });
      setFetched(true);
    } catch (err) {
      setFetched(false);
      setUpdateError((err as Error).message);
    } finally {
      setFetching(false);
    }
  }

  /** Step 2 of the workflow: save the modified values. */
  async function handleUpdate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setUpdateError(null);
    try {
      await api(`/api/tickets/${fetchId.trim()}`, { method: 'PUT', body: JSON.stringify(updateForm) });
      setUpdateOpen(false);
      await refresh();
    } catch (err) {
      setUpdateError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  /** Called by the confirmation modal — errors propagate so it can display them. */
  async function handleDelete() {
    if (!deleteTarget) return;
    await api(`/api/tickets/${deleteTarget.id}`, { method: 'DELETE' });
    setDeleteTarget(null);
    await refresh();
  }

  const formFields = (form: TicketForm, setForm: (f: TicketForm) => void) => (
    <div className="space-y-4">
      <div>
        <label className="label-luxe">Issue Description *</label>
        <input
          className="input-luxe"
          value={form.issue}
          onChange={(e) => setForm({ ...form, issue: e.target.value })}
          placeholder="e.g. Air conditioning unit leaking"
          required
        />
      </div>
      <div>
        <label className="label-luxe">Asset *</label>
        <select
          className="input-luxe"
          value={form.assetId}
          onChange={(e) => setForm({ ...form, assetId: e.target.value })}
          required
        >
          <option value="">Select an asset…</option>
          {lookups?.assets.map((a) => (
            <option key={a.id} value={a.id}>{a.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label-luxe">Assigned Technician *</label>
        <select
          className="input-luxe"
          value={form.staffId}
          onChange={(e) => setForm({ ...form, staffId: e.target.value })}
          required
        >
          <option value="">Select a technician…</option>
          {lookups?.staff.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label-luxe">Opened At *</label>
          <input
            type="date"
            className="input-luxe"
            value={form.openedAt}
            onChange={(e) => setForm({ ...form, openedAt: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="label-luxe">Resolved At</label>
          <input
            type="date"
            className="input-luxe"
            value={form.resolvedAt}
            onChange={(e) => setForm({ ...form, resolvedAt: e.target.value })}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label-luxe">Urgency *</label>
          <select
            className="input-luxe"
            value={form.urgency}
            onChange={(e) => setForm({ ...form, urgency: e.target.value })}
          >
            {URGENCY_OPTIONS.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label-luxe">Status *</label>
          <select
            className="input-luxe"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl">
      <header className="mb-10 animate-fade-up flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow mb-3">Service &amp; Maintenance · Live Records</p>
          <h2 className="font-display text-5xl font-medium text-pearl leading-tight">Tickets</h2>
          <div className="gold-divider mt-6 max-w-md" />
        </div>
        <div className="flex gap-3">
          <button className="btn-ghost" onClick={openUpdate}>
            <PenLine size={15} strokeWidth={1.5} />
            Update Record
          </button>
          <button className="btn-gold" onClick={openCreate}>
            <Plus size={15} strokeWidth={1.5} />
            Create New
          </button>
        </div>
      </header>

      {pageError && (
        <div className="glass rounded-2xl px-6 py-4 mb-8 border-red-400/20 flex items-center gap-3 animate-fade-up">
          <AlertTriangle size={17} strokeWidth={1.5} className="text-red-300/80 shrink-0" />
          <p className="text-sm text-red-200/90">{pageError}</p>
        </div>
      )}

      <div className="card-3d overflow-hidden animate-fade-up" style={{ animationDelay: '0.1s' }}>
        <div className="overflow-x-auto">
          <table className="table-luxe">
            <thead>
              <tr>
                <th>№</th>
                <th>Issue</th>
                <th>Asset</th>
                <th>Technician</th>
                <th>Opened</th>
                <th>Resolved</th>
                <th>Urgency</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={9} className="text-center py-14 text-pearl/35">
                    Consulting the registry…
                  </td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-16">
                    <Wrench size={22} strokeWidth={1.25} className="mx-auto text-champagne-300/50 mb-3" />
                    <p className="font-display text-xl text-pearl/60 italic">No maintenance tickets</p>
                    <p className="text-xs text-pearl/35 mt-1.5">All quiet across the estate.</p>
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="text-pearl/35 tabular-nums">{r.id}</td>
                  <td className="text-pearl font-normal max-w-xs truncate" title={r.issue}>{r.issue}</td>
                  <td>{r.asset_name}</td>
                  <td>{r.technician_name}</td>
                  <td className="tabular-nums">{r.opened_at}</td>
                  <td className="tabular-nums">{r.resolved_at ?? '—'}</td>
                  <td><UrgencyPill urgency={r.urgency} /></td>
                  <td><StatusPill status={r.status} /></td>
                  <td className="text-right">
                    <button
                      onClick={() => setDeleteTarget(r)}
                      className="rounded-lg p-2 text-pearl/30 hover:text-red-300 hover:bg-red-400/10 transition-all duration-300"
                      title="Delete ticket"
                    >
                      <Trash2 size={15} strokeWidth={1.5} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ---------- Create modal ---------- */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} eyebrow="New Entry" title="Create Ticket">
        <form onSubmit={handleCreate} className="space-y-6">
          {formFields(createForm, setCreateForm)}
          {createError && <p className="text-sm text-red-300/90">{createError}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-ghost" onClick={() => setCreateOpen(false)}>Cancel</button>
            <button type="submit" className="btn-gold" disabled={creating}>
              {creating ? 'Creating…' : 'Create Ticket'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ---------- Update modal — Fetch-before-Update ---------- */}
      <Modal open={updateOpen} onClose={() => setUpdateOpen(false)} eyebrow="Amend Entry" title="Update Ticket">
        <div className="space-y-6">
          {/* Step 1: enter the PK and fetch */}
          <div>
            <label className="label-luxe">Step 1 · Ticket ID</label>
            <div className="flex gap-3">
              <input
                className="input-luxe flex-1"
                value={fetchId}
                onChange={(e) => { setFetchId(e.target.value); setFetched(false); }}
                placeholder="Enter the primary key, e.g. 7"
                inputMode="numeric"
              />
              <button type="button" className="btn-gold shrink-0" onClick={handleFetch} disabled={fetching}>
                <Search size={15} strokeWidth={1.5} />
                {fetching ? 'Fetching…' : 'Fetch'}
              </button>
            </div>
          </div>

          {/* Step 2: form unlocks only after a successful fetch */}
          {fetched ? (
            <form onSubmit={handleUpdate} className="space-y-6 animate-fade-up">
              <div className="gold-divider" />
              <p className="eyebrow">Step 2 · Modify &amp; Save</p>
              {formFields(updateForm, setUpdateForm)}
              {updateError && <p className="text-sm text-red-300/90">{updateError}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" className="btn-ghost" onClick={() => setUpdateOpen(false)}>Cancel</button>
                <button type="submit" className="btn-gold" disabled={saving}>
                  {saving ? 'Saving…' : 'Save / Update'}
                </button>
              </div>
            </form>
          ) : (
            <>
              {updateError && <p className="text-sm text-red-300/90">{updateError}</p>}
              <p className="text-xs text-pearl/35 font-light italic">
                Enter a record's ID and press Fetch — the form will populate with its current values.
              </p>
            </>
          )}
        </div>
      </Modal>

      {/* ---------- Delete confirmation modal ---------- */}
      <ConfirmDeleteModal
        open={deleteTarget !== null}
        title="Delete Ticket"
        message={deleteTarget
          ? `You are about to permanently remove ticket № ${deleteTarget.id} ("${deleteTarget.issue}") from the registry.`
          : ''}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
