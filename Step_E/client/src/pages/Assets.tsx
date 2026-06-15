import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Plus, PenLine, Trash2, Search, Gem, AlertTriangle } from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import { api, Lookups } from '../lib/api';

interface AssetRow {
  id: number;
  name: string;
  category: string | null;
  location_area: string;
  location_floor: number;
  vendor_name: string;
  manufacturer: string | null;
  model_number: string | null;
  installation_date: string | null;
  status: string;
}

interface AssetForm {
  name: string;
  category: string;
  locationId: string;
  vendorId: string;
  manufacturer: string;
  modelNumber: string;
  installationDate: string;
  status: string;
}

const emptyForm: AssetForm = {
  name: '',
  category: '',
  locationId: '',
  vendorId: '',
  manufacturer: '',
  modelNumber: '',
  installationDate: '',
  status: 'Active',
};

const STATUS_OPTIONS = ['Active', 'Inactive', 'Under Review', 'Requires Action'];

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    'Active': 'border-emerald-400/25 text-emerald-200/90 bg-emerald-400/[0.07]',
    'Under Review': 'border-red-400/25 text-red-200/90 bg-red-400/[0.07]',
    'Requires Action': 'border-champagne-400/30 text-champagne-200 bg-champagne-400/[0.08]',
  };
  return (
    <span className={`pill ${styles[status] ?? 'border-white/15 text-pearl/60 bg-white/[0.04]'}`}>
      {status}
    </span>
  );
}

export default function Assets() {
  const [rows, setRows] = useState<AssetRow[]>([]);
  const [lookups, setLookups] = useState<Lookups | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<AssetForm>(emptyForm);
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Update modal — strict Fetch-before-Update workflow
  const [updateOpen, setUpdateOpen] = useState(false);
  const [fetchId, setFetchId] = useState('');
  const [fetched, setFetched] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [updateForm, setUpdateForm] = useState<AssetForm>(emptyForm);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Delete confirmation modal — holds the row pending removal
  const [deleteTarget, setDeleteTarget] = useState<AssetRow | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [assets, lk] = await Promise.all([
        api<AssetRow[]>('/api/assets'),
        api<Lookups>('/api/lookups'),
      ]);
      setRows(assets);
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
      await api('/api/assets', { method: 'POST', body: JSON.stringify(createForm) });
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
      setUpdateError('Please enter an Asset ID first.');
      return;
    }
    setFetching(true);
    setUpdateError(null);
    try {
      const rec = await api<{
        name: string; category: string | null; location_id: number; vendor_id: number;
        manufacturer: string | null; model_number: string | null;
        installation_date: string | null; status: string;
      }>(`/api/assets/${fetchId.trim()}`);
      setUpdateForm({
        name: rec.name,
        category: rec.category ?? '',
        locationId: String(rec.location_id),
        vendorId: String(rec.vendor_id),
        manufacturer: rec.manufacturer ?? '',
        modelNumber: rec.model_number ?? '',
        installationDate: rec.installation_date ?? '',
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
      await api(`/api/assets/${fetchId.trim()}`, { method: 'PUT', body: JSON.stringify(updateForm) });
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
    await api(`/api/assets/${deleteTarget.id}`, { method: 'DELETE' });
    setDeleteTarget(null);
    await refresh();
  }

  const formFields = (form: AssetForm, setForm: (f: AssetForm) => void) => (
    <div className="space-y-4">
      <div>
        <label className="label-luxe">Asset Name *</label>
        <input
          className="input-luxe"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. Grand Lobby Chandelier"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label-luxe">Category</label>
          <input
            className="input-luxe"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            placeholder="e.g. HVAC"
          />
        </div>
        <div>
          <label className="label-luxe">Status</label>
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
      <div>
        <label className="label-luxe">Location *</label>
        <select
          className="input-luxe"
          value={form.locationId}
          onChange={(e) => setForm({ ...form, locationId: e.target.value })}
          required
        >
          <option value="">Select a location…</option>
          {lookups?.locations.map((l) => (
            <option key={l.id} value={l.id}>{l.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label-luxe">Vendor *</label>
        <select
          className="input-luxe"
          value={form.vendorId}
          onChange={(e) => setForm({ ...form, vendorId: e.target.value })}
          required
        >
          <option value="">Select a vendor…</option>
          {lookups?.vendors.map((v) => (
            <option key={v.id} value={v.id}>{v.label}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label-luxe">Manufacturer</label>
          <input
            className="input-luxe"
            value={form.manufacturer}
            onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
            placeholder="e.g. Siemens"
          />
        </div>
        <div>
          <label className="label-luxe">Model Number</label>
          <input
            className="input-luxe"
            value={form.modelNumber}
            onChange={(e) => setForm({ ...form, modelNumber: e.target.value })}
            placeholder="e.g. MX-4500"
          />
        </div>
      </div>
      <div>
        <label className="label-luxe">Installation Date</label>
        <input
          type="date"
          className="input-luxe"
          value={form.installationDate}
          onChange={(e) => setForm({ ...form, installationDate: e.target.value })}
        />
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl">
      <header className="mb-10 animate-fade-up flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow mb-3">Estate Inventory · Live Records</p>
          <h2 className="font-display text-5xl font-medium text-pearl leading-tight">Assets</h2>
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
                <th>Asset</th>
                <th>Category</th>
                <th>Location</th>
                <th>Vendor</th>
                <th>Manufacturer · Model</th>
                <th>Installed</th>
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
                    <Gem size={22} strokeWidth={1.25} className="mx-auto text-champagne-300/50 mb-3" />
                    <p className="font-display text-xl text-pearl/60 italic">The registry is empty</p>
                    <p className="text-xs text-pearl/35 mt-1.5">Create your first asset to begin.</p>
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="text-pearl/35 tabular-nums">{r.id}</td>
                  <td className="text-pearl font-normal">{r.name}</td>
                  <td>{r.category ?? '—'}</td>
                  <td>
                    {r.location_area}
                    <span className="text-pearl/35"> · Floor {r.location_floor}</span>
                  </td>
                  <td>{r.vendor_name}</td>
                  <td>
                    {r.manufacturer ?? '—'}
                    {r.model_number && <span className="text-pearl/35"> · {r.model_number}</span>}
                  </td>
                  <td className="tabular-nums">{r.installation_date ?? '—'}</td>
                  <td><StatusPill status={r.status} /></td>
                  <td className="text-right">
                    <button
                      onClick={() => setDeleteTarget(r)}
                      className="rounded-lg p-2 text-pearl/30 hover:text-red-300 hover:bg-red-400/10 transition-all duration-300"
                      title="Delete asset"
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
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} eyebrow="New Entry" title="Create Asset">
        <form onSubmit={handleCreate} className="space-y-6">
          {formFields(createForm, setCreateForm)}
          {createError && <p className="text-sm text-red-300/90">{createError}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-ghost" onClick={() => setCreateOpen(false)}>Cancel</button>
            <button type="submit" className="btn-gold" disabled={creating}>
              {creating ? 'Creating…' : 'Create Asset'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ---------- Update modal — Fetch-before-Update ---------- */}
      <Modal open={updateOpen} onClose={() => setUpdateOpen(false)} eyebrow="Amend Entry" title="Update Asset">
        <div className="space-y-6">
          {/* Step 1: enter the PK and fetch */}
          <div>
            <label className="label-luxe">Step 1 · Asset ID</label>
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
        title="Delete Asset"
        message={deleteTarget
          ? `You are about to permanently remove the asset "${deleteTarget.name}" (№ ${deleteTarget.id}) from the registry.`
          : ''}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
