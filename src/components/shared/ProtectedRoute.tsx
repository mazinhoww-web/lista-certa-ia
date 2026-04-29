import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";

type Role = Database["public"]["Enums"]["user_role"];

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: Role;
  requiredRoles?: Role[];
}

export function ProtectedRoute({
  children,
  requiredRole,
  requiredRoles,
}: ProtectedRouteProps) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-lc-surface"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="w-6 h-6 text-lc-blue animate-spin" aria-hidden />
        <span className="sr-only">Carregando…</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  const allowed = (() => {
    if (requiredRole && role !== requiredRole) return false;
    if (requiredRoles && (!role || !requiredRoles.includes(role))) return false;
    return true;
  })();

  if (!allowed) {
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
}
