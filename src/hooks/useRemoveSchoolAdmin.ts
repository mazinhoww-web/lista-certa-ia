// LC-002.5: remove um admin da escola via RPC `remove_school_admin` (soft
// delete). Self-removal permitido se há outros admins ativos —
// CANNOT_REMOVE_LAST_ADMIN mapeia para erro de UI.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface RemoveAdminVars {
  schoolId: string;
  targetUserId: string;
}

export type RemoveAdminErrorCode =
  | "CANNOT_REMOVE_LAST_ADMIN"
  | "NOT_AUTHORIZED"
  | "UNKNOWN";

export class RemoveAdminError extends Error {
  code: RemoveAdminErrorCode;
  constructor(code: RemoveAdminErrorCode, msg: string) {
    super(msg);
    this.code = code;
  }
}

function classify(message: string): RemoveAdminErrorCode {
  if (message.includes("CANNOT_REMOVE_LAST_ADMIN")) return "CANNOT_REMOVE_LAST_ADMIN";
  if (message.includes("NOT_AUTHORIZED")) return "NOT_AUTHORIZED";
  return "UNKNOWN";
}

export function humanizeRemoveError(code: RemoveAdminErrorCode): string {
  switch (code) {
    case "CANNOT_REMOVE_LAST_ADMIN":
      return "Não é possível remover o último administrador. Convide outro antes.";
    case "NOT_AUTHORIZED":
      return "Você não tem permissão para esta ação.";
    default:
      return "Não foi possível remover agora. Tente novamente.";
  }
}

export function useRemoveSchoolAdmin() {
  const qc = useQueryClient();
  return useMutation<void, RemoveAdminError, RemoveAdminVars>({
    mutationFn: async ({ schoolId, targetUserId }) => {
      const { error } = await supabase.rpc("remove_school_admin", {
        p_school_id: schoolId,
        p_target_user_id: targetUserId,
      });
      if (error) {
        const code = classify(error.message);
        console.error("[useRemoveSchoolAdmin] rpc failed", {
          school_id: schoolId,
          target_user_id: targetUserId,
          code: error.code,
          message: error.message,
          classified: code,
        });
        throw new RemoveAdminError(code, error.message);
      }
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["school-admins", vars.schoolId] });
      qc.invalidateQueries({ queryKey: ["my-schools"] });
    },
  });
}
