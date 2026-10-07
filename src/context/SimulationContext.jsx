import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { parseReferenceString, simulate, summarize } from '../lib/algorithms';

export const SPEEDS = { slow: 1400, medium: 800, fast: 350 };

// Nothing is preloaded: every value comes from what the user enters in the Simulator.
export const EMPTY_CONFIG = { algorithm: '', frameCount: 0, referenceText: '' };

const SimulationContext = createContext(null);

const sameConfig = (a, b) =>
  a.algorithm === b.algorithm && a.frameCount === b.frameCount && a.referenceText === b.referenceText;

export function SimulationProvider({ children }) {
  const [config, setConfigState] = useState(EMPTY_CONFIG); // the config the simulation actually uses
  // Synchronous mirrors so rapid Step clicks never read an outdated config.
  const configRef = useRef(EMPTY_CONFIG);
  const lastIndexRef = useRef(-1);
  const setConfig = (c) => {
    configRef.current = c;
    lastIndexRef.current = (parseReferenceString(c.referenceText).pages?.length ?? 0) - 1;
    setConfigState(c);
  };
  const [currentStep, setCurrentStep] = useState(-1); // -1 = not started
  const [status, setStatus] = useState('ready'); // ready | running | paused | completed
  const [speed, setSpeed] = useState('medium');

  const pages = useMemo(() => parseReferenceString(config.referenceText).pages ?? [], [config.referenceText]);
  const steps = useMemo(
    () => simulate(config.algorithm, pages, config.frameCount),
    [config.algorithm, pages, config.frameCount],
  );
  const summary = useMemo(() => summarize(steps), [steps]);
  const isConfigured = Boolean(config.algorithm) && config.frameCount > 0 && pages.length > 0;
  const comparison = useMemo(
    () => ({
      FIFO: summarize(simulate('FIFO', pages, config.frameCount)),
      OPTIMAL: summarize(simulate('OPTIMAL', pages, config.frameCount)),
    }),
    [pages, config.frameCount],
  );

  // Auto-play timer: advances one step every SPEEDS[speed] ms while running.
  useEffect(() => {
    if (status !== 'running') return undefined;
    if (currentStep >= steps.length - 1) {
      setStatus('completed');
      return undefined;
    }
    const timer = setTimeout(() => setCurrentStep((s) => s + 1), SPEEDS[speed]);
    return () => clearTimeout(timer);
  }, [status, currentStep, steps.length, speed]);

  const run = (draft = config) => {
    if (!draft.algorithm || draft.frameCount < 1 || !draft.referenceText) return;
    const changed = !sameConfig(draft, configRef.current);
    if (changed || status === 'ready' || status === 'completed') {
      setConfig(draft);
      setCurrentStep(0);
    }
    setStatus('running');
  };

  const pause = () => setStatus((s) => (s === 'running' ? 'paused' : s));

  const stepForward = (draft) => {
    if (draft && !sameConfig(draft, configRef.current)) {
      const count = parseReferenceString(draft.referenceText).pages?.length ?? 0;
      setConfig(draft);
      setCurrentStep(0);
      setStatus(count <= 1 ? 'completed' : 'paused');
      return;
    }
    const last = lastIndexRef.current;
    if (last < 0) return;
    setCurrentStep((s) => Math.min(s + 1, last)); // functional: safe for rapid clicks; stays on the last step
    setStatus('paused');
  };

  // Mark the run finished once stepping reaches the last reference.
  useEffect(() => {
    if (status === 'paused' && steps.length > 0 && currentStep >= steps.length - 1) setStatus('completed');
  }, [status, currentStep, steps.length]);

  const stepBack = () => {
    if (currentStep <= 0) {
      setCurrentStep(-1);
      setStatus('ready');
      return;
    }
    setCurrentStep((s) => Math.max(0, s - 1));
    setStatus('paused');
  };

  const goTo = (index) => {
    setCurrentStep(index);
    setStatus(index >= steps.length - 1 ? 'completed' : 'paused');
  };

  const reset = () => {
    setCurrentStep(-1);
    setStatus('ready');
  };

  const loadConfig = (draft) => {
    setConfig(draft);
    reset();
  };

  const resetAll = () => {
    setConfig(EMPTY_CONFIG);
    setSpeed('medium');
    reset();
  };

  const value = {
    config,
    isConfigured,
    pages,
    steps,
    summary,
    comparison,
    currentStep,
    current: currentStep >= 0 ? steps[currentStep] : null,
    status,
    speed,
    setSpeed,
    run,
    pause,
    stepForward,
    stepBack,
    goTo,
    reset,
    loadConfig,
    resetAll,
  };

  return <SimulationContext.Provider value={value}>{children}</SimulationContext.Provider>;
}

export function useSimulation() {
  const ctx = useContext(SimulationContext);
  if (!ctx) throw new Error('useSimulation must be used inside <SimulationProvider>');
  return ctx;
}
