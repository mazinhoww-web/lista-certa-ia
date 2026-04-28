import { motion, useReducedMotion } from "framer-motion";

interface AuroraBackgroundProps {
  className?: string;
  /** Variante "light" para hero claro; "ink" para fundo escuro tipo dashboard. */
  variant?: "light" | "ink";
}

/**
 * Aurora Blue → Slate Ink (única autorizada pelo DESIGN.md).
 * Toque sutil de lime apenas como ponto de luz pequeno, NÃO gradiente.
 */
export function AuroraBackground({
  className = "",
  variant = "light",
}: AuroraBackgroundProps) {
  const reduced = useReducedMotion();

  const blueA = variant === "ink" ? "rgba(30,64,175,0.55)" : "rgba(30,64,175,0.28)";
  const blueB = variant === "ink" ? "rgba(15,23,42,0.85)" : "rgba(30,58,138,0.18)";
  const limeDot = variant === "ink" ? "rgba(132,204,22,0.18)" : "rgba(132,204,22,0.10)";

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      {/* Base radial — Blue → Ink */}
      <div
        className="absolute inset-0"
        style={{
          background: variant === "ink"
            ? "radial-gradient(ellipse at top, rgba(30,64,175,0.22) 0%, transparent 60%), linear-gradient(180deg, #0F172A 0%, #1E40AF 100%)"
            : "radial-gradient(ellipse at top right, rgba(30,64,175,0.10) 0%, transparent 55%)",
        }}
      />

      {/* Blob azul grande */}
      <motion.div
        className="absolute -top-1/3 -left-1/4 w-[70%] h-[70%] rounded-full blur-3xl"
        style={{ background: blueA }}
        animate={reduced ? undefined : { x: [0, 80, 0], y: [0, 40, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Blob slate ink */}
      <motion.div
        className="absolute -bottom-1/3 -right-1/4 w-[55%] h-[55%] rounded-full blur-3xl"
        style={{ background: blueB }}
        animate={reduced ? undefined : { x: [0, -60, 0], y: [0, -30, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Ponto pequeno de lime — uso funcional, não gradiente */}
      <motion.div
        className="absolute top-1/3 right-1/4 w-32 h-32 rounded-full blur-3xl"
        style={{ background: limeDot }}
        animate={reduced ? undefined : { opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}