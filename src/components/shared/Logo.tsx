import { motion } from "framer-motion";

type Variant = "default" | "reverse-white" | "mono-black" | "icon";

interface LogoProps {
  size?: number;
  variant?: Variant;
  className?: string;
  withWordmark?: boolean;
}

/**
 * ListaCerta logo — C-Tick Integrado.
 * O "C" de "Certa" é um arco aberto que termina em tick.
 */
export function Logo({
  size = 32,
  variant = "default",
  className = "",
  withWordmark = true,
}: LogoProps) {
  const wordmarkColor =
    variant === "reverse-white" ? "#FFFFFF" :
    variant === "mono-black"    ? "#0F172A" :
                                  "#0F172A";

  const arcColor =
    variant === "reverse-white" ? "#FFFFFF" :
    variant === "mono-black"    ? "#0F172A" :
                                  "#1E40AF";

  const tickColor =
    variant === "mono-black" ? "#0F172A" : "#84CC16";

  // Apenas o C-Tick (icon-only)
  if (variant === "icon" || !withWordmark) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-label="ListaCerta"
      >
        {/* Arco aberto (C) */}
        <path
          d="M50 18 A 18 18 0 1 0 50 46"
          stroke={arcColor}
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
        />
        {/* Tick que sai do arco */}
        <path
          d="M42 38 L52 50"
          stroke={tickColor}
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    );
  }

  // Wordmark completo
  const fontSize = size * 0.95;
  return (
    <motion.div
      className={`inline-flex items-center ${className}`}
      style={{ gap: size * 0.04 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <span
        style={{
          fontWeight: 900,
          fontSize,
          letterSpacing: "-0.025em",
          color: wordmarkColor,
          lineHeight: 1,
        }}
      >
        Lista
      </span>
      <svg
        width={size * 1.05}
        height={size * 1.1}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ marginInline: -size * 0.06 }}
      >
        <path
          d="M50 18 A 18 18 0 1 0 50 46"
          stroke={arcColor}
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M42 38 L52 50"
          stroke={tickColor}
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      <span
        style={{
          fontWeight: 900,
          fontSize,
          letterSpacing: "-0.025em",
          color: wordmarkColor,
          lineHeight: 1,
        }}
      >
        erta
      </span>
    </motion.div>
  );
}