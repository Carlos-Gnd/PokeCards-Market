import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Library, Store, LogOut, User as UserIcon, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useCollectionStore } from '../../store/collectionStore';
import { cn } from '../../lib/utils';

export function TopNavBar() {
  const { user, signOut } = useAuthStore();
  const { items } = useCollectionStore();
  const navigate = useNavigate();
  const username = (user?.user_metadata as any)?.username || user?.email?.split('@')[0];

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 backdrop-blur-2xl bg-bg/70 border-b border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="relative w-9 h-9">
            <div className="absolute inset-0 bg-aurora rounded-lg blur-md opacity-50 group-hover:opacity-80 transition-opacity" />
            <div className="relative w-9 h-9 rounded-lg bg-bg border border-white/10 flex items-center justify-center">
              <Sparkles size={18} className="text-primary" />
            </div>
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-display font-black tracking-tight text-lg">ARCADIUM</span>
            <span className="text-[9px] uppercase tracking-[0.18em] text-white/40 font-medium">
              Where Rarity Becomes Value
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <NavLink
            to="/marketplace"
            className={({ isActive }) =>
              cn(
                'btn-ghost gap-2',
                isActive && 'text-white bg-white/[0.06]',
              )
            }
          >
            <Store size={16} /> Marketplace
          </NavLink>
          {user && (
            <NavLink
              to="/collection"
              className={({ isActive }) =>
                cn(
                  'btn-ghost gap-2',
                  isActive && 'text-white bg-white/[0.06]',
                )
              }
            >
              <Library size={16} /> Mi Colección
              {items.length > 0 && (
                <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-primary/30 text-white font-mono">
                  {items.length}
                </span>
              )}
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10">
                <div className="w-7 h-7 rounded-full bg-aurora flex items-center justify-center text-[11px] font-bold">
                  {username?.[0]?.toUpperCase() ?? 'A'}
                </div>
                <span className="text-sm text-white/85 font-medium">{username}</span>
              </div>
              <button
                onClick={handleLogout}
                className="btn-ghost"
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className="btn-ghost gap-1.5">
                <UserIcon size={16} /> Iniciar sesión
              </Link>
              <Link to="/register" className="btn-primary px-4 py-2 text-sm">
                Registrarse
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
