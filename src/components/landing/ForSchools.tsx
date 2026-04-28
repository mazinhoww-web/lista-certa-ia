import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight } from "lucide-react";

const BULLETS = [
  "Validador Procon automatizado",
  "Comunique pais cadastrados em 1 clique",
  "Dashboard de adesão por turma",
];

const container = { show: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } } };
const item = {
  hidden: { opacity: 0, x: -12 },
  show: { opacity: 1, x: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

export function ForSchools() {
  return (
    <section id="schools" className="bg-lc-ink text-white py-20 md:py-32 relative overflow-hidden">
      {/* leve aurora ink */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div
          className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full blur-3xl"
          style={{ background: "rgba(30,64,175,0.35)" }}
        />
      </div>

      <div className="relative max-w-6xl mx-auto px-5 md:px-8 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div>
          <span className="inline-flex items-center h-7 px-3 rounded-full bg-white/10 border border-white/15 text-xs font-semibold tracking-wide">
            Para escolas
          </span>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mt-5 text-3xl md:text-5xl font-black tracking-tighter lc-text-balance"
          >
            Sua escola, sua lista. Sem dependência de papelaria.
          </motion.h2>
          <p className="mt-5 text-base md:text-lg text-white/60 max-w-md leading-relaxed">
            A ListaCerta é neutra. Você publica, valida Procon e os pais
            recebem — sem comissão, sem favoritismo de varejista.
          </p>

          <Link
            to="/login?role=school"
            className="mt-8 inline-flex items-center gap-2 h-12 px-6 rounded-full bg-white text-lc-ink text-sm font-semibold hover:bg-lc-lime hover:text-lc-ink active:scale-[0.98] transition-all"
          >
            Cadastrar minha escola
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <motion.ul
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-10%" }}
          className="space-y-4"
        >
          {BULLETS.map((b) => (
            <motion.li
              key={b}
              variants={item}
              className="flex items-start gap-4 p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm"
            >
              <CheckCircle2 className="w-6 h-6 text-lc-lime flex-shrink-0 mt-0.5" strokeWidth={2.2} />
              <span className="text-base md:text-lg font-semibold leading-snug">{b}</span>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}