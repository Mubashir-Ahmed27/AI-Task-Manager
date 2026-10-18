import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import { PlanForm } from '../features/ai-planner/components/PlanForm.jsx';
import { PlanResult } from '../features/ai-planner/components/PlanResult.jsx';
import { usePlanTask } from '../features/ai-planner/hooks/usePlanTask.js';
import { tasksApi } from '../features/tasks/api/tasks.api.js';
import {
  buildTaskDescription,
  getPlanErrorMessage,
} from '../features/ai-planner/utils/planUtils.js';
import { Card, CardBody } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Spinner } from '../components/ui/Spinner.jsx';
import { useToast } from '../app/providers/ToastProvider.jsx';

export default function AiPlannerPage() {
  const { plan, isGenerating, error, status, generate, reset } = usePlanTask();
  const { pushToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [savedTask, setSavedTask] = useState(null);

  const handleGenerate = async (description) => {
    setSavedTask(null);
    await generate(description);
  };

  const handleSaveAsTask = async (currentPlan) => {
    setIsSaving(true);
    try {
      const created = await tasksApi.create({
        title: currentPlan.summary.slice(0, 200),
        description: buildTaskDescription(currentPlan),
        status: 'pending',
      });
      // Only shown after the API confirms the task was persisted.
      setSavedTask(created);
      pushToast({
        title: 'Task created from plan',
        description: created.title,
      });
    } catch (err) {
      pushToast({
        title: 'Could not save the task',
        description: err.message || 'Please try again.',
        variant: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardBody className="space-y-4">
          <div className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent/12 text-accent ring-1 ring-inset ring-accent/25"
            >
              <Sparkles className="size-5" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-fg">Turn a goal into a plan</h2>
              <p className="mt-1 text-xs leading-relaxed text-fg-muted">
                Describe what you need to accomplish. The backend asks Groq for a structured plan,
                validates it, and returns a summary, priority, effort estimate, and 3–7 steps.
              </p>
            </div>
          </div>

          <PlanForm onGenerate={handleGenerate} isGenerating={isGenerating} />
        </CardBody>
      </Card>

      {isGenerating ? (
        <Card>
          <CardBody className="flex items-center gap-3 py-8">
            <Spinner label="Generating your plan…" />
            <span className="text-xs text-fg-muted">
              This usually takes a few seconds. You can keep the page open.
            </span>
          </CardBody>
        </Card>
      ) : null}

      {error && !isGenerating ? (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-danger/40 bg-danger-soft/30 p-4"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-fg">Plan generation failed</p>
            <p className="mt-1 text-xs leading-relaxed text-fg-muted">
              {getPlanErrorMessage(status, error)}
            </p>
          </div>
        </div>
      ) : null}

      {savedTask && !isGenerating ? (
        <div
          role="status"
          className="flex flex-col gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="flex items-center gap-2 text-xs text-fg">
            <CheckCircle2 className="size-4 text-emerald-500" aria-hidden="true" />
            Saved to your task list as “{savedTask.title}”.
          </p>
          <Button as={Link} to="/tasks" variant="secondary" size="sm" className="gap-1.5">
            Go to tasks <ArrowRight className="size-3.5" aria-hidden="true" />
          </Button>
        </div>
      ) : null}

      {plan && !isGenerating ? (
        <PlanResult
          plan={plan}
          onSave={handleSaveAsTask}
          isSaving={isSaving}
          onChangePlan={reset}
        />
      ) : null}

      {!plan && !isGenerating && !error ? (
        <p className="text-center text-xs text-fg-muted">
          No plan yet — describe a goal above to get started.
        </p>
      ) : null}
    </div>
  );
}
