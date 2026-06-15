import { useCallback, useEffect, useState } from 'react';
import {
  Trophy,
  ShieldAlert,
  RefreshCcw,
  Gavel,
  Play,
  Loader2,
  CheckCircle2,
  XCircle,
  Sparkles,
  X,
} from 'lucide-react';
import { api } from '../lib/api';

interface TechnicianRow {
  first_name: string;
  last_name: string;
  phone_number: string;
  expertise: string;
  total_closed: string;
}

interface VendorIssueRow {
  company_name: string;
  contact_person: string;
  phone_number: string | null;
  urgent_open_tickets: string;
}

interface ProcedureResult {
  success: boolean;
  summary: string;
  noticeCount: number;
  notices: string[];
  durationMs: number;
}

interface Toast {
  kind: 'success' | 'error';
  title: string;
  message: string;
  detail?: string;
}

export default function AdvancedActions() {
  const [technicians, setTechnicians] = useState<TechnicianRow[] | null>(null);
  const [vendorIssues, setVendorIssues] = useState<VendorIssueRow[] | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);

  const [running, setRunning] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  const loadReports = useCallback(async () => {
    try {
      const [techs, vendors] = await Promise.all([
        api<TechnicianRow[]>('/api/advanced/reports/top-technicians'),
        api<VendorIssueRow[]>('/api/advanced/reports/vendor-issues'),
      ]);
      setTechnicians(techs);
      setVendorIssues(vendors);
      setReportError(null);
    } catch (err) {
      setReportError((err as Error).message);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 8000);
    return () => clearTimeout(timer);
  }, [toast]);

  async function executeProcedure(key: string, url: string, title: string) {
    setRunning(key);
    setToast(null);
    try {
      const result = await api<ProcedureResult>(url, { method: 'POST' });
      setToast({
        kind: 'success',
        title: `${title} — completed`,
        message: result.summary,
        detail: `${result.noticeCount.toLocaleString()} database notices · ${(result.durationMs / 1000).toFixed(1)}s`,
      });
      await loadReports(); // procedures change data — refresh the reports
    } catch (err) {
      setToast({
        kind: 'error',
        title: `${title} — failed`,
        message: (err as Error).message,
      });
    } finally {
      setRunning(null);
    }
  }

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <header className="mb-12 animate-fade-up">
        <p className="eyebrow mb-3">Executive Command Center</p>
        <h2 className="font-display text-5xl font-medium text-pearl leading-tight">
          Advanced <span className="italic text-champagne-300">Actions</span>
        </h2>
        <p className="mt-4 text-pearl/50 font-light max-w-2xl leading-relaxed">
          Complex reports from Step B and PL/pgSQL procedures from Step D — executed live
          against the estate database.
        </p>
        <div className="gold-divider mt-8 max-w-md" />
      </header>

      {/* ---------- SECTION 1: SYSTEM REPORTS ---------- */}
      <section className="mb-16">
        <div className="flex items-center gap-3 mb-7 animate-fade-up">
          <Sparkles size={16} strokeWidth={1.5} className="text-champagne-300" />
          <h3 className="eyebrow !text-sm">Section I · System Reports</h3>
        </div>

        {reportError && (
          <div className="glass rounded-2xl px-6 py-4 mb-8 border-red-400/20 animate-fade-up">
            <p className="text-sm text-red-200/90">{reportError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Report 1: Top technicians */}
          <article className="card-3d overflow-hidden animate-fade-up" style={{ animationDelay: '0.1s' }}>
            <div className="px-7 pt-7 pb-5 flex items-start gap-4">
              <div className="rounded-xl p-3 bg-champagne-400/10 border border-champagne-400/25">
                <Trophy size={18} strokeWidth={1.25} className="text-champagne-300" />
              </div>
              <div>
                <h4 className="font-display text-2xl text-pearl">Distinguished Technicians</h4>
                <p className="text-xs text-pearl/40 font-light mt-1">
                  Staff who closed more than 5 tickets during 2025 — Step B, Query 1
                </p>
              </div>
            </div>
            <div className="gold-divider mx-7" />
            <div className="overflow-x-auto">
              <table className="table-luxe">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Technician</th>
                    <th>Expertise</th>
                    <th>Phone</th>
                    <th className="text-right">Closed</th>
                  </tr>
                </thead>
                <tbody>
                  {!technicians && (
                    <tr><td colSpan={5} className="text-center py-10 text-pearl/35">Compiling the honors list…</td></tr>
                  )}
                  {technicians?.length === 0 && (
                    <tr><td colSpan={5} className="text-center py-10 text-pearl/35 italic">No qualifying technicians.</td></tr>
                  )}
                  {technicians?.map((t, i) => (
                    <tr key={`${t.first_name}-${t.last_name}-${i}`}>
                      <td>
                        <span
                          className={`font-display text-lg ${
                            i === 0 ? 'text-champagne-300' : i < 3 ? 'text-champagne-200/70' : 'text-pearl/35'
                          }`}
                        >
                          {String(i + 1).padStart(2, '0')}
                        </span>
                      </td>
                      <td className="text-pearl font-normal">{t.first_name} {t.last_name}</td>
                      <td>{t.expertise}</td>
                      <td className="tabular-nums">{t.phone_number}</td>
                      <td className="text-right">
                        <span className="pill border-champagne-400/30 text-champagne-200 bg-champagne-400/[0.08] tabular-nums">
                          {t.total_closed}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          {/* Report 2: Vendor issues */}
          <article className="card-3d overflow-hidden animate-fade-up" style={{ animationDelay: '0.18s' }}>
            <div className="px-7 pt-7 pb-5 flex items-start gap-4">
              <div className="rounded-xl p-3 bg-red-400/10 border border-red-400/20">
                <ShieldAlert size={18} strokeWidth={1.25} className="text-red-300/90" />
              </div>
              <div>
                <h4 className="font-display text-2xl text-pearl">Vendors Under Scrutiny</h4>
                <p className="text-xs text-pearl/40 font-light mt-1">
                  Suppliers of equipment with open urgent tickets — Step B, Query 3
                </p>
              </div>
            </div>
            <div className="gold-divider mx-7" />
            <div className="overflow-x-auto">
              <table className="table-luxe">
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Contact</th>
                    <th>Phone</th>
                    <th className="text-right">Urgent Open</th>
                  </tr>
                </thead>
                <tbody>
                  {!vendorIssues && (
                    <tr><td colSpan={4} className="text-center py-10 text-pearl/35">Reviewing supplier conduct…</td></tr>
                  )}
                  {vendorIssues?.length === 0 && (
                    <tr><td colSpan={4} className="text-center py-10 text-pearl/35 italic">No vendors with urgent open tickets.</td></tr>
                  )}
                  {vendorIssues?.map((v, i) => (
                    <tr key={`${v.company_name}-${i}`}>
                      <td className="text-pearl font-normal">{v.company_name}</td>
                      <td>{v.contact_person}</td>
                      <td className="tabular-nums">{v.phone_number ?? '—'}</td>
                      <td className="text-right">
                        <span className="pill border-red-400/25 text-red-200/90 bg-red-400/[0.07] tabular-nums">
                          {v.urgent_open_tickets}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </div>
      </section>

      {/* ---------- SECTION 2: SYSTEM PROCEDURES ---------- */}
      <section>
        <div className="flex items-center gap-3 mb-7 animate-fade-up">
          <Sparkles size={16} strokeWidth={1.5} className="text-champagne-300" />
          <h3 className="eyebrow !text-sm">Section II · System Procedures</h3>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Procedure 1 */}
          <article className="card-3d p-8 animate-fade-up flex flex-col" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-start gap-4 mb-5">
              <div className="rounded-xl p-3 bg-champagne-400/10 border border-champagne-400/25">
                <RefreshCcw size={18} strokeWidth={1.25} className="text-champagne-300" />
              </div>
              <div>
                <h4 className="font-display text-2xl text-pearl">Reassign Overdue Tickets</h4>
                <p className="eyebrow mt-1">reassign_overdue_tickets()</p>
              </div>
            </div>
            <p className="text-sm text-pearl/50 font-light leading-relaxed flex-1">
              Sweeps every ticket that has remained open for more than three days, locates a
              technician whose expertise matches the faulty asset's category, transfers the
              assignment, and elevates the urgency to <span className="text-champagne-200">High</span>.
              Tickets without a matching specialist are reported back as database notices.
            </p>
            <div className="gold-divider my-6" />
            <button
              className="btn-gold self-start"
              disabled={running !== null}
              onClick={() =>
                executeProcedure('reassign', '/api/advanced/actions/reassign-tickets', 'Reassign Overdue Tickets')
              }
            >
              {running === 'reassign' ? (
                <>
                  <Loader2 size={15} strokeWidth={1.5} className="animate-spin" />
                  Executing…
                </>
              ) : (
                <>
                  <Play size={15} strokeWidth={1.5} />
                  Execute Operation
                </>
              )}
            </button>
          </article>

          {/* Procedure 2 */}
          <article className="card-3d p-8 animate-fade-up flex flex-col" style={{ animationDelay: '0.18s' }}>
            <div className="flex items-start gap-4 mb-5">
              <div className="rounded-xl p-3 bg-champagne-400/10 border border-champagne-400/25">
                <Gavel size={18} strokeWidth={1.25} className="text-champagne-300" />
              </div>
              <div>
                <h4 className="font-display text-2xl text-pearl">Process Vendor Failures</h4>
                <p className="eyebrow mt-1">process_vendor_failures('Fail')</p>
              </div>
            </div>
            <p className="text-sm text-pearl/50 font-light leading-relaxed flex-1">
              Audits the inspection log and disciplines underperforming suppliers: vendors with
              five or more failed inspections have their contract shortened to 30 days and all
              their assets frozen to <span className="text-red-200/90">Under Review</span>; vendors
              with two to four failures have their assets flagged as{' '}
              <span className="text-champagne-200">Requires Action</span>.
            </p>
            <div className="gold-divider my-6" />
            <button
              className="btn-gold self-start"
              disabled={running !== null}
              onClick={() =>
                executeProcedure('vendors', '/api/advanced/actions/process-vendors', 'Process Vendor Failures')
              }
            >
              {running === 'vendors' ? (
                <>
                  <Loader2 size={15} strokeWidth={1.5} className="animate-spin" />
                  Executing…
                </>
              ) : (
                <>
                  <Play size={15} strokeWidth={1.5} />
                  Execute Operation
                </>
              )}
            </button>
          </article>
        </div>
      </section>

      {/* ---------- Toast notification ---------- */}
      {toast && (
        <div className="fixed bottom-8 right-8 z-50 max-w-md animate-fade-up">
          <div
            className={`glass-strong rounded-2xl p-5 flex items-start gap-4 ${
              toast.kind === 'success'
                ? 'border-emerald-400/25 shadow-gold-glow'
                : 'border-red-400/30'
            }`}
          >
            {toast.kind === 'success' ? (
              <CheckCircle2 size={20} strokeWidth={1.5} className="text-emerald-300/90 shrink-0 mt-0.5" />
            ) : (
              <XCircle size={20} strokeWidth={1.5} className="text-red-300/90 shrink-0 mt-0.5" />
            )}
            <div className="min-w-0">
              <p className="text-sm text-pearl font-normal">{toast.title}</p>
              <p className="text-sm text-pearl/60 font-light mt-1 leading-relaxed break-words" dir="auto">
                {toast.message}
              </p>
              {toast.detail && (
                <p className="text-[0.7rem] uppercase tracking-widest text-champagne-300/70 mt-2.5">
                  {toast.detail}
                </p>
              )}
            </div>
            <button
              onClick={() => setToast(null)}
              className="ml-auto rounded-full p-1.5 text-pearl/35 hover:text-pearl hover:bg-white/[0.05] transition-all duration-300 shrink-0"
              aria-label="Dismiss"
            >
              <X size={14} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
