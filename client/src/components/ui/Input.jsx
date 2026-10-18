import { forwardRef, useId } from 'react';
import { cn } from '../../utils/cn.js';

const CONTROL_CLASSES =
  'w-full rounded-lg border bg-bg-soft px-3 text-sm text-fg placeholder:text-fg-muted/70 ' +
  'border-border-base transition-colors hover:border-border-strong ' +
  'focus:border-accent focus:outline-none disabled:cursor-not-allowed disabled:opacity-60';

export function Field({ label, htmlFor, error, hint, required, children }) {
  return (
    <div className="space-y-1.5">
      {label ? (
        <label htmlFor={htmlFor} className="flex items-center gap-1 text-xs font-medium text-fg">
          {label}
          {required ? (
            <span className="text-danger" aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
      ) : null}
      {children}
      {error ? (
        <p
          id={htmlFor ? `${htmlFor}-error` : undefined}
          className="text-xs text-danger"
          role="alert"
        >
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-fg-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export const Input = forwardRef(function Input(
  { label, error, hint, id, required, className, wrapperClassName, ...props },
  ref
) {
  const autoId = useId();
  const inputId = id || `input-${autoId}`;

  const control = (
    <input
      ref={ref}
      id={inputId}
      aria-invalid={error ? 'true' : undefined}
      aria-describedby={error ? `${inputId}-error` : undefined}
      className={cn(
        CONTROL_CLASSES,
        'h-10',
        error && 'border-danger/70 focus:border-danger',
        className
      )}
      {...props}
    />
  );

  if (!label && !error && !hint) return control;

  return (
    <div className={wrapperClassName}>
      <Field label={label} htmlFor={inputId} error={error} hint={hint} required={required}>
        {control}
      </Field>
    </div>
  );
});

export const Textarea = forwardRef(function Textarea(
  { label, error, hint, id, required, className, rows = 4, ...props },
  ref
) {
  const autoId = useId();
  const inputId = id || `textarea-${autoId}`;

  return (
    <div>
      <Field label={label} htmlFor={inputId} error={error} hint={hint} required={required}>
        <textarea
          ref={ref}
          id={inputId}
          rows={rows}
          aria-invalid={error ? 'true' : undefined}
          className={cn(
            CONTROL_CLASSES,
            'resize-y py-2.5 leading-relaxed',
            error && 'border-danger/70 focus:border-danger',
            className
          )}
          {...props}
        />
      </Field>
    </div>
  );
});

export const Select = forwardRef(function Select(
  { label, error, hint, id, className, children, ...props },
  ref
) {
  const autoId = useId();
  const selectId = id || `select-${autoId}`;

  return (
    <div>
      <Field label={label} htmlFor={selectId} error={error} hint={hint}>
        <select
          ref={ref}
          id={selectId}
          aria-invalid={error ? 'true' : undefined}
          className={cn(CONTROL_CLASSES, 'h-10 pr-8', error && 'border-danger/70', className)}
          {...props}
        >
          {children}
        </select>
      </Field>
    </div>
  );
});
