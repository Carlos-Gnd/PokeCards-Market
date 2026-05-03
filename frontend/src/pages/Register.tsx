// ─── Register.tsx ─────────────────────────────────────────────────────────────
// (Separar en su propio archivo en el proyecto real)
// Exportamos también Register desde aquí para que sea fácil de copiar
 
export function RegisterPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { signUp } = useAuthStore();
  const [username, setUsername] = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
 
  if (user) return <Navigate to="/marketplace" replace />;
 
  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await signUp(email, password, username);
      navigate('/marketplace', { replace: true });
      toast.success('¡Cuenta creada! Bienvenido a PokéCards Market.');
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'No se pudo crear la cuenta'));
    } finally {
      setSubmitting(false);
    }
  };
 
  return (
    <div className="min-h-[calc(100vh-60px)] flex items-center justify-center px-4 py-16">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-1/4 right-1/3 w-[500px] h-[500px] rounded-full bg-secondary/6 blur-[150px]" />
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-accent/4 blur-[130px]" />
      </div>
 
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-[420px]"
      >
        <div className="rounded-2xl p-8"
          style={{
            background: 'rgba(20,27,45,0.9)',
            border: '1px solid rgba(139,92,246,0.15)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
            backdropFilter: 'blur(20px)',
          }}>
 
          <div className="text-center mb-7">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #8B5CF6, #22D3EE)' }}>
                <span className="font-display font-bold text-white text-sm">P</span>
              </div>
              <span className="font-display font-bold text-white">PokéCards Market</span>
            </div>
            <h1 className="font-display font-bold text-2xl text-white mb-1">Crea tu cuenta</h1>
            <p className="text-[13px]" style={{ color: 'rgba(248,250,252,0.45)' }}>
              Únete y empieza a coleccionar cartas únicas
            </p>
          </div>
 
          <form onSubmit={onSubmit} className="space-y-4">
            <label className="block">
              <span className="text-[12px] uppercase tracking-[0.16em] font-semibold mb-1.5 block"
                style={{ color: 'rgba(248,250,252,0.45)' }}>
                Nombre de usuario
              </span>
              <input
                type="text" required minLength={3}
                value={username} onChange={(e) => setUsername(e.target.value)}
                className="input" placeholder="trainer123"
              />
            </label>
 
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
                  className="input pl-9" placeholder="tu@email.com"
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
                  type="password" required minLength={6} autoComplete="new-password"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className="input pl-9" placeholder="Mínimo 6 caracteres"
                />
              </div>
            </label>
 
            <button type="submit" disabled={submitting}
              className="btn-primary w-full mt-2 py-3 text-[14px]">
              {submitting
                ? <><Spinner size={16} /> Creando cuenta…</>
                : <>Crear cuenta gratis <ArrowRight size={15} /></>
              }
            </button>
          </form>
 
          <p className="text-center text-[13px] mt-5" style={{ color: 'rgba(248,250,252,0.38)' }}>
            ¿Ya tienes cuenta?{' '}
            <Link to="/login"
              className="font-semibold"
              style={{ color: '#A78BFA' }}>
              Inicia sesión
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}