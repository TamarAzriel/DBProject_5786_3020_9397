import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutGrid,
  MapPin,
  Users,
  Handshake,
  Gem,
  Wrench,
  ClipboardCheck,
  Sparkles,
} from 'lucide-react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutGrid },
  { to: '/locations', label: 'Locations', icon: MapPin },
  { to: '/staff', label: 'Staff', icon: Users },
  { to: '/vendors', label: 'Vendors', icon: Handshake },
  { to: '/assets', label: 'Assets', icon: Gem },
  { to: '/tickets', label: 'Tickets', icon: Wrench },
  { to: '/inspections', label: 'Inspections', icon: ClipboardCheck },
  { to: '/actions', label: 'Advanced Actions', icon: Sparkles },
];

export default function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-72 hidden lg:flex flex-col glass-strong border-r border-white/[0.06] z-20">
        {/* Brand */}
        <div className="px-8 pt-10 pb-8">
          <p className="eyebrow mb-2">Facility Management</p>
          <h1 className="font-display text-3xl font-semibold tracking-wide text-pearl">
            Grand <span className="text-champagne-300 italic">Estate</span>
          </h1>
          <div className="gold-divider mt-6" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-5 space-y-1 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                [
                  'group flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm tracking-wide transition-all duration-300',
                  isActive
                    ? 'bg-champagne-400/10 text-champagne-200 border border-champagne-400/20 shadow-gold-glow'
                    : 'text-pearl/55 border border-transparent hover:text-pearl hover:bg-white/[0.04] hover:border-white/[0.06]',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={17}
                    strokeWidth={1.5}
                    className={
                      isActive
                        ? 'text-champagne-300'
                        : 'text-pearl/40 group-hover:text-champagne-300/70 transition-colors duration-300'
                    }
                  />
                  <span>{label}</span>
                  {isActive && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-champagne-300 shadow-gold-glow" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-8 py-7">
          <div className="gold-divider mb-5" />
          <p className="text-[0.65rem] tracking-widest2 uppercase text-pearl/30">
            DB Project · Step E
          </p>
          <p className="text-xs text-pearl/40 mt-1 font-light">PostgreSQL · Est. 2026</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 lg:ml-72 relative">
        {/* Subtle top ambience */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-radial-fade" />
        <div key={location.pathname} className="relative px-8 lg:px-14 py-12 animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
