import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { AuroraBackground } from "@/components/shared/AuroraBackground";
import { NumberCounter } from "@/components/shared/NumberCounter";

const ease = [0.16, 1, 0.3, 1] as const;

export function Hero() {
  const navigate = useNavigate();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/login");
  };

  return (
    <section className="relative min-h-[700px] h-screen flex items-center justify-center overflow-hidden">
      <AuroraBackground />

      <div className="relative z-10 w-full max-w-4xl mx-auto px-5 md:px-8 pt-24 pb-12 text-center">
        {/* Pill */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease, delay: 0 }}
          className="inline-flex items-center gap-2 h-8 pl-2 pr-4 rounded-full bg-lc-white border border-lc-border shadow-lc-sm"
        >
          <span className="lc-flag-br" aria-hidden />
          <span className="text-xs font-semibold text-lc-ink/80 tracking-tight">
            Volta às aulas 2027 · Cuiabá MT
          </span>
        </motion.div>

        {/* H1 */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease, delay: 0.1 }}
          className="mt-6 text-4xl sm:text-6xl md:text-7xl font-black tracking-tighter text-lc-ink lc-text-balance"
        >
          A lista <span className="lc-grad-lime">certa</span> em 5 minutos.
        </motion.h1>

        {/* Sub */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease, delay: 0.2 }}
          className="mt-5 text-base md:text-lg text-lc-mid max-w-xl mx-auto lc-text-balance"
        >
          Você busca a escola. A IA monta o carrinho. Você retira em 2 horas.
        </motion.p>

        {/* Search */}
        <motion.form
          onSubmit={onSubmit}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease, delay: 0.3 }}
          className="mt-8 max-w-2xl mx-auto"
        >
          <div className="flex items-center gap-2 p-2 bg-lc-white rounded-2xl shadow-lc-lg border border-lc-border focus-within:shadow-lc-glow transition-shadow">
            <div className="pl-3 text-lc-mid">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="search"
              inputMode="search"
              autoComplete="off"
              placeholder="Digite o nome da escola, cidade ou CEP"
              className="flex-1 min-w-0 bg-transparent outline-none text-sm md:text-base text-lc-ink placeholder:text-lc-mid py-2"
              aria-label="Buscar escola, cidade ou CEP"
            />
            <button
              type="submit"
              className="h-11 px-5 rounded-xl bg-lc-blue text-white text-sm font-semibold hover:bg-lc-blue-700 active:scale-[0.98] transition-all flex items-center gap-2"
            >
              <Search className="w-4 h-4 md:hidden" />
              <span className="hidden md:inline">Buscar minha escola</span>
            </button>
          </div>
        </motion.form>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease, delay: 0.5 }}
          className="mt-14 grid grid-cols-3 gap-4 md:gap-8 max-w-2xl mx-auto"
        >
          {[
            { n: 12,    label: "escolas validadas Procon-MT" },
            { n: 248,   label: "pais cadastrados" },
            { n: 1847,  label: "itens no catálogo" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl md:text-5xl font-black text-lc-ink tracking-tight">
                <NumberCounter to={s.n} />
              </div>
              <div className="mt-1 text-[11px] md:text-xs font-medium text-lc-mid leading-tight">
                {s.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}