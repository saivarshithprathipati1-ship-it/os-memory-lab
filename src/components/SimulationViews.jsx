import { ArrowRight, Check, Info, X } from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';
import { ResultBadge } from './ui';

/** Reference string as boxes: 7 → 0 → 1 → ... Clicking a box jumps to that step. */
export function ReferenceString({ pages, steps, currentStep, onSelect }) {
  return (
    <div className="flex flex-wrap items-center gap-y-7 pb-4">
      {pages.map((page, i) => {
        const done = i <= currentStep;
        const isCurrent = i === currentStep;
        const hit = done && steps[i].hit;
        let tone = 'border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300';
        if (done) {
          tone = hit
            ? 'border-emerald-400/60 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
            : 'border-rose-400/60 bg-rose-500/10 text-rose-700 dark:text-rose-300';
        }
        return (
          <div key={i} className="flex items-center">
            <button
              type="button"
              onClick={onSelect ? () => onSelect(i) : undefined}
              disabled={!onSelect}
              title={done ? `Reference #${i + 1}: page ${page} (${hit ? 'hit' : 'fault'})` : `Reference #${i + 1}: page ${page}`}
              className={`relative flex h-11 w-11 items-center justify-center rounded-xl border font-mono text-lg font-semibold transition sm:h-12 sm:w-12 ${tone} ${
                isCurrent ? 'scale-110 ring-2 ring-indigo-500 ring-offset-2 ring-offset-white dark:ring-cyan-400 dark:ring-offset-ink' : ''
              } ${onSelect ? 'cursor-pointer hover:-translate-y-0.5' : 'cursor-default'}`}
            >
              {page}
              <span className="absolute -bottom-5 text-[10px] font-medium text-slate-400">{i + 1}</span>
            </button>
            {i < pages.length - 1 && <ArrowRight size={14} className="mx-1 shrink-0 text-slate-300 dark:text-slate-600" />}
          </div>
        );
      })}
    </div>
  );
}

/** Classic textbook table: one column per reference, one row per frame. */
export function FrameTable({ pages, steps, currentStep, frameCount }) {
  const headCell = 'sticky left-0 z-10 bg-white px-2 text-left text-xs font-semibold text-slate-500 dark:bg-slate-900 dark:text-slate-400';
  return (
    <div className="overflow-x-auto">
      <table className="border-separate border-spacing-1.5 font-mono text-sm">
        <thead>
          <tr>
            <th className={headCell}>Ref</th>
            {pages.map((p, i) => (
              <th
                key={i}
                className={`h-9 min-w-[2.5rem] rounded-lg text-center font-semibold ${
                  i === currentStep ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {p}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: frameCount }, (_, f) => (
            <tr key={f}>
              <th className={headCell}>F{f + 1}</th>
              {pages.map((_, i) => {
                if (i > currentStep) {
                  return <td key={i} className="h-10 min-w-[2.5rem] rounded-lg border border-dashed border-slate-200 dark:border-white/5" />;
                }
                const step = steps[i];
                const value = step.frames[f];
                const changed = step.slot === f;
                let tone = 'bg-slate-100 text-slate-700 dark:bg-white/5 dark:text-slate-300';
                if (value === null) tone = 'text-slate-300 dark:text-slate-700';
                if (changed) {
                  tone = step.hit
                    ? 'bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-500/50 dark:text-emerald-300'
                    : 'bg-rose-500/15 text-rose-700 ring-1 ring-rose-500/50 dark:text-rose-300';
                }
                return (
                  <td
                    key={i}
                    className={`h-10 min-w-[2.5rem] rounded-lg text-center font-semibold ${tone} ${
                      changed && i === currentStep ? 'animate-pop' : ''
                    }`}
                  >
                    {value ?? '–'}
                  </td>
                );
              })}
            </tr>
          ))}
          <tr>
            <th className={headCell}>Result</th>
            {pages.map((_, i) => (
              <td key={i} className="h-9 text-center">
                {i <= currentStep &&
                  (steps[i].hit ? (
                    <Check size={16} className="mx-auto text-emerald-500" aria-label="Hit" />
                  ) : (
                    <X size={16} className="mx-auto text-rose-500" aria-label="Page fault" />
                  ))}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function TableLegend() {
  return (
    <div className="muted flex flex-wrap gap-4 text-xs">
      <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-rose-500/30 ring-1 ring-rose-500/60" /> Page loaded (fault)</span>
      <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-emerald-500/30 ring-1 ring-emerald-500/60" /> Page found (hit)</span>
      <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-slate-300 dark:bg-white/10" /> Unchanged</span>
    </div>
  );
}

/** Plain-language explanation of the current step, plus the data the algorithm used to decide. */
export function StepInsight() {
  const { current, config, pages } = useSimulation();

  if (!current) {
    return (
      <div className="card flex items-start gap-3 p-5 text-sm">
        <Info size={18} className="mt-0.5 shrink-0 text-indigo-500" />
        <p className="muted">Press <strong className="text-slate-700 dark:text-slate-200">Run simulation</strong> to play every step, or <strong className="text-slate-700 dark:text-slate-200">Step</strong> to go one reference at a time. Each decision is explained here.</p>
      </div>
    );
  }

  const isFifo = config.algorithm === 'FIFO';

  return (
    <div key={current.index} className={`card animate-rise border-l-4 p-5 ${current.hit ? 'border-l-emerald-500' : 'border-l-rose-500'}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">
          Step {current.index + 1} of {pages.length}: page <span className="font-mono">{current.page}</span>
        </p>
        <ResultBadge hit={current.hit} />
      </div>
      <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{current.explanation}</p>

      <div className="mt-4 border-t border-slate-200 pt-4 dark:border-white/10">
        {isFifo ? (
          <>
            <p className="muted mb-2 text-xs">FIFO queue, oldest on the left. The leftmost page is replaced next.</p>
            <div className="flex flex-wrap items-center gap-2">
              {current.queue.map((p, i) => (
                <span
                  key={`${p}-${i}`}
                  className={`rounded-lg px-3 py-1.5 font-mono text-sm font-semibold ${
                    i === 0 ? 'bg-amber-500/15 text-amber-700 ring-1 ring-amber-500/40 dark:text-amber-300' : 'bg-slate-100 dark:bg-white/5'
                  }`}
                >
                  {p}
                </span>
              ))}
            </div>
          </>
        ) : (
          <>
            <p className="muted mb-2 text-xs">When each page in memory is needed next. The page needed furthest away (or never) is replaced on the next fault.</p>
            <div className="flex flex-wrap gap-2">
              {current.frames.map((p, f) =>
                p === null ? null : (
                  <span key={f} className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs dark:bg-white/5">
                    <span className="font-mono text-sm font-semibold">{p}</span>
                    <span className="muted ml-2">{current.nextUse[f] === -1 ? 'never again' : `next at #${current.nextUse[f] + 1}`}</span>
                  </span>
                ),
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
