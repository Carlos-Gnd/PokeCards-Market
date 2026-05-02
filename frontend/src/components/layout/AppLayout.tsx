import { Outlet } from 'react-router-dom';
import { TopNavBar } from './TopNavBar';
import { Footer } from './Footer';

export function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <TopNavBar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
