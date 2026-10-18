import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn.js';

const VARIANTS = {
  primary:
    'bg-accent text-accent-fg hover:bg-accent-strong shadow-sm shadow-black/10 disabled:bg-accent/60',
  secondary:
    'bg-surface-2 text-fg border border-border-base hover:border-border-strong hover:bg-surface',
  ghost: 'text-fg-muted hover:bg-surface-2 hover:text-fg',
  danger: 'bg-red-500/90 text-white hover:bg-red-500 disabled:bg-red-500/50',
  outline:
    'border border-border-base text-fg hover:border-accent/60 hover:text-accent bg-transparent',
};

const SIZES = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-sm gap-2',
  icon: 'size-9 justify-center',
};

/**
 * Reusable button. Renders a spinner + disables itself while `isLoading`,
 * so users cannot double-submit a mutation.
 */
export const Button = forwardRef(function Button(
  {
    as: Component = 'button',
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon: LeftIcon,
    className,
    children,
    disabled,
    type = 'button',
    ...props
  },
  ref
) {
  return (
    <Component
      ref={ref}
      type={Component === 'button' ? type : undefined}
      disabled={Component === 'button' ? disabled || isLoading : undefined}
      aria-busy={isLoading || undefined}
      className={cn(
        'inline-flex select-none items-center rounded-lg font-medium transition-colors duration-150',
        'disabled:cursor-not-allowed disabled:opacity-60',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : LeftIcon ? (
        <LeftIcon className="size-4" aria-hidden="true" />
      ) : null}
      {children}
    </Component>
  );
});
