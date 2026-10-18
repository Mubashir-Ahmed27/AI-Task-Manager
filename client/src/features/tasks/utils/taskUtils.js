import { TASK_STATUSES } from '../schemas/task.schema.js';

/**
 * Filters tasks by free-text search (title + description) and status.
 * Pure function → easy to unit test and reuse on dashboard and tasks page.
 */
export function filterTasks(tasks, { search = '', status = 'all' } = {}) {
  const term = search.trim().toLowerCase();

  return tasks.filter((task) => {
    const matchesStatus = status === 'all' || task.status === status;
    if (!matchesStatus) return false;
    if (!term) return true;

    const title = (task.title || '').toLowerCase();
    const description = (task.description || '').toLowerCase();
    return title.includes(term) || description.includes(term);
  });
}

/**
 * Sorts tasks without mutating the input array.
 */
export function sortTasks(tasks, sort = 'newest') {
  const list = [...tasks];
  const time = (value) => (value ? new Date(value).getTime() : 0);

  switch (sort) {
    case 'oldest':
      return list.sort((a, b) => time(a.createdAt) - time(b.createdAt));
    case 'dueDate':
      return list.sort((a, b) => {
        // Tasks without a due date go last instead of pretending to be due in 1970.
        if (!a.dueDate && !b.dueDate) return time(b.createdAt) - time(a.createdAt);
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return time(a.dueDate) - time(b.dueDate);
      });
    case 'title':
      return list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    case 'newest':
    default:
      return list.sort((a, b) => time(b.createdAt) - time(a.createdAt));
  }
}

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'dueDate', label: 'Due date' },
  { value: 'title', label: 'Title (A–Z)' },
];

/**
 * Derives dashboard statistics from real task records.
 */
export function computeTaskStats(tasks) {
  const stats = {
    total: tasks.length,
    pending: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0,
  };

  const now = Date.now();

  tasks.forEach((task) => {
    if (task.status === 'pending') stats.pending += 1;
    if (task.status === 'in-progress') stats.inProgress += 1;
    if (task.status === 'completed') stats.completed += 1;

    if (task.dueDate && task.status !== 'completed') {
      const due = new Date(task.dueDate).getTime();
      if (!Number.isNaN(due) && due < now) stats.overdue += 1;
    }
  });

  stats.completionRate = stats.total === 0 ? 0 : Math.round((stats.completed / stats.total) * 100);
  return stats;
}

/**
 * Tasks with a due date that are not completed, soonest first (max 5).
 */
export function getUpcomingTasks(tasks, limit = 5) {
  return tasks
    .filter((task) => task.dueDate && task.status !== 'completed')
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, limit);
}

/**
 * Client-side form validation mirroring the server rules.
 * The server is still the authority; this just gives instant feedback.
 */
export function validateTaskForm(values) {
  const errors = {};
  const title = (values.title || '').trim();

  if (!title) {
    errors.title = 'Title is required.';
  } else if (title.length > 200) {
    errors.title = 'Title cannot exceed 200 characters.';
  }

  if ((values.description || '').trim().length > 4000) {
    errors.description = 'Description cannot exceed 4000 characters.';
  }

  if (values.status && !TASK_STATUSES.includes(values.status)) {
    errors.status = 'Choose a valid status.';
  }

  if (values.dueDate) {
    const parsed = new Date(`${values.dueDate}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) {
      errors.dueDate = 'Enter a valid date.';
    }
  }

  return errors;
}

/**
 * Builds the JSON body sent to the API from raw form values.
 */
export function toTaskPayload(values) {
  const payload = {
    title: (values.title || '').trim(),
    description: (values.description || '').trim(),
    status: values.status || 'pending',
    dueDate: values.dueDate ? new Date(`${values.dueDate}T00:00:00`).toISOString() : null,
  };
  return payload;
}
