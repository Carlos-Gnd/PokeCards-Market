import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { ArrowRight, Sparkles, ShieldCheck, Zap, Crown, Gem, Star } from 'lucide-react';
import { fetchTrending } from '../services/cards.service';
import { Card } from '../components/card';
import { Spinner } from '../components/ui/Spinner';
import type { ArcadiumCard } from '../types';

const RARITY_SHOWCASE = [
  { tier: 'core', label: 'Core', desc: 'Cartas fundacionales del ecosistema. La base de toda colección.', dropRate: '50%' },
  { tier: 'alloy', label: 'Alloy', desc: 'Aleación refinada. Mayor brillo, mayor demanda.', dropRate: '25%' },
  { tier: 'prime', label: 'Prime', desc: 'Calidad selecta. El sweet spot de los coleccionistas.', dropRate: '12%' },
  { tier: 'elite', label: 'Elite', desc: 'Cartas con aura intensa. Una élite reconocida.', dropRate: '7%' },
  { tier: 'apex', label: 'Apex', desc: 'Cumbre del coleccionismo. Brilla con luz propia.', dropRate: '4%' },
  { tier: 'ascendant', label: 'Ascendant', desc: 'Tier de prestigio. Holografía dorada y radiación.', dropRate: '1.8%' },
  { tier: 'eternal', label: 'Eternal', desc: 'Las leyendas. Apariciones únicas e inolvidables.', dropRate: '0.2%' },
] as const;

export function LandingPage() {
  const [trending, setTrending] = useState<ArcadiumCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrending()
      .then(setTrending)
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="overflow-hidden">
      {/* HERO */}
      <section className="relative">
        <div className="absolute inset-0 bg-cosmic" />
        <div className="absolute inset-0 opacity-50 pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-[120px] animate-glow-pulse" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent/15 rounded-full blur-[140px] animate-glow-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-gold/10 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-28 lg:pt-32 lg:pb-36 text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-primary/20 text-xs uppercase tracking-[0.2em] text-white/70 mb-6"
          >
            <Sparkles size={12} className="text-primary" />
            Plataforma premium de cartas digitales
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="font-display font-black text-5xl sm:text-6xl lg:text-7xl leading-[0.95] tracking-tight"
          >
            <span className="block">Where Rarity</span>
            <span className="block text-gradient">Becomes Value</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25 }}
            className="mt-6 max-w-2xl mx-auto text-lg text-white/65 leading-relaxed"
          >
            Explora un universo de cartas coleccionables digitales con 7 tiers de rareza, variantes
            holográficas y verificación de propiedad on-chain de tu colección.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Link to="/marketplace" className="btn-primary text-base px-7 py-3.5 group">
              Explorar Marketplace
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/register" className="btn-secondary text-base px-7 py-3.5">
              Crear cuenta gratis
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-12 flex flex-wrap justify-center gap-x-8 gap-y-3 text-xs text-white/50"
          >
            <span className="inline-flex items-center gap-1.5"><ShieldCheck size={14} className="text-success" /> Pagos seguros vía PayPal</span>
            <span className="inline-flex items-center gap-1.5"><Zap size={14} className="text-accent" /> Catálogo dinámico desde PokéAPI</span>
            <span className="inline-flex items-center gap-1.5"><Gem size={14} className="text-gold" /> 7 tiers de rareza</span>
          </motion.div>
        </div>
      </section>

      {/* TRENDING */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-primary/80 mb-2">Tendencias</p>
            <h2 className="font-display font-bold text-3xl lg:text-4xl">Cartas más codiciadas</h2>
          </div>
          <Link to="/marketplace" className="btn-ghost text-sm hidden md:inline-flex">
            Ver todo el catálogo <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Spinner size={32} /></div>
        ) : trending.length === 0 ? (
          <div className="text-center py-12 text-white/50">
            <p className="text-sm">El backend aún no responde. Asegúrate de tenerlo corriendo en <code className="font-mono text-primary">localhost:3000</code>.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8 justify-items-center pt-6">
            {trending.slice(0, 8).map((card, idx) => (
              <motion.div
                key={card.pokemonId}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: idx * 0.05 }}
              >
                <Card card={card} size="sm" />
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* RAREZAS */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-14">
          <p className="text-xs uppercase tracking-[0.25em] text-primary/80 mb-2">Sistema oficial</p>
          <h2 className="font-display font-bold text-3xl lg:text-4xl mb-4">Siete tiers de rareza</h2>
          <p className="max-w-2xl mx-auto text-white/60">
            Cada carta tiene una rareza determinística. Mientras más alta, más raro encontrarla y mayor su valor de mercado.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {RARITY_SHOWCASE.map((r, idx) => {
            const tierClass: Record<string, string> = {
              core: 'border-rarity-core/30 hover:border-rarity-core/60',
              alloy: 'border-rarity-alloy/30 hover:border-rarity-alloy/60',
              prime: 'border-rarity-prime/30 hover:border-rarity-prime/60',
              elite: 'border-rarity-elite/30 hover:border-rarity-elite/60',
              apex: 'border-rarity-apex/40 hover:border-rarity-apex/80',
              ascendant: 'border-rarity-ascendant/40 hover:border-rarity-ascendant/80',
              eternal: 'border-rarity-eternal/40 hover:border-rarity-eternal/80',
            };
            const tierText: Record<string, string> = {
              core: 'text-rarity-core',
              alloy: 'text-rarity-alloy',
              prime: 'text-rarity-prime',
              elite: 'text-rarity-elite',
              apex: 'text-rarity-apex',
              ascendant: 'text-rarity-ascendant',
              eternal: 'text-rarity-eternal',
            };
            const Icon = r.tier === 'eternal' ? Gem : r.tier === 'ascendant' ? Crown : Star;
            return (
              <motion.div
                key={r.tier}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className={`group relative p-5 rounded-2xl border bg-surface/60 backdrop-blur-sm transition-all ${tierClass[r.tier]}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <Icon className={tierText[r.tier]} size={22} />
                  <span className="text-[10px] uppercase tracking-wider text-white/40 font-mono">
                    {r.dropRate}
                  </span>
                </div>
                <h3 className={`font-display font-bold text-xl mb-1 ${tierText[r.tier]}`}>{r.label}</h3>
                <p className="text-sm text-white/55 leading-relaxed">{r.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="relative overflow-hidden rounded-3xl glass-strong border-primary/20 p-10 lg:p-14 text-center">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-primary/30 rounded-full blur-[100px]" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-gold/20 rounded-full blur-[100px]" />
          <div className="relative">
            <Sparkles size={32} className="text-primary mx-auto mb-4" />
            <h2 className="font-display font-bold text-3xl lg:text-4xl mb-3">
              Empieza tu colección hoy
            </h2>
            <p className="text-white/60 max-w-xl mx-auto mb-8">
              Crea tu cuenta, explora el catálogo dinámico y desbloquea cartas pagando con PayPal Sandbox.
            </p>
            <Link to="/register" className="btn-primary text-base px-7 py-3.5 inline-flex">
              Crear mi cuenta <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
