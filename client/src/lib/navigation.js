import { LayoutDashboard, ListChecks, Sparkles } from 'lucide-react';

export const NAV_ITEMS = [
  {
    to: '/',
    label: 'Dashboard',
    icon: LayoutDashboard,
    description: 'Overview and quick actions',
  },
  {
    to: '/tasks',
    label: 'All Tasks',
    icon: ListChecks,
    description: 'Search, filter, and edit tasks',
  },
  {
    to: '/ai-planner',
    label: 'AI Planner',
    icon: Sparkles,
    description: 'Turn a goal into an action plan',
  },
];

export const PAGE_META = {
  '/': {
    title: 'Dashboard',
    subtitle: 'Your task workload at a glance.',
  },
  '/tasks': {
    title: 'All Tasks',
    subtitle: 'Search, filter, and manage every task.',
  },
  '/ai-planner': {
    title: 'AI Planner',
    subtitle: 'Describe a goal and get a structured plan.',
  },
};

export function getPageMeta(pathname) {
  return PAGE_META[pathname] || { title: 'Page not found', subtitle: '' };
}
