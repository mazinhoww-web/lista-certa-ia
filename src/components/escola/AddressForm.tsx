// Address fields for the school cadastro page. Auto-fills from cep-promise on
// CEP blur; surfaces a soft (non-blocking) warning when the looked-up city
// disagrees with the school's city. Pure presentational: state lives in the
// parent react-hook-form instance.

import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { lookupCep } from "@/lib/cep";
import type { CadastroEscolaForm } from "@/pages/CadastrarEscolaPage";

interface Props {
  form: UseFormReturn<CadastroEscolaForm>;
  expectedCity: string | null;
}

const CEP_MASK = (raw: string) => {
  const d = raw.replace(/\D/g, "").slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
};

export function AddressForm({ form, expectedCity }: Props) {
  const { register, setValue, watch, formState: { errors } } = form;
  const [looking, setLooking] = useState(false);
  const cepValue = watch("cep");

  const onCepBlur = async () => {
    const value = (cepValue ?? "").replace(/\D/g, "");
    if (value.length !== 8) return;
    setLooking(true);
    const result = await lookupCep(value);
    setLooking(false);
    if (!result) return;

    setValue("address", result.street, { shouldDirty: true });
    setValue("neighborhood", result.neighborhood, { shouldDirty: true });

    // Soft city-divergence warning. Spec calls this out as an attention nudge,
    // not a blocker — schools sometimes register CEP from an annex address.
    if (
      expectedCity &&
      result.city &&
      result.city.localeCompare(expectedCity, "pt-BR", { sensitivity: "base" }) !== 0
    ) {
      toast.warning(
        `Atenção: o CEP é de ${result.city}, mas a escola está em ${expectedCity}. Confirme se é correto.`,
      );
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-6 gap-4">
      <div className="sm:col-span-2">
        <label htmlFor="cep" className="block text-xs font-semibold uppercase tracking-wider text-lc-mid">
          CEP
        </label>
        <input
          id="cep"
          inputMode="numeric"
          autoComplete="postal-code"
          {...register("cep", {
            onChange: (e) => {
              e.target.value = CEP_MASK(e.target.value);
            },
            onBlur: onCepBlur,
          })}
          placeholder="00000-000"
          className="mt-1 w-full h-11 px-3 rounded-xl border border-lc-border bg-lc-white text-sm focus:outline-none focus:border-lc-blue focus:ring-2 focus:ring-lc-blue/20"
          aria-invalid={!!errors.cep}
        />
        {looking && <p className="mt-1 text-xs text-lc-mid">Buscando endereço...</p>}
        {errors.cep && <p className="mt-1 text-xs text-lc-coral">{errors.cep.message}</p>}
      </div>

      <div className="sm:col-span-4">
        <label htmlFor="address" className="block text-xs font-semibold uppercase tracking-wider text-lc-mid">
          Logradouro
        </label>
        <input
          id="address"
          {...register("address")}
          placeholder="Rua, avenida..."
          className="mt-1 w-full h-11 px-3 rounded-xl border border-lc-border bg-lc-white text-sm focus:outline-none focus:border-lc-blue focus:ring-2 focus:ring-lc-blue/20"
          aria-invalid={!!errors.address}
        />
        {errors.address && <p className="mt-1 text-xs text-lc-coral">{errors.address.message}</p>}
      </div>

      <div className="sm:col-span-2">
        <label htmlFor="number" className="block text-xs font-semibold uppercase tracking-wider text-lc-mid">
          Número
        </label>
        <input
          id="number"
          {...register("number")}
          inputMode="numeric"
          className="mt-1 w-full h-11 px-3 rounded-xl border border-lc-border bg-lc-white text-sm focus:outline-none focus:border-lc-blue focus:ring-2 focus:ring-lc-blue/20"
          aria-invalid={!!errors.number}
        />
        {errors.number && <p className="mt-1 text-xs text-lc-coral">{errors.number.message}</p>}
      </div>

      <div className="sm:col-span-4">
        <label htmlFor="complement" className="block text-xs font-semibold uppercase tracking-wider text-lc-mid">
          Complemento <span className="font-normal text-lc-mid/70">(opcional)</span>
        </label>
        <input
          id="complement"
          {...register("complement")}
          className="mt-1 w-full h-11 px-3 rounded-xl border border-lc-border bg-lc-white text-sm focus:outline-none focus:border-lc-blue focus:ring-2 focus:ring-lc-blue/20"
        />
      </div>

      <div className="sm:col-span-6">
        <label htmlFor="neighborhood" className="block text-xs font-semibold uppercase tracking-wider text-lc-mid">
          Bairro
        </label>
        <input
          id="neighborhood"
          {...register("neighborhood")}
          className="mt-1 w-full h-11 px-3 rounded-xl border border-lc-border bg-lc-white text-sm focus:outline-none focus:border-lc-blue focus:ring-2 focus:ring-lc-blue/20"
          aria-invalid={!!errors.neighborhood}
        />
        {errors.neighborhood && <p className="mt-1 text-xs text-lc-coral">{errors.neighborhood.message}</p>}
      </div>
    </div>
  );
}
