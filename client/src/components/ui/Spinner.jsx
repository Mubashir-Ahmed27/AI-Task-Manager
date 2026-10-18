import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn.js';

export function Spinner({ className, label = 'Loading' }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-fg-muted" role="status">
      <Loader2 className={cn('size-4 animate-spin text-accent', className)} aria-hidden="true" />
      <span className="sr-only sm:not-sr-only">{label}</span>
    </span>
  );
}

export function Skeleton({ className }) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-lg bg-surface-2', className)}
    />
  );
}

export function TaskListSkeleton({ count = 3 }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading tasks…</span>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="rounded-xl border border-border-base bg-surface/70 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="w-full space-y-2">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-3 w-4/5" />
            </div>
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="rounded-xl border border-border-base bg-surface/70 p-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-3 h-7 w-12" />
        </div>
      ))}
    </div>
  );
}
