// Wraps the register_student RPC. The RPC validates input, creates the
// row + parental consent stamp, optionally auto-links a published list,
// and writes a 'create' entry to students_access_log — all atomically.
//
// The mutation returns the new student id + (auto) list_id +
// requires_list_selection so the UI can either redirect immediately to
// the student's list view or to ListSelectionPrompt.

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface RegisterStudentVars {
  firstName: string;
  schoolId: string;
  grade: string;
  teacherName: string | null;
  consentVersion: string;
}

export interface RegisterStudentResult {
  id: string;
  list_id: string | null;
  requires_list_selection: boolean;
}

export function useRegisterStudent() {
  const qc = useQueryClient();
  return useMutation<RegisterStudentResult, Error, RegisterStudentVars>({
    mutationFn: async (vars) => {
      const { data, error } = await supabase.rpc("register_student", {
        p_first_name: vars.firstName,
        p_school_id: vars.schoolId,
        p_grade: vars.grade,
        p_teacher_name: vars.teacherName,
        p_consent_version: vars.consentVersion,
      });
      if (error) {
        // PII safety: never log first_name.
        console.error("[useRegisterStudent] rpc failed", {
          school_id: vars.schoolId,
          code: error.code,
          message: error.message,
        });
        throw error;
      }
      const row = Array.isArray(data) ? data[0] : (data as RegisterStudentResult | null);
      if (!row?.id) {
        throw new Error("register_student returned no row");
      }
      return row as RegisterStudentResult;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-students"] });
    },
  });
}
