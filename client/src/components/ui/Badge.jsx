import { cn } from '../../utils/cn.js';

/**
 * Small status/label pill. Colours come from the caller so status semantics
 * stay defined in one place (features/tasks/schemas/task.schema.js).
 */
export function Badge({ as: Component = 'span', className, children, ...props }) {
  return (
    <Component
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
