// LC-002.5: gera novo convite de co-admin via RPC `create_admin_invite`.
// Mapeia códigos de erro do Postgres para strings pt-BR amigáveis para a UI.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface CreateAdminInviteResult {
  invite_id: string;
  token: string;
  expires_at: string;
}

function mapError(message: string): string {
  if (message.includes("ADMIN_LIMIT_REACHED")) {
    return "Esta escola atingiu o limite de 5 administradores.";
  }
  if (message.includes("NOT_AUTHORIZED")) {
    return "Você não tem permissão para criar convites nesta escola.";
  }
  return "Não foi possível gerar o convite agora. Tente novamente.";
}

export function useCreateAdminInvite(schoolId: string | undefined) {
  const qc = useQueryClient();
  return useMutation<CreateAdminInviteResult, Error, void>({
    mutationFn: async () => {
      if (!schoolId) throw new Error("schoolId required");
      const { data, error } = await supabase.rpc("create_admin_invite", {
        p_school_id: schoolId,
      });
      if (error) {
        console.error("[useCreateAdminInvite] rpc failed", {
          school_id: schoolId,
          code: error.code,
          message: error.message,
        });
        throw new Error(mapError(error.message));
      }
      const row = (data ?? [])[0];
      if (!row) throw new Error("Resposta inesperada do servidor.");
      return row as CreateAdminInviteResult;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["school-admins", schoolId] });
    },
  });
}
