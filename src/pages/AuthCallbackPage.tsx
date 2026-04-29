import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

const POST_LOGIN_KEY = "lc_post_login_redirect";
const PROFILE_RETRY_MAX = 5;
const PROFILE_RETRY_DELAY_MS = 500;
const SESSION_TIMEOUT_MS = 8000;

export default function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    let completed = false;

    async function profileReady(userId: string): Promise<boolean> {
      // The on_auth_user_created trigger inserts the row asynchronously after
      // auth.users insert; allow up to ~2.5s for it to arrive.
      for (let attempt = 1; attempt <= PROFILE_RETRY_MAX; attempt++) {
        const { data, error } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", userId)
          .maybeSingle();
        if (data && !error) return true;
        if (attempt < PROFILE_RETRY_MAX) {
          await new Promise((r) => setTimeout(r, PROFILE_RETRY_DELAY_MS));
        }
      }
      return false;
    }

    async function complete(userId: string) {
      if (completed) return;
      completed = true;

      const ok = await profileReady(userId);
      if (!mounted) return;

      if (!ok) {
        // Log id only, never tokens.
        console.warn("[auth-callback] profile not ready after retries", { user_id: userId });
        toast.error("Não conseguimos completar seu login. Tente novamente em instantes.");
        navigate("/login", { replace: true });
        return;
      }

      const target = sessionStorage.getItem(POST_LOGIN_KEY) ?? "/minha-conta";
      sessionStorage.removeItem(POST_LOGIN_KEY);
      navigate(target, { replace: true });
    }

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      // INITIAL_SESSION fires once on subscribe with the URL-detected session.
      // SIGNED_IN fires when supabase finishes processing the auth callback.
      if ((event === "INITIAL_SESSION" || event === "SIGNED_IN") && session?.user) {
        void complete(session.user.id);
      }
    });

    const timeoutId = window.setTimeout(() => {
      if (!mounted || completed) return;
      void supabase.auth.getSession().then(({ data: { session } }) => {
        if (!mounted || completed) return;
        if (!session) {
          toast.error("Não conseguimos completar seu login. Tente novamente em instantes.");
          navigate("/login", { replace: true });
        }
      });
    }, SESSION_TIMEOUT_MS);

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
      window.clearTimeout(timeoutId);
    };
  }, [navigate]);

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-lc-surface"
      role="status"
      aria-live="polite"
    >
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-lc-blue animate-spin mx-auto" aria-hidden />
        <p className="mt-6 text-sm text-lc-mid">Quase lá...</p>
      </div>
    </div>
  );
}
