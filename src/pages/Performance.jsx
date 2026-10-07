import { useMemo } from 'react';
import { AlertCircle, TrendingUp } from 'lucide-react';
import { GroupedBarChart, MultiLineChart } from '../components/Charts';
import { useSimulation } from '../context/SimulationContext';
import { formatPct, simulate, summarize } from '../lib/algorithms';
import { PageHeader } from '../components/ui';
import EmptyState from '../components/EmptyState';

const COLORS = { FIFO: '#6366f1', Optimal: '#22d3ee', Faults: '#f43f5e', Hits: '#10b981' };


export default function Performance({ onNavigate }) {
  const { pages, config, comparison, isConfigured } = useSimulation();

  const { cumulative, byFrames, anomaly } = useMemo(() => {
    const fifo = simulate('FIFO', pages, config.frameCount);
    const opt = simulate('OPTIMAL', pages, config.frameCount);
    const cumulativeData = pages.map((p, i) => ({ ref: `#${i + 1} (${p})`, FIFO: fifo[i].faults, Optimal: opt[i].faults }));

    const maxFrames = Math.min(8, Math.max(4, new Set(pages).size));
    const framesData = Array.from({ length: maxFrames }, (_, k) => ({
      frames: k + 1,
      FIFO: summarize(simulate('FIFO', pages, k + 1)).faults,
      Optimal: summarize(simulate('OPTIMAL', pages, k + 1)).faults,
    }));
    const found = framesData.find((d, i) => i > 0 && d.FIFO > framesData[i - 1].FIFO);
    return { cumulative: cumulativeData, byFrames: framesData, anomaly: found };
  }, [pages, config.frameCount]);

  const bars = [
    { name: 'FIFO', Faults: comparison.FIFO.faults, Hits: comparison.FIFO.hits },
    { name: 'Optimal', Faults: comparison.OPTIMAL.faults, Hits: comparison.OPTIMAL.hits },
  ];
  const saved = comparison.FIFO.faults - comparison.OPTIMAL.faults;

  if (!isConfigured) {
    return (
      <div className="space-y-6">
        <PageHeader icon={TrendingUp} title="Performance" subtitle="FIFO and Optimal compared on your own reference string." />
        <EmptyState onNavigate={onNavigate} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={TrendingUp}
        title="Performance"
        subtitle={`FIFO and Optimal on the current reference string with ${config.frameCount} frames.`}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'FIFO', data: comparison.FIFO, color: 'text-indigo-600 dark:text-indigo-300' },
          { label: 'Optimal', data: comparison.OPTIMAL, color: 'text-cyan-600 dark:text-cyan-300' },
        ].map(({ label, data, color }) => (
          <div key={label} className="card p-5">
            <p className="muted text-sm font-medium">{label}</p>
            <p className={`mt-2 font-mono text-3xl font-semibold ${color}`}>{data.faults} <span className="text-base font-normal text-slate-500">faults</span></p>
            <p className="muted mt-1 text-xs">{data.hits} hits · hit ratio {formatPct(data.hitRatio)}</p>
          </div>
        ))}
        <div className="card p-5">
          <p className="muted text-sm font-medium">Faults avoided by Optimal</p>
          <p className="mt-2 font-mono text-3xl font-semibold text-emerald-600 dark:text-emerald-400">{saved}</p>
          <p className="muted mt-1 text-xs">Optimal is the lower bound: no algorithm can do better.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="card-title mb-4">Faults and hits</h3>
          <GroupedBarChart data={bars} series={[{ key: 'Faults', color: COLORS.Faults }, { key: 'Hits', color: COLORS.Hits }]} />
        </div>

        <div className="card p-5">
          <h3 className="card-title mb-4">Page faults over time</h3>
          <MultiLineChart data={cumulative} xKey="ref" step series={[{ key: 'FIFO', color: COLORS.FIFO }, { key: 'Optimal', color: COLORS.Optimal }]} />
        </div>
      </div>

      <div className="card p-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="card-title">Page faults vs number of frames</h3>
            <p className="muted text-sm">More frames usually means fewer faults. FIFO can break that rule.</p>
          </div>
        </div>
        <MultiLineChart data={byFrames} xKey="frames" dots xTitle="Number of frames" tooltipLabel={(v) => `${v} frame${v > 1 ? 's' : ''}`} series={[{ key: 'FIFO', color: COLORS.FIFO }, { key: 'Optimal', color: COLORS.Optimal }]} />
        {anomaly ? (
          <p className="mt-4 flex items-start gap-2 rounded-xl bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            Belady&apos;s anomaly: FIFO gets {byFrames[anomaly.frames - 2].FIFO} faults with {anomaly.frames - 1} frames but {anomaly.FIFO} faults with {anomaly.frames} frames. Adding memory made FIFO worse. Optimal never shows this.
          </p>
        ) : (
          <p className="muted mt-4 text-sm">
            No Belady&apos;s anomaly for this string. Try entering 1 2 3 4 1 2 5 1 2 3 4 5 in the Simulator to see FIFO get worse with more frames.
          </p>
        )}
        <button type="button" className="btn-secondary mt-3" onClick={() => onNavigate('simulator')}>Open in simulator</button>
      </div>
    </div>
  );
}
