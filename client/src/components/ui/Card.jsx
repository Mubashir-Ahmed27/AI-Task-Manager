import { cn } from '../../utils/cn.js';

export function Card({ as: Component = 'div', className, children, ...props }) {
  return (
    <Component
      className={cn(
        'rounded-xl border border-border-base bg-surface/90 shadow-sm shadow-black/5',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

export function CardHeader({ title, description, action, className }) {
  return (
    <div className={cn('flex items-start justify-between gap-4 p-5 pb-0', className)}>
      <div>
        <h2 className="text-sm font-semibold tracking-tight text-fg">{title}</h2>
        {description ? <p className="mt-1 text-xs text-fg-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function CardBody({ className, children }) {
  return <div className={cn('p-5', className)}>{children}</div>;
}
