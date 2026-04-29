// Thin wrapper around useAuth that exposes whether the current profile has
// the platform_admin role. Used by AdminGuard and conditional CTAs.

import { useAuth } from "@/contexts/AuthContext";

export function useIsPlatformAdmin(): {
  isPlatformAdmin: boolean;
  isLoading: boolean;
} {
  const { role, loading } = useAuth();
  return {
    isPlatformAdmin: role === "platform_admin",
    isLoading: loading,
  };
}
