// LC-002.5: aceita convite de co-admin via RPC `redeem_admin_invite`.
//
// Códigos de erro mapeados para pt-BR. O caso `idempotent: true` (caller
// já é admin ativo da escola) NÃO é tratado como erro — retornamos
// normalmente e a UI redireciona para `/escola/:id/status` mostrando um
// toast informativo.

import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface RedeemResult {
  school_id: string;
  idempotent: boolean;
}

export type RedeemErrorCode =
  | "INVITE_NOT_FOUND"
  | "INVITE_REVOKED"
  | "INVITE_ALREADY_REDEEMED"
  | "INVITE_EXPIRED"
  | "ADMIN_LIMIT_REACHED"
  | "NOT_AUTHORIZED"
  | "UNKNOWN";

export class RedeemError extends Error {
  code: RedeemErrorCode;
  constructor(code: RedeemErrorCode, msg: string) {
    super(msg);
    this.code = code;
  }
}

function classify(message: string): RedeemErrorCode {
  if (message.includes("INVITE_NOT_FOUND")) return "INVITE_NOT_FOUND";
  if (message.includes("INVITE_REVOKED")) return "INVITE_REVOKED";
  if (message.includes("INVITE_ALREADY_REDEEMED")) return "INVITE_ALREADY_REDEEMED";
  if (message.includes("INVITE_EXPIRED")) return "INVITE_EXPIRED";
  if (message.includes("ADMIN_LIMIT_REACHED")) return "ADMIN_LIMIT_REACHED";
  if (message.includes("NOT_AUTHORIZED")) return "NOT_AUTHORIZED";
  return "UNKNOWN";
}

export function humanizeRedeemError(code: RedeemErrorCode): string {
  switch (code) {
    case "INVITE_NOT_FOUND":
      return "Convite inválido.";
    case "INVITE_EXPIRED":
      return "Este convite expirou. Peça um novo.";
    case "INVITE_ALREADY_REDEEMED":
      return "Este convite já foi utilizado.";
    case "INVITE_REVOKED":
      return "Este convite foi revogado.";
    case "ADMIN_LIMIT_REACHED":
      return "Esta escola atingiu o limite de 5 administradores.";
    case "NOT_AUTHORIZED":
      return "Você precisa estar logado para aceitar este convite.";
    default:
      return "Não foi possível aceitar o convite agora. Tente novamente.";
  }
}

export function useRedeemAdminInvite() {
  return useMutation<RedeemResult, RedeemError, string>({
    mutationFn: async (token: string) => {
      const { data, error } = await supabase.rpc("redeem_admin_invite", {
        p_token: token,
      });
      if (error) {
        const code = classify(error.message);
        console.error("[useRedeemAdminInvite] rpc failed", {
          code: error.code,
          message: error.message,
          classified: code,
        });
        throw new RedeemError(code, error.message);
      }
      const row = (data ?? [])[0];
      if (!row) {
        throw new RedeemError("UNKNOWN", "Resposta inesperada do servidor.");
      }
      return row as RedeemResult;
    },
  });
}
