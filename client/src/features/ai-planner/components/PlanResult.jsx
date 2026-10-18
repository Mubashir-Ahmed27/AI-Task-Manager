import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Check, Clock3, Copy, ListChecks, Save } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Card, CardBody, CardHeader } from '../../../components/ui/Card.jsx';
import { PRIORITY_META } from '../../tasks/schemas/task.schema.js';
import { formatPlanAsText } from '../utils/planUtils.js';
import { useReducedMotion } from '../../../hooks/useReducedMotion.js';
import { useToast } from '../../../app/providers/ToastProvider.jsx';
import { cn } from '../../../utils/cn.js';

gsap.registerPlugin(useGSAP);

/**
 * Renders a validated AI plan.
 *
 * The step checklist is intentionally EPHEMERAL UI state: ticking a step does
 * not modify any task in the database. Saving the plan is a separate, explicit
 * action that only reports success after the API confirms creation.
 */
export function PlanResult({ plan, onSave, isSaving, onChangePlan }) {
  const prefersReducedMotion = useReducedMotion();
  const { pushToast } = useToast();
  const containerRef = useRef(null);
  const [checked, setChecked] = useState(() => new Set());

  // Reset the temporary checklist whenever a new plan arrives.
  useEffect(() => {
    setChecked(new Set());
  }, [plan]);

  useGSAP(
    () => {
      if (prefersReducedMotion) return;
      const rows = gsap.utils.toArray('[data-plan-row]');
      if (!rows.length) return;
      gsap.fromTo(
        rows,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.3, stagger: 0.05, ease: 'power2.out' }
      );
    },
    { dependencies: [plan, prefersReducedMotion], scope: containerRef }
  );

  const priorityClass = PRIORITY_META[plan.priority] || PRIORITY_META.medium;
  const completedCount = checked.size;

  const planText = formatPlanAsText(plan);

  const toggleStep = (index) => {
    setChecked((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const copyPlan = async () => {
    try {
      await navigator.clipboard.writeText(planText);
      pushToast({ title: 'Plan copied to clipboard' });
    } catch {
      pushToast({
        title: 'Could not copy automatically',
        description: 'Your browser blocked clipboard access. Select the text and copy manually.',
        variant: 'error',
      });
    }
  };


  return (
    <div ref={containerRef} className="space-y-4">
      <Card>
        <CardHeader
          title="Generated plan"
          description="Review the AI suggestion before turning it into a task."
          action={
            <Badge className={priorityClass}>
              {plan.priority.charAt(0).toUpperCase() + plan.priority.slice(1)} priority
            </Badge>
          }
        />
        <CardBody className="space-y-4 pt-3">
          <div data-plan-row>
            <h3 className="text-base font-semibold leading-snug text-fg">{plan.summary}</h3>
            <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-fg-muted">
              <Clock3 className="size-3.5" aria-hidden="true" />
              Estimated effort: ~{plan.estimatedHours} hours
              <span className="text-fg-muted/70">(AI estimate — treat as a rough guide)</span>
            </p>
          </div>

          <div data-plan-row className="rounded-lg border border-border-base bg-bg-soft/60 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-medium text-fg">
                Checklist
                <span className="ml-1.5 font-normal text-fg-muted">
                  {completedCount}/{plan.steps.length} done
                </span>
              </p>
              <span className="text-[10px] uppercase tracking-wide text-fg-muted/80">
                Temporary — not saved
              </span>
            </div>

            <ul className="mt-2 space-y-1">
              {plan.steps.map((step, index) => {
                const isDone = checked.has(index);
                return (
                  <li key={`${index}-${step}`}>
                    <label className="flex cursor-pointer items-start gap-2.5 rounded-md px-1.5 py-1.5 transition hover:bg-surface-2/70">
                      <input
                        type="checkbox"
                        checked={isDone}
                        onChange={() => toggleStep(index)}
                        className="peer sr-only"
                      />
                      <span
                        aria-hidden="true"
                        className={cn(
                          'mt-0.5 grid size-4 shrink-0 place-items-center rounded border transition peer-focus-visible:ring-2 peer-focus-visible:ring-ring/70',
                          isDone
                            ? 'border-emerald-500/70 bg-emerald-500/20 text-emerald-500'
                            : 'border-border-strong text-transparent'
                        )}
                      >
                        <Check className="size-3" />
                      </span>
                      <span
                        className={cn(
                          'text-xs leading-relaxed',
                          isDone ? 'text-fg-muted line-through' : 'text-fg'
                        )}
                      >
                        {step}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>

          <div data-plan-row className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" size="sm" leftIcon={Copy} onClick={copyPlan}>
              Copy plan
            </Button>
            <Button size="sm" leftIcon={Save} onClick={() => onSave?.(plan)} isLoading={isSaving}>
              Save as task
            </Button>
          </div>

          <p data-plan-row className="text-[11px] text-fg-muted">
            Saving creates a new task titled with the summary and lists every step in the
            description.
          </p>
        </CardBody>
      </Card>

      <button
        type="button"
        onClick={onChangePlan}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-fg-muted transition hover:text-fg"
      >
        <ListChecks className="size-3.5" aria-hidden="true" />
        Plan another goal
      </button>
    </div>
  );
}
