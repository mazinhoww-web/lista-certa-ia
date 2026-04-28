import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const STEPS = [
  "Lendo a lista...",
  "Buscando preços...",
  "Comparando varejistas...",
  "Pronto.",
];

interface AILoadingProps {
  /** Quando true, exibe overlay fullscreen. */
  open: boolean;
  /** Mensagem âncora exibida acima do passo atual. */
  title?: string;
  /** Chamado quando termina (após mín. 2s + última etapa). */
  onDone?: () => void;
  /** Duração de cada step em ms (default 700). */
  stepMs?: number;
}

/** Loading da IA — momento heroico. Spinner radial Blue → Lime. */
export function AILoading({ open, title = "A IA esta montando o melhor carrinho...", onDone, stepMs = 700 }: AILoadingProps) {
  const [i, setI] = useState(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!open) { setI(0); return; }
    const t = setInterval(() => {
      setI((prev) => {
        if (prev >= STEPS.length - 1) {
          clearInterval(t);
          if (onDone) setTimeout(onDone, 600);
          return prev;
        }
        return prev + 1;
      });
    }, stepMs);
    return () => clearInterval(t);
  }, [open, stepMs, onDone]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-lc-ink/80 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="status"
          aria-live="polite"
        >
          <div className="relative w-24 h-24">
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: "conic-gradient(from 0deg, #1E40AF, #84CC16, #1E40AF)",
                maskImage: "radial-gradient(circle, transparent 56%, black 58%)",
                WebkitMaskImage: "radial-gradient(circle, transparent 56%, black 58%)",
              }}
              animate={reduced ? undefined : { rotate: 360 }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
            />
          </div>

          <p className="mt-8 text-sm font-medium text-white/70 max-w-xs text-center px-6">{title}</p>

          <div className="mt-3 h-7 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.p
                key={i}
                className="text-lg font-bold text-white"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3 }}
              >
                {STEPS[i]}
              </motion.p>
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}