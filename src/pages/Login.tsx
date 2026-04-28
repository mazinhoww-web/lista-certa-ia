import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/shared/Logo";

export default function Login() {
  return (
    <div className="min-h-screen bg-lc-surface flex flex-col">
      <header className="px-5 md:px-8 h-16 flex items-center">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-lc-mid hover:text-lc-ink transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-5">
        <div className="w-full max-w-sm bg-lc-white border border-lc-border rounded-2xl shadow-lc-md p-8 text-center">
          <div className="flex justify-center">
            <Logo size={26} />
          </div>
          <h1 className="mt-6 text-2xl font-extrabold tracking-tight text-lc-ink">
            Entrar com Google
          </h1>
          <p className="mt-2 text-sm text-lc-mid leading-relaxed">
            A autenticação Google será conectada na próxima etapa.
            Por enquanto, este é um placeholder.
          </p>

          <button
            disabled
            className="mt-6 w-full h-12 rounded-xl bg-lc-blue text-white text-sm font-semibold opacity-60 cursor-not-allowed"
          >
            Continuar com Google
          </button>

          <p className="mt-6 text-xs text-lc-mid">
            Ao continuar você aceita os <a href="/termos" className="underline">termos</a> e a{" "}
            <a href="/privacidade" className="underline">política de privacidade</a>.
          </p>
        </div>
      </main>
    </div>
  );
}