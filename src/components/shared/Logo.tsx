type Variant = "default" | "reverse-white" | "mono-black" | "icon";
type SizeToken = "sm" | "md" | "lg";

interface LogoProps {
  size?: SizeToken | number;
  variant?: Variant;
  className?: string;
}

const SIZE_PX: Record<SizeToken, number> = { sm: 18, md: 24, lg: 36 };

/**
 * ListaCerta logo — usa os SVGs oficiais do brand book (C-Tick Integrado).
 * - default       → wordmark azul/lime sobre fundo claro
 * - reverse-white → wordmark branco sobre fundo escuro
 * - mono-black    → wordmark preto puro (uso institucional)
 * - icon          → apenas o C-Tick (ideal para favicons / app launcher)
 */
export function Logo({ size = "md", variant = "default", className = "" }: LogoProps) {
  const heightPx = typeof size === "number" ? size : SIZE_PX[size];

  if (variant === "icon") {
    return (
      <img
        src="/symbol-ctick.svg"
        width={heightPx}
        height={heightPx}
        alt="ListaCerta"
        className={className}
        decoding="async"
      />
    );
  }

  // Wordmark — viewBox 540x112, mantemos altura e largura proporcional
  const widthPx = Math.round((heightPx * 540) / 112);
  const src =
    variant === "reverse-white"
      ? "/logo-listacerta-white.svg"
      : variant === "mono-black"
        ? "/logo-listacerta.svg"
        : "/logo-listacerta.svg";

  return (
    <img
      src={src}
      width={widthPx}
      height={heightPx}
      alt="ListaCerta"
      className={className}
      decoding="async"
      style={
        variant === "mono-black"
          ? { filter: "grayscale(1) brightness(0)" }
          : undefined
      }
    />
  );
}
