import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { InstallBanner } from './InstallBanner';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background flex flex-col max-w-lg mx-auto">
      <Header />
      <InstallBanner />
      <main className="flex-1 px-4 pb-24 overflow-y-auto">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
