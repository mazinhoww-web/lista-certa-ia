import { Link, useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useMySchools } from "@/hooks/useMySchools";
import { Footer } from "@/components/landing/Footer";
import { Logo } from "@/components/shared/Logo";
import type { Database } from "@/integrations/supabase/types";

type Role = Database["public"]["Enums"]["user_role"];

const ROLE_LABELS: Record<Role, string> = {
  parent: "Pai/Responsável",
  school_admin: "Administrador de escola",
  platform_admin: "Admin da plataforma",
};

export default function MinhaContaPage() {
  const navigate = useNavigate();
  const { user, profile, role, signOut } = useAuth();
  const mySchools = useMySchools();

  const onSignOut = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  const showCadastroCta =
    role === "parent" && !mySchools.isLoading && (mySchools.data?.length ?? 0) === 0;

  return (
    <div className="min-h-screen bg-lc-surface flex flex-col">
      <header className="px-5 md:px-8 h-16 flex items-center border-b border-lc-border bg-lc-white">
        <Link to="/" aria-label="ListaCerta — início">
          <Logo size="sm" />
        </Link>
      </header>

      <main className="flex-1 max-w-2xl mx-auto px-5 md:px-8 py-12 md:py-16 w-full">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-lc-ink">
          Olá, {profile?.full_name ?? user?.email ?? "—"}
        </h1>

        <dl className="mt-10 space-y-6">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-lc-mid">
              Conta
            </dt>
            <dd className="mt-1 text-base text-lc-ink">{user?.email ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-lc-mid">
              Tipo
            </dt>
            <dd className="mt-1 text-base text-lc-ink">{role ? ROLE_LABELS[role] : "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-lc-mid">
              Cidade
            </dt>
            <dd className="mt-1 text-base text-lc-ink">{profile?.city ?? "—"}</dd>
          </div>
        </dl>

        {showCadastroCta && (
          <div className="mt-10 rounded-2xl bg-lc-white border border-lc-border p-5">
            <h2 className="text-base font-bold text-lc-ink">É administrador de uma escola?</h2>
            <p className="mt-1 text-sm text-lc-mid leading-relaxed">
              Cadastre sua escola para publicar listas de material e receber pedidos.
            </p>
            <Link
              to="/escola/cadastrar"
              className="mt-4 inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-lc-blue text-white text-sm font-semibold hover:opacity-90 transition-all"
            >
              <Plus className="w-4 h-4" aria-hidden />
              Cadastrar minha escola
            </Link>
          </div>
        )}

        <button
          onClick={onSignOut}
          className="mt-12 h-11 px-6 rounded-xl bg-lc-white border border-lc-border text-lc-ink text-sm font-semibold hover:bg-lc-surface hover:border-lc-mid/40 transition-all"
        >
          Sair
        </button>
      </main>

      <Footer />
    </div>
  );
}
