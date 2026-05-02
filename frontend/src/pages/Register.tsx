import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Sparkles, Mail, Lock, User as UserIcon, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Spinner } from '../components/ui/Spinner';

export function RegisterPage() {
  const { user, loading: authLoading, signUp } = useAuthStore();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!authLoading && user) return <Navigate to="/marketplace" replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setSubmitting(true);
    try {
      await signUp(email, password, username);
      toast.success('¡Cuenta creada! Empieza a coleccionar.');
      navigate('/marketplace', { replace: true });
    } catch (err: any) {
      toast.error(err?.message || 'No pudimos crear tu cuenta');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 -z-10 opacity-50 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gold/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-10 right-1/4 w-[400px] h-[300px] bg-primary/15 rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md glass-strong rounded-2xl p-8 lg:p-10"
      >
        <div className="text-center mb-8">
          <Sparkles size={32} className="text-gold mx-auto mb-3" />
          <h1 className="font-display font-bold text-2xl">Únete a ARCADIUM</h1>
          <p className="text-sm text-white/55 mt-1">Crea tu cuenta y empieza tu colección</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <span className="block text-xs uppercase tracking-wider text-white/60 mb-1.5">
              Nombre de coleccionista
            </span>
            <div className="relative">
              <UserIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                required
                minLength={3}
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input pl-10"
                placeholder="arcanaut_42"
              />
            </div>
          </label>

          <label className="block">
            <span className="block text-xs uppercase tracking-wider text-white/60 mb-1.5">
              Correo electrónico
            </span>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input pl-10"
                placeholder="tucorreo@dominio.com"
              />
            </div>
          </label>

          <label className="block">
            <span className="block text-xs uppercase tracking-wider text-white/60 mb-1.5">
              Contraseña
            </span>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input pl-10"
                placeholder="Mínimo 6 caracteres"
              />
            </div>
          </label>

          <button type="submit" disabled={submitting} className="btn-primary w-full mt-2">
            {submitting ? <Spinner size={18} /> : <>Crear cuenta <ArrowRight size={16} /></>}
          </button>
        </form>

        <p className="text-center text-sm text-white/50 mt-6">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-primary hover:text-primary-glow font-semibold">
            Inicia sesión
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
