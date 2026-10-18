import { NavLink } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { NAV_ITEMS } from '../../lib/navigation.js';
import { cn } from '../../utils/cn.js';

export function Brand({ compact = false }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        aria-hidden="true"
        className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent ring-1 ring-inset ring-accent/30"
      >
        <CheckCircle2 className="size-5" />
      </span>
      {compact ? null : (
        <span className="leading-tight">
          <span className="block text-sm font-semibold tracking-tight text-fg">FlowTask AI</span>
          <span className="block text-[11px] text-fg-muted">Task manager</span>
        </span>
      )}
    </div>
  );
}

/**
 * Desktop sidebar navigation.
 */
export function AppSidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-border-base bg-bg-soft/80 lg:flex lg:flex-col">
      <div className="border-b border-border-base px-5 py-5">
        <Brand />
      </div>

      <nav aria-label="Main navigation" className="flex-1 space-y-1 p-3">
        {NAV_ITEMS.map(({ to, label, icon: Icon, description }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'group flex items-start gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                isActive
                  ? 'bg-accent/10 text-accent ring-1 ring-inset ring-accent/25'
                  : 'text-fg-muted hover:bg-surface-2 hover:text-fg'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={cn('mt-0.5 size-4 shrink-0', isActive ? 'text-accent' : 'text-fg-muted')}
                  aria-hidden="true"
                />
                <span>
                  <span className="block font-medium">{label}</span>
                  <span className="mt-0.5 block text-[11px] leading-snug text-fg-muted/80">
                    {description}
                  </span>
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-border-base px-5 py-4">
        <p className="text-[11px] leading-relaxed text-fg-muted">
          AI estimates are generated suggestions — always review them before committing.
        </p>
      </div>
    </aside>
  );
}

/**
 * Mobile bottom tab bar (replaces the sidebar below `lg`).
 */
export function MobileTabBar() {
  return (
    <nav
      aria-label="Main navigation"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border-base bg-bg-soft/95 backdrop-blur lg:hidden"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around px-2 py-1.5">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-[11px] font-medium transition-colors',
                  isActive ? 'text-accent' : 'text-fg-muted hover:text-fg'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="size-5" aria-hidden="true" />
                  <span>{label}</span>
                  {isActive ? <span className="sr-only">(current page)</span> : null}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
