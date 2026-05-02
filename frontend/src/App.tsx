import { useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { RequireAuth } from './components/layout/RequireAuth';
import { LandingPage } from './pages/Landing';
import { LoginPage } from './pages/Login';
import { RegisterPage } from './pages/Register';
import { MarketplacePage } from './pages/Marketplace';
import { CollectionVaultPage } from './pages/CollectionVault';
import { BoosterPackTestPage } from './pages/BoosterPackTest';
import { useAuthStore } from './store/authStore';
import { useCollectionStore } from './store/collectionStore';

export default function App() {
  const init = useAuthStore((s) => s.init);
  const user = useAuthStore((s) => s.user);
  const fetchCollection = useCollectionStore((s) => s.fetch);
  const reset = useCollectionStore((s) => s.reset);

  useEffect(() => { init(); }, [init]);
  useEffect(() => {
    if (user) fetchCollection();
    else reset();
  }, [user, fetchCollection, reset]);

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/marketplace" element={<MarketplacePage />} />
        <Route path="/booster" element={<BoosterPackTestPage />} />
        <Route
          path="/collection"
          element={
            <RequireAuth>
              <CollectionVaultPage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

function NotFound() {
  return (
    <div className="max-w-xl mx-auto py-24 text-center px-4">
      <h1 className="font-display font-black text-5xl text-gradient mb-3">404</h1>
      <p className="text-white/60 mb-6">La carta que buscabas se desvaneció.</p>
      <a href="/" className="btn-primary">Volver al inicio</a>
    </div>
  );
}
