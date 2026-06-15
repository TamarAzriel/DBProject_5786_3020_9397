import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Plus, PenLine, Trash2, Search, Handshake, AlertTriangle } from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import { api } from '../lib/api';

interface VendorRow {
  id: number;
  company_name: string;
  contact_person: string;
  phone_number: string | null;
  support_email: string | null;
  contract_number: string;
  contract_expiration: string | null;
}

interface VendorForm {
  companyName: string;
  contactPerson: string;
  phoneNumber: string;
  supportEmail: string;
  contractNumber: string;
  contractExpiration: string;
}

const emptyForm: VendorForm = {
  companyName: '',
  contactPerson: '',
  phoneNumber: '',
  supportEmail: '',
  contractNumber: '',
  contractExpiration: '',
};

function ContractPill({ expiration }: { expiration: string | null }) {
  if (!expiration) {
    return <span className="pill border-white/15 text-pearl/60 bg-white/[0.04]">No expiry</span>;
  }
  const expired = expiration < new Date().toISOString().slice(0, 10);
  return (
    <span
      className={`pill ${
        expired
          ? 'border-red-400/25 text-red-200/90 bg-red-400/[0.07]'
          : 'border-emerald-400/25 text-emerald-200/90 bg-emerald-400/[0.07]'
      }`}
    >
      {expired ? 'Expired' : 'Active'} · {expiration}
    </span>
  );
}

export default function Vendors() {
  const [rows, setRows] = useState<VendorRow[]>([]);
  const [pageError, setPageError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<VendorForm>(emptyForm);
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Update modal — strict Fetch-before-Update workflow
  const [updateOpen, setUpdateOpen] = useState(false);
  const [fetchId, setFetchId] = useState('');
  const [fetched, setFetched] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [updateForm, setUpdateForm] = useState<VendorForm>(emptyForm);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Delete confirmation modal — holds the row pending removal
  const [deleteTarget, setDeleteTarget] = useState<VendorRow | null>(null);

  const refresh = useCallback(async () => {
    try {
      setRows(await api<VendorRow[]>('/api/vendors'));
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
      await api('/api/vendors', { method: 'POST', body: JSON.stringify(createForm) });
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
      setUpdateError('Please enter a Vendor ID first.');
      return;
    }
    setFetching(true);
    setUpdateError(null);
    try {
      const rec = await api<VendorRow>(`/api/vendors/${fetchId.trim()}`);
      setUpdateForm({
        companyName: rec.company_name,
        contactPerson: rec.contact_person,
        phoneNumber: rec.phone_number ?? '',
        supportEmail: rec.support_email ?? '',
        contractNumber: rec.contract_number,
        contractExpiration: rec.contract_expiration ?? '',
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
      await api(`/api/vendors/${fetchId.trim()}`, { method: 'PUT', body: JSON.stringify(updateForm) });
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
    await api(`/api/vendors/${deleteTarget.id}`, { method: 'DELETE' });
    setDeleteTarget(null);
    await refresh();
  }

  const formFields = (form: VendorForm, setForm: (f: VendorForm) => void) => (
    <div className="space-y-4">
      <div>
        <label className="label-luxe">Company Name *</label>
        <input
          className="input-luxe"
          value={form.companyName}
          onChange={(e) => setForm({ ...form, companyName: e.target.value })}
          placeholder="e.g. Sterling & Co."
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label-luxe">Contact Person *</label>
          <input
            className="input-luxe"
            value={form.contactPerson}
            onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
            placeholder="e.g. James Sterling"
            required
          />
        </div>
        <div>
          <label className="label-luxe">Phone Number</label>
          <input
            className="input-luxe"
            value={form.phoneNumber}
            onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
            placeholder="e.g. 555-123-4567"
          />
        </div>
      </div>
      <div>
        <label className="label-luxe">Support Email</label>
        <input
          type="email"
          className="input-luxe"
          value={form.supportEmail}
          onChange={(e) => setForm({ ...form, supportEmail: e.target.value })}
          placeholder="e.g. support@sterling.com"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label-luxe">Contract Number *</label>
          <input
            className="input-luxe"
            value={form.contractNumber}
            onChange={(e) => setForm({ ...form, contractNumber: e.target.value })}
            placeholder="e.g. CON-1234"
            required
          />
        </div>
        <div>
          <label className="label-luxe">Contract Expiration</label>
          <input
            type="date"
            className="input-luxe"
            value={form.contractExpiration}
            onChange={(e) => setForm({ ...form, contractExpiration: e.target.value })}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl">
      <header className="mb-10 animate-fade-up flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow mb-3">Suppliers &amp; Contracts · Live Records</p>
          <h2 className="font-display text-5xl font-medium text-pearl leading-tight">Vendors</h2>
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
                <th>Company</th>
                <th>Contact</th>
                <th>Phone</th>
                <th>Support Email</th>
                <th>Contract</th>
                <th>Expiration</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="text-center py-14 text-pearl/35">Consulting the registry…</td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-16">
                    <Handshake size={22} strokeWidth={1.25} className="mx-auto text-champagne-300/50 mb-3" />
                    <p className="font-display text-xl text-pearl/60 italic">No vendors recorded</p>
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="text-pearl/35 tabular-nums">{r.id}</td>
                  <td className="text-pearl font-normal">{r.company_name}</td>
                  <td>{r.contact_person}</td>
                  <td className="tabular-nums">{r.phone_number ?? '—'}</td>
                  <td className="max-w-[16rem] truncate" title={r.support_email ?? undefined}>
                    {r.support_email ?? '—'}
                  </td>
                  <td className="tabular-nums">{r.contract_number}</td>
                  <td><ContractPill expiration={r.contract_expiration} /></td>
                  <td className="text-right">
                    <button
                      onClick={() => setDeleteTarget(r)}
                      className="rounded-lg p-2 text-pearl/30 hover:text-red-300 hover:bg-red-400/10 transition-all duration-300"
                      title="Delete vendor"
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
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} eyebrow="New Entry" title="Create Vendor">
        <form onSubmit={handleCreate} className="space-y-6">
          {formFields(createForm, setCreateForm)}
          {createError && <p className="text-sm text-red-300/90">{createError}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-ghost" onClick={() => setCreateOpen(false)}>Cancel</button>
            <button type="submit" className="btn-gold" disabled={creating}>
              {creating ? 'Creating…' : 'Create Vendor'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ---------- Update modal — Fetch-before-Update ---------- */}
      <Modal open={updateOpen} onClose={() => setUpdateOpen(false)} eyebrow="Amend Entry" title="Update Vendor">
        <div className="space-y-6">
          <div>
            <label className="label-luxe">Step 1 · Vendor ID</label>
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
        title="Delete Vendor"
        message={deleteTarget
          ? `You are about to permanently remove the vendor "${deleteTarget.company_name}" (№ ${deleteTarget.id}) from the registry.`
          : ''}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
