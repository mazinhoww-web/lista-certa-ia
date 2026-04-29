import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Logo } from "@/components/shared/Logo";

const NAV = [
  { label: "Como funciona", href: "#how" },
  { label: "Para escolas",  href: "#schools" },
  { label: "Para pais",     href: "#parents" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={[
        "fixed top-0 left-0 right-0 z-40 transition-all duration-300",
        scrolled
          ? "bg-lc-white/80 backdrop-blur-md border-b border-lc-border shadow-lc-sm"
          : "bg-transparent",
      ].join(" ")}
    >
      <div className="max-w-6xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between">
        <a href="/" aria-label="ListaCerta — início" className="flex items-center">
          <Logo size={22} />
        </a>

        <nav className="hidden md:flex items-center gap-8">
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="text-sm font-semibold text-lc-ink/80 hover:text-lc-blue transition-colors"
            >
              {n.label}
            </a>
          ))}
          <Link
            to="/buscar"
            className="text-sm font-semibold text-lc-ink/80 hover:text-lc-blue transition-colors"
          >
            Buscar escola
          </Link>
        </nav>

        <Link
          to="/login"
          className="inline-flex items-center gap-2 h-10 px-5 rounded-full bg-lc-blue text-white text-sm font-semibold shadow-lc-sm hover:bg-lc-blue-700 active:scale-[0.98] transition-all"
        >
          Entrar com Google
        </Link>
      </div>
    </header>
  );
}