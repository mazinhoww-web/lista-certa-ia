const RETAILERS = ["Kalunga", "Magalu", "Mercado Livre", "Amazon"];

export function RetailersMarquee() {
  // Duplicamos para o loop infinito sem corte visual
  const list = [...RETAILERS, ...RETAILERS];

  return (
    <section className="py-16 md:py-24 bg-lc-white border-y border-lc-border">
      <div className="max-w-6xl mx-auto px-5 md:px-8">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-lc-mid">
          Compare em 4 grandes redes
        </p>
      </div>

      <div className="mt-10 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_15%,#000_85%,transparent)]">
        <div className="flex gap-16 md:gap-24 animate-marquee whitespace-nowrap w-max">
          {list.map((r, i) => (
            <span
              key={i}
              className="text-2xl md:text-4xl font-black tracking-tighter text-lc-ink/30 hover:text-lc-ink transition-colors duration-300"
            >
              {r}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}