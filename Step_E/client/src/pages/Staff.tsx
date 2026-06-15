import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Plus, PenLine, Trash2, Search, Users, AlertTriangle } from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import { api } from '../lib/api';

interface StaffRow {
  id: number;
  first_name: string;
  last_name: string;
  phone_number: string;
  expertise: string;
}

interface StaffForm {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  expertise: string;
}

const emptyForm: StaffForm = { firstName: '', lastName: '', phoneNumber: '', expertise: '' };

export default function Staff() {
  const [rows, setRows] = useState<StaffRow[]>([]);
  const [pageError, setPageError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<StaffForm>(emptyForm);
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Update modal — strict Fetch-before-Update workflow
  const [updateOpen, setUpdateOpen] = useState(false);
  const [fetchId, setFetchId] = useState('');
  const [fetched, setFetched] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [updateForm, setUpdateForm] = useState<StaffForm>(emptyForm);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Delete confirmation modal — holds the row pending removal
  const [deleteTarget, setDeleteTarget] = useState<StaffRow | null>(null);

  const refresh = useCallback(async () => {
    try {
      setRows(await api<StaffRow[]>('/api/staff'));
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
    setCreateForm(emptyForm);
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
      await api('/api/staff', { method: 'POST', body: JSON.stringify(createForm) });
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
      setUpdateError('Please enter a Staff ID first.');
      return;
    }
    setFetching(true);
    setUpdateError(null);
    try {
      const rec = await api<StaffRow>(`/api/staff/${fetchId.trim()}`);
      setUpdateForm({
        firstName: rec.first_name,
        lastName: rec.last_name,
        phoneNumber: rec.phone_number,
        expertise: rec.expertise,
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
      await api(`/api/staff/${fetchId.trim()}`, { method: 'PUT', body: JSON.stringify(updateForm) });
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
    await api(`/api/staff/${deleteTarget.id}`, { method: 'DELETE' });
    setDeleteTarget(null);
    await refresh();
  }

  const formFields = (form: StaffForm, setForm: (f: StaffForm) => void) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label-luxe">First Name *</label>
          <input
            className="input-luxe"
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            placeholder="e.g. Eleanor"
            required
          />
        </div>
        <div>
          <label className="label-luxe">Last Name *</label>
          <input
            className="input-luxe"
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            placeholder="e.g. Vanderbilt"
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label-luxe">Phone Number *</label>
          <input
            className="input-luxe"
            value={form.phoneNumber}
            onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
            placeholder="e.g. 555-123-4567"
            required
          />
        </div>
        <div>
          <label className="label-luxe">Expertise *</label>
          <input
            className="input-luxe"
            value={form.expertise}
            onChange={(e) => setForm({ ...form, expertise: e.target.value })}
            placeholder="e.g. Electrician"
            required
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl">
      <header className="mb-10 animate-fade-up flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow mb-3">Technicians &amp; Specialists · Live Records</p>
          <h2 className="font-display text-5xl font-medium text-pearl leading-tight">Staff</h2>
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
                <th>Name</th>
                <th>Phone</th>
                <th>Expertise</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="text-center py-14 text-pearl/35">Consulting the registry…</td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-16">
                    <Users size={22} strokeWidth={1.25} className="mx-auto text-champagne-300/50 mb-3" />
                    <p className="font-display text-xl text-pearl/60 italic">No staff recorded</p>
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="text-pearl/35 tabular-nums">{r.id}</td>
                  <td className="text-pearl font-normal">{r.first_name} {r.last_name}</td>
                  <td className="tabular-nums">{r.phone_number}</td>
                  <td>
                    <span className="pill border-champagne-400/25 text-champagne-200/90 bg-champagne-400/[0.06]">
                      {r.expertise}
                    </span>
                  </td>
                  <td className="text-right">
                    <button
                      onClick={() => setDeleteTarget(r)}
                      className="rounded-lg p-2 text-pearl/30 hover:text-red-300 hover:bg-red-400/10 transition-all duration-300"
                      title="Delete staff member"
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
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} eyebrow="New Entry" title="Create Staff Member">
        <form onSubmit={handleCreate} className="space-y-6">
          {formFields(createForm, setCreateForm)}
          {createError && <p className="text-sm text-red-300/90">{createError}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-ghost" onClick={() => setCreateOpen(false)}>Cancel</button>
            <button type="submit" className="btn-gold" disabled={creating}>
              {creating ? 'Creating…' : 'Create Staff Member'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ---------- Update modal — Fetch-before-Update ---------- */}
      <Modal open={updateOpen} onClose={() => setUpdateOpen(false)} eyebrow="Amend Entry" title="Update Staff Member">
        <div className="space-y-6">
          <div>
            <label className="label-luxe">Step 1 · Staff ID</label>
            <div className="flex gap-3">
              <input
                className="input-luxe flex-1"
                value={fetchId}
                onChange={(e) => { setFetchId(e.target.value); setFetched(false); }}
                placeholder="Enter the primary key, e.g. 12"
                inputMode="numeric"
              />
              <button type="button" className="btn-gold shrink-0" onClick={handleFetch} disabled={fetching}>
                <Search size={15} strokeWidth={1.5} />
                {fetching ? 'Fetching…' : 'Fetch'}
              </button>
            </div>
          </div>

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
        title="Delete Staff Member"
        message={deleteTarget
          ? `You are about to permanently remove ${deleteTarget.first_name} ${deleteTarget.last_name} (№ ${deleteTarget.id}) from the registry.`
          : ''}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
