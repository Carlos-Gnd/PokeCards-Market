import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="mt-auto border-t"
      style={{ borderColor: 'rgba(59,130,246,0.1)', background: 'rgba(11,15,25,0.8)', backdropFilter: 'blur(12px)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Marca */}
          <div className="flex items-center gap-2.5">
            <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
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
              <line x1="14" y1="14" x2="19" y2="16" stroke="#22D3EE" strokeWidth="1.2" strokeLinecap="round" opacity="0.4"/>
            </svg>
            <span className="font-display font-bold text-sm text-white/80">PokéCards Market</span>
            <span className="text-xs text-white/25">© {new Date().getFullYear()}</span>
          </div>

          {/* Links */}
          <nav className="flex items-center gap-5 text-xs text-white/35">
            <Link to="/marketplace" className="hover:text-white/65 transition-colors">Marketplace</Link>
            <Link to="/booster" className="hover:text-white/65 transition-colors">Sobres</Link>
            <Link to="/collection" className="hover:text-white/65 transition-colors">Colección</Link>
          </nav>

          {/* Disclaimer */}
          <p className="text-[11px] text-white/25 text-center sm:text-right">
            Datos vía PokéAPI · Pagos por PayPal Sandbox
          </p>
        </div>
      </div>
    </footer>
  );
}
