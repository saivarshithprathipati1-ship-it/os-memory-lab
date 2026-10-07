import { SlidersHorizontal } from 'lucide-react';

export default function EmptyState({ onNavigate, text }) {
  return (
    <div className="card flex flex-col items-center gap-4 px-6 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-300">
        <SlidersHorizontal size={22} />
      </span>
      <div>
        <p className="font-semibold text-slate-900 dark:text-white">No simulation data yet</p>
        <p className="muted mx-auto mt-1 max-w-md text-sm">
          {text || 'Enter an algorithm, the number of frames and a reference string in the Simulator, then run it.'}
        </p>
      </div>
      {onNavigate && (
        <button type="button" className="btn-primary" onClick={() => onNavigate('simulator')}>
          Enter data in the Simulator
        </button>
      )}
    </div>
  );
}
