import { ArrowDownToLine, HardDrive, MemoryStick, TableProperties } from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';
import { frameAddress } from '../lib/algorithms';
import { ReferenceString, StepInsight } from '../components/SimulationViews';
import { PageHeader, PlaybackControls, ResultBadge } from '../components/ui';
import EmptyState from '../components/EmptyState';

const SLOT_STYLES = {
  empty: 'border-dashed border-slate-300 dark:border-white/10',
  resident: 'border-slate-200 bg-white dark:border-white/10 dark:bg-white/5',
  loaded: 'border-rose-400/60 bg-rose-500/10 shadow-lg shadow-rose-500/10',
  hit: 'border-emerald-400/60 bg-emerald-500/10 shadow-lg shadow-emerald-500/10',
};

export default function MemoryVisualization({ onNavigate }) {
  const { current, config, isConfigured, pages, steps, currentStep, goTo, status } = useSimulation();
  const frames = current ? current.frames : Array(config.frameCount).fill(null);
  const isFifo = config.algorithm === 'FIFO';
  const memoryFull = frames.every((p) => p !== null);
  const uniquePages = [...new Set(pages)].sort((a, b) => a - b);

  const slotMeta = (f, page) => {
    if (!current || page === null) return '';
    if (isFifo) {
      const pos = current.queueSlots.indexOf(f);
      if (pos === 0 && memoryFull) return 'Oldest, replaced next';
      return `Loaded ${ordinal(pos + 1)}`;
    }
    const next = current.nextUse[f];
    return next === -1 ? 'Never used again' : `Next used at #${next + 1}`;
  };

  if (!isConfigured) {
    return (
      <div className="space-y-6">
        <PageHeader icon={MemoryStick} title="Memory Visualization" subtitle="Follow a page request from the CPU into physical memory, one reference at a time." />
        <EmptyState onNavigate={onNavigate} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={MemoryStick}
        title="Memory Visualization"
        subtitle="Follow a page request from the CPU into physical memory, one reference at a time."
        right={<PlaybackControls />}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr_1fr]">
        {/* Incoming request */}
        <div className="card flex flex-col p-5">
          <h3 className="card-title flex items-center gap-2"><ArrowDownToLine size={18} className="text-indigo-500" /> CPU requests</h3>
          {current ? (
            <div key={current.index} className="flex flex-1 flex-col items-center justify-center gap-3 py-8">
              <span className="muted text-xs">Reference #{current.index + 1}</span>
              <span className="animate-pop font-mono text-6xl font-bold text-indigo-600 dark:text-cyan-300">P{current.page}</span>
              <ResultBadge hit={current.hit} large />
            </div>
          ) : (
            <p className="muted flex flex-1 items-center justify-center py-8 text-center text-sm">Press Play or the next-step button to send the first page request.</p>
          )}
          <div className="grid grid-cols-2 gap-2 text-center text-xs">
            <div className="rounded-xl bg-rose-500/10 p-2">
              <p className="font-mono text-xl font-semibold text-rose-600 dark:text-rose-400">{current ? current.faults : 0}</p>
              <p className="muted">Faults</p>
            </div>
            <div className="rounded-xl bg-emerald-500/10 p-2">
              <p className="font-mono text-xl font-semibold text-emerald-600 dark:text-emerald-400">{current ? current.hits : 0}</p>
              <p className="muted">Hits</p>
            </div>
          </div>
        </div>

        {/* Physical memory */}
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="card-title flex items-center gap-2"><MemoryStick size={18} className="text-cyan-500" /> Physical memory (RAM)</h3>
            <span className="muted text-xs">{config.frameCount} × 4 KB frames</span>
          </div>
          <div className="space-y-2.5 rounded-2xl bg-gradient-to-b from-indigo-500/5 to-cyan-500/5 p-3 ring-1 ring-inset ring-indigo-500/10">
            {frames.map((page, f) => {
              const changed = current && current.slot === f;
              let state = page === null ? 'empty' : 'resident';
              if (changed) state = current.hit ? 'hit' : 'loaded';
              return (
                <div key={f} className={`flex items-center gap-3 rounded-xl border p-3 transition-all duration-500 ${SLOT_STYLES[state]}`}>
                  <div className="w-20 shrink-0 text-xs leading-tight">
                    <p className="font-semibold text-slate-700 dark:text-slate-200">Frame {f + 1}</p>
                    <p className="font-mono text-slate-400">{frameAddress(f)}</p>
                  </div>
                  <div
                    key={changed ? `${current.index}-${f}` : `slot-${f}`}
                    className={`flex h-12 flex-1 items-center justify-center rounded-lg font-mono ${changed ? 'animate-pop' : ''} ${
                      page === null ? 'text-sm text-slate-400 dark:text-slate-600' : 'text-2xl font-bold text-slate-900 dark:text-white'
                    }`}
                  >
                    {page === null ? 'Empty' : `P${page}`}
                  </div>
                  <p className="muted w-24 shrink-0 text-right text-[11px] leading-tight">{slotMeta(f, page)}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Evicted + page table */}
        <div className="space-y-6">
          <div className="card p-5">
            <h3 className="card-title flex items-center gap-2"><HardDrive size={18} className="text-amber-500" /> Swapped out</h3>
            {current && current.evicted !== null ? (
              <div key={current.index} className="mt-4 flex items-center gap-3">
                <span className="animate-evict rounded-xl bg-amber-500/15 px-4 py-2 font-mono text-2xl font-bold text-amber-700 line-through dark:text-amber-300">
                  P{current.evicted}
                </span>
                <p className="muted text-xs">Removed from Frame {current.slot + 1}. Written back to disk only if it was modified.</p>
              </div>
            ) : (
              <p className="muted mt-3 text-sm">{current ? 'No page was replaced in this step.' : 'Replaced pages will appear here.'}</p>
            )}
          </div>

          <div className="card p-5">
            <h3 className="card-title flex items-center gap-2"><TableProperties size={18} className="text-indigo-500" /> Page table</h3>
            <div className="mt-3 max-h-64 overflow-auto">
              <table className="w-full text-sm">
                <thead className="muted text-left text-xs">
                  <tr>
                    <th className="py-1 font-medium">Page</th>
                    <th className="py-1 font-medium">Frame</th>
                    <th className="py-1 text-right font-medium">Valid bit</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {uniquePages.map((p) => {
                    const f = frames.indexOf(p);
                    return (
                      <tr key={p} className={`border-t border-slate-100 dark:border-white/5 ${current && current.page === p ? 'bg-indigo-500/10' : ''}`}>
                        <td className="py-1.5 pl-1">P{p}</td>
                        <td className="py-1.5">{f >= 0 ? f + 1 : '—'}</td>
                        <td className={`py-1.5 pr-1 text-right font-semibold ${f >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>{f >= 0 ? 1 : 0}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="card-title mb-4">Timeline</h3>
        <ReferenceString pages={pages} steps={steps} currentStep={currentStep} onSelect={status === 'running' ? undefined : goTo} />
      </div>

      <StepInsight />
    </div>
  );
}

function ordinal(n) {
  const suffix = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (suffix[(v - 20) % 10] || suffix[v] || suffix[0]);
}
