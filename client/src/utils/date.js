/**
 * Formats an ISO date string for display. Returns null for missing/invalid dates
 * so callers can render an empty state instead of "Invalid Date".
 */
export function formatDate(value, { withTime = false } = {}) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...(withTime ? { hour: 'numeric', minute: '2-digit' } : {}),
  });
}

/**
 * Human-friendly relative hint used on task cards ("Due today", "Overdue").
 */
export function getDueDateHint(value) {
  if (!value) return null;
  const due = new Date(value);
  if (Number.isNaN(due.getTime())) return null;

  const today = new Date();
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((startOfDay(due) - startOfDay(today)) / 86400000);

  if (diffDays < 0) return { label: 'Overdue', tone: 'danger' };
  if (diffDays === 0) return { label: 'Due today', tone: 'warning' };
  if (diffDays === 1) return { label: 'Due tomorrow', tone: 'warning' };
  if (diffDays <= 7) return { label: `Due in ${diffDays} days`, tone: 'muted' };
  return null;
}

/**
 * Converts an ISO string to the `YYYY-MM-DD` value an <input type="date"> expects.
 */
export function toDateInputValue(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

/**
 * Converts a date input value back to an ISO string (or null to clear).
 */
export function toIsoDate(dateInputValue) {
  if (!dateInputValue) return null;
  const date = new Date(`${dateInputValue}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
