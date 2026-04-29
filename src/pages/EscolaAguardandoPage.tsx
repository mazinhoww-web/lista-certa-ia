// Stub for the post-submit landing screen. LC-003 expands this into a real
// status page (timeline, email re-send, etc).

import { Link } from "react-router-dom";
import { Clock } from "lucide-react";
import { Footer } from "@/components/landing/Footer";
import { Logo } from "@/components/shared/Logo";

export default function EscolaAguardandoPage() {
  return (
    <div className="min-h-screen bg-lc-surface flex flex-col">
      <header className="px-5 md:px-8 h-16 flex items-center border-b border-lc-border bg-lc-white">
        <Link to="/" aria-label="ListaCerta — início">
          <Logo size="sm" />
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-md text-center">
          <Clock className="w-16 h-16 text-lc-coral mx-auto" aria-hidden />
          <h1 className="mt-6 text-3xl md:text-4xl font-extrabold tracking-tight text-lc-ink">
            Cadastro recebido!
          </h1>
          <p className="mt-3 text-base text-lc-mid leading-relaxed">
            Sua escola está em análise. Você será avisado por email assim que for
            aprovada (geralmente em até 48h).
          </p>
          <Link
            to="/"
            className="mt-8 inline-flex items-center justify-center h-11 px-6 rounded-xl bg-lc-blue text-white text-sm font-semibold hover:opacity-90 transition-all"
          >
            Voltar para a home
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
