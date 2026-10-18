import { Link } from 'react-router-dom';
import { Compass, Home, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/Button.jsx';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <span
        aria-hidden="true"
        className="grid size-14 place-items-center rounded-2xl border border-border-base bg-surface text-accent"
      >
        <Compass className="size-6" />
      </span>
      <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-fg-muted">404</p>
      <h2 className="mt-1 text-xl font-semibold tracking-tight text-fg">This page does not exist</h2>
      <p className="mt-2 max-w-sm text-xs leading-relaxed text-fg-muted">
        The link may be outdated, or the page may have moved. Head back to your dashboard to keep
        working on your tasks.
      </p>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Button as={Link} to="/" leftIcon={Home}>
          Back to dashboard
        </Button>
        <Button as={Link} to="/ai-planner" variant="secondary" leftIcon={Sparkles}>
          Open AI planner
        </Button>
      </div>
    </div>
  );
}
