import { Activity, BookOpen, Check, Cpu, Hash, Layers, Play, Target, X } from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';
import { ALGORITHMS, formatPct, frameAddress } from '../lib/algorithms';
import { ReferenceString } from '../components/SimulationViews';
import { StatCard, StatusPill } from '../components/ui';
import EmptyState from '../components/EmptyState';

export default function Dashboard({ onNavigate }) {
  const { config, isConfigured, summary, comparison, status, steps, pages } = useSimulation();
  const dash = (v) => (isConfigured ? v : '—');
  const finalStep = steps[steps.length - 1];
  const saved = comparison.FIFO.faults - comparison.OPTIMAL.faults;

  return (
    <div className="space-y-6">
      {/* Hero: the final memory state is the centrepiece */}
      <section className="card relative overflow-hidden p-6 sm:p-8 lg:p-10">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/4 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />

        <div className="relative grid items-center gap-8 lg:grid-cols-[1.25fr_1fr]">
          <div>
            <h2 className="max-w-xl text-3xl font-bold leading-tight tracking-tight text-slate-900 sm:text-4xl lg:text-5xl dark:text-white">
              Page Replacement Algorithm Simulator
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600 dark:text-slate-300">
              Visualize how operating systems manage physical memory and handle page faults using FIFO and Optimal page replacement algorithms.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" className="btn-primary" onClick={() => onNavigate('simulator')}>
                <Play size={16} /> Start Simulation
              </button>
              <button type="button" className="btn-secondary" onClick={() => onNavigate('learn')}>
                <BookOpen size={16} /> Learn Page Replacement
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-slate-950/60">
            <div className="mb-3 flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-300">
                <Cpu size={14} className="text-cyan-500" /> Physical memory after the run
              </span>
              <span className="muted">{isConfigured ? ALGORITHMS[config.algorithm].name : 'Not run yet'}</span>
            </div>
            {!isConfigured && (
              <p className="muted rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm dark:border-white/10">
                Memory frames appear here after you run your own simulation.
              </p>
            )}
            <div className="space-y-2">
              {(finalStep ? finalStep.frames : Array(config.frameCount).fill(null)).map((p, f) => (
                <div key={f} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-white/5">
                  <span className="w-16 text-xs text-slate-500 dark:text-slate-400">Frame {f + 1}</span>
                  <span className="font-mono text-xs text-slate-400">{frameAddress(f)}</span>
                  <span className="ml-auto font-mono text-lg font-semibold text-indigo-600 dark:text-cyan-300">{p === null ? '—' : `P${p}`}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Hash} label="Total page references" value={dash(summary.total)} hint="Length of the reference string" tone="indigo" />
        <StatCard icon={X} label="Page faults" value={dash(summary.faults)} hint={isConfigured ? `${formatPct(summary.faultRatio)} fault rate` : 'Pages loaded from disk'} tone="rose" />
        <StatCard icon={Check} label="Page hits" value={dash(summary.hits)} hint="Pages already in memory" tone="emerald" />
        <StatCard icon={Target} label="Hit ratio" value={dash(formatPct(summary.hitRatio))} hint="Hits ÷ total references" tone="cyan">
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-700" style={{ width: `${summary.hitRatio}%` }} />
          </div>
        </StatCard>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="card p-5">
          <p className="muted text-sm font-medium">Current algorithm</p>
          <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">{isConfigured ? ALGORITHMS[config.algorithm].full : 'Not selected'}</p>
          <p className="muted mt-1 text-xs">Change it on the Simulator page.</p>
        </div>
        <div className="card p-5">
          <p className="muted flex items-center gap-2 text-sm font-medium"><Layers size={16} /> Number of frames</p>
          <div className="mt-3 flex gap-1.5">
            {Array.from({ length: config.frameCount }, (_, i) => (
              <span key={i} className="h-8 flex-1 rounded-md border border-indigo-400/40 bg-indigo-500/10" />
            ))}
          </div>
          <p className="muted mt-2 text-xs">{isConfigured ? `${config.frameCount} physical frame${config.frameCount > 1 ? 's' : ''} available to the process` : 'Not set'}</p>
        </div>
        <div className="card p-5">
          <p className="muted flex items-center gap-2 text-sm font-medium"><Activity size={16} /> Simulation status</p>
          <div className="mt-3"><StatusPill status={status} /></div>
          <p className="muted mt-2 text-xs">
            {isConfigured ? 'These stats come from the data you entered.' : 'Waiting for your input in the Simulator.'}
          </p>
        </div>
      </section>

      {!isConfigured ? (
        <EmptyState onNavigate={onNavigate} />
      ) : (
      <section className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="card-title">Reference string</h3>
            <span className="muted text-xs">Red = fault, green = hit</span>
          </div>
          <ReferenceString pages={pages} steps={steps} currentStep={steps.length - 1} />
        </div>
        <div className="card p-5">
          <h3 className="card-title">FIFO vs Optimal on this string</h3>
          <div className="mt-4 space-y-3">
            {[
              { key: 'FIFO', color: 'bg-indigo-500' },
              { key: 'OPTIMAL', color: 'bg-cyan-400' },
            ].map(({ key, color }) => (
              <div key={key}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{ALGORITHMS[key].name}</span>
                  <span className="font-mono">{comparison[key].faults} faults</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                  <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${comparison[key].faultRatio}%` }} />
                </div>
              </div>
            ))}
          </div>
          <p className="muted mt-4 text-sm">
            {saved > 0 ? `Optimal avoids ${saved} page fault${saved > 1 ? 's' : ''} that FIFO takes.` : 'Both algorithms produce the same number of faults here.'}
          </p>
          <button type="button" className="btn-secondary mt-4 w-full" onClick={() => onNavigate('performance')}>See full comparison</button>
        </div>
      </section>
      )}
    </div>
  );
}
