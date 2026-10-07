import { Check, Minus, Workflow } from 'lucide-react';
import { PageHeader } from '../components/ui';

const ALGOS = [
  {
    id: 'FIFO',
    name: 'FIFO (First In, First Out)',
    accent: 'border-t-indigo-500',
    idea: 'Replace the page that entered memory first. Memory behaves like a queue: new pages join at the back and the victim always leaves from the front.',
    steps: [
      'Read the next page in the reference string.',
      'If the page is already in a frame, it is a hit. Nothing changes, not even the queue order.',
      'Otherwise it is a page fault. If a frame is free, load the page into it.',
      'If every frame is full, remove the page at the front of the queue, load the new page, and add it to the back.',
    ],
    code: `for each page p in reference string:
    if p in frames:
        hits += 1
    else:
        faults += 1
        if frames is full:
            victim = queue.dequeue()
            frames.remove(victim)
        frames.add(p)
        queue.enqueue(p)`,
    pros: ['Very simple to understand and implement', 'O(1) work to pick a victim using a queue', 'No need to know the future'],
    cons: ['Ignores how often or how recently a page is used', 'Can evict a heavily used page just because it is old', "Suffers from Belady's anomaly"],
  },
  {
    id: 'OPTIMAL',
    name: 'Optimal (OPT / MIN)',
    accent: 'border-t-cyan-400',
    idea: 'Replace the page that will not be used for the longest time in the future. It gives the lowest possible number of page faults for a given number of frames.',
    steps: [
      'Read the next page in the reference string.',
      'If the page is already in a frame, it is a hit.',
      'Otherwise it is a page fault. If a frame is free, load the page into it.',
      'If every frame is full, look ahead in the reference string. Evict the page whose next use is furthest away, or a page that is never used again.',
    ],
    code: `for i, p in enumerate(reference string):
    if p in frames:
        hits += 1
    else:
        faults += 1
        if frames is full:
            victim = page in frames whose next
                     use after i is furthest
                     (or never used again)
            frames.remove(victim)
        frames.add(p)`,
    pros: ['Minimum possible page faults', "Never suffers from Belady's anomaly", 'Perfect benchmark for judging other algorithms'],
    cons: ['Needs to know future page references', 'Cannot be implemented in a real operating system', 'Look-ahead costs more work on every fault'],
  },
];

const COMPARISON = [
  ['Replacement rule', 'Oldest page in memory', 'Page used furthest in the future'],
  ['Needs future knowledge', 'No', 'Yes'],
  ['Usable in a real OS', 'Yes', 'No, theoretical only'],
  ["Belady's anomaly", 'Can occur', 'Never occurs'],
  ['Page faults', 'Usually higher', 'Lowest possible'],
  ['Data structure', 'Queue', 'Look-ahead over the reference string'],
  ['Cost to pick a victim', 'O(1)', 'O(frames × remaining references)'],
  ['Typical use', 'Simple systems, teaching', 'Benchmark for other algorithms'],
];

export default function Algorithms() {
  return (
    <div className="space-y-6">
      <PageHeader icon={Workflow} title="Algorithms" subtitle="How each algorithm decides which page to replace." />

      <div className="grid gap-6 lg:grid-cols-2">
        {ALGOS.map((algo) => (
          <article key={algo.id} className={`card border-t-4 p-6 ${algo.accent}`}>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{algo.name}</h3>
            <p className="mt-2 leading-relaxed text-slate-600 dark:text-slate-300">{algo.idea}</p>

            <h4 className="mt-5 text-sm font-semibold text-slate-900 dark:text-white">How it works</h4>
            <ol className="mt-2 space-y-2">
              {algo.steps.map((s, i) => (
                <li key={i} className="flex gap-3 text-sm text-slate-600 dark:text-slate-300">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-300">{i + 1}</span>
                  {s}
                </li>
              ))}
            </ol>

            <h4 className="mt-5 text-sm font-semibold text-slate-900 dark:text-white">Pseudocode</h4>
            <pre className="mt-2 overflow-x-auto rounded-xl bg-slate-950 p-4 font-mono text-xs leading-relaxed text-slate-200">{algo.code}</pre>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <h4 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Advantages</h4>
                <ul className="mt-2 space-y-1.5">
                  {algo.pros.map((p) => (
                    <li key={p} className="flex gap-2 text-sm text-slate-600 dark:text-slate-300"><Check size={16} className="mt-0.5 shrink-0 text-emerald-500" />{p}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-rose-700 dark:text-rose-400">Disadvantages</h4>
                <ul className="mt-2 space-y-1.5">
                  {algo.cons.map((c) => (
                    <li key={c} className="flex gap-2 text-sm text-slate-600 dark:text-slate-300"><Minus size={16} className="mt-0.5 shrink-0 text-rose-500" />{c}</li>
                  ))}
                </ul>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="p-5 pb-3"><h3 className="card-title">Side-by-side comparison</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-slate-50 text-left dark:bg-white/5">
              <tr>
                <th className="px-5 py-3 font-medium text-slate-500 dark:text-slate-400">Property</th>
                <th className="px-5 py-3 font-semibold text-indigo-600 dark:text-indigo-300">FIFO</th>
                <th className="px-5 py-3 font-semibold text-cyan-600 dark:text-cyan-300">Optimal</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map(([prop, fifo, opt]) => (
                <tr key={prop} className="border-t border-slate-100 dark:border-white/5">
                  <td className="px-5 py-3 font-medium text-slate-700 dark:text-slate-300">{prop}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{fifo}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{opt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
