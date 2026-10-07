import { useState } from 'react';
import { ChevronDown, GraduationCap, Play } from 'lucide-react';
import { PageHeader } from '../components/ui';

const CONCEPTS = [
  { term: 'Virtual memory', text: 'Lets a process use a larger address space than the physical RAM. Only the pages it currently needs are kept in memory.' },
  { term: 'Page', text: "A fixed-size block of a process's logical memory, for example 4 KB." },
  { term: 'Frame', text: 'A fixed-size block of physical memory, the same size as a page. Each frame holds exactly one page.' },
  { term: 'Reference string', text: 'The sequence of page numbers a process accesses, such as 7 0 1 2 0 3. Simulators use it to compare algorithms.' },
  { term: 'Page fault', text: 'The requested page is not in any frame. The OS must bring it in from disk, which is slow.' },
  { term: 'Page hit', text: 'The requested page is already in a frame, so the CPU can use it immediately.' },
];

const FAULT_STEPS = [
  'The CPU references a page. The MMU checks the page table and finds the valid bit is 0, so it raises a page fault trap.',
  'The OS confirms the reference is legal and locates the page on disk (the swap area).',
  'The OS looks for a free frame. If none is free, the page replacement algorithm picks a victim, which is written back to disk only if it was modified.',
  'The page is read into the frame and the page table is updated with the frame number and valid bit 1.',
  'The instruction that caused the fault is restarted and now finds the page in memory.',
];

const VIVA = [
  ['What is a page fault?', 'It happens when a process references a page that is not currently in physical memory. The hardware traps to the OS, which loads the page from disk, replacing another page if memory is full.'],
  ['Why do we need page replacement?', 'Physical memory has a limited number of frames. When a page fault occurs and every frame is in use, the OS must choose a page to remove to make space.'],
  ['How does FIFO choose the victim?', 'It removes the page that has been in memory the longest, using a queue. It does not consider how often or how recently the page was used.'],
  ['Why is the Optimal algorithm not used in real systems?', 'It needs to know which pages will be referenced in the future, which the OS cannot know. It is used as a benchmark to measure other algorithms.'],
  ["What is Belady's anomaly?", 'For some algorithms, like FIFO, giving a process more frames can increase the number of page faults. With the string 1 2 3 4 1 2 5 1 2 3 4 5, FIFO has 9 faults with 3 frames but 10 faults with 4 frames.'],
  ["Which algorithms do not suffer from Belady's anomaly?", 'Stack algorithms such as Optimal and LRU. The set of pages in memory with n frames is always a subset of the set with n + 1 frames.'],
  ['How is the hit ratio calculated?', 'Hit ratio = page hits ÷ total references × 100. Fault rate = page faults ÷ total references × 100. The two always add up to 100%.'],
  ['What happens to the FIFO queue on a page hit?', 'Nothing. FIFO only records the load order, so a hit does not move the page. This is the key difference from LRU.'],
  ['How is LRU different from FIFO?', 'LRU replaces the page that has not been used for the longest time, so every hit updates its position. FIFO only looks at when the page was loaded.'],
  ['What is the difference between page replacement and CPU scheduling?', 'Page replacement decides which page to remove from memory on a page fault. CPU scheduling decides which ready process runs on the CPU next. One manages memory, the other manages processor time.'],
  ['Why is SJF called optimal, and what is its problem?', 'Non-preemptive SJF gives the minimum average waiting time for a set of processes that are all available. Its problems are that burst times must be known in advance and long jobs can starve.'],
  ['What is the difference between SJF and SRTF?', 'SJF is non-preemptive: a running process finishes its burst. SRTF is the preemptive version: a newly arrived process with a shorter remaining time takes the CPU immediately.'],
  ['What is starvation in priority scheduling and how is it solved?', 'Low-priority processes may wait forever if higher-priority ones keep arriving. Aging solves it by gradually increasing the priority of processes that wait a long time.'],
  ['How does the time quantum affect Round Robin?', 'A very large quantum makes Round Robin behave like FCFS. A very small quantum causes many context switches and overhead. A good quantum is larger than most CPU bursts but still gives good response time.'],
  ['What are turnaround, waiting and response time?', 'Turnaround time = completion − arrival. Waiting time = turnaround − burst. Response time = first time on the CPU − arrival.'],
  ['What is thrashing?', 'When a process does not have enough frames, it keeps faulting and spends more time moving pages between disk and memory than executing. CPU utilisation drops sharply.'],
];

export default function Learn({ onNavigate }) {
  const [open, setOpen] = useState(0);

  return (
    <div className="space-y-6">
      <PageHeader icon={GraduationCap} title="Learn" subtitle="The theory behind the simulator, plus common viva questions on memory and CPU scheduling." />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CONCEPTS.map((c) => (
          <div key={c.term} className="card p-5">
            <h3 className="font-semibold text-slate-900 dark:text-white">{c.term}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{c.text}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="card p-6">
          <h3 className="card-title">What the OS does on a page fault</h3>
          <ol className="mt-4 space-y-4">
            {FAULT_STEPS.map((s, i) => (
              <li key={i} className="flex gap-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-cyan-500 font-mono text-xs font-semibold text-white">{i + 1}</span>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{s}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="card p-6">
          <h3 className="card-title">Measuring performance</h3>
          <div className="mt-4 space-y-3 font-mono text-sm">
            <p className="rounded-xl bg-slate-50 p-3 dark:bg-white/5">Hit ratio = hits ÷ total × 100</p>
            <p className="rounded-xl bg-slate-50 p-3 dark:bg-white/5">Fault rate = faults ÷ total × 100</p>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Worked example: <span className="font-mono">7 0 1 2 0 3 0 4 2 3</span> with 3 frames. FIFO gives 9 faults and 1 hit, a 10% hit ratio. Optimal gives 6 faults and 4 hits, a 40% hit ratio.
          </p>
          <button type="button" className="btn-primary mt-5" onClick={() => onNavigate('simulator')}>
            <Play size={16} /> Try it in the simulator
          </button>
        </div>
      </section>

      <section className="card p-6">
        <h3 className="card-title">Viva questions</h3>
        <div className="mt-4 divide-y divide-slate-200 dark:divide-white/10">
          {VIVA.map(([q, a], i) => {
            const isOpen = open === i;
            return (
              <div key={q}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 py-4 text-left text-sm font-medium text-slate-900 transition hover:text-indigo-600 dark:text-white dark:hover:text-cyan-300"
                >
                  {q}
                  <ChevronDown size={18} className={`shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && <p className="animate-rise pb-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{a}</p>}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
