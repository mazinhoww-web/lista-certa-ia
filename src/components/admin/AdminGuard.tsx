// Renders children only when the current profile has role='platform_admin'.
// Unauthenticated users are bounced to /login; logged-in non-admins see an
// inline 403 view (we do NOT redirect — that would imply the resource
// doesn't exist, while in fact the user just lacks permission).

import type { ReactNode } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { Loader2, ShieldX } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsPlatformAdmin } from "@/hooks/useIsPlatformAdmin";

export function AdminGuard({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { isPlatformAdmin, isLoading } = useIsPlatformAdmin();
  const location = useLocation();

  if (authLoading || isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-lc-surface"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="w-6 h-6 text-lc-blue animate-spin" aria-hidden />
        <span className="sr-only">Carregando...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (!isPlatformAdmin) {
    return <ForbiddenView />;
  }

  return <>{children}</>;
}

function ForbiddenView() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-lc-surface px-5">
      <div className="max-w-md text-center">
        <ShieldX className="w-16 h-16 text-lc-coral mx-auto" aria-hidden />
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-lc-ink">
          Acesso negado.
        </h1>
        <p className="mt-2 text-base text-lc-mid leading-relaxed">
          Esta área é exclusiva para administradores da plataforma.
        </p>
        <Link
          to="/minha-conta"
          className="mt-6 inline-flex h-11 px-5 rounded-xl bg-lc-blue text-white text-sm font-semibold items-center justify-center hover:opacity-90 transition-all"
        >
          Voltar à minha conta
        </Link>
      </div>
    </div>
  );
}
