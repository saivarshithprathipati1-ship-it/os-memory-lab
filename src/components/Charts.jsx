import { useState } from 'react';

const W = 600;
const H = 260;
const PAD = { l: 36, r: 14, t: 14, b: 34 };
const IW = W - PAD.l - PAD.r;
const IH = H - PAD.t - PAD.b;

function niceMax(v) {
  if (v <= 5) return Math.max(1, v);
  const step = Math.ceil(v / 5);
  return step * 5;
}

function ticksFor(max) {
  const count = max <= 5 ? max : 5;
  return Array.from({ length: count + 1 }, (_, i) => Math.round((max / count) * i));
}

const y = (v, max) => PAD.t + IH - (v / max) * IH;

function Grid({ max }) {
  return ticksFor(max).map((t) => (
    <g key={t}>
      <line x1={PAD.l} x2={W - PAD.r} y1={y(t, max)} y2={y(t, max)} stroke="rgba(148,163,184,0.2)" strokeDasharray="3 3" />
      <text x={PAD.l - 8} y={y(t, max)} dy="0.35em" textAnchor="end" fontSize="12" fill="#94a3b8">{t}</text>
    </g>
  ));
}

function LegendRow({ items }) {
  return (
    <div className="mt-2 flex flex-wrap justify-center gap-4 text-xs text-slate-500 dark:text-slate-400">
      {items.map(({ name, color }) => (
        <span key={name} className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: color }} /> {name}
        </span>
      ))}
    </div>
  );
}

function TooltipBox({ leftPct, title, rows }) {
  return (
    <div
      className="pointer-events-none absolute top-2 z-10 min-w-[120px] -translate-x-1/2 rounded-xl border border-white/10 bg-slate-900/95 px-3 py-2 text-xs text-slate-200 shadow-xl"
      style={{ left: `${Math.min(85, Math.max(15, leftPct))}%` }}
    >
      <p className="mb-1 text-slate-400">{title}</p>
      {rows.map(({ name, value, color }) => (
        <p key={name} className="flex justify-between gap-4">
          <span style={{ color }}>{name}</span>
          <span className="font-mono">{value}</span>
        </p>
      ))}
    </div>
  );
}

/** Grouped bar chart. data: [{ name, A: n, B: n }], series: [{ key, color }] */
export function GroupedBarChart({ data, series }) {
  const [hover, setHover] = useState(null);
  const max = niceMax(Math.max(1, ...data.flatMap((d) => series.map((s) => d[s.key]))));
  const groupW = IW / data.length;
  const barW = Math.min(56, (groupW * 0.6) / series.length);
  const gap = 6;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full overflow-visible" role="img" aria-label="Bar chart">
        <Grid max={max} />
        {data.map((d, gi) => {
          const cx = PAD.l + groupW * gi + groupW / 2;
          const totalW = series.length * barW + (series.length - 1) * gap;
          return (
            <g key={d.name} onMouseEnter={() => setHover(gi)} onMouseLeave={() => setHover(null)}>
              <rect x={PAD.l + groupW * gi} y={PAD.t} width={groupW} height={IH} fill={hover === gi ? 'rgba(99,102,241,0.08)' : 'transparent'} />
              {series.map((s, si) => {
                const v = d[s.key];
                const x = cx - totalW / 2 + si * (barW + gap);
                const top = y(v, max);
                return <rect key={s.key} x={x} y={top} width={barW} height={Math.max(0, PAD.t + IH - top)} rx="6" fill={s.color} className="transition-all duration-500" />;
              })}
              <text x={cx} y={H - 10} textAnchor="middle" fontSize="12" fill="#94a3b8">{d.name}</text>
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <TooltipBox
          leftPct={((PAD.l + (IW / data.length) * (hover + 0.5)) / W) * 100}
          title={data[hover].name}
          rows={series.map((s) => ({ name: s.key, value: data[hover][s.key], color: s.color }))}
        />
      )}
      <LegendRow items={series.map((s) => ({ name: s.key, color: s.color }))} />
    </div>
  );
}

/** Multi-series line chart. data: [{ [xKey]: label, A: n, B: n }] */
export function MultiLineChart({ data, xKey, series, step = false, dots = false, xTitle, tooltipLabel }) {
  const [hover, setHover] = useState(null);
  if (data.length === 0) return null;
  const max = niceMax(Math.max(1, ...data.flatMap((d) => series.map((s) => d[s.key]))));
  const n = data.length;
  const x = (i) => (n === 1 ? PAD.l + IW / 2 : PAD.l + (IW / (n - 1)) * i);

  const pathFor = (key) =>
    data
      .map((d, i) => {
        if (i === 0) return `M${x(0)},${y(d[key], max)}`;
        return step ? `H${x(i)}V${y(d[key], max)}` : `L${x(i)},${y(d[key], max)}`;
      })
      .join('');

  const labelEvery = Math.ceil(n / 8);

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-[calc(100%-28px)] w-full"
        preserveAspectRatio="none"
        role="img"
        aria-label="Line chart"
        onMouseLeave={() => setHover(null)}
      >
        <Grid max={max} />
        {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={PAD.t + IH} stroke="#94a3b8" strokeOpacity="0.4" />}
        {series.map((s) => (
          <path key={s.key} d={pathFor(s.key)} fill="none" stroke={s.color} strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        ))}
        {dots &&
          series.map((s) =>
            data.map((d, i) => <circle key={`${s.key}-${i}`} cx={x(i)} cy={y(d[s.key], max)} r="4" fill={s.color} />),
          )}
        {data.map((d, i) =>
          i % labelEvery === 0 || i === n - 1 ? (
            <text key={i} x={x(i)} y={H - (xTitle ? 16 : 10)} textAnchor="middle" fontSize="11" fill="#94a3b8">{d[xKey]}</text>
          ) : null,
        )}
        {xTitle && <text x={PAD.l + IW / 2} y={H - 1} textAnchor="middle" fontSize="11" fill="#94a3b8">{xTitle}</text>}
        {data.map((d, i) => (
          <rect
            key={`hit-${i}`}
            x={x(i) - (n === 1 ? IW / 2 : IW / (n - 1) / 2)}
            y={PAD.t}
            width={n === 1 ? IW : IW / (n - 1)}
            height={IH}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
          />
        ))}
      </svg>
      {hover !== null && (
        <TooltipBox
          leftPct={(x(hover) / W) * 100}
          title={tooltipLabel ? tooltipLabel(data[hover][xKey]) : data[hover][xKey]}
          rows={series.map((s) => ({ name: s.key, value: data[hover][s.key], color: s.color }))}
        />
      )}
      <LegendRow items={series.map((s) => ({ name: s.key, color: s.color }))} />
    </div>
  );
}
