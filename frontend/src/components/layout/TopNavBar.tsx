// ── frontend/src/components/layout/TopNavBar.tsx ─────────────────────────────
import { useState, useEffect, useRef } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Library,
  PackageOpen,
  Store,
  LogOut,
  User as UserIcon,
  Menu,
  X,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useCollectionStore } from "../../store/collectionStore";
import { cn } from "../../lib/utils";

interface UserMetadata {
  username?: string;
}

export function TopNavBar() {
  const { user, signOut } = useAuthStore();
  const { items } = useCollectionStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const metadata = user?.user_metadata as UserMetadata | undefined;
  const username = metadata?.username ?? user?.email?.split("@")[0];
  const totalCards = user ? items.reduce((acc, e) => acc + e.quantity, 0) : 0;

  // Cierra al hacer click fuera
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Bloquea scroll cuando el menú está abierto en móvil
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleLogout = async () => {
    setOpen(false);
    await signOut();
    navigate("/");
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "btn-ghost text-[13px] px-3.5 py-2 gap-1.5 rounded-lg",
      isActive && "text-white bg-primary/12 border border-primary/20",
    );

  // ── Links compartidos entre desktop y móvil ────────────────────────────────
  const navLinks = (
    <>
      <NavLink to="/marketplace" className={navLinkClass}>
        <Store size={14} strokeWidth={2} /> Marketplace
      </NavLink>
      <NavLink to="/booster" className={navLinkClass}>
        <PackageOpen size={14} strokeWidth={2} /> Sobres
      </NavLink>
      {user && (
        <NavLink to="/collection" className={navLinkClass}>
          <Library size={14} strokeWidth={2} />
          Mi Colección
          {totalCards > 0 && (
            <span
              className="text-[10px] px-1.5 py-px rounded-full font-mono font-bold"
              style={{
                background: "rgba(59,130,246,0.25)",
                color: "#93C5FD",
                border: "1px solid rgba(59,130,246,0.35)",
              }}
            >
              {totalCards}
            </span>
          )}
        </NavLink>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-40 glass-blue shadow-nav" ref={menuRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[60px] flex items-center justify-between gap-4">
        {/* ── Logo ──────────────────────────────────────────── */}
        <Link to="/" className="flex items-center gap-3 group shrink-0">
          <div className="relative w-8 h-8 shrink-0">
            <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-lg blur-md opacity-40 group-hover:opacity-70 transition-opacity duration-300" />
            <svg
              viewBox="0 0 32 32"
              className="relative w-8 h-8"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="32" height="32" rx="7" fill="#0F172A" />
              <rect
                x="5"
                y="5"
                width="14"
                height="18"
                rx="2.5"
                fill="url(#nav-card)"
                transform="rotate(6 12 14)"
              />
              <defs>
                <linearGradient id="nav-card" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#1E40AF" />
                  <stop offset="100%" stopColor="#6D28D9" />
                </linearGradient>
              </defs>
              <text
                x="13.5"
                y="16.5"
                fontFamily="'Oxanium',sans-serif"
                fontWeight="800"
                fontSize="8"
                fill="rgba(255,255,255,0.9)"
                textAnchor="middle"
                dominantBaseline="middle"
                transform="rotate(6 13.5 16.5)"
              >
                P
              </text>
              <rect
                x="22"
                y="5"
                width="4"
                height="4"
                rx="1"
                fill="#22D3EE"
                opacity="0.9"
              />
              <line
                x1="22"
                y1="13"
                x2="27"
                y2="11"
                stroke="#60A5FA"
                strokeWidth="1.2"
                strokeLinecap="round"
                opacity="0.7"
              />
              <line
                x1="22"
                y1="17"
                x2="27"
                y2="17"
                stroke="#A78BFA"
                strokeWidth="1.2"
                strokeLinecap="round"
                opacity="0.6"
              />
            </svg>
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-display font-bold text-[15px] tracking-tight text-white group-hover:text-gradient transition-colors duration-300">
              PokéCards
            </span>
            <span
              className="text-[9px] uppercase tracking-[0.22em] font-semibold"
              style={{ color: "#22D3EE" }}
            >
              Market
            </span>
          </div>
        </Link>

        {/* ── Nav central (solo desktop) ─────────────────────── */}
        <nav className="hidden md:flex items-center gap-0.5">{navLinks}</nav>

        {/* ── Auth (desktop) + Hamburger (móvil) ────────────── */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Auth desktop */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                <div
                  className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-xl"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-display font-bold"
                    style={{
                      background: "linear-gradient(135deg, #3B82F6, #8B5CF6)",
                    }}
                  >
                    {username?.[0]?.toUpperCase() ?? "U"}
                  </div>
                  <span className="text-[13px] text-white/80 font-medium">
                    {username}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="btn-ghost px-2.5 py-2 text-white/50 hover:text-white/80"
                  aria-label="Cerrar sesión"
                  title="Cerrar sesión"
                >
                  <LogOut size={15} strokeWidth={2} />
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="btn-ghost text-[13px] gap-1.5 px-3.5 py-2 text-white/65 hover:text-white"
                >
                  <UserIcon size={14} strokeWidth={2} /> Entrar
                </Link>
                <Link
                  to="/register"
                  className="btn-primary text-[13px] px-4 py-2 rounded-xl"
                >
                  Registrarse
                </Link>
              </>
            )}
          </div>

          {/* Botón hamburguesa (solo móvil) */}
          <button
            onClick={() => setOpen((v) => !v)}
            className="md:hidden btn-ghost p-2.5 text-white/70 hover:text-white"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* ── Menú móvil desplegable ─────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <>
            {/* Overlay oscuro detrás */}
            <motion.div
              className="fixed inset-0 top-[60px] z-30 bg-black/60 backdrop-blur-sm md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />

            {/* Panel del menú */}
            <motion.div
              className="absolute left-0 right-0 top-[60px] z-40 md:hidden"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
            >
              <div
                className="mx-3 mb-3 rounded-2xl overflow-hidden"
                style={{
                  background: "rgba(14,20,36,0.97)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
                  backdropFilter: "blur(24px)",
                }}
              >
                {/* Perfil de usuario */}
                {user && (
                  <div
                    className="flex items-center gap-3 px-4 py-4 border-b"
                    style={{ borderColor: "rgba(255,255,255,0.06)" }}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-display font-bold shrink-0"
                      style={{
                        background: "linear-gradient(135deg, #3B82F6, #8B5CF6)",
                      }}
                    >
                      {username?.[0]?.toUpperCase() ?? "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {username}
                      </p>
                      <p className="text-[11px] text-white/45 truncate">
                        {user.email}
                      </p>
                    </div>
                    {totalCards > 0 && (
                      <span
                        className="text-[11px] px-2 py-0.5 rounded-full font-mono font-bold shrink-0"
                        style={{
                          background: "rgba(59,130,246,0.2)",
                          color: "#93C5FD",
                          border: "1px solid rgba(59,130,246,0.3)",
                        }}
                      >
                        {totalCards} cartas
                      </span>
                    )}
                  </div>
                )}

                {/* Links de navegación */}
                <nav className="flex flex-col p-2 gap-0.5">
                  <NavLink
                    to="/marketplace"
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                        isActive
                          ? "text-white bg-primary/15 border border-primary/20"
                          : "text-white/70 hover:text-white hover:bg-white/[0.05]",
                      )
                    }
                  >
                    <Store size={17} strokeWidth={1.8} />
                    Marketplace
                  </NavLink>
                  <NavLink
                    to="/booster"
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                        isActive
                          ? "text-white bg-primary/15 border border-primary/20"
                          : "text-white/70 hover:text-white hover:bg-white/[0.05]",
                      )
                    }
                  >
                    <PackageOpen size={17} strokeWidth={1.8} />
                    Sobres Pokémon
                  </NavLink>
                  {user && (
                    <NavLink
                      to="/collection"
                      onClick={() => setOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                          isActive
                            ? "text-white bg-primary/15 border border-primary/20"
                            : "text-white/70 hover:text-white hover:bg-white/[0.05]",
                        )
                      }
                    >
                      <Library size={17} strokeWidth={1.8} />
                      Mi Colección
                      {totalCards > 0 && (
                        <span
                          className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold"
                          style={{
                            background: "rgba(59,130,246,0.2)",
                            color: "#93C5FD",
                            border: "1px solid rgba(59,130,246,0.3)",
                          }}
                        >
                          {totalCards}
                        </span>
                      )}
                    </NavLink>
                  )}
                </nav>

                {/* Auth en móvil */}
                <div
                  className="p-2 pt-0 border-t mt-1"
                  style={{ borderColor: "rgba(255,255,255,0.06)" }}
                >
                  {user ? (
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut size={17} strokeWidth={1.8} />
                      Cerrar sesión
                    </button>
                  ) : (
                    <div className="flex flex-col gap-2 p-2">
                      <Link
                        to="/login"
                        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-medium text-white/70 hover:text-white border border-white/10 hover:border-white/20 transition-colors"
                      >
                        <UserIcon size={15} /> Iniciar sesión
                      </Link>
                      <Link
                        to="/register"
                        className="btn-primary w-full text-center py-2.5 rounded-xl text-sm"
                      >
                        Registrarse
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
