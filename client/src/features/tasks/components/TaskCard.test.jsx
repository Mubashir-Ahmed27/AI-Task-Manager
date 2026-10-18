import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskCard } from './TaskCard.jsx';

const task = {
  _id: 'abc123',
  title: 'Ship the dashboard',
  description: 'Stats, charts, empty states',
  status: 'in-progress',
  dueDate: '2099-04-01T00:00:00.000Z',
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('TaskCard', () => {
  it('renders the task title, description, and status badge', () => {
    render(<TaskCard task={task} onEdit={vi.fn()} onDelete={vi.fn()} onToggleStatus={vi.fn()} />);

    expect(screen.getByText('Ship the dashboard')).toBeInTheDocument();
    expect(screen.getByText('Stats, charts, empty states')).toBeInTheDocument();
    expect(screen.getByText('In progress')).toBeInTheDocument();
  });

  it('calls edit and delete handlers with the task', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(<TaskCard task={task} onEdit={onEdit} onDelete={onDelete} onToggleStatus={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /edit/i }));
    expect(onEdit).toHaveBeenCalledWith(task);

    await user.click(screen.getByRole('button', { name: /delete/i }));
    expect(onDelete).toHaveBeenCalledWith(task);
  });

  it('toggles completion through the checkbox button', async () => {
    const user = userEvent.setup();
    const onToggleStatus = vi.fn();

    render(
      <TaskCard task={task} onEdit={vi.fn()} onDelete={vi.fn()} onToggleStatus={onToggleStatus} />
    );

    await user.click(screen.getByRole('button', { name: /mark "ship the dashboard" as completed/i }));
    expect(onToggleStatus).toHaveBeenCalledWith(task);
  });
});
