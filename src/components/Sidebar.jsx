import { Clock, GraduationCap, LayoutDashboard, MemoryStick, SlidersHorizontal, TrendingUp, Workflow, X } from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';
import { ALGORITHMS } from '../lib/algorithms';
import { StatusPill } from './ui';

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'simulator', label: 'Simulator', icon: SlidersHorizontal },
  { id: 'algorithms', label: 'Algorithms', icon: Workflow },
  { id: 'memory', label: 'Memory Visualization', icon: MemoryStick },
  { id: 'performance', label: 'Performance', icon: TrendingUp },
  { id: 'scheduling', label: 'CPU Scheduling', icon: Clock },
  { id: 'learn', label: 'Learn', icon: GraduationCap },
];

export default function Sidebar({ active, onNavigate, open, onClose }) {
  const { config, summary, status } = useSimulation();

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden" onClick={onClose} aria-hidden="true" />}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200/70 bg-white p-4 transition-transform duration-300 dark:border-white/10 dark:bg-[#0a1020] lg:sticky lg:top-16 lg:z-10 lg:h-[calc(100vh-4rem)] lg:w-64 lg:translate-x-0 lg:bg-transparent lg:dark:bg-transparent ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-4 flex items-center justify-between lg:hidden">
          <span className="font-semibold">OS Memory Lab</span>
          <button type="button" className="btn-icon" onClick={onClose} aria-label="Close navigation">
            <X size={18} />
          </button>
        </div>

        <nav className="space-y-1" aria-label="Main">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const isActive = active === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onNavigate(id)}
                aria-current={isActive ? 'page' : undefined}
                className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white'
                }`}
              >
                <Icon
                  size={18}
                  className={isActive ? '' : 'text-slate-400 group-hover:text-indigo-500 dark:text-slate-500 dark:group-hover:text-cyan-300'}
                />
                {label}
              </button>
            );
          })}
        </nav>

        <div className="card mt-auto space-y-3 p-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="font-medium text-slate-900 dark:text-white">Current run</span>
            <StatusPill status={status} />
          </div>
          <dl className="grid grid-cols-2 gap-y-1.5 text-xs">
            <dt className="muted">Algorithm</dt>
            <dd className="text-right font-medium">{config.algorithm ? ALGORITHMS[config.algorithm].name : '—'}</dd>
            <dt className="muted">Frames</dt>
            <dd className="text-right font-mono">{config.frameCount || '—'}</dd>
            <dt className="muted">Page faults</dt>
            <dd className="text-right font-mono">{summary.faults}</dd>
          </dl>
        </div>
      </aside>
    </>
  );
}
