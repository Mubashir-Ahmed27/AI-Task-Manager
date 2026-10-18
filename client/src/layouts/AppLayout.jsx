import { Outlet } from 'react-router-dom';
import { AppHeader } from '../components/shared/AppHeader.jsx';
import { AppSidebar, MobileTabBar } from '../components/shared/AppSidebar.jsx';

/**
 * Application shell: sidebar (desktop) + header + routed page content.
 * The bottom padding leaves room for the mobile tab bar.
 */
export default function AppLayout() {
  return (
    <div className="app-backdrop flex min-h-dvh bg-bg">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-6 lg:pb-10">
          <Outlet />
        </main>
      </div>
      <MobileTabBar />
    </div>
  );
}
