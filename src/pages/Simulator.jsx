import { useEffect, useState } from 'react';
import { ChevronDown, Info, Minus, Pause, Play, Plus, RotateCcw, SkipForward, SlidersHorizontal } from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';
import { MAX_FRAMES, formatPct, parseReferenceString } from '../lib/algorithms';
import { FrameTable, ReferenceString, StepInsight, TableLegend } from '../components/SimulationViews';
import { PageHeader, SpeedSelector, StatusPill } from '../components/ui';

export default function Simulator() {
  const { config, isConfigured, status, steps, pages, current, currentStep, run, pause, stepForward, reset, goTo } = useSimulation();

  // Draft values in the form. They only take effect when the user runs or steps.
  const [algorithm, setAlgorithm] = useState(config.algorithm);
  const [frames, setFrames] = useState(config.frameCount ? String(config.frameCount) : '');
  const [refText, setRefText] = useState(config.referenceText);
  const [error, setError] = useState('');

  useEffect(() => {
    setAlgorithm(config.algorithm);
    setFrames(config.frameCount ? String(config.frameCount) : '');
    setRefText(config.referenceText);
    setError('');
  }, [config]);

  const running = status === 'running';

  const buildDraft = () => {
    if (!algorithm) {
      setError('Choose an algorithm: FIFO or Optimal.');
      return null;
    }
    if (String(frames).trim() === '') {
      setError('Enter the number of frames.');
      return null;
    }
    if (refText.trim() === '') {
      setError('Enter a reference string, for example 7 0 1 2 0 3.');
      return null;
    }
    const frameCount = Number(frames);
    if (!Number.isInteger(frameCount) || frameCount < 1 || frameCount > MAX_FRAMES) {
      setError(`Number of frames must be a whole number from 1 to ${MAX_FRAMES}.`);
      return null;
    }
    const parsed = parseReferenceString(refText);
    if (parsed.error) {
      setError(parsed.error);
      return null;
    }
    setError('');
    return { algorithm, frameCount, referenceText: parsed.pages.join(' ') };
  };

  const handleRun = () => {
    if (running) return pause();
    const draft = buildDraft();
    if (draft) run(draft);
  };

  const handleStep = () => {
    const draft = buildDraft();
    if (draft) stepForward(draft);
  };

  const normalized = parseReferenceString(refText).pages?.join(' ') ?? refText;
  const hasPendingChanges =
    isConfigured &&
    (algorithm !== config.algorithm || Number(frames) !== config.frameCount || normalized !== config.referenceText);

  const adjustFrames = (delta) => {
    const n = Math.min(MAX_FRAMES, Math.max(1, (Number(frames) || 0) + delta));
    setFrames(String(n));
  };

  const progress = pages.length ? ((currentStep + 1) / pages.length) * 100 : 0;
  const soFar = current
    ? { faults: current.faults, hits: current.hits, ratio: (current.hits / (current.index + 1)) * 100 }
    : { faults: 0, hits: 0, ratio: 0 };

  const runLabel = running ? 'Pause' : status === 'paused' && !hasPendingChanges ? 'Resume simulation' : 'Run Simulation';

  return (
    <div className="space-y-6">
      <PageHeader
        icon={SlidersHorizontal}
        title="Simulator"
        subtitle="Set up a reference string and watch each page request get served."
        right={<StatusPill status={status} />}
      />

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        {/* Configuration */}
        <aside className="card h-fit space-y-5 p-5 xl:sticky xl:top-24">
          <div className="flex items-center justify-between">
            <h3 className="card-title">Simulation configuration</h3>
            <button
              type="button"
              className="text-xs font-medium text-slate-500 hover:text-indigo-600 disabled:opacity-40 dark:text-slate-400 dark:hover:text-cyan-300"
              disabled={running}
              onClick={() => {
                setAlgorithm('');
                setFrames('');
                setRefText('');
                setError('');
              }}
            >
              Clear inputs
            </button>
          </div>

          <div>
            <label htmlFor="algorithm" className="field-label">Algorithm</label>
            <div className="relative">
              <select
                id="algorithm"
                value={algorithm}
                onChange={(e) => setAlgorithm(e.target.value)}
                disabled={running}
                className="input appearance-none pr-10"
              >
                <option value="" disabled>Select an algorithm</option>
                <option value="FIFO">FIFO (First In, First Out)</option>
                <option value="OPTIMAL">Optimal</option>
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          <div>
            <label htmlFor="frames" className="field-label">Number of frames</label>
            <div className="flex gap-2">
              <button type="button" className="btn-icon h-auto" onClick={() => adjustFrames(-1)} disabled={running} aria-label="Fewer frames"><Minus size={16} /></button>
              <input
                id="frames"
                type="number"
                min={1}
                max={MAX_FRAMES}
                value={frames}
                placeholder="e.g. 3"
                onChange={(e) => setFrames(e.target.value)}
                disabled={running}
                className="input text-center font-mono"
              />
              <button type="button" className="btn-icon h-auto" onClick={() => adjustFrames(1)} disabled={running} aria-label="More frames"><Plus size={16} /></button>
            </div>
          </div>

          <div>
            <label htmlFor="reference" className="field-label">Reference string</label>
            <textarea
              id="reference"
              rows={3}
              value={refText}
              onChange={(e) => setRefText(e.target.value)}
              disabled={running}
              placeholder="e.g. 7 0 1 2 0 3 0 4 2 3"
              className="input resize-none font-mono leading-relaxed"
            />
            <p className="muted mt-1 text-xs">Type your own page numbers (0–99), separated by spaces or commas. Up to 30 references.</p>

          </div>

          <div>
            <span className="field-label">Animation speed</span>
            <SpeedSelector />
          </div>

          {error && (
            <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-300">
              {error}
            </p>
          )}
          {hasPendingChanges && !error && (
            <p className="flex items-start gap-2 rounded-xl bg-indigo-500/10 px-3 py-2 text-xs text-indigo-700 dark:text-indigo-300">
              <Info size={14} className="mt-0.5 shrink-0" /> Changes apply when you run or step. The current run keeps its old settings until then.
            </p>
          )}

          <div className="space-y-2">
            <button type="button" className="btn-primary w-full" onClick={handleRun}>
              {running ? <Pause size={16} /> : <Play size={16} />}
              {runLabel}
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" className="btn-secondary" onClick={handleStep} disabled={running}>
                <SkipForward size={16} /> Step
              </button>
              <button type="button" className="btn-secondary" onClick={reset} disabled={!isConfigured}>
                <RotateCcw size={16} /> Reset
              </button>
            </div>
          </div>
        </aside>

        {/* Live view */}
        <div className="min-w-0 space-y-6">
          <div className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="font-medium text-slate-900 dark:text-white">
                {currentStep < 0 ? 'Not started' : `Step ${currentStep + 1} of ${pages.length}`}
              </span>
              <span className="muted text-xs">
                {isConfigured ? `${config.frameCount} frames · ${config.algorithm === 'FIFO' ? 'FIFO' : 'Optimal'}` : 'Enter your data on the left to begin'}
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'Current page', value: current ? current.page : '—', tone: 'text-indigo-600 dark:text-cyan-300' },
                { label: 'Page faults', value: soFar.faults, tone: 'text-rose-600 dark:text-rose-400' },
                { label: 'Page hits', value: soFar.hits, tone: 'text-emerald-600 dark:text-emerald-400' },
                { label: 'Hit ratio so far', value: formatPct(soFar.ratio), tone: 'text-slate-900 dark:text-white' },
              ].map((item) => (
                <div key={item.label} className="rounded-xl bg-slate-50 p-3 dark:bg-white/5">
                  <dt className="muted text-xs">{item.label}</dt>
                  <dd className={`mt-1 font-mono text-2xl font-semibold ${item.tone}`}>{item.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {isConfigured && (
          <div className="card p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h3 className="card-title">Reference string</h3>
              <span className="muted text-xs">Click any page to jump to that step</span>
            </div>
            <ReferenceString pages={pages} steps={steps} currentStep={currentStep} onSelect={running ? undefined : goTo} />
          </div>
          )}

          <StepInsight />

          {isConfigured && (
          <div className="card p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h3 className="card-title">Frame table</h3>
              <TableLegend />
            </div>
            <FrameTable pages={pages} steps={steps} currentStep={currentStep} frameCount={config.frameCount} />
            {status === 'completed' && (
              <p className="mt-4 rounded-xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-300">
                Finished: {steps[steps.length - 1].faults} page faults and {steps[steps.length - 1].hits} hits out of {pages.length} references
                (hit ratio {formatPct((steps[steps.length - 1].hits / pages.length) * 100)}).
              </p>
            )}
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
