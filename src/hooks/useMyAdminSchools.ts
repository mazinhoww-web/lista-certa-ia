// Filter on top of useMySchools that returns only schools where the
// current user is an `admin` (not editor) AND the school is `approved` —
// the eligibility set for publishing/managing material lists.
//
// Implemented as a thin filter so we don't fan out a second query: the
// useMySchools cache already covers everything we need.

import { useMemo } from "react";
import { useMySchools, type MySchoolLink } from "@/hooks/useMySchools";

export function useMyAdminSchools(): {
  data: MySchoolLink[];
  isLoading: boolean;
  error: unknown;
} {
  const { data, isLoading, error } = useMySchools();

  const filtered = useMemo(() => {
    return (data ?? []).filter(
      (link) => link.role === "admin" && link.school.status === "approved",
    );
  }, [data]);

  return { data: filtered, isLoading, error };
}
