import { cn } from '../../utils/cn.js';

/**
 * Dashboard KPI tile. `accent` controls the icon chip colour per metric.
 */
export function StatCard({ label, value, icon: Icon, hint, accent = 'neutral' }) {
  const accents = {
    neutral: 'bg-surface-2 text-fg-muted',
    pending: 'bg-amber-500/12 text-amber-500',
    'in-progress': 'bg-sky-500/12 text-sky-500',
    completed: 'bg-emerald-500/12 text-emerald-500',
    danger: 'bg-red-500/12 text-red-500',
  };

  return (
    <div className="rounded-xl border border-border-base bg-surface/90 p-4 transition-colors hover:border-border-strong">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium uppercase tracking-wide text-fg-muted">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-fg">
            {value}
          </p>
          {hint ? <p className="mt-1 text-[11px] text-fg-muted">{hint}</p> : null}
        </div>
        {Icon ? (
          <span
            aria-hidden="true"
            className={cn('grid size-9 shrink-0 place-items-center rounded-lg', accents[accent])}
          >
            <Icon className="size-4" />
          </span>
        ) : null}
      </div>
    </div>
  );
}
