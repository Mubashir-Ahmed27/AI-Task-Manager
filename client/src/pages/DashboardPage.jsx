import { useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Circle,
  Clock3,
  ListChecks,
  Plus,
  Sparkles,
} from 'lucide-react';
import { useTasks } from '../features/tasks/hooks/useTasks.js';
import { computeTaskStats, getUpcomingTasks } from '../features/tasks/utils/taskUtils.js';
import { TASK_STATUS_META } from '../features/tasks/schemas/task.schema.js';
import { StatsSkeleton, TaskListSkeleton } from '../components/ui/Spinner.jsx';
import { EmptyState, ErrorState } from '../components/ui/EmptyState.jsx';
import { StatCard } from '../components/shared/StatCard.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card, CardBody, CardHeader } from '../components/ui/Card.jsx';
import { formatDate, getDueDateHint } from '../utils/date.js';
import { useReducedMotion } from '../hooks/useReducedMotion.js';
import { cn } from '../utils/cn.js';

gsap.registerPlugin(useGSAP);

function RecentTaskRow({ task }) {
  const meta = TASK_STATUS_META[task.status] || TASK_STATUS_META.pending;
  return (
    <li className="flex items-start justify-between gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-surface-2/60">
      <div className="min-w-0">
        <p
          className={cn(
            'truncate text-sm text-fg',
            task.status === 'completed' && 'text-fg-muted line-through'
          )}
        >
          {task.title}
        </p>
        <p className="mt-0.5 text-[11px] text-fg-muted">
          Created {formatDate(task.createdAt) || 'just now'}
        </p>
      </div>
      <Badge className={meta.badgeClass}>{meta.label}</Badge>
    </li>
  );
}

function UpcomingRow({ task }) {
  const hint = getDueDateHint(task.dueDate);
  return (
    <li className="flex items-start justify-between gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-surface-2/60">
      <div className="min-w-0">
        <p className="truncate text-sm text-fg">{task.title}</p>
        <p className="mt-0.5 text-[11px] text-fg-muted">Due {formatDate(task.dueDate)}</p>
      </div>
      {hint ? (
        <Badge
          className={
            hint.tone === 'danger'
              ? 'border-red-500/30 bg-red-500/10 text-red-500'
              : 'border-amber-500/30 bg-amber-500/10 text-amber-500'
          }
        >
          {hint.label}
        </Badge>
      ) : null}
    </li>
  );
}


export default function DashboardPage() {
  const { tasks, isLoading, error, refetch } = useTasks();
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const pageRef = useRef(null);

  const stats = computeTaskStats(tasks);
  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);
  const upcomingTasks = getUpcomingTasks(tasks, 5);

  // Entrance animation: opacity + small translate only, so nothing shifts layout.
  useGSAP(
    () => {
      if (prefersReducedMotion || isLoading) return;
      const blocks = gsap.utils.toArray('[data-animate-in]');
      if (blocks.length) {
        gsap.fromTo(
          blocks,
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, ease: 'power2.out' }
        );
      }
      const cards = gsap.utils.toArray('[data-stat-card]');
      if (cards.length) {
        gsap.fromTo(
          cards,
          { opacity: 0, y: 8 },
          { opacity: 1, y: 0, duration: 0.35, stagger: 0.05, ease: 'power2.out', delay: 0.05 }
        );
      }
    },
    { dependencies: [isLoading, prefersReducedMotion], scope: pageRef }
  );

  return (
    <div ref={pageRef} className="space-y-6">
      <section
        data-animate-in
        className="flex flex-col gap-3 rounded-2xl border border-border-base bg-surface/80 p-5 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h2 className="text-sm font-semibold text-fg">Welcome back</h2>
          <p className="mt-1 text-xs leading-relaxed text-fg-muted">
            {isLoading
              ? 'Loading your workspace…'
              : stats.total === 0
                ? 'Your workspace is empty. Create a task or plan a goal with AI.'
                : `You have ${stats.pending + stats.inProgress} open ${
                    stats.pending + stats.inProgress === 1 ? 'task' : 'tasks'
                  } and ${stats.completionRate}% completion overall.`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button leftIcon={Plus} onClick={() => navigate('/tasks?new=1')} size="sm">
            New task
          </Button>
          <Button
            variant="secondary"
            leftIcon={Sparkles}
            size="sm"
            onClick={() => navigate('/ai-planner')}
          >
            AI planner
          </Button>
        </div>
      </section>

      {error ? (
        <ErrorState
          title="Could not load dashboard data"
          message={error}
          onRetry={() => refetch()}
        />
      ) : null}

      <section aria-labelledby="stats-heading" data-animate-in>
        <h2 id="stats-heading" className="sr-only">
          Task statistics
        </h2>
        {isLoading ? (
          <StatsSkeleton />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div data-stat-card>
              <StatCard
                label="Total tasks"
                value={stats.total}
                icon={ListChecks}
                hint={`${stats.completionRate}% complete`}
              />
            </div>
            <div data-stat-card>
              <StatCard label="Pending" value={stats.pending} icon={Circle} accent="pending" />
            </div>
            <div data-stat-card>
              <StatCard
                label="In progress"
                value={stats.inProgress}
                icon={Clock3}
                accent="in-progress"
              />
            </div>
            <div data-stat-card>
              <StatCard
                label="Completed"
                value={stats.completed}
                icon={CheckCircle2}
                accent="completed"
                hint={stats.overdue > 0 ? `${stats.overdue} overdue` : undefined}
              />
            </div>
          </div>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card data-animate-in className="overflow-hidden">
          <CardHeader
            title="Recent tasks"
            description="The five most recently created tasks."
            action={
              <Link
                to="/tasks"
                className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
              >
                View all <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            }
          />
          <CardBody className="pt-3">
            {isLoading ? (
              <TaskListSkeleton count={3} />
            ) : recentTasks.length === 0 ? (
              <EmptyState
                icon={ListChecks}
                title="No tasks yet"
                description="Create your first task to see it appear here."
                className="border-0 bg-transparent py-8"
              />
            ) : (
              <ul className="divide-y divide-border-base/60">
                {recentTasks.map((task) => (
                  <RecentTaskRow key={task._id} task={task} />
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card data-animate-in className="overflow-hidden">
          <CardHeader
            title="Upcoming due dates"
            description="Open tasks with the nearest deadlines."
            action={<CalendarClock className="size-4 text-fg-muted" aria-hidden="true" />}
          />
          <CardBody className="pt-3">
            {isLoading ? (
              <TaskListSkeleton count={3} />
            ) : upcomingTasks.length === 0 ? (
              <EmptyState
                icon={CalendarClock}
                title="Nothing scheduled"
                description="Add due dates to tasks to track deadlines here."
                className="border-0 bg-transparent py-8"
              />
            ) : (
              <ul className="divide-y divide-border-base/60">
                {upcomingTasks.map((task) => (
                  <UpcomingRow key={task._id} task={task} />
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
