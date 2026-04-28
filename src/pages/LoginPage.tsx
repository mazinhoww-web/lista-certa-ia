import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/shared/Logo";
import { lovable } from "@/integrations/lovable";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  const onGoogle = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });

    if (result.error) {
      setLoading(false);
      toast.error("Algo nao saiu como esperado. Tenta de novo?");
      return;
    }

    if (result.redirected) {
      // Browser irá redirecionar — nada a fazer
      return;
    }

    // Tokens recebidos: TODO LC-001 — implementar /auth/callback e roteamento pós-login
    setLoading(false);
    toast.success("Pronto. Sessão iniciada.");
  };

  return (
    <div className="min-h-screen bg-lc-surface flex flex-col">
      <header className="px-5 md:px-8 h-16 flex items-center">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-lc-mid hover:text-lc-ink transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-md bg-lc-white border border-lc-border rounded-2xl shadow-lc-md p-8 md:p-10 text-center">
          <div className="flex justify-center">
            <Logo size="md" />
          </div>

          <h1 className="mt-8 text-2xl md:text-3xl font-extrabold tracking-tight text-lc-ink">
            Entrar para continuar
          </h1>
          <p className="mt-2 text-sm text-lc-mid leading-relaxed">
            Você usa sua conta Google. Em segundos.
          </p>

          <button
            onClick={onGoogle}
            disabled={loading}
            className="mt-8 w-full h-12 rounded-xl bg-lc-white border border-lc-border text-lc-ink text-sm font-semibold inline-flex items-center justify-center gap-3 hover:bg-lc-surface hover:border-lc-mid/40 active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lc-sm"
            aria-label="Continuar com Google"
          >
            <GoogleIcon />
            {loading ? "Conectando..." : "Continuar com Google"}
          </button>

          <p className="mt-6 text-xs text-lc-mid leading-relaxed">
            Ao continuar você concorda com a{" "}
            <Link to="/privacidade" className="underline hover:text-lc-blue">
              política de privacidade
            </Link>
            .
          </p>
        </div>
      </main>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.13-.84 2.08-1.79 2.72v2.26h2.9c1.7-1.56 2.69-3.86 2.69-6.62z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.47-.81 5.96-2.18l-2.9-2.26c-.81.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.34A8.99 8.99 0 0 0 9 18z" fill="#34A853" />
      <path d="M3.95 10.7A5.41 5.41 0 0 1 3.66 9c0-.59.1-1.16.29-1.7V4.96H.96A8.99 8.99 0 0 0 0 9c0 1.45.35 2.83.96 4.04l2.99-2.34z" fill="#FBBC05" />
      <path d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.96l2.99 2.34C4.66 5.17 6.65 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  );
}
