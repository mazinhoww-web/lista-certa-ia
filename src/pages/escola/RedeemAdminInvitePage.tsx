// LC-002.5: /escola/admin-convite/:token
//
// Em <ProtectedRoute>: anônimo cai em /login com state.from preservando o
// path completo (`/escola/admin-convite/<token>`), aceita o convite após
// login e volta. Logado, dispara redeem na montagem (uma vez).
//
// Estados:
//   - resolving  → spinner
//   - idempotent → toast "Você já administra esta escola" + redirect status
//   - success    → toast + redirect status
//   - error      → mensagem pt-BR mapeada por código + CTA "Voltar"

import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/shared/Logo";
import { Footer } from "@/components/landing/Footer";
import {
  useRedeemAdminInvite,
  humanizeRedeemError,
  type RedeemErrorCode,
} from "@/hooks/useRedeemAdminInvite";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function RedeemAdminInvitePage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const redeem = useRedeemAdminInvite();
  const firedRef = useRef(false);
  const [errorCode, setErrorCode] = useState<RedeemErrorCode | null>(null);

  const tokenValid = token && UUID_RE.test(token);

  useEffect(() => {
    if (!tokenValid || firedRef.current) return;
    firedRef.current = true;
    redeem.mutate(token!, {
      onSuccess: (data) => {
        if (data.idempotent) {
          toast.info("Você já administra esta escola.");
        } else {
          toast.success("Convite aceito! Bem-vindo(a) como admin.");
        }
        navigate(`/escola/${data.school_id}/status`, { replace: true });
      },
      onError: (err) => {
        setErrorCode(err.code);
      },
    });
    // mutate identity é estável; não incluir em deps senão refire.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenValid, token]);

  if (!tokenValid) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-lc-surface flex flex-col">
      <header className="px-5 md:px-8 h-16 flex items-center border-b border-lc-border bg-lc-white">
        <Link to="/" aria-label="ListaCerta — início" className="flex items-center">
          <Logo size="sm" />
        </Link>
      </header>

      <main className="flex-1 mx-auto px-5 md:px-8 py-10 w-full max-w-[480px]">
        {(redeem.isPending || (!errorCode && !redeem.isSuccess)) && (
          <div className="mt-12 text-center" role="status" aria-live="polite">
            <Loader2 className="w-6 h-6 text-lc-blue animate-spin mx-auto" aria-hidden />
            <p className="mt-3 text-sm text-lc-mid">Aceitando convite…</p>
          </div>
        )}

        {errorCode && (
          <div className="mt-12 rounded-2xl bg-lc-white border border-lc-border p-8 text-center">
            <h1 className="text-2xl font-extrabold text-lc-ink">
              Não conseguimos aceitar
            </h1>
            <p className="mt-2 text-sm text-lc-mid">
              {humanizeRedeemError(errorCode)}
            </p>
            <Link
              to="/minhas-escolas"
              className="mt-6 inline-flex items-center justify-center h-11 px-5 rounded-xl bg-lc-blue text-white text-sm font-semibold hover:opacity-90"
            >
              Minhas escolas
            </Link>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
