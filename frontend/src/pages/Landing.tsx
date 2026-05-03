import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  Gem,
  Crown,
  Sparkles,
  PackageOpen,
} from "lucide-react";
import { fetchTrending } from "../services/cards.service";
import { Card } from "../components/card";
import { Spinner } from "../components/ui/Spinner";
import type { ArcadiumCard } from "../types";

const RARITY_SHOWCASE = [
  {
    tier: "core",
    label: "Core",
    desc: "Base de toda colección.",
    dropRate: "50%",
    color: "#94A3B8",
  },
  {
    tier: "alloy",
    label: "Alloy",
    desc: "Aleación refinada con shimmer cian.",
    dropRate: "25%",
    color: "#22D3EE",
  },
  {
    tier: "prime",
    label: "Prime",
    desc: "El sweet spot de los coleccionistas.",
    dropRate: "12%",
    color: "#3B82F6",
  },
  {
    tier: "elite",
    label: "Elite",
    desc: "Aura morada intensa. Alta demanda.",
    dropRate: "7%",
    color: "#8B5CF6",
  },
  {
    tier: "apex",
    label: "Apex",
    desc: "Dorada y radiante. Muy codiciada.",
    dropRate: "4%",
    color: "#F59E0B",
  },
  {
    tier: "ascendant",
    label: "Ascendant",
    desc: "Holografía cristalina y prismática.",
    dropRate: "1.8%",
    color: "#F8FAFC",
  },
  {
    tier: "eternal",
    label: "Eternal",
    desc: "Las leyendas. Rara entre las raras.",
    dropRate: "0.2%",
    color: "#EC4899",
  },
] as const;

/** Entrada de animación de texto con stagger */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] },
});

export function LandingPage() {
  const [trending, setTrending] = useState<ArcadiumCard[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(true);

  useEffect(() => {
    fetchTrending()
      .then(setTrending)
      .catch(() => undefined)
      .finally(() => setTrendingLoading(false));
  }, []);

  return (
    <div className="overflow-hidden">
      {/* ================================================================
          HERO
      ================================================================ */}
      <section className="relative min-h-[90vh] flex items-center">
        {/* Fondos decorativos */}
        <div className="absolute inset-0 bg-cosmic pointer-events-none" />
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-primary/8 blur-[140px] animate-glow-pulse" />
          <div
            className="absolute bottom-[-5%] left-[-5%] w-[500px] h-[500px] rounded-full bg-secondary/8 blur-[120px] animate-glow-pulse"
            style={{ animationDelay: "1.3s" }}
          />
          <div className="absolute top-[35%] left-[40%] w-[300px] h-[300px] rounded-full bg-accent/5 blur-[100px]" />
          {/* Grid decorativo sutil */}
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(59,130,246,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.8) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-28 text-center">
          {/* Eyebrow badge */}
          <motion.div {...fadeUp(0)} className="flex justify-center mb-7">
            <span
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] uppercase tracking-[0.22em] font-semibold"
              style={{
                background: "rgba(59,130,246,0.10)",
                border: "1px solid rgba(59,130,246,0.22)",
                color: "#93C5FD",
              }}
            >
              <Sparkles size={11} />
              Marketplace digital de cartas coleccionables
            </span>
          </motion.div>

          {/* Título principal */}
          <motion.h1
            {...fadeUp(0.1)}
            className="font-display font-bold text-5xl sm:text-6xl lg:text-7xl xl:text-[82px] leading-[1.0] tracking-tight mb-6"
          >
            <span className="block text-white">Colecciona lo</span>
            <span className="block text-gradient">Extraordinario</span>
          </motion.h1>

          {/* Subtítulo */}
          <motion.p
            {...fadeUp(0.22)}
            className="max-w-xl mx-auto text-[17px] leading-relaxed mb-10"
            style={{ color: "rgba(248,250,252,0.55)" }}
          >
            Explora más de 200 cartas digitales con 7 niveles de rareza, efectos
            holográficos y propiedad verificada. Abre sobres, compra y vende.
          </motion.p>

          {/* CTAs */}
          <motion.div
            {...fadeUp(0.35)}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12"
          >
            <Link
              to="/marketplace"
              className="btn-primary text-[15px] px-7 py-3.5 group rounded-xl"
            >
              Explorar Catálogo
              <ArrowRight
                size={16}
                className="group-hover:translate-x-1 transition-transform"
              />
            </Link>
            <Link
              to="/booster"
              className="btn-secondary text-[15px] px-7 py-3.5 rounded-xl gap-2"
            >
              <PackageOpen size={16} />
              Abrir un Sobre
            </Link>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            {...fadeUp(0.5)}
            className="flex flex-wrap justify-center gap-x-8 gap-y-3"
          >
            {[
              {
                icon: ShieldCheck,
                text: "Pagos seguros vía PayPal",
                color: "#10B981",
              },
              {
                icon: Zap,
                text: "Catálogo dinámico PokéAPI",
                color: "#22D3EE",
              },
              { icon: Gem, text: "7 tiers de rareza", color: "#F59E0B" },
            ].map(({ icon: Icon, text, color }) => (
              <span
                key={text}
                className="inline-flex items-center gap-1.5 text-[12px]"
                style={{ color: "rgba(248,250,252,0.42)" }}
              >
                <Icon size={13} style={{ color }} />
                {text}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Separador gradiente */}
      <div className="divider-gradient mx-auto max-w-4xl" />

      {/* ================================================================
          TRENDING CARDS
      ================================================================ */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
        {/* Glow de fondo */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p
                className="text-[11px] uppercase tracking-[0.28em] font-semibold mb-2"
                style={{ color: "#60A5FA" }}
              >
                Tendencias
              </p>
              <h2 className="font-display font-bold text-3xl lg:text-4xl text-white">
                Cartas más codiciadas
              </h2>
            </div>
            <Link
              to="/marketplace"
              className="btn-ghost text-sm hidden md:inline-flex gap-1.5 text-white/50 hover:text-white"
            >
              Ver catálogo completo <ArrowRight size={14} />
            </Link>
          </div>

          {trendingLoading ? (
            <div className="flex justify-center py-16">
              <Spinner size={36} />
            </div>
          ) : trending.length === 0 ? (
            <div
              className="text-center py-16 rounded-2xl"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <p className="text-sm text-white/40">
                Backend no disponible. Levanta el servidor en{" "}
                <code className="font-mono text-primary/70">
                  localhost:3000
                </code>
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-6 justify-items-center">
              {trending.slice(0, 8).map((card, idx) => (
                <motion.div
                  key={card.pokemonId}
                  initial={{ opacity: 0, y: 32 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{
                    duration: 0.5,
                    delay: idx * 0.06,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="w-full max-w-[200px]"
                >
                  <Card card={card} size="sm" />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="divider-gradient mx-auto max-w-4xl" />

      {/* ================================================================
          SISTEMA DE RAREZAS
      ================================================================ */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
        <div className="absolute bottom-0 right-0 w-[500px] h-[400px] bg-secondary/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative text-center mb-14">
          <p
            className="text-[11px] uppercase tracking-[0.28em] font-semibold mb-2"
            style={{ color: "#A78BFA" }}
          >
            Sistema oficial
          </p>
          <h2 className="font-display font-bold text-3xl lg:text-4xl text-white mb-4">
            Siete niveles de rareza
          </h2>
          <p
            className="max-w-xl mx-auto text-[15px]"
            style={{ color: "rgba(248,250,252,0.50)" }}
          >
            Cada carta tiene una rareza determinística basada en su ID. Mayor
            rareza = mayor valor de mercado y efectos visuales más intensos.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {RARITY_SHOWCASE.map((r, idx) => (
            <motion.div
              key={r.tier}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.04, ease: [0.16, 1, 0.3, 1] }}
              className="group relative p-5 rounded-2xl transition-all duration-300 cursor-default"
              style={{
                background: "rgba(255,255,255,0.026)",
                border: `1px solid ${r.color}28`,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  `${r.color}10`;
                (e.currentTarget as HTMLElement).style.borderColor =
                  `${r.color}50`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "rgba(255,255,255,0.026)";
                (e.currentTarget as HTMLElement).style.borderColor =
                  `${r.color}28`;
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{
                    background: `${r.color}15`,
                    border: `1px solid ${r.color}35`,
                  }}
                >
                  {r.tier === "eternal" ? (
                    <Gem size={14} style={{ color: r.color }} />
                  ) : r.tier === "ascendant" ? (
                    <Crown size={14} style={{ color: r.color }} />
                  ) : (
                    <Sparkles size={14} style={{ color: r.color }} />
                  )}
                </div>
                <span
                  className="font-mono font-semibold text-[11px]"
                  style={{ color: "rgba(248,250,252,0.35)" }}
                >
                  {r.dropRate}
                </span>
              </div>
              <h3
                className="font-display font-bold text-lg mb-1"
                style={{ color: r.color }}
              >
                {r.label}
              </h3>
              <p
                className="text-[13px] leading-relaxed"
                style={{ color: "rgba(248,250,252,0.50)" }}
              >
                {r.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      <div className="divider-gradient mx-auto max-w-4xl" />

      {/* ================================================================
          CTA FINAL
      ================================================================ */}
      <section className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative overflow-hidden rounded-3xl p-10 lg:p-16 text-center"
          style={{
            background:
              "linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(139,92,246,0.10) 50%, rgba(34,211,238,0.08) 100%)",
            border: "1px solid rgba(59,130,246,0.18)",
          }}
        >
          {/* Glows internos */}
          <div className="absolute -top-16 -right-16 w-72 h-72 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-72 h-72 bg-secondary/20 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative">
            <div
              className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-5 mx-auto"
              style={{
                background: "linear-gradient(135deg, #3B82F6, #8B5CF6)",
              }}
            >
              <Sparkles size={22} className="text-white" />
            </div>
            <h2 className="font-display font-bold text-3xl lg:text-4xl text-white mb-3">
              Empieza tu colección hoy
            </h2>
            <p
              className="mb-8 max-w-lg mx-auto text-[15px]"
              style={{ color: "rgba(248,250,252,0.55)" }}
            >
              Crea tu cuenta, explora el catálogo y desbloquea cartas raras.
              Todo con pagos seguros vía PayPal Sandbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/register"
                className="btn-primary text-[15px] px-7 py-3.5 rounded-xl"
              >
                Crear cuenta gratis <ArrowRight size={16} />
              </Link>
              <Link
                to="/marketplace"
                className="btn-secondary text-[15px] px-7 py-3.5 rounded-xl"
              >
                Ver el catálogo
              </Link>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
