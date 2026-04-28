import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";

interface NumberCounterProps {
  to: number;
  duration?: number;
  className?: string;
  formatter?: (n: number) => string;
}

const defaultFmt = (n: number) =>
  new Intl.NumberFormat("pt-BR").format(Math.round(n));

export function NumberCounter({
  to,
  duration = 1200,
  className = "",
  formatter = defaultFmt,
}: NumberCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });
  const reduced = useReducedMotion();
  const [val, setVal] = useState(reduced ? to : 0);

  useEffect(() => {
    if (!inView || reduced) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setVal(to * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration, reduced]);

  return (
    <span ref={ref} className={`lc-num ${className}`}>
      {formatter(val)}
    </span>
  );
}