import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
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
