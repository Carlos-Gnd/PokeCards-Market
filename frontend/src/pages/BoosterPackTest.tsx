import BoosterPack from '../components/booster/BoosterPack.jsx';
import { useAuthStore } from '../store/authStore';

export function BoosterPackTestPage() {
  const user = useAuthStore((s) => s.user);
  return (
    <main className="min-h-[80vh]">
      <BoosterPack userId={user?.id ?? null} />
    </main>
  );
}
