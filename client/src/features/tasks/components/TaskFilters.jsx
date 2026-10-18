import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Select } from '../../../components/ui/Input.jsx';
import { SORT_OPTIONS } from '../utils/taskUtils.js';
import { TASK_STATUSES, TASK_STATUS_META } from '../schemas/task.schema.js';
import { cn } from '../../../utils/cn.js';

/**
 * Search + status filter + sort controls. All three are wired to real state.
 */
export function TaskFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  sort,
  onSortChange,
  resultCount,
  isFiltering,
  onReset,
}) {
  const statusOptions = [{ value: 'all', label: 'All' }, ...TASK_STATUSES.map((value) => ({
    value,
    label: TASK_STATUS_META[value].label,
  }))];

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-muted"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search title or description…"
            aria-label="Search tasks"
            className="h-10 w-full rounded-lg border border-border-base bg-bg-soft pl-9 pr-9 text-sm text-fg placeholder:text-fg-muted/70 transition-colors hover:border-border-strong focus:border-accent focus:outline-none"
          />
          {search ? (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-fg-muted hover:text-fg"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          ) : null}
        </div>

        <div className="sm:w-48">
          <Select aria-label="Sort tasks" value={sort} onChange={(event) => onSortChange(event.target.value)}>
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <SlidersHorizontal className="mr-1 size-3.5 text-fg-muted" aria-hidden="true" />
        {statusOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onStatusChange(option.value)}
            aria-pressed={status === option.value}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              status === option.value
                ? 'border-accent/40 bg-accent/12 text-accent'
                : 'border-border-base text-fg-muted hover:border-border-strong hover:text-fg'
            )}
          >
            {option.label}
          </button>
        ))}

        <span className="ml-auto text-[11px] text-fg-muted" aria-live="polite">
          {resultCount} {resultCount === 1 ? 'task' : 'tasks'}
        </span>
        {isFiltering ? (
          <button
            type="button"
            onClick={onReset}
            className="text-[11px] font-medium text-accent underline-offset-2 hover:underline"
          >
            Clear filters
          </button>
        ) : null}
      </div>
    </div>
  );
}
