import { CalendarDays, Check, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge.jsx';
import { TASK_STATUS_META } from '../schemas/task.schema.js';
import { formatDate, getDueDateHint } from '../../../utils/date.js';
import { cn } from '../../../utils/cn.js';

/**
 * One task row/card.
 * `onToggleStatus` intentionally only flips pending/in-progress <-> completed.
 */
export function TaskCard({ task, onEdit, onDelete, onToggleStatus, isBusy = false }) {
  const statusMeta = TASK_STATUS_META[task.status] || TASK_STATUS_META.pending;
  const dueLabel = formatDate(task.dueDate);
  const dueHint = getDueDateHint(task.dueDate);
  const isCompleted = task.status === 'completed';

  return (
    <article
      data-task-card
      className={cn(
        'group rounded-xl border border-border-base bg-surface/90 p-4 transition-colors hover:border-border-strong',
        isBusy && 'opacity-60'
      )}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => onToggleStatus(task)}
          disabled={isBusy}
          aria-pressed={isCompleted}
          aria-label={isCompleted ? `Mark "${task.title}" as pending` : `Mark "${task.title}" as completed`}
          className={cn(
            'mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border transition',
            isCompleted
              ? 'border-emerald-500/60 bg-emerald-500/20 text-emerald-500'
              : 'border-border-strong text-transparent hover:border-accent hover:text-accent/60'
          )}
        >
          <Check className="size-3.5" aria-hidden="true" />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3
              className={cn(
                'text-sm font-semibold leading-snug text-fg',
                isCompleted && 'text-fg-muted line-through decoration-fg-muted/50'
              )}
            >
              {task.title}
            </h3>
            <Badge className={statusMeta.badgeClass}>
              <span className={cn('size-1.5 rounded-full', statusMeta.dotClass)} aria-hidden="true" />
              {statusMeta.label}
            </Badge>
          </div>

          {task.description ? (
            <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-fg-muted">
              {task.description}
            </p>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            {dueLabel ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] text-fg-muted">
                <CalendarDays className="size-3.5" aria-hidden="true" />
                <span>
                  Due {dueLabel}
                  {dueHint ? (
                    <span
                      className={cn(
                        'ml-1.5 font-medium',
                        dueHint.tone === 'danger' && 'text-danger',
                        dueHint.tone === 'warning' && 'text-warning'
                      )}
                    >
                      · {dueHint.label}
                    </span>
                  ) : null}
                </span>
              </span>
            ) : (
              <span className="text-[11px] text-fg-muted/70">No due date</span>
            )}

            <div className="ml-auto flex items-center gap-1">
              <button
                type="button"
                onClick={() => onEdit(task)}
                disabled={isBusy}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-fg-muted transition hover:bg-surface-2 hover:text-fg disabled:opacity-50"
              >
                <Pencil className="size-3.5" aria-hidden="true" />
                Edit
              </button>
              <button
                type="button"
                onClick={() => onDelete(task)}
                disabled={isBusy}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-fg-muted transition hover:bg-danger/10 hover:text-danger disabled:opacity-50"
              >
                <Trash2 className="size-3.5" aria-hidden="true" />
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
