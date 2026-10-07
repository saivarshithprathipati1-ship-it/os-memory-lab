// CPU scheduling algorithms. Pure functions, no React.
// Conventions: whole-number times, lower priority number = higher priority.

export const SCHED_ALGOS = {
  SJF: { id: 'SJF', name: 'SJF', full: 'Shortest Job First' },
  PRIORITY: { id: 'PRIORITY', name: 'Priority', full: 'Priority Scheduling' },
  RR: { id: 'RR', name: 'Round Robin', full: 'Round Robin' },
};

export const PROCESS_COLORS = ['#6366f1', '#22d3ee', '#f59e0b', '#10b981', '#f43f5e', '#a855f7', '#3b82f6', '#14b8a6', '#ec4899', '#84cc16'];
export const MAX_PROCESSES = 10;

export const emptyRow = () => ({ arrival: '', burst: '', priority: '' });

const isWhole = (s) => /^\d+$/.test(s);

/** Validates the form. Returns { config } or { error }. */
export function buildSchedulingConfig({ algorithm, preemptive, quantum, rows }) {
  if (!algorithm) return { error: 'Choose a scheduling algorithm: SJF, Priority or Round Robin.' };
  if (rows.length === 0) return { error: 'Add at least one process.' };
  if (rows.length > MAX_PROCESSES) return { error: `Use at most ${MAX_PROCESSES} processes.` };

  let q = null;
  if (algorithm === 'RR') {
    const qs = String(quantum).trim();
    if (qs === '') return { error: 'Enter a time quantum for Round Robin.' };
    if (!isWhole(qs) || Number(qs) < 1 || Number(qs) > 20) return { error: 'Time quantum must be a whole number from 1 to 20.' };
    q = Number(qs);
  }

  const processes = [];
  for (let i = 0; i < rows.length; i++) {
    const label = `P${i + 1}`;
    const a = String(rows[i].arrival).trim();
    const b = String(rows[i].burst).trim();
    const p = String(rows[i].priority).trim();
    if (a === '' || b === '') return { error: `${label}: enter both arrival time and burst time.` };
    if (!isWhole(a)) return { error: `${label}: arrival time must be a whole number (0 or more).` };
    if (!isWhole(b) || Number(b) < 1) return { error: `${label}: burst time must be a whole number of at least 1.` };
    if (Number(a) > 100 || Number(b) > 50) return { error: `${label}: keep arrival time ≤ 100 and burst time ≤ 50.` };
    let priority = null;
    if (algorithm === 'PRIORITY') {
      if (p === '' || !isWhole(p)) return { error: `${label}: enter a priority (whole number, lower number = higher priority).` };
      priority = Number(p);
    } else if (p !== '' && isWhole(p)) {
      priority = Number(p);
    }
    processes.push({ id: label, index: i, arrival: Number(a), burst: Number(b), priority });
  }

  return {
    config: {
      algorithm,
      preemptive: algorithm === 'RR' ? true : Boolean(preemptive),
      quantum: q,
      processes,
    },
  };
}

function pushSlice(timeline, pid, start, end, merge = true) {
  const last = timeline[timeline.length - 1];
  if (merge && last && last.pid === pid && last.end === start) last.end = end;
  else timeline.push({ pid, start, end });
}

// Lowest key wins; ties: keep the process already running, then earlier arrival, then lower PID.
function pick(ready, key, runningId) {
  let best = null;
  for (const p of ready) {
    if (!best) { best = p; continue; }
    const a = key(p);
    const b = key(best);
    if (a !== b) { if (a < b) best = p; continue; }
    if (p.id === runningId) { best = p; continue; }
    if (best.id === runningId) continue;
    if (p.arrival !== best.arrival) { if (p.arrival < best.arrival) best = p; continue; }
    if (p.index < best.index) best = p;
  }
  return best;
}

function runKeyed(processes, keyFn, preemptive) {
  const remaining = Object.fromEntries(processes.map((p) => [p.id, p.burst]));
  const firstStart = {};
  const completion = {};
  const timeline = [];
  let t = 0;
  let runningId = null;

  while (Object.keys(completion).length < processes.length) {
    const ready = processes.filter((p) => p.arrival <= t && !(p.id in completion));
    if (ready.length === 0) {
      const next = Math.min(...processes.filter((p) => !(p.id in completion)).map((p) => p.arrival));
      pushSlice(timeline, null, t, next);
      t = next;
      runningId = null;
      continue;
    }
    const cur = pick(ready, (p) => keyFn(p, remaining[p.id]), runningId);
    if (!(cur.id in firstStart)) firstStart[cur.id] = t;
    const run = preemptive ? 1 : remaining[cur.id];
    pushSlice(timeline, cur.id, t, t + run);
    t += run;
    remaining[cur.id] -= run;
    runningId = cur.id;
    if (remaining[cur.id] === 0) {
      completion[cur.id] = t;
      runningId = null;
    }
  }
  return { timeline, completion, firstStart };
}

function runRoundRobin(processes, quantum) {
  const sorted = [...processes].sort((a, b) => a.arrival - b.arrival || a.index - b.index);
  const remaining = Object.fromEntries(processes.map((p) => [p.id, p.burst]));
  const firstStart = {};
  const completion = {};
  const timeline = [];
  const queue = [];
  let t = 0;
  let i = 0;
  const admit = () => {
    while (i < sorted.length && sorted[i].arrival <= t) queue.push(sorted[i++]);
  };

  admit();
  while (Object.keys(completion).length < processes.length) {
    if (queue.length === 0) {
      const next = sorted[i].arrival;
      pushSlice(timeline, null, t, next);
      t = next;
      admit();
      continue;
    }
    const cur = queue.shift();
    if (!(cur.id in firstStart)) firstStart[cur.id] = t;
    const run = Math.min(quantum, remaining[cur.id]);
    pushSlice(timeline, cur.id, t, t + run, false); // keep each quantum as its own block
    t += run;
    remaining[cur.id] -= run;
    admit(); // processes that arrived during this slice join before the preempted one
    if (remaining[cur.id] > 0) queue.push(cur);
    else completion[cur.id] = t;
  }
  return { timeline, completion, firstStart };
}

/** Runs one algorithm. Returns timeline, per-process results and summary metrics. */
export function schedule({ algorithm, preemptive, quantum, processes }) {
  let run;
  if (algorithm === 'RR') run = runRoundRobin(processes, quantum);
  else if (algorithm === 'PRIORITY') run = runKeyed(processes, (p) => p.priority, preemptive);
  else run = runKeyed(processes, (p, rem) => rem, preemptive);

  const { timeline, completion, firstStart } = run;
  const results = processes.map((p) => {
    const ct = completion[p.id];
    const tat = ct - p.arrival;
    return {
      ...p,
      completion: ct,
      turnaround: tat,
      waiting: tat - p.burst,
      response: firstStart[p.id] - p.arrival,
    };
  });

  const avg = (k) => results.reduce((s, r) => s + r[k], 0) / results.length;
  const end = Math.max(...results.map((r) => r.completion));
  const start = Math.min(...processes.map((p) => p.arrival));
  const busy = processes.reduce((s, p) => s + p.burst, 0);

  return {
    timeline,
    results,
    makespan: end,
    averages: { waiting: avg('waiting'), turnaround: avg('turnaround'), response: avg('response') },
    utilization: (busy / (end - start)) * 100,
    throughput: processes.length / (end - start),
  };
}

export function fmt(n) {
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

export function algorithmLabel(config) {
  if (config.algorithm === 'RR') return `Round Robin (q = ${config.quantum})`;
  if (config.algorithm === 'SJF') return config.preemptive ? 'SRTF (preemptive SJF)' : 'SJF (non-preemptive)';
  return config.preemptive ? 'Priority (preemptive)' : 'Priority (non-preemptive)';
}
