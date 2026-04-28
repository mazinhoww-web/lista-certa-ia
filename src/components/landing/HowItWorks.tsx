import { motion, type Variants } from "framer-motion";
import { Search, Sparkles, ShoppingCart } from "lucide-react";

const STEPS = [
  {
    n: "01",
    icon: Search,
    title: "Busque",
    body: "Escola, cidade ou CEP. A gente já sabe a lista oficial.",
  },
  {
    n: "02",
    icon: Sparkles,
    title: "IA monta",
    body: "3 carrinhos: mais barato, mais rápido, casa em 24h.",
  },
  {
    n: "03",
    icon: ShoppingCart,
    title: "Compre",
    body: "Direto no varejista que você confia. Sem intermediário.",
  },
];

const container: Variants = {
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

export function HowItWorks() {
  return (
    <section id="how" className="py-20 md:py-32 bg-lc-white">
      <div className="max-w-6xl mx-auto px-5 md:px-8">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-3xl md:text-5xl font-black tracking-tighter text-lc-ink lc-text-balance max-w-2xl"
        >
          Pronto em três passos.
        </motion.h2>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-10%" }}
          className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6"
        >
          {STEPS.map((s) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.n}
                variants={item}
                className="lc-card group bg-lc-surface border border-lc-border rounded-2xl p-6 md:p-8"
              >
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-lc-white border border-lc-border flex items-center justify-center text-lc-blue">
                    <Icon className="w-5 h-5" strokeWidth={2.2} />
                  </div>
                  <span className="lc-num text-sm font-bold text-lc-mid">{s.n}</span>
                </div>
                <h3 className="mt-6 text-2xl font-extrabold text-lc-ink tracking-tight">
                  {s.title}
                </h3>
                <p className="mt-2 text-base text-lc-mid leading-relaxed">{s.body}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}