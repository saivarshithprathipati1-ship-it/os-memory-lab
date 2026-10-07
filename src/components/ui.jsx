import { Check, Pause, Play, RotateCcw, SkipBack, SkipForward, X } from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';

export const STATUS_META = {
  ready: { label: 'Ready', dot: 'bg-cyan-500', pill: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300' },
  running: { label: 'Running', dot: 'bg-indigo-500 animate-pulse', pill: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300' },
  paused: { label: 'Paused', dot: 'bg-amber-500', pill: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300' },
  completed: { label: 'Completed', dot: 'bg-emerald-500', pill: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' },
};

export function StatusPill({ status }) {
  const meta = STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${meta.pill}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

export function ResultBadge({ hit, large = false }) {
  const size = large ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs';
  return hit ? (
    <span className={`inline-flex items-center gap-1 rounded-full bg-emerald-500/15 font-semibold text-emerald-700 dark:text-emerald-300 ${size}`}>
      <Check size={large ? 16 : 12} /> Hit
    </span>
  ) : (
    <span className={`inline-flex items-center gap-1 rounded-full bg-rose-500/15 font-semibold text-rose-700 dark:text-rose-300 ${size}`}>
      <X size={large ? 16 : 12} /> Page fault
    </span>
  );
}

export function PageHeader({ icon: Icon, title, subtitle, right }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-300">
          <Icon size={22} />
        </span>
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">{title}</h2>
          {subtitle && <p className="muted text-sm">{subtitle}</p>}
        </div>
      </div>
      {right}
    </div>
  );
}

const TONES = {
  indigo: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-300',
  rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-300',
  emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
  cyan: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-300',
  amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-300',
};

export function StatCard({ icon: Icon, label, value, hint, tone = 'indigo', children }) {
  return (
    <div className="card p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <p className="muted text-sm font-medium">{label}</p>
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${TONES[tone]}`}>
          <Icon size={18} />
        </span>
      </div>
      <p className="mt-2 font-mono text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">{value}</p>
      {hint && <p className="muted mt-1 text-xs">{hint}</p>}
      {children}
    </div>
  );
}

export function SpeedSelector({ disabled = false }) {
  const { speed, setSpeed } = useSimulation();
  return (
    <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-white/10 dark:bg-slate-950/60" role="radiogroup" aria-label="Animation speed">
      {['slow', 'medium', 'fast'].map((s) => (
        <button
          key={s}
          type="button"
          role="radio"
          aria-checked={speed === s}
          disabled={disabled}
          onClick={() => setSpeed(s)}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${
            speed === s
              ? 'bg-indigo-600 text-white shadow'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          {s}
        </button>
      ))}
    </div>
  );
}

// Play / pause / step controls that work on the currently applied configuration.
export function PlaybackControls() {
  const { status, run, pause, stepForward, stepBack, reset, currentStep, isConfigured } = useSimulation();
  const running = status === 'running';
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" className="btn-icon" onClick={stepBack} disabled={running || currentStep < 0} title="Previous step" aria-label="Previous step">
        <SkipBack size={16} />
      </button>
      <button type="button" className="btn-primary" onClick={() => (running ? pause() : run())} disabled={!isConfigured}>
        {running ? <Pause size={16} /> : <Play size={16} />}
        {running ? 'Pause' : status === 'paused' ? 'Resume' : 'Play'}
      </button>
      <button type="button" className="btn-icon" onClick={() => stepForward()} disabled={running || !isConfigured} title="Next step" aria-label="Next step">
        <SkipForward size={16} />
      </button>
      <button type="button" className="btn-icon" onClick={reset} disabled={!isConfigured} title="Reset to step 0" aria-label="Reset">
        <RotateCcw size={16} />
      </button>
      <SpeedSelector />
    </div>
  );
}
