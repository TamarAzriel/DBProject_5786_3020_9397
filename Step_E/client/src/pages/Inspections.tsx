import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Plus, PenLine, Trash2, Search, ClipboardCheck, AlertTriangle } from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import { api, Lookups } from '../lib/api';

interface InspectionRow {
  id: number;
  asset_name: string;
  inspector_name: string;
  inspection_date: string;
  inspection_result: string;
  technician_result: string;
  technician_notes: string;
  tools_used: string;
}

interface InspectionForm {
  assetId: string;
  staffId: string;
  inspectionDate: string;
  inspectionResult: string;
  technicianResult: string;
  technicianNotes: string;
  toolsUsed: string;
}

const emptyForm: InspectionForm = {
  assetId: '',
  staffId: '',
  inspectionDate: '',
  inspectionResult: 'Pass',
  technicianResult: 'Stable',
  technicianNotes: '',
  toolsUsed: 'None',
};

const RESULT_OPTIONS = ['Pass', 'Fail', 'Follow-up', 'Needs Repair'];
const TECH_RESULT_OPTIONS = ['Stable', 'Minor Wear', 'Critical', 'Failure'];
const TOOLS_OPTIONS = ['None', 'Multimeter', 'Pressure Gauge', 'Thermal Camera'];

function ResultPill({ result }: { result: string }) {
  const styles: Record<string, string> = {
    'Pass': 'border-emerald-400/25 text-emerald-200/90 bg-emerald-400/[0.07]',
    'Fail': 'border-red-400/25 text-red-200/90 bg-red-400/[0.07]',
    'Needs Repair': 'border-champagne-400/30 text-champagne-200 bg-champagne-400/[0.08]',
    'Follow-up': 'border-sky-400/25 text-sky-200/85 bg-sky-400/[0.06]',
  };
  return (
    <span className={`pill ${styles[result] ?? 'border-white/15 text-pearl/60 bg-white/[0.04]'}`}>
      {result}
    </span>
  );
}

export default function Inspections() {
  const [rows, setRows] = useState<InspectionRow[]>([]);
  const [lookups, setLookups] = useState<Lookups | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<InspectionForm>(emptyForm);
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Update modal — strict Fetch-before-Update workflow
  const [updateOpen, setUpdateOpen] = useState(false);
  const [fetchId, setFetchId] = useState('');
  const [fetched, setFetched] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [updateForm, setUpdateForm] = useState<InspectionForm>(emptyForm);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Delete confirmation modal — holds the row pending removal
  const [deleteTarget, setDeleteTarget] = useState<InspectionRow | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [inspections, lk] = await Promise.all([
        api<InspectionRow[]>('/api/inspections'),
        api<Lookups>('/api/lookups'),
      ]);
      setRows(inspections);
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
    setCreateForm({ ...emptyForm, inspectionDate: new Date().toISOString().slice(0, 10) });
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
      await api('/api/inspections', { method: 'POST', body: JSON.stringify(createForm) });
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
      setUpdateError('Please enter a Log ID first.');
      return;
    }
    setFetching(true);
    setUpdateError(null);
    try {
      const rec = await api<{
        asset_id: number; staff_id: number; inspection_date: string;
        inspection_result: string; technician_result: string;
        technician_notes: string; tools_used: string;
      }>(`/api/inspections/${fetchId.trim()}`);
      setUpdateForm({
        assetId: String(rec.asset_id),
        staffId: String(rec.staff_id),
        inspectionDate: rec.inspection_date,
        inspectionResult: rec.inspection_result,
        technicianResult: rec.technician_result,
        technicianNotes: rec.technician_notes,
        toolsUsed: rec.tools_used,
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
      await api(`/api/inspections/${fetchId.trim()}`, { method: 'PUT', body: JSON.stringify(updateForm) });
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
    await api(`/api/inspections/${deleteTarget.id}`, { method: 'DELETE' });
    setDeleteTarget(null);
    await refresh();
  }

  const formFields = (form: InspectionForm, setForm: (f: InspectionForm) => void) => (
    <div className="space-y-4">
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
        <label className="label-luxe">Inspector *</label>
        <select
          className="input-luxe"
          value={form.staffId}
          onChange={(e) => setForm({ ...form, staffId: e.target.value })}
          required
        >
          <option value="">Select an inspector…</option>
          {lookups?.staff.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label-luxe">Inspection Date *</label>
          <input
            type="date"
            className="input-luxe"
            value={form.inspectionDate}
            onChange={(e) => setForm({ ...form, inspectionDate: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="label-luxe">Tools Used *</label>
          <select
            className="input-luxe"
            value={form.toolsUsed}
            onChange={(e) => setForm({ ...form, toolsUsed: e.target.value })}
          >
            {TOOLS_OPTIONS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label-luxe">Inspection Result *</label>
          <select
            className="input-luxe"
            value={form.inspectionResult}
            onChange={(e) => setForm({ ...form, inspectionResult: e.target.value })}
          >
            {RESULT_OPTIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label-luxe">Technician Result *</label>
          <select
            className="input-luxe"
            value={form.technicianResult}
            onChange={(e) => setForm({ ...form, technicianResult: e.target.value })}
          >
            {TECH_RESULT_OPTIONS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="label-luxe">Technician Notes *</label>
        <textarea
          className="input-luxe min-h-[5.5rem] resize-y"
          value={form.technicianNotes}
          onChange={(e) => setForm({ ...form, technicianNotes: e.target.value })}
          placeholder="Observations made during the inspection…"
          required
        />
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl">
      <header className="mb-10 animate-fade-up flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow mb-3">Quality Assurance · Live Records</p>
          <h2 className="font-display text-5xl font-medium text-pearl leading-tight">Inspections</h2>
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
                <th>Inspector</th>
                <th>Date</th>
                <th>Result</th>
                <th>Condition</th>
                <th>Notes</th>
                <th>Tools</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={9} className="text-center py-14 text-pearl/35">Consulting the registry…</td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-16">
                    <ClipboardCheck size={22} strokeWidth={1.25} className="mx-auto text-champagne-300/50 mb-3" />
                    <p className="font-display text-xl text-pearl/60 italic">No inspections recorded</p>
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="text-pearl/35 tabular-nums">{r.id}</td>
                  <td className="text-pearl font-normal">{r.asset_name}</td>
                  <td>{r.inspector_name}</td>
                  <td className="tabular-nums">{r.inspection_date}</td>
                  <td><ResultPill result={r.inspection_result} /></td>
                  <td>{r.technician_result}</td>
                  <td className="max-w-[18rem] truncate" title={r.technician_notes}>{r.technician_notes}</td>
                  <td>{r.tools_used}</td>
                  <td className="text-right">
                    <button
                      onClick={() => setDeleteTarget(r)}
                      className="rounded-lg p-2 text-pearl/30 hover:text-red-300 hover:bg-red-400/10 transition-all duration-300"
                      title="Delete inspection log"
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
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} eyebrow="New Entry" title="Create Inspection Log">
        <form onSubmit={handleCreate} className="space-y-6">
          {formFields(createForm, setCreateForm)}
          {createError && <p className="text-sm text-red-300/90">{createError}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-ghost" onClick={() => setCreateOpen(false)}>Cancel</button>
            <button type="submit" className="btn-gold" disabled={creating}>
              {creating ? 'Creating…' : 'Create Log Entry'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ---------- Update modal — Fetch-before-Update ---------- */}
      <Modal open={updateOpen} onClose={() => setUpdateOpen(false)} eyebrow="Amend Entry" title="Update Inspection Log">
        <div className="space-y-6">
          <div>
            <label className="label-luxe">Step 1 · Log ID</label>
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
        title="Delete Inspection Log"
        message={deleteTarget
          ? `You are about to permanently remove inspection log № ${deleteTarget.id} (${deleteTarget.asset_name}, ${deleteTarget.inspection_date}) from the registry.`
          : ''}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
