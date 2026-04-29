// /admin/escolas/:id — detail screen for a single school in the admin
// queue. Shows the same Dados card the operator sees in /escola/:id/status,
// plus admin-only flags, the cadastrante's identity, the action panel,
// and the audit log. Platform_admin RLS lets a direct fetch through.

import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { StatusBadge } from "@/components/escola/StatusBadge";
import { SchoolDataCard } from "@/components/escola/SchoolDataCard";
import { StatusActionPanel } from "@/components/admin/StatusActionPanel";
import { StatusLogTimeline } from "@/components/admin/StatusLogTimeline";
import { useSchoolStatusLog } from "@/hooks/useSchoolStatusLog";
import type { Database } from "@/integrations/supabase/types";

type School = Database["public"]["Tables"]["schools"]["Row"];

interface AdminLink {
  role: string | null;
  created_at: string | null;
  user: { id: string; full_name: string | null } | null;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function useAdminSchoolDetail(id: string | undefined) {
  return useQuery<{ school: School; admins: AdminLink[] } | null>({
    queryKey: ["school", id ?? "none"],
    enabled: Boolean(id),
    queryFn: async () => {
      if (!id || !UUID_RE.test(id)) return null;
      const { data, error } = await supabase
        .from("schools")
        .select(
          "*, admins:school_admins(role, created_at, user:profiles!user_id(id, full_name))",
        )
        .eq("id", id)
        .maybeSingle();
      if (error) {
        console.error("[admin-detail] query failed", {
          school_id: id,
          code: error.code,
          message: error.message,
        });
        throw error;
      }
      if (!data) return null;
      const { admins, ...school } = data as School & { admins: AdminLink[] };
      return { school: school as School, admins: admins ?? [] };
    },
  });
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

export default function AdminEscolaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useAdminSchoolDetail(id);
  const log = useSchoolStatusLog(id);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4" role="status" aria-live="polite">
        <div className="h-8 w-64 rounded-md bg-lc-border/60 animate-pulse" />
        <div className="h-32 rounded-2xl bg-lc-border/60 animate-pulse" />
        <div className="h-64 rounded-2xl bg-lc-border/60 animate-pulse" />
      </div>
    );
  }

  if (error || !data?.school) {
    return (
      <div className="max-w-3xl mx-auto text-center py-12">
        <h1 className="text-2xl font-extrabold text-lc-ink">
          {error ? "Não conseguimos carregar agora." : "Escola não encontrada."}
        </h1>
        <Link
          to="/admin/escolas"
          className="mt-6 inline-flex h-11 px-5 rounded-xl bg-lc-blue text-white text-sm font-semibold items-center justify-center hover:opacity-90 transition-all"
        >
          Voltar para a fila
        </Link>
      </div>
    );
  }

  const school = data.school;
  // First school_admins entry (created_at ASC) is the cadastrante / owner.
  const ownerLink = [...data.admins].sort((a, b) => {
    const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
    const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
    return ta - tb;
  })[0];

  const score =
    (school.manually_added ? 2 : 0) +
    (school.email_likely_institutional ? 0 : 1);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        to="/admin/escolas"
        className="inline-flex items-center gap-2 text-sm font-semibold text-lc-mid hover:text-lc-ink transition-colors"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden /> Voltar para a fila
      </Link>

      <header>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-lc-ink">
          {school.trade_name}
        </h1>
        <div className="mt-2">
          <StatusBadge status={school.status} size="md" />
        </div>
      </header>

      <SchoolDataCard school={school} />

      <section className="rounded-2xl bg-lc-white border border-lc-border p-5 md:p-6">
        <h2 className="text-base font-bold text-lc-ink">Flags do admin</h2>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <Pill tone={school.inep_code ? "neutral" : "warn"}>
            {school.inep_code ? "INEP" : "Manual"}
          </Pill>
          <Pill tone={school.email_likely_institutional ? "ok" : "warn"}>
            {school.email_likely_institutional
              ? "Email institucional"
              : "Email pessoal"}
          </Pill>
          <Pill tone={score >= 2 ? "danger" : score === 1 ? "warn" : "ok"}>
            Score: {score}/3
          </Pill>
        </div>
      </section>

      <section className="rounded-2xl bg-lc-white border border-lc-border p-5 md:p-6">
        <h2 className="text-base font-bold text-lc-ink">Cadastrante</h2>
        {ownerLink ? (
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex gap-2">
              <dt className="font-semibold text-lc-mid w-32 shrink-0">Nome</dt>
              <dd className="text-lc-ink">
                {ownerLink.user?.full_name ?? "—"}
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-semibold text-lc-mid w-32 shrink-0">
                Vinculado em
              </dt>
              <dd className="text-lc-ink">{formatDate(ownerLink.created_at)}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-semibold text-lc-mid w-32 shrink-0">Papel</dt>
              <dd className="text-lc-ink capitalize">
                {ownerLink.role ?? "admin"}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="mt-3 text-sm text-lc-mid">
            Nenhum admin vinculado encontrado.
          </p>
        )}
      </section>

      <StatusActionPanel schoolId={school.id} status={school.status} />

      <section className="rounded-2xl bg-lc-white border border-lc-border p-5 md:p-6">
        <h2 className="text-base font-bold text-lc-ink">Histórico</h2>
        <div className="mt-4">
          <StatusLogTimeline
            entries={log.data ?? []}
            isLoading={log.isLoading}
          />
        </div>
      </section>

      {log.isFetching && (
        <p className="text-xs text-lc-mid inline-flex items-center gap-2">
          <Loader2 className="w-3 h-3 animate-spin" aria-hidden /> Atualizando
          histórico...
        </p>
      )}
    </div>
  );
}

function Pill({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "ok" | "warn" | "danger" | "neutral";
}) {
  const classes =
    tone === "ok"
      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
      : tone === "warn"
        ? "bg-amber-100 text-amber-800 border-amber-200"
        : tone === "danger"
          ? "bg-rose-100 text-rose-800 border-rose-200"
          : "bg-slate-100 text-slate-700 border-slate-200";
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full border font-semibold ${classes}`}
    >
      {children}
    </span>
  );
}
