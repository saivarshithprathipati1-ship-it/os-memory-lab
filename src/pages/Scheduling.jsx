import { useState } from 'react';
import { ChevronDown, Clock, Info, Pause, Play, Plus, RotateCcw, SkipForward, Trash2 } from 'lucide-react';
import { useScheduling, SCHED_SPEEDS } from '../context/SchedulingContext';
import { MAX_PROCESSES, PROCESS_COLORS, SCHED_ALGOS, algorithmLabel, emptyRow, fmt, schedule } from '../lib/scheduling';
import { PageHeader, StatusPill } from '../components/ui';
import { GroupedBarChart } from '../components/Charts';

const colorOf = (pid) => PROCESS_COLORS[(Number(pid.slice(1)) - 1) % PROCESS_COLORS.length];

const HOW_IT_WORKS = {
  SJF: {
    np: 'Non-preemptive SJF: whenever the CPU becomes free, it picks the arrived process with the smallest burst time and runs it to completion.',
    p: 'Preemptive SJF (SRTF): at every time unit the process with the shortest remaining time runs. A newly arrived shorter job interrupts the current one.',
  },
  PRIORITY: {
    np: 'Non-preemptive Priority: when the CPU is free, the arrived process with the highest priority (lowest number) runs to completion.',
    p: 'Preemptive Priority: if a process with a higher priority (lower number) arrives, it immediately takes the CPU from the running one.',
  },
  RR: 'Round Robin: processes wait in a FIFO ready queue. Each gets the CPU for at most one time quantum, then goes to the back of the queue if it still has work left. New arrivals join the queue before the process that was just preempted.',
};

export default function Scheduling() {
  const s = useScheduling();
  const { algorithm, preemptive, quantum, rows, error, applied, time, status, run, step, reset, clearAll } = s;
  const running = status === 'running';
  const result = applied?.result;
  const config = applied?.config;
  const done = status === 'completed';

  const updateRow = (i, field, value) => s.setRows(rows.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
  const removeRow = (i) => s.setRows(rows.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Clock}
        title="CPU Scheduling"
        subtitle="Enter your own processes and watch the CPU schedule them with SJF, Priority or Round Robin."
        right={<StatusPill status={status} />}
      />

      <p className="flex items-start gap-2 rounded-xl bg-indigo-500/10 px-4 py-3 text-sm text-indigo-800 dark:text-indigo-200">
        <Info size={16} className="mt-0.5 shrink-0" />
        CPU scheduling decides which process gets the CPU next. Page replacement (FIFO, Optimal) decides which page leaves memory. They are separate parts of the OS.
      </p>

      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        {/* ---------- Configuration ---------- */}
        <aside className="card h-fit space-y-5 p-5 xl:sticky xl:top-24">
          <div className="flex items-center justify-between">
            <h3 className="card-title">Scheduling configuration</h3>
            <button
              type="button"
              className="text-xs font-medium text-slate-500 hover:text-indigo-600 disabled:opacity-40 dark:text-slate-400 dark:hover:text-cyan-300"
              disabled={running}
              onClick={clearAll}
            >
              Clear inputs
            </button>
          </div>

          <div>
            <label htmlFor="sched-algo" className="field-label">Algorithm</label>
            <div className="relative">
              <select id="sched-algo" value={algorithm} onChange={(e) => s.setAlgorithm(e.target.value)} disabled={running} className="input appearance-none pr-10">
                <option value="" disabled>Select an algorithm</option>
                <option value="SJF">SJF (Shortest Job First)</option>
                <option value="PRIORITY">Priority</option>
                <option value="RR">Round Robin</option>
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          {(algorithm === 'SJF' || algorithm === 'PRIORITY') && (
            <div>
              <span className="field-label">Mode</span>
              <div className="grid grid-cols-2 gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-white/10 dark:bg-slate-950/60" role="radiogroup">
                {[
                  { v: false, label: 'Non-preemptive' },
                  { v: true, label: algorithm === 'SJF' ? 'Preemptive (SRTF)' : 'Preemptive' },
                ].map((m) => (
                  <button
                    key={String(m.v)}
                    type="button"
                    role="radio"
                    aria-checked={preemptive === m.v}
                    disabled={running}
                    onClick={() => s.setPreemptive(m.v)}
                    className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                      preemptive === m.v ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {algorithm === 'RR' && (
            <div>
              <label htmlFor="quantum" className="field-label">Time quantum</label>
              <input id="quantum" type="number" min={1} max={20} placeholder="e.g. 2" value={quantum} disabled={running}
                onChange={(e) => s.setQuantum(e.target.value)} className="input font-mono" />
            </div>
          )}

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="field-label !mb-0">Processes</span>
              {algorithm === 'PRIORITY' && <span className="muted text-xs">Lower number = higher priority</span>}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="muted text-left text-xs">
                  <tr>
                    <th className="pb-1 pr-2 font-medium">PID</th>
                    <th className="pb-1 pr-2 font-medium">Arrival</th>
                    <th className="pb-1 pr-2 font-medium">Burst</th>
                    {algorithm === 'PRIORITY' && <th className="pb-1 pr-2 font-medium">Priority</th>}
                    <th className="pb-1" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i}>
                      <td className="py-1 pr-2">
                        <span className="inline-flex items-center gap-1.5 font-mono font-semibold">
                          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: colorOf(`P${i + 1}`) }} />P{i + 1}
                        </span>
                      </td>
                      {['arrival', 'burst', ...(algorithm === 'PRIORITY' ? ['priority'] : [])].map((field) => (
                        <td key={field} className="py-1 pr-2">
                          <input
                            type="number"
                            min={field === 'burst' ? 1 : 0}
                            aria-label={`P${i + 1} ${field}`}
                            value={row[field]}
                            disabled={running}
                            onChange={(e) => updateRow(i, field, e.target.value)}
                            className="input !px-2 !py-1.5 text-center font-mono"
                          />
                        </td>
                      ))}
                      <td className="py-1 text-right">
                        <button type="button" className="btn-icon !h-8 !w-8" disabled={running || rows.length === 1} onClick={() => removeRow(i)} aria-label={`Remove P${i + 1}`}>
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button type="button" className="btn-secondary mt-2 w-full !py-2" disabled={running || rows.length >= MAX_PROCESSES} onClick={() => s.setRows([...rows, emptyRow()])}>
              <Plus size={16} /> Add process
            </button>
          </div>

          <div>
            <span className="field-label">Animation speed</span>
            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-white/10 dark:bg-slate-950/60" role="radiogroup">
              {Object.keys(SCHED_SPEEDS).map((sp) => (
                <button key={sp} type="button" role="radio" aria-checked={s.speed === sp} onClick={() => s.setSpeed(sp)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${s.speed === sp ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}>
                  {sp}
                </button>
              ))}
            </div>
          </div>

          {error && <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-300">{error}</p>}
          {s.hasPendingChanges && !error && (
            <p className="flex items-start gap-2 rounded-xl bg-indigo-500/10 px-3 py-2 text-xs text-indigo-700 dark:text-indigo-300">
              <Info size={14} className="mt-0.5 shrink-0" /> Changes apply when you run or step.
            </p>
          )}

          <div className="space-y-2">
            <button type="button" className="btn-primary w-full" onClick={run}>
              {running ? <Pause size={16} /> : <Play size={16} />}
              {running ? 'Pause' : status === 'paused' && !s.hasPendingChanges ? 'Resume scheduling' : 'Run Scheduling'}
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" className="btn-secondary" onClick={step} disabled={running}><SkipForward size={16} /> Step</button>
              <button type="button" className="btn-secondary" onClick={reset} disabled={!applied}><RotateCcw size={16} /> Reset</button>
            </div>
          </div>
        </aside>

        {/* ---------- Results ---------- */}
        <div className="min-w-0 space-y-6">
          {!applied ? (
            <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-300"><Clock size={22} /></span>
              <p className="font-semibold text-slate-900 dark:text-white">No processes scheduled yet</p>
              <p className="muted max-w-md text-sm">Choose an algorithm, type the arrival and burst time for each process, then press Run Scheduling or Step.</p>
            </div>
          ) : (
            <>
              <LiveStatus config={config} result={result} time={time} />
              <GanttChart result={result} time={time} />
              <ResultsTable config={config} result={result} time={time} done={done} />
              {done && <Metrics result={result} />}
              {done && <Comparison config={config} />}
              <HowItWorks config={config} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function LiveStatus({ config, result, time }) {
  const t = Math.max(time, 0);
  const slice = time > 0 ? result.timeline.find((sl) => sl.start < t && sl.end >= t) : null;
  const runningPid = slice?.pid ?? null;
  const waiting = result.results.filter((r) => r.arrival <= t && r.completion > t && r.id !== runningPid).map((r) => r.id);
  const finished = result.results.filter((r) => r.completion <= t).length;
  const progress = result.makespan ? (t / result.makespan) * 100 : 0;

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="font-medium text-slate-900 dark:text-white">{time < 0 ? 'Not started' : `Time ${t} of ${result.makespan}`}</span>
        <span className="muted text-xs">{algorithmLabel(config)} · {config.processes.length} processes</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-slate-50 p-3 dark:bg-white/5">
          <dt className="muted text-xs">On the CPU</dt>
          <dd className="mt-1 font-mono text-2xl font-semibold" style={{ color: runningPid ? colorOf(runningPid) : undefined }}>
            {time <= 0 ? '—' : runningPid ?? 'Idle'}
          </dd>
        </div>
        <div className="col-span-1 rounded-xl bg-slate-50 p-3 sm:col-span-2 dark:bg-white/5">
          <dt className="muted text-xs">Waiting (arrived, not finished)</dt>
          <dd className="mt-1 flex min-h-[2rem] flex-wrap gap-1.5">
            {time <= 0 || waiting.length === 0 ? <span className="muted text-sm">None</span> : waiting.map((pid) => (
              <span key={pid} className="rounded-md px-2 py-0.5 font-mono text-sm font-semibold text-white" style={{ background: colorOf(pid) }}>{pid}</span>
            ))}
          </dd>
        </div>
        <div className="rounded-xl bg-slate-50 p-3 dark:bg-white/5">
          <dt className="muted text-xs">Completed</dt>
          <dd className="mt-1 font-mono text-2xl font-semibold text-emerald-600 dark:text-emerald-400">{time < 0 ? 0 : finished}/{result.results.length}</dd>
        </div>
      </dl>
    </div>
  );
}

function GanttChart({ result, time }) {
  const M = result.makespan;
  const t = Math.max(time, 0);
  const marks = [...new Set([0, ...result.timeline.flatMap((sl) => [sl.start, sl.end])])].filter((m) => m <= t).sort((a, b) => a - b);

  return (
    <div className="card p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="card-title">Gantt chart</h3>
        <span className="muted text-xs">Each block shows which process used the CPU and when</span>
      </div>
      <div className="overflow-x-auto pb-2">
        <div className="relative min-w-[560px]">
          <div className="relative h-14 overflow-hidden rounded-xl border border-dashed border-slate-300 dark:border-white/10">
            {result.timeline.map((sl, i) => {
              if (sl.start >= t) return null;
              const visible = Math.min(sl.end, t) - sl.start;
              const full = visible === sl.end - sl.start;
              return (
                <div
                  key={i}
                  className={`absolute inset-y-0 flex items-center justify-center border-r-2 border-white/70 font-mono text-sm font-semibold transition-all duration-300 dark:border-ink/70 ${sl.pid ? 'text-white' : 'text-slate-500'}`}
                  style={{
                    left: `${(sl.start / M) * 100}%`,
                    width: `${(visible / M) * 100}%`,
                    background: sl.pid ? colorOf(sl.pid) : 'repeating-linear-gradient(45deg, rgba(148,163,184,0.18) 0 6px, transparent 6px 12px)',
                  }}
                  title={`${sl.pid ?? 'Idle'}: ${sl.start} → ${sl.end}`}
                >
                  {full && (sl.pid ?? 'Idle')}
                </div>
              );
            })}
          </div>
          <div className="relative mt-1 h-5">
            {marks.map((m) => (
              <span key={m} className="absolute -translate-x-1/2 font-mono text-xs text-slate-500 dark:text-slate-400" style={{ left: `${(m / M) * 100}%` }}>{m}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultsTable({ config, result, time, done }) {
  const showPriority = config.algorithm === 'PRIORITY';
  const cols = ['Completion (CT)', 'Turnaround (TAT)', 'Waiting (WT)', 'Response (RT)'];
  const keys = ['completion', 'turnaround', 'waiting', 'response'];
  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 p-5 pb-3">
        <h3 className="card-title">Process results</h3>
        <span className="muted text-xs">Values appear as each process finishes</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-sm">
          <thead className="bg-slate-50 text-left text-xs dark:bg-white/5">
            <tr className="muted">
              <th className="px-4 py-2.5 font-medium">PID</th>
              <th className="px-4 py-2.5 font-medium">Arrival</th>
              <th className="px-4 py-2.5 font-medium">Burst</th>
              {showPriority && <th className="px-4 py-2.5 font-medium">Priority</th>}
              {cols.map((c) => <th key={c} className="px-4 py-2.5 font-medium">{c}</th>)}
            </tr>
          </thead>
          <tbody className="font-mono">
            {result.results.map((r) => {
              const finished = time >= r.completion;
              return (
                <tr key={r.id} className="border-t border-slate-100 dark:border-white/5">
                  <td className="px-4 py-2.5 font-semibold" style={{ color: colorOf(r.id) }}>{r.id}</td>
                  <td className="px-4 py-2.5">{r.arrival}</td>
                  <td className="px-4 py-2.5">{r.burst}</td>
                  {showPriority && <td className="px-4 py-2.5">{r.priority}</td>}
                  {keys.map((k) => (
                    <td key={k} className={`px-4 py-2.5 ${finished ? 'animate-rise' : 'text-slate-400'}`}>{finished ? r[k] : '—'}</td>
                  ))}
                </tr>
              );
            })}
            {done && (
              <tr className="border-t-2 border-slate-200 bg-indigo-500/5 font-semibold dark:border-white/10">
                <td className="px-4 py-2.5 font-sans" colSpan={showPriority ? 5 : 4}>Average</td>
                <td className="px-4 py-2.5">{fmt(result.averages.turnaround)}</td>
                <td className="px-4 py-2.5">{fmt(result.averages.waiting)}</td>
                <td className="px-4 py-2.5">{fmt(result.averages.response)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="muted px-5 py-3 text-xs">TAT = CT − Arrival · WT = TAT − Burst · RT = first time on CPU − Arrival</p>
    </div>
  );
}

function Metrics({ result }) {
  const items = [
    { label: 'Avg waiting time', value: fmt(result.averages.waiting), tone: 'text-rose-600 dark:text-rose-400' },
    { label: 'Avg turnaround time', value: fmt(result.averages.turnaround), tone: 'text-indigo-600 dark:text-indigo-300' },
    { label: 'Avg response time', value: fmt(result.averages.response), tone: 'text-cyan-600 dark:text-cyan-300' },
    { label: 'CPU utilization', value: `${fmt(result.utilization)}%`, tone: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Throughput', value: `${fmt(result.throughput)} /unit`, tone: 'text-slate-900 dark:text-white' },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {items.map((it) => (
        <div key={it.label} className="card p-4">
          <p className="muted text-xs font-medium">{it.label}</p>
          <p className={`mt-1 font-mono text-2xl font-semibold ${it.tone}`}>{it.value}</p>
        </div>
      ))}
    </div>
  );
}

function Comparison({ config }) {
  const preemptive = config.algorithm === 'RR' ? false : config.preemptive;
  const hasPriority = config.processes.every((p) => p.priority !== null);
  const candidates = [
    { label: preemptive ? 'SRTF' : 'SJF', cfg: { algorithm: 'SJF', preemptive, quantum: null } },
    hasPriority && { label: 'Priority', cfg: { algorithm: 'PRIORITY', preemptive, quantum: null } },
    config.quantum && { label: `RR (q=${config.quantum})`, cfg: { algorithm: 'RR', preemptive: true, quantum: config.quantum } },
  ].filter(Boolean);
  const data = candidates.map((c) => {
    const r = schedule({ ...c.cfg, processes: config.processes });
    return { name: c.label, 'Avg waiting': Number(r.averages.waiting.toFixed(2)), 'Avg turnaround': Number(r.averages.turnaround.toFixed(2)) };
  });
  const missing = [!hasPriority && 'Priority (needs a priority for every process)', !config.quantum && 'Round Robin (needs a time quantum)'].filter(Boolean);

  return (
    <div className="card p-5">
      <h3 className="card-title">Compare algorithms on these processes</h3>
      <p className="muted mb-4 text-sm">Same processes, different schedulers. Lower bars are better.</p>
      <GroupedBarChart data={data} series={[{ key: 'Avg waiting', color: '#f43f5e' }, { key: 'Avg turnaround', color: '#6366f1' }]} />
      {missing.length > 0 && <p className="muted mt-3 text-xs">Not included: {missing.join('; ')}. Run that algorithm with the required values to compare it.</p>}
    </div>
  );
}

function HowItWorks({ config }) {
  const [open, setOpen] = useState(false);
  const text = config.algorithm === 'RR' ? HOW_IT_WORKS.RR : HOW_IT_WORKS[config.algorithm][config.preemptive ? 'p' : 'np'];
  return (
    <div className="card p-5">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-center justify-between text-left">
        <span className="card-title">How {SCHED_ALGOS[config.algorithm].full} works</span>
        <ChevronDown size={18} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <p className="mt-3 animate-rise text-sm leading-relaxed text-slate-600 dark:text-slate-300">{text}</p>}
    </div>
  );
}
