export const TASK_STATUSES = ['pending', 'in-progress', 'completed'];

export const TASK_STATUS_META = {
  pending: {
    label: 'Pending',
    badgeClass: 'bg-amber-500/12 text-amber-600 dark:text-amber-300 border-amber-500/30',
    dotClass: 'bg-amber-500',
  },
  'in-progress': {
    label: 'In progress',
    badgeClass: 'bg-sky-500/12 text-sky-600 dark:text-sky-300 border-sky-500/30',
    dotClass: 'bg-sky-500',
  },
  completed: {
    label: 'Completed',
    badgeClass: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-300 border-emerald-500/30',
    dotClass: 'bg-emerald-500',
  },
};

export const PRIORITY_META = {
  low: 'bg-slate-500/12 text-fg-muted border-slate-500/30',
  medium: 'bg-amber-500/12 text-amber-600 dark:text-amber-300 border-amber-500/30',
  high: 'bg-red-500/12 text-red-600 dark:text-red-300 border-red-500/30',
};
