// Phone + institutional email pair, used by the cadastro form. Field
// registration is delegated to the parent's react-hook-form instance so
// validation flows through the same Zod schema.

import type { UseFormReturn } from "react-hook-form";
import type { CadastroEscolaForm } from "@/pages/CadastrarEscolaPage";

const PHONE_MASK = (raw: string) => {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  if (d.length < 3) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

interface Props {
  form: UseFormReturn<CadastroEscolaForm>;
}

export function ContactFields({ form }: Props) {
  const { register, formState: { errors } } = form;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label htmlFor="phone" className="block text-xs font-semibold uppercase tracking-wider text-lc-mid">
          Telefone
        </label>
        <input
          id="phone"
          inputMode="tel"
          {...register("phone", {
            onChange: (e) => { e.target.value = PHONE_MASK(e.target.value); },
          })}
          placeholder="(65) 99999-9999"
          className="mt-1 w-full h-11 px-3 rounded-xl border border-lc-border bg-lc-white text-sm focus:outline-none focus:border-lc-blue focus:ring-2 focus:ring-lc-blue/20"
          aria-invalid={!!errors.phone}
        />
        {errors.phone && (
          <p className="mt-1 text-xs text-lc-coral">{errors.phone.message}</p>
        )}
      </div>
      <div>
        <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-lc-mid">
          Email de contato da escola (institucional)
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          {...register("email")}
          placeholder="contato@minhaescola.com.br"
          className="mt-1 w-full h-11 px-3 rounded-xl border border-lc-border bg-lc-white text-sm focus:outline-none focus:border-lc-blue focus:ring-2 focus:ring-lc-blue/20"
          aria-invalid={!!errors.email}
        />
        {errors.email && (
          <p className="mt-1 text-xs text-lc-coral">{errors.email.message}</p>
        )}
      </div>
    </div>
  );
}
