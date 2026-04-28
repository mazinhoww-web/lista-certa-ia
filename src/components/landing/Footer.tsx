import { Logo } from "@/components/shared/Logo";
import { ShieldCheck } from "lucide-react";

const COLS = [
  {
    title: "Produto",
    links: [
      { label: "Como funciona", href: "#how" },
      { label: "Para escolas",  href: "#schools" },
      { label: "Para pais",     href: "#parents" },
    ],
  },
  {
    title: "Empresa",
    links: [
      { label: "Sobre",     href: "#" },
      { label: "Contato",   href: "mailto:contato@listacertaescolar.com.br" },
      { label: "WhatsApp +55 (65) 99607-6018", href: "https://wa.me/5565996076018" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Política de privacidade", href: "/privacidade" },
      { label: "Termos de uso",           href: "/termos" },
      { label: "Encarregado (DPO)",       href: "mailto:dpo@listacertaescolar.com.br" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-lc-ink text-white">
      <div className="max-w-6xl mx-auto px-5 md:px-8 py-16 md:py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          <div className="col-span-2 md:col-span-1">
            <Logo size={22} variant="reverse-white" />
            <p className="mt-4 text-sm text-white/60 max-w-xs leading-relaxed">
              A infraestrutura silenciosa que torna a volta às aulas certa.
            </p>
          </div>

          {COLS.map((c) => (
            <div key={c.title}>
              <h4 className="text-xs font-bold uppercase tracking-[0.14em] text-white/40">
                {c.title}
              </h4>
              <ul className="mt-4 space-y-3">
                {c.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="text-sm text-white/80 hover:text-lc-lime transition-colors"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <p className="text-xs text-white/50">
            © 2026 ListaCerta · Cuiabá, MT
          </p>
          <span className="inline-flex items-center gap-2 h-7 px-3 rounded-full bg-lc-emerald/15 border border-lc-emerald/30 text-xs font-bold text-lc-lime-200">
            <ShieldCheck className="w-3.5 h-3.5" strokeWidth={2.5} />
            Validada Procon-MT
          </span>
        </div>
      </div>
    </footer>
  );
}