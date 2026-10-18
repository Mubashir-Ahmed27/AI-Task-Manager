import { useRoutes } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout.jsx';
import DashboardPage from '../pages/DashboardPage.jsx';
import TasksPage from '../pages/TasksPage.jsx';
import AiPlannerPage from '../pages/AiPlannerPage.jsx';
import NotFoundPage from '../pages/NotFoundPage.jsx';

/**
 * Single source of truth for client-side routes.
 * All app pages are rendered inside <AppLayout /> (sidebar + header shell).
 */
export const routes = [
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'tasks', element: <TasksPage /> },
      { path: 'ai-planner', element: <AiPlannerPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];

export default function AppRouter() {
  return useRoutes(routes);
}
