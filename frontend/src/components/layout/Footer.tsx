import { Sparkles } from 'lucide-react';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-white/[0.06] bg-bg/60 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-white/60">
          <Sparkles size={14} className="text-primary" />
          <span className="font-display font-bold text-sm">ARCADIUM</span>
          <span className="text-xs text-white/30">© {new Date().getFullYear()}</span>
        </div>
        <div className="text-xs text-white/40">
          Cartas digitales · Datos vía PokéAPI · Pagos por PayPal Sandbox
        </div>
      </div>
    </footer>
  );
}
