import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation, Navigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { Spinner } from '../components/ui/Spinner';
import { useAuthStore } from '../store/authStore';

interface LocationState {
  from?: string;
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message;
  return fallback;
}

export function LoginPage() {
  const { user, loading: authLoading, signIn } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
 
  if (!authLoading && user) {
    const from = (location.state as LocationState | null)?.from ?? '/marketplace';
    return <Navigate to={from} replace />;
  }
 
  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await signIn(email, password);
      const from = (location.state as LocationState | null)?.from ?? '/marketplace';
      navigate(from, { replace: true });
      toast.success('¡Bienvenido de vuelta!');
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Credenciales incorrectas'));
    } finally {
      setSubmitting(false);
    }
  };
 
  return (
    <div className="min-h-[calc(100vh-60px)] flex items-center justify-center px-4 py-16">
      {/* Fondos */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/6 blur-[160px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-secondary/6 blur-[140px]" />
      </div>
 
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-[400px]"
      >
        {/* Card de login */}
        <div className="rounded-2xl p-8"
          style={{
            background: 'rgba(20,27,45,0.9)',
            border: '1px solid rgba(59,130,246,0.15)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
            backdropFilter: 'blur(20px)',
          }}>
 
          {/* Logo compacto */}
          <div className="text-center mb-7">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)' }}>
                <span className="font-display font-bold text-white text-sm">P</span>
              </div>
              <span className="font-display font-bold text-white">PokéCards Market</span>
            </div>
            <h1 className="font-display font-bold text-2xl text-white mb-1">Bienvenido de vuelta</h1>
            <p className="text-[13px]" style={{ color: 'rgba(248,250,252,0.45)' }}>
              Inicia sesión para acceder a tu colección
            </p>
          </div>
 
          <form onSubmit={onSubmit} className="space-y-4">
            <label className="block">
              <span className="text-[12px] uppercase tracking-[0.16em] font-semibold mb-1.5 block"
                style={{ color: 'rgba(248,250,252,0.45)' }}>
                Email
              </span>
              <div className="relative">
                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: 'rgba(248,250,252,0.30)' }} />
                <input
                  type="email" required autoComplete="email"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  className="input pl-9"
                  placeholder="tu@email.com"
                />
              </div>
            </label>
 
            <label className="block">
              <span className="text-[12px] uppercase tracking-[0.16em] font-semibold mb-1.5 block"
                style={{ color: 'rgba(248,250,252,0.45)' }}>
                Contraseña
              </span>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: 'rgba(248,250,252,0.30)' }} />
                <input
                  type="password" required minLength={6} autoComplete="current-password"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className="input pl-9"
                  placeholder="••••••••"
                />
              </div>
            </label>
 
            <button type="submit" disabled={submitting}
              className="btn-primary w-full mt-2 py-3 text-[14px]">
              {submitting
                ? <><Spinner size={16} /> Iniciando sesión…</>
                : <>Iniciar sesión <ArrowRight size={15} /></>
              }
            </button>
          </form>
 
          <p className="text-center text-[13px] mt-5" style={{ color: 'rgba(248,250,252,0.38)' }}>
            ¿No tienes cuenta?{' '}
            <Link to="/register"
              className="font-semibold transition-colors"
              style={{ color: '#60A5FA' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#93C5FD')}
              onMouseLeave={e => (e.currentTarget.style.color = '#60A5FA')}>
              Regístrate gratis
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}