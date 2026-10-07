import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { buildSchedulingConfig, emptyRow, schedule } from '../lib/scheduling';

export const SCHED_SPEEDS = { slow: 900, medium: 500, fast: 200 }; // ms per time unit

const SchedulingContext = createContext(null);

export function SchedulingProvider({ children }) {
  // Form (draft) values: everything starts empty and is typed by the user.
  const [algorithm, setAlgorithm] = useState('');
  const [preemptive, setPreemptive] = useState(false);
  const [quantum, setQuantum] = useState('');
  const [rows, setRows] = useState([emptyRow()]);
  const [error, setError] = useState('');

  // Applied run
  const [applied, setApplied] = useState(null); // { key, config, result }
  const [time, setTime] = useState(-1); // -1 = not started
  const [status, setStatus] = useState('ready');
  const [speed, setSpeed] = useState('medium');

  const makespan = applied ? applied.result.makespan : 0;
  // Mirrors `applied` synchronously so rapid clicks never see an outdated run.
  const appliedRef = useRef(null);

  useEffect(() => {
    if (status !== 'running') return undefined;
    if (time >= makespan) {
      setStatus('completed');
      return undefined;
    }
    const timer = setTimeout(() => setTime((t) => t + 1), SCHED_SPEEDS[speed]);
    return () => clearTimeout(timer);
  }, [status, time, makespan, speed]);

  const build = () => {
    const { config, error: err } = buildSchedulingConfig({ algorithm, preemptive, quantum, rows });
    if (err) {
      setError(err);
      return null;
    }
    setError('');
    const key = JSON.stringify(config);
    return { key, config };
  };

  const apply = (built) => {
    const result = schedule(built.config);
    const next = { ...built, result };
    appliedRef.current = next;
    setApplied(next);
    return result;
  };

  const run = () => {
    if (status === 'running') {
      setStatus('paused');
      return;
    }
    const built = build();
    if (!built) return;
    const cur = appliedRef.current;
    if (!cur || cur.key !== built.key || status === 'ready' || status === 'completed') {
      apply(built);
      setTime(0);
    }
    setStatus('running');
  };

  // Functional updates so rapid clicks never read a stale time.
  const step = () => {
    const built = build();
    if (!built) return;
    const cur = appliedRef.current;
    if (!cur || cur.key !== built.key) {
      const end = apply(built).makespan;
      setTime(1);
      setStatus(end <= 1 ? 'completed' : 'paused');
      return;
    }
    const end = cur.result.makespan;
    setTime((t) => Math.min(t + 1, end)); // stays on the final result at the end
    setStatus('paused');
  };

  // Mark the run finished once stepping reaches the end.
  useEffect(() => {
    if (status === 'paused' && applied && time >= makespan) setStatus('completed');
  }, [status, applied, time, makespan]);

  const reset = () => {
    setTime(-1);
    setStatus('ready');
  };

  const clearAll = () => {
    setAlgorithm('');
    setPreemptive(false);
    setQuantum('');
    setRows([emptyRow()]);
    setError('');
    appliedRef.current = null;
    setApplied(null);
    reset();
  };

  const draftKey = useMemo(() => {
    const { config } = buildSchedulingConfig({ algorithm, preemptive, quantum, rows });
    return config ? JSON.stringify(config) : null;
  }, [algorithm, preemptive, quantum, rows]);

  const value = {
    algorithm, setAlgorithm, preemptive, setPreemptive, quantum, setQuantum, rows, setRows, error,
    applied, time, status, speed, setSpeed, run, step, reset, clearAll,
    hasPendingChanges: Boolean(applied) && draftKey !== null && draftKey !== applied.key,
  };
  return <SchedulingContext.Provider value={value}>{children}</SchedulingContext.Provider>;
}

export function useScheduling() {
  const ctx = useContext(SchedulingContext);
  if (!ctx) throw new Error('useScheduling must be used inside <SchedulingProvider>');
  return ctx;
}
