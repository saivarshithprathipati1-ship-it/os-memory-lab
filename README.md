# OS Memory Lab – Page Replacement & CPU Scheduling Simulator

Interactive simulator for **FIFO** and **Optimal** page replacement (Operating Systems project).
React + Vite + Tailwind CSS + Lucide (charts are built-in SVG). No backend, works fully offline after install.

## Run it

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

Build for submission / hosting: `npm run build` (output in `dist/`).

## Pages

| Page | What it shows |
|---|---|
| Dashboard | Starts empty; after you run your own data: hero, stats (references, faults, hits, hit ratio), algorithm, frames, status |
| Simulator | Config form, run / step / reset, speed, reference string, step explanation, frame table |
| Algorithms | FIFO and Optimal explained with pseudocode, pros/cons, comparison table |
| Memory Visualization | RAM frames with addresses, incoming request, evicted page, page table with valid bits |
| Performance | FIFO vs Optimal charts, faults vs frame count, Belady's anomaly detection |
| CPU Scheduling | SJF / SRTF, Priority (preemptive or not), Round Robin: process table input, animated Gantt chart, CT/TAT/WT/RT, averages, comparison |
| Learn | Concepts, page-fault handling steps, formulas, viva Q&A |

## Project structure

```
src/
  lib/algorithms.js            FIFO + Optimal logic (pure functions, easiest file to explain in viva)
  lib/scheduling.js            SJF, SRTF, Priority, Round Robin logic
  context/SimulationContext.jsx  Shared state: config, current step, play/pause timer
  components/                  Header, Sidebar, reusable UI, reference strip, frame table
  pages/                       One file per sidebar page
```

## Verified results (3 frames)

| Reference string | FIFO faults | Optimal faults |
|---|---|---|
| 7 0 1 2 0 3 0 4 2 3 | 9 | 6 |
| 7 0 1 2 0 3 0 4 2 3 0 3 2 1 2 0 1 7 0 1 | 15 | 9 |
| 1 2 3 4 1 2 5 1 2 3 4 5 | 9 (10 with 4 frames: Belady's anomaly) | 7 |

## Verified CPU scheduling results (Silberschatz examples)

| Algorithm | Processes (arrival, burst[, priority]) | Avg waiting time |
|---|---|---|
| SJF (non-preemptive) | (0,8) (1,4) (2,9) (3,5) | 7.75 |
| SRTF (preemptive SJF) | (0,8) (1,4) (2,9) (3,5) | 6.50 |
| Priority (non-preemptive) | (0,10,3) (0,1,1) (0,2,4) (0,1,5) (0,5,2) | 8.20 |
| Round Robin, q = 4 | (0,24) (0,3) (0,3) | 5.67 |

Lower priority number = higher priority.
