import { cn } from '../../utils/cn.js';

/**
 * Shared "nothing here yet" panel. Every empty state should explain what the
 * user can do next instead of only saying "no data".
 */
export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-border-base bg-surface/40 px-6 py-12 text-center',
        className
      )}
    >
      {Icon ? (
        <div className="mb-3 grid size-11 place-items-center rounded-full border border-border-base bg-surface-2 text-fg-muted">
          <Icon className="size-5" aria-hidden="true" />
        </div>
      ) : null}
      <h3 className="text-sm font-semibold text-fg">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-sm text-xs leading-relaxed text-fg-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

/**
 * Inline error panel with an optional retry action.
 */
export function ErrorState({ title = 'Something went wrong', message, onRetry }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-danger/40 bg-danger-soft/40 px-4 py-4 text-sm"
    >
      <p className="font-medium text-danger">{title}</p>
      {message ? <p className="mt-1 text-xs leading-relaxed text-fg-muted">{message}</p> : null}
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-md border border-danger/40 px-3 py-1.5 text-xs font-medium text-danger transition hover:bg-danger/10"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}
