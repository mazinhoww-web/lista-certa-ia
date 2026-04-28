import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";

export function ProconBanner() {
  return (
    <section className="bg-lc-emerald-50 border-y border-lc-emerald-100">
      <div className="max-w-6xl mx-auto px-5 md:px-8 py-12 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-1 md:grid-cols-[auto_1fr] items-center gap-6 md:gap-10"
        >
          <div className="w-20 h-20 md:w-28 md:h-28 rounded-2xl bg-lc-emerald/10 border border-lc-emerald/20 flex items-center justify-center">
            <ShieldCheck className="w-10 h-10 md:w-14 md:h-14 text-lc-emerald" strokeWidth={2.2} />
          </div>
          <div>
            <h3 className="text-2xl md:text-4xl font-black tracking-tighter text-lc-ink lc-text-balance">
              Toda lista é validada Procon antes de aparecer.
            </h3>
            <p className="mt-3 text-base text-lc-ink/70 max-w-2xl leading-relaxed">
              Cruzamos cada item da lista com a Lei nº 12.886/2013 — sem itens
              de uso coletivo cobrados individualmente, sem marca obrigatória,
              sem quantidade abusiva.
            </p>
            <span className="mt-4 inline-flex items-center gap-2 h-7 px-3 rounded-full bg-lc-emerald-100 text-lc-emerald text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5" strokeWidth={2.5} />
              Procon-MT
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}