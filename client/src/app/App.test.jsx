import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from './App.jsx';
import { ThemeProvider } from './providers/ThemeProvider.jsx';
import { ToastProvider } from './providers/ToastProvider.jsx';

const task = {
  _id: 'task-1',
  title: 'Write the README',
  description: 'Document setup, tests, deployment',
  status: 'pending',
  dueDate: '2099-08-01T00:00:00.000Z',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function renderApp(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ThemeProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
}

describe('App routing and data integration', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    fetch.mockImplementation(async (url, options = {}) => {
      if (url.endsWith('/api/ai/plan-task')) {
        return jsonResponse({
          success: true,
          plan: {
            summary: 'Build a portfolio site',
            priority: 'high',
            estimatedHours: 12,
            steps: ['Plan the structure', 'Build the layout', 'Deploy it'],
          },
        });
      }
      if (options.method === 'POST' && url.endsWith('/api/tasks')) {
        return jsonResponse({ success: true, task: { ...task, _id: 'task-2', title: 'Build a portfolio site' } }, 201);
      }
      return jsonResponse({ success: true, count: 1, tasks: [task] });
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the dashboard from API data', async () => {
    renderApp('/');

    expect(await screen.findByText('Total tasks')).toBeInTheDocument();
    expect((await screen.findAllByText('Write the README')).length).toBeGreaterThan(0);
    await waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/tasks', expect.anything()));
  });

  it('searches tasks and shows the filtered empty state', async () => {
    const user = userEvent.setup();
    renderApp('/tasks');

    expect(await screen.findByText('Write the README')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Search tasks'), 'no-such-task');

    expect(await screen.findByText('No tasks match your filters')).toBeInTheDocument();
  });

  it('generates an AI plan and saves it as a task', async () => {
    const user = userEvent.setup();
    renderApp('/ai-planner');

    await user.type(
      screen.getByLabelText('What do you need to get done?'),
      'Build a portfolio site this week'
    );
    await user.click(screen.getByRole('button', { name: 'Generate plan' }));

    expect(await screen.findByText('Build a portfolio site')).toBeInTheDocument();
    expect(screen.getByText(/Estimated effort: ~12 hours/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Save as task' }));

    expect(await screen.findByText(/Saved to your task list/)).toBeInTheDocument();
    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        '/api/tasks',
        expect.objectContaining({ method: 'POST' })
      )
    );
  });

  it('renders the not found page for unknown routes', () => {
    renderApp('/nope');
    expect(screen.getByText('This page does not exist')).toBeInTheDocument();
  });
});
