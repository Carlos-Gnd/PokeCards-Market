import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Library, PackageOpen, Store, LogOut, User as UserIcon } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useCollectionStore } from '../../store/collectionStore';
import { cn } from '../../lib/utils';

interface UserMetadata {
  username?: string;
}

/**
 * PokéCards Market — TopNavBar
 * Diseño: glassmorphism con tinte azul, logo geométrico SVG inline,
 * nav links con indicador de activo estilo pill, avatar generado.
 */
export function TopNavBar() {
  const { user, signOut } = useAuthStore();
  const { items } = useCollectionStore();
  const navigate = useNavigate();
  const metadata = user?.user_metadata as UserMetadata | undefined;
  const username = metadata?.username ?? user?.email?.split('@')[0];
  const totalCards = items.reduce((acc, e) => acc + e.quantity, 0);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 glass-blue shadow-nav">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[60px] flex items-center justify-between gap-4">

        {/* ── Logo ──────────────────────────────────────────── */}
        <Link to="/" className="flex items-center gap-3 group shrink-0">
          {/* Isotipo SVG inline */}
          <div className="relative w-8 h-8 shrink-0">
            <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-lg blur-md opacity-40 group-hover:opacity-70 transition-opacity duration-300" />
            <svg viewBox="0 0 32 32" className="relative w-8 h-8" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="7" fill="#0F172A"/>
              {/* Carta inclinada */}
              <rect x="5" y="5" width="14" height="18" rx="2.5"
                fill="url(#nav-card)" transform="rotate(6 12 14)"/>
              <defs>
                <linearGradient id="nav-card" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#1E40AF"/>
                  <stop offset="100%" stopColor="#6D28D9"/>
                </linearGradient>
              </defs>
              {/* Letra P */}
              <text x="13.5" y="16.5" fontFamily="'Oxanium',sans-serif" fontWeight="800"
                fontSize="8" fill="rgba(255,255,255,0.9)" textAnchor="middle"
                dominantBaseline="middle" transform="rotate(6 13.5 16.5)">P</text>
              {/* Pixel spark */}
              <rect x="22" y="5" width="4" height="4" rx="1" fill="#22D3EE" opacity="0.9"/>
              {/* Líneas de movimiento */}
              <line x1="22" y1="13" x2="27" y2="11" stroke="#60A5FA" strokeWidth="1.2"
                strokeLinecap="round" opacity="0.7"/>
              <line x1="22" y1="17" x2="27" y2="17" stroke="#A78BFA" strokeWidth="1.2"
                strokeLinecap="round" opacity="0.6"/>
            </svg>
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-display font-bold text-[15px] tracking-tight text-white group-hover:text-gradient transition-colors duration-300">
              PokéCards
            </span>
            <span className="text-[9px] uppercase tracking-[0.22em] font-semibold"
              style={{ color: '#22D3EE' }}>
              Market
            </span>
          </div>
        </Link>

        {/* ── Nav central ───────────────────────────────────── */}
        <nav className="hidden md:flex items-center gap-0.5">
          <NavLink
            to="/marketplace"
            className={({ isActive }) =>
              cn(
                'btn-ghost text-[13px] px-3.5 py-2 gap-1.5 rounded-lg',
                isActive && 'text-white bg-primary/12 border border-primary/20',
              )
            }
          >
            <Store size={14} strokeWidth={2} /> Marketplace
          </NavLink>
          <NavLink
            to="/booster"
            className={({ isActive }) =>
              cn(
                'btn-ghost text-[13px] px-3.5 py-2 gap-1.5 rounded-lg',
                isActive && 'text-white bg-primary/12 border border-primary/20',
              )
            }
          >
            <PackageOpen size={14} strokeWidth={2} /> Sobres
          </NavLink>
          {user && (
            <NavLink
              to="/collection"
              className={({ isActive }) =>
                cn(
                  'btn-ghost text-[13px] px-3.5 py-2 gap-1.5 rounded-lg',
                  isActive && 'text-white bg-primary/12 border border-primary/20',
                )
              }
            >
              <Library size={14} strokeWidth={2} />
              Mi Colección
              {totalCards > 0 && (
                <span className="text-[10px] px-1.5 py-px rounded-full font-mono font-bold"
                  style={{
                    background: 'rgba(59,130,246,0.25)',
                    color: '#93C5FD',
                    border: '1px solid rgba(59,130,246,0.35)',
                  }}>
                  {totalCards}
                </span>
              )}
            </NavLink>
          )}
        </nav>

        {/* ── Auth ──────────────────────────────────────────── */}
        <div className="flex items-center gap-2 shrink-0">
          {user ? (
            <div className="flex items-center gap-2">
              {/* Avatar chip */}
              <div className="hidden sm:flex items-center gap-2 pl-1 pr-3 py-1 rounded-xl"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}>
                <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-display font-bold"
                  style={{
                    background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
                  }}>
                  {username?.[0]?.toUpperCase() ?? 'U'}
                </div>
                <span className="text-[13px] text-white/80 font-medium">{username}</span>
              </div>
              <button
                onClick={handleLogout}
                className="btn-ghost px-2.5 py-2 text-white/50 hover:text-white/80"
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
              >
                <LogOut size={15} strokeWidth={2} />
              </button>
            </div>
          ) : (
            <>
              <Link to="/login"
                className="btn-ghost text-[13px] gap-1.5 px-3.5 py-2 text-white/65 hover:text-white">
                <UserIcon size={14} strokeWidth={2} /> Entrar
              </Link>
              <Link to="/register" className="btn-primary text-[13px] px-4 py-2 rounded-xl">
                Registrarse
              </Link>
            </>
          )}
        </div>

      </div>
    </header>
  );
}