import { Link } from "react-router-dom";
import { CircleAlert, ArrowLeft } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { Footer } from "@/components/landing/Footer";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-lc-surface flex flex-col">
      <header className="px-5 md:px-8 h-16 flex items-center">
        <Link to="/" aria-label="ListaCerta — início">
          <Logo size="sm" />
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-5 py-16">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-lc-coral-50 border border-lc-coral-100 text-lc-coral mb-6">
            <CircleAlert className="w-8 h-8" strokeWidth={2} />
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-lc-ink">
            Algo não saiu como esperado.
          </h1>
          <p className="mt-3 text-base text-lc-mid leading-relaxed">
            A página que você procura não existe ou foi movida.
          </p>
          <Link
            to="/"
            className="mt-8 inline-flex items-center gap-2 h-12 px-6 rounded-full bg-lc-blue text-white text-sm font-semibold hover:bg-lc-blue-700 active:scale-[0.98] transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para o início
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
