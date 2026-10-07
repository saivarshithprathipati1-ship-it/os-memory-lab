// Core page replacement logic. Pure functions, no React, so they are easy to explain in a viva.

export const ALGORITHMS = {
  FIFO: { id: 'FIFO', name: 'FIFO', full: 'First In, First Out' },
  OPTIMAL: { id: 'OPTIMAL', name: 'Optimal', full: 'Optimal (Belady’s MIN)' },
};

export const PRESETS = [
  { id: 'classic', label: 'Classic', text: '7 0 1 2 0 3 0 4 2 3' },
  { id: 'textbook', label: 'Textbook (20 refs)', text: '7 0 1 2 0 3 0 4 2 3 0 3 2 1 2 0 1 7 0 1' },
  { id: 'belady', label: "Belady's anomaly", text: '1 2 3 4 1 2 5 1 2 3 4 5' },
];

export const MAX_REFERENCES = 30;
export const MAX_FRAMES = 10;

export function randomReferenceString(length = 12, maxPage = 7) {
  return Array.from({ length }, () => Math.floor(Math.random() * (maxPage + 1))).join(' ');
}

// "7 0 1, 2" -> { pages: [7, 0, 1, 2] }  or  { error: '...' }
export function parseReferenceString(input) {
  const tokens = String(input).trim().split(/[\s,]+/).filter(Boolean);
  if (tokens.length === 0) return { error: 'Enter at least one page number, for example 7 0 1 2.' };
  if (tokens.length > MAX_REFERENCES) {
    return { error: `Use at most ${MAX_REFERENCES} page references so the frame table stays readable.` };
  }
  const pages = [];
  for (const token of tokens) {
    if (!/^\d+$/.test(token)) return { error: `"${token}" is not a page number. Use whole numbers separated by spaces.` };
    const n = Number(token);
    if (n > 99) return { error: 'Page numbers must be between 0 and 99.' };
    pages.push(n);
  }
  return { pages };
}

// Index of the next reference to `page` at or after position `from`, or -1 if it never appears again.
export function nextUseIndex(pages, page, from) {
  for (let j = from; j < pages.length; j++) if (pages[j] === page) return j;
  return -1;
}

/**
 * Runs FIFO or Optimal and returns one entry per reference:
 * { index, page, hit, slot, evicted, explanation, frames, queue, queueSlots, nextUse, faults, hits }
 */
export function simulate(algorithm, pages, frameCount) {
  const frames = Array(frameCount).fill(null);
  const queue = []; // frame slots in the order their pages were loaded (front = oldest)
  const steps = [];
  let faults = 0;

  pages.forEach((page, i) => {
    let hit = false;
    let slot = -1;
    let evicted = null;
    let explanation = '';

    const hitSlot = frames.indexOf(page);
    if (hitSlot !== -1) {
      hit = true;
      slot = hitSlot;
      explanation = `Page ${page} is already in Frame ${hitSlot + 1}. Page hit, so memory stays unchanged.`;
    } else {
      faults += 1;
      const empty = frames.indexOf(null);

      if (empty !== -1) {
        slot = empty;
        explanation = `Page ${page} is not in memory, so a page fault occurs. Frame ${empty + 1} is free, so the page is loaded there without replacing anything.`;
      } else if (algorithm === 'FIFO') {
        slot = queue[0];
        evicted = frames[slot];
        explanation = `Page ${page} causes a page fault and every frame is full. Page ${evicted} has been in memory the longest (front of the FIFO queue), so it is replaced.`;
      } else {
        let farthest = -1;
        frames.forEach((resident, s) => {
          const next = nextUseIndex(pages, resident, i + 1);
          const distance = next === -1 ? Infinity : next;
          if (distance > farthest) {
            farthest = distance;
            slot = s;
          }
        });
        evicted = frames[slot];
        explanation =
          farthest === Infinity
            ? `Page ${page} causes a page fault and every frame is full. Page ${evicted} is never referenced again, so replacing it is the optimal choice.`
            : `Page ${page} causes a page fault and every frame is full. Page ${evicted} is not needed until reference #${farthest + 1}, later than every other page in memory, so it is replaced.`;
      }

      if (evicted !== null) queue.splice(queue.indexOf(slot), 1);
      frames[slot] = page;
      queue.push(slot);
    }

    steps.push({
      index: i,
      page,
      hit,
      slot,
      evicted,
      explanation,
      frames: [...frames],
      queue: queue.map((s) => frames[s]),
      queueSlots: [...queue],
      nextUse: frames.map((p) => (p === null ? null : nextUseIndex(pages, p, i + 1))),
      faults,
      hits: i + 1 - faults,
    });
  });

  return steps;
}

export function summarize(steps) {
  const total = steps.length;
  const faults = total ? steps[total - 1].faults : 0;
  const hits = total - faults;
  return {
    total,
    faults,
    hits,
    hitRatio: total ? (hits / total) * 100 : 0,
    faultRatio: total ? (faults / total) * 100 : 0,
  };
}

export function formatPct(value) {
  return `${Number.isInteger(value) ? value : value.toFixed(1)}%`;
}

export function frameAddress(frameIndex) {
  // 4 KB frames: Frame 1 -> 0x0000, Frame 2 -> 0x1000 ...
  return `0x${(frameIndex * 0x1000).toString(16).toUpperCase().padStart(4, '0')}`;
}
