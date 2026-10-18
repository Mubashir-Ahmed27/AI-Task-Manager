import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ListChecks, Plus, RefreshCw } from 'lucide-react';
import { useTasks } from '../features/tasks/hooks/useTasks.js';
import { useTaskFilters } from '../features/tasks/hooks/useTaskFilters.js';
import { TaskCard } from '../features/tasks/components/TaskCard.jsx';
import { TaskFilters } from '../features/tasks/components/TaskFilters.jsx';
import { TaskFormDialog } from '../features/tasks/components/TaskFormDialog.jsx';
import { DeleteTaskDialog } from '../features/tasks/components/DeleteTaskDialog.jsx';
import { Button } from '../components/ui/Button.jsx';
import { EmptyState, ErrorState } from '../components/ui/EmptyState.jsx';
import { TaskListSkeleton } from '../components/ui/Spinner.jsx';
import { useToast } from '../app/providers/ToastProvider.jsx';
import { useReducedMotion } from '../hooks/useReducedMotion.js';

gsap.registerPlugin(useGSAP);

function extractErrorMessage(error) {
  if (!error) return 'Something went wrong.';
  if (error.errors?.length) return `${error.message} (${error.errors[0]})`;
  return error.message || 'Something went wrong.';
}

export default function TasksPage() {
  const { tasks, isLoading, error, isMutating, refetch, createTask, updateTask, deleteTask } =
    useTasks();
  const filters = useTaskFilters(tasks);
  const { pushToast } = useToast();
  const prefersReducedMotion = useReducedMotion();
  const [searchParams, setSearchParams] = useSearchParams();

  const [formState, setFormState] = useState({ open: false, task: null });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formError, setFormError] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const listRef = useRef(null);

  // Deep link: /tasks?new=1 opens the create dialog (header quick action).
  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setFormState({ open: true, task: null });
      const next = new URLSearchParams(searchParams);
      next.delete('new');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Subtle staggered entrance when the visible list changes. useGSAP scopes and cleans up.
  useGSAP(
    () => {
      if (prefersReducedMotion) return;
      const cards = gsap.utils.toArray('[data-task-card]');
      if (!cards.length) return;
      gsap.fromTo(
        cards,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.28, stagger: 0.04, ease: 'power2.out', overwrite: true }
      );
    },
    { dependencies: [filters.visibleTasks, prefersReducedMotion], scope: listRef }
  );

  const openCreate = () => {
    setFormError(null);
    setFormState({ open: true, task: null });
  };

  const openEdit = (task) => {
    setFormError(null);
    setFormState({ open: true, task });
  };

  const closeForm = () => {
    if (isMutating) return;
    setFormState({ open: false, task: null });
    setFormError(null);
  };

  const handleSubmit = async (payload) => {
    setFormError(null);
    try {
      if (formState.task) {
        const updated = await updateTask(formState.task._id, payload);
        pushToast({ title: 'Task updated', description: updated.title });
      } else {
        const created = await createTask(payload);
        pushToast({ title: 'Task created', description: created.title });
      }
      setFormState({ open: false, task: null });
    } catch (err) {
      setFormError(extractErrorMessage(err));
    }
  };

  const handleToggleStatus = useCallback(
    async (task) => {
      const nextStatus = task.status === 'completed' ? 'pending' : 'completed';
      try {
        await updateTask(task._id, { status: nextStatus });
        pushToast({
          title: nextStatus === 'completed' ? 'Task completed' : 'Task reopened',
          description: task.title,
        });
      } catch (err) {
        pushToast({
          title: 'Could not update task',
          description: extractErrorMessage(err),
          variant: 'error',
        });
      }
    },
    [updateTask, pushToast]
  );

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteError(null);
    try {
      await deleteTask(deleteTarget._id);
      pushToast({ title: 'Task deleted', description: deleteTarget.title });
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(extractErrorMessage(err));
    }
  };

  const hasTasks = tasks.length > 0;

  return (
    <div className="space-y-5">
      <TaskFilters
        search={filters.search}
        onSearchChange={filters.setSearch}
        status={filters.status}
        onStatusChange={filters.setStatus}
        sort={filters.sort}
        onSortChange={filters.setSort}
        resultCount={filters.visibleTasks.length}
        isFiltering={filters.isFiltering}
        onReset={filters.resetFilters}
      />

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-fg-muted">
          {isLoading ? 'Loading tasks…' : `${tasks.length} total in your workspace`}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={RefreshCw}
            onClick={() => refetch({ silent: true })}
          >
            Refresh
          </Button>
          <Button size="sm" leftIcon={Plus} onClick={openCreate}>
            New task
          </Button>
        </div>
      </div>

      {error ? (
        <ErrorState title="Could not load tasks" message={error} onRetry={() => refetch()} />
      ) : null}

      {isLoading ? (
        <div ref={listRef}>
          <TaskListSkeleton count={4} />
        </div>
      ) : (
        <div ref={listRef} className="space-y-3">
          {filters.visibleTasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              isBusy={isMutating}
              onEdit={openEdit}
              onDelete={(target) => {
                setDeleteError(null);
                setDeleteTarget(target);
              }}
              onToggleStatus={handleToggleStatus}
            />
          ))}
        </div>
      )}

      {!isLoading && !error && filters.visibleTasks.length === 0 ? (
        hasTasks ? (
          <EmptyState
            icon={ListChecks}
            title="No tasks match your filters"
            description="Try a different search term, or clear the filters to see every task again."
            action={
              <Button variant="secondary" onClick={filters.resetFilters}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={ListChecks}
            title="No tasks yet"
            description="Create your first task, or let the AI planner break a bigger goal into steps."
            action={
              <Button leftIcon={Plus} onClick={openCreate}>
                Create a task
              </Button>
            }
          />
        )
      ) : null}

      <TaskFormDialog
        open={formState.open}
        task={formState.task}
        onClose={closeForm}
        onSubmit={handleSubmit}
        isSubmitting={isMutating}
        serverError={formError}
      />

      <DeleteTaskDialog
        open={Boolean(deleteTarget)}
        task={deleteTarget}
        onClose={() => {
          if (isMutating) return;
          setDeleteTarget(null);
          setDeleteError(null);
        }}
        onConfirm={handleDelete}
        isDeleting={isMutating}
        error={deleteError}
      />
    </div>
  );
}

