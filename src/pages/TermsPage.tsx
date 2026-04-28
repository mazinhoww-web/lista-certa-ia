import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { Footer } from "@/components/landing/Footer";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-lc-surface flex flex-col">
      <header className="px-5 md:px-8 h-16 flex items-center justify-between border-b border-lc-border bg-lc-white">
        <Link to="/" aria-label="ListaCerta — início">
          <Logo size="sm" />
        </Link>
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-lc-mid hover:text-lc-ink transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>
      </header>

      <main className="flex-1 max-w-3xl mx-auto px-5 md:px-8 py-16 md:py-24">
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-lc-ink">
          Termos de uso
        </h1>
        <p className="mt-6 text-base md:text-lg text-lc-mid leading-relaxed">
          Documento em finalização. A versão definitiva será publicada antes da abertura
          comercial em Cuiabá.
        </p>
        <p className="mt-4 text-base text-lc-mid leading-relaxed">
          Para dúvidas:{" "}
          <a href="mailto:dpo@listacertaescolar.com.br" className="text-lc-blue underline">
            dpo@listacertaescolar.com.br
          </a>
          .
        </p>
      </main>

      <Footer />
    </div>
  );
}
