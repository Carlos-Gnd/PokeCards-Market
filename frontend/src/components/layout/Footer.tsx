import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="mt-auto border-t"
      style={{ borderColor: 'rgba(59,130,246,0.1)', background: 'rgba(11,15,25,0.8)', backdropFilter: 'blur(12px)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-row flex-wrap items-center justify-between gap-x-6 gap-y-3">
          {/* Marca */}
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" xmlns="http://www.w3.org/2000/svg">
              <rect x="1" y="1" width="10" height="14" rx="2"
                fill="none" stroke="url(#ft-card)" strokeWidth="1.5"/>
              <defs>
                <linearGradient id="ft-card" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#3B82F6"/>
                  <stop offset="100%" stopColor="#8B5CF6"/>
                </linearGradient>
              </defs>
              <rect x="14" y="1" width="4" height="4" rx="0.75" fill="#22D3EE" opacity="0.8"/>
              <line x1="14" y1="8"  x2="20" y2="6"  stroke="#60A5FA" strokeWidth="1.2" strokeLinecap="round" opacity="0.6"/>
              <line x1="14" y1="11" x2="20" y2="11" stroke="#A78BFA" strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
            </svg>
            <span className="font-display font-bold text-xs text-white/70">PokéCards Market</span>
            <span className="text-[11px] text-white/25">© {new Date().getFullYear()}</span>
          </div>

          {/* Links */}
          <nav className="flex items-center gap-4 text-[11px] text-white/35">
            <Link to="/marketplace" className="hover:text-white/65 transition-colors">Marketplace</Link>
            <Link to="/booster" className="hover:text-white/65 transition-colors">Sobres</Link>
            <Link to="/collection" className="hover:text-white/65 transition-colors">Colección</Link>
            <span className="hidden sm:inline text-white/20">·</span>
            <span className="hidden sm:inline text-[10px] text-white/20">Datos vía PokéAPI · PayPal Sandbox</span>
          </nav>
        </div>
      </div>
    </footer>
  );
}
