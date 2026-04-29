import { Link, useNavigate } from "react-router-dom";
import { ShieldX } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Footer } from "@/components/landing/Footer";
import { Logo } from "@/components/shared/Logo";

export default function ForbiddenPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const onSignOut = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-lc-surface flex flex-col">
      <header className="px-5 md:px-8 h-16 flex items-center border-b border-lc-border bg-lc-white">
        <Link to="/" aria-label="ListaCerta — início">
          <Logo size="sm" />
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-md text-center">
          <ShieldX className="w-16 h-16 text-lc-coral mx-auto" aria-hidden />
          <h1 className="mt-6 text-3xl md:text-4xl font-extrabold tracking-tight text-lc-ink">
            Acesso negado.
          </h1>
          <p className="mt-3 text-base text-lc-mid leading-relaxed">
            Você não tem permissão para acessar esta página.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => history.back()}
              className="h-11 px-6 rounded-xl bg-lc-white border border-lc-border text-lc-ink text-sm font-semibold hover:bg-lc-surface hover:border-lc-mid/40 transition-all"
            >
              Voltar
            </button>
            {user && (
              <button
                onClick={onSignOut}
                className="h-11 px-6 rounded-xl bg-lc-blue text-white text-sm font-semibold hover:opacity-90 transition-all"
              >
                Sair da conta
              </button>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
