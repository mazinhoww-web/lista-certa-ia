// Single-scroll cadastro form. Sections are visual milestones, not wizard
// steps — the user can jump around and submit at the end. Auth is required
// (gated by ProtectedRoute on the route).

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/shared/Logo";
import { Footer } from "@/components/landing/Footer";
import { SchoolPickerSection } from "@/components/escola/SchoolPickerSection";
import { AddressForm } from "@/components/escola/AddressForm";
import { ContactFields } from "@/components/escola/ContactFields";
import type { InepSearchResult } from "@/components/escola/SchoolAutocomplete";
import type { ManualSchoolPayload } from "@/components/escola/ManualSchoolModal";
import { isLikelyInstitutionalEmail } from "@/lib/email-heuristics";

const PHONE_RE = /^\(\d{2}\) \d{4,5}-\d{4}$/;
const CEP_RE = /^\d{5}-?\d{3}$/;

const schoolFormSchema = z.object({
  inep_code: z.string().nullable(),
  trade_name: z.string().min(3, "Nome muito curto").max(200),
  uf: z.string().length(2),
  city: z.string().min(2),
  cep: z.string().regex(CEP_RE, "CEP inválido"),
  address: z.string().min(5, "Logradouro muito curto"),
  number: z.string().min(1, "Obrigatório").max(10),
  complement: z.string().max(80).optional().or(z.literal("")),
  neighborhood: z.string().min(2, "Obrigatório"),
  phone: z.string().regex(PHONE_RE, "Telefone inválido"),
  email: z.string().email("Email inválido"),
  manually_added: z.boolean(),
});

export type CadastroEscolaForm = z.infer<typeof schoolFormSchema>;

export default function CadastrarEscolaPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<CadastroEscolaForm>({
    resolver: zodResolver(schoolFormSchema),
    defaultValues: {
      inep_code: null,
      trade_name: "",
      uf: profile?.state ?? "MT",
      city: profile?.city ?? "",
      cep: "",
      address: "",
      number: "",
      complement: "",
      neighborhood: "",
      phone: "",
      email: "",
      manually_added: false,
    },
  });

  const tradeName = form.watch("trade_name");
  const escolaCity = form.watch("city");
  const escolaUf = form.watch("uf");
  const isManual = form.watch("manually_added");
  const inepCode = form.watch("inep_code");

  const applyInepResult = (r: InepSearchResult) => {
    form.setValue("inep_code", r.inep_code, { shouldDirty: true });
    form.setValue("trade_name", r.trade_name, { shouldDirty: true });
    form.setValue("uf", r.uf, { shouldDirty: true });
    form.setValue("city", r.city, { shouldDirty: true });
    form.setValue("manually_added", false, { shouldDirty: true });
    if (r.cep) form.setValue("cep", r.cep, { shouldDirty: true });
    if (r.address) form.setValue("address", r.address, { shouldDirty: true });
  };

  const applyManualResult = (p: ManualSchoolPayload) => {
    form.setValue("inep_code", null, { shouldDirty: true });
    form.setValue("trade_name", p.trade_name, { shouldDirty: true });
    form.setValue("uf", p.uf, { shouldDirty: true });
    form.setValue("city", p.city, { shouldDirty: true });
    form.setValue("manually_added", true, { shouldDirty: true });
  };

  const onSubmit = form.handleSubmit(async (values) => {
    if (!user) return;
    setSubmitting(true);
    try {
      const { data: school, error: schoolErr } = await supabase
        .from("schools")
        .insert({
          inep_code: values.inep_code,
          legal_name: values.trade_name, // refined by approval flow (LC-004)
          trade_name: values.trade_name,
          slug: "",                       // schools_auto_slug fills this in
          city: values.city,
          state: values.uf,
          cep: values.cep,
          address: [values.address, values.number, values.complement]
            .filter(Boolean)
            .join(", "),
          neighborhood: values.neighborhood,
          phone: values.phone,
          email: values.email,
          status: "pending_approval",
          created_by: user.id,
          manually_added: values.manually_added,
          email_likely_institutional: isLikelyInstitutionalEmail(values.email),
        })
        .select("id")
        .single();

      if (schoolErr) {
        if (schoolErr.code === "23505" && schoolErr.message.includes("inep_code")) {
          toast.error(
            "Essa escola já está cadastrada na plataforma. Para administrá-la em conjunto, entre em contato com o suporte.",
          );
        } else {
          console.error("[cadastro-escola] insert schools failed", {
            code: schoolErr.code,
            message: schoolErr.message,
          });
          toast.error("Não foi possível cadastrar agora. Tente em instantes.");
        }
        return;
      }

      if (!school?.id) {
        toast.error("Resposta inesperada do servidor. Tente de novo.");
        return;
      }

      const { error: linkErr } = await supabase
        .from("school_admins")
        .insert({ user_id: user.id, school_id: school.id, role: "admin" });

      if (linkErr) {
        // Per spec edge case 5: log but don't rollback. The school exists;
        // an admin can link the user manually after approval.
        console.error("[cadastro-escola] school_admins link failed", {
          school_id: school.id,
          message: linkErr.message,
        });
      }

      navigate("/escola/aguardando", { replace: true });
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <div className="min-h-screen bg-lc-surface flex flex-col">
      <header className="px-5 md:px-8 h-16 flex items-center justify-between border-b border-lc-border bg-lc-white">
        <Link to="/" aria-label="ListaCerta — início">
          <Logo size="sm" />
        </Link>
        <Link
          to="/minha-conta"
          className="inline-flex items-center gap-2 text-sm font-semibold text-lc-mid hover:text-lc-ink transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Minha conta
        </Link>
      </header>

      <main className="flex-1 mx-auto px-5 md:px-8 py-8 md:py-12 w-full max-w-[480px] md:max-w-[720px]">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-lc-ink">
          Cadastrar minha escola
        </h1>
        <p className="mt-2 text-sm text-lc-mid leading-relaxed">
          Após o cadastro, a escola fica pendente de aprovação. Você recebe um
          email assim que ela for aprovada.
        </p>

        <form onSubmit={onSubmit} className="mt-10 space-y-10">
          <section>
            <h2 className="text-base font-bold text-lc-ink">1. Buscar escola</h2>
            <div className="mt-4">
              <SchoolPickerSection
                defaultUf={profile?.state ?? "MT"}
                onInepSelect={applyInepResult}
                onManualConfirm={applyManualResult}
              />
            </div>
          </section>

          {tradeName && (
            <section className="rounded-2xl bg-lc-white border border-lc-border p-5">
              <h2 className="text-base font-bold text-lc-ink">2. Escola escolhida</h2>
              <div className="mt-3 flex items-start justify-between gap-4">
                <div>
                  <div className="text-base font-semibold text-lc-ink">{tradeName}</div>
                  <div className="text-sm text-lc-mid mt-0.5">
                    {escolaCity} · {escolaUf}
                  </div>
                  {inepCode && (
                    <div className="text-xs text-lc-mid mt-1">INEP {inepCode}</div>
                  )}
                </div>
                {isManual && (
                  <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full bg-lc-coral/10 text-lc-coral text-xs font-semibold">
                    Manual
                  </span>
                )}
              </div>
            </section>
          )}

          <section>
            <h2 className="text-base font-bold text-lc-ink">3. Endereço</h2>
            <div className="mt-4">
              <AddressForm form={form} expectedCity={escolaCity} />
            </div>
          </section>

          <section>
            <h2 className="text-base font-bold text-lc-ink">4. Contato institucional</h2>
            <div className="mt-4">
              <ContactFields form={form} />
            </div>
          </section>

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-12 rounded-xl bg-lc-blue text-white text-sm font-semibold inline-flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />}
            {submitting ? "Enviando..." : "Cadastrar escola"}
          </button>
        </form>
      </main>

      <Footer />
    </div>
  );
}
