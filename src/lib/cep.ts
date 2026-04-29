// Wrapper around cep-promise with a 4s timeout. cep-promise fans out to
// multiple Brazilian CEP services in parallel; the first to respond wins.
// We add a hard timeout so a slow upstream never blocks the form forever.
//
// Returns null on any failure (timeout, invalid CEP, all upstreams down).
// Callers should fall back to manual entry on null.

import cepPromise from "cep-promise";

const TIMEOUT_MS = 4_000;

export interface CepLookup {
  cep: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

export async function lookupCep(cep: string): Promise<CepLookup | null> {
  const cleaned = cep.replace(/\D/g, "");
  if (cleaned.length !== 8) return null;

  const timeout = new Promise<null>((resolve) => {
    setTimeout(() => resolve(null), TIMEOUT_MS);
  });

  try {
    const result = await Promise.race([
      cepPromise(cleaned),
      timeout,
    ]);
    if (!result) return null;
    return {
      cep: result.cep,
      street: result.street ?? "",
      neighborhood: result.neighborhood ?? "",
      city: result.city ?? "",
      state: result.state ?? "",
    };
  } catch (err) {
    console.error("[cep] lookup failed", { cep: cleaned, message: (err as Error).message });
    return null;
  }
}
