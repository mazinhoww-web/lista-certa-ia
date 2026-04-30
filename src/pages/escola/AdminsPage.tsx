// LC-002.5: /escola/:id/admins
//
// Lista admins ativos da escola. Permite gerar convite via modal e
// remover admin (incluindo a si mesmo, exceto se for o último).
//
// Permissões via RLS:
//   - useSchool retorna null se caller não é admin → renderizamos "removida".
//   - useSchoolAdmins lista é vazia se caller não tem permissão.
// Não validamos permissão no client além do que o backend já gateia.

import { useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useSchool } from "@/hooks/useSchool";
import {
  useSchoolAdmins,
  type SchoolAdmin,
} from "@/hooks/useSchoolAdmins";
import {
  useRemoveSchoolAdmin,
  humanizeRemoveError,
  type RemoveAdminError,
} from "@/hooks/useRemoveSchoolAdmin";
import { Logo } from "@/components/shared/Logo";
import { Footer } from "@/components/landing/Footer";
import { AdminListCard } from "@/components/escola/AdminListCard";
import { AdminLimitWarning } from "@/components/escola/AdminLimitWarning";
import { InviteAdminModal } from "@/components/escola/InviteAdminModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ADMIN_LIMIT = 5;

export default function AdminsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const schoolQ = useSchool(id);
  const adminsQ = useSchoolAdmins(id);
  const removeMut = useRemoveSchoolAdmin();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<SchoolAdmin | null>(null);

  if (!id) return <Navigate to="/minhas-escolas" replace />;

  const school = schoolQ.data?.school ?? null;
  const admins = adminsQ.data ?? [];
  const activeCount = admins.length;
  const isAtLimit = activeCount >= ADMIN_LIMIT;

  const onConfirmRemove = () => {
    if (!removeTarget || !id || !user) return;
    const isSelf = removeTarget.user_id === user.id;
    removeMut.mutate(
      { schoolId: id, targetUserId: removeTarget.user_id },
      {
        onSuccess: () => {
          setRemoveTarget(null);
          if (isSelf) {
            toast.success("Você saiu como admin desta escola.");
            navigate("/minhas-escolas", { replace: true });
          } else {
            toast.success(
              `${removeTarget.first_name ?? "Admin"} foi removido.`,
            );
          }
        },
        onError: (err: RemoveAdminError) => {
          toast.error(humanizeRemoveError(err.code));
          setRemoveTarget(null);
        },
      },
    );
  };

  const isRemovingSelf = removeTarget && user && removeTarget.user_id === user.id;

  return (
    <div className="min-h-screen bg-lc-surface flex flex-col">
      <header className="px-5 md:px-8 h-16 flex items-center border-b border-lc-border bg-lc-white">
        <Link to="/" aria-label="ListaCerta — início" className="flex items-center">
          <Logo size="sm" />
        </Link>
      </header>

      <main className="flex-1 mx-auto px-5 md:px-8 py-6 md:py-10 w-full max-w-[640px]">
        <Link
          to={`/escola/${id}/status`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-lc-mid hover:text-lc-ink mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden />
          Voltar para status
        </Link>

        {schoolQ.isLoading && <LoadingState />}

        {!schoolQ.isLoading && !school && <RemovedState />}

        {school && (
          <>
            <h1 className="text-2xl md:text-3xl font-extrabold text-lc-ink tracking-tight">
              Administradores
            </h1>
            <p className="mt-1 text-sm text-lc-mid">
              Quem pode gerenciar{" "}
              <span className="font-semibold text-lc-ink">
                {school.trade_name}
              </span>
              .
            </p>

            {adminsQ.isLoading && (
              <div className="mt-6 space-y-2">
                {[0, 1].map((i) => (
                  <div
                    key={i}
                    className="h-16 rounded-2xl bg-lc-white border border-lc-border animate-pulse"
                  />
                ))}
              </div>
            )}

            {!adminsQ.isLoading && admins.length === 0 && (
              <p className="mt-6 text-sm text-lc-mid">
                Nenhum admin ativo encontrado.
              </p>
            )}

            {!adminsQ.isLoading && admins.length > 0 && (
              <ul className="mt-6 space-y-2">
                {admins.map((a) => (
                  <li key={a.user_id}>
                    <AdminListCard
                      admin={a}
                      isYou={user?.id === a.user_id}
                      isLastActiveAdmin={activeCount <= 1}
                      onRequestRemove={(adm) => setRemoveTarget(adm)}
                    />
                  </li>
                ))}
              </ul>
            )}

            <button
              type="button"
              onClick={() => setInviteOpen(true)}
              disabled={isAtLimit}
              className={`mt-5 w-full h-11 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2 transition-all ${
                isAtLimit
                  ? "bg-lc-surface border border-lc-border text-lc-mid cursor-not-allowed"
                  : "bg-lc-blue text-white hover:opacity-90"
              }`}
            >
              <UserPlus className="w-4 h-4" aria-hidden />
              Convidar admin
            </button>

            <div className="mt-4">
              <AdminLimitWarning count={activeCount} max={ADMIN_LIMIT} />
            </div>

            <InviteAdminModal
              open={inviteOpen}
              onOpenChange={setInviteOpen}
              schoolId={id}
              schoolName={school.trade_name}
            />

            <AlertDialog
              open={!!removeTarget}
              onOpenChange={(o) => {
                if (!o) setRemoveTarget(null);
              }}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {isRemovingSelf
                      ? "Sair desta escola?"
                      : `Remover ${removeTarget?.first_name ?? "admin"}?`}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {isRemovingSelf ? (
                      <>
                        Você perderá o acesso a esta escola imediatamente.
                        Outros admins continuarão gerenciando. Convites
                        pendentes que você criou serão cancelados.
                      </>
                    ) : (
                      <>
                        Esta pessoa não poderá mais gerenciar a escola.
                        Convites pendentes que ela criou serão cancelados.
                      </>
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={removeMut.isPending}>
                    Cancelar
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onConfirmRemove}
                    disabled={removeMut.isPending}
                    className="bg-lc-coral text-white hover:bg-lc-coral/90"
                  >
                    {removeMut.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                    ) : isRemovingSelf ? (
                      "Sim, sair"
                    ) : (
                      "Sim, remover"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-3 mt-6">
      <div className="h-8 w-48 rounded-md bg-lc-border/60 animate-pulse" />
      <div className="h-4 w-64 rounded-md bg-lc-border/40 animate-pulse" />
    </div>
  );
}

function RemovedState() {
  return (
    <div className="mt-12 rounded-2xl bg-lc-white border border-lc-border p-8 text-center">
      <h1 className="text-2xl font-extrabold text-lc-ink">
        Escola não encontrada
      </h1>
      <p className="mt-2 text-sm text-lc-mid">
        Você não tem acesso a esta escola, ou ela não existe.
      </p>
      <Link
        to="/minhas-escolas"
        className="mt-6 inline-flex items-center justify-center h-11 px-5 rounded-xl bg-lc-blue text-white text-sm font-semibold hover:opacity-90"
      >
        Minhas escolas
      </Link>
    </div>
  );
}
