import { describe, it, expect } from 'vitest';
import {
  filterTasks,
  sortTasks,
  computeTaskStats,
  getUpcomingTasks,
  validateTaskForm,
  toTaskPayload,
} from './taskUtils.js';

const tasks = [
  {
    _id: '1',
    title: 'Write tests',
    description: 'Cover the task service',
    status: 'completed',
    createdAt: '2026-01-01T00:00:00.000Z',
    dueDate: null,
  },
  {
    _id: '2',
    title: 'Design dashboard',
    description: 'Dark theme with Tailwind',
    status: 'in-progress',
    createdAt: '2026-01-03T00:00:00.000Z',
    dueDate: '2099-01-05T00:00:00.000Z',
  },
  {
    _id: '3',
    title: 'Deploy backend',
    description: 'Render + MongoDB Atlas',
    status: 'pending',
    createdAt: '2026-01-02T00:00:00.000Z',
    dueDate: '2099-01-02T00:00:00.000Z',
  },
];

describe('taskUtils.filterTasks', () => {
  it('returns everything when no filters are applied', () => {
    expect(filterTasks(tasks)).toHaveLength(3);
  });

  it('filters by status', () => {
    const result = filterTasks(tasks, { status: 'pending' });
    expect(result.map((t) => t._id)).toEqual(['3']);
  });

  it('searches title and description case-insensitively', () => {
    expect(filterTasks(tasks, { search: 'TAILWIND' }).map((t) => t._id)).toEqual(['2']);
    expect(filterTasks(tasks, { search: 'deploy' }).map((t) => t._id)).toEqual(['3']);
    expect(filterTasks(tasks, { search: 'nothing-here' })).toHaveLength(0);
  });

  it('combines search and status filters', () => {
    expect(filterTasks(tasks, { search: 'dashboard', status: 'completed' })).toHaveLength(0);
  });
});

describe('taskUtils.sortTasks', () => {
  it('sorts newest and oldest without mutating the input', () => {
    const copy = [...tasks];
    expect(sortTasks(tasks, 'newest').map((t) => t._id)).toEqual(['2', '3', '1']);
    expect(sortTasks(tasks, 'oldest').map((t) => t._id)).toEqual(['1', '3', '2']);
    expect(tasks).toEqual(copy);
  });

  it('sorts by due date and pushes undated tasks last', () => {
    expect(sortTasks(tasks, 'dueDate').map((t) => t._id)).toEqual(['3', '2', '1']);
  });

  it('sorts alphabetically by title', () => {
    expect(sortTasks(tasks, 'title').map((t) => t.title)).toEqual([
      'Deploy backend',
      'Design dashboard',
      'Write tests',
    ]);
  });
});

describe('taskUtils.computeTaskStats', () => {
  it('derives counts and completion rate from real records', () => {
    const stats = computeTaskStats(tasks);
    expect(stats).toMatchObject({ total: 3, pending: 1, inProgress: 1, completed: 1 });
    expect(stats.completionRate).toBe(33);
  });

  it('handles an empty list', () => {
    expect(computeTaskStats([])).toMatchObject({ total: 0, completionRate: 0 });
  });

  it('counts overdue tasks but ignores completed ones', () => {
    const stats = computeTaskStats([
      { status: 'pending', dueDate: '2020-01-01T00:00:00.000Z' },
      { status: 'completed', dueDate: '2020-01-01T00:00:00.000Z' },
    ]);
    expect(stats.overdue).toBe(1);
  });
});

describe('taskUtils.getUpcomingTasks', () => {
  it('returns only open, dated tasks sorted soonest first', () => {
    expect(getUpcomingTasks(tasks).map((t) => t._id)).toEqual(['3', '2']);
  });
});

describe('taskUtils.validateTaskForm / toTaskPayload', () => {
  it('requires a title', () => {
    expect(validateTaskForm({ title: '   ' }).title).toBeTruthy();
    expect(validateTaskForm({ title: 'Valid' })).toEqual({});
  });

  it('rejects invalid status and dates', () => {
    expect(validateTaskForm({ title: 'A', status: 'nope' }).status).toBeTruthy();
    expect(validateTaskForm({ title: 'A', dueDate: 'not-a-date' }).dueDate).toBeTruthy();
  });

  it('trims values and converts dates for the API', () => {
    const payload = toTaskPayload({
      title: '  Ship it  ',
      description: '  with tests  ',
      status: 'in-progress',
      dueDate: '2026-05-01',
    });

    expect(payload.title).toBe('Ship it');
    expect(payload.description).toBe('with tests');
    expect(payload.status).toBe('in-progress');
    expect(new Date(payload.dueDate).toISOString()).toBe(
      new Date('2026-05-01T00:00:00').toISOString()
    );
  });

  it('maps an empty due date to null', () => {
    expect(toTaskPayload({ title: 'No deadline' }).dueDate).toBeNull();
  });
});
