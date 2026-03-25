/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Ticket, 
  Box, 
  PlusCircle, 
  Search, 
  Bell, 
  User, 
  MoreVertical, 
  ArrowUpRight, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Activity, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar, 
  ChevronRight, 
  Filter, 
  Command,
  Settings,
  LogOut,
  Menu,
  X,
  Zap,
  Shield,
  Wrench,
  Thermometer,
  Droplets,
  Wind
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  Legend
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utilities ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Mock Data ---
const TICKET_TRENDS = [
  { name: '00:00', tickets: 12 },
  { name: '04:00', tickets: 8 },
  { name: '08:00', tickets: 25 },
  { name: '12:00', tickets: 42 },
  { name: '16:00', tickets: 38 },
  { name: '20:00', tickets: 22 },
  { name: '23:59', tickets: 15 },
];

const ASSET_HEALTH_DATA = [
  { name: 'HVAC', value: 94, fill: '#4F46E5' },
  { name: 'Plumbing', value: 88, fill: '#10B981' },
  { name: 'Electrical', value: 91, fill: '#F59E0B' },
  { name: 'Elevators', value: 98, fill: '#EF4444' },
];

const RECENT_TICKETS = [
  { id: 'TKT-8291', title: 'HVAC Leak - Room 402', priority: 'Urgent', status: 'In Progress', time: '2m ago', tech: 'Marcus L.' },
  { id: 'TKT-8290', title: 'Elevator B - Unusual Noise', priority: 'High', status: 'Pending', time: '15m ago', tech: 'Sarah K.' },
  { id: 'TKT-8289', title: 'Pool Pump Filter Replacement', priority: 'Medium', status: 'Closed', time: '1h ago', tech: 'David R.' },
  { id: 'TKT-8288', title: 'Kitchen Freezer Temp Warning', priority: 'Urgent', status: 'In Progress', time: '2h ago', tech: 'Marcus L.' },
  { id: 'TKT-8287', title: 'Lobby Chandelier Bulb Out', priority: 'Low', status: 'Pending', time: '3h ago', tech: 'Sarah K.' },
];

const TECHNICIANS = [
  { name: 'Marcus L.', status: 'Busy', avatar: 'https://i.pravatar.cc/150?u=marcus' },
  { name: 'Sarah K.', status: 'Online', avatar: 'https://i.pravatar.cc/150?u=sarah' },
  { name: 'David R.', status: 'Online', avatar: 'https://i.pravatar.cc/150?u=david' },
  { name: 'Elena V.', status: 'Busy', avatar: 'https://i.pravatar.cc/150?u=elena' },
  { name: 'Tom H.', status: 'Offline', avatar: 'https://i.pravatar.cc/150?u=tom' },
];

const ASSETS = Array.from({ length: 20 }, (_, i) => ({
  id: `AST-${1000 + i}`,
  name: i % 3 === 0 ? 'Carrier Chiller Unit 4' : i % 2 === 0 ? 'Otis Elevator Gen2' : 'Pentair Pool Pump',
  category: i % 3 === 0 ? 'HVAC' : i % 2 === 0 ? 'Vertical Transport' : 'Aquatics',
  status: Math.random() > 0.2 ? 'Operational' : 'Maintenance Required',
  floor: `${Math.floor(Math.random() * 10) + 1}`,
  wing: Math.random() > 0.5 ? 'East' : 'West',
  lastService: '2024-02-15',
  health: Math.floor(Math.random() * 30) + 70,
}));

// --- Components ---

const GlassCard = ({ children, className, hover = true }: { children: React.ReactNode, className?: string, hover?: boolean }) => (
  <div className={cn(
    "relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-xl transition-all duration-300",
    hover && "hover:bg-slate-900/60 hover:border-white/20 hover:shadow-2xl hover:shadow-indigo-500/10",
    className
  )}>
    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
    {children}
  </div>
);

const Badge = ({ children, variant = 'default' }: { children: React.ReactNode, variant?: 'default' | 'urgent' | 'high' | 'medium' | 'low' | 'success' }) => {
  const variants = {
    default: "bg-slate-800 text-slate-300 border-slate-700",
    urgent: "bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]",
    high: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    medium: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    low: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  };
  return (
    <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border", variants[variant])}>
      {children}
    </span>
  );
};

const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active?: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-200 group",
      active ? "bg-indigo-600/10 text-indigo-400" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
    )}
  >
    <Icon className={cn("w-5 h-5", active ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300")} />
    <span className="font-medium text-sm">{label}</span>
    {active && <motion.div layoutId="active-pill" className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.5)]" />}
  </button>
);

// --- Screens ---

const Dashboard = () => (
  <div className="space-y-8 animate-in fade-in duration-700">
    {/* Hero Widgets */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <GlassCard className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 bg-indigo-500/10 rounded-lg">
            <Ticket className="w-6 h-6 text-indigo-400" />
          </div>
          <span className="text-xs font-mono text-slate-500">+12% vs LW</span>
        </div>
        <div className="flex items-end gap-2">
          <h3 className="text-4xl font-bold text-white tracking-tight">42</h3>
          <div className="mb-1 flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
            <span className="text-[10px] text-red-400 font-bold uppercase">8 Urgent</span>
          </div>
        </div>
        <p className="text-sm text-slate-400 mt-2">Active Maintenance Tickets</p>
      </GlassCard>

      <GlassCard className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <Activity className="w-6 h-6 text-emerald-400" />
          </div>
          <span className="text-xs font-mono text-slate-500">99.8% Uptime</span>
        </div>
        <div className="flex items-end gap-2">
          <h3 className="text-4xl font-bold text-white tracking-tight">94%</h3>
          <div className="mb-1">
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
          </div>
        </div>
        <p className="text-sm text-slate-400 mt-2">Global Asset Health Index</p>
      </GlassCard>

      <GlassCard className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 bg-amber-500/10 rounded-lg">
            <User className="w-6 h-6 text-amber-400" />
          </div>
          <span className="text-xs font-mono text-slate-500">12 On-Shift</span>
        </div>
        <div className="flex items-end gap-2">
          <h3 className="text-4xl font-bold text-white tracking-tight">85%</h3>
        </div>
        <p className="text-sm text-slate-400 mt-2">Technician Utilization</p>
      </GlassCard>

      <GlassCard className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 bg-slate-500/10 rounded-lg">
            <Zap className="w-6 h-6 text-slate-400" />
          </div>
          <span className="text-xs font-mono text-slate-500">Est. $1.2k</span>
        </div>
        <div className="flex items-end gap-2">
          <h3 className="text-4xl font-bold text-white tracking-tight">2.4h</h3>
        </div>
        <p className="text-sm text-slate-400 mt-2">Avg. Resolution Time</p>
      </GlassCard>
    </div>

    {/* Charts & Feed */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <GlassCard className="lg:col-span-2 p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-xl font-bold text-white">Operations Intelligence</h3>
            <p className="text-sm text-slate-400">Ticket volume trends over the last 24 hours</p>
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 text-xs font-medium bg-white/5 text-slate-300 rounded-lg hover:bg-white/10 transition-colors">24h</button>
            <button className="px-3 py-1.5 text-xs font-medium text-slate-500 rounded-lg hover:bg-white/5 transition-colors">7d</button>
          </div>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={TICKET_TRENDS}>
              <defs>
                <linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#f8fafc' }}
                itemStyle={{ color: '#818cf8' }}
              />
              <Area type="monotone" dataKey="tickets" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorTickets)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      <GlassCard className="p-8">
        <h3 className="text-xl font-bold text-white mb-6">Live Operations Stream</h3>
        <div className="space-y-6">
          {RECENT_TICKETS.map((ticket, i) => (
            <motion.div 
              key={ticket.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-start gap-4 group cursor-pointer"
            >
              <div className={cn(
                "mt-1 w-2 h-2 rounded-full shrink-0",
                ticket.priority === 'Urgent' ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" : 
                ticket.priority === 'High' ? "bg-amber-500" : "bg-indigo-500"
              )} />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <h4 className="text-sm font-semibold text-slate-200 truncate group-hover:text-indigo-400 transition-colors">{ticket.title}</h4>
                  <span className="text-[10px] font-mono text-slate-500 whitespace-nowrap">{ticket.time}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">{ticket.id}</span>
                  <span className="text-[10px] text-slate-600">•</span>
                  <span className="text-[10px] text-slate-400">{ticket.tech}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        <button className="w-full mt-8 py-3 text-xs font-bold text-indigo-400 border border-indigo-500/20 rounded-xl hover:bg-indigo-500/5 transition-all">
          View All Activity
        </button>
      </GlassCard>
    </div>
  </div>
);

const ControlCenter = () => {
  const [search, setSearch] = useState('');
  
  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">The Control Center</h2>
          <p className="text-slate-400">Manage and monitor 20,482 active maintenance assets</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
            <input 
              type="text" 
              placeholder="Search tickets, assets, or tech... (⌘K)"
              className="bg-slate-900/50 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 w-full md:w-[320px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-slate-500 font-mono">⌘K</div>
          </div>
          <button className="p-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-bottom border-white/5 bg-white/2">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ticket ID</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Asset & Location</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Priority</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Assignee</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {RECENT_TICKETS.map((ticket, i) => (
                <motion.tr 
                  key={ticket.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group hover:bg-white/2 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-5">
                    <span className="text-sm font-mono text-indigo-400 font-medium">{ticket.id}</span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">{ticket.title}</span>
                      <span className="text-xs text-slate-500">Floor 4 • Wing B</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <Badge variant={ticket.priority.toLowerCase() as any}>{ticket.priority}</Badge>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        ticket.status === 'In Progress' ? "bg-indigo-400 animate-pulse" : 
                        ticket.status === 'Closed' ? "bg-emerald-400" : "bg-amber-400"
                      )} />
                      <span className="text-sm text-slate-300">{ticket.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <img src={`https://i.pravatar.cc/150?u=${ticket.tech}`} className="w-6 h-6 rounded-full border border-white/10" alt="" />
                      <span className="text-sm text-slate-300">{ticket.tech}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button className="p-2 text-slate-500 hover:text-white transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-white/5 bg-white/2 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">Showing 1-20 of 20,482 tickets</span>
          <div className="flex gap-2">
            <button className="px-3 py-1 text-xs font-bold text-slate-400 border border-white/10 rounded-lg hover:bg-white/5 disabled:opacity-50" disabled>Previous</button>
            <button className="px-3 py-1 text-xs font-bold text-white border border-white/10 rounded-lg hover:bg-white/5">Next</button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

const AssetDossier = () => (
  <div className="space-y-8 animate-in zoom-in-95 duration-700">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
          <Zap className="w-8 h-8 text-indigo-400" />
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold text-white tracking-tight">Carrier Chiller Unit 4</h2>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Operational</span>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-1 text-slate-500 font-mono text-xs">
            <span>AST-1024</span>
            <span>•</span>
            <span>HVAC Systems</span>
            <span>•</span>
            <span>Floor 10, Mechanical Room B</span>
          </div>
        </div>
      </div>
      <div className="flex gap-3">
        <button className="px-4 py-2 bg-slate-900/50 border border-white/10 rounded-xl text-sm font-bold text-slate-300 hover:text-white hover:bg-white/5 transition-all">Export Report</button>
        <button className="px-4 py-2 bg-indigo-600 rounded-xl text-sm font-bold text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 transition-all">Schedule Service</button>
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Specs Bento */}
      <div className="lg:col-span-2 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GlassCard className="p-6">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Technical Specifications</h3>
            <div className="grid grid-cols-2 gap-y-4 gap-x-8">
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold">Model</p>
                <p className="text-sm text-slate-200 font-medium">AquaEdge 19XR</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold">Capacity</p>
                <p className="text-sm text-slate-200 font-medium">800 Tons</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold">Refrigerant</p>
                <p className="text-sm text-slate-200 font-medium">R-134a</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold">Voltage</p>
                <p className="text-sm text-slate-200 font-medium">460V / 3Ph / 60Hz</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold">Install Date</p>
                <p className="text-sm text-slate-200 font-medium">Oct 12, 2021</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold">Warranty Exp.</p>
                <p className="text-sm text-slate-200 font-medium">Oct 12, 2026</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Real-time Telemetry</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Thermometer className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm text-slate-300">Discharge Temp</span>
                </div>
                <span className="text-sm font-mono text-white">42.4°F</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Droplets className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm text-slate-300">Oil Pressure</span>
                </div>
                <span className="text-sm font-mono text-white">124 PSI</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Activity className="w-4 h-4 text-amber-400" />
                  <span className="text-sm text-slate-300">Compressor Load</span>
                </div>
                <span className="text-sm font-mono text-white">68%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Wind className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-300">Flow Rate</span>
                </div>
                <span className="text-sm font-mono text-white">1,200 GPM</span>
              </div>
            </div>
          </GlassCard>
        </div>

        <GlassCard className="p-6">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6">Vendor & Support</h3>
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <span className="text-2xl font-bold text-indigo-400">C</span>
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-bold text-white">Carrier Global Service</h4>
              <p className="text-sm text-slate-400">Primary HVAC Maintenance Partner</p>
            </div>
            <div className="flex gap-2">
              <button className="p-3 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-indigo-400 transition-all">
                <Phone className="w-5 h-5" />
              </button>
              <button className="p-3 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-indigo-400 transition-all">
                <Mail className="w-5 h-5" />
              </button>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Timeline */}
      <GlassCard className="p-8">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-8">Maintenance Timeline</h3>
        <div className="space-y-8 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-white/5">
          <div className="relative pl-8">
            <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-slate-900 border-2 border-indigo-500 z-10 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-indigo-500" />
            </div>
            <p className="text-[10px] font-mono text-slate-500 uppercase">Feb 15, 2024</p>
            <h4 className="text-sm font-bold text-slate-200">Quarterly Preventative Maintenance</h4>
            <p className="text-xs text-slate-500 mt-1">Filter replacement, oil analysis, and sensor calibration completed by David R.</p>
          </div>
          <div className="relative pl-8">
            <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-slate-900 border-2 border-red-500 z-10 flex items-center justify-center">
              <AlertCircle className="w-3 h-3 text-red-500" />
            </div>
            <p className="text-[10px] font-mono text-slate-500 uppercase">Jan 02, 2024</p>
            <h4 className="text-sm font-bold text-red-400">Critical Failure: Sensor Fault</h4>
            <p className="text-xs text-slate-500 mt-1">Unit tripped on low pressure. Replaced faulty pressure transducer. Downtime: 4.2h.</p>
          </div>
          <div className="relative pl-8">
            <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-slate-900 border-2 border-slate-700 z-10 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-slate-700" />
            </div>
            <p className="text-[10px] font-mono text-slate-500 uppercase">Nov 12, 2023</p>
            <h4 className="text-sm font-bold text-slate-400">Annual Inspection</h4>
            <p className="text-xs text-slate-500 mt-1">Full system audit. All parameters within nominal range. Efficiency rating: 98%.</p>
          </div>
        </div>
      </GlassCard>
    </div>
  </div>
);

const NewRequestModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [urgency, setUrgency] = useState('Medium');
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (query.length > 2) {
      setSearching(true);
      const timer = setTimeout(() => setSearching(false), 800);
      return () => clearTimeout(timer);
    }
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-xl"
      >
        <GlassCard className="p-8 shadow-2xl border-white/20" hover={false}>
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white">New Maintenance Request</h2>
              <p className="text-slate-400 text-sm">Intelligent dispatch system</p>
            </div>
            <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Asset Identification</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Search 20,482 assets..."
                  className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                {searching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-[10px] text-slate-500 font-mono">Indexing...</span>
                  </div>
                )}
              </div>
              {query.length > 2 && !searching && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mt-2 p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-lg">
                  <p className="text-[10px] text-indigo-400 font-bold uppercase">3 Results Found</p>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center justify-between p-2 hover:bg-white/5 rounded cursor-pointer transition-colors">
                      <span className="text-xs text-slate-300">Carrier Chiller Unit 4 (AST-1024)</span>
                      <ChevronRight className="w-3 h-3 text-slate-600" />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Urgency Level</label>
              <div className="grid grid-cols-4 gap-2">
                {['Low', 'Medium', 'High', 'Urgent'].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setUrgency(level)}
                    className={cn(
                      "py-2.5 rounded-xl text-xs font-bold transition-all border",
                      urgency === level 
                        ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20" 
                        : "bg-slate-900/50 border-white/10 text-slate-500 hover:text-slate-300 hover:bg-white/5"
                    )}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Issue Description</label>
              <textarea 
                rows={3}
                placeholder="Describe the maintenance requirement in detail..."
                className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 px-4 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all resize-none"
              />
            </div>

            <button className="group relative w-full py-4 bg-indigo-600 rounded-xl font-bold text-white overflow-hidden transition-all hover:bg-indigo-500 hover:scale-[1.01] active:scale-[0.99] shadow-xl shadow-indigo-500/20">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
              Submit Maintenance Request
            </button>
          </form>
        </GlassCard>
      </motion.div>
    </div>
  );
};

// --- Main Layout ---

export default function App() {
  const [activeScreen, setActiveScreen] = useState('dashboard');
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 font-sans selection:bg-indigo-500/30">
      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/5 blur-[120px] rounded-full" />
      </div>

      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 bottom-0 z-40 bg-slate-950/40 backdrop-blur-2xl border-r border-white/5 transition-all duration-500 ease-in-out",
        isSidebarOpen ? "w-72" : "w-20"
      )}>
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Shield className="w-6 h-6 text-white" />
            </div>
            {isSidebarOpen && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xl font-bold text-white tracking-tight">LuxMaintain</motion.span>
            )}
          </div>

          <nav className="flex-1 space-y-2">
            <SidebarItem icon={LayoutDashboard} label="Intelligence" active={activeScreen === 'dashboard'} onClick={() => setActiveScreen('dashboard')} />
            <SidebarItem icon={Ticket} label="Control Center" active={activeScreen === 'control'} onClick={() => setActiveScreen('control')} />
            <SidebarItem icon={Box} label="Asset Dossier" active={activeScreen === 'assets'} onClick={() => setActiveScreen('assets')} />
            <div className="pt-4 pb-2">
              <div className={cn("h-px bg-white/5", isSidebarOpen ? "mx-4" : "mx-2")} />
            </div>
            <SidebarItem icon={Settings} label="Configuration" onClick={() => {}} />
            <SidebarItem icon={LogOut} label="Sign Out" onClick={() => {}} />
          </nav>

          <div className="mt-auto">
            <GlassCard className="p-4" hover={false}>
              <div className="flex items-center gap-3">
                <img src="https://i.pravatar.cc/150?u=admin" className="w-10 h-10 rounded-xl border border-white/10" alt="" />
                {isSidebarOpen && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <p className="text-sm font-bold text-white">Tamar A.</p>
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Chief Engineer</p>
                  </motion.div>
                )}
              </div>
            </GlassCard>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "transition-all duration-500 min-h-screen pb-20",
        isSidebarOpen ? "pl-72" : "pl-20"
      )}>
        {/* Header */}
        <header className="sticky top-0 z-30 px-8 py-6 flex items-center justify-between bg-[#050505]/60 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-slate-500 hover:text-white transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <span>LuxMaintain</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-slate-300 capitalize">{activeScreen}</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">System Optimal</span>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2.5 text-slate-400 hover:text-white relative transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full border-2 border-[#050505]" />
              </button>
              <button 
                onClick={() => setIsNewRequestOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 rounded-xl text-sm font-bold text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                New Request
              </button>
            </div>
          </div>
        </header>

        {/* Screen Content */}
        <div className="px-8 max-w-[1600px] mx-auto">
          <AnimatePresence mode="wait">
            {activeScreen === 'dashboard' && <Dashboard key="dashboard" />}
            {activeScreen === 'control' && <ControlCenter key="control" />}
            {activeScreen === 'assets' && <AssetDossier key="assets" />}
          </AnimatePresence>
        </div>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {isNewRequestOpen && (
          <NewRequestModal isOpen={isNewRequestOpen} onClose={() => setIsNewRequestOpen(false)} />
        )}
      </AnimatePresence>

      {/* Global CSS for shimmer animation */}
      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}
