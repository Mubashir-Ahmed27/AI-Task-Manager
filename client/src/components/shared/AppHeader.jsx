import { useLocation, useNavigate } from 'react-router-dom';
import { Moon, Plus, Sun } from 'lucide-react';
import { useTheme } from '../../app/providers/ThemeProvider.jsx';
import { getPageMeta } from '../../lib/navigation.js';
import { Button } from '../ui/Button.jsx';
import { Brand } from './AppSidebar.jsx';

/**
 * Shared page header: current page title, primary action, and theme toggle.
 */
export function AppHeader() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { title, subtitle } = getPageMeta(pathname);

  return (
    <header className="sticky top-0 z-20 border-b border-border-base bg-bg/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3.5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="lg:hidden">
            <Brand compact />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold tracking-tight text-fg">{title}</h1>
            {subtitle ? (
              <p className="hidden truncate text-xs text-fg-muted sm:block">{subtitle}</p>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          >
            {theme === 'dark' ? (
              <Sun className="size-4" aria-hidden="true" />
            ) : (
              <Moon className="size-4" aria-hidden="true" />
            )}
          </Button>

          <Button
            size="sm"
            leftIcon={Plus}
            onClick={() => navigate('/tasks?new=1')}
            className="hidden sm:inline-flex"
          >
            New task
          </Button>
        </div>
      </div>
    </header>
  );
}
