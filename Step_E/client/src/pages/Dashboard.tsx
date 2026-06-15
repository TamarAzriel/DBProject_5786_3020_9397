import { useEffect, useState } from 'react';
import {
  Gem,
  Wrench,
  MapPin,
  Users,
  Handshake,
  ClipboardCheck,
  AlertTriangle,
  CircleDot,
} from 'lucide-react';

interface DashboardStats {
  totalAssets: number;
  totalTickets: number;
  totalLocations: number;
  totalStaff: number;
  totalVendors: number;
  totalInspections: number;
  openTickets: number;
  urgentOpenTickets: number;
}

interface StatCard {
  key: keyof DashboardStats;
  label: string;
  sub: string;
  icon: typeof Gem;
  featured?: boolean;
}

const cards: StatCard[] = [
  { key: 'totalAssets', label: 'Assets', sub: 'Estate equipment under management', icon: Gem, featured: true },
  { key: 'totalTickets', label: 'Maintenance Tickets', sub: 'Service requests, all time', icon: Wrench, featured: true },
  { key: 'totalLocations', label: 'Locations', sub: 'Floors & areas across the estate', icon: MapPin },
  { key: 'totalStaff', label: 'Staff', sub: 'Resident technicians & specialists', icon: Users },
  { key: 'totalVendors', label: 'Vendors', sub: 'Contracted suppliers', icon: Handshake },
  { key: 'totalInspections', label: 'Inspections', sub: 'Quality assurance entries', icon: ClipboardCheck },
];

function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then((res) => {
        if (!res.ok) throw new Error(`Server responded with ${res.status}`);
        return res.json() as Promise<DashboardStats>;
      })
      .then(setStats)
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <header className="mb-12 animate-fade-up">
        <p className="eyebrow mb-3">Overview · Live from PostgreSQL</p>
        <h2 className="font-display text-5xl font-medium text-pearl leading-tight">
          Welcome to the <span className="italic text-champagne-300">Estate</span>
        </h2>
        <p className="mt-4 text-pearl/50 font-light max-w-xl leading-relaxed">
          A curated overview of the facility — every figure below is drawn in real time from
          the maintenance database.
        </p>
        <div className="gold-divider mt-8 max-w-md" />
      </header>

      {/* Error state */}
      {error && (
        <div className="glass rounded-2xl px-6 py-5 mb-10 border-red-400/20 flex items-center gap-4 animate-fade-up">
          <AlertTriangle size={20} strokeWidth={1.5} className="text-red-300/80 shrink-0" />
          <div>
            <p className="text-sm text-red-200/90">Unable to reach the database service.</p>
            <p className="text-xs text-pearl/40 mt-1">
              {error} — ensure the API server is running on port 3001 and Docker is up.
            </p>
          </div>
        </div>
      )}

      {/* Operational highlight strip */}
      {stats && (
        <div className="flex flex-wrap gap-x-10 gap-y-3 mb-10 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-2.5">
            <CircleDot size={14} className="text-emerald-300/80" strokeWidth={1.5} />
            <span className="text-sm text-pearl/60 font-light">
              <span className="text-pearl font-normal">{formatNumber(stats.openTickets)}</span> open tickets
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={14} className="text-champagne-300/90" strokeWidth={1.5} />
            <span className="text-sm text-pearl/60 font-light">
              <span className="text-pearl font-normal">{formatNumber(stats.urgentOpenTickets)}</span> high
              urgency, awaiting attention
            </span>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {cards.map(({ key, label, sub, icon: Icon, featured }, i) => (
          <article
            key={key}
            className={[
              'card-3d group p-7 animate-fade-up',
              featured ? 'sm:col-span-1 xl:col-span-1' : '',
            ].join(' ')}
            style={{ animationDelay: `${0.15 + i * 0.08}s` }}
          >
            <div className="flex items-start justify-between">
              <div
                className={[
                  'rounded-xl p-3 border transition-all duration-500',
                  featured
                    ? 'bg-champagne-400/10 border-champagne-400/25 group-hover:shadow-gold-glow'
                    : 'bg-white/[0.04] border-white/[0.08] group-hover:border-champagne-400/20',
                ].join(' ')}
              >
                <Icon
                  size={20}
                  strokeWidth={1.25}
                  className={featured ? 'text-champagne-300' : 'text-pearl/60 group-hover:text-champagne-300/80 transition-colors duration-500'}
                />
              </div>
              {featured && <span className="eyebrow mt-1">Core</span>}
            </div>

            <div className="mt-7">
              <p className="font-display text-5xl font-medium text-pearl tabular-nums leading-none">
                {stats ? (
                  formatNumber(stats[key])
                ) : (
                  <span className="inline-block h-10 w-20 rounded-md bg-white/[0.06] animate-pulse" />
                )}
              </p>
              <p className="mt-3 text-sm tracking-wide text-champagne-200/90">{label}</p>
              <p className="mt-1 text-xs text-pearl/40 font-light">{sub}</p>
            </div>

            <div className="gold-divider mt-6 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          </article>
        ))}
      </section>
    </div>
  );
}
